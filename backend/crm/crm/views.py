"""
CRM Service API Views.

REST API endpoints for CRM entities.
"""
import logging
from typing import Optional
from uuid import UUID

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    Contact, Company, Lead, Deal, Pipeline, PipelineStage,
    Activity, Tag, CustomFieldDefinition,
)
from .serializers import (
    ContactSerializer, ContactListSerializer,
    ContactCompanySerializer,
    CompanySerializer, CompanyListSerializer,
    LeadSerializer, LeadListSerializer, LeadConvertSerializer,
    DealSerializer, DealListSerializer,
    PipelineSerializer, PipelineListSerializer, PipelineStageSerializer, PipelineStageWriteSerializer,
    ActivitySerializer, ActivityListSerializer,
    TagSerializer,
    CustomFieldDefinitionSerializer,
    GlobalSearchSerializer, DuplicateCheckSerializer, DuplicateResultSerializer,
    ImportResultSerializer, ContactImportSerializer,
    BulkDeleteSerializer, BulkUpdateSerializer, BulkResultSerializer,
)
from .services import (
    ContactService, CompanyService, LeadService, DealService,
    PipelineService, ActivityService, TagService,
)
from .exceptions import CRMException

logger = logging.getLogger(__name__)


class BaseAPIView(APIView):
    """Base view with common functionality."""
    
    permission_classes = [IsAuthenticated]
    
    def get_org_id(self) -> UUID:
        """Get organization ID from request."""
        return UUID(self.request.user.org_id)
    
    def get_user_id(self) -> UUID:
        """Get user ID from request."""
        return UUID(self.request.user.user_id)
    
    def get_service(self, service_class):
        """Get an initialized service instance."""
        return service_class(
            org_id=self.get_org_id(),
            user_id=self.get_user_id()
        )
    
    def get_int_param(
        self, 
        param_name: str, 
        default: int = None, 
        min_value: int = None, 
        max_value: int = None
    ) -> int:
        """
        Safely get and validate an integer query parameter.
        
        Args:
            param_name: Name of the query parameter
            default: Default value if not provided or invalid
            min_value: Minimum allowed value (clamp if lower)
            max_value: Maximum allowed value (clamp if higher)
            
        Returns:
            Validated integer value
        """
        value = self.request.query_params.get(param_name)
        
        if value is None:
            return default
        
        try:
            int_value = int(value)
        except (ValueError, TypeError):
            return default
        
        if min_value is not None and int_value < min_value:
            return min_value
        if max_value is not None and int_value > max_value:
            return max_value
        
        return int_value
    
    def get_uuid_param(self, param_name: str) -> Optional[UUID]:
        """
        Safely get and validate a UUID query parameter.
        
        Args:
            param_name: Name of the query parameter
            
        Returns:
            UUID object or None if not provided or invalid
        """
        value = self.request.query_params.get(param_name)
        
        if not value:
            return None
        
        try:
            return UUID(value)
        except (ValueError, TypeError):
            return None


# =============================================================================
# CONTACT VIEWS
# =============================================================================

class ContactListView(BaseAPIView):
    """List and create contacts."""
    
    def get(self, request):
        """List contacts with filtering."""
        import json
        
        service = self.get_service(ContactService)
        
        # Parse query params
        filters = {}
        owner_id = request.query_params.get('owner_id')
        status_param = request.query_params.get('status')
        company_id = request.query_params.get('company_id')
        search = request.query_params.get('search')
        order_by = request.query_params.get('order_by', '-created_at')
        
        # Parse advanced filters (JSON string)
        advanced_filters = None
        filter_logic = 'and'
        filters_param = request.query_params.get('filters')
        if filters_param:
            try:
                filter_data = json.loads(filters_param)
                advanced_filters = filter_data.get('conditions', [])
                filter_logic = filter_data.get('logic', 'and')
            except (json.JSONDecodeError, TypeError):
                pass  # Invalid JSON, ignore
        
        # Pagination with safe int parsing and bounds
        page = self.get_int_param('page', default=1, min_value=1)
        page_size = self.get_int_param('page_size', default=10, min_value=1, max_value=100)
        offset = (page - 1) * page_size
        
        # Get filtered queryset (without pagination) for count
        filtered_qs = service.list(
            filters=filters,
            search=search,
            order_by=order_by,
            limit=None,  # No limit for count
            offset=0,
            owner_id=UUID(owner_id) if owner_id else None,
            status=status_param,
            company_id=UUID(company_id) if company_id else None,
            advanced_filters=advanced_filters,
            filter_logic=filter_logic,
        )
        
        # Get total count of filtered results
        total = filtered_qs.count()
        
        # Get paginated contacts
        contacts = filtered_qs[offset:offset + page_size]
        
        # Stats should be for all contacts (not filtered)
        stats = service.get_stats()
        
        serializer = ContactListSerializer(contacts, many=True)
        return Response({
            'data': serializer.data,
            'meta': {
                'page': page,
                'page_size': page_size,
                'total': total,
                'stats': stats,
            }
        })
    
    def post(self, request):
        """Create a new contact."""
        serializer = ContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-populate owner_id if not provided
        data = serializer.validated_data
        if not data.get('owner_id'):
            data['owner_id'] = self.get_user_id()
        
        # Check if duplicate check should be skipped (user explicitly confirmed)
        skip_duplicate_check = request.data.get('skip_duplicate_check', False)
        
        service = self.get_service(ContactService)
        contact = service.create(data, skip_duplicate_check=skip_duplicate_check)
        
        return Response(
            ContactSerializer(contact).data,
            status=status.HTTP_201_CREATED
        )


class ContactDetailView(BaseAPIView):
    """Get, update, delete a contact."""
    
    def get(self, request, contact_id):
        """Get contact details."""
        service = self.get_service(ContactService)
        contact = service.get_by_id(contact_id)
        return Response(ContactSerializer(contact).data)
    
    def patch(self, request, contact_id):
        """Update a contact."""
        service = self.get_service(ContactService)
        contact = service.get_by_id(contact_id)
        
        serializer = ContactSerializer(contact, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        contact = service.update(contact_id, serializer.validated_data)
        return Response(ContactSerializer(contact).data)
    
    def delete(self, request, contact_id):
        """Delete a contact."""
        service = self.get_service(ContactService)
        service.delete(contact_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ContactTimelineView(BaseAPIView):
    """Get contact activity timeline."""
    
    def get(self, request, contact_id):
        """Get contact timeline."""
        service = self.get_service(ContactService)
        timeline = service.get_timeline(contact_id)
        return Response({'data': timeline})


class ContactCompaniesView(BaseAPIView):
    """Manage company associations for a contact."""
    
    def get(self, request, contact_id):
        """List all company associations for a contact."""
        service = self.get_service(ContactService)
        contact = service.get_by_id(contact_id)
        associations = contact.company_associations.select_related('company').all()
        return Response({
            'data': ContactCompanySerializer(associations, many=True).data
        })
    
    def post(self, request, contact_id):
        """Add a company association to a contact."""
        service = self.get_service(ContactService)
        
        company_id = request.data.get('company_id')
        if not company_id:
            return Response(
                {'error': 'company_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        association = service.add_company(
            contact_id=contact_id,
            company_id=company_id,
            title=request.data.get('title'),
            department=request.data.get('department'),
            is_primary=request.data.get('is_primary', False),
        )
        return Response(
            ContactCompanySerializer(association).data,
            status=status.HTTP_201_CREATED
        )


class ContactCompanyDetailView(BaseAPIView):
    """Remove a company association from a contact."""
    
    def delete(self, request, contact_id, company_id):
        """Remove a company association."""
        service = self.get_service(ContactService)
        service.remove_company(contact_id, company_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def patch(self, request, contact_id, company_id):
        """Update a company association (title, department, is_primary)."""
        service = self.get_service(ContactService)
        # Re-use add_company which handles upsert
        association = service.add_company(
            contact_id=contact_id,
            company_id=company_id,
            title=request.data.get('title'),
            department=request.data.get('department'),
            is_primary=request.data.get('is_primary', False),
        )
        return Response(ContactCompanySerializer(association).data)


class ContactImportView(BaseAPIView):
    """Bulk import contacts."""
    
    def post(self, request):
        """Import contacts from list."""
        serializer = ContactImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(ContactService)
        result = service.bulk_import(**serializer.validated_data)
        
        return Response(ImportResultSerializer(result).data)


class ContactBulkDeleteView(BaseAPIView):
    """Bulk delete contacts."""
    
    def post(self, request):
        """Delete multiple contacts by IDs."""
        serializer = BulkDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(ContactService)
        result = service.bulk_delete(serializer.validated_data['ids'])
        
        return Response(BulkResultSerializer(result).data)


class ContactBulkUpdateView(BaseAPIView):
    """Bulk update contacts."""
    
    def post(self, request):
        """Update multiple contacts with the same data."""
        serializer = BulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(ContactService)
        result = service.bulk_update(
            serializer.validated_data['ids'],
            serializer.validated_data['data']
        )
        
        return Response(BulkResultSerializer(result).data)


class ContactMergeView(BaseAPIView):
    """Merge two contacts into one."""
    
    def post(self, request):
        """
        Merge two contacts.
        
        The secondary contact will be deleted after merging its data
        into the primary contact.
        """
        from .serializers import ContactMergeSerializer, ContactMergeResultSerializer
        
        serializer = ContactMergeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(ContactService)
        
        try:
            merged_contact = service.merge(
                primary_id=serializer.validated_data['primary_id'],
                secondary_id=serializer.validated_data['secondary_id'],
                merge_strategy=serializer.validated_data.get('merge_strategy', 'keep_primary')
            )
            
            # Build result with model object (ContactMergeResultSerializer will serialize it)
            result = {
                'success': True,
                'merged_contact': merged_contact,
                'message': 'Contacts merged successfully'
            }
            
            return Response(ContactMergeResultSerializer(result).data)
        except CRMException:
            # Let the custom exception handler deal with CRM errors
            raise
        except Exception as e:
            # Log the full exception for debugging, return generic message
            logger.exception(f"Contact merge failed: {e}")
            return Response({
                'success': False,
                'message': 'Contact merge failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# COMPANY VIEWS
# =============================================================================

class CompanyListView(BaseAPIView):
    """List and create companies."""
    
    def get(self, request):
        """List companies with pagination, filtering, and stats."""
        import json
        
        service = self.get_service(CompanyService)
        
        # Parse query params
        search = request.query_params.get('search')
        industry = request.query_params.get('industry')
        size = request.query_params.get('size')
        owner_id = request.query_params.get('owner_id')
        order_by = request.query_params.get('order_by', '-created_at')
        
        # Parse advanced filters (JSON string) - consistent with Lead/Contact views
        advanced_filters = None
        filter_logic = 'and'
        filters_param = request.query_params.get('filters')
        if filters_param:
            try:
                filter_data = json.loads(filters_param)
                advanced_filters = filter_data.get('conditions', [])
                filter_logic = filter_data.get('logic', 'and')
            except (json.JSONDecodeError, TypeError):
                pass  # Invalid JSON, ignore
        
        # Pagination with safe int parsing and bounds
        page = self.get_int_param('page', default=1, min_value=1)
        page_size = self.get_int_param('page_size', default=10, min_value=1, max_value=100)
        offset = (page - 1) * page_size
        
        # Get filtered queryset (without pagination) for count
        filtered_qs = service.list(
            search=search,
            order_by=order_by,
            limit=None,  # No limit for count
            offset=0,
            owner_id=UUID(owner_id) if owner_id else None,
            industry=industry,
            size=size,
            advanced_filters=advanced_filters,
            filter_logic=filter_logic,
        )
        
        # Get total count of filtered results
        total = filtered_qs.count()
        
        # Get paginated companies
        companies = filtered_qs[offset:offset + page_size]
        
        # Get aggregate stats (for all companies, not filtered)
        stats = service.get_aggregate_stats()
        
        serializer = CompanyListSerializer(companies, many=True)
        return Response({
            'data': serializer.data,
            'meta': {
                'page': page,
                'page_size': page_size,
                'total': total,
                'stats': stats,
            }
        })
    
    def post(self, request):
        """Create a new company."""
        serializer = CompanySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-populate owner_id if not provided
        data = serializer.validated_data
        if not data.get('owner_id'):
            data['owner_id'] = self.get_user_id()
        
        service = self.get_service(CompanyService)
        company = service.create(data)
        
        return Response(
            CompanySerializer(company).data,
            status=status.HTTP_201_CREATED
        )


class CompanyDetailView(BaseAPIView):
    """Get, update, delete a company."""
    
    def get(self, request, company_id):
        """Get company details."""
        service = self.get_service(CompanyService)
        company = service.get_by_id(company_id)
        return Response(CompanySerializer(company).data)
    
    def patch(self, request, company_id):
        """Update a company."""
        service = self.get_service(CompanyService)
        company = service.get_by_id(company_id)
        
        serializer = CompanySerializer(company, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        company = service.update(company_id, serializer.validated_data)
        return Response(CompanySerializer(company).data)
    
    def delete(self, request, company_id):
        """Delete a company."""
        service = self.get_service(CompanyService)
        service.delete(company_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CompanyContactsView(BaseAPIView):
    """Get and link contacts for a company."""
    
    def get(self, request, company_id):
        """Get company contacts with relationship details."""
        service = self.get_service(CompanyService)
        contacts = service.get_contacts(company_id)
        return Response({
            'data': ContactListSerializer(contacts, many=True).data
        })
    
    def post(self, request, company_id):
        """Link a contact to this company."""
        contact_id = request.data.get('contact_id')
        if not contact_id:
            return Response(
                {'error': 'contact_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contact_service = self.get_service(ContactService)
        association = contact_service.add_company(
            contact_id=contact_id,
            company_id=company_id,
            title=request.data.get('title'),
            department=request.data.get('department'),
            is_primary=request.data.get('is_primary', False),
        )
        return Response(
            ContactCompanySerializer(association).data,
            status=status.HTTP_201_CREATED
        )


class CompanyContactDetailView(BaseAPIView):
    """Remove a contact from a company."""
    
    def delete(self, request, company_id, contact_id):
        """Unlink a contact from this company."""
        contact_service = self.get_service(ContactService)
        contact_service.remove_company(contact_id, company_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CompanyStatsView(BaseAPIView):
    """Get company statistics."""
    
    def get(self, request, company_id):
        """Get company stats."""
        service = self.get_service(CompanyService)
        stats = service.get_stats(company_id)
        return Response(stats)


# =============================================================================
# LEAD VIEWS
# =============================================================================

class LeadListView(BaseAPIView):
    """List and create leads."""
    
    def get(self, request):
        """List leads."""
        import json
        
        service = self.get_service(LeadService)
        
        search = request.query_params.get('search')
        status_param = request.query_params.get('status')
        source = request.query_params.get('source')
        order_by = request.query_params.get('order_by', '-created_at')
        
        # Parse advanced filters (JSON string)
        advanced_filters = None
        filter_logic = 'and'
        filters_param = request.query_params.get('filters')
        if filters_param:
            try:
                filter_data = json.loads(filters_param)
                advanced_filters = filter_data.get('conditions', [])
                filter_logic = filter_data.get('logic', 'and')
            except (json.JSONDecodeError, TypeError):
                pass  # Invalid JSON, ignore
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        offset = (page - 1) * page_size
        
        # Get filtered queryset (without pagination) for count
        filtered_qs = service.list(
            search=search,
            status=status_param,
            source=source,
            order_by=order_by,
            limit=None,  # No limit for count
            offset=0,
            advanced_filters=advanced_filters,
            filter_logic=filter_logic,
        )
        
        # Get total count of filtered results
        total = filtered_qs.count()
        
        # Get paginated leads
        leads = filtered_qs[offset:offset + page_size]
        
        # Get stats for all leads (not filtered)
        stats = service.get_stats()
        
        serializer = LeadListSerializer(leads, many=True)
        return Response({
            'data': serializer.data,
            'meta': {
                'page': page,
                'page_size': page_size,
                'total': total,
                'stats': stats,
            }
        })
    
    def post(self, request):
        """Create a new lead."""
        serializer = LeadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-populate owner_id if not provided
        data = serializer.validated_data
        if not data.get('owner_id'):
            data['owner_id'] = self.get_user_id()
        
        service = self.get_service(LeadService)
        lead = service.create(data)
        
        return Response(
            LeadSerializer(lead).data,
            status=status.HTTP_201_CREATED
        )


class LeadDetailView(BaseAPIView):
    """Get, update, delete a lead."""
    
    def get(self, request, lead_id):
        """Get lead details."""
        service = self.get_service(LeadService)
        lead = service.get_by_id(lead_id)
        return Response(LeadSerializer(lead).data)
    
    def patch(self, request, lead_id):
        """Update a lead."""
        service = self.get_service(LeadService)
        lead = service.get_by_id(lead_id)
        
        serializer = LeadSerializer(lead, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        lead = service.update(lead_id, serializer.validated_data)
        return Response(LeadSerializer(lead).data)
    
    def delete(self, request, lead_id):
        """Delete a lead."""
        service = self.get_service(LeadService)
        service.delete(lead_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class LeadConvertView(BaseAPIView):
    """Convert a lead to contact/company/deal."""
    
    def post(self, request, lead_id):
        """Convert lead."""
        serializer = LeadConvertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(LeadService)
        result = service.convert(lead_id, **serializer.validated_data)
        
        return Response(result)


class LeadDisqualifyView(BaseAPIView):
    """Disqualify a lead."""
    
    def post(self, request, lead_id):
        """Disqualify lead."""
        reason = request.data.get('reason', 'Not qualified')
        
        service = self.get_service(LeadService)
        lead = service.disqualify(lead_id, reason)
        
        return Response(LeadSerializer(lead).data)


class LeadBulkDeleteView(BaseAPIView):
    """Bulk delete leads."""
    
    def post(self, request):
        """Delete multiple leads by IDs."""
        serializer = BulkDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(LeadService)
        result = service.bulk_delete(serializer.validated_data['ids'])
        
        return Response(BulkResultSerializer(result).data)


class LeadBulkUpdateView(BaseAPIView):
    """Bulk update leads."""
    
    def post(self, request):
        """Update multiple leads with the same data."""
        serializer = BulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(LeadService)
        result = service.bulk_update(
            serializer.validated_data['ids'],
            serializer.validated_data['data']
        )
        
        return Response(BulkResultSerializer(result).data)


# =============================================================================
# DEAL VIEWS
# =============================================================================

class DealListView(BaseAPIView):
    """List and create deals."""
    
    def get(self, request):
        """List deals with filtering, pagination, and search."""
        import json
        
        service = self.get_service(DealService)
        
        # Parse query parameters
        search = request.query_params.get('search')
        status_param = request.query_params.get('status')
        pipeline_id = request.query_params.get('pipeline_id')
        stage_id = request.query_params.get('stage_id')
        owner_id = request.query_params.get('owner_id')
        contact_id = request.query_params.get('contact_id')
        company_id = request.query_params.get('company_id')
        order_by = request.query_params.get('order_by', '-created_at')
        
        # Parse advanced filters (JSON string)
        advanced_filters = None
        filter_logic = 'and'
        filters_param = request.query_params.get('filters')
        if filters_param:
            try:
                filter_data = json.loads(filters_param)
                advanced_filters = filter_data.get('conditions', [])
                filter_logic = filter_data.get('logic', 'and')
            except (json.JSONDecodeError, TypeError):
                pass  # Invalid JSON, ignore
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        offset = (page - 1) * page_size
        
        # Build filter kwargs
        filter_kwargs = {
            'search': search,
            'status': status_param,
            'pipeline_id': UUID(pipeline_id) if pipeline_id else None,
            'stage_id': UUID(stage_id) if stage_id else None,
            'owner_id': UUID(owner_id) if owner_id else None,
            'contact_id': UUID(contact_id) if contact_id else None,
            'company_id': UUID(company_id) if company_id else None,
            'order_by': order_by,
            'advanced_filters': advanced_filters,
            'filter_logic': filter_logic,
        }
        
        # Get paginated deals
        deals = service.list(
            **filter_kwargs,
            limit=page_size,
            offset=offset,
        )
        
        # Get total count with same filters (no limit/offset for count)
        # Use .count() for efficiency instead of loading all objects
        total = service.list(**filter_kwargs).count()
        
        # Calculate stats from all deals (not filtered) using aggregation
        from django.db.models import Sum, Count, Q
        from .models import Deal
        stats_aggregation = Deal.objects.filter(
            org_id=service.org_id
        ).aggregate(
            total_count=Count('id'),
            total_value=Sum('value'),
            won_count=Count('id', filter=Q(status='won')),
            won_value=Sum('value', filter=Q(status='won')),
            lost_count=Count('id', filter=Q(status='lost')),
            lost_value=Sum('value', filter=Q(status='lost')),
            open_count=Count('id', filter=Q(status='open')),
            open_value=Sum('value', filter=Q(status='open')),
        )
        total_count = stats_aggregation['total_count'] or 0
        total_value = float(stats_aggregation['total_value'] or 0)
        won_value = float(stats_aggregation['won_value'] or 0)
        lost_value = float(stats_aggregation['lost_value'] or 0)
        open_value = float(stats_aggregation['open_value'] or 0)
        
        # Build stats using aggregation results (no Python loop needed)
        by_status = {
            'open': stats_aggregation['open_count'] or 0,
            'won': stats_aggregation['won_count'] or 0,
            'lost': stats_aggregation['lost_count'] or 0,
        }
        
        stats = {
            'total': total_count,
            'by_status': by_status,
            'total_value': total_value,
            'open_value': open_value,
            'won_value': won_value,
            'lost_value': lost_value,
            'avg_deal_size': total_value / total_count if total_count > 0 else 0,
        }
        
        serializer = DealListSerializer(deals, many=True)
        return Response({
            'data': serializer.data,
            'meta': {
                'page': page,
                'page_size': page_size,
                'total': total,
                'stats': stats,
            }
        })
    
    def post(self, request):
        """Create a new deal."""
        serializer = DealSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-populate owner_id if not provided
        data = serializer.validated_data
        if not data.get('owner_id'):
            data['owner_id'] = self.get_user_id()
        
        service = self.get_service(DealService)
        deal = service.create(data)
        
        return Response(
            DealSerializer(deal).data,
            status=status.HTTP_201_CREATED
        )


class DealDetailView(BaseAPIView):
    """Get, update, delete a deal."""
    
    def get(self, request, deal_id):
        """Get deal details."""
        service = self.get_service(DealService)
        deal = service.get_by_id(deal_id)
        return Response(DealSerializer(deal).data)
    
    def patch(self, request, deal_id):
        """Update a deal."""
        service = self.get_service(DealService)
        deal = service.get_by_id(deal_id)
        
        serializer = DealSerializer(deal, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        deal = service.update(deal_id, serializer.validated_data)
        return Response(DealSerializer(deal).data)
    
    def delete(self, request, deal_id):
        """Delete a deal."""
        service = self.get_service(DealService)
        service.delete(deal_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DealKanbanView(BaseAPIView):
    """Get deals in Kanban format."""
    
    def get(self, request, pipeline_id):
        """Get Kanban board data."""
        service = self.get_service(DealService)
        kanban = service.get_kanban(pipeline_id)
        return Response(kanban)


class DealMoveStageView(BaseAPIView):
    """Move deal to a different stage."""
    
    def post(self, request, deal_id):
        """Move deal stage."""
        stage_id = request.data.get('stage_id')
        if not stage_id:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'stage_id is required'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            stage_uuid = UUID(stage_id)
        except (ValueError, TypeError):
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Invalid stage_id format'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = self.get_service(DealService)
        deal = service.move_stage(deal_id, stage_uuid)
        
        return Response(DealSerializer(deal).data)


class DealWinView(BaseAPIView):
    """Mark deal as won."""
    
    def post(self, request, deal_id):
        """Win deal."""
        service = self.get_service(DealService)
        deal = service.win(deal_id)
        return Response(DealSerializer(deal).data)


class DealLoseView(BaseAPIView):
    """Mark deal as lost."""
    
    def post(self, request, deal_id):
        """Lose deal."""
        loss_reason = request.data.get('loss_reason', 'Unknown')
        loss_notes = request.data.get('loss_notes')
        
        service = self.get_service(DealService)
        deal = service.lose(deal_id, loss_reason, loss_notes)
        
        return Response(DealSerializer(deal).data)


class DealReopenView(BaseAPIView):
    """Reopen a closed deal."""
    
    def post(self, request, deal_id):
        """Reopen deal."""
        stage_id = request.data.get('stage_id')
        stage_uuid = None
        
        if stage_id:
            try:
                stage_uuid = UUID(stage_id)
            except (ValueError, TypeError):
                return Response(
                    {'error': {'code': 'VALIDATION_ERROR', 'message': 'Invalid stage_id format'}},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        service = self.get_service(DealService)
        deal = service.reopen(deal_id, stage_uuid)
        
        return Response(DealSerializer(deal).data)


class DealForecastView(BaseAPIView):
    """Get deal forecast."""
    
    def get(self, request):
        """Get forecast."""
        try:
            days = int(request.query_params.get('days', 30))
            # Validate days is within reasonable range
            if days < 1 or days > 365:
                return Response(
                    {'error': {'code': 'VALIDATION_ERROR', 'message': 'days must be between 1 and 365'}},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Invalid days parameter'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = self.get_service(DealService)
        forecast = service.get_forecast(days)
        
        return Response(forecast)


class DealBulkDeleteView(BaseAPIView):
    """Bulk delete deals."""
    
    def post(self, request):
        """Delete multiple deals by IDs."""
        serializer = BulkDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(DealService)
        result = service.bulk_delete(serializer.validated_data['ids'])
        
        return Response(BulkResultSerializer(result).data)


# =============================================================================
# PIPELINE VIEWS
# =============================================================================

class PipelineListView(BaseAPIView):
    """List and create pipelines."""
    
    def get(self, request):
        """List pipelines."""
        service = self.get_service(PipelineService)
        is_active = request.query_params.get('is_active')
        
        pipelines = service.list(
            is_active=is_active.lower() == 'true' if is_active else None
        )
        
        serializer = PipelineListSerializer(pipelines, many=True)
        return Response({'data': serializer.data})
    
    def post(self, request):
        """Create a new pipeline."""
        serializer = PipelineSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(PipelineService)
        pipeline = service.create(serializer.validated_data)
        
        return Response(
            PipelineSerializer(pipeline).data,
            status=status.HTTP_201_CREATED
        )


class PipelineDetailView(BaseAPIView):
    """Get, update, delete a pipeline."""
    
    def get(self, request, pipeline_id):
        """Get pipeline with stages."""
        service = self.get_service(PipelineService)
        pipeline = service.get_by_id(pipeline_id)
        return Response(PipelineSerializer(pipeline).data)
    
    def patch(self, request, pipeline_id):
        """Update a pipeline."""
        service = self.get_service(PipelineService)
        pipeline = service.get_by_id(pipeline_id)
        
        serializer = PipelineSerializer(pipeline, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        pipeline = service.update(pipeline_id, serializer.validated_data)
        return Response(PipelineSerializer(pipeline).data)
    
    def delete(self, request, pipeline_id):
        """Delete a pipeline."""
        service = self.get_service(PipelineService)
        service.delete(pipeline_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PipelineStatsView(BaseAPIView):
    """Get pipeline statistics."""
    
    def get(self, request, pipeline_id):
        """Get pipeline stats."""
        service = self.get_service(DealService)
        stats = service.get_pipeline_stats(pipeline_id)
        return Response(stats)


class PipelineStageListView(BaseAPIView):
    """List and create pipeline stages."""
    
    def get(self, request, pipeline_id):
        """List stages."""
        service = self.get_service(PipelineService)
        stages = service.get_stages(pipeline_id)
        return Response({
            'data': PipelineStageSerializer(stages, many=True).data
        })
    
    def post(self, request, pipeline_id):
        """Create a new stage."""
        # Use write serializer for input validation (pipeline_id comes from URL, not body)
        serializer = PipelineStageWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(PipelineService)
        stage = service.create_stage(pipeline_id, serializer.validated_data)
        
        # Return with read serializer
        return Response(
            PipelineStageSerializer(stage).data,
            status=status.HTTP_201_CREATED
        )


class PipelineStageDetailView(BaseAPIView):
    """Update, delete a pipeline stage."""
    
    def patch(self, request, pipeline_id, stage_id):
        """Update a stage."""
        # Use write serializer for input validation with partial=True for PATCH
        serializer = PipelineStageWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(PipelineService)
        stage = service.update_stage(stage_id, serializer.validated_data)
        
        # Return with read serializer
        return Response(PipelineStageSerializer(stage).data)
    
    def delete(self, request, pipeline_id, stage_id):
        """Delete a stage."""
        service = self.get_service(PipelineService)
        service.delete_stage(stage_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PipelineStageReorderView(BaseAPIView):
    """Reorder pipeline stages."""
    
    def post(self, request, pipeline_id):
        """Reorder stages."""
        stage_order = request.data.get('stage_order', [])
        
        service = self.get_service(PipelineService)
        stages = service.reorder_stages(
            pipeline_id,
            [UUID(s) for s in stage_order]
        )
        
        return Response({
            'data': PipelineStageSerializer(stages, many=True).data
        })


# =============================================================================
# ACTIVITY VIEWS
# =============================================================================

class ActivityListView(BaseAPIView):
    """List and create activities."""
    
    def get(self, request):
        """List activities."""
        service = self.get_service(ActivityService)
        
        search = request.query_params.get('search')
        activity_type = request.query_params.get('type')
        status_param = request.query_params.get('status')
        contact_id = request.query_params.get('contact_id')
        deal_id = request.query_params.get('deal_id')
        overdue = request.query_params.get('overdue')
        order_by = request.query_params.get('order_by', '-created_at')
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        offset = (page - 1) * page_size
        
        activities = service.list(
            search=search,
            activity_type=activity_type,
            status=status_param,
            contact_id=UUID(contact_id) if contact_id else None,
            deal_id=UUID(deal_id) if deal_id else None,
            overdue=overdue.lower() == 'true' if overdue else None,
            order_by=order_by,
            limit=page_size,
            offset=offset,
        )
        
        total = service.count()
        
        serializer = ActivityListSerializer(activities, many=True)
        return Response({
            'data': serializer.data,
            'meta': {'page': page, 'page_size': page_size, 'total': total}
        })
    
    def post(self, request):
        """Create a new activity."""
        serializer = ActivitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Auto-populate owner_id if not provided
        data = serializer.validated_data
        user_id = self.get_user_id()
        if not data.get('owner_id'):
            data['owner_id'] = user_id
        
        service = self.get_service(ActivityService)
        activity = service.create(data)
        
        return Response(
            {'data': ActivitySerializer(activity).data},
            status=status.HTTP_201_CREATED
        )


class ActivityDetailView(BaseAPIView):
    """Get, update, delete an activity."""
    
    def get(self, request, activity_id):
        """Get activity details."""
        service = self.get_service(ActivityService)
        activity = service.get_by_id(activity_id)
        return Response(ActivitySerializer(activity).data)
    
    def patch(self, request, activity_id):
        """Update an activity."""
        service = self.get_service(ActivityService)
        activity = service.get_by_id(activity_id)
        
        serializer = ActivitySerializer(activity, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        activity = service.update(activity_id, serializer.validated_data)
        return Response(ActivitySerializer(activity).data)
    
    def delete(self, request, activity_id):
        """Delete an activity."""
        service = self.get_service(ActivityService)
        service.delete(activity_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActivityCompleteView(BaseAPIView):
    """Mark activity as complete."""
    
    def post(self, request, activity_id):
        """Complete activity."""
        service = self.get_service(ActivityService)
        activity = service.complete(activity_id)
        return Response(ActivitySerializer(activity).data)


class ActivityUpcomingView(BaseAPIView):
    """Get upcoming activities."""
    
    def get(self, request):
        """Get upcoming activities."""
        days = int(request.query_params.get('days', 7))
        
        service = self.get_service(ActivityService)
        activities = service.get_upcoming(
            user_id=self.get_user_id(),
            days=days
        )
        
        return Response({
            'data': ActivityListSerializer(activities, many=True).data
        })


class ActivityOverdueView(BaseAPIView):
    """Get overdue activities."""
    
    def get(self, request):
        """Get overdue activities."""
        service = self.get_service(ActivityService)
        activities = service.get_overdue(user_id=self.get_user_id())
        
        return Response({
            'data': ActivityListSerializer(activities, many=True).data
        })


class ActivityStatsView(BaseAPIView):
    """Get activity statistics."""
    
    def get(self, request):
        """Get activity stats."""
        service = self.get_service(ActivityService)
        stats = service.get_stats(user_id=self.get_user_id())
        return Response(stats)


class ActivityTrendView(BaseAPIView):
    """Get activity trend data for charts."""
    
    def get(self, request):
        """Get daily activity counts grouped by type."""
        days_param = request.query_params.get('days', '30')
        try:
            days = int(days_param)
            days = max(1, min(days, 365))
        except (ValueError, TypeError):
            days = 30
        
        service = self.get_service(ActivityService)
        trend = service.get_activity_trend(days=days)
        return Response({'data': trend})


# =============================================================================
# TAG VIEWS
# =============================================================================

class TagListView(BaseAPIView):
    """List and create tags."""
    
    def get(self, request):
        """List tags."""
        service = self.get_service(TagService)
        entity_type = request.query_params.get('entity_type')
        
        tags = service.get_with_counts(entity_type)
        return Response({'data': tags})
    
    def post(self, request):
        """Create a new tag."""
        serializer = TagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = self.get_service(TagService)
        tag = service.create(serializer.validated_data)
        
        return Response(
            TagSerializer(tag).data,
            status=status.HTTP_201_CREATED
        )


class TagDetailView(BaseAPIView):
    """Get, update, delete a tag."""
    
    def get(self, request, tag_id):
        """Get tag details."""
        service = self.get_service(TagService)
        tag = service.get_by_id(tag_id)
        return Response(TagSerializer(tag).data)
    
    def patch(self, request, tag_id):
        """Update a tag."""
        service = self.get_service(TagService)
        tag = service.get_by_id(tag_id)
        
        serializer = TagSerializer(tag, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        tag = service.update(tag_id, serializer.validated_data)
        return Response(TagSerializer(tag).data)
    
    def delete(self, request, tag_id):
        """Delete a tag."""
        service = self.get_service(TagService)
        service.delete(tag_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# CUSTOM FIELD VIEWS
# =============================================================================

class CustomFieldListView(BaseAPIView):
    """List and create custom fields."""
    
    def get(self, request):
        """List custom fields."""
        entity_type = request.query_params.get('entity_type')
        
        qs = CustomFieldDefinition.objects.filter(org_id=self.get_org_id())
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        
        serializer = CustomFieldDefinitionSerializer(qs, many=True)
        return Response({'data': serializer.data})
    
    def post(self, request):
        """Create a custom field."""
        serializer = CustomFieldDefinitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        data['org_id'] = self.get_org_id()
        
        field = CustomFieldDefinition.objects.create(**data)
        return Response(
            CustomFieldDefinitionSerializer(field).data,
            status=status.HTTP_201_CREATED
        )


class CustomFieldDetailView(BaseAPIView):
    """Get, update, delete a custom field."""
    
    def patch(self, request, field_id):
        """Update a custom field."""
        try:
            field = CustomFieldDefinition.objects.get(
                id=field_id,
                org_id=self.get_org_id()
            )
        except CustomFieldDefinition.DoesNotExist:
            return Response(
                {'error': {'code': 'NOT_FOUND', 'message': 'Custom field not found'}},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CustomFieldDefinitionSerializer(field, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        for key, value in serializer.validated_data.items():
            setattr(field, key, value)
        field.save()
        
        return Response(CustomFieldDefinitionSerializer(field).data)
    
    def delete(self, request, field_id):
        """Delete a custom field."""
        CustomFieldDefinition.objects.filter(
            id=field_id,
            org_id=self.get_org_id()
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# SEARCH & UTILITY VIEWS
# =============================================================================

class GlobalSearchView(BaseAPIView):
    """Global search across all entities."""
    
    def get(self, request):
        """Search all entities."""
        query = request.query_params.get('q', '')
        limit = int(request.query_params.get('limit', 5))
        
        if not query or len(query) < 2:
            return Response({
                'contacts': [],
                'companies': [],
                'deals': [],
                'leads': [],
            })
        
        org_id = self.get_org_id()
        
        contacts = Contact.objects.filter(
            org_id=org_id
        ).filter(
            models.Q(first_name__icontains=query) |
            models.Q(last_name__icontains=query) |
            models.Q(email__icontains=query)
        )[:limit]
        
        companies = Company.objects.filter(
            org_id=org_id,
            name__icontains=query
        )[:limit]
        
        deals = Deal.objects.filter(
            org_id=org_id,
            name__icontains=query
        )[:limit]
        
        leads = Lead.objects.filter(
            org_id=org_id
        ).filter(
            models.Q(first_name__icontains=query) |
            models.Q(last_name__icontains=query) |
            models.Q(email__icontains=query)
        )[:limit]
        
        return Response({
            'contacts': ContactListSerializer(contacts, many=True).data,
            'companies': CompanyListSerializer(companies, many=True).data,
            'deals': DealListSerializer(deals, many=True).data,
            'leads': LeadListSerializer(leads, many=True).data,
        })


class DuplicateCheckView(BaseAPIView):
    """Check for duplicates."""
    
    def post(self, request):
        """Check for duplicates."""
        serializer = DuplicateCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        entity_type = data['entity_type']
        
        if entity_type == 'contact':
            service = self.get_service(ContactService)
        elif entity_type == 'company':
            service = self.get_service(CompanyService)
        elif entity_type == 'lead':
            service = self.get_service(LeadService)
        else:
            return Response({'has_duplicates': False, 'duplicates': []})
        
        duplicates = service.check_duplicates(
            email=data.get('email'),
            phone=data.get('phone'),
            name=data.get('name'),
        )
        
        return Response({
            'has_duplicates': len(duplicates) > 0,
            'duplicates': [
                {'id': str(d.id), 'name': str(d)}
                for d in duplicates
            ],
            'match_field': 'email' if data.get('email') else 'phone' if data.get('phone') else 'name',
        })


# =============================================================================
# WEB FORM LEAD CAPTURE (Public Endpoint)
# =============================================================================

class LeadWebFormView(APIView):
    """
    Public endpoint for capturing leads from website forms.
    
    No authentication required - validates by org API key or form token.
    """
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Capture lead from web form.
        
        Expected payload:
        {
            "org_id": "uuid",  # Required - Organization ID
            "form_token": "string",  # Optional - Form validation token
            "first_name": "string",
            "last_name": "string",
            "email": "string",
            "phone": "string",  # Optional
            "company_name": "string",  # Optional
            "message": "string",  # Optional - Goes to description
            "source_detail": "string",  # Optional - e.g., "Contact Us Page"
            "utm_source": "string",  # Optional
            "utm_medium": "string",  # Optional
            "utm_campaign": "string",  # Optional
        }
        """
        from .serializers import LeadWebFormSerializer
        
        serializer = LeadWebFormSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        org_id = data.pop('org_id')
        
        # Build lead data
        lead_data = {
            'org_id': org_id,
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'email': data['email'],
            'phone': data.get('phone'),
            'company_name': data.get('company_name'),
            'description': data.get('message'),
            'source': 'website',
            'source_detail': data.get('source_detail', 'Web Form'),
            'status': 'new',
            'custom_fields': {},
        }
        
        # Add UTM parameters to custom fields
        utm_fields = ['utm_source', 'utm_medium', 'utm_campaign']
        for field in utm_fields:
            if data.get(field):
                lead_data['custom_fields'][field] = data[field]
        
        # Initialize service without user (system operation)
        # For web forms, we'll assign owner later via auto-assignment
        service = LeadService(org_id=org_id, user_id=None)
        
        try:
            # Check for duplicates
            duplicates = service.check_duplicates(email=lead_data['email'])
            
            if duplicates:
                # Lead exists - log activity instead of creating duplicate
                existing_lead = duplicates[0]
                
                # Create activity on existing lead
                activity_service = ActivityService(org_id=org_id, user_id=None)
                activity_service.create({
                    'org_id': org_id,
                    'owner_id': existing_lead.owner_id,
                    'activity_type': 'note',
                    'subject': 'New web form submission',
                    'description': f"New inquiry from web form:\n\n{data.get('message', 'No message')}",
                    'lead': existing_lead,
                    'status': 'completed',
                })
                
                return Response({
                    'success': True,
                    'message': 'Thank you for your inquiry. We will contact you soon.',
                    'lead_id': str(existing_lead.id),
                    'is_new': False,
                }, status=status.HTTP_200_OK)
            
            # Create new lead
            lead = service.create(lead_data)
            
            # TODO: Auto-assign owner (round-robin or territory-based)
            # TODO: Send notification to owner
            # TODO: Publish lead.created event to Kafka
            
            return Response({
                'success': True,
                'message': 'Thank you for your inquiry. We will contact you soon.',
                'lead_id': str(lead.id),
                'is_new': True,
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Web form lead capture error: {e}")
            return Response({
                'success': False,
                'message': 'We encountered an error. Please try again later.',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LeadSourcesView(BaseAPIView):
    """Get available lead sources."""
    
    def get(self, request):
        """Get unique lead sources for this org."""
        service = self.get_service(LeadService)
        sources = service.get_sources()
        return Response({'data': sources})


class LeadStatusUpdateView(BaseAPIView):
    """Update lead status."""
    
    def post(self, request, lead_id):
        """Update lead status."""
        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'status is required'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = self.get_service(LeadService)
        lead = service.update_status(lead_id, new_status)
        
        return Response(LeadSerializer(lead).data)


# Import models for global search
from django.db import models
