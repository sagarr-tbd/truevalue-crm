"""
Deal Service - Business logic for Deal management.
"""
import logging
from typing import List, Dict, Any
from uuid import UUID
from decimal import Decimal
from datetime import date, timedelta

from django.db import transaction
from django.db.models import Q, Sum, Count, Avg, F, ExpressionWrapper, fields as db_fields
from django.db.models.functions import TruncMonth, Coalesce
from django.utils import timezone

from ..models import Deal, DealStageHistory, Pipeline, PipelineStage, CRMAuditLog, Contact, Company
from ..exceptions import InvalidOperationError, EntityNotFoundError
from .base_service import BaseService, AdvancedFilterMixin

logger = logging.getLogger(__name__)


class DealService(AdvancedFilterMixin, BaseService[Deal]):
    """Service for Deal operations."""
    
    model = Deal
    entity_type = 'deal'
    billing_feature_code = 'deals'
    
    # Field mapping for advanced filters (frontend field -> backend field)
    # Inherits FILTER_OPERATOR_MAP and EXCLUDE_OPERATORS from AdvancedFilterMixin
    FILTER_FIELD_MAP = {
        'name': 'name',
        'dealName': 'name',
        'value': 'value',
        'status': 'status',
        'pipeline': 'pipeline__name',
        'pipeline_id': 'pipeline_id',
        'pipelineName': 'pipeline__name',
        'stage': 'stage__name',
        'stage_id': 'stage_id',
        'stageName': 'stage__name',
        'probability': 'probability',
        'contactName': ['contact__first_name', 'contact__last_name'],  # Compound field
        'contact': ['contact__first_name', 'contact__last_name'],
        'companyName': 'company__name',
        'company': 'company__name',
        'expectedCloseDate': 'expected_close_date',
        'expected_close_date': 'expected_close_date',
        'createdAt': 'created_at',
        'created_at': 'created_at',
        'currency': 'currency',
        'lossReason': 'loss_reason',
        'loss_reason': 'loss_reason',
    }
    
    # Fields that are UUIDs and need special handling (extends mixin's UUID_FIELDS)
    UUID_FIELDS = {'stage_id', 'pipeline_id', 'owner_id', 'contact_id', 'company_id'}
    
    # SECURITY: Whitelist of valid order_by fields
    VALID_ORDER_FIELDS = {
        'name', '-name', 
        'value', '-value', 
        'created_at', '-created_at',
        'updated_at', '-updated_at',
        'expected_close_date', '-expected_close_date',
        'status', '-status',
        'probability', '-probability',
        'stage_entered_at', '-stage_entered_at',
        'last_activity_at', '-last_activity_at',
        'actual_close_date', '-actual_close_date',
    }
    
    def _create_stage_history(self, deal, from_stage, to_stage, time_in_stage_seconds: int = 0):
        """Helper to create stage history record - reduces code duplication."""
        DealStageHistory.objects.create(
            deal=deal,
            from_stage=from_stage,
            to_stage=to_stage,
            changed_by=self.user_id,
            time_in_stage_seconds=time_in_stage_seconds,
        )
    
    def get_by_id(self, entity_id):
        """Get deal by ID with optimized queryset for detail serialization."""
        try:
            return self.get_queryset().select_related(
                'pipeline', 'stage', 'contact', 'company'
            ).prefetch_related('tags').annotate(
                activity_count=Count('activities', distinct=True),
            ).get(id=entity_id)
        except self.model.DoesNotExist:
            raise EntityNotFoundError(self.entity_type, str(entity_id))

    def get_optimized_queryset(self):
        """
        Get queryset with select_related and prefetch_related for performance.
        Prevents N+1 queries when serializing deals.
        """
        return self.get_queryset().select_related(
            'pipeline',
            'stage',
            'contact',
            'company'
        ).prefetch_related('tags')
    
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
        advanced_filters: List[Dict] = None,
        filter_logic: str = 'and',
    ):
        """List deals with advanced filtering."""
        # Use optimized queryset to prevent N+1 queries
        qs = self.get_optimized_queryset()
        
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
        
        # Apply advanced filters using mixin
        qs = self.apply_advanced_filters(qs, advanced_filters, filter_logic)
        
        # Apply ordering - SECURITY: Only allow whitelisted fields
        if order_by and order_by in self.VALID_ORDER_FIELDS:
            qs = qs.order_by(order_by)
        else:
            qs = qs.order_by('-created_at')  # Default safe ordering
        
        # Apply pagination
        if limit:
            qs = qs[offset:offset + limit]
        
        return qs
    
    def get_kanban(self, pipeline_id: UUID) -> Dict:
        """
        Get deals organized by stage for Kanban view.
        
        Optimized: Single query for all deals instead of N+1 queries per stage.
        """
        from collections import defaultdict
        
        try:
            pipeline = Pipeline.objects.prefetch_related('stages').get(
                id=pipeline_id, org_id=self.org_id
            )
        except Pipeline.DoesNotExist:
            raise EntityNotFoundError('Pipeline', str(pipeline_id))
        
        stages = list(pipeline.stages.order_by('order'))
        
        # Single query to fetch ALL deals for this pipeline with related data
        all_deals = list(
            Deal.objects.filter(
                org_id=self.org_id,
                pipeline=pipeline,
            ).select_related(
                'contact', 'company', 'stage'
            ).order_by('stage_entered_at')
        )
        
        # Group deals by stage_id in Python (O(n) instead of N+1 queries)
        deals_by_stage = defaultdict(list)
        for deal in all_deals:
            # Only include deals with correct status for their stage type
            expected_status = (
                'won' if deal.stage.is_won 
                else 'lost' if deal.stage.is_lost 
                else 'open'
            )
            if deal.status == expected_status:
                deals_by_stage[deal.stage_id].append(deal)
        
        kanban = {
            'pipeline': {
                'id': str(pipeline.id),
                'name': pipeline.name,
                'currency': pipeline.currency,
            },
            'stages': []
        }
        
        now = timezone.now()
        
        for stage in stages:
            stage_deals = deals_by_stage.get(stage.id, [])
            stage_value = sum(d.value for d in stage_deals)
            
            kanban['stages'].append({
                'id': str(stage.id),
                'name': stage.name,
                'order': stage.order,
                'probability': stage.probability,
                'is_won': stage.is_won,
                'is_lost': stage.is_lost,
                'color': stage.color,
                'deal_count': len(stage_deals),
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
                        'days_in_stage': (now - d.stage_entered_at).days,
                    }
                    for d in stage_deals
                ]
            })
        
        return kanban
    
    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> Deal:
        """Create a new deal."""
        # Check plan limits via billing service
        self.check_plan_limit('deals')
        
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
        
        # SECURITY: Validate contact belongs to same org
        contact_id = data.get('contact_id') or data.get('contact')
        if contact_id:
            if not Contact.objects.filter(id=contact_id, org_id=self.org_id).exists():
                raise InvalidOperationError('Contact does not belong to your organization')
        
        # SECURITY: Validate company belongs to same org
        company_id = data.get('company_id') or data.get('company')
        if company_id:
            if not Company.objects.filter(id=company_id, org_id=self.org_id).exists():
                raise InvalidOperationError('Company does not belong to your organization')
        
        # Remove ID fields (we've set the objects directly)
        data.pop('pipeline_id', None)
        data.pop('stage_id', None)
        
        # Set stage entered time
        data['stage_entered_at'] = timezone.now()
        
        deal = super().create(data, **kwargs)
        
        # Sync usage to billing
        self.sync_usage_to_billing('deals')
        
        return deal
    
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
        
        # Calculate time in old stage and create history record
        time_in_stage = (timezone.now() - deal.stage_entered_at).total_seconds()
        self._create_stage_history(deal, old_stage, new_stage, int(time_in_stage))
        
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
        self._create_stage_history(deal, old_stage, won_stage, int(time_in_stage))
        
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
        self._create_stage_history(deal, old_stage, lost_stage, int(time_in_stage))
        
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
        self._create_stage_history(deal, old_stage, stage, 0)
        
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
        """Get statistics for a pipeline using database-level aggregation."""
        from django.db.models import Case, When, F, DecimalField
        from django.db.models.functions import Coalesce
        
        try:
            pipeline = Pipeline.objects.get(id=pipeline_id, org_id=self.org_id)
        except Pipeline.DoesNotExist:
            raise EntityNotFoundError('Pipeline', str(pipeline_id))
        
        # Single aggregation query for all stats - prevents N+1 and multiple DB roundtrips
        stats = Deal.objects.filter(
            org_id=self.org_id, 
            pipeline=pipeline
        ).aggregate(
            total_deals=Count('id'),
            open_deals=Count('id', filter=Q(status='open')),
            won_deals=Count('id', filter=Q(status='won')),
            lost_deals=Count('id', filter=Q(status='lost')),
            open_value=Coalesce(Sum('value', filter=Q(status='open')), Decimal('0')),
            won_value=Coalesce(Sum('value', filter=Q(status='won')), Decimal('0')),
            lost_value=Coalesce(Sum('value', filter=Q(status='lost')), Decimal('0')),
            avg_deal_value=Coalesce(Avg('value', filter=Q(status='open')), Decimal('0')),
            # Weighted value: value * (probability / 100)
            weighted_value=Coalesce(
                Sum(
                    Case(
                        When(
                            status='open',
                            then=F('value') * Coalesce(F('probability'), F('stage__probability'), 0) / 100
                        ),
                        default=Decimal('0'),
                        output_field=DecimalField()
                    )
                ),
                Decimal('0')
            ),
        )
        
        # Calculate win rate
        closed_deals = stats['won_deals'] + stats['lost_deals']
        win_rate = (stats['won_deals'] / closed_deals * 100) if closed_deals > 0 else 0
        
        # Total value across all statuses
        total_value = stats['open_value'] + stats['won_value'] + stats['lost_value']
        avg_deal_size = (total_value / stats['total_deals']) if stats['total_deals'] > 0 else Decimal('0')
        
        # By-stage breakdown: include all stages even if 0 deals
        stages = PipelineStage.objects.filter(pipeline=pipeline).order_by('order')
        stage_stats = (
            Deal.objects.filter(org_id=self.org_id, pipeline=pipeline)
            .values('stage_id')
            .annotate(
                deal_count=Count('id'),
                deal_value=Coalesce(Sum('value'), Decimal('0')),
            )
        )
        stage_map = {str(s['stage_id']): s for s in stage_stats}
        
        by_stage = []
        for stage in stages:
            s = stage_map.get(str(stage.id), {})
            by_stage.append({
                'stage_id': str(stage.id),
                'stage_name': stage.name,
                'deal_count': s.get('deal_count', 0),
                'deal_value': s.get('deal_value', Decimal('0')),
            })
        
        return {
            'pipeline_id': str(pipeline_id),
            'pipeline_name': pipeline.name,
            'total_deals': stats['total_deals'],
            'open_deals': stats['open_deals'],
            'won_deals': stats['won_deals'],
            'lost_deals': stats['lost_deals'],
            'total_value': total_value,
            'open_value': stats['open_value'],
            'won_value': stats['won_value'],
            'lost_value': stats['lost_value'],
            'weighted_value': stats['weighted_value'],
            'win_rate': win_rate,
            'avg_deal_size': avg_deal_size,
            'avg_deal_value': stats['avg_deal_value'],
            'avg_time_to_close': 0,
            'by_stage': by_stage,
        }
    
    def get_forecast(self, days: int = 30) -> Dict:
        """Get deal forecast for upcoming period using database-level aggregation."""
        from django.db.models import Case, When, F, DecimalField
        from django.db.models.functions import Coalesce
        
        end_date = date.today() + timedelta(days=days)
        
        deals_qs = self.get_queryset().filter(
            status='open',
            expected_close_date__lte=end_date,
            expected_close_date__gte=date.today(),
        ).select_related('stage').order_by('expected_close_date')
        
        # Aggregate totals in single query
        stats = deals_qs.aggregate(
            total_value=Coalesce(Sum('value'), Decimal('0')),
            weighted_value=Coalesce(
                Sum(
                    F('value') * Coalesce(F('probability'), F('stage__probability'), 0) / 100,
                    output_field=DecimalField()
                ),
                Decimal('0')
            ),
        )
        
        # Annotate deals with calculated weighted_value for display
        deals_list = deals_qs.annotate(
            calc_probability=Coalesce(F('probability'), F('stage__probability'), 0),
            calc_weighted_value=F('value') * Coalesce(F('probability'), F('stage__probability'), 0) / 100
        )
        
        return {
            'period_days': days,
            'deal_count': deals_qs.count(),
            'total_value': stats['total_value'],
            'weighted_value': stats['weighted_value'],
            'deals': [
                {
                    'id': str(d.id),
                    'name': d.name,
                    'value': str(d.value),
                    'weighted_value': str(d.calc_weighted_value),
                    'expected_close_date': d.expected_close_date.isoformat(),
                    'probability': d.calc_probability,
                }
                for d in deals_list
            ]
        }
    
    def get_analysis(self, days: int = 90, pipeline_id: UUID = None) -> Dict:
        """Won/lost analysis: summary, monthly trend, and loss-reason breakdown."""
        from decimal import Decimal

        cutoff = date.today() - timedelta(days=days)
        base = Deal.objects.filter(
            org_id=self.org_id,
            status__in=['won', 'lost'],
            actual_close_date__gte=cutoff,
        )
        if pipeline_id:
            base = base.filter(pipeline_id=pipeline_id)

        # -- summary --
        agg = base.aggregate(
            total_won=Count('id', filter=Q(status='won')),
            total_lost=Count('id', filter=Q(status='lost')),
            won_value=Coalesce(Sum('value', filter=Q(status='won')), Decimal('0')),
            lost_value=Coalesce(Sum('value', filter=Q(status='lost')), Decimal('0')),
            avg_won_value=Coalesce(Avg('value', filter=Q(status='won')), Decimal('0')),
            avg_lost_value=Coalesce(Avg('value', filter=Q(status='lost')), Decimal('0')),
        )

        closed = agg['total_won'] + agg['total_lost']
        win_rate = (agg['total_won'] / closed * 100) if closed > 0 else 0

        # avg time to close for won deals (actual_close_date - created_at)
        won_deals = base.filter(status='won', actual_close_date__isnull=False).annotate(
            close_days=ExpressionWrapper(
                F('actual_close_date') - F('created_at__date'),
                output_field=db_fields.DurationField(),
            )
        )
        # DurationField math on DateField isn't fully portable; fall back to Python
        close_day_counts = []
        for d in base.filter(status='won', actual_close_date__isnull=False).values_list(
            'actual_close_date', 'created_at'
        ):
            delta = (d[0] - d[1].date()).days
            if delta >= 0:
                close_day_counts.append(delta)
        avg_time_to_close_days = (
            round(sum(close_day_counts) / len(close_day_counts), 1)
            if close_day_counts else 0
        )

        summary = {
            'total_won': agg['total_won'],
            'total_lost': agg['total_lost'],
            'won_value': agg['won_value'],
            'lost_value': agg['lost_value'],
            'win_rate': round(win_rate, 1),
            'avg_won_value': agg['avg_won_value'],
            'avg_lost_value': agg['avg_lost_value'],
            'avg_time_to_close_days': avg_time_to_close_days,
        }

        # -- trend (grouped by month) --
        trend_qs = (
            base.annotate(period=TruncMonth('actual_close_date'))
            .values('period')
            .annotate(
                won=Count('id', filter=Q(status='won')),
                lost=Count('id', filter=Q(status='lost')),
                won_value=Coalesce(Sum('value', filter=Q(status='won')), Decimal('0')),
                lost_value=Coalesce(Sum('value', filter=Q(status='lost')), Decimal('0')),
            )
            .order_by('period')
        )
        trend = [
            {
                'period': t['period'].strftime('%Y-%m'),
                'won': t['won'],
                'lost': t['lost'],
                'won_value': t['won_value'],
                'lost_value': t['lost_value'],
            }
            for t in trend_qs
        ]

        # -- loss reasons --
        loss_qs = (
            base.filter(status='lost')
            .exclude(loss_reason__isnull=True)
            .exclude(loss_reason='')
            .values('loss_reason')
            .annotate(
                count=Count('id'),
                value=Coalesce(Sum('value'), Decimal('0')),
            )
            .order_by('-count')
        )
        loss_reasons = [
            {'reason': lr['loss_reason'], 'count': lr['count'], 'value': lr['value']}
            for lr in loss_qs
        ]

        return {
            'summary': summary,
            'trend': trend,
            'loss_reasons': loss_reasons,
        }

    @transaction.atomic
    def bulk_delete(self, ids: List[UUID]) -> Dict[str, Any]:
        """Delete multiple deals by IDs."""
        result = {
            'total': len(ids),
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        for deal_id in ids:
            try:
                self.delete(deal_id)
                result['success'] += 1
            except EntityNotFoundError:
                result['failed'] += 1
                result['errors'].append({
                    'id': str(deal_id),
                    'error': f'Deal {deal_id} not found'
                })
            except Exception as e:
                result['failed'] += 1
                result['errors'].append({
                    'id': str(deal_id),
                    'error': str(e)
                })
        
        return result
