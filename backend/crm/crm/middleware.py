"""
CRM middleware for permission staleness detection.

When an admin changes a user's role, the platform bumps a permission version
in Redis using the current timestamp. Auth Service stamps each JWT with
perm_version=int(time.time()). Any JWT issued before the bump is stale.
"""
import logging
import time

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger(__name__)

PERM_VERSION_PREFIX = 'perm_version:'
PERM_VERSION_TTL = 86400  # 24 hours


def bump_permission_version(user_id: str) -> int:
    """
    Call this when a user's role/permissions change.
    Stores the current Unix timestamp so any JWT issued before this
    moment is considered stale.
    """
    key = f'{PERM_VERSION_PREFIX}{user_id}'
    version = int(time.time())
    cache.set(key, version, timeout=PERM_VERSION_TTL)
    return version


def get_permission_version(user_id: str) -> int:
    """Get the current permission version (timestamp) for a user."""
    return cache.get(f'{PERM_VERSION_PREFIX}{user_id}', 0)


class PermissionStalenessMiddleware:
    """
    Checks if the user's JWT permission version matches the latest version
    in Redis. If stale, returns 401 with X-Permission-Stale header so the
    frontend can trigger a token refresh.

    The JWT must include a `perm_version` claim (set by Auth Service).
    If no version is present in either JWT or Redis, the check is skipped
    (backwards compatible).
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.skip_prefixes = getattr(settings, 'GATEWAY_EXEMPT_PATHS', [])
        self.skip_prefixes += getattr(settings, 'GATEWAY_INTERNAL_PREFIXES', [])

    def __call__(self, request):
        if self._should_skip(request):
            return self.get_response(request)

        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return self.get_response(request)

        user_id = getattr(user, 'user_id', None)
        if not user_id:
            return self.get_response(request)

        jwt_version = getattr(user, 'perm_version', None)
        if jwt_version is None:
            return self.get_response(request)

        redis_version = get_permission_version(str(user_id))
        if redis_version == 0:
            return self.get_response(request)

        if int(jwt_version) < redis_version:
            logger.info(
                f"Stale permissions: user={user_id}, "
                f"jwt_version={jwt_version}, current={redis_version}"
            )
            return JsonResponse(
                {
                    'error': {
                        'code': 'PERMISSIONS_STALE',
                        'message': 'Your permissions have been updated. Please refresh.',
                    }
                },
                status=401,
                headers={'X-Permission-Stale': 'true'},
            )

        return self.get_response(request)

    def _should_skip(self, request):
        return any(request.path.startswith(p) for p in self.skip_prefixes)
