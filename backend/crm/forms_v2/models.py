"""
Forms V2 - Schema-Driven Dynamic Form System (Form Builder Architecture).

This app provides the V2 form system with:
- FormDefinition: Self-contained forms with inline field definitions

ARCHITECTURE:
- Form Builder Style: Each form stores ALL field information inline
- No separate FieldDefinition table (deprecated)
- Forms are completely independent and self-contained

This is separate from the main CRM app to allow:
- Clean separation of concerns
- Easy testing
- Non-breaking changes to existing system
- Potential reuse in other projects
"""
import uuid
from decimal import Decimal
from django.db import models


# =============================================================================
# BASE MODELS (imported from crm app)
# =============================================================================

class BaseModel(models.Model):
    """Abstract base model with common fields."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


# =============================================================================
# V2 DYNAMIC FORMS (Schema-Driven Form System)
# =============================================================================

class FormDefinition(BaseModel):
    """
    V2: Self-contained form definition with inline field definitions.
    
    Form Builder Architecture:
    - ALL field information stored inline in schema.sections[].fields[]
    - No references to external FieldDefinition table
    - Each form is completely independent
    
    Supports:
    - Multi-section layouts
    - Inline field definitions with full validation rules
    - Conditional field visibility
    - Multiple forms per entity (create, edit, quick_add, web_form)
    
    Usage:
        form = FormDefinition.objects.get(
            org_id=org_id,
            entity_type='lead',
            form_type='create',
            is_default=True
        )
        schema = form.schema  # Contains sections with inline field definitions
    """
    
    class EntityType(models.TextChoices):
        CONTACT = 'contact', 'Contact'
        COMPANY = 'company', 'Company'
        DEAL = 'deal', 'Deal'
        LEAD = 'lead', 'Lead'
    
    class FormType(models.TextChoices):
        CREATE = 'create', 'Create Form'
        EDIT = 'edit', 'Edit Form'
        QUICK_ADD = 'quick_add', 'Quick Add Form'
        WEB_FORM = 'web_form', 'Web Form'
        DETAIL_VIEW = 'detail_view', 'Detail View'
    
    org_id = models.UUIDField(db_index=True)
    entity_type = models.CharField(
        max_length=50,
        choices=EntityType.choices,
        db_index=True
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    is_default = models.BooleanField(default=False)
    form_type = models.CharField(
        max_length=50,
        choices=FormType.choices,
        default=FormType.CREATE
    )
    
    # JSON Schema containing:
    # - version: Schema version (e.g., "1.0.0")
    # - sections: Array of section definitions
    # - validation: Cross-field validation rules
    # - metadata: Additional form metadata
    schema = models.JSONField(default=dict)
    
    is_active = models.BooleanField(default=True, db_index=True)
    
    # Metadata
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)
    
    class Meta:
        db_table = 'crm_form_definitions'
        unique_together = [
            ['org_id', 'entity_type', 'name'],
        ]
        indexes = [
            models.Index(fields=['org_id', 'entity_type', 'is_active']),
            models.Index(fields=['org_id', 'entity_type', 'form_type', 'is_default']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.entity_type} - {self.form_type})"
    
    @property
    def version(self) -> str:
        """Get schema version."""
        return self.schema.get('version', '1.0.0')
    
    def validate_schema(self) -> tuple[bool, list[str]]:
        """
        Validate the form schema structure with inline field definitions.
        
        Returns:
            Tuple of (is_valid, errors)
        """
        errors = []
        
        if not isinstance(self.schema, dict):
            errors.append("Schema must be a JSON object")
            return False, errors
        
        # Check required top-level keys
        if 'sections' not in self.schema:
            errors.append("Schema must contain 'sections' key")
        
        # Validate sections
        sections = self.schema.get('sections', [])
        if not isinstance(sections, list):
            errors.append("'sections' must be an array")
        else:
            for idx, section in enumerate(sections):
                if not isinstance(section, dict):
                    errors.append(f"Section {idx} must be an object")
                    continue
                
                if 'id' not in section:
                    errors.append(f"Section {idx} missing 'id'")
                if 'fields' not in section:
                    errors.append(f"Section {idx} missing 'fields'")
                    continue
                
                # Validate inline field definitions
                fields = section.get('fields', [])
                if not isinstance(fields, list):
                    errors.append(f"Section {idx} 'fields' must be an array")
                    continue
                
                for field_idx, field in enumerate(fields):
                    if not isinstance(field, dict):
                        errors.append(f"Section {idx}, field {field_idx} must be an object")
                        continue
                    
                    # Required field properties for inline definitions
                    required_props = ['name', 'label', 'field_type']
                    for prop in required_props:
                        if prop not in field:
                            errors.append(f"Section {idx}, field {field_idx} missing '{prop}'")
        
        return len(errors) == 0, errors
    
    def validate_field_schema(self, field_data: dict) -> tuple[bool, list[str]]:
        """
        Validate a single inline field definition.
        
        Args:
            field_data: Dictionary containing field properties
            
        Returns:
            Tuple of (is_valid, errors)
        """
        errors = []
        
        # Required properties
        required = ['name', 'label', 'field_type']
        for prop in required:
            if prop not in field_data:
                errors.append(f"Field missing required property: {prop}")
        
        # Validate field_type if present
        if 'field_type' in field_data:
            valid_types = [
                'text', 'textarea', 'email', 'phone', 'url',
                'number', 'decimal', 'currency', 'percentage',
                'date', 'datetime', 'time',
                'select', 'multi_select', 'radio',
                'checkbox', 'boolean'
            ]
            if field_data['field_type'] not in valid_types:
                errors.append(f"Invalid field_type: {field_data['field_type']}")
        
        # Validate select/multi_select have options
        if field_data.get('field_type') in ['select', 'multi_select', 'radio']:
            options = field_data.get('options', {})
            if not options or 'options' not in options or not options['options']:
                errors.append(f"Field '{field_data.get('name')}' of type '{field_data.get('field_type')}' must have options")
        
        return len(errors) == 0, errors


# ============================================================================
# DEPRECATED: FieldDefinition Model
# ============================================================================
# This model is DEPRECATED as of the Form Builder Architecture migration.
# All field definitions are now stored inline within FormDefinition.schema.
# This model is kept here temporarily for reference and potential rollback.
# DO NOT USE THIS MODEL FOR NEW FEATURES.
# ============================================================================

class FieldDefinition(BaseModel):
    """
    DEPRECATED: Field definitions are now stored inline in FormDefinition.schema.
    
    This model is kept for backward compatibility and potential rollback only.
    All new forms use inline field definitions within the FormDefinition schema.
    
    Form Builder Architecture (Current):
    - FormDefinition.schema.sections[].fields[] contains all field properties
    - No external FieldDefinition references needed
    - Each form is self-contained and independent
    """
    
    class EntityType(models.TextChoices):
        CONTACT = 'contact', 'Contact'
        COMPANY = 'company', 'Company'
        DEAL = 'deal', 'Deal'
        LEAD = 'lead', 'Lead'
    
    class FieldType(models.TextChoices):
        # Text types
        TEXT = 'text', 'Text'
        TEXTAREA = 'textarea', 'Text Area'
        EMAIL = 'email', 'Email'
        PHONE = 'phone', 'Phone'
        URL = 'url', 'URL'
        
        # Number types
        NUMBER = 'number', 'Number'
        DECIMAL = 'decimal', 'Decimal'
        CURRENCY = 'currency', 'Currency'
        PERCENTAGE = 'percentage', 'Percentage'
        
        # Date types
        DATE = 'date', 'Date'
        DATETIME = 'datetime', 'Date & Time'
        TIME = 'time', 'Time'
        
        # Selection types
        SELECT = 'select', 'Dropdown'
        MULTI_SELECT = 'multi_select', 'Multi-Select'
        RADIO = 'radio', 'Radio Buttons'
        
        # Boolean types
        CHECKBOX = 'checkbox', 'Checkbox'
        BOOLEAN = 'boolean', 'Yes/No'
        
        # Advanced types (Phase 2+)
        # FILE = 'file', 'File Upload'
        # IMAGE = 'image', 'Image Upload'
        # RICH_TEXT = 'rich_text', 'Rich Text'
        # ADDRESS = 'address', 'Address'
        # USER = 'user', 'User Picker'
        # LOOKUP = 'lookup', 'Lookup'
    
    org_id = models.UUIDField(db_index=True)
    entity_type = models.CharField(
        max_length=50,
        choices=EntityType.choices,
        db_index=True
    )
    
    # Field identification
    name = models.CharField(max_length=100)  # Internal name (e.g., 'budget', 'industry')
    label = models.CharField(max_length=255)  # Display label
    field_type = models.CharField(max_length=50, choices=FieldType.choices)
    
    # Field properties
    is_core = models.BooleanField(default=False)  # Core fields can't be deleted
    is_required = models.BooleanField(default=False)
    is_unique = models.BooleanField(default=False)
    is_searchable = models.BooleanField(default=True)  # Include in search indexes
    
    # Validation rules (JSON)
    # Examples:
    # - {"min": 0, "max": 100}
    # - {"pattern": "^[A-Z]{2,4}$", "message": "Must be 2-4 uppercase letters"}
    # - {"minLength": 5, "maxLength": 50}
    validation_rules = models.JSONField(default=dict, blank=True)
    
    # Field options (for select, multi-select, etc.)
    # Format: {"options": [{"value": "opt1", "label": "Option 1", "color": "#ff0000"}, ...]}
    # For currency: {"currency": "USD", "precision": 2}
    options = models.JSONField(default=dict, blank=True)
    
    # Default value (JSON to support any type)
    default_value = models.JSONField(null=True, blank=True)
    
    # UI hints
    placeholder = models.CharField(max_length=255, blank=True)
    help_text = models.TextField(blank=True)
    
    # Display order
    display_order = models.IntegerField(default=0)
    
    # Active/inactive
    is_active = models.BooleanField(default=True, db_index=True)
    
    # Metadata
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)
    
    class Meta:
        db_table = 'crm_field_definitions'
        unique_together = [
            ['org_id', 'entity_type', 'name'],
        ]
        indexes = [
            models.Index(fields=['org_id', 'entity_type', 'is_active']),
            models.Index(fields=['org_id', 'entity_type', 'is_searchable']),
            models.Index(fields=['org_id', 'entity_type', 'display_order']),
        ]
    
    def __str__(self):
        return f"{self.label} ({self.entity_type}.{self.name})"
    
    def validate_value(self, value):
        """
        Validate a value against this field's validation rules.
        
        Args:
            value: The value to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Required check
        if self.is_required and (value is None or value == ''):
            return False, f"{self.label} is required"
        
        # If empty and not required, it's valid
        if value is None or value == '':
            return True, None
        
        # Type-specific validation
        if self.field_type in ['number', 'decimal', 'currency', 'percentage']:
            if not isinstance(value, (int, float, Decimal)):
                return False, f"{self.label} must be a number"
            
            # Min/max validation
            rules = self.validation_rules
            if 'min' in rules and value < rules['min']:
                return False, f"{self.label} must be at least {rules['min']}"
            if 'max' in rules and value > rules['max']:
                return False, f"{self.label} must be at most {rules['max']}"
        
        elif self.field_type in ['text', 'textarea', 'email', 'phone', 'url']:
            if not isinstance(value, str):
                return False, f"{self.label} must be text"
            
            # Length validation
            rules = self.validation_rules
            if 'minLength' in rules and len(value) < rules['minLength']:
                return False, f"{self.label} must be at least {rules['minLength']} characters"
            if 'maxLength' in rules and len(value) > rules['maxLength']:
                return False, f"{self.label} must be at most {rules['maxLength']} characters"
            
            # Pattern validation
            if 'pattern' in rules:
                import re
                if not re.match(rules['pattern'], value):
                    msg = rules.get('message', f"{self.label} format is invalid")
                    return False, msg
        
        elif self.field_type in ['select', 'multi_select']:
            valid_options = [opt['value'] for opt in self.options.get('options', [])]
            
            if self.field_type == 'select':
                if value not in valid_options:
                    return False, f"{self.label} must be one of: {', '.join(valid_options)}"
            else:  # multi_select
                if not isinstance(value, list):
                    return False, f"{self.label} must be an array"
                for v in value:
                    if v not in valid_options:
                        return False, f"Invalid option '{v}' for {self.label}"
        
        return True, None
