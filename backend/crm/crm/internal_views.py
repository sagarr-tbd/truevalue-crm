"""
Internal views for service-to-service communication.

These endpoints are called by other services (not through the gateway).
They use service-to-service authentication.
"""
import logging
from uuid import UUID

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Sum, Q

from .models import Contact, Company, Deal, Lead, Activity

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(['GET'])
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
def get_org_stats(request, org_id):
    """Get CRM statistics for an organization."""
    try:
        org_uuid = UUID(str(org_id))
    except ValueError:
        return JsonResponse({'error': 'Invalid org_id'}, status=400)
    
    stats = {
        'org_id': str(org_id),
        'contacts': Contact.objects.filter(org_id=org_uuid).count(),
        'companies': Company.objects.filter(org_id=org_uuid).count(),
        'deals': {
            'total': Deal.objects.filter(org_id=org_uuid).count(),
            'open': Deal.objects.filter(org_id=org_uuid, status='open').count(),
            'won': Deal.objects.filter(org_id=org_uuid, status='won').count(),
            'lost': Deal.objects.filter(org_id=org_uuid, status='lost').count(),
        },
        'leads': {
            'total': Lead.objects.filter(org_id=org_uuid).count(),
            'new': Lead.objects.filter(org_id=org_uuid, status='new').count(),
            'converted': Lead.objects.filter(org_id=org_uuid, status='converted').count(),
        },
        'activities': Activity.objects.filter(org_id=org_uuid).count(),
    }
    
    # Add deal values
    deal_values = Deal.objects.filter(org_id=org_uuid).aggregate(
        total_value=Sum('value'),
        won_value=Sum('value', filter=Q(status='won')),
        lost_value=Sum('value', filter=Q(status='lost')),
        open_value=Sum('value', filter=Q(status='open')),
    )
    stats['deals']['total_value'] = str(deal_values['total_value'] or 0)
    stats['deals']['won_value'] = str(deal_values['won_value'] or 0)
    stats['deals']['lost_value'] = str(deal_values['lost_value'] or 0)
    stats['deals']['open_value'] = str(deal_values['open_value'] or 0)
    
    return JsonResponse(stats)


@csrf_exempt
@require_http_methods(['POST'])
def record_usage(request, org_id):
    """
    Record CRM usage for billing service.
    
    This is called periodically by the billing service to get usage metrics.
    """
    try:
        org_uuid = UUID(str(org_id))
    except ValueError:
        return JsonResponse({'error': 'Invalid org_id'}, status=400)
    
    usage = {
        'org_id': str(org_id),
        'contacts': Contact.objects.filter(org_id=org_uuid).count(),
        'companies': Company.objects.filter(org_id=org_uuid).count(),
        'deals': Deal.objects.filter(org_id=org_uuid).count(),
        'leads': Lead.objects.filter(org_id=org_uuid).count(),
        'activities': Activity.objects.filter(org_id=org_uuid).count(),
    }
    
    return JsonResponse(usage)
