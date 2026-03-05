import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from crm.permissions import CRMResourcePermission
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

logger = logging.getLogger(__name__)


class FormDefinitionPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200

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
    resource = 'forms'
    queryset = FormDefinition.objects.all()
    serializer_class = FormDefinitionSerializer
    permission_classes = [CRMResourcePermission]
    pagination_class = FormDefinitionPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['entity_type', 'form_type', 'is_default', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'entity_type', 'form_type', 'created_at']
    ordering = ['entity_type', 'form_type', 'name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FormDefinitionListSerializer
        elif self.action == 'get_schema':
            return FormSchemaSerializer
        return FormDefinitionSerializer
    
    def _get_org_id(self):
        """Resolve org_id: prefer X-Org-Id header, fall back to user attribute."""
        return (
            self.request.headers.get('X-Org-Id')
            or getattr(self.request.user, 'org_id', None)
        )

    def get_queryset(self):
        org_id = self._get_org_id()
        if not org_id:
            return FormDefinition.objects.none()
        return FormDefinition.objects.filter(org_id=org_id)
    
    def perform_create(self, serializer):
        serializer.save(
            org_id=self._get_org_id(),
            created_by=self.request.user.id
        )
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user.id)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
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
        
        org_id = self._get_org_id()
        
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
            form = FormDefinition.objects.filter(
                org_id=org_id,
                entity_type=entity_type,
                form_type=form_type,
                is_default=True,
                is_active=True
            ).first()
            
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
        org_id = self._get_org_id()
        
        if not org_id:
            return Response(
                {'error': 'Organization ID not found in token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = []

        if entity == 'user':
            from crm.utils import fetch_member_names
            
            try:
                logger.info(f"Fetching org members using fetch_member_names: org_id={org_id}")
                
                members_map = fetch_member_names(str(org_id))
                
                logger.info(f"Found {len(members_map)} members from utility function")
                
                if members_map:
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
                    data = [{
                        'id': request.user.user_id if hasattr(request.user, 'user_id') else org_id,
                        'label': request.user.email if hasattr(request.user, 'email') else 'Current User',
                        'email': request.user.email if hasattr(request.user, 'email') else '',
                        'first_name': getattr(request.user, 'first_name', ''),
                        'last_name': getattr(request.user, 'last_name', ''),
                        'role': 'current_user',
                    }]
                    
            except Exception as e:
                logger.exception(f"Error fetching org members: {e}")
                data = [{
                    'id': request.user.user_id if hasattr(request.user, 'user_id') else org_id,
                    'label': request.user.email if hasattr(request.user, 'email') else 'Current User',
                    'email': request.user.email if hasattr(request.user, 'email') else '',
                    'first_name': '',
                    'last_name': '',
                    'role': 'current_user',
                }]
        
        elif entity == 'company':
            from companies_v2.models import CompanyV2
            v2_query = CompanyV2.objects.filter(deleted_at__isnull=True)
            if org_id:
                v2_query = v2_query.filter(org_id=org_id)
            for c in v2_query.order_by('created_at')[:200]:
                data.append({
                    'id': str(c.id),
                    'label': c.entity_data.get('name', 'Unnamed Company'),
                    'website': c.entity_data.get('website'),
                    'industry': c.industry or c.entity_data.get('industry'),
                })
            data.sort(key=lambda x: (x.get('label') or '').lower())
        
        elif entity == 'contact':
            from contacts_v2.models import ContactV2
            v2_query = ContactV2.objects.filter(deleted_at__isnull=True)
            if org_id:
                v2_query = v2_query.filter(org_id=org_id)
            for c in v2_query.order_by('created_at')[:200]:
                first = c.entity_data.get('first_name', '')
                last = c.entity_data.get('last_name', '')
                email = c.entity_data.get('email', '')
                label = f"{first} {last}".strip() or email or 'Unknown'
                data.append({
                    'id': str(c.id),
                    'label': label,
                    'email': email or None,
                    'phone': c.entity_data.get('phone') or c.entity_data.get('mobile') or None,
                })
            data.sort(key=lambda x: (x.get('label') or '').lower())
        
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
        form_types = [
            {'value': choice[0], 'label': choice[1]}
            for choice in FormDefinition.FormType.choices
        ]
        return Response({'form_types': form_types})
