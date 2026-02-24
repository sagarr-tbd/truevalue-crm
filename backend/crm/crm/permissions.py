"""
CRM Permission classes for role-based access control.

Uses roles/permissions from GatewayUser (set by GatewayAuthMiddleware).

Permission codes follow the format: resource:action
  e.g. contacts:read, deals:write, contacts:delete

System roles with bypass:
  - super_admin (level 0) — full access, bypasses all permission checks
  - org_admin   (level 10) — full org access, bypasses all permission checks

Field-level security:
  - FieldLevelSecurityMixin can be added to views for field restrictions
  - Uses ResourcePolicy allowed_fields/denied_fields from Permission Service
"""
import logging
from typing import Optional
from django.conf import settings
from rest_framework.permissions import BasePermission

logger = logging.getLogger(__name__)

# Roles that bypass all permission checks
ADMIN_ROLES = {'super_admin', 'org_admin', 'owner', 'admin'}

# Map HTTP methods to permission actions
METHOD_ACTION_MAP = {
    'GET': 'read',
    'HEAD': 'read',
    'OPTIONS': 'read',
    'POST': 'write',
    'PUT': 'write',
    'PATCH': 'write',
    'DELETE': 'delete',
}


class CRMResourcePermission(BasePermission):
    """
    DRF permission class that checks request.user.permissions against
    the view's `resource` attribute.

    Usage on a view:
        class ContactListView(BaseAPIView):
            resource = 'contacts'

    For GET /contacts -> checks 'contacts:read'
    For POST /contacts -> checks 'contacts:write'
    For DELETE /contacts/123 -> checks 'contacts:delete'

    Views can override with `permission_action` to force a specific action:
        class ContactImportView(BaseAPIView):
            resource = 'contacts'
            permission_action = 'import'
    """

    def has_permission(self, request, view):
        user = request.user

        if not user or not getattr(user, 'is_authenticated', False):
            return False

        # Admin roles bypass all checks
        user_roles = set(getattr(user, 'roles', []))
        if user_roles & ADMIN_ROLES:
            return True

        # Determine the resource from the view
        # Views can implement get_resource(request) for dynamic resolution
        get_resource = getattr(view, 'get_resource', None)
        resource = get_resource(request) if callable(get_resource) else getattr(view, 'resource', None)
        if not resource:
            return True

        # Determine the action
        # Views can implement get_permission_action(request) for dynamic resolution
        get_action = getattr(view, 'get_permission_action', None)
        action = get_action(request) if callable(get_action) else getattr(view, 'permission_action', None)
        if not action:
            action = METHOD_ACTION_MAP.get(request.method, 'read')

        required_permission = f'{resource}:{action}'
        user_permissions = set(getattr(user, 'permissions', []))

        has_perm = required_permission in user_permissions
        if not has_perm:
            logger.info(
                f"Permission denied: user={getattr(user, 'email', '?')}, "
                f"required={required_permission}, "
                f"has={user_permissions}"
            )
        return has_perm

    def has_object_permission(self, request, view, obj):
        """
        Object-level check: reads are org-wide, writes/deletes restricted to
        the record owner. Admins and managers bypass.

        Views must call self.check_object_permissions(request, obj) for this
        to take effect — typically done in detail views after fetching the object.
        """
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True

        user = request.user
        user_roles = set(getattr(user, 'roles', []))
        if user_roles & ADMIN_ROLES:
            return True

        # Manager role can write/delete any record in their org
        if 'manager' in user_roles:
            return True

        owner_id = getattr(obj, 'owner_id', None)
        if owner_id is None:
            return True

        user_id = getattr(user, 'user_id', None)
        if user_id and str(owner_id) == str(user_id):
            return True

        logger.info(
            f"Object permission denied: user={user_id} tried to "
            f"modify {obj.__class__.__name__} owned by {owner_id}"
        )
        return False


# =============================================================================
# FIELD-LEVEL SECURITY
# =============================================================================

class FieldLevelSecurityMixin:
    """
    Mixin for views to enforce field-level security from ResourcePolicy.
    
    Usage:
        class ContactDetailView(FieldLevelSecurityMixin, BaseAPIView):
            resource = 'contacts'
            
            def get(self, request, contact_id):
                contact = self.get_object()
                serializer = ContactSerializer(contact)
                # Filter fields based on policy
                data = self.apply_field_security(request, serializer.data)
                return Response(data)
    
    Fields are filtered based on:
    1. allowed_fields from ResourcePolicy (whitelist)
    2. denied_fields from ResourcePolicy (blacklist)
    """
    
    def get_field_restrictions(
        self,
        request,
        resource: str,
        action: str
    ) -> tuple[Optional[set], Optional[set]]:
        """
        Get allowed/denied fields from Permission Service.
        
        Returns:
            (allowed_fields, denied_fields) or (None, None) if no restrictions
        """
        try:
            from truevalue_common.clients import PermissionClient
            
            client = PermissionClient()
            result = client.evaluate_policy(
                org_id=str(request.user.org_id),
                resource=resource,
                action=action,
                user_roles=getattr(request.user, 'roles', []),
                context={
                    'user_id': str(request.user.user_id),
                },
            )
            
            if not result.get('allowed'):
                return set(), set()
            
            allowed = result.get('allowed_fields')
            denied = result.get('denied_fields')
            
            return (
                set(allowed) if allowed else None,
                set(denied) if denied else None
            )
        except Exception as e:
            logger.warning(f"Failed to get field restrictions: {e}")
            return None, None
    
    def filter_response_fields(
        self,
        data,
        allowed_fields: Optional[set],
        denied_fields: Optional[set]
    ):
        """
        Remove restricted fields from response data.
        
        Args:
            data: Response data (dict or list of dicts)
            allowed_fields: Whitelist of allowed fields (None = all allowed)
            denied_fields: Blacklist of denied fields (None = none denied)
        
        Returns:
            Filtered data
        """
        if not denied_fields and not allowed_fields:
            return data
        
        if isinstance(data, list):
            return [
                self.filter_response_fields(item, allowed_fields, denied_fields)
                for item in data
            ]
        
        if isinstance(data, dict):
            filtered = {}
            for key, value in data.items():
                # Check blacklist first
                if denied_fields and key in denied_fields:
                    continue
                # Check whitelist
                if allowed_fields and key not in allowed_fields:
                    continue
                # Recurse for nested dicts
                if isinstance(value, (dict, list)):
                    filtered[key] = self.filter_response_fields(
                        value, None, None  # Don't apply restrictions to nested
                    )
                else:
                    filtered[key] = value
            return filtered
        
        return data
    
    def apply_field_security(self, request, data, resource: Optional[str] = None):
        """
        Apply field-level security to response data.
        
        Args:
            request: DRF Request object
            data: Response data
            resource: Resource name (defaults to view's resource attribute)
        
        Returns:
            Filtered data
        """
        user_roles = set(getattr(request.user, 'roles', []))
        
        # Admins bypass field security
        if user_roles & ADMIN_ROLES:
            return data
        
        resource = resource or getattr(self, 'resource', None)
        if not resource:
            return data
        
        action = METHOD_ACTION_MAP.get(request.method, 'read')
        
        allowed_fields, denied_fields = self.get_field_restrictions(
            request, resource, action
        )
        
        return self.filter_response_fields(data, allowed_fields, denied_fields)


class HierarchyBasedAccessMixin:
    """
    Mixin for views to filter querysets based on role hierarchy visibility.
    
    Users only see records owned by themselves and their subordinates.
    
    Usage:
        class ContactListView(HierarchyBasedAccessMixin, BaseAPIView):
            resource = 'contacts'
            
            def get_queryset(self):
                queryset = Contact.objects.filter(org_id=self.get_org_id())
                return self.filter_by_visibility(self.request, queryset)
    """
    
    _visible_user_ids_cache = None
    
    def get_visible_user_ids(self, request) -> list[str]:
        """
        Get list of user IDs whose records the current user can see.
        
        Caches result for the request.
        """
        if self._visible_user_ids_cache is not None:
            return self._visible_user_ids_cache
        
        user_roles = set(getattr(request.user, 'roles', []))
        
        # Admins see all
        if user_roles & ADMIN_ROLES:
            self._visible_user_ids_cache = []  # Empty means no filter
            return self._visible_user_ids_cache
        
        try:
            from truevalue_common.clients import PermissionClient
            
            client = PermissionClient()
            result = client.get_visible_user_ids(
                user_id=str(request.user.user_id),
                org_id=str(request.user.org_id),
            )
            
            self._visible_user_ids_cache = result.get('visible_user_ids', [])
            return self._visible_user_ids_cache
        except Exception as e:
            logger.warning(f"Failed to get visible user IDs: {e}")
            # Fall back to own ID only
            self._visible_user_ids_cache = [str(request.user.user_id)]
            return self._visible_user_ids_cache
    
    def filter_by_visibility(self, request, queryset, owner_field: str = 'owner_id'):
        """
        Filter queryset to only include records visible to the user.
        
        Args:
            request: DRF Request object
            queryset: Django QuerySet
            owner_field: Field name for record owner
        
        Returns:
            Filtered QuerySet
        """
        visible_ids = self.get_visible_user_ids(request)
        
        if not visible_ids:  # Admin - no filter
            return queryset
        
        return queryset.filter(**{f'{owner_field}__in': visible_ids})
    
    def can_access_record(self, request, record, owner_field: str = 'owner_id') -> bool:
        """
        Check if user can access a specific record.
        """
        visible_ids = self.get_visible_user_ids(request)
        
        if not visible_ids:  # Admin
            return True
        
        owner_id = str(getattr(record, owner_field, None))
        return owner_id in visible_ids
