from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from django.db.models import Q, Count
from django.utils import timezone
from django.http import HttpResponse
import csv
import json
import logging
from uuid import UUID

from .models import LeadV2
from .serializers import LeadV2Serializer, LeadV2ListSerializer
from crm_service.audit_v2 import AuditLogV2Mixin
from crm.permissions import CRMResourcePermission

logger = logging.getLogger(__name__)


class LeadV2Pagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class WebFormThrottle(AnonRateThrottle):
    rate = '10/minute'


class LeadV2ViewSet(AuditLogV2Mixin, viewsets.ModelViewSet):
    resource = 'leads'
    permission_classes = [CRMResourcePermission]
    audit_tracked_fields = ['status', 'source', 'owner_id', 'assigned_to_id']
    
    queryset = LeadV2.objects.filter(deleted_at__isnull=True)
    serializer_class = LeadV2Serializer
    pagination_class = LeadV2Pagination
    
    def get_queryset(self):
        org_id = self.request.headers.get('X-Org-Id')
        if not org_id:
            return LeadV2.objects.none()
        
        queryset = LeadV2.objects.filter(
            org_id=org_id,
            deleted_at__isnull=True
        )
        
        search = self.request.query_params.get('search')
        if search:
            from forms_v2.models import FormDefinition
            
            form = FormDefinition.objects.filter(
                org_id=org_id,
                entity_type='lead',
                form_type='create',
                is_default=True,
                is_active=True
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
                    Q(entity_data__company_name__icontains=search)
                )
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        source_filter = self.request.query_params.get('source')
        if source_filter:
            queryset = queryset.filter(source=source_filter)
        
        # Assigned to filter
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        
        is_converted = self.request.query_params.get('is_converted')
        if is_converted is not None:
            queryset = queryset.filter(is_converted=is_converted.lower() == 'true')
        
        # Owner filter (for scope=mine)
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
                        
                        if field in ['status', 'source', 'rating', 'assigned_to_id', 'company_id', 'contact_id']:
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
            return LeadV2ListSerializer
        return LeadV2Serializer
    
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
            lead = LeadV2.objects.filter(
                id=pk, org_id=org_id, deleted_at__isnull=False
            ).first()
            if not lead:
                return Response(
                    {'error': 'Lead not found or not deleted'},
                    status=status.HTTP_404_NOT_FOUND
                )
            lead.restore()
            serializer = self.get_serializer(lead)
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
        
        queryset = LeadV2.objects.filter(org_id=org_id, deleted_at__isnull=True)
        total = queryset.count()
        by_status = dict(
            queryset.values_list('status')
            .annotate(count=Count('id'))
        )
        
        return Response({
            'total': total,
            'by_status': by_status,
        })
    
    @action(detail=True, methods=['post'])
    def disqualify(self, request, pk=None):
        lead = self.get_object()
        
        lead.status = LeadV2.Status.UNQUALIFIED
        lead.save(update_fields=['status', 'updated_at'])
        
        return Response({
            'message': 'Lead disqualified successfully',
            'lead_id': str(lead.id),
            'status': lead.status
        })
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response(
                {'error': 'X-Org-Id header required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        lead_ids = request.data.get('ids', [])
        
        if not lead_ids:
            return Response(
                {'error': 'No lead IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_by = request.user.id if hasattr(request, 'user') else None
        leads = LeadV2.objects.filter(id__in=lead_ids, org_id=org_id, deleted_at__isnull=True)
        count = 0
        for lead in leads:
            lead.soft_delete(deleted_by=deleted_by)
            count += 1
        
        return Response({
            'message': f'{count} leads deleted successfully',
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

        lead_ids = request.data.get('ids', [])
        data = request.data.get('data', {})
        
        if not lead_ids:
            return Response(
                {'error': 'No lead IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not data:
            return Response(
                {'error': 'No update data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        system_fields = ['status', 'source', 'assigned_to_id', 'rating', 'company_id', 'contact_id']
        system_updates = {}
        entity_data_updates = data.get('entity_data', {})
        
        for field in system_fields:
            if field in data:
                system_updates[field] = data[field]
        
        leads = LeadV2.objects.filter(id__in=lead_ids, org_id=org_id, deleted_at__isnull=True)
        count = 0
        
        for lead in leads:
            for field, value in system_updates.items():
                setattr(lead, field, value)
            
            if entity_data_updates:
                lead.entity_data.update(entity_data_updates)
            
            lead.save()
            count += 1
        
        return Response({
            'message': f'{count} leads updated successfully',
            'count': count
        })
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export leads to CSV with dynamic columns from FormDefinition.
        
        Query Parameters:
        - format: csv (default)
        - ids: comma-separated lead IDs (optional)
        - All standard filters: status, source, search, etc.
        
        Returns: CSV file download
        """
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
                    {'error': 'Invalid lead IDs'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        EXPORT_MAX_ROWS = 50000
        leads = list(queryset[:EXPORT_MAX_ROWS])
        
        from forms_v2.models import FormDefinition
        form = FormDefinition.objects.filter(
            org_id=org_id,
            entity_type='lead',
            is_default=True,
            is_active=True
        ).first()
        
        if not form:
            return Response(
                {'error': 'No form definition found. Please configure lead form first.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        db_column_fields = {
            'status', 'source', 'rating', 'assigned_to', 'company',
        }

        from companies_v2.models import CompanyV2
        company_ids = {l.company_id for l in leads if l.company_id}
        company_names = {}
        if company_ids:
            companies = CompanyV2.objects.filter(id__in=company_ids).only('id', 'entity_data')
            company_names = {c.id: c.get_name() for c in companies}

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="leads-{timezone.now().strftime("%Y-%m-%d")}.csv"'
        
        writer = csv.writer(response)
        
        headers = ['ID', 'Status', 'Source', 'Rating', 'Company',
                    'Assigned To', 'Created At', 'Updated At']
        field_names = []
        
        for section in form.schema.get('sections', []):
            for field in section.get('fields', []):
                if field['name'] not in db_column_fields:
                    headers.append(field['label'])
                    field_names.append(field['name'])
        
        writer.writerow(headers)
        
        for lead in leads:
            company_display = ''
            if lead.company_id:
                company_display = company_names.get(lead.company_id, str(lead.company_id))

            row = [
                str(lead.id),
                lead.status or '',
                lead.source or '',
                lead.rating or '',
                company_display,
                str(lead.assigned_to_id) if lead.assigned_to_id else '',
                lead.created_at.strftime('%Y-%m-%d %H:%M:%S') if lead.created_at else '',
                lead.updated_at.strftime('%Y-%m-%d %H:%M:%S') if lead.updated_at else '',
            ]
            
            for field_name in field_names:
                value = lead.entity_data.get(field_name, '')
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                row.append(str(value) if value is not None else '')
            
            writer.writerow(row)
        
        return response
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny], throttle_classes=[WebFormThrottle])
    def web_form(self, request):
        """
        Public endpoint for website lead capture.
        
        No authentication required. Rate limited to 10 submissions per minute per IP.
        
        Request body:
        {
          "org_id": "uuid",
          "form_token": "optional-validation-token",
          
          // Dynamic fields based on web_form FormDefinition
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "company_name": "Acme Corp",
          "message": "Interested in your product",
          
          // UTM tracking (optional)
          "utm_source": "google",
          "utm_medium": "cpc",
          "utm_campaign": "spring-2026"
        }
        
        Returns:
        {
          "success": true,
          "message": "Thank you...",
          "lead_id": "uuid",
          "is_new": true
        }
        """
        org_id = request.data.get('org_id')
        
        if not org_id:
            return Response(
                {'success': False, 'message': 'Organization ID required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from forms_v2.models import FormDefinition
            form = FormDefinition.objects.filter(
                org_id=org_id,
                entity_type='lead',
                form_type='web_form',
                is_active=True
            ).first()
            
            if not form:
                form = FormDefinition.objects.filter(
                    org_id=org_id,
                    entity_type='lead',
                    is_default=True,
                    is_active=True
                ).first()
                
                if not form:
                    return Response(
                        {'success': False, 'message': 'Organization not configured for web forms'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            entity_data = {}
            required_fields = []
            
            for section in form.schema.get('sections', []):
                for field in section.get('fields', []):
                    field_name = field['name']
                    field_value = request.data.get(field_name)
                    
                    if field.get('is_required', False):
                        required_fields.append((field_name, field['label']))
                    
                    if field_value is not None:
                        entity_data[field_name] = field_value
            
            missing_fields = []
            for field_name, field_label in required_fields:
                if not entity_data.get(field_name):
                    missing_fields.append(field_label)
            
            if missing_fields:
                return Response(
                    {
                        'success': False,
                        'message': f'Required fields missing: {", ".join(missing_fields)}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            email = entity_data.get('email')
            if email:
                existing = LeadV2.objects.filter(
                    org_id=org_id,
                    entity_data__email__iexact=email,
                    deleted_at__isnull=True
                ).first()
                
                if existing:
                    try:
                        from activities_v2.models import ActivityV2
                        ActivityV2.objects.create(
                            org_id=org_id,
                            owner_id=existing.owner_id,
                            activity_type='note',
                            subject='New web form submission',
                            description=f"Duplicate submission from {email}:\n\n{entity_data.get('message', 'No message')}",
                            lead_id=existing.id,
                            status='completed'
                        )
                    except Exception:
                        pass
                    
                    return Response({
                        'success': True,
                        'message': 'Thank you for your inquiry. We will contact you soon.',
                        'lead_id': str(existing.id),
                        'is_new': False
                    }, status=status.HTTP_200_OK)
            
            # Get default owner (org owner or first admin)
            from crm.utils import fetch_org_owner
            try:
                default_owner_id = fetch_org_owner(org_id)
            except Exception:
                default_owner_id = org_id
            
            if not default_owner_id:
                return Response(
                    {'success': False, 'message': 'Organization configuration error'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            lead = LeadV2.objects.create(
                org_id=org_id,
                owner_id=default_owner_id,
                status='new',
                source='website',
                entity_data=entity_data
            )
            
            return Response({
                'success': True,
                'message': 'Thank you for your inquiry. We will contact you soon.',
                'lead_id': str(lead.id),
                'is_new': True
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Web form error: {e}", exc_info=True)
            
            return Response({
                'success': False,
                'message': 'An error occurred. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        lead = self.get_object()
        org_id = request.headers.get('X-Org-Id')
        
        if lead.status == LeadV2.Status.CONVERTED:
            return Response(
                {'error': 'Lead is already converted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        create_contact = request.data.get('create_contact', True)
        create_company = request.data.get('create_company', False)
        create_deal = request.data.get('create_deal', False)
        
        result = {
            'success': True,
            'lead_id': str(lead.id),
            'contact_id': None,
            'company_id': None,
            'deal_id': None
        }
        
        try:
            contact = None
            company = None

            if create_contact:
                from contacts_v2.models import ContactV2

                entity_data = {}
                entity_data_fields = [
                    'first_name', 'last_name', 'email', 'phone', 'mobile',
                    'title', 'job_title', 'department', 'linkedin_url', 'description',
                ]
                for field in entity_data_fields:
                    value = lead.entity_data.get(field)
                    if value:
                        entity_data[field] = value

                email = lead.entity_data.get('email')
                existing_contact = None
                if email:
                    existing_contact = ContactV2.objects.filter(
                        org_id=org_id,
                        entity_data__email__iexact=email,
                        deleted_at__isnull=True
                    ).first()

                if existing_contact:
                    contact = existing_contact
                else:
                    contact = ContactV2.objects.create(
                        org_id=org_id,
                        owner_id=lead.owner_id or request.user.id,
                        source=ContactV2.Source.LEAD_CONVERSION,
                        converted_from_lead_id=lead.id,
                        converted_at=timezone.now(),
                        entity_data=entity_data,
                    )

                result['contact_id'] = str(contact.id)
                lead.converted_contact_id = contact.id

            if create_company:
                from companies_v2.models import CompanyV2

                company_name = lead.entity_data.get('company_name')

                if company_name:
                    existing_company = CompanyV2.objects.filter(
                        org_id=org_id,
                        entity_data__name__iexact=company_name,
                        deleted_at__isnull=True
                    ).first()

                    if existing_company:
                        company = existing_company
                    else:
                        company_entity_data = {'name': company_name}
                        entity_field_mapping = {
                            'company_website': 'website',
                            'company_phone': 'phone',
                            'company_email': 'email',
                            'company_address': 'address',
                            'company_city': 'city',
                            'company_state': 'state',
                            'company_country': 'country',
                            'company_postal_code': 'postal_code',
                        }
                        for lead_field, ed_field in entity_field_mapping.items():
                            value = lead.entity_data.get(lead_field)
                            if value:
                                company_entity_data[ed_field] = value

                        company_kwargs = {
                            'org_id': org_id,
                            'owner_id': lead.owner_id or request.user.id,
                            'entity_data': company_entity_data,
                        }
                        industry = lead.entity_data.get('company_industry')
                        if industry:
                            company_kwargs['industry'] = industry
                        size = lead.entity_data.get('company_size')
                        if size and size in dict(CompanyV2.Size.choices):
                            company_kwargs['size'] = size

                        company = CompanyV2.objects.create(**company_kwargs)

                    result['company_id'] = str(company.id)
                    lead.converted_company_id = company.id

                    if create_contact and contact:
                        contact.company_id = company.id
                        contact.save(update_fields=['company_id', 'updated_at'])

            if create_deal:
                from deals_v2.models import DealV2
                from pipelines_v2.models import PipelineV2

                deal_name = request.data.get('deal_name') or f"Deal with {lead.entity_data.get('first_name', 'Lead')}"
                deal_value = request.data.get('deal_value', 0)
                pipeline_id = request.data.get('deal_pipeline_id')
                stage_name = None

                stage_id = request.data.get('deal_stage_id')
                if stage_id:
                    from pipelines_v2.models import PipelineStageV2
                    stage_obj = PipelineStageV2.objects.filter(
                        id=stage_id,
                        pipeline__org_id=org_id,
                    ).first()
                    if stage_obj:
                        stage_name = stage_obj.name
                        pipeline_id = pipeline_id or stage_obj.pipeline_id

                if not pipeline_id:
                    default_pipeline = PipelineV2.objects.filter(
                        org_id=org_id,
                        is_active=True,
                        deleted_at__isnull=True
                    ).order_by('created_at').first()

                    if default_pipeline:
                        pipeline_id = default_pipeline.id
                        if not stage_name:
                            first_stage = default_pipeline.stages.order_by('order').first()
                            if first_stage:
                                stage_name = first_stage.name

                if pipeline_id and stage_name:
                    deal_data = {
                        'org_id': org_id,
                        'owner_id': lead.owner_id or request.user.id,
                        'value': deal_value,
                        'pipeline_id': pipeline_id,
                        'stage': stage_name,
                        'status': DealV2.Status.OPEN,
                        'converted_from_lead_id': lead.id,
                        'entity_data': {'name': deal_name},
                    }

                    if result['contact_id']:
                        deal_data['contact_id'] = result['contact_id']
                    if result['company_id']:
                        deal_data['company_id'] = result['company_id']

                    deal = DealV2.objects.create(**deal_data)
                    result['deal_id'] = str(deal.id)
                    lead.converted_deal_id = deal.id
            
            lead.status = LeadV2.Status.CONVERTED
            lead.converted_at = timezone.now()
            lead.save(update_fields=[
                'status', 'converted_at', 'converted_contact_id',
                'converted_company_id', 'converted_deal_id', 'updated_at'
            ])
            
            return Response(result)
            
        except Exception as e:
            logger.error(f"Conversion error: {e}", exc_info=True)
            
            return Response({
                'error': 'Conversion failed',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def check_duplicate(self, request):
        org_id = request.headers.get('X-Org-Id')
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        duplicates = LeadV2.objects.filter(
            org_id=org_id,
            entity_data__email__iexact=email,
            deleted_at__isnull=True
        ).order_by('-created_at')
        
        serializer = LeadV2ListSerializer(duplicates, many=True)
        
        return Response({
            'has_duplicates': duplicates.exists(),
            'count': duplicates.count(),
            'duplicates': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def sources(self, request):
        org_id = request.headers.get('X-Org-Id')
        
        sources = LeadV2.objects.filter(
            org_id=org_id,
            deleted_at__isnull=True,
            source__isnull=False
        ).values_list('source', flat=True).distinct().order_by('source')
        
        return Response({
            'sources': list(sources)
        })
    
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
        lead = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = [choice[0] for choice in LeadV2.Status.choices]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        lead.status = new_status
        lead.save(update_fields=['status', 'updated_at'])
        
        return Response(LeadV2Serializer(lead).data)
