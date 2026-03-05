import uuid
from django.db import models


class BaseModel(models.Model):
    """Abstract base model with common fields."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class FormDefinition(BaseModel):
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
    
    schema = models.JSONField(default=dict)
    
    is_active = models.BooleanField(default=True, db_index=True)
    
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
        
        if 'sections' not in self.schema:
            errors.append("Schema must contain 'sections' key")
        
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
                
                fields = section.get('fields', [])
                if not isinstance(fields, list):
                    errors.append(f"Section {idx} 'fields' must be an array")
                    continue
                
                for field_idx, field in enumerate(fields):
                    if not isinstance(field, dict):
                        errors.append(f"Section {idx}, field {field_idx} must be an object")
                        continue
                    
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
        
        required = ['name', 'label', 'field_type']
        for prop in required:
            if prop not in field_data:
                errors.append(f"Field missing required property: {prop}")
        
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
        
        if field_data.get('field_type') in ['select', 'multi_select', 'radio']:
            options = field_data.get('options', {})
            if not options or 'options' not in options or not options['options']:
                errors.append(f"Field '{field_data.get('name')}' of type '{field_data.get('field_type')}' must have options")
        
        return len(errors) == 0, errors
