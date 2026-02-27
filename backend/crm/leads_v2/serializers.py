"""
Leads V2 Serializers

Hybrid Architecture Serializer (Phase 3):
- System fields (assigned_to, company, source) → Database columns
- Custom fields → JSONB entity_data
- Validates dynamically against FormDefinition schema
"""

from rest_framework import serializers
from .models import LeadV2
from forms_v2.models import FormDefinition
from django.db import transaction


class LeadV2Serializer(serializers.ModelSerializer):
    """
    Hybrid Lead Serializer (Phase 3).
    
    Routes fields intelligently:
    - FK relationships (assigned_to, company) → Database columns
    - Custom/dynamic fields → entity_data JSONB
    - Validates based on FormDefinition schema
    """
    
    # ═════════════════════════════════════════════════════════════
    # METADATA (Read-only)
    # ═════════════════════════════════════════════════════════════
    id = serializers.UUIDField(read_only=True)
    org_id = serializers.UUIDField(read_only=True)
    owner_id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    deleted_at = serializers.DateTimeField(read_only=True)
    last_activity_at = serializers.DateTimeField(read_only=True)
    
    # ═════════════════════════════════════════════════════════════
    # SYSTEM FIELDS (Phase 2 - Database columns)
    # ═════════════════════════════════════════════════════════════
    
    # Status & Source (indexed for fast filtering)
    status = serializers.ChoiceField(
        choices=LeadV2.Status.choices,
        default=LeadV2.Status.NEW
    )
    source = serializers.ChoiceField(
        choices=LeadV2.Source.choices,
        required=False,
        allow_null=True
    )
    rating = serializers.ChoiceField(
        choices=LeadV2.Rating.choices,
        required=False,
        allow_null=True
    )
    
    # Relationship fields (UUID for now, will be FK in future)
    assigned_to_id = serializers.UUIDField(required=False, allow_null=True)
    company_id = serializers.UUIDField(required=False, allow_null=True)
    contact_id = serializers.UUIDField(required=False, allow_null=True)
    
    # ═════════════════════════════════════════════════════════════
    # CUSTOM FIELDS (JSONB)
    # ═════════════════════════════════════════════════════════════
    entity_data = serializers.JSONField(required=True)
    
    # ═════════════════════════════════════════════════════════════
    # CONVERSION TRACKING (Read-only)
    # ═════════════════════════════════════════════════════════════
    is_converted = serializers.BooleanField(read_only=True)
    converted_at = serializers.DateTimeField(read_only=True)
    converted_contact_id = serializers.UUIDField(read_only=True)
    converted_company_id = serializers.UUIDField(read_only=True)
    converted_deal_id = serializers.UUIDField(read_only=True)
    
    # ═════════════════════════════════════════════════════════════
    # COMPUTED FIELDS (Helper methods for frontend)
    # ═════════════════════════════════════════════════════════════
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    
    class Meta:
        model = LeadV2
        fields = [
            # Identity
            'id',
            'org_id',
            'owner_id',
            
            # System fields (Phase 2)
            'status',
            'source',
            'rating',
            'assigned_to_id',
            'company_id',
            'contact_id',
            
            # Custom fields
            'entity_data',
            
            # Computed fields
            'full_name',
            'email',
            'phone',
            
            # Conversion
            'is_converted',
            'converted_at',
            'converted_contact_id',
            'converted_company_id',
            'converted_deal_id',
            
            # Timestamps
            'created_at',
            'updated_at',
            'deleted_at',
            'last_activity_at',
        ]
        read_only_fields = [
            'id',
            'org_id',
            'owner_id',
            'full_name',
            'email',
            'phone',
            'is_converted',
            'converted_at',
            'converted_contact_id',
            'converted_company_id',
            'converted_deal_id',
            'created_at',
            'updated_at',
            'deleted_at',
            'last_activity_at',
        ]
    
    # ═════════════════════════════════════════════════════════════
    # COMPUTED FIELD METHODS
    # ═════════════════════════════════════════════════════════════
    def get_full_name(self, obj):
        """Extract full name from entity_data."""
        return obj.get_full_name()
    
    def get_email(self, obj):
        """Extract email from entity_data."""
        return obj.get_email()
    
    def get_phone(self, obj):
        """Extract phone from entity_data."""
        return obj.get_phone()
    
    def to_representation(self, instance):
        """
        Override to_representation to map FK columns back into entity_data for edit forms.
        
        This ensures when editing a lead, the form receives:
        - entity_data.assigned_to = assigned_to_id (UUID)
        - entity_data.company = company_id (UUID)
        - entity_data.source = source (from column)
        - entity_data.rating = rating (from column)
        """
        representation = super().to_representation(instance)
        
        # Map FK columns back into entity_data for edit forms
        if instance.assigned_to_id:
            representation['entity_data']['assigned_to'] = str(instance.assigned_to_id)
        
        if instance.company_id:
            representation['entity_data']['company'] = str(instance.company_id)
        
        if instance.source:
            representation['entity_data']['source'] = instance.source
        
        if instance.rating:
            representation['entity_data']['rating'] = instance.rating
        
        if instance.status:
            representation['entity_data']['status'] = instance.status
        
        return representation
    
    
    # ═════════════════════════════════════════════════════════════
    # PHASE 3: FIELD ROUTING LOGIC
    # ═════════════════════════════════════════════════════════════
    def validate(self, attrs):
        """
        Phase 3+: Route fields to correct storage.
        
        - 'source' in entity_data → Move to source column
        - 'status' in entity_data → Move to status column
        - 'rating' in entity_data → Move to rating column
        - 'assigned_to' in entity_data → Move to assigned_to_id column
        - 'company' in entity_data → Move to company_id column
        - Other fields → Keep in entity_data
        """
        entity_data = attrs.get('entity_data', {})
        
        # Route 'source' from entity_data to database column
        if 'source' in entity_data:
            source_value = entity_data.pop('source')
            # Validate it's a valid choice
            if source_value and source_value in dict(LeadV2.Source.choices):
                attrs['source'] = source_value
        
        # Route 'status' from entity_data to database column
        if 'status' in entity_data:
            status_value = entity_data.pop('status')
            if status_value and status_value in dict(LeadV2.Status.choices):
                attrs['status'] = status_value
        
        # Route 'rating' from entity_data to database column
        if 'rating' in entity_data:
            rating_value = entity_data.pop('rating')
            if rating_value and rating_value in dict(LeadV2.Rating.choices):
                attrs['rating'] = rating_value
        
        # Route 'assigned_to' from entity_data to assigned_to_id column
        if 'assigned_to' in entity_data:
            assigned_to_value = entity_data.pop('assigned_to')
            if assigned_to_value:
                # It's a UUID string, store it in assigned_to_id
                attrs['assigned_to_id'] = assigned_to_value
        
        # Route 'company' from entity_data to company_id column
        if 'company' in entity_data:
            company_value = entity_data.pop('company')
            if company_value:
                # It's a UUID string, store it in company_id
                attrs['company_id'] = company_value
        
        # Update entity_data after routing
        attrs['entity_data'] = entity_data
        
        return attrs
    
    def validate_entity_data(self, value):
        """
        Validate entity_data against inline field definitions from FormDefinition.
        
        Form Builder Architecture: Fetches field definitions from FormDefinition.schema.sections[].fields[]
        
        Ensures:
        1. Required fields are present
        2. Field types are correct
        3. Validation rules are followed
        4. Options are valid (for select fields)
        """
        if not value or not isinstance(value, dict):
            raise serializers.ValidationError("entity_data must be a non-empty object")
        
        # Get org_id from context
        request = self.context.get('request')
        if not request:
            return value
        
        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            raise serializers.ValidationError("X-Org-Id header required")
        
        # Get default 'create' form for 'lead' entity type
        form = FormDefinition.objects.filter(
            org_id=org_id,
            entity_type='lead',
            form_type='create',
            is_default=True,
            is_active=True
        ).first()
        
        # 🎯 AUTO-CREATE if not found (Industry standard: Zoho/HubSpot pattern)
        if not form:
            from forms_v2.default_schemas import get_default_lead_schema
            
            form = FormDefinition.objects.create(
                org_id=org_id,
                entity_type='lead',
                form_type='create',
                name='Default Lead Form',
                description='Auto-generated default form for leads. You can customize this via the layout editor.',
                is_default=True,
                is_active=True,
                schema=get_default_lead_schema(),
                created_by=request.user.id
            )
        
        # Extract inline field definitions from schema
        field_definitions = {}
        for section in form.schema.get('sections', []):
            for field in section.get('fields', []):
                field_name = field.get('name')
                if field_name:
                    field_definitions[field_name] = field
        
        if not field_definitions:
            raise serializers.ValidationError(
                "No field definitions found in form schema."
            )
        
        # Validate each field
        errors = {}
        
        for field_name, field_def in field_definitions.items():
            field_value = value.get(field_name)
            field_label = field_def.get('label', field_name)
            field_type = field_def.get('field_type')
            is_required = field_def.get('is_required', False)
            is_unique = field_def.get('is_unique', False)
            
            # Check required fields
            if is_required:
                if field_value is None or field_value == '':
                    errors[field_name] = f"{field_label} is required"
                    continue
            
            # Skip validation if field is not provided and not required
            if field_value is None or field_value == '':
                continue
            
            # Check uniqueness for is_unique fields
            if is_unique and field_value:
                # Build query to check if value exists in any lead's entity_data
                from django.db.models import Q
                existing_query = Q(**{f'entity_data__{field_name}': field_value})
                existing_leads = LeadV2.objects.filter(
                    org_id=org_id,
                    deleted_at__isnull=True
                ).filter(existing_query)
                
                # Exclude current instance when updating
                if self.instance:
                    existing_leads = existing_leads.exclude(id=self.instance.id)
                
                if existing_leads.exists():
                    errors[field_name] = f"{field_label} must be unique. This value already exists."
                    continue
            
            # Type-specific validation
            try:
                if field_type in ['number', 'decimal']:
                    # Validate number
                    num_value = float(field_value) if not isinstance(field_value, (int, float)) else field_value
                    validation = field_def.get('validation_rules', {})
                    
                    if 'min' in validation and num_value < validation['min']:
                        errors[field_name] = f"{field_label} must be at least {validation['min']}"
                    if 'max' in validation and num_value > validation['max']:
                        errors[field_name] = f"{field_label} must be at most {validation['max']}"
                
                elif field_type == 'email':
                    # Basic email validation
                    if '@' not in str(field_value) or '.' not in str(field_value):
                        errors[field_name] = f"{field_label} must be a valid email"
                
                elif field_type == 'url':
                    # Basic URL validation
                    if not str(field_value).startswith(('http://', 'https://')):
                        errors[field_name] = f"{field_label} must be a valid URL"
                
                elif field_type == 'phone':
                    # Basic phone validation (non-empty)
                    if len(str(field_value).strip()) < 10:
                        errors[field_name] = f"{field_label} must be a valid phone number"
                
                elif field_type in ['select', 'radio']:
                    # Validate against options
                    options = field_def.get('options', {})
                    valid_values = [opt['value'] for opt in options.get('options', [])]
                    if valid_values and str(field_value) not in valid_values:
                        errors[field_name] = f"{field_label} must be one of: {', '.join(valid_values)}"
                
                elif field_type == 'multi_select':
                    # Validate multi-select
                    if not isinstance(field_value, list):
                        errors[field_name] = f"{field_label} must be a list"
                    else:
                        options = field_def.get('options', {})
                        valid_values = [opt['value'] for opt in options.get('options', [])]
                        if valid_values:
                            invalid = [v for v in field_value if str(v) not in valid_values]
                            if invalid:
                                errors[field_name] = f"{field_label} contains invalid values: {', '.join(map(str, invalid))}"
                
                elif field_type == 'checkbox':
                    if not isinstance(field_value, bool):
                        errors[field_name] = f"{field_label} must be true or false"
                
                elif field_type == 'text':
                    # Text validation (min/max length)
                    validation = field_def.get('validation_rules', {})
                    text_len = len(str(field_value))
                    
                    if 'min_length' in validation and text_len < validation['min_length']:
                        errors[field_name] = f"{field_label} must be at least {validation['min_length']} characters"
                    if 'max_length' in validation and text_len > validation['max_length']:
                        errors[field_name] = f"{field_label} must be at most {validation['max_length']} characters"
                    
                    # Pattern validation
                    if 'pattern' in validation:
                        import re
                        if not re.match(validation['pattern'], str(field_value)):
                            errors[field_name] = f"{field_label} format is invalid"
            
            except Exception as e:
                errors[field_name] = f"{field_label} validation error: {str(e)}"
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        """Create a new V2 Lead."""
        return LeadV2.objects.create(**validated_data)
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Update a V2 Lead."""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class LeadV2ListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views.
    
    Returns minimal metadata + entity_data for rendering in tables.
    """
    
    # Extract common display fields from entity_data
    display_name = serializers.SerializerMethodField()
    display_email = serializers.SerializerMethodField()
    display_company = serializers.SerializerMethodField()
    
    class Meta:
        model = LeadV2
        fields = [
            'id',
            'status',
            'source',  # Include source column
            'rating',  # Include rating column
            'entity_data',
            'created_at',
            'last_activity_at',
            # Display helpers
            'display_name',
            'display_email',
            'display_company',
        ]
    
    def get_display_name(self, obj):
        """Get full name from entity_data."""
        first = obj.entity_data.get('first_name', '')
        last = obj.entity_data.get('last_name', '')
        return f"{first} {last}".strip() or obj.entity_data.get('email', 'N/A')
    
    def get_display_email(self, obj):
        """Get email from entity_data."""
        return obj.entity_data.get('email', 'N/A')
    
    def get_display_company(self, obj):
        """Get company from entity_data."""
        return obj.entity_data.get('company_name', 'N/A')
