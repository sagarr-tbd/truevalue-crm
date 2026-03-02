"""
Leads V2 Views

Pure dynamic CRUD operations - ALL fields from FieldDefinition.
"""

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
from uuid import UUID

from .models import LeadV2
from .serializers import LeadV2Serializer, LeadV2ListSerializer


class LeadV2Pagination(PageNumberPagination):
    """Pagination for LeadV2 list view."""
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class WebFormThrottle(AnonRateThrottle):
    """Rate limit for public web form submissions."""
    rate = '10/minute'


class LeadV2ViewSet(viewsets.ModelViewSet):
    """
    Pure Dynamic Lead ViewSet.
    
    ALL fields are defined in forms_v2.FieldDefinition.
    ALL values stored in entity_data JSONB.
    """
    
    queryset = LeadV2.objects.filter(deleted_at__isnull=True)
    serializer_class = LeadV2Serializer
    pagination_class = LeadV2Pagination
    
    def get_queryset(self):
        """
        Filter leads by org_id and support search/filters with dynamic searchable fields.
        """
        org_id = self.request.headers.get('X-Org-Id')
        if not org_id:
            return LeadV2.objects.none()
        
        queryset = LeadV2.objects.filter(
            org_id=org_id,
            deleted_at__isnull=True
        )
        
        # Dynamic search based on is_searchable fields from FormDefinition
        search = self.request.query_params.get('search')
        if search:
            from forms_v2.models import FormDefinition
            
            # Get default form to determine searchable fields
            form = FormDefinition.objects.filter(
                org_id=org_id,
                entity_type='lead',
                form_type='create',
                is_default=True,
                is_active=True
            ).first()
            
            if form:
                # Extract searchable field names from schema
                searchable_fields = []
                for section in form.schema.get('sections', []):
                    for field in section.get('fields', []):
                        if field.get('is_searchable', True):  # Default to searchable
                            field_name = field.get('name')
                            field_type = field.get('field_type', '')
                            
                            # Only search text-based fields
                            if field_type in ['text', 'textarea', 'email', 'phone', 'url']:
                                searchable_fields.append(field_name)
                
                # Build dynamic search query
                if searchable_fields:
                    search_queries = Q()
                    for field_name in searchable_fields:
                        search_queries |= Q(**{f'entity_data__{field_name}__icontains': search})
                    
                    queryset = queryset.filter(search_queries)
            else:
                # Fallback to common fields if no form definition found
                queryset = queryset.filter(
                    Q(entity_data__first_name__icontains=search) |
                    Q(entity_data__last_name__icontains=search) |
                    Q(entity_data__email__icontains=search) |
                    Q(entity_data__company_name__icontains=search)
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
        
        # Converted filter
        is_converted = self.request.query_params.get('is_converted')
        if is_converted is not None:
            queryset = queryset.filter(is_converted=is_converted.lower() == 'true')
        
        # Owner filter (for scope=mine)
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
                        
                        # Map field to query path
                        if field in ['status', 'source', 'rating', 'assigned_to_id', 'company_id', 'contact_id']:
                            field_path = field
                        else:
                            field_path = f'entity_data__{field}'
                        
                        # Build query based on operator
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
        
        # Map sortable fields (system fields + entity_data fields)
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
        """Use list serializer for list action."""
        if self.action == 'list':
            return LeadV2ListSerializer
        return LeadV2Serializer
    
    def perform_create(self, serializer):
        """Set org_id and owner_id on create."""
        org_id = self.request.headers.get('X-Org-Id')
        user_id = self.request.user.id if hasattr(self.request, 'user') else None
        
        serializer.save(
            org_id=org_id,
            owner_id=user_id or org_id
        )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get lead statistics.
        """
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response(
                {'error': 'X-Org-Id header required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = LeadV2.objects.filter(org_id=org_id, deleted_at__isnull=True)
        
        # Total
        total = queryset.count()
        
        # By status
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
        """Disqualify a lead."""
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
        """Bulk delete leads (soft delete)."""
        org_id = request.headers.get('X-Org-Id')
        lead_ids = request.data.get('ids', [])
        
        if not lead_ids:
            return Response(
                {'error': 'No lead IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted_by = request.user.id if hasattr(request, 'user') else None
        
        # Soft delete
        leads = LeadV2.objects.filter(id__in=lead_ids, org_id=org_id)
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
        """
        Bulk update leads - Enhanced to support all fields.
        
        Request body:
        {
          "ids": ["uuid1", "uuid2"],
          "data": {
            "status": "contacted",
            "source": "referral",
            "assigned_to_id": "user-uuid",
            "entity_data": {
              "rating": "hot",
              "notes": "Follow up needed"
            }
          }
        }
        """
        org_id = request.headers.get('X-Org-Id')
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
        
        # Separate system fields from entity_data fields
        system_fields = ['status', 'source', 'assigned_to_id', 'rating', 'company_id', 'contact_id']
        system_updates = {}
        entity_data_updates = data.get('entity_data', {})
        
        for field in system_fields:
            if field in data:
                system_updates[field] = data[field]
        
        # Update leads
        leads = LeadV2.objects.filter(id__in=lead_ids, org_id=org_id, deleted_at__isnull=True)
        count = 0
        
        for lead in leads:
            # Update system fields
            for field, value in system_updates.items():
                setattr(lead, field, value)
            
            # Update entity_data fields
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
        
        # Get filtered queryset
        queryset = self.get_queryset()
        
        # If specific IDs provided, filter to those
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
        
        # Limit to 10,000 rows for performance
        queryset = queryset[:10000]
        
        # Get form definition to determine columns
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
        
        # Build CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="leads-{timezone.now().strftime("%Y-%m-%d")}.csv"'
        
        writer = csv.writer(response)
        
        # Write headers
        headers = ['ID', 'Status', 'Source', 'Created At', 'Updated At', 'Owner ID']
        field_names = []
        
        for section in form.schema.get('sections', []):
            for field in section.get('fields', []):
                headers.append(field['label'])
                field_names.append(field['name'])
        
        writer.writerow(headers)
        
        # Write data rows
        for lead in queryset:
            row = [
                str(lead.id),
                lead.status or '',
                lead.source or '',
                lead.created_at.strftime('%Y-%m-%d %H:%M:%S') if lead.created_at else '',
                lead.updated_at.strftime('%Y-%m-%d %H:%M:%S') if lead.updated_at else '',
                str(lead.owner_id) if lead.owner_id else '',
            ]
            
            # Add dynamic fields from entity_data
            for field_name in field_names:
                value = lead.entity_data.get(field_name, '')
                # Handle complex types
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
            # Get web form definition
            from forms_v2.models import FormDefinition
            form = FormDefinition.objects.filter(
                org_id=org_id,
                entity_type='lead',
                form_type='web_form',
                is_active=True
            ).first()
            
            if not form:
                # Fallback to default form
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
            
            # Build entity_data from form schema
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
            
            # Validate required fields
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
            
            # Check for duplicate by email
            email = entity_data.get('email')
            if email:
                existing = LeadV2.objects.filter(
                    org_id=org_id,
                    entity_data__email__iexact=email,
                    deleted_at__isnull=True
                ).first()
                
                if existing:
                    # Log activity on existing lead
                    try:
                        from crm.models import Activity
                        Activity.objects.create(
                            org_id=org_id,
                            owner_id=existing.owner_id,
                            activity_type='note',
                            subject='New web form submission',
                            description=f"Duplicate submission from {email}:\n\n{entity_data.get('message', 'No message')}",
                            lead_id=existing.id,
                            status='completed'
                        )
                    except Exception:
                        pass  # Don't fail if activity creation fails
                    
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
                # Fallback: use org_id as owner
                default_owner_id = org_id
            
            if not default_owner_id:
                return Response(
                    {'success': False, 'message': 'Organization configuration error'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Create lead
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
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Web form error: {e}", exc_info=True)
            
            return Response({
                'success': False,
                'message': 'An error occurred. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        """
        Convert lead to Contact, Company, and/or Deal.
        
        Request body:
        {
          "create_contact": true,
          "create_company": true,
          "create_deal": false,
          "deal_name": "Deal with Acme",
          "deal_value": 50000,
          "deal_pipeline_id": "uuid",
          "deal_stage_id": "uuid"
        }
        
        Returns:
        {
          "success": true,
          "lead_id": "uuid",
          "contact_id": "uuid",
          "company_id": "uuid",
          "deal_id": "uuid"
        }
        """
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
            # Create Contact
            if create_contact:
                from crm.models import Contact
                
                # Map lead fields to contact fields
                contact_data = {
                    'org_id': org_id,
                    'owner_id': lead.owner_id or request.user.id,
                }
                
                # Map fields from lead entity_data
                field_mapping = {
                    'first_name': 'first_name',
                    'last_name': 'last_name',
                    'email': 'email',
                    'phone': 'phone',
                    'mobile': 'mobile',
                    'job_title': 'title',
                    'department': 'department',
                    'linkedin_url': 'linkedin_url',
                    'description': 'description',
                }
                
                for lead_field, contact_field in field_mapping.items():
                    value = lead.entity_data.get(lead_field)
                    if value:
                        contact_data[contact_field] = value
                
                # Check if contact already exists
                email = lead.entity_data.get('email')
                existing_contact = None
                if email:
                    existing_contact = Contact.objects.filter(
                        org_id=org_id,
                        email__iexact=email
                    ).first()
                
                if existing_contact:
                    contact = existing_contact
                else:
                    contact = Contact.objects.create(**contact_data)
                
                result['contact_id'] = str(contact.id)
                lead.converted_contact_id = contact.id
            
            # Create Company
            if create_company:
                from crm.models import Company
                
                company_name = lead.entity_data.get('company_name')
                
                if company_name:
                    # Check if company exists
                    existing_company = Company.objects.filter(
                        org_id=org_id,
                        name__iexact=company_name
                    ).first()
                    
                    if existing_company:
                        company = existing_company
                    else:
                        company_data = {
                            'org_id': org_id,
                            'owner_id': lead.owner_id or request.user.id,
                            'name': company_name,
                        }
                        
                        # Map additional fields
                        field_mapping = {
                            'company_website': 'website',
                            'company_phone': 'phone',
                            'company_email': 'email',
                            'company_industry': 'industry',
                            'company_size': 'size',
                            'company_address': 'address',
                            'company_city': 'city',
                            'company_state': 'state',
                            'company_country': 'country',
                            'company_postal_code': 'postal_code',
                        }
                        
                        for lead_field, company_field in field_mapping.items():
                            value = lead.entity_data.get(lead_field)
                            if value:
                                company_data[company_field] = value
                        
                        company = Company.objects.create(**company_data)
                    
                    result['company_id'] = str(company.id)
                    lead.converted_company_id = company.id
                    
                    # Link contact to company if both created
                    if create_contact and contact:
                        contact.primary_company_id = company.id
                        contact.save(update_fields=['primary_company_id'])
            
            # Create Deal
            if create_deal:
                from crm.models import Deal, Pipeline
                
                deal_name = request.data.get('deal_name') or f"Deal with {lead.entity_data.get('first_name', 'Lead')}"
                deal_value = request.data.get('deal_value', 0)
                pipeline_id = request.data.get('deal_pipeline_id')
                stage_id = request.data.get('deal_stage_id')
                
                # Get default pipeline if not specified
                if not pipeline_id:
                    default_pipeline = Pipeline.objects.filter(
                        org_id=org_id,
                        is_active=True
                    ).order_by('created_at').first()
                    
                    if default_pipeline:
                        pipeline_id = default_pipeline.id
                        if not stage_id:
                            # Get first stage
                            first_stage = default_pipeline.stages.order_by('order').first()
                            if first_stage:
                                stage_id = first_stage.id
                
                if pipeline_id and stage_id:
                    deal_data = {
                        'org_id': org_id,
                        'owner_id': lead.owner_id or request.user.id,
                        'name': deal_name,
                        'value': deal_value,
                        'pipeline_id': pipeline_id,
                        'stage_id': stage_id,
                        'status': 'open',
                    }
                    
                    if result['contact_id']:
                        deal_data['contact_id'] = result['contact_id']
                    if result['company_id']:
                        deal_data['company_id'] = result['company_id']
                    
                    deal = Deal.objects.create(**deal_data)
                    result['deal_id'] = str(deal.id)
                    lead.converted_deal_id = deal.id
            
            # Update lead status
            lead.status = LeadV2.Status.CONVERTED
            lead.converted_at = timezone.now()
            lead.save(update_fields=[
                'status', 'converted_at', 'converted_contact_id',
                'converted_company_id', 'converted_deal_id', 'updated_at'
            ])
            
            return Response(result)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Conversion error: {e}", exc_info=True)
            
            return Response({
                'error': 'Conversion failed',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def check_duplicate(self, request):
        """
        Check for duplicate leads by email.
        
        Request body:
        {
          "email": "john@example.com"
        }
        
        Returns:
        {
          "has_duplicates": true,
          "count": 2,
          "duplicates": [...]
        }
        """
        org_id = request.headers.get('X-Org-Id')
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find duplicates
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
        """Get unique lead sources for this organization."""
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
        """
        Get current user's leads only (scope=mine).
        
        Returns paginated list of leads owned by the current user.
        """
        user_id = request.user.id if hasattr(request, 'user') else None
        
        if not user_id:
            return Response(
                {'error': 'User ID not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Filter queryset by current user as owner
        queryset = self.get_queryset().filter(owner_id=user_id)
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        # No pagination
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update lead status.
        
        Request body:
        {
          "status": "contacted"
        }
        """
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
