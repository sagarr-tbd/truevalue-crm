"""
CRM Permission classes for role-based access control.

Uses roles/permissions from GatewayUser (set by GatewayAuthMiddleware).

Permission codes follow the format: resource:action
  e.g. contacts:read, deals:write, contacts:delete

System roles with bypass:
  - super_admin (level 0) — full access, bypasses all permission checks
  - org_admin   (level 10) — full org access, bypasses all permission checks
"""
import logging
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
