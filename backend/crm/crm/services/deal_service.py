"""
Deal Service - Business logic for Deal management.
"""
import logging
from typing import List, Dict, Any
from uuid import UUID
from decimal import Decimal
from datetime import date, timedelta

from django.db import transaction
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone

from ..models import Deal, DealStageHistory, Pipeline, PipelineStage, CRMAuditLog
from ..exceptions import InvalidOperationError, EntityNotFoundError
from .base_service import BaseService

logger = logging.getLogger(__name__)


class DealService(BaseService[Deal]):
    """Service for Deal operations."""
    
    model = Deal
    entity_type = 'deal'
    
    def list(
        self,
        filters: Dict[str, Any] = None,
        search: str = None,
        order_by: str = '-created_at',
        limit: int = None,
        offset: int = 0,
        owner_id: UUID = None,
        pipeline_id: UUID = None,
        stage_id: UUID = None,
        status: str = None,
        contact_id: UUID = None,
        company_id: UUID = None,
        tag_ids: List[UUID] = None,
        expected_close_from: date = None,
        expected_close_to: date = None,
    ):
        """List deals with advanced filtering."""
        qs = self.get_queryset()
        
        # Apply basic filters
        if filters:
            qs = qs.filter(**filters)
        
        if owner_id:
            qs = qs.filter(owner_id=owner_id)
        
        if pipeline_id:
            qs = qs.filter(pipeline_id=pipeline_id)
        
        if stage_id:
            qs = qs.filter(stage_id=stage_id)
        
        if status:
            qs = qs.filter(status=status)
        
        if contact_id:
            qs = qs.filter(contact_id=contact_id)
        
        if company_id:
            qs = qs.filter(company_id=company_id)
        
        if expected_close_from:
            qs = qs.filter(expected_close_date__gte=expected_close_from)
        
        if expected_close_to:
            qs = qs.filter(expected_close_date__lte=expected_close_to)
        
        if tag_ids:
            from ..models import EntityTag
            deal_ids = EntityTag.objects.filter(
                entity_type='deal',
                tag_id__in=tag_ids
            ).values_list('entity_id', flat=True)
            qs = qs.filter(id__in=deal_ids)
        
        # Apply search
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(contact__first_name__icontains=search) |
                Q(contact__last_name__icontains=search) |
                Q(company__name__icontains=search)
            )
        
        # Apply ordering
        qs = qs.order_by(order_by)
        
        # Apply pagination
        if limit:
            qs = qs[offset:offset + limit]
        
        return qs
    
    def get_kanban(self, pipeline_id: UUID) -> Dict:
        """Get deals organized by stage for Kanban view."""
        try:
            pipeline = Pipeline.objects.get(id=pipeline_id, org_id=self.org_id)
        except Pipeline.DoesNotExist:
            raise EntityNotFoundError('Pipeline', str(pipeline_id))
        
        stages = pipeline.stages.order_by('order')
        
        kanban = {
            'pipeline': {
                'id': str(pipeline.id),
                'name': pipeline.name,
                'currency': pipeline.currency,
            },
            'stages': []
        }
        
        for stage in stages:
            deals = list(
                Deal.objects.filter(
                    org_id=self.org_id,
                    pipeline=pipeline,
                    stage=stage,
                    status='open'
                ).order_by('stage_entered_at')
            )
            
            stage_value = sum(d.value for d in deals)
            
            kanban['stages'].append({
                'id': str(stage.id),
                'name': stage.name,
                'order': stage.order,
                'probability': stage.probability,
                'is_won': stage.is_won,
                'is_lost': stage.is_lost,
                'color': stage.color,
                'deal_count': len(deals),
                'total_value': str(stage_value),
                'deals': [
                    {
                        'id': str(d.id),
                        'name': d.name,
                        'value': str(d.value),
                        'contact_name': d.contact.full_name if d.contact else None,
                        'company_name': d.company.name if d.company else None,
                        'expected_close_date': d.expected_close_date.isoformat() if d.expected_close_date else None,
                        'owner_id': str(d.owner_id),
                        'days_in_stage': (timezone.now() - d.stage_entered_at).days,
                    }
                    for d in deals
                ]
            })
        
        return kanban
    
    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> Deal:
        """Create a new deal."""
        # Get pipeline and stage
        pipeline_id = data.get('pipeline_id')
        stage_id = data.get('stage_id')
        
        if not pipeline_id:
            # Use default pipeline
            pipeline = Pipeline.objects.filter(
                org_id=self.org_id,
                is_default=True,
                is_active=True
            ).first()
            
            if not pipeline:
                pipeline = Pipeline.objects.filter(
                    org_id=self.org_id,
                    is_active=True
                ).first()
            
            if not pipeline:
                raise InvalidOperationError('No active pipeline found. Create a pipeline first.')
            
            data['pipeline'] = pipeline
        else:
            try:
                data['pipeline'] = Pipeline.objects.get(id=pipeline_id, org_id=self.org_id)
            except Pipeline.DoesNotExist:
                raise EntityNotFoundError('Pipeline', str(pipeline_id))
        
        if not stage_id:
            # Use first stage
            data['stage'] = data['pipeline'].stages.order_by('order').first()
            if not data['stage']:
                raise InvalidOperationError('Pipeline has no stages. Create stages first.')
        else:
            try:
                data['stage'] = PipelineStage.objects.get(
                    id=stage_id,
                    pipeline=data['pipeline']
                )
            except PipelineStage.DoesNotExist:
                raise EntityNotFoundError('PipelineStage', str(stage_id))
        
        # Remove ID fields (we've set the objects directly)
        data.pop('pipeline_id', None)
        data.pop('stage_id', None)
        
        # Set stage entered time
        data['stage_entered_at'] = timezone.now()
        
        return super().create(data, **kwargs)
    
    @transaction.atomic
    def move_stage(self, deal_id: UUID, stage_id: UUID) -> Deal:
        """Move a deal to a different stage."""
        deal = self.get_by_id(deal_id)
        
        if deal.status != Deal.Status.OPEN:
            raise InvalidOperationError('Cannot move closed deal')
        
        try:
            new_stage = PipelineStage.objects.get(
                id=stage_id,
                pipeline=deal.pipeline
            )
        except PipelineStage.DoesNotExist:
            raise EntityNotFoundError('PipelineStage', str(stage_id))
        
        if new_stage.id == deal.stage_id:
            return deal  # No change
        
        old_stage = deal.stage
        
        # Calculate time in old stage
        time_in_stage = (timezone.now() - deal.stage_entered_at).total_seconds()
        
        # Create history record
        DealStageHistory.objects.create(
            deal=deal,
            from_stage=old_stage,
            to_stage=new_stage,
            changed_by=self.user_id,
            time_in_stage_seconds=int(time_in_stage),
        )
        
        # Update deal
        deal.move_to_stage(new_stage)
        deal.save()
        
        # Log stage change
        self._log_action(
            action=CRMAuditLog.Action.STAGE_CHANGE,
            entity=deal,
            changes={
                'from_stage': {'id': str(old_stage.id), 'name': old_stage.name},
                'to_stage': {'id': str(new_stage.id), 'name': new_stage.name},
            }
        )
        
        return deal
    
    @transaction.atomic
    def win(self, deal_id: UUID, actual_close_date: date = None) -> Deal:
        """Mark a deal as won."""
        deal = self.get_by_id(deal_id)
        
        if deal.status != Deal.Status.OPEN:
            raise InvalidOperationError('Deal is already closed')
        
        # Find won stage
        won_stage = deal.pipeline.stages.filter(is_won=True).first()
        if not won_stage:
            raise InvalidOperationError('Pipeline has no "won" stage')
        
        # Move to won stage
        old_stage = deal.stage
        time_in_stage = (timezone.now() - deal.stage_entered_at).total_seconds()
        
        DealStageHistory.objects.create(
            deal=deal,
            from_stage=old_stage,
            to_stage=won_stage,
            changed_by=self.user_id,
            time_in_stage_seconds=int(time_in_stage),
        )
        
        deal.stage = won_stage
        deal.status = Deal.Status.WON
        deal.actual_close_date = actual_close_date or date.today()
        deal.stage_entered_at = timezone.now()
        deal.save()
        
        self._log_action(
            action=CRMAuditLog.Action.UPDATE,
            entity=deal,
            changes={'status': {'old': 'open', 'new': 'won'}}
        )
        
        return deal
    
    @transaction.atomic
    def lose(
        self,
        deal_id: UUID,
        loss_reason: str,
        loss_notes: str = None,
        actual_close_date: date = None,
    ) -> Deal:
        """Mark a deal as lost."""
        deal = self.get_by_id(deal_id)
        
        if deal.status != Deal.Status.OPEN:
            raise InvalidOperationError('Deal is already closed')
        
        # Find lost stage
        lost_stage = deal.pipeline.stages.filter(is_lost=True).first()
        if not lost_stage:
            raise InvalidOperationError('Pipeline has no "lost" stage')
        
        # Move to lost stage
        old_stage = deal.stage
        time_in_stage = (timezone.now() - deal.stage_entered_at).total_seconds()
        
        DealStageHistory.objects.create(
            deal=deal,
            from_stage=old_stage,
            to_stage=lost_stage,
            changed_by=self.user_id,
            time_in_stage_seconds=int(time_in_stage),
        )
        
        deal.stage = lost_stage
        deal.status = Deal.Status.LOST
        deal.loss_reason = loss_reason
        deal.loss_notes = loss_notes
        deal.actual_close_date = actual_close_date or date.today()
        deal.stage_entered_at = timezone.now()
        deal.save()
        
        self._log_action(
            action=CRMAuditLog.Action.UPDATE,
            entity=deal,
            changes={
                'status': {'old': 'open', 'new': 'lost'},
                'loss_reason': loss_reason,
            }
        )
        
        return deal
    
    @transaction.atomic
    def reopen(self, deal_id: UUID, stage_id: UUID = None) -> Deal:
        """Reopen a closed deal."""
        deal = self.get_by_id(deal_id)
        
        if deal.status == Deal.Status.OPEN:
            raise InvalidOperationError('Deal is already open')
        
        # Determine stage to reopen to
        if stage_id:
            try:
                stage = PipelineStage.objects.get(
                    id=stage_id,
                    pipeline=deal.pipeline
                )
            except PipelineStage.DoesNotExist:
                raise EntityNotFoundError('PipelineStage', str(stage_id))
        else:
            # Use first non-terminal stage
            stage = deal.pipeline.stages.filter(
                is_won=False,
                is_lost=False
            ).order_by('order').first()
            
            if not stage:
                raise InvalidOperationError('No open stages in pipeline')
        
        old_stage = deal.stage
        
        DealStageHistory.objects.create(
            deal=deal,
            from_stage=old_stage,
            to_stage=stage,
            changed_by=self.user_id,
            time_in_stage_seconds=0,
        )
        
        deal.stage = stage
        deal.status = Deal.Status.OPEN
        deal.loss_reason = None
        deal.loss_notes = None
        deal.actual_close_date = None
        deal.stage_entered_at = timezone.now()
        deal.save()
        
        self._log_action(
            action=CRMAuditLog.Action.UPDATE,
            entity=deal,
            changes={'status': 'reopened'}
        )
        
        return deal
    
    def get_pipeline_stats(self, pipeline_id: UUID) -> Dict:
        """Get statistics for a pipeline."""
        try:
            pipeline = Pipeline.objects.get(id=pipeline_id, org_id=self.org_id)
        except Pipeline.DoesNotExist:
            raise EntityNotFoundError('Pipeline', str(pipeline_id))
        
        deals = Deal.objects.filter(org_id=self.org_id, pipeline=pipeline)
        
        open_deals = deals.filter(status='open')
        won_deals = deals.filter(status='won')
        lost_deals = deals.filter(status='lost')
        
        return {
            'pipeline_id': str(pipeline_id),
            'pipeline_name': pipeline.name,
            'total_deals': deals.count(),
            'open_deals': open_deals.count(),
            'won_deals': won_deals.count(),
            'lost_deals': lost_deals.count(),
            'open_value': open_deals.aggregate(Sum('value'))['value__sum'] or 0,
            'won_value': won_deals.aggregate(Sum('value'))['value__sum'] or 0,
            'lost_value': lost_deals.aggregate(Sum('value'))['value__sum'] or 0,
            'weighted_value': sum(d.weighted_value for d in open_deals),
            'win_rate': (
                won_deals.count() / (won_deals.count() + lost_deals.count()) * 100
                if (won_deals.count() + lost_deals.count()) > 0 else 0
            ),
            'avg_deal_value': open_deals.aggregate(Avg('value'))['value__avg'] or 0,
        }
    
    def get_forecast(self, days: int = 30) -> Dict:
        """Get deal forecast for upcoming period."""
        end_date = date.today() + timedelta(days=days)
        
        deals = self.get_queryset().filter(
            status='open',
            expected_close_date__lte=end_date,
            expected_close_date__gte=date.today(),
        )
        
        total_value = deals.aggregate(Sum('value'))['value__sum'] or 0
        weighted_value = sum(d.weighted_value for d in deals)
        
        return {
            'period_days': days,
            'deal_count': deals.count(),
            'total_value': total_value,
            'weighted_value': weighted_value,
            'deals': [
                {
                    'id': str(d.id),
                    'name': d.name,
                    'value': str(d.value),
                    'weighted_value': str(d.weighted_value),
                    'expected_close_date': d.expected_close_date.isoformat(),
                    'probability': d.probability or d.stage.probability,
                }
                for d in deals.order_by('expected_close_date')
            ]
        }
