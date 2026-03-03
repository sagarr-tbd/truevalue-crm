"""
Companies V2 Views

Dynamic CRUD operations - ALL fields from FormDefinition.
Mirrors the Contacts V2 / Leads V2 pattern adapted for companies.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Sum, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.http import HttpResponse
import csv
import json
from uuid import UUID

from .models import CompanyV2
from .serializers import CompanyV2Serializer, CompanyV2ListSerializer
from crm_service.audit_v2 import AuditLogV2Mixin


class CompanyV2Pagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class CompanyV2ViewSet(AuditLogV2Mixin, viewsets.ModelViewSet):
    audit_tracked_fields = ['status', 'industry', 'size', 'owner_id', 'assigned_to_id']
    queryset = CompanyV2.objects.filter(deleted_at__isnull=True)
    serializer_class = CompanyV2Serializer
    pagination_class = CompanyV2Pagination

    def get_queryset(self):
        org_id = self.request.headers.get('X-Org-Id')
        if not org_id:
            return CompanyV2.objects.none()

        queryset = CompanyV2.objects.filter(
            org_id=org_id, deleted_at__isnull=True
        )

        search = self.request.query_params.get('search')
        if search:
            from forms_v2.models import FormDefinition

            form = FormDefinition.objects.filter(
                org_id=org_id, entity_type='company',
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
                    Q(entity_data__name__icontains=search) |
                    Q(entity_data__email__icontains=search) |
                    Q(entity_data__phone__icontains=search)
                )

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        industry_filter = self.request.query_params.get('industry')
        if industry_filter:
            queryset = queryset.filter(industry=industry_filter)

        size_filter = self.request.query_params.get('size')
        if size_filter:
            queryset = queryset.filter(size=size_filter)

        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)

        owner_id = self.request.query_params.get('owner_id')
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)

        parent_company_id = self.request.query_params.get('parent_company_id')
        if parent_company_id:
            queryset = queryset.filter(parent_company_id=parent_company_id)

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

                        if field in ['status', 'industry', 'size', 'assigned_to_id', 'parent_company_id']:
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
            'industry': 'industry',
            'size': 'size',
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
            return CompanyV2ListSerializer
        return CompanyV2Serializer

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
            company = CompanyV2.objects.filter(
                id=pk, deleted_at__isnull=False
            ).first()
            if not company:
                return Response(
                    {'error': 'Company not found or not deleted'},
                    status=status.HTTP_404_NOT_FOUND
                )
            company.restore()
            serializer = self.get_serializer(company)
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

        queryset = CompanyV2.objects.filter(org_id=org_id, deleted_at__isnull=True)
        total = queryset.count()
        by_status = dict(
            queryset.values_list('status').annotate(count=Count('id'))
        )

        return Response({
            'total': total,
            'by_status': by_status,
        })

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response(
                {'error': 'X-Org-Id header required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        company_ids = request.data.get('ids', [])
        if not company_ids:
            return Response(
                {'error': 'No company IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted_by = request.user.id if hasattr(request, 'user') else None
        companies = CompanyV2.objects.filter(id__in=company_ids, org_id=org_id, deleted_at__isnull=True)
        count = 0
        for company in companies:
            company.soft_delete(deleted_by=deleted_by)
            count += 1

        return Response({
            'message': f'{count} companies deleted successfully',
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

        company_ids = request.data.get('ids', [])
        data = request.data.get('data', {})

        if not company_ids:
            return Response(
                {'error': 'No company IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not data:
            return Response(
                {'error': 'No update data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        system_fields = ['status', 'industry', 'size', 'assigned_to_id', 'parent_company_id']
        system_updates = {}
        entity_data_updates = data.get('entity_data', {})

        for field in system_fields:
            if field in data:
                system_updates[field] = data[field]

        companies = CompanyV2.objects.filter(
            id__in=company_ids, org_id=org_id, deleted_at__isnull=True
        )
        count = 0
        for company in companies:
            for field, value in system_updates.items():
                setattr(company, field, value)
            if entity_data_updates:
                company.entity_data.update(entity_data_updates)
            company.save()
            count += 1

        return Response({
            'message': f'{count} companies updated successfully',
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
                    {'error': 'Invalid company IDs'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        companies = list(queryset[:10000])

        from forms_v2.models import FormDefinition
        form = FormDefinition.objects.filter(
            org_id=org_id, entity_type='company',
            is_default=True, is_active=True
        ).first()

        if not form:
            return Response(
                {'error': 'No form definition found. Please configure company form first.'},
                status=status.HTTP_404_NOT_FOUND
            )

        db_column_fields = {
            'status', 'industry', 'size', 'assigned_to', 'parent_company',
        }

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="companies-{timezone.now().strftime("%Y-%m-%d")}.csv"'

        writer = csv.writer(response)
        headers = ['ID', 'Status', 'Industry', 'Size', 'Assigned To', 'Created At', 'Updated At']
        field_names = []

        for section in form.schema.get('sections', []):
            for field in section.get('fields', []):
                if field['name'] not in db_column_fields:
                    headers.append(field['label'])
                    field_names.append(field['name'])

        writer.writerow(headers)

        for company in companies:
            row = [
                str(company.id),
                company.status or '',
                company.industry or '',
                company.size or '',
                str(company.assigned_to_id) if company.assigned_to_id else '',
                company.created_at.strftime('%Y-%m-%d %H:%M:%S') if company.created_at else '',
                company.updated_at.strftime('%Y-%m-%d %H:%M:%S') if company.updated_at else '',
            ]
            for field_name in field_names:
                value = company.entity_data.get(field_name, '')
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                row.append(str(value) if value is not None else '')
            writer.writerow(row)

        return response

    @action(detail=False, methods=['post'])
    def check_duplicate(self, request):
        org_id = request.headers.get('X-Org-Id')
        name = request.data.get('name') or request.data.get('email', '')

        if not name:
            return Response(
                {'error': 'Name or email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        duplicates = CompanyV2.objects.filter(
            org_id=org_id,
            deleted_at__isnull=True
        ).filter(
            Q(entity_data__name__iexact=name) |
            Q(entity_data__email__iexact=name)
        ).order_by('-created_at')

        serializer = CompanyV2ListSerializer(duplicates, many=True)

        return Response({
            'has_duplicates': duplicates.exists(),
            'count': duplicates.count(),
            'duplicates': serializer.data
        })

    @action(detail=False, methods=['get'])
    def sources(self, request):
        org_id = request.headers.get('X-Org-Id')
        industries = CompanyV2.objects.filter(
            org_id=org_id, deleted_at__isnull=True,
            industry__isnull=False
        ).values_list('industry', flat=True).distinct().order_by('industry')

        return Response({'sources': list(industries)})

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

    @action(detail=True, methods=['get'])
    def contacts(self, request, pk=None):
        """List contacts associated with this company."""
        company = self.get_object()
        from contacts_v2.models import ContactV2

        contacts_qs = ContactV2.objects.filter(
            company_id=company.id,
            deleted_at__isnull=True,
        ).order_by('-created_at')

        search = request.query_params.get('search')
        if search:
            contacts_qs = contacts_qs.filter(
                Q(entity_data__first_name__icontains=search) |
                Q(entity_data__last_name__icontains=search) |
                Q(entity_data__email__icontains=search)
            )

        page = self.paginate_queryset(contacts_qs)
        if page is not None:
            from contacts_v2.serializers import ContactV2ListSerializer
            serializer = ContactV2ListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        from contacts_v2.serializers import ContactV2ListSerializer
        serializer = ContactV2ListSerializer(contacts_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='stats')
    def detail_stats(self, request, pk=None):
        """Stats for a single company: contact/deal/activity counts and deal value."""
        company = self.get_object()

        from contacts_v2.models import ContactV2
        from deals_v2.models import DealV2
        from activities_v2.models import ActivityV2

        contact_count = ContactV2.objects.filter(
            company_id=company.id, deleted_at__isnull=True,
        ).count()

        deals_qs = DealV2.objects.filter(
            company_id=company.id, deleted_at__isnull=True,
        )
        deal_agg = deals_qs.aggregate(
            total=Count('id'),
            open=Count('id', filter=Q(status='open')),
            won=Count('id', filter=Q(status='won')),
            lost=Count('id', filter=Q(status='lost')),
            total_value=Coalesce(Sum('value'), 0, output_field=DecimalField()),
            won_value=Coalesce(
                Sum('value', filter=Q(status='won')), 0,
                output_field=DecimalField(),
            ),
        )

        activity_count = ActivityV2.objects.filter(
            company_id=company.id,
        ).count()

        return Response({
            'contacts': contact_count,
            'deals': {
                'total': deal_agg['total'],
                'open': deal_agg['open'],
                'won': deal_agg['won'],
                'lost': deal_agg['lost'],
                'total_value': str(deal_agg['total_value']),
                'won_value': str(deal_agg['won_value']),
            },
            'activities': activity_count,
        })

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        company = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = [choice[0] for choice in CompanyV2.Status.choices]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        company.status = new_status
        company.save(update_fields=['status', 'updated_at'])

        return Response(CompanyV2Serializer(company).data)
