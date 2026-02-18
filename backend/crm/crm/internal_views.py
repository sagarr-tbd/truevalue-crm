"""
Internal views for service-to-service communication.

These endpoints are called by other services (not through the gateway).
They use service-to-service HMAC authentication via ServiceAuthMiddleware.
"""
import functools
import logging
from uuid import UUID

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Sum, Q

from .models import Contact, Company, Deal, Lead, Activity

logger = logging.getLogger(__name__)


def require_service_auth(view_func):
    """Decorator that verifies the caller is an authenticated service."""
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        calling_service = getattr(request, 'calling_service', None)
        if not calling_service:
            logger.warning(
                f"Internal endpoint called without service auth: "
                f"path={request.path}, ip={request.META.get('REMOTE_ADDR', '?')}"
            )
            return JsonResponse(
                {'error': 'Service authentication required'}, status=401
            )
        return view_func(request, *args, **kwargs)
    return wrapper


@csrf_exempt
@require_http_methods(['GET'])
@require_service_auth
def get_contact(request, contact_id):
    """Get contact by ID for internal services."""
    org_id = request.GET.get('org_id')
    if not org_id:
        return JsonResponse({'error': 'org_id query parameter is required'}, status=400)
    try:
        org_uuid = UUID(str(org_id))
        contact = Contact.objects.get(id=contact_id, org_id=org_uuid)
        return JsonResponse({
            'id': str(contact.id),
            'org_id': str(contact.org_id),
            'first_name': contact.first_name,
            'last_name': contact.last_name,
            'email': contact.email,
            'phone': contact.phone,
            'status': contact.status,
        })
    except (ValueError, Contact.DoesNotExist):
        return JsonResponse({'error': 'Contact not found'}, status=404)


@csrf_exempt
@require_http_methods(['GET'])
@require_service_auth
def get_company(request, company_id):
    """Get company by ID for internal services."""
    org_id = request.GET.get('org_id')
    if not org_id:
        return JsonResponse({'error': 'org_id query parameter is required'}, status=400)
    try:
        org_uuid = UUID(str(org_id))
        company = Company.objects.get(id=company_id, org_id=org_uuid)
        return JsonResponse({
            'id': str(company.id),
            'org_id': str(company.org_id),
            'name': company.name,
            'website': company.website,
            'industry': company.industry,
        })
    except (ValueError, Company.DoesNotExist):
        return JsonResponse({'error': 'Company not found'}, status=404)


@csrf_exempt
@require_http_methods(['GET'])
@require_service_auth
def get_deal(request, deal_id):
    """Get deal by ID for internal services."""
    org_id = request.GET.get('org_id')
    if not org_id:
        return JsonResponse({'error': 'org_id query parameter is required'}, status=400)
    try:
        org_uuid = UUID(str(org_id))
        deal = Deal.objects.get(id=deal_id, org_id=org_uuid)
        return JsonResponse({
            'id': str(deal.id),
            'org_id': str(deal.org_id),
            'name': deal.name,
            'value': str(deal.value),
            'status': deal.status,
            'stage_name': deal.stage.name,
        })
    except (ValueError, Deal.DoesNotExist):
        return JsonResponse({'error': 'Deal not found'}, status=404)


@csrf_exempt
@require_http_methods(['GET'])
@require_service_auth
def get_org_stats(request, org_id):
    """Get CRM statistics for an organization — single DB roundtrip."""
    try:
        org_uuid = UUID(str(org_id))
    except ValueError:
        return JsonResponse({'error': 'Invalid org_id'}, status=400)

    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM crm_contact WHERE org_id = %s AND deleted_at IS NULL),
                (SELECT COUNT(*) FROM crm_company WHERE org_id = %s),
                (SELECT COUNT(*) FROM crm_activity WHERE org_id = %s),
                (SELECT COUNT(*) FROM crm_deal WHERE org_id = %s AND deleted_at IS NULL),
                (SELECT COUNT(*) FROM crm_deal WHERE org_id = %s AND deleted_at IS NULL AND status = 'open'),
                (SELECT COUNT(*) FROM crm_deal WHERE org_id = %s AND deleted_at IS NULL AND status = 'won'),
                (SELECT COUNT(*) FROM crm_deal WHERE org_id = %s AND deleted_at IS NULL AND status = 'lost'),
                (SELECT COALESCE(SUM(value), 0) FROM crm_deal WHERE org_id = %s AND deleted_at IS NULL),
                (SELECT COALESCE(SUM(value), 0) FROM crm_deal WHERE org_id = %s AND deleted_at IS NULL AND status = 'won'),
                (SELECT COALESCE(SUM(value), 0) FROM crm_deal WHERE org_id = %s AND deleted_at IS NULL AND status = 'lost'),
                (SELECT COALESCE(SUM(value), 0) FROM crm_deal WHERE org_id = %s AND deleted_at IS NULL AND status = 'open'),
                (SELECT COUNT(*) FROM crm_lead WHERE org_id = %s AND deleted_at IS NULL),
                (SELECT COUNT(*) FROM crm_lead WHERE org_id = %s AND deleted_at IS NULL AND status = 'new'),
                (SELECT COUNT(*) FROM crm_lead WHERE org_id = %s AND deleted_at IS NULL AND status = 'converted')
        """, [str(org_uuid)] * 14)
        r = cursor.fetchone()

    stats = {
        'org_id': str(org_id),
        'contacts': r[0],
        'companies': r[1],
        'activities': r[2],
        'deals': {
            'total': r[3],
            'open': r[4],
            'won': r[5],
            'lost': r[6],
            'total_value': str(r[7]),
            'won_value': str(r[8]),
            'lost_value': str(r[9]),
            'open_value': str(r[10]),
        },
        'leads': {
            'total': r[11],
            'new': r[12],
            'converted': r[13],
        },
    }

    return JsonResponse(stats)


@csrf_exempt
@require_http_methods(['POST'])
@require_service_auth
def record_usage(request, org_id):
    """
    Record CRM usage for billing service.
    
    This is called periodically by the billing service to get usage metrics.
    """
    try:
        org_uuid = UUID(str(org_id))
    except ValueError:
        return JsonResponse({'error': 'Invalid org_id'}, status=400)
    
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM crm_contact WHERE org_id = %s AND deleted_at IS NULL) AS contacts,
                (SELECT COUNT(*) FROM crm_company WHERE org_id = %s) AS companies,
                (SELECT COUNT(*) FROM crm_deal WHERE org_id = %s AND deleted_at IS NULL) AS deals,
                (SELECT COUNT(*) FROM crm_lead WHERE org_id = %s AND deleted_at IS NULL) AS leads,
                (SELECT COUNT(*) FROM crm_activity WHERE org_id = %s) AS activities
        """, [str(org_uuid)] * 5)
        row = cursor.fetchone()

    usage = {
        'org_id': str(org_id),
        'contacts': row[0],
        'companies': row[1],
        'deals': row[2],
        'leads': row[3],
        'activities': row[4],
    }

    return JsonResponse(usage)


@csrf_exempt
@require_http_methods(['POST'])
@require_service_auth
def invalidate_permissions(request, user_id):
    """
    Bump the permission version for a user, forcing token refresh.
    Called by the Permission/Org service when a user's role changes.
    """
    from .middleware import bump_permission_version

    try:
        UUID(str(user_id))
    except ValueError:
        return JsonResponse({'error': 'Invalid user_id'}, status=400)

    new_version = bump_permission_version(str(user_id))
    logger.info(f"Permission version bumped for user={user_id} to v{new_version}")
    return JsonResponse({'user_id': str(user_id), 'version': new_version})
