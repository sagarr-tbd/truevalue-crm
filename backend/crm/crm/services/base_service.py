"""
Base service class with common functionality.
"""
import json
import logging
from typing import Optional, Type, TypeVar, Generic, List, Dict, Any
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal

from django.db import models, transaction
from django.db.models import Q
from django.conf import settings

from ..models import CRMAuditLog, Tag, EntityTag
from ..exceptions import EntityNotFoundError, LimitExceededError, PermissionDeniedError

logger = logging.getLogger(__name__)


class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for UUID and other types."""
    
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if hasattr(obj, '__dict__'):
            return str(obj)
        return super().default(obj)


def serialize_for_json(data: Any) -> Any:
    """Serialize data to be JSON-compatible."""
    if isinstance(data, dict):
        return {k: serialize_for_json(v) for k, v in data.items()}
    elif isinstance(data, (list, tuple)):
        return [serialize_for_json(item) for item in data]
    elif isinstance(data, UUID):
        return str(data)
    elif isinstance(data, (datetime, date)):
        return data.isoformat()
    elif isinstance(data, Decimal):
        return float(data)
    elif hasattr(data, 'pk'):  # Model instance
        return str(data.pk)
    return data

T = TypeVar('T', bound=models.Model)


class AdvancedFilterMixin:
    """
    Mixin for advanced filtering capabilities.
    
    Provides a reusable implementation of advanced filter logic
    that can be customized per-entity via class attributes.
    
    Usage:
        class MyService(AdvancedFilterMixin, BaseService[MyModel]):
            FILTER_FIELD_MAP = {'name': 'name', ...}
    """
    
    # Override these in subclasses
    FILTER_FIELD_MAP: Dict[str, Any] = {}
    
    # Standard operator mapping (shared across all services)
    FILTER_OPERATOR_MAP = {
        # camelCase operators (from frontend)
        'equals': '__iexact',
        'notEquals': '__iexact',  # handled with exclude
        'contains': '__icontains',
        'notContains': '__icontains',  # handled with exclude
        'startsWith': '__istartswith',
        'endsWith': '__iendswith',
        'isEmpty': '__isnull',
        'isNotEmpty': '__isnull',
        'greaterThan': '__gt',
        'lessThan': '__lt',
        'greaterThanOrEqual': '__gte',
        'lessThanOrEqual': '__lte',
        'in': '__in',
        'notIn': '__in',  # handled with exclude
        # snake_case operators (legacy support)
        'not_equals': '__iexact',
        'not_contains': '__icontains',
        'starts_with': '__istartswith',
        'ends_with': '__iendswith',
        'is_empty': '__isnull',
        'is_not_empty': '__isnull',
        'greater_than': '__gt',
        'less_than': '__lt',
        'greater_than_or_equal': '__gte',
        'less_than_or_equal': '__lte',
    }
    
    # Operators that should use exclude() instead of filter()
    EXCLUDE_OPERATORS = {'notEquals', 'not_equals', 'notContains', 'not_contains', 'notIn'}
    
    # Fields that are UUIDs and need special handling
    UUID_FIELDS: set = set()
    
    def _build_advanced_filter_q(
        self, 
        conditions: List[Dict], 
        logic: str = 'and'
    ) -> tuple:
        """
        Build Q objects from advanced filter conditions.
        
        Args:
            conditions: List of filter conditions with field, operator, value
            logic: 'and' or 'or' to combine conditions
            
        Returns:
            Tuple of (combined_q_object, list_of_exclude_q_objects)
        """
        if not conditions:
            return Q(), []
        
        q_objects = []
        exclude_objects = []
        
        for condition in conditions:
            field = condition.get('field')
            operator = condition.get('operator', 'contains')
            value = condition.get('value', '')
            
            # Get backend field name - SECURITY: Only allow mapped fields
            backend_field = self.FILTER_FIELD_MAP.get(field)
            if backend_field is None:
                # Unknown field, skip to prevent SQL injection
                continue
            
            # Handle compound name fields (searches multiple fields with OR)
            if isinstance(backend_field, list):
                self._add_compound_field_filter(
                    backend_field, operator, value, q_objects, exclude_objects
                )
                continue
            
            # Handle UUID fields specially
            if field in self.UUID_FIELDS or backend_field in self.UUID_FIELDS:
                self._add_uuid_field_filter(
                    backend_field, operator, value, q_objects, exclude_objects
                )
                continue
            
            # Build the lookup for standard fields
            django_op = self.FILTER_OPERATOR_MAP.get(operator, '__icontains')
            
            # Handle special operators (isEmpty/isNotEmpty)
            if operator in ('isEmpty', 'is_empty'):
                q = Q(**{f'{backend_field}__isnull': True}) | Q(**{f'{backend_field}': ''})
                q_objects.append(q)
            elif operator in ('isNotEmpty', 'is_not_empty'):
                q = Q(**{f'{backend_field}__isnull': False}) & ~Q(**{f'{backend_field}': ''})
                q_objects.append(q)
            elif operator in self.EXCLUDE_OPERATORS:
                exclude_objects.append(Q(**{f'{backend_field}{django_op}': value}))
            else:
                q_objects.append(Q(**{f'{backend_field}{django_op}': value}))
        
        # Combine Q objects based on logic
        combined = Q()
        if logic == 'or':
            for q in q_objects:
                combined |= q
        else:  # 'and'
            for q in q_objects:
                combined &= q
        
        return combined, exclude_objects
    
    def _add_compound_field_filter(
        self,
        fields: List[str],
        operator: str,
        value: str,
        q_objects: list,
        exclude_objects: list
    ):
        """Add filter for compound fields (e.g., name -> first_name OR last_name)."""
        django_op = self.FILTER_OPERATOR_MAP.get(operator, '__icontains')
        
        if operator in self.EXCLUDE_OPERATORS:
            # Build OR of excludes
            compound_q = Q()
            for f in fields:
                compound_q |= Q(**{f'{f}{django_op}': value})
            exclude_objects.append(compound_q)
        else:
            # Build OR of filters
            compound_q = Q()
            for f in fields:
                compound_q |= Q(**{f'{f}{django_op}': value})
            q_objects.append(compound_q)
    
    def _add_uuid_field_filter(
        self,
        backend_field: str,
        operator: str,
        value: str,
        q_objects: list,
        exclude_objects: list
    ):
        """Add filter for UUID fields with proper validation."""
        from uuid import UUID as UUIDType
        
        try:
            uuid_value = UUIDType(value) if value else None
            
            if operator == 'equals':
                q_objects.append(Q(**{backend_field: uuid_value}))
            elif operator in ('notEquals', 'not_equals'):
                exclude_objects.append(Q(**{backend_field: uuid_value}))
            elif operator in ('isEmpty', 'is_empty'):
                q_objects.append(Q(**{f'{backend_field}__isnull': True}))
            elif operator in ('isNotEmpty', 'is_not_empty'):
                q_objects.append(Q(**{f'{backend_field}__isnull': False}))
        except (ValueError, TypeError):
            # Invalid UUID, skip this condition
            pass
    
    def apply_advanced_filters(
        self, 
        queryset, 
        advanced_filters: List[Dict], 
        filter_logic: str = 'and'
    ):
        """
        Apply advanced filters to a queryset.
        
        Args:
            queryset: Django QuerySet to filter
            advanced_filters: List of filter conditions
            filter_logic: 'and' or 'or'
            
        Returns:
            Filtered QuerySet
        """
        if not advanced_filters:
            return queryset
        
        filter_q, exclude_list = self._build_advanced_filter_q(
            advanced_filters, filter_logic
        )
        
        if filter_q:
            queryset = queryset.filter(filter_q)
        
        for exclude_q in exclude_list:
            queryset = queryset.exclude(exclude_q)
        
        return queryset


class BaseService(Generic[T]):
    """
    Base service class with common CRUD operations.
    
    Provides:
    - Org-scoped queries
    - Audit logging
    - Tag management
    - Plan limit checking
    """
    
    model: Type[T] = None
    entity_type: str = None
    billing_feature_code: str = None  # Set in subclass to auto-sync usage on delete
    
    def __init__(self, org_id: UUID, user_id: UUID):
        self.org_id = org_id
        self.user_id = user_id
    
    def get_queryset(self) -> models.QuerySet:
        """Get base queryset scoped to organization."""
        return self.model.objects.filter(org_id=self.org_id)
    
    def get_by_id(self, entity_id: UUID) -> T:
        """Get entity by ID."""
        try:
            return self.get_queryset().get(id=entity_id)
        except self.model.DoesNotExist:
            raise EntityNotFoundError(self.entity_type, str(entity_id))
    
    def get_by_ids(self, entity_ids: List[UUID]) -> models.QuerySet:
        """Get multiple entities by IDs."""
        return self.get_queryset().filter(id__in=entity_ids)
    
    def list(
        self,
        filters: Dict[str, Any] = None,
        search: str = None,
        search_fields: List[str] = None,
        order_by: str = '-created_at',
        limit: int = None,
        offset: int = 0,
    ) -> models.QuerySet:
        """List entities with filtering and search."""
        qs = self.get_queryset()
        
        # Apply filters
        if filters:
            qs = qs.filter(**filters)
        
        # Apply search
        if search and search_fields:
            search_q = Q()
            for field in search_fields:
                search_q |= Q(**{f"{field}__icontains": search})
            qs = qs.filter(search_q)
        
        # Apply ordering
        if order_by:
            qs = qs.order_by(order_by)
        
        # Apply pagination
        if limit:
            qs = qs[offset:offset + limit]
        
        return qs
    
    def count(self, filters: Dict[str, Any] = None) -> int:
        """Count entities."""
        qs = self.get_queryset()
        if filters:
            qs = qs.filter(**filters)
        return qs.count()
    
    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> T:
        """Create a new entity."""
        # Set org_id
        data['org_id'] = self.org_id
        
        # Set owner if model has owner_id
        if hasattr(self.model, 'owner_id') and 'owner_id' not in data:
            data['owner_id'] = self.user_id
        
        # Extract tags before creating
        tag_ids = data.pop('tag_ids', None)
        
        # Create entity
        entity = self.model.objects.create(**data)
        
        # Handle tags
        if tag_ids:
            self._set_tags(entity, tag_ids)
        
        # Log creation
        self._log_action(
            action=CRMAuditLog.Action.CREATE,
            entity=entity,
            changes={'created': data}
        )
        
        return entity
    
    @transaction.atomic
    def update(self, entity_id: UUID, data: Dict[str, Any], **kwargs) -> T:
        """Update an entity."""
        entity = self.get_by_id(entity_id)
        
        # Track changes
        old_values = {}
        for field, value in data.items():
            if hasattr(entity, field):
                old_values[field] = getattr(entity, field)
        
        # Extract tags before updating
        tag_ids = data.pop('tag_ids', None)
        
        # Update fields
        for field, value in data.items():
            if hasattr(entity, field):
                setattr(entity, field, value)
        
        entity.save()
        
        # Handle tags
        if tag_ids is not None:
            self._set_tags(entity, tag_ids)
        
        # Log update
        changes = {}
        for field, old_value in old_values.items():
            new_value = getattr(entity, field)
            if old_value != new_value:
                changes[field] = {'old': str(old_value), 'new': str(new_value)}
        
        if changes:
            self._log_action(
                action=CRMAuditLog.Action.UPDATE,
                entity=entity,
                changes=changes
            )
        
        return entity
    
    @transaction.atomic
    def delete(self, entity_id: UUID, hard: bool = False, **kwargs) -> bool:
        """
        Delete an entity (soft delete by default).
        
        Args:
            entity_id: UUID of entity to delete
            hard: If True, permanently delete. If False (default), soft delete.
            
        Returns:
            True if deletion successful
        """
        entity = self.get_by_id(entity_id)
        entity_name = str(entity)
        
        # Log before deletion
        self._log_action(
            action=CRMAuditLog.Action.DELETE,
            entity=entity,
            changes={'deleted': True, 'hard_delete': hard}
        )
        
        if hard:
            # Permanent deletion
            if hasattr(entity, 'hard_delete'):
                entity.hard_delete()
            else:
                entity.delete()
        else:
            # Soft delete
            if hasattr(entity, 'soft_delete'):
                entity.soft_delete(deleted_by=self.user_id)
            else:
                entity.delete()
        
        # Sync usage to billing after deletion
        if self.billing_feature_code:
            self.sync_usage_to_billing(self.billing_feature_code)
        
        return True
    
    @transaction.atomic
    def restore(self, entity_id: UUID) -> T:
        """
        Restore a soft-deleted entity.
        
        Args:
            entity_id: UUID of entity to restore
            
        Returns:
            The restored entity
        """
        # Use all_objects to find deleted records
        try:
            entity = self.model.all_objects.get(id=entity_id, org_id=self.org_id)
        except self.model.DoesNotExist:
            raise EntityNotFoundError(self.entity_type, str(entity_id))
        
        if not hasattr(entity, 'restore'):
            raise EntityNotFoundError(self.entity_type, str(entity_id))
        
        entity.restore()
        
        # Log restoration
        self._log_action(
            action=CRMAuditLog.Action.UPDATE,
            entity=entity,
            changes={'restored': True}
        )
        
        return entity
    
    def _set_tags(self, entity: T, tag_ids: List[UUID]):
        """Set tags for an entity."""
        # Clear existing tags
        EntityTag.objects.filter(
            entity_type=self.entity_type,
            entity_id=entity.id
        ).delete()
        
        # Add new tags
        tags = Tag.objects.filter(id__in=tag_ids, org_id=self.org_id)
        for tag in tags:
            EntityTag.objects.create(
                tag=tag,
                entity_type=self.entity_type,
                entity_id=entity.id,
                **{self.entity_type: entity} if hasattr(EntityTag, self.entity_type) else {}
            )
    
    def _log_action(
        self,
        action: str,
        entity: T,
        changes: Dict[str, Any] = None,
        ip_address: str = None,
        user_agent: str = None,
    ):
        """Log an action to the audit log."""
        try:
            # Serialize changes to ensure JSON compatibility
            serialized_changes = serialize_for_json(changes or {})
            
            CRMAuditLog.objects.create(
                org_id=self.org_id,
                actor_id=self.user_id,
                action=action,
                entity_type=self.entity_type,
                entity_id=entity.id,
                entity_name=str(entity)[:255],
                changes=serialized_changes,
                ip_address=ip_address,
                user_agent=user_agent[:500] if user_agent else None,
            )
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
    
    def check_plan_limit(self, feature_code: str, additional: int = 1):
        """
        Check if plan limit allows this action.
        
        Calls the Billing Service via BillingClient (source of truth).
        Falls back to local CRM_SETTINGS limits if billing is unavailable.
        
        Args:
            feature_code: Feature to check (e.g., 'contacts', 'deals', 'pipelines')
            additional: Number of new items being added (default: 1)
        """
        allowed, message, limit, current = self._check_limit_with_billing(
            feature_code, additional
        )
        
        if allowed is None:
            # Billing service unavailable — fall back to local limits
            logger.warning(
                f"Billing service unavailable, using local limits for {feature_code}"
            )
            self._check_limit_local(feature_code)
            return
        
        if not allowed:
            raise LimitExceededError(
                resource=self.entity_type,
                limit=limit or 0,
                current=current or 0,
            )
    
    def _check_limit_with_billing(self, feature_code: str, additional: int = 1):
        """
        Check limit via Billing Service internal API.
        
        Returns:
            Tuple of (allowed, message, limit, current).
            allowed=None means billing service is unavailable.
        """
        try:
            client = self._get_billing_client()
            if not client:
                return None, "Billing service not configured", None, None
            
            result = client.check_limit(
                org_id=self.org_id,
                service_code='crm',
                feature_code=feature_code,
                additional=additional,
            )
            
            return (
                result.get('allowed', False),
                result.get('message', ''),
                result.get('limit'),
                result.get('current'),
            )
        except Exception as e:
            logger.error(f"Error checking limit with Billing Service: {e}")
            return None, str(e), None, None
    
    def _check_limit_local(self, feature_code: str):
        """
        Fallback: check limits using local CRM_SETTINGS when billing is unavailable.
        Uses 'free' plan limits as a safe default.
        """
        limit_key_map = {
            'contacts': 'CONTACT_LIMITS',
            'pipelines': 'PIPELINE_LIMITS',
            'custom_fields': 'CUSTOM_FIELD_LIMITS',
        }
        limit_key = limit_key_map.get(feature_code)
        if not limit_key:
            return  # No local limit defined — allow
        
        limits = settings.CRM_SETTINGS.get(limit_key, {})
        limit = limits.get('free', 0)
        
        if limit == 0:  # Unlimited
            return
        
        current_count = self.count()
        if current_count >= limit:
            raise LimitExceededError(
                resource=self.entity_type,
                limit=limit,
                current=current_count,
            )
    
    def _get_billing_client(self):
        """
        Get a configured BillingClient instance, or None if unavailable.
        """
        import os
        try:
            from truevalue_common.clients import BillingClient
            
            billing_url = getattr(settings, 'BILLING_SERVICE_URL', None)
            if not billing_url:
                return None
            
            return BillingClient(
                base_url=billing_url,
                service_name=os.getenv('SERVICE_NAME', 'crm-service'),
                service_secret=os.getenv('SERVICE_SECRET', ''),
                timeout=5.0,
            )
        except Exception as e:
            logger.error(f"Failed to create BillingClient: {e}")
            return None
    
    def sync_usage_to_billing(self, feature_code: str):
        """
        Sync the actual entity count to the Billing Service.
        
        Sets the absolute count for the given feature so the billing
        service's usage endpoint reflects real CRM data.
        
        Uses transaction.on_commit() so the HTTP call happens AFTER the
        DB transaction commits — avoids holding DB locks during network I/O.
        Failures are logged but never block the CRM operation.
        
        Args:
            feature_code: Feature code matching billing (e.g., 'contacts', 'deals')
        """
        # Capture values now (inside the transaction) — the callback
        # runs after commit, when self may have changed.
        org_id = self.org_id
        
        def _do_sync():
            try:
                client = self._get_billing_client()
                if not client:
                    return
                
                current_count = self.count()
                client.sync_usage(
                    org_id=org_id,
                    service_code='crm',
                    feature_code=feature_code,
                    quantity=current_count,
                )
                logger.debug(
                    f"Synced usage: {feature_code}={current_count} for org={org_id}"
                )
            except Exception as e:
                # Never block CRM operations for billing sync failures
                logger.warning(f"Failed to sync usage to billing for {feature_code}: {e}")
        
        transaction.on_commit(_do_sync)
