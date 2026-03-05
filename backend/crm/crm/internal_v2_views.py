import logging
from uuid import UUID

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from .internal_views import require_service_auth
from .middleware import bump_permission_version

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(['GET'])
@require_service_auth
def get_contact_v2(request, contact_id):
    from contacts_v2.models import ContactV2

    org_id = request.GET.get('org_id')
    if not org_id:
        return JsonResponse({'error': 'org_id query parameter is required'}, status=400)
    try:
        org_uuid = UUID(str(org_id))
        contact = ContactV2.objects.get(id=contact_id, org_id=org_uuid, deleted_at__isnull=True)
        return JsonResponse({
            'id': str(contact.id),
            'org_id': str(contact.org_id),
            'first_name': contact.entity_data.get('first_name', ''),
            'last_name': contact.entity_data.get('last_name', ''),
            'email': contact.get_email(),
            'phone': contact.get_phone(),
            'status': contact.status,
        })
    except (ValueError, ContactV2.DoesNotExist):
        return JsonResponse({'error': 'Contact not found'}, status=404)


@csrf_exempt
@require_http_methods(['GET'])
@require_service_auth
def get_company_v2(request, company_id):
    from companies_v2.models import CompanyV2

    org_id = request.GET.get('org_id')
    if not org_id:
        return JsonResponse({'error': 'org_id query parameter is required'}, status=400)
    try:
        org_uuid = UUID(str(org_id))
        company = CompanyV2.objects.get(id=company_id, org_id=org_uuid, deleted_at__isnull=True)
        return JsonResponse({
            'id': str(company.id),
            'org_id': str(company.org_id),
            'name': company.get_name(),
            'website': company.get_website(),
            'industry': company.industry or '',
        })
    except (ValueError, CompanyV2.DoesNotExist):
        return JsonResponse({'error': 'Company not found'}, status=404)


@csrf_exempt
@require_http_methods(['GET'])
@require_service_auth
def get_deal_v2(request, deal_id):
    from deals_v2.models import DealV2

    org_id = request.GET.get('org_id')
    if not org_id:
        return JsonResponse({'error': 'org_id query parameter is required'}, status=400)
    try:
        org_uuid = UUID(str(org_id))
        deal = DealV2.objects.get(id=deal_id, org_id=org_uuid, deleted_at__isnull=True)
        return JsonResponse({
            'id': str(deal.id),
            'org_id': str(deal.org_id),
            'name': deal.get_name(),
            'value': str(deal.value),
            'status': deal.status,
            'stage': deal.stage,
        })
    except (ValueError, DealV2.DoesNotExist):
        return JsonResponse({'error': 'Deal not found'}, status=404)


@csrf_exempt
@require_http_methods(['GET'])
@require_service_auth
def get_org_stats_v2(request, org_id):
    try:
        org_uuid = UUID(str(org_id))
    except ValueError:
        return JsonResponse({'error': 'Invalid org_id'}, status=400)

    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM crm_contacts_v2 WHERE org_id = %s AND deleted_at IS NULL),
                (SELECT COUNT(*) FROM crm_companies_v2 WHERE org_id = %s AND deleted_at IS NULL),
                (SELECT COUNT(*) FROM crm_activities_v2 WHERE org_id = %s AND deleted_at IS NULL),
                (SELECT COUNT(*) FROM crm_deals_v2 WHERE org_id = %s AND deleted_at IS NULL),
                (SELECT COUNT(*) FROM crm_deals_v2 WHERE org_id = %s AND deleted_at IS NULL AND status = 'open'),
                (SELECT COUNT(*) FROM crm_deals_v2 WHERE org_id = %s AND deleted_at IS NULL AND status = 'won'),
                (SELECT COUNT(*) FROM crm_deals_v2 WHERE org_id = %s AND deleted_at IS NULL AND status = 'lost'),
                (SELECT COALESCE(SUM(value), 0) FROM crm_deals_v2 WHERE org_id = %s AND deleted_at IS NULL),
                (SELECT COALESCE(SUM(value), 0) FROM crm_deals_v2 WHERE org_id = %s AND deleted_at IS NULL AND status = 'won'),
                (SELECT COALESCE(SUM(value), 0) FROM crm_deals_v2 WHERE org_id = %s AND deleted_at IS NULL AND status = 'lost'),
                (SELECT COALESCE(SUM(value), 0) FROM crm_deals_v2 WHERE org_id = %s AND deleted_at IS NULL AND status = 'open'),
                (SELECT COUNT(*) FROM crm_leads_v2 WHERE org_id = %s AND deleted_at IS NULL),
                (SELECT COUNT(*) FROM crm_leads_v2 WHERE org_id = %s AND deleted_at IS NULL AND status = 'new'),
                (SELECT COUNT(*) FROM crm_leads_v2 WHERE org_id = %s AND deleted_at IS NULL AND status = 'converted')
        """, [str(org_uuid)] * 14)
        r = cursor.fetchone()

    return JsonResponse({
        'org_id': str(org_id),
        'version': 'v2',
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
    })


@csrf_exempt
@require_http_methods(['POST'])
@require_service_auth
def record_usage_v2(request, org_id):
    try:
        org_uuid = UUID(str(org_id))
    except ValueError:
        return JsonResponse({'error': 'Invalid org_id'}, status=400)

    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM crm_contacts_v2 WHERE org_id = %s AND deleted_at IS NULL) AS contacts,
                (SELECT COUNT(*) FROM crm_companies_v2 WHERE org_id = %s AND deleted_at IS NULL) AS companies,
                (SELECT COUNT(*) FROM crm_deals_v2 WHERE org_id = %s AND deleted_at IS NULL) AS deals,
                (SELECT COUNT(*) FROM crm_leads_v2 WHERE org_id = %s AND deleted_at IS NULL) AS leads,
                (SELECT COUNT(*) FROM crm_activities_v2 WHERE org_id = %s AND deleted_at IS NULL) AS activities
        """, [str(org_uuid)] * 5)
        row = cursor.fetchone()

    return JsonResponse({
        'org_id': str(org_id),
        'version': 'v2',
        'contacts': row[0],
        'companies': row[1],
        'deals': row[2],
        'leads': row[3],
        'activities': row[4],
    })


@csrf_exempt
@require_http_methods(['POST'])
@require_service_auth
def invalidate_permissions_v2(request, user_id):
    try:
        UUID(str(user_id))
    except ValueError:
        return JsonResponse({'error': 'Invalid user_id'}, status=400)

    new_version = bump_permission_version(str(user_id))
    logger.info(f"[V2] Permission version bumped for user={user_id} to v{new_version}")
    return JsonResponse({'user_id': str(user_id), 'version': new_version})
