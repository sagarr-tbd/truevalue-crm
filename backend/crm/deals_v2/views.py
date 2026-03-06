from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from django.http import HttpResponse
import csv
import json
from uuid import UUID
from decimal import Decimal

from .models import DealV2
from .serializers import DealV2Serializer, DealV2ListSerializer
from crm_service.audit_v2 import AuditLogV2Mixin
from crm.permissions import CRMResourcePermission


class DealV2Pagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class DealV2ViewSet(AuditLogV2Mixin, viewsets.ModelViewSet):
    resource = 'deals'
    permission_classes = [CRMResourcePermission]
    audit_tracked_fields = ['status', 'stage', 'value', 'pipeline_id', 'owner_id', 'assigned_to_id']
    queryset = DealV2.objects.filter(deleted_at__isnull=True)
    serializer_class = DealV2Serializer
    pagination_class = DealV2Pagination

    def get_queryset(self):
        org_id = self.request.headers.get('X-Org-Id')
        if not org_id:
            return DealV2.objects.none()

        queryset = DealV2.objects.filter(
            org_id=org_id, deleted_at__isnull=True
        )

        search = self.request.query_params.get('search')
        if search:
            from forms_v2.models import FormDefinition

            form = FormDefinition.objects.filter(
                org_id=org_id, entity_type='deal',
                form_type='create', is_default=True, is_active=True
            ).first()

            if form:
                searchable_fields = []
                for section in form.schema.get('sections', []):
                    for field in section.get('fields', []):
                        if field.get('is_searchable', True):
                            field_name = field.get('name')
                            field_type = field.get('field_type', '')
                            if field_type in ['text', 'textarea', 'email', 'phone', 'url']:
                                searchable_fields.append(field_name)

                if searchable_fields:
                    search_queries = Q()
                    for field_name in searchable_fields:
                        search_queries |= Q(**{f'entity_data__{field_name}__icontains': search})
                    queryset = queryset.filter(search_queries)
            else:
                queryset = queryset.filter(
                    Q(entity_data__name__icontains=search)
                )

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        stage_filter = self.request.query_params.get('stage')
        if stage_filter:
            queryset = queryset.filter(stage=stage_filter)

        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)

        owner_id = self.request.query_params.get('owner_id')
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)

        contact_id = self.request.query_params.get('contact_id')
        if contact_id:
            queryset = queryset.filter(contact_id=contact_id)

        company_id = self.request.query_params.get('company_id')
        if company_id:
            queryset = queryset.filter(company_id=company_id)

        pipeline_id = self.request.query_params.get('pipeline_id')
        if pipeline_id:
            queryset = queryset.filter(pipeline_id=pipeline_id)

        filters_param = self.request.query_params.get('filters')
        if filters_param:
            try:
                filter_data = json.loads(filters_param)
                conditions = filter_data.get('conditions', [])
                logic = filter_data.get('logic', 'and')

                if conditions:
                    queries = Q()
                    for condition in conditions:
                        field = condition.get('field')
                        operator = condition.get('operator')
                        value = condition.get('value')

                        if not field or not operator:
                            continue

                        db_columns = [
                            'status', 'stage', 'value', 'currency', 'probability',
                            'expected_close_date', 'actual_close_date', 'loss_reason',
                            'pipeline_id', 'assigned_to_id', 'contact_id', 'company_id',
                        ]
                        if field in db_columns:
                            field_path = field
                        else:
                            field_path = f'entity_data__{field}'

                        if operator == 'equals':
                            q = Q(**{field_path: value})
                        elif operator == 'not_equals':
                            q = ~Q(**{field_path: value})
                        elif operator == 'contains':
                            q = Q(**{f'{field_path}__icontains': value})
                        elif operator == 'starts_with':
                            q = Q(**{f'{field_path}__istartswith': value})
                        elif operator == 'ends_with':
                            q = Q(**{f'{field_path}__iendswith': value})
                        elif operator == 'is_empty':
                            q = Q(**{f'{field_path}__isnull': True}) | Q(**{field_path: ''})
                        elif operator == 'is_not_empty':
                            q = ~Q(**{f'{field_path}__isnull': True}) & ~Q(**{field_path: ''})
                        elif operator == 'greater_than':
                            q = Q(**{f'{field_path}__gt': value})
                        elif operator == 'less_than':
                            q = Q(**{f'{field_path}__lt': value})
                        else:
                            continue

                        if logic == 'and':
                            queries &= q
                        else:
                            queries |= q

                    queryset = queryset.filter(queries)
            except (json.JSONDecodeError, TypeError, ValueError):
                pass

        sort_by = self.request.query_params.get('sort_by', '-created_at')
        sort_direction = self.request.query_params.get('sort_direction', 'desc')

        allowed_sort_fields = {
            'created_at': 'created_at',
            'updated_at': 'updated_at',
            'status': 'status',
            'stage': 'stage',
            'value': 'value',
            'expected_close_date': 'expected_close_date',
            'name': 'entity_data__name',
        }

        if sort_by in allowed_sort_fields:
            field = allowed_sort_fields[sort_by]
            if sort_direction == 'desc':
                field = f'-{field}'
            queryset = queryset.order_by(field)
        else:
            queryset = queryset.order_by('-created_at')

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return DealV2ListSerializer
        return DealV2Serializer

    def perform_create(self, serializer):
        org_id = self.request.headers.get('X-Org-Id')
        user_id = self.request.user.id if hasattr(self.request, 'user') else None
        serializer.save(
            org_id=org_id,
            owner_id=user_id or org_id
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        deleted_by = request.user.id if hasattr(request, 'user') else None
        instance.soft_delete(deleted_by=deleted_by)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        try:
            org_id = request.headers.get('X-Org-Id')
            deal = DealV2.objects.filter(
                id=pk, org_id=org_id, deleted_at__isnull=False
            ).first()
            if not deal:
                return Response(
                    {'error': 'Deal not found or not deleted'},
                    status=status.HTTP_404_NOT_FOUND
                )
            deal.restore()
            serializer = self.get_serializer(deal)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response(
                {'error': 'X-Org-Id header required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = DealV2.objects.filter(org_id=org_id, deleted_at__isnull=True)
        total = queryset.count()
        by_status = dict(
            queryset.values_list('status').annotate(count=Count('id'))
        )
        by_stage = dict(
            queryset.values_list('stage').annotate(count=Count('id'))
        )

        open_deals = queryset.filter(status='open')
        total_value = open_deals.aggregate(total=Sum('value'))['total'] or Decimal('0')
        avg_value = open_deals.aggregate(avg=Avg('value'))['avg'] or Decimal('0')

        won_deals = queryset.filter(status='won')
        won_value = won_deals.aggregate(total=Sum('value'))['total'] or Decimal('0')

        return Response({
            'total': total,
            'by_status': by_status,
            'by_stage': by_stage,
            'pipeline_value': str(total_value),
            'average_deal_value': str(avg_value),
            'won_value': str(won_value),
        })

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response(
                {'error': 'X-Org-Id header required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deal_ids = request.data.get('ids', [])
        if not deal_ids:
            return Response(
                {'error': 'No deal IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted_by = request.user.id if hasattr(request, 'user') else None
        deals = DealV2.objects.filter(id__in=deal_ids, org_id=org_id, deleted_at__isnull=True)
        count = 0
        for deal in deals:
            deal.soft_delete(deleted_by=deleted_by)
            count += 1

        return Response({
            'message': f'{count} deals deleted successfully',
            'count': count
        })

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response(
                {'error': 'X-Org-Id header required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deal_ids = request.data.get('ids', [])
        data = request.data.get('data', {})

        if not deal_ids:
            return Response(
                {'error': 'No deal IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not data:
            return Response(
                {'error': 'No update data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        system_fields = [
            'status', 'stage', 'value', 'currency', 'probability',
            'expected_close_date', 'actual_close_date', 'loss_reason',
            'pipeline_id', 'assigned_to_id', 'contact_id', 'company_id',
        ]
        system_updates = {}
        entity_data_updates = data.get('entity_data', {})

        for field in system_fields:
            if field in data:
                system_updates[field] = data[field]

        deals = DealV2.objects.filter(
            id__in=deal_ids, org_id=org_id, deleted_at__isnull=True
        )
        count = 0
        for deal in deals:
            for field, value in system_updates.items():
                setattr(deal, field, value)
            if entity_data_updates:
                deal.entity_data.update(entity_data_updates)
            deal.save()
            count += 1

        return Response({
            'message': f'{count} deals updated successfully',
            'count': count
        })

    @action(detail=False, methods=['get'])
    def export(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response(
                {'error': 'X-Org-Id header required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset()

        ids_param = request.query_params.get('ids')
        if ids_param:
            try:
                ids = [UUID(id.strip()) for id in ids_param.split(',') if id.strip()]
                queryset = queryset.filter(id__in=ids)
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid deal IDs'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        EXPORT_MAX_ROWS = 50000
        deals = list(queryset[:EXPORT_MAX_ROWS])

        from forms_v2.models import FormDefinition
        form = FormDefinition.objects.filter(
            org_id=org_id, entity_type='deal',
            is_default=True, is_active=True
        ).first()

        if not form:
            return Response(
                {'error': 'No form definition found. Please configure deal form first.'},
                status=status.HTTP_404_NOT_FOUND
            )

        db_column_fields = {
            'status', 'stage', 'value', 'currency', 'probability',
            'expected_close_date', 'actual_close_date', 'loss_reason',
            'pipeline', 'assigned_to', 'contact', 'company',
        }

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="deals-{timezone.now().strftime("%Y-%m-%d")}.csv"'

        writer = csv.writer(response)
        headers = [
            'ID', 'Status', 'Stage', 'Value', 'Currency', 'Probability',
            'Expected Close', 'Actual Close', 'Loss Reason',
            'Created At', 'Updated At',
        ]
        field_names = []

        for section in form.schema.get('sections', []):
            for field in section.get('fields', []):
                if field['name'] not in db_column_fields:
                    headers.append(field['label'])
                    field_names.append(field['name'])

        writer.writerow(headers)

        for deal in deals:
            row = [
                str(deal.id),
                deal.status or '',
                deal.stage or '',
                str(deal.value),
                deal.currency or '',
                str(deal.probability) if deal.probability is not None else '',
                str(deal.expected_close_date) if deal.expected_close_date else '',
                str(deal.actual_close_date) if deal.actual_close_date else '',
                deal.loss_reason or '',
                deal.created_at.strftime('%Y-%m-%d %H:%M:%S') if deal.created_at else '',
                deal.updated_at.strftime('%Y-%m-%d %H:%M:%S') if deal.updated_at else '',
            ]
            for field_name in field_names:
                value = deal.entity_data.get(field_name, '')
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                row.append(str(value) if value is not None else '')
            writer.writerow(row)

        return response

    @action(detail=False, methods=['post'])
    def check_duplicate(self, request):
        org_id = request.headers.get('X-Org-Id')
        name = request.data.get('name', '')

        if not name:
            return Response(
                {'error': 'Name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        duplicates = DealV2.objects.filter(
            org_id=org_id,
            deleted_at__isnull=True
        ).filter(
            Q(entity_data__name__iexact=name)
        ).order_by('-created_at')

        serializer = DealV2ListSerializer(duplicates, many=True)

        return Response({
            'has_duplicates': duplicates.exists(),
            'count': duplicates.count(),
            'duplicates': serializer.data
        })

    @action(detail=False, methods=['get'])
    def sources(self, request):
        org_id = request.headers.get('X-Org-Id')
        stages = DealV2.objects.filter(
            org_id=org_id, deleted_at__isnull=True,
        ).values_list('stage', flat=True).distinct().order_by('stage')

        return Response({'sources': list(stages), 'stages': list(stages)})

    @action(detail=False, methods=['get'])
    def pipelines(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from pipelines_v2.models import PipelineV2
            pipelines = PipelineV2.objects.filter(
                org_id=org_id, is_active=True, deleted_at__isnull=True
            ).order_by('order', 'name').values('id', 'name', 'is_default', 'currency')
            return Response({'pipelines': list(pipelines)})
        except Exception:
            return Response({'pipelines': []})

    @action(detail=True, methods=['get'])
    def stage_history(self, request, pk=None):
        deal = self.get_object()
        from deals_v2.models import DealStageHistoryV2
        history = DealStageHistoryV2.objects.filter(deal=deal).order_by('-created_at')

        data = []
        for entry in history:
            data.append({
                'id': str(entry.id),
                'from_stage': entry.from_stage,
                'to_stage': entry.to_stage,
                'changed_by': str(entry.changed_by) if entry.changed_by else None,
                'time_in_stage_seconds': entry.time_in_stage_seconds,
                'created_at': entry.created_at.isoformat(),
            })

        return Response({'results': data})

    @action(detail=False, methods=['get'])
    def mine(self, request):
        user_id = request.user.id if hasattr(request, 'user') else None
        if not user_id:
            return Response(
                {'error': 'User ID not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(owner_id=user_id)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        deal = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = [choice[0] for choice in DealV2.Status.choices]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deal.status = new_status
        update_fields = ['status', 'updated_at']

        if new_status == 'won':
            deal.actual_close_date = timezone.now().date()
            deal.probability = 100
            update_fields.extend(['actual_close_date', 'probability'])
        elif new_status == 'lost':
            loss_reason = request.data.get('loss_reason')
            if loss_reason:
                deal.loss_reason = loss_reason
                update_fields.append('loss_reason')
            deal.actual_close_date = timezone.now().date()
            deal.probability = 0
            update_fields.extend(['actual_close_date', 'probability'])
        elif new_status == 'open':
            if deal.pipeline_id:
                try:
                    from pipelines_v2.models import PipelineStageV2
                    stage_obj = PipelineStageV2.objects.filter(
                        pipeline_id=deal.pipeline_id, name=deal.stage
                    ).first()
                    if stage_obj and stage_obj.probability is not None:
                        deal.probability = stage_obj.probability
                        update_fields.append('probability')
                except Exception:
                    pass

        deal.save(update_fields=update_fields)

        return Response(DealV2Serializer(deal).data)

    @action(detail=True, methods=['post'])
    def update_stage(self, request, pk=None):
        deal = self.get_object()
        new_stage = request.data.get('stage')

        if not new_stage:
            return Response(
                {'error': 'stage is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_stage) > 50:
            return Response(
                {'error': 'Invalid stage value'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deal.stage = new_stage
        deal.stage_entered_at = timezone.now()
        deal.save(update_fields=['stage', 'stage_entered_at', 'updated_at'])

        return Response(DealV2Serializer(deal).data)

    @action(detail=False, methods=['get'])
    def forecast(self, request):
        """
        Deal forecast for upcoming period.
        Query params: ?days=30&pipeline_id=<uuid>
        """
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            days = int(request.query_params.get('days', 30))
            days = max(1, min(days, 365))
        except (ValueError, TypeError):
            days = 30

        from datetime import date, timedelta

        end_date = date.today() + timedelta(days=days)
        deals_qs = DealV2.objects.filter(
            org_id=org_id,
            status='open',
            deleted_at__isnull=True,
            expected_close_date__gte=date.today(),
            expected_close_date__lte=end_date,
        ).order_by('expected_close_date')

        pipeline_id = request.query_params.get('pipeline_id')
        if pipeline_id:
            deals_qs = deals_qs.filter(pipeline_id=pipeline_id)

        from django.db.models import F
        from django.db.models.functions import Coalesce

        stats = deals_qs.aggregate(
            total_value=Coalesce(Sum('value'), Decimal('0')),
            weighted_value=Coalesce(
                Sum(F('value') * Coalesce(F('probability'), 0) / 100),
                Decimal('0')
            ),
        )

        deals_list = deals_qs.annotate(
            calc_probability=Coalesce(F('probability'), 0),
        )

        return Response({
            'period_days': days,
            'deal_count': deals_qs.count(),
            'total_value': str(stats['total_value']),
            'weighted_value': str(stats['weighted_value']),
            'deals': [
                {
                    'id': str(d.id),
                    'name': d.get_name(),
                    'value': str(d.value),
                    'probability': d.calc_probability,
                    'weighted_value': str(d.value * d.calc_probability / 100),
                    'expected_close_date': d.expected_close_date.isoformat(),
                    'stage': d.stage,
                    'pipeline_id': str(d.pipeline_id) if d.pipeline_id else None,
                }
                for d in deals_list
            ],
        })

    @action(detail=False, methods=['get'])
    def analysis(self, request):
        """
        Won/lost analysis: summary, monthly trend, loss reasons.
        Query params: ?days=90&pipeline_id=<uuid>
        """
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            days = int(request.query_params.get('days', 90))
            days = max(1, min(days, 365))
        except (ValueError, TypeError):
            days = 90

        from datetime import date, timedelta
        from django.db.models.functions import Coalesce, TruncMonth

        cutoff = date.today() - timedelta(days=days)
        base = DealV2.objects.filter(
            org_id=org_id,
            deleted_at__isnull=True,
            status__in=['won', 'lost'],
            actual_close_date__gte=cutoff,
        )

        pipeline_id = request.query_params.get('pipeline_id')
        if pipeline_id:
            base = base.filter(pipeline_id=pipeline_id)

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

        close_day_counts = []
        for d in base.filter(
            status='won', actual_close_date__isnull=False
        ).values_list('actual_close_date', 'created_at'):
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
            'won_value': str(agg['won_value']),
            'lost_value': str(agg['lost_value']),
            'win_rate': round(win_rate, 1),
            'avg_won_value': str(agg['avg_won_value']),
            'avg_lost_value': str(agg['avg_lost_value']),
            'avg_time_to_close_days': avg_time_to_close_days,
        }

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
                'won_value': str(t['won_value']),
                'lost_value': str(t['lost_value']),
            }
            for t in trend_qs
        ]

        loss_qs = (
            base.filter(status='lost')
            .exclude(loss_reason__isnull=True)
            .exclude(loss_reason='')
            .values('loss_reason')
            .annotate(count=Count('id'), value=Coalesce(Sum('value'), Decimal('0')))
            .order_by('-count')
        )
        loss_reasons = [
            {'reason': lr['loss_reason'], 'count': lr['count'], 'value': str(lr['value'])}
            for lr in loss_qs
        ]

        return Response({
            'summary': summary,
            'trend': trend,
            'loss_reasons': loss_reasons,
        })
