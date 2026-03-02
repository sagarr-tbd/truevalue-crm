"""
Forms V2 Serializers.

Handles serialization/deserialization of FormDefinition model with inline field definitions.
Form Builder Architecture: No separate FieldDefinition table.
"""
from rest_framework import serializers
from .models import FormDefinition


class FormDefinitionSerializer(serializers.ModelSerializer):
    """
    Serializer for FormDefinition model with inline field definitions.
    
    Form Builder Architecture:
    - schema.sections[].fields[] contains complete inline field definitions
    - No external FieldDefinition references
    """
    
    class Meta:
        model = FormDefinition
        fields = [
            'id',
            'org_id',
            'entity_type',
            'name',
            'description',
            'is_default',
            'form_type',
            'schema',
            'is_active',
            'created_by',
            'updated_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'org_id', 'created_by', 'updated_by', 'created_at', 'updated_at']
    
    def validate_schema(self, value):
        """Validate form schema structure with inline field definitions."""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Schema must be a JSON object")
        
        # Check required keys
        if 'sections' not in value:
            raise serializers.ValidationError("Schema must contain 'sections' key")
        
        sections = value.get('sections', [])
        if not isinstance(sections, list):
            raise serializers.ValidationError("'sections' must be an array")
        
        # Track field names to detect duplicates within form
        field_names_in_form = set()
        
        # Validate each section
        for idx, section in enumerate(sections):
            if not isinstance(section, dict):
                raise serializers.ValidationError(f"Section {idx} must be an object")
            
            if 'id' not in section:
                raise serializers.ValidationError(f"Section {idx} missing 'id'")
            if 'fields' not in section:
                raise serializers.ValidationError(f"Section {idx} missing 'fields'")
            
            # Validate inline field definitions
            fields = section.get('fields', [])
            if not isinstance(fields, list):
                raise serializers.ValidationError(f"Section {idx} 'fields' must be an array")
            
            for field_idx, field in enumerate(fields):
                if not isinstance(field, dict):
                    raise serializers.ValidationError(f"Section {idx}, field {field_idx} must be an object")
                
                # Required properties for inline field definitions
                required_props = ['name', 'label', 'field_type']
                for prop in required_props:
                    if prop not in field:
                        raise serializers.ValidationError(
                            f"Section {idx}, field {field_idx} missing required property: '{prop}'"
                        )
                
                # Validate field name format
                import re
                field_name = field.get('name', '')
                if not re.match(r'^[a-z0-9_]+$', field_name):
                    raise serializers.ValidationError(
                        f"Section {idx}, field {field_idx}: field name '{field_name}' must be lowercase alphanumeric with underscores only"
                    )
                
                # Check for duplicate field names
                if field_name in field_names_in_form:
                    raise serializers.ValidationError(
                        f"Section {idx}, field {field_idx}: duplicate field name '{field_name}' in form"
                    )
                field_names_in_form.add(field_name)
                
                # Validate field_type
                valid_types = [
                    'text', 'textarea', 'email', 'phone', 'url',
                    'number', 'decimal', 'currency', 'percentage',
                    'date', 'datetime', 'time',
                    'select', 'multi_select', 'radio',
                    'checkbox', 'boolean',
                    'lookup'  # Phase 4-5: Lookup field for users, companies, contacts
                ]
                if field.get('field_type') not in valid_types:
                    raise serializers.ValidationError(
                        f"Section {idx}, field {field_idx}: invalid field_type '{field.get('field_type')}'"
                    )
                
                # Validate select/multi_select/radio have options
                if field.get('field_type') in ['select', 'multi_select', 'radio']:
                    options = field.get('options', {})
                    if not options or 'options' not in options or not options['options']:
                        raise serializers.ValidationError(
                            f"Section {idx}, field {field_idx}: field '{field_name}' of type '{field.get('field_type')}' must have options"
                        )
                    
                    # Validate each option has value and label
                    for opt_idx, opt in enumerate(options['options']):
                        if 'value' not in opt or 'label' not in opt:
                            raise serializers.ValidationError(
                                f"Section {idx}, field {field_idx}: option {opt_idx} must have 'value' and 'label'"
                            )
                
                # Validate lookup fields have required config (Phase 4-5)
                if field.get('field_type') == 'lookup':
                    options = field.get('options', {})
                    if not options:
                        raise serializers.ValidationError(
                            f"Section {idx}, field {field_idx}: lookup field '{field_name}' must have options configuration"
                        )
                    
                    # entity is optional but recommended
                    # api_endpoint is required for dynamic lookups
                    # For static lookups, 'options' array can be used (similar to select)
        
        return value
    
    def validate(self, data):
        """Cross-field validation."""
        # Ensure only one default form per entity_type + form_type
        if data.get('is_default'):
            org_id = data.get('org_id') or (self.instance.org_id if self.instance else None)
            entity_type = data.get('entity_type') or (self.instance.entity_type if self.instance else None)
            form_type = data.get('form_type') or (self.instance.form_type if self.instance else None)
            
            existing = FormDefinition.objects.filter(
                org_id=org_id,
                entity_type=entity_type,
                form_type=form_type,
                is_default=True
            )
            
            # Exclude current instance when updating
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            
            if existing.exists():
                raise serializers.ValidationError({
                    'is_default': f'A default {form_type} form already exists for {entity_type}'
                })
        
        return data


class FormDefinitionListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing forms.
    
    Excludes heavy schema field for performance.
    """
    
    class Meta:
        model = FormDefinition
        fields = [
            'id',
            'entity_type',
            'name',
            'description',
            'form_type',
            'is_default',
            'is_active',
            'created_at',
            'updated_at',
        ]


class FormSchemaSerializer(serializers.Serializer):
    """
    Serializer for retrieving complete form schema with inline field definitions.
    
    Form Builder Architecture: schema.sections[].fields[] contains inline field definitions.
    Used by GET /api/v2/forms/schema endpoint.
    """
    id = serializers.UUIDField()
    name = serializers.CharField()
    entity_type = serializers.CharField()
    form_type = serializers.CharField()
    schema = serializers.JSONField()
    
    def to_representation(self, instance):
        """
        Return form schema with inline field definitions.
        No need to query FieldDefinition table - fields are inline.
        """
        return {
            'id': str(instance.id),
            'name': instance.name,
            'entity_type': instance.entity_type,
            'form_type': instance.form_type,
            'schema': instance.schema,  # Contains inline field definitions
        }
