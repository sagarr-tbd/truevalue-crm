"""
Leads V2 Views

Pure dynamic CRUD operations - ALL fields from FieldDefinition.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count
from django.utils import timezone

from .models import LeadV2
from .serializers import LeadV2Serializer, LeadV2ListSerializer


class LeadV2Pagination(PageNumberPagination):
    """Pagination for LeadV2 list view."""
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


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
        
        # Phase 6: Dynamic sorting
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
    def convert(self, request, pk=None):
        """Convert a lead to Contact + Deal."""
        lead = self.get_object()
        
        if lead.status == LeadV2.Status.CONVERTED:
            return Response(
                {'error': 'Lead is already converted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Implement full conversion logic
        return Response({
            'message': 'Conversion endpoint - implementation pending',
            'lead_id': str(lead.id)
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
        """Bulk update leads."""
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
        
        # Update leads
        leads = LeadV2.objects.filter(id__in=lead_ids, org_id=org_id)
        
        # Only allow safe fields to be bulk updated
        allowed_fields = ['status']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        count = leads.update(**update_data)
        
        return Response({
            'message': f'{count} leads updated successfully',
            'count': count
        })
