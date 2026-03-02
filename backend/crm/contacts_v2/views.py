"""
Contacts V2 Views

Dynamic CRUD operations - ALL fields from FormDefinition.
Mirrors the Leads V2 pattern adapted for contacts.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count
from django.utils import timezone
from django.http import HttpResponse
import csv
import json
from uuid import UUID

from .models import ContactV2
from .serializers import ContactV2Serializer, ContactV2ListSerializer


class ContactV2Pagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class ContactV2ViewSet(viewsets.ModelViewSet):
    queryset = ContactV2.objects.filter(deleted_at__isnull=True)
    serializer_class = ContactV2Serializer
    pagination_class = ContactV2Pagination

    def get_queryset(self):
        org_id = self.request.headers.get('X-Org-Id')
        if not org_id:
            return ContactV2.objects.none()

        queryset = ContactV2.objects.filter(
            org_id=org_id, deleted_at__isnull=True
        )

        # Dynamic search based on is_searchable fields from FormDefinition
        search = self.request.query_params.get('search')
        if search:
            from forms_v2.models import FormDefinition

            form = FormDefinition.objects.filter(
                org_id=org_id, entity_type='contact',
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
                    Q(entity_data__first_name__icontains=search) |
                    Q(entity_data__last_name__icontains=search) |
                    Q(entity_data__email__icontains=search) |
                    Q(entity_data__phone__icontains=search)
                )

        # Status filter
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Source filter
        source_filter = self.request.query_params.get('source')
        if source_filter:
            queryset = queryset.filter(source=source_filter)

        # Assigned to filter
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)

        # Company filter
        company_id = self.request.query_params.get('company_id')
        if company_id:
            queryset = queryset.filter(company_id=company_id)

        # Owner filter
        owner_id = self.request.query_params.get('owner_id')
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)

        # Advanced filters (JSON)
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

                        if field in ['status', 'source', 'assigned_to_id', 'company_id']:
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

        # Dynamic sorting
        sort_by = self.request.query_params.get('sort_by', '-created_at')
        sort_direction = self.request.query_params.get('sort_direction', 'desc')

        allowed_sort_fields = {
            'created_at': 'created_at',
            'updated_at': 'updated_at',
            'status': 'status',
            'source': 'source',
            'first_name': 'entity_data__first_name',
            'last_name': 'entity_data__last_name',
            'email': 'entity_data__email',
            'company_name': 'entity_data__company_name',
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
            return ContactV2ListSerializer
        return ContactV2Serializer

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
            contact = ContactV2.objects.filter(
                id=pk, deleted_at__isnull=False
            ).first()
            if not contact:
                return Response(
                    {'error': 'Contact not found or not deleted'},
                    status=status.HTTP_404_NOT_FOUND
                )
            contact.restore()
            serializer = self.get_serializer(contact)
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

        queryset = ContactV2.objects.filter(org_id=org_id, deleted_at__isnull=True)
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

        contact_ids = request.data.get('ids', [])

        if not contact_ids:
            return Response(
                {'error': 'No contact IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        deleted_by = request.user.id if hasattr(request, 'user') else None
        contacts = ContactV2.objects.filter(id__in=contact_ids, org_id=org_id, deleted_at__isnull=True)
        count = 0
        for contact in contacts:
            contact.soft_delete(deleted_by=deleted_by)
            count += 1

        return Response({
            'message': f'{count} contacts deleted successfully',
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

        contact_ids = request.data.get('ids', [])
        data = request.data.get('data', {})

        if not contact_ids:
            return Response(
                {'error': 'No contact IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not data:
            return Response(
                {'error': 'No update data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        system_fields = ['status', 'source', 'assigned_to_id', 'company_id', 'do_not_call', 'do_not_email']
        system_updates = {}
        entity_data_updates = data.get('entity_data', {})

        for field in system_fields:
            if field in data:
                system_updates[field] = data[field]

        contacts = ContactV2.objects.filter(
            id__in=contact_ids, org_id=org_id, deleted_at__isnull=True
        )
        count = 0
        for contact in contacts:
            for field, value in system_updates.items():
                setattr(contact, field, value)
            if entity_data_updates:
                contact.entity_data.update(entity_data_updates)
            contact.save()
            count += 1

        return Response({
            'message': f'{count} contacts updated successfully',
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
                    {'error': 'Invalid contact IDs'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        contacts = list(queryset[:10000])

        from forms_v2.models import FormDefinition
        form = FormDefinition.objects.filter(
            org_id=org_id, entity_type='contact',
            is_default=True, is_active=True
        ).first()

        if not form:
            return Response(
                {'error': 'No form definition found. Please configure contact form first.'},
                status=status.HTTP_404_NOT_FOUND
            )

        db_column_fields = {
            'status', 'source', 'assigned_to', 'company',
            'do_not_call', 'do_not_email',
        }

        from crm.models import Company
        company_ids = {c.company_id for c in contacts if c.company_id}
        company_names = {}
        if company_ids:
            company_names = dict(
                Company.objects.filter(id__in=company_ids).values_list('id', 'name')
            )

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="contacts-{timezone.now().strftime("%Y-%m-%d")}.csv"'

        writer = csv.writer(response)
        headers = ['ID', 'Status', 'Source', 'Company', 'Assigned To',
                    'Do Not Call', 'Do Not Email', 'Created At', 'Updated At']
        field_names = []

        for section in form.schema.get('sections', []):
            for field in section.get('fields', []):
                if field['name'] not in db_column_fields:
                    headers.append(field['label'])
                    field_names.append(field['name'])

        writer.writerow(headers)

        for contact in contacts:
            company_display = ''
            if contact.company_id:
                company_display = company_names.get(contact.company_id, str(contact.company_id))

            row = [
                str(contact.id),
                contact.status or '',
                contact.source or '',
                company_display,
                str(contact.assigned_to_id) if contact.assigned_to_id else '',
                'Yes' if contact.do_not_call else 'No',
                'Yes' if contact.do_not_email else 'No',
                contact.created_at.strftime('%Y-%m-%d %H:%M:%S') if contact.created_at else '',
                contact.updated_at.strftime('%Y-%m-%d %H:%M:%S') if contact.updated_at else '',
            ]
            for field_name in field_names:
                value = contact.entity_data.get(field_name, '')
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                row.append(str(value) if value is not None else '')
            writer.writerow(row)

        return response

    @action(detail=False, methods=['post'])
    def check_duplicate(self, request):
        org_id = request.headers.get('X-Org-Id')
        email = request.data.get('email')

        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        duplicates = ContactV2.objects.filter(
            org_id=org_id,
            entity_data__email__iexact=email,
            deleted_at__isnull=True
        ).order_by('-created_at')

        serializer = ContactV2ListSerializer(duplicates, many=True)

        return Response({
            'has_duplicates': duplicates.exists(),
            'count': duplicates.count(),
            'duplicates': serializer.data
        })

    @action(detail=False, methods=['get'])
    def sources(self, request):
        org_id = request.headers.get('X-Org-Id')
        sources = ContactV2.objects.filter(
            org_id=org_id, deleted_at__isnull=True,
            source__isnull=False
        ).values_list('source', flat=True).distinct().order_by('source')

        return Response({'sources': list(sources)})

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
        contact = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = [choice[0] for choice in ContactV2.Status.choices]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        contact.status = new_status
        contact.save(update_fields=['status', 'updated_at'])

        return Response(ContactV2Serializer(contact).data)
