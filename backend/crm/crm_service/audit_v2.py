"""
Audit logging utility for V2 entities.

Reuses the existing CRMAuditLog model with entity_type suffixed '_v2'.
Provides a mixin for DRF ViewSets to auto-log create/update/delete.
"""
import logging
from typing import Optional
from uuid import UUID

from crm.models import CRMAuditLog

logger = logging.getLogger(__name__)


def log_v2_action(
    *,
    org_id,
    actor_id,
    action: str,
    entity_type: str,
    entity_id,
    entity_name: str = '',
    changes: dict = None,
    request=None,
):
    ip_address = None
    user_agent = None

    if request is not None:
        ip_address = (
            request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
            or request.META.get('REMOTE_ADDR')
        )
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

    try:
        CRMAuditLog.objects.create(
            org_id=org_id,
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name or '',
            changes=changes or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    except Exception:
        logger.exception("Failed to create V2 audit log entry")


def _get_entity_name(instance, entity_type: str) -> str:
    if hasattr(instance, 'get_full_name'):
        return instance.get_full_name()
    if hasattr(instance, 'get_name'):
        return instance.get_name()
    if hasattr(instance, 'subject'):
        return instance.subject or ''
    return str(instance)


def _diff_entity_data(old: dict, new: dict) -> dict:
    changes = {}
    all_keys = set(list(old.keys()) + list(new.keys()))
    for key in all_keys:
        old_val = old.get(key)
        new_val = new.get(key)
        if old_val != new_val:
            changes[key] = {'old': old_val, 'new': new_val}
    return changes


ENTITY_TYPE_MAP = {
    'ContactV2': 'contact_v2',
    'CompanyV2': 'company_v2',
    'DealV2': 'deal_v2',
    'LeadV2': 'lead_v2',
    'ActivityV2': 'activity_v2',
}


class AuditLogV2Mixin:
    """
    DRF ViewSet mixin — auto-logs create, update, and destroy actions
    for V2 entities to CRMAuditLog.

    Works at the view-method level (create/update/partial_update/destroy)
    so it doesn't interfere with existing perform_* overrides.
    """

    audit_tracked_fields = []

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code in (200, 201):
            entity_id = response.data.get('id')
            if entity_id:
                self._audit_log_from_response('create', response.data, request=request)
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_snapshot = self._snapshot(instance)
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            instance.refresh_from_db()
            changes = self._compute_changes(old_snapshot, instance)
            self._audit_log('update', instance, changes=changes, request=request)
        return response

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_snapshot = self._snapshot(instance)
        response = super().partial_update(request, *args, **kwargs)
        if response.status_code == 200:
            instance.refresh_from_db()
            changes = self._compute_changes(old_snapshot, instance)
            self._audit_log('update', instance, changes=changes, request=request)
        return response

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self._audit_log('delete', instance, request=request)
        except Exception:
            pass
        return super().destroy(request, *args, **kwargs)

    def _snapshot(self, instance):
        snap = {}
        if hasattr(instance, 'entity_data'):
            snap['entity_data'] = dict(instance.entity_data)
        for f in self.audit_tracked_fields:
            snap[f] = getattr(instance, f, None)
        return snap

    def _compute_changes(self, old_snapshot, instance):
        changes = {}
        if hasattr(instance, 'entity_data'):
            changes.update(
                _diff_entity_data(
                    old_snapshot.get('entity_data', {}),
                    instance.entity_data,
                )
            )
        for f in self.audit_tracked_fields:
            old_val = old_snapshot.get(f)
            new_val = getattr(instance, f, None)
            if str(old_val) != str(new_val):
                changes[f] = {
                    'old': str(old_val) if old_val is not None else None,
                    'new': str(new_val) if new_val is not None else None,
                }
        return changes

    def _audit_log_from_response(self, action, data, request=None):
        org_id = request.headers.get('X-Org-Id') if request else None
        actor_id = request.user.id if hasattr(request, 'user') and request.user else org_id
        entity_type = self._resolve_entity_type()

        log_v2_action(
            org_id=org_id,
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=data.get('id'),
            entity_name=data.get('display_name', data.get('name', '')),
            request=request,
        )

    def _audit_log(self, action, instance, changes=None, request=None):
        request = request or self.request
        org_id = getattr(instance, 'org_id', None) or request.headers.get('X-Org-Id')
        actor_id = request.user.id if hasattr(request, 'user') and request.user else org_id
        entity_type = ENTITY_TYPE_MAP.get(type(instance).__name__, type(instance).__name__.lower())

        log_v2_action(
            org_id=org_id,
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=instance.id,
            entity_name=_get_entity_name(instance, entity_type),
            changes=changes,
            request=request,
        )

    def _resolve_entity_type(self):
        model = getattr(self, 'queryset', None)
        if model is not None:
            model_class = model.model
            return ENTITY_TYPE_MAP.get(model_class.__name__, model_class.__name__.lower())
        return 'unknown'
