"""
Pipeline Service - Business logic for Pipeline and Stage management.
"""
import logging
from typing import List, Dict, Any
from uuid import UUID

from django.db import transaction
from django.conf import settings

from ..models import Pipeline, PipelineStage, Deal
from ..exceptions import InvalidOperationError, LimitExceededError, EntityNotFoundError
from .base_service import BaseService

logger = logging.getLogger(__name__)


class PipelineService(BaseService[Pipeline]):
    """Service for Pipeline operations."""
    
    model = Pipeline
    entity_type = 'pipeline'
    
    def list(
        self,
        filters: Dict[str, Any] = None,
        is_active: bool = None,
        order_by: str = 'order',
    ):
        """List pipelines."""
        qs = self.get_queryset()
        
        if filters:
            qs = qs.filter(**filters)
        
        if is_active is not None:
            qs = qs.filter(is_active=is_active)
        
        return qs.order_by(order_by)
    
    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> Pipeline:
        """Create a new pipeline with default stages."""
        # Check plan limits
        current_count = self.count()
        limits = settings.CRM_SETTINGS.get('PIPELINE_LIMITS', {})
        limit = limits.get('free', 1)  # TODO: Get actual plan
        
        if limit > 0 and current_count >= limit:
            raise LimitExceededError('pipeline', limit, current_count)
        
        # Check if this is the first pipeline (make it default)
        if current_count == 0:
            data['is_default'] = True
        
        # Create pipeline
        pipeline = super().create(data, **kwargs)
        
        # Create default stages if no stages provided
        stages_data = data.pop('stages', None)
        
        if stages_data:
            for i, stage_data in enumerate(stages_data):
                stage_data['order'] = i + 1
                self.create_stage(pipeline.id, stage_data)
        else:
            # Use default stages
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
        
        return pipeline
    
    @transaction.atomic
    def update(self, entity_id: UUID, data: Dict[str, Any], **kwargs) -> Pipeline:
        """Update a pipeline."""
        pipeline = self.get_by_id(entity_id)
        
        # Handle is_default change
        if data.get('is_default') and not pipeline.is_default:
            # Clear other defaults
            Pipeline.objects.filter(
                org_id=self.org_id,
                is_default=True
            ).exclude(id=entity_id).update(is_default=False)
        
        return super().update(entity_id, data, **kwargs)
    
    @transaction.atomic
    def delete(self, entity_id: UUID, **kwargs) -> bool:
        """Delete a pipeline."""
        pipeline = self.get_by_id(entity_id)
        
        # Check if pipeline has deals
        if Deal.objects.filter(pipeline=pipeline).exists():
            raise InvalidOperationError(
                'Cannot delete pipeline with existing deals. '
                'Move deals to another pipeline first.'
            )
        
        # If deleting default, make another pipeline default
        if pipeline.is_default:
            other_pipeline = Pipeline.objects.filter(
                org_id=self.org_id,
                is_active=True
            ).exclude(id=entity_id).first()
            
            if other_pipeline:
                other_pipeline.is_default = True
                other_pipeline.save(update_fields=['is_default'])
        
        return super().delete(entity_id, **kwargs)
    
    def set_default(self, pipeline_id: UUID) -> Pipeline:
        """Set a pipeline as the default."""
        pipeline = self.get_by_id(pipeline_id)
        
        with transaction.atomic():
            # Clear other defaults
            Pipeline.objects.filter(
                org_id=self.org_id,
                is_default=True
            ).update(is_default=False)
            
            pipeline.is_default = True
            pipeline.save(update_fields=['is_default', 'updated_at'])
        
        return pipeline
    
    # Stage operations
    
    def get_stages(self, pipeline_id: UUID) -> List[PipelineStage]:
        """Get stages for a pipeline."""
        pipeline = self.get_by_id(pipeline_id)
        return list(pipeline.stages.order_by('order'))
    
    @transaction.atomic
    def create_stage(self, pipeline_id: UUID, data: Dict[str, Any]) -> PipelineStage:
        """Create a new stage in a pipeline."""
        pipeline = self.get_by_id(pipeline_id)
        
        # Auto-set order if not provided
        if 'order' not in data:
            max_order = pipeline.stages.order_by('-order').values_list('order', flat=True).first() or 0
            data['order'] = max_order + 1
        
        # Validate terminal stage flags
        if data.get('is_won'):
            # Only one won stage allowed
            if pipeline.stages.filter(is_won=True).exists():
                raise InvalidOperationError('Pipeline already has a "won" stage')
        
        if data.get('is_lost'):
            # Only one lost stage allowed
            if pipeline.stages.filter(is_lost=True).exists():
                raise InvalidOperationError('Pipeline already has a "lost" stage')
        
        stage = PipelineStage.objects.create(
            pipeline=pipeline,
            **data
        )
        
        return stage
    
    @transaction.atomic
    def update_stage(self, stage_id: UUID, data: Dict[str, Any]) -> PipelineStage:
        """Update a pipeline stage."""
        try:
            stage = PipelineStage.objects.get(id=stage_id)
        except PipelineStage.DoesNotExist:
            raise EntityNotFoundError('PipelineStage', str(stage_id))
        
        # Verify org ownership
        if stage.pipeline.org_id != self.org_id:
            raise EntityNotFoundError('PipelineStage', str(stage_id))
        
        # Validate terminal stage flags
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
        return stage
    
    @transaction.atomic
    def delete_stage(self, stage_id: UUID) -> bool:
        """Delete a pipeline stage."""
        try:
            stage = PipelineStage.objects.get(id=stage_id)
        except PipelineStage.DoesNotExist:
            raise EntityNotFoundError('PipelineStage', str(stage_id))
        
        # Verify org ownership
        if stage.pipeline.org_id != self.org_id:
            raise EntityNotFoundError('PipelineStage', str(stage_id))
        
        # Check if stage has deals
        if Deal.objects.filter(stage=stage).exists():
            raise InvalidOperationError(
                'Cannot delete stage with existing deals. '
                'Move deals to another stage first.'
            )
        
        stage.delete()
        return True
    
    @transaction.atomic
    def reorder_stages(self, pipeline_id: UUID, stage_order: List[UUID]) -> List[PipelineStage]:
        """Reorder stages in a pipeline."""
        pipeline = self.get_by_id(pipeline_id)
        
        stages = {str(s.id): s for s in pipeline.stages.all()}
        
        for order, stage_id in enumerate(stage_order, start=1):
            stage = stages.get(str(stage_id))
            if stage:
                stage.order = order
                stage.save(update_fields=['order', 'updated_at'])
        
        return list(pipeline.stages.order_by('order'))
