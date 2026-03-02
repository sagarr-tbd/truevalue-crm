"""
Deals V2 Views

Dynamic CRUD operations - ALL fields from FormDefinition.
Mirrors the Companies V2 / Contacts V2 / Leads V2 pattern adapted for deals.
"""

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


class DealV2Pagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class DealV2ViewSet(viewsets.ModelViewSet):
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
            deal = DealV2.objects.filter(
                id=pk, deleted_at__isnull=False
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

        deals = list(queryset[:10000])

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

        return Response({'sources': list(stages)})

    @action(detail=False, methods=['get'])
    def pipelines(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from crm.models import Pipeline
            pipelines = Pipeline.objects.filter(
                org_id=org_id, is_active=True
            ).order_by('order', 'name').values('id', 'name', 'is_default', 'currency')
            return Response({'pipelines': list(pipelines)})
        except Exception:
            return Response({'pipelines': []})

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
            update_fields.append('actual_close_date')
        elif new_status == 'lost':
            loss_reason = request.data.get('loss_reason')
            if loss_reason:
                deal.loss_reason = loss_reason
                update_fields.append('loss_reason')
            deal.actual_close_date = timezone.now().date()
            update_fields.append('actual_close_date')

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

        valid_stages = [choice[0] for choice in DealV2.Stage.choices]
        if new_stage not in valid_stages:
            return Response(
                {'error': f'Invalid stage. Must be one of: {", ".join(valid_stages)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deal.stage = new_stage
        deal.stage_entered_at = timezone.now()
        deal.save(update_fields=['stage', 'stage_entered_at', 'updated_at'])

        return Response(DealV2Serializer(deal).data)
