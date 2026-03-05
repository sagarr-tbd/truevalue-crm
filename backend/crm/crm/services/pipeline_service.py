import logging
from typing import List, Dict, Any
from uuid import UUID

from django.db import transaction
from django.db.models import Count, Sum, Q, Prefetch
from django.db.models.functions import Coalesce
from django.conf import settings
from django.core.cache import cache
from decimal import Decimal

from ..models import Pipeline, PipelineStage, Deal
from ..exceptions import InvalidOperationError, EntityNotFoundError
from .base_service import BaseService

logger = logging.getLogger(__name__)

PIPELINE_CACHE_TIMEOUT = 300


class PipelineService(BaseService[Pipeline]):
    model = Pipeline
    entity_type = 'pipeline'
    billing_feature_code = 'pipelines'
    
    @staticmethod
    def _get_annotated_stages_prefetch():
        """
        Return a Prefetch object for pipeline stages with deal_count and deal_value
        annotations. Eliminates N+1 queries in PipelineStageSerializer.
        """
        annotated_qs = PipelineStage.objects.annotate(
            deal_count=Count('deals', filter=Q(deals__status='open')),
            deal_value=Coalesce(
                Sum('deals__value', filter=Q(deals__status='open')),
                Decimal('0'),
            ),
        ).order_by('order')
        return Prefetch('stages', queryset=annotated_qs)
    
    def _get_pipeline_list_cache_key(self, is_active: bool = None) -> str:
        """Generate cache key for pipeline list."""
        active_suffix = f"_active_{is_active}" if is_active is not None else ""
        return f"pipelines:org:{self.org_id}{active_suffix}"
    
    def _get_stages_cache_key(self, pipeline_id: UUID) -> str:
        """Generate cache key for pipeline stages."""
        return f"pipeline_stages:{pipeline_id}"
    
    def _invalidate_pipeline_cache(self, pipeline_id: UUID = None):
        cache.delete(self._get_pipeline_list_cache_key())
        cache.delete(self._get_pipeline_list_cache_key(is_active=True))
        cache.delete(self._get_pipeline_list_cache_key(is_active=False))
        if pipeline_id:
            cache.delete(self._get_stages_cache_key(pipeline_id))
    
    def list(
        self,
        filters: Dict[str, Any] = None,
        is_active: bool = None,
        order_by: str = 'order',
    ):
        use_cache = not filters and order_by == 'order'
        
        if use_cache:
            cache_key = self._get_pipeline_list_cache_key(is_active)
            cached = cache.get(cache_key)
            if cached is not None:
                return cached
        
        qs = self.get_queryset().prefetch_related(self._get_annotated_stages_prefetch())
        
        if filters:
            qs = qs.filter(**filters)
        
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        
        result = list(qs.order_by(order_by))
        
        if use_cache:
            cache.set(cache_key, result, PIPELINE_CACHE_TIMEOUT)
        
        return result
    
    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> Pipeline:
        self.check_plan_limit('pipelines')
        current_count = self.count()
        if current_count == 0:
            data['is_default'] = True
        
        pipeline = super().create(data, **kwargs)
        stages_data = data.pop('stages', None)
        
        if stages_data:
            for i, stage_data in enumerate(stages_data):
                stage_data['order'] = i + 1
                self.create_stage(pipeline.id, stage_data)
        else:
            default_stages = settings.CRM_SETTINGS.get('DEFAULT_PIPELINE_STAGES', [])
            for stage_data in default_stages:
                PipelineStage.objects.create(
                    pipeline=pipeline,
                    name=stage_data['name'],
                    probability=stage_data.get('probability', 0),
                    order=stage_data.get('order', 0),
                    is_won=stage_data.get('is_won', False),
                    is_lost=stage_data.get('is_lost', False),
                )
        
        self._invalidate_pipeline_cache(pipeline.id)
        self.sync_usage_to_billing('pipelines')
        
        return pipeline
    
    @transaction.atomic
    def update(self, entity_id: UUID, data: Dict[str, Any], **kwargs) -> Pipeline:
        pipeline = self.get_by_id(entity_id)
        
        if data.get('is_default') and not pipeline.is_default:
            Pipeline.objects.filter(
                org_id=self.org_id,
                is_default=True
            ).exclude(id=entity_id).update(is_default=False)
        
        result = super().update(entity_id, data, **kwargs)
        self._invalidate_pipeline_cache(entity_id)
        
        return result
    
    @transaction.atomic
    def delete(self, entity_id: UUID, **kwargs) -> bool:
        pipeline = self.get_by_id(entity_id)
        
        if Deal.objects.filter(pipeline=pipeline).exists():
            raise InvalidOperationError(
                'Cannot delete pipeline with existing deals. '
                'Move deals to another pipeline first.'
            )
        
        if pipeline.is_default:
            other_pipeline = Pipeline.objects.filter(
                org_id=self.org_id,
                is_active=True
            ).exclude(id=entity_id).first()
            
            if other_pipeline:
                other_pipeline.is_default = True
                other_pipeline.save(update_fields=['is_default'])
        
        result = super().delete(entity_id, **kwargs)
        self._invalidate_pipeline_cache(entity_id)
        
        return result
    
    def set_default(self, pipeline_id: UUID) -> Pipeline:
        """Set a pipeline as the default."""
        pipeline = self.get_by_id(pipeline_id)
        
        with transaction.atomic():
            Pipeline.objects.filter(
                org_id=self.org_id,
                is_default=True
            ).update(is_default=False)
            
            pipeline.is_default = True
            pipeline.save(update_fields=['is_default', 'updated_at'])
        
        self._invalidate_pipeline_cache()
        
        return pipeline
    
    def get_stages(self, pipeline_id: UUID) -> List[PipelineStage]:
        cache_key = self._get_stages_cache_key(pipeline_id)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        pipeline = self.get_by_id(pipeline_id)
        stages = list(
            PipelineStage.objects.filter(pipeline=pipeline)
            .annotate(
                deal_count=Count('deals', filter=Q(deals__status='open')),
                deal_value=Coalesce(
                    Sum('deals__value', filter=Q(deals__status='open')),
                    Decimal('0'),
                ),
            )
            .order_by('order')
        )
        
        cache.set(cache_key, stages, PIPELINE_CACHE_TIMEOUT)
        return stages
    
    @transaction.atomic
    def create_stage(self, pipeline_id: UUID, data: Dict[str, Any]) -> PipelineStage:
        pipeline = self.get_by_id(pipeline_id)
        
        data.pop('pipeline', None)
        data.pop('pipeline_id', None)
        
        if 'order' not in data:
            max_order = pipeline.stages.order_by('-order').values_list('order', flat=True).first() or 0
            data['order'] = max_order + 1
        
        if data.get('is_won'):
            if pipeline.stages.filter(is_won=True).exists():
                raise InvalidOperationError('Pipeline already has a "won" stage')
        
        if data.get('is_lost'):
            if pipeline.stages.filter(is_lost=True).exists():
                raise InvalidOperationError('Pipeline already has a "lost" stage')
        
        stage = PipelineStage.objects.create(
            pipeline=pipeline,
            **data
        )
        self._invalidate_pipeline_cache(pipeline_id)
        
        return stage
    
    @transaction.atomic
    def update_stage(self, stage_id: UUID, data: Dict[str, Any]) -> PipelineStage:
        try:
            stage = PipelineStage.objects.select_related('pipeline').get(id=stage_id)
        except PipelineStage.DoesNotExist:
            raise EntityNotFoundError('PipelineStage', str(stage_id))
        
        if stage.pipeline.org_id != self.org_id:
            raise EntityNotFoundError('PipelineStage', str(stage_id))
        
        data.pop('pipeline', None)
        data.pop('pipeline_id', None)
        
        if data.get('is_won') and not stage.is_won:
            if stage.pipeline.stages.filter(is_won=True).exclude(id=stage_id).exists():
                raise InvalidOperationError('Pipeline already has a "won" stage')
        
        if data.get('is_lost') and not stage.is_lost:
            if stage.pipeline.stages.filter(is_lost=True).exclude(id=stage_id).exists():
                raise InvalidOperationError('Pipeline already has a "lost" stage')
        
        for field, value in data.items():
            if hasattr(stage, field):
                setattr(stage, field, value)
        
        stage.save()
        self._invalidate_pipeline_cache(stage.pipeline_id)
        
        return stage
    
    @transaction.atomic
    def delete_stage(self, stage_id: UUID) -> bool:
        try:
            stage = PipelineStage.objects.select_related('pipeline').get(id=stage_id)
        except PipelineStage.DoesNotExist:
            raise EntityNotFoundError('PipelineStage', str(stage_id))
        
        if stage.pipeline.org_id != self.org_id:
            raise EntityNotFoundError('PipelineStage', str(stage_id))
        
        if Deal.objects.filter(stage=stage).exists():
            raise InvalidOperationError(
                'Cannot delete stage with existing deals. '
                'Move deals to another stage first.'
            )
        
        pipeline_id = stage.pipeline_id
        stage.delete()
        self._invalidate_pipeline_cache(pipeline_id)
        
        return True
    
    @transaction.atomic
    def reorder_stages(self, pipeline_id: UUID, stage_order: List[UUID]) -> List[PipelineStage]:
        pipeline = self.get_by_id(pipeline_id)

        stages = {str(s.id): s for s in pipeline.stages.all()}

        updated = []
        for order, stage_id in enumerate(stage_order, start=1):
            stage = stages.get(str(stage_id))
            if stage:
                stage.order = order
                updated.append(stage)

        if updated:
            PipelineStage.objects.bulk_update(updated, ['order', 'updated_at'])

        self._invalidate_pipeline_cache(pipeline_id)

        return list(pipeline.stages.order_by('order'))
