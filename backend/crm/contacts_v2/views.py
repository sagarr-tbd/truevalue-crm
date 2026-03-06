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

from .models import ContactV2, ContactCompanyV2
from .serializers import (
    ContactV2Serializer, ContactV2ListSerializer,
    ContactCompanyV2Serializer, ContactCompanyV2WriteSerializer,
)
from crm_service.audit_v2 import AuditLogV2Mixin
from crm.permissions import CRMResourcePermission


class ContactV2Pagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class ContactV2ViewSet(AuditLogV2Mixin, viewsets.ModelViewSet):
    resource = 'contacts'
    permission_classes = [CRMResourcePermission]
    audit_tracked_fields = ['status', 'source', 'company_id', 'owner_id', 'assigned_to_id']
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

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        source_filter = self.request.query_params.get('source')
        if source_filter:
            queryset = queryset.filter(source=source_filter)

        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)

        company_id = self.request.query_params.get('company_id')
        if company_id:
            queryset = queryset.filter(company_id=company_id)

        owner_id = self.request.query_params.get('owner_id')
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)

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
            org_id = request.headers.get('X-Org-Id')
            contact = ContactV2.objects.filter(
                id=pk, org_id=org_id, deleted_at__isnull=False
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

        EXPORT_MAX_ROWS = 50000
        contacts = list(queryset[:EXPORT_MAX_ROWS])

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

        from companies_v2.models import CompanyV2
        company_ids = {c.company_id for c in contacts if c.company_id}
        company_names = {}
        if company_ids:
            companies = CompanyV2.objects.filter(id__in=company_ids).only('id', 'entity_data')
            company_names = {c.id: c.get_name() for c in companies}

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
        """
        Check for duplicate contacts by email, phone, or name.
        Request: { "email": "...", "phone": "...", "name": "..." }
        At least one field required.
        """
        org_id = request.headers.get('X-Org-Id')
        email = request.data.get('email')
        phone = request.data.get('phone')
        name = request.data.get('name')

        if not any([email, phone, name]):
            return Response(
                {'error': 'At least one of email, phone, or name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        conditions = Q()
        match_field = None

        if email:
            conditions |= Q(entity_data__email__iexact=email)
            match_field = 'email'

        if phone and len(phone) >= 7:
            phone_suffix = phone[-10:]
            conditions |= (
                Q(entity_data__phone__icontains=phone_suffix) |
                Q(entity_data__mobile__icontains=phone_suffix)
            )
            match_field = match_field or 'phone'

        if name:
            parts = name.strip().split()
            if len(parts) >= 2:
                conditions |= (
                    Q(entity_data__first_name__iexact=parts[0]) &
                    Q(entity_data__last_name__iexact=parts[-1])
                )
            else:
                conditions |= (
                    Q(entity_data__first_name__iexact=name) |
                    Q(entity_data__last_name__iexact=name)
                )
            match_field = match_field or 'name'

        duplicates = ContactV2.objects.filter(
            org_id=org_id,
            deleted_at__isnull=True,
        ).filter(conditions).order_by('-created_at')

        serializer = ContactV2ListSerializer(duplicates, many=True)

        return Response({
            'has_duplicates': duplicates.exists(),
            'count': duplicates.count(),
            'match_field': match_field,
            'duplicates': serializer.data,
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

    @action(detail=True, methods=['get', 'post'], url_path='companies')
    def companies(self, request, pk=None):
        contact = self.get_object()

        if request.method == 'GET':
            associations = ContactCompanyV2.objects.filter(
                contact=contact
            ).order_by('-is_primary', '-is_current', '-created_at')
            serializer = ContactCompanyV2Serializer(associations, many=True)
            return Response(serializer.data)

        serializer = ContactCompanyV2WriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        company_id = serializer.validated_data['company_id']

        from companies_v2.models import CompanyV2
        org_id = request.headers.get('X-Org-Id')
        if not CompanyV2.objects.filter(id=company_id, org_id=org_id, deleted_at__isnull=True).exists():
            return Response(
                {'error': 'Company not found in your organization'},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_primary = serializer.validated_data.get('is_primary', False)

        if is_primary:
            ContactCompanyV2.objects.filter(
                contact=contact, is_primary=True
            ).update(is_primary=False)
            contact.company_id = company_id
            contact.save(update_fields=['company_id', 'updated_at'])

        association = ContactCompanyV2.objects.create(
            contact=contact,
            **serializer.validated_data,
        )

        return Response(
            ContactCompanyV2Serializer(association).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['patch', 'delete'],
            url_path='companies/(?P<association_id>[^/.]+)')
    def company_detail(self, request, pk=None, association_id=None):
        contact = self.get_object()

        try:
            association = ContactCompanyV2.objects.get(
                id=association_id, contact=contact
            )
        except ContactCompanyV2.DoesNotExist:
            return Response(
                {'error': 'Association not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == 'DELETE':
            if association.is_primary:
                contact.company_id = None
                contact.save(update_fields=['company_id', 'updated_at'])
            association.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = ContactCompanyV2WriteSerializer(
            association, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get('is_primary', False):
            ContactCompanyV2.objects.filter(
                contact=contact, is_primary=True
            ).exclude(id=association.id).update(is_primary=False)
            contact.company_id = association.company_id
            contact.save(update_fields=['company_id', 'updated_at'])

        serializer.save()
        return Response(ContactCompanyV2Serializer(association).data)

    # ─── Timeline ──────────────────────────────────────────────────

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """Get activity timeline for a contact."""
        contact = self.get_object()
        limit = min(int(request.query_params.get('limit', 50)), 200)

        from activities_v2.models import ActivityV2
        activities = ActivityV2.objects.filter(
            contact_id=contact.id,
        ).order_by('-created_at')[:limit]

        timeline = [
            {
                'id': str(a.id),
                'type': 'activity',
                'activity_type': a.activity_type,
                'subject': a.subject,
                'description': a.description,
                'status': a.status,
                'priority': a.priority,
                'due_date': a.due_date.isoformat() if a.due_date else None,
                'completed_at': a.completed_at.isoformat() if a.completed_at else None,
                'created_at': a.created_at.isoformat(),
                'owner_id': str(a.owner_id),
            }
            for a in activities
        ]

        return Response({'data': timeline, 'count': len(timeline)})

    @action(detail=False, methods=['post'], url_path='import')
    def import_contacts(self, request):
        """
        Bulk import contacts from JSON list.
        Request: {
          "contacts": [
            { "first_name": "...", "last_name": "...", "email": "...", ... }
          ],
          "skip_duplicates": true,
          "update_existing": false,
          "duplicate_check_field": "email"
        }
        """
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response(
                {'error': 'X-Org-Id header required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        contacts_data = request.data.get('contacts', [])
        if not contacts_data:
            return Response(
                {'error': 'contacts list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        skip_duplicates = request.data.get('skip_duplicates', True)
        update_existing = request.data.get('update_existing', False)
        dup_field = request.data.get('duplicate_check_field', 'email')

        system_fields = {'status', 'source', 'assigned_to', 'company', 'do_not_call', 'do_not_email'}
        user_id = request.user.id if hasattr(request, 'user') else None

        results = {'total': len(contacts_data), 'created': 0, 'updated': 0, 'skipped': 0, 'errors': []}

        for i, row in enumerate(contacts_data):
            try:
                if not row.get('first_name') and not row.get('email'):
                    results['errors'].append({'row': i + 1, 'error': 'first_name or email is required'})
                    continue

                check_value = row.get(dup_field)
                if check_value:
                    existing = ContactV2.objects.filter(
                        org_id=org_id,
                        deleted_at__isnull=True,
                        **{f'entity_data__{dup_field}__iexact': check_value}
                    ).first()

                    if existing:
                        if update_existing:
                            for key, val in row.items():
                                if key in system_fields:
                                    continue
                                existing.entity_data[key] = val
                            if 'status' in row and row['status'] in dict(ContactV2.Status.choices):
                                existing.status = row['status']
                            if 'source' in row and row['source'] in dict(ContactV2.Source.choices):
                                existing.source = row['source']
                            existing.save(update_fields=['entity_data', 'status', 'source', 'updated_at'])
                            results['updated'] += 1
                        elif skip_duplicates:
                            results['skipped'] += 1
                        else:
                            results['errors'].append({
                                'row': i + 1,
                                'error': f'Duplicate {dup_field}: {check_value}'
                            })
                        continue

                entity_data = {k: v for k, v in row.items() if k not in system_fields}
                kwargs = {
                    'org_id': org_id,
                    'owner_id': user_id or org_id,
                    'source': ContactV2.Source.IMPORT,
                    'entity_data': entity_data,
                }
                if 'status' in row and row['status'] in dict(ContactV2.Status.choices):
                    kwargs['status'] = row['status']

                ContactV2.objects.create(**kwargs)
                results['created'] += 1

            except Exception as e:
                results['errors'].append({'row': i + 1, 'error': str(e)})

        return Response(results, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def merge(self, request):
        """
        Merge two contacts. Secondary is soft-deleted after merge.
        Request: {
          "primary_id": "uuid",
          "secondary_id": "uuid",
          "strategy": "keep_primary" | "fill_empty"
        }
        """
        org_id = request.headers.get('X-Org-Id')
        primary_id = request.data.get('primary_id')
        secondary_id = request.data.get('secondary_id')
        strategy = request.data.get('strategy', 'fill_empty')

        if not primary_id or not secondary_id:
            return Response(
                {'error': 'primary_id and secondary_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if str(primary_id) == str(secondary_id):
            return Response(
                {'error': 'Cannot merge a contact with itself'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            primary = ContactV2.objects.get(id=primary_id, org_id=org_id, deleted_at__isnull=True)
            secondary = ContactV2.objects.get(id=secondary_id, org_id=org_id, deleted_at__isnull=True)
        except ContactV2.DoesNotExist:
            return Response(
                {'error': 'One or both contacts not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if strategy == 'fill_empty':
            for key, value in secondary.entity_data.items():
                if key not in primary.entity_data or not primary.entity_data[key]:
                    primary.entity_data[key] = value

            if not primary.source and secondary.source:
                primary.source = secondary.source
            if not primary.company_id and secondary.company_id:
                primary.company_id = secondary.company_id

        primary.save(update_fields=['entity_data', 'source', 'company_id', 'updated_at'])

        from activities_v2.models import ActivityV2
        ActivityV2.all_objects.filter(contact_id=secondary.id).update(contact_id=primary.id)

        from deals_v2.models import DealV2
        DealV2.objects.filter(contact_id=secondary.id, deleted_at__isnull=True).update(contact_id=primary.id)

        for assoc in ContactCompanyV2.objects.filter(contact=secondary):
            if not ContactCompanyV2.objects.filter(contact=primary, company_id=assoc.company_id).exists():
                assoc.contact = primary
                assoc.save(update_fields=['contact_id', 'updated_at'])
            else:
                assoc.delete()

        from tags_v2.models import EntityTagV2
        for tag_assn in EntityTagV2.objects.filter(entity_type='contact', entity_id=secondary.id):
            if not EntityTagV2.objects.filter(
                tag=tag_assn.tag, entity_type='contact', entity_id=primary.id
            ).exists():
                tag_assn.entity_id = primary.id
                tag_assn.save(update_fields=['entity_id'])
            else:
                tag_assn.delete()

        user_id = request.user.id if hasattr(request, 'user') else None
        secondary.soft_delete(deleted_by=user_id)

        primary.refresh_from_db()
        serializer = ContactV2Serializer(primary)

        return Response({
            'success': True,
            'merged_contact': serializer.data,
            'deleted_contact_id': str(secondary.id),
            'strategy': strategy,
        })
