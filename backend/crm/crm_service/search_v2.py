"""
Global Search V2

Cross-entity search across all V2 entities using JSONB lookups.
Endpoint: GET /api/v2/search/?q=<query>&limit=5
"""

from uuid import UUID
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q, Value, CharField

from contacts_v2.models import ContactV2
from companies_v2.models import CompanyV2
from deals_v2.models import DealV2
from leads_v2.models import LeadV2


class GlobalSearchV2View(APIView):

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        limit = min(int(request.query_params.get('limit', 5)), 50)
        entity_types = request.query_params.get('types', '').split(',')
        entity_types = [t.strip() for t in entity_types if t.strip()]

        org_id = request.headers.get('X-Org-Id')
        if not org_id:
            return Response({'error': 'X-Org-Id header required'}, status=400)

        if not query or len(query) < 2:
            return Response({
                'contacts': [],
                'companies': [],
                'deals': [],
                'leads': [],
            })

        search_all = not entity_types
        results = {}

        if search_all or 'contact' in entity_types:
            results['contacts'] = self._search_contacts(org_id, query, limit)

        if search_all or 'company' in entity_types:
            results['companies'] = self._search_companies(org_id, query, limit)

        if search_all or 'deal' in entity_types:
            results['deals'] = self._search_deals(org_id, query, limit)

        if search_all or 'lead' in entity_types:
            results['leads'] = self._search_leads(org_id, query, limit)

        return Response(results)

    def _search_contacts(self, org_id, query, limit):
        contacts = ContactV2.objects.filter(
            org_id=org_id,
            deleted_at__isnull=True,
        ).filter(
            Q(entity_data__first_name__icontains=query) |
            Q(entity_data__last_name__icontains=query) |
            Q(entity_data__email__icontains=query) |
            Q(entity_data__phone__icontains=query)
        )[:limit]

        return [
            {
                'id': str(c.id),
                'type': 'contact',
                'name': c.get_full_name(),
                'email': c.get_email(),
                'status': c.status,
            }
            for c in contacts
        ]

    def _search_companies(self, org_id, query, limit):
        companies = CompanyV2.objects.filter(
            org_id=org_id,
            deleted_at__isnull=True,
        ).filter(
            Q(entity_data__name__icontains=query) |
            Q(entity_data__email__icontains=query) |
            Q(entity_data__phone__icontains=query) |
            Q(entity_data__website__icontains=query)
        )[:limit]

        return [
            {
                'id': str(c.id),
                'type': 'company',
                'name': c.get_name(),
                'email': c.get_email(),
                'status': c.status,
                'industry': c.industry,
            }
            for c in companies
        ]

    def _search_deals(self, org_id, query, limit):
        deals = DealV2.objects.filter(
            org_id=org_id,
            deleted_at__isnull=True,
        ).filter(
            Q(entity_data__name__icontains=query)
        )[:limit]

        return [
            {
                'id': str(d.id),
                'type': 'deal',
                'name': d.get_name(),
                'value': str(d.value),
                'status': d.status,
                'stage': d.stage,
            }
            for d in deals
        ]

    def _search_leads(self, org_id, query, limit):
        leads = LeadV2.objects.filter(
            org_id=org_id,
            deleted_at__isnull=True,
        ).filter(
            Q(entity_data__first_name__icontains=query) |
            Q(entity_data__last_name__icontains=query) |
            Q(entity_data__email__icontains=query) |
            Q(entity_data__company_name__icontains=query)
        )[:limit]

        return [
            {
                'id': str(l.id),
                'type': 'lead',
                'name': l.get_full_name(),
                'email': l.get_email(),
                'status': l.status,
                'source': l.source,
            }
            for l in leads
        ]
