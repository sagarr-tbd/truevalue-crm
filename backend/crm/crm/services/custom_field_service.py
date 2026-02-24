"""
Custom Field Service.

Handles custom field lifecycle with billing limit checks.
Enforces plan-based limits on number of custom fields per entity type.
"""
import logging
from typing import Optional, Dict, Any
from uuid import UUID

from django.conf import settings
from django.db import transaction

from ..models import CustomFieldDefinition
from .base_service import BaseService, LimitExceededError

logger = logging.getLogger(__name__)


class CustomFieldService(BaseService[CustomFieldDefinition]):
    """
    Service for custom field management with billing limit checks.
    
    Features:
    - CRUD operations for custom field definitions
    - Billing limit enforcement per plan tier
    - Validation of field types and options
    - Ordering and display management
    """
    
    model = CustomFieldDefinition
    entity_type = 'custom_field'
    
    def create(
        self,
        entity_type: str,
        name: str,
        label: str,
        field_type: str,
        is_required: bool = False,
        is_unique: bool = False,
        default_value: Optional[str] = None,
        placeholder: Optional[str] = None,
        help_text: Optional[str] = None,
        options: Optional[list] = None,
        validation: Optional[dict] = None,
        order: int = 0,
        **kwargs
    ) -> CustomFieldDefinition:
        """
        Create a new custom field with billing limit check.
        
        Raises:
            LimitExceededError: If custom field limit is exceeded
        """
        # Check billing limit before creating
        self._check_custom_field_limit(entity_type)
        
        with transaction.atomic():
            field = CustomFieldDefinition.objects.create(
                org_id=self.org_id,
                entity_type=entity_type,
                name=name,
                label=label,
                field_type=field_type,
                is_required=is_required,
                is_unique=is_unique,
                default_value=default_value,
                placeholder=placeholder,
                help_text=help_text,
                options=options or [],
                validation=validation or {},
                order=order,
                is_active=True,
            )
            
            # Sync usage to billing
            self._sync_custom_field_usage()
            
            logger.info(
                f"Custom field created: {field.id} ({entity_type}.{name}) "
                f"in org {self.org_id}"
            )
            
            return field
    
    def update(
        self,
        field_id: UUID,
        label: Optional[str] = None,
        is_required: Optional[bool] = None,
        default_value: Optional[str] = None,
        placeholder: Optional[str] = None,
        help_text: Optional[str] = None,
        options: Optional[list] = None,
        validation: Optional[dict] = None,
        order: Optional[int] = None,
        is_active: Optional[bool] = None,
        **kwargs
    ) -> CustomFieldDefinition:
        """
        Update a custom field.
        
        Note: name and field_type cannot be changed after creation.
        """
        field = self.get(field_id)
        
        if label is not None:
            field.label = label
        if is_required is not None:
            field.is_required = is_required
        if default_value is not None:
            field.default_value = default_value
        if placeholder is not None:
            field.placeholder = placeholder
        if help_text is not None:
            field.help_text = help_text
        if options is not None:
            field.options = options
        if validation is not None:
            field.validation = validation
        if order is not None:
            field.order = order
        if is_active is not None:
            field.is_active = is_active
        
        field.save()
        
        # Sync usage if active status changed
        if is_active is not None:
            self._sync_custom_field_usage()
        
        logger.info(f"Custom field updated: {field_id}")
        
        return field
    
    def delete(self, field_id: UUID, hard: bool = False) -> bool:
        """
        Delete a custom field.
        
        By default, soft deletes by setting is_active=False.
        Use hard=True to permanently delete.
        """
        field = self.get(field_id)
        
        with transaction.atomic():
            if hard:
                field.delete()
                logger.info(f"Custom field hard deleted: {field_id}")
            else:
                field.is_active = False
                field.save()
                logger.info(f"Custom field soft deleted: {field_id}")
            
            # Sync usage to billing
            self._sync_custom_field_usage()
        
        return True
    
    def get(self, field_id: UUID) -> CustomFieldDefinition:
        """Get a custom field by ID."""
        try:
            return CustomFieldDefinition.objects.get(
                id=field_id,
                org_id=self.org_id
            )
        except CustomFieldDefinition.DoesNotExist:
            from .base_service import EntityNotFoundError
            raise EntityNotFoundError(
                entity_type='custom_field',
                entity_id=str(field_id)
            )
    
    def list_by_entity_type(
        self,
        entity_type: str,
        active_only: bool = True
    ) -> list[CustomFieldDefinition]:
        """List custom fields for an entity type."""
        queryset = CustomFieldDefinition.objects.filter(
            org_id=self.org_id,
            entity_type=entity_type
        )
        if active_only:
            queryset = queryset.filter(is_active=True)
        return list(queryset.order_by('order', 'name'))
    
    def list_all(self, active_only: bool = True) -> list[CustomFieldDefinition]:
        """List all custom fields for the organization."""
        queryset = CustomFieldDefinition.objects.filter(org_id=self.org_id)
        if active_only:
            queryset = queryset.filter(is_active=True)
        return list(queryset.order_by('entity_type', 'order', 'name'))
    
    def count(self, entity_type: Optional[str] = None) -> int:
        """Count custom fields, optionally by entity type."""
        queryset = CustomFieldDefinition.objects.filter(
            org_id=self.org_id,
            is_active=True
        )
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        return queryset.count()
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get custom field usage statistics."""
        stats = {
            'total': self.count(),
            'by_entity_type': {},
            'limit': self._get_custom_field_limit(),
        }
        
        for entity_type, _ in CustomFieldDefinition.EntityType.choices:
            stats['by_entity_type'][entity_type] = self.count(entity_type)
        
        return stats
    
    def reorder(self, entity_type: str, field_order: list[UUID]) -> None:
        """
        Reorder custom fields for an entity type.
        
        Args:
            entity_type: Entity type to reorder
            field_order: List of field IDs in desired order
        """
        with transaction.atomic():
            for idx, field_id in enumerate(field_order):
                CustomFieldDefinition.objects.filter(
                    id=field_id,
                    org_id=self.org_id,
                    entity_type=entity_type
                ).update(order=idx)
    
    # =========================================================================
    # BILLING INTEGRATION
    # =========================================================================
    
    def _check_custom_field_limit(self, entity_type: Optional[str] = None):
        """
        Check if custom field limit allows adding a new field.
        
        Raises:
            LimitExceededError: If limit exceeded
        """
        # Use parent's check_plan_limit method
        self.check_plan_limit('custom_fields', additional=1)
    
    def _get_custom_field_limit(self) -> Optional[int]:
        """Get the custom field limit for the current plan."""
        try:
            client = self._get_billing_client()
            if not client:
                # Fall back to local config
                limits = settings.CRM_SETTINGS.get('CUSTOM_FIELD_LIMITS', {})
                return limits.get(self.plan_tier, limits.get('free', 10))
            
            result = client.get_limit(
                org_id=self.org_id,
                service_code='crm',
                feature_code='custom_fields',
            )
            return result.get('limit')
        except Exception as e:
            logger.warning(f"Failed to get custom field limit: {e}")
            return None
    
    def _sync_custom_field_usage(self):
        """Sync current custom field count to billing service."""
        try:
            client = self._get_billing_client()
            if not client:
                return
            
            current_count = self.count()
            client.sync_usage(
                org_id=self.org_id,
                service_code='crm',
                feature_code='custom_fields',
                quantity=current_count,
            )
            logger.debug(f"Synced custom field usage: {current_count}")
        except Exception as e:
            logger.warning(f"Failed to sync custom field usage: {e}")
    
    # =========================================================================
    # VALIDATION
    # =========================================================================
    
    @staticmethod
    def validate_field_options(field_type: str, options: list) -> bool:
        """Validate options for select/multi-select fields."""
        if field_type not in ('select', 'multi_select'):
            return True
        
        if not options:
            return False
        
        for option in options:
            if not isinstance(option, dict):
                return False
            if 'value' not in option or 'label' not in option:
                return False
        
        return True
    
    @staticmethod
    def validate_field_value(
        field: CustomFieldDefinition,
        value: Any
    ) -> tuple[bool, Optional[str]]:
        """
        Validate a value against field definition.
        
        Returns:
            (is_valid, error_message)
        """
        if field.is_required and (value is None or value == ''):
            return False, f"{field.label} is required"
        
        if value is None or value == '':
            return True, None
        
        validation = field.validation or {}
        
        # Type-specific validation
        if field.field_type in ('text', 'textarea'):
            if not isinstance(value, str):
                return False, f"{field.label} must be text"
            if 'min_length' in validation and len(value) < validation['min_length']:
                return False, f"{field.label} must be at least {validation['min_length']} characters"
            if 'max_length' in validation and len(value) > validation['max_length']:
                return False, f"{field.label} must be at most {validation['max_length']} characters"
        
        elif field.field_type in ('number', 'decimal'):
            try:
                num_value = float(value) if field.field_type == 'decimal' else int(value)
            except (ValueError, TypeError):
                return False, f"{field.label} must be a number"
            
            if 'min' in validation and num_value < validation['min']:
                return False, f"{field.label} must be at least {validation['min']}"
            if 'max' in validation and num_value > validation['max']:
                return False, f"{field.label} must be at most {validation['max']}"
        
        elif field.field_type == 'select':
            valid_values = [opt['value'] for opt in field.options]
            if value not in valid_values:
                return False, f"{field.label} has invalid value"
        
        elif field.field_type == 'multi_select':
            valid_values = set(opt['value'] for opt in field.options)
            if not isinstance(value, list):
                return False, f"{field.label} must be a list"
            if not all(v in valid_values for v in value):
                return False, f"{field.label} has invalid values"
        
        return True, None
