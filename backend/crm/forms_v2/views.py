"""
Forms V2 Views.

REST API endpoints for FormDefinition (Form Builder Architecture).
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import FormDefinition
from .serializers import (
    FormDefinitionSerializer,
    FormDefinitionListSerializer,
    FormSchemaSerializer,
)
from .default_schemas import (
    get_default_lead_schema,
    get_default_contact_schema,
    get_default_company_schema,
    get_default_deal_schema,
)


class FormDefinitionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing form definitions.
    
    Endpoints:
    - GET    /api/v2/forms/definitions                - List forms
    - POST   /api/v2/forms/definitions                - Create form
    - GET    /api/v2/forms/definitions/{id}           - Get form detail
    - PATCH  /api/v2/forms/definitions/{id}           - Update form
    - DELETE /api/v2/forms/definitions/{id}           - Delete form
    - GET    /api/v2/forms/definitions/get_schema     - Get form schema for entity
    
    Filters:
    - entity_type: Filter by entity
    - form_type: Filter by form type
    - is_default: Filter default forms
    - is_active: Filter active forms
    
    Search:
    - Search by name, description
    
    Ordering:
    - name, entity_type, form_type, created_at
    """
    queryset = FormDefinition.objects.all()
    serializer_class = FormDefinitionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['entity_type', 'form_type', 'is_default', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'entity_type', 'form_type', 'created_at']
    ordering = ['entity_type', 'form_type', 'name']
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == 'list':
            return FormDefinitionListSerializer
        elif self.action == 'get_schema':
            return FormSchemaSerializer
        return FormDefinitionSerializer
    
    def get_queryset(self):
        """Filter queryset by organization."""
        queryset = super().get_queryset()
        
        # Get org_id from authenticated user
        org_id = getattr(self.request.user, 'org_id', None)
        if org_id:
            queryset = queryset.filter(org_id=org_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set org_id and created_by from request user."""
        serializer.save(
            org_id=self.request.user.org_id,
            created_by=self.request.user.id
        )
    
    def perform_update(self, serializer):
        """Set updated_by from request user."""
        serializer.save(updated_by=self.request.user.id)
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete form (soft delete by setting is_active=False).
        
        Default forms cannot be deleted if they're the only form.
        """
        instance = self.get_object()
        
        # Check if this is the only form for this entity/type combo
        if instance.is_default:
            other_forms = FormDefinition.objects.filter(
                org_id=instance.org_id,
                entity_type=instance.entity_type,
                form_type=instance.form_type,
                is_active=True
            ).exclude(id=instance.id)
            
            if not other_forms.exists():
                return Response(
                    {'error': 'Cannot delete the only active form for this entity type'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Soft delete
        instance.is_active = False
        instance.updated_by = request.user.id
        instance.save(update_fields=['is_active', 'updated_by', 'updated_at'])
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'], url_path='get-schema')
    def get_schema(self, request):
        """
        Get complete form schema with field definitions.
        
        GET /api/v2/forms/definitions/get-schema?entity_type=lead&form_type=create
        
        Query Parameters:
        - entity_type (required): lead, contact, company, deal
        - form_type (optional): create, edit, quick_add, web_form (default: create)
        - form_id (optional): Specific form ID (overrides entity_type/form_type)
        
        Returns:
        {
            "id": "uuid",
            "name": "Default Lead Form",
            "entity_type": "lead",
            "form_type": "create",
            "schema": { ... },
            "fields": [ ... ]
        }
        """
        form_id = request.query_params.get('form_id')
        entity_type = request.query_params.get('entity_type')
        form_type = request.query_params.get('form_type', 'create')
        
        org_id = request.user.org_id
        
        # Get form by ID or entity_type/form_type
        if form_id:
            try:
                form = FormDefinition.objects.get(
                    id=form_id,
                    org_id=org_id,
                    is_active=True
                )
            except FormDefinition.DoesNotExist:
                return Response(
                    {'error': 'Form not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif entity_type:
            # Try to get existing form
            form = FormDefinition.objects.filter(
                org_id=org_id,
                entity_type=entity_type,
                form_type=form_type,
                is_default=True,
                is_active=True
            ).first()
            
            # 🎯 AUTO-CREATE if not found (Industry standard: Zoho/HubSpot pattern)
            if not form:
                form = self._auto_create_default_form(
                    org_id=org_id,
                    entity_type=entity_type,
                    form_type=form_type,
                    created_by=request.user.id
                )
        else:
            return Response(
                {'error': 'Either form_id or entity_type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = FormSchemaSerializer(form)
        return Response(serializer.data)
    
    def _auto_create_default_form(self, org_id, entity_type, form_type, created_by):
        """
        Auto-create default form from template.
        
        Industry standard pattern (Zoho/HubSpot/Salesforce):
        Users can start working immediately without manual form setup.
        Forms are auto-created on first access and can be customized later.
        
        Args:
            org_id: Organization UUID
            entity_type: 'lead', 'contact', 'company', or 'deal'
            form_type: 'create', 'edit', etc.
            created_by: User ID who triggered creation
        
        Returns:
            FormDefinition: Newly created form
        """
        # Get default schema based on entity type
        schema_getters = {
            'lead': get_default_lead_schema,
            'contact': get_default_contact_schema,
            'company': get_default_company_schema,
            'deal': get_default_deal_schema,
        }
        
        schema_getter = schema_getters.get(entity_type)
        if not schema_getter:
            raise ValueError(f"No default schema available for entity type: {entity_type}")
        
        schema = schema_getter()
        
        # Create FormDefinition record
        form = FormDefinition.objects.create(
            org_id=org_id,
            entity_type=entity_type,
            form_type=form_type,
            name=f'Default {entity_type.title()} Form',
            description=f'Auto-generated default form for {entity_type}. You can customize this form via the layout editor.',
            is_default=True,
            is_active=True,
            schema=schema,
            created_by=created_by
        )
        
        return form
    
    @action(detail=False, methods=['get'], url_path='lookup-options')
    def lookup_options(self, request):
        """
        Get options for lookup fields (Phase 4).
        
        GET /api/v2/forms/definitions/lookup-options?entity=user
        GET /api/v2/forms/definitions/lookup-options?entity=company
        GET /api/v2/forms/definitions/lookup-options?entity=contact
        
        Returns list of entities for dropdown selectors.
        """
        entity = request.query_params.get('entity')
        org_id = request.user.org_id if hasattr(request.user, 'org_id') else None
        
        if not org_id:
            return Response(
                {'error': 'Organization ID not found in token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if entity == 'user':
            # Fetch organization members using the existing utility function
            # This handles service-to-service auth properly
            from crm.utils import fetch_member_names
            import logging
            
            logger = logging.getLogger(__name__)
            
            try:
                logger.info(f"Fetching org members using fetch_member_names: org_id={org_id}")
                
                # Get members map {user_id: display_name}
                members_map = fetch_member_names(str(org_id))
                
                logger.info(f"Found {len(members_map)} members from utility function")
                
                if members_map:
                    # Convert to lookup format
                    data = [
                        {
                            'id': user_id,
                            'label': display_name,
                            'email': '',  # Not available in this API
                            'first_name': '',
                            'last_name': '',
                            'role': '',
                        }
                        for user_id, display_name in members_map.items()
                    ]
                else:
                    # Fallback: Return current user
                    data = [{
                        'id': request.user.user_id if hasattr(request.user, 'user_id') else org_id,
                        'label': request.user.email if hasattr(request.user, 'email') else 'Current User',
                        'email': request.user.email if hasattr(request.user, 'email') else '',
                        'first_name': getattr(request.user, 'first_name', ''),
                        'last_name': getattr(request.user, 'last_name', ''),
                        'role': 'current_user',
                    }]
                    
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.exception(f"Error fetching org members: {e}")
                # Fallback: Return current user from JWT
                data = [{
                    'id': request.user.user_id if hasattr(request.user, 'user_id') else org_id,
                    'label': request.user.email if hasattr(request.user, 'email') else 'Current User',
                    'email': request.user.email if hasattr(request.user, 'email') else '',
                    'first_name': '',
                    'last_name': '',
                    'role': 'current_user',
                }]
        
        elif entity == 'company':
            from crm.models import Company
            
            # Company model doesn't use soft delete (no deleted_at field)
            query = Company.objects.all()
            if org_id:
                query = query.filter(org_id=org_id)
            
            companies = query.order_by('name')[:100]
            
            data = [
                {
                    'id': str(company.id),
                    'label': company.name,
                    'website': getattr(company, 'website', None),
                    'industry': getattr(company, 'industry', None),
                }
                for company in companies
            ]
        
        elif entity == 'contact':
            from crm.models import Contact
            
            # Contact model doesn't use soft delete (no deleted_at field)
            query = Contact.objects.all()
            if org_id:
                query = query.filter(org_id=org_id)
            
            contacts = query.order_by('first_name', 'last_name')[:100]
            
            data = [
                {
                    'id': str(contact.id),
                    'label': f"{contact.first_name} {contact.last_name}".strip() or contact.email or 'Unknown',
                    'email': contact.email,
                    'phone': getattr(contact, 'phone', None),
                }
                for contact in contacts
            ]
        
        else:
            return Response(
                {'error': f'Unknown entity type: {entity}. Valid types: user, company, contact'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'options': data})
    
    @action(detail=False, methods=['get'])
    def entity_types(self, request):
        """
        Get available entity types.
        
        GET /api/v2/forms/definitions/entity_types
        """
        entity_types = [
            {'value': choice[0], 'label': choice[1]}
            for choice in FormDefinition.EntityType.choices
        ]
        return Response({'entity_types': entity_types})
    
    @action(detail=False, methods=['get'])
    def form_types(self, request):
        """
        Get available form types.
        
        GET /api/v2/forms/definitions/form_types
        """
        form_types = [
            {'value': choice[0], 'label': choice[1]}
            for choice in FormDefinition.FormType.choices
        ]
        return Response({'form_types': form_types})
