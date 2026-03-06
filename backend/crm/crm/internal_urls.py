from django.urls import path
from . import internal_views, internal_v2_views

urlpatterns = [
    path('contacts/<uuid:contact_id>', internal_views.get_contact, name='internal-contact'),
    path('companies/<uuid:company_id>', internal_views.get_company, name='internal-company'),
    path('deals/<uuid:deal_id>', internal_views.get_deal, name='internal-deal'),
    path('orgs/<uuid:org_id>/stats', internal_views.get_org_stats, name='internal-org-stats'),
    path('orgs/<uuid:org_id>/usage', internal_views.record_usage, name='internal-record-usage'),
    path('users/<uuid:user_id>/invalidate-permissions', internal_views.invalidate_permissions, name='internal-invalidate-permissions'),
    path('v2/contacts/<uuid:contact_id>', internal_v2_views.get_contact_v2, name='internal-contact-v2'),
    path('v2/companies/<uuid:company_id>', internal_v2_views.get_company_v2, name='internal-company-v2'),
    path('v2/deals/<uuid:deal_id>', internal_v2_views.get_deal_v2, name='internal-deal-v2'),
    path('v2/orgs/<uuid:org_id>/stats', internal_v2_views.get_org_stats_v2, name='internal-org-stats-v2'),
    path('v2/orgs/<uuid:org_id>/usage', internal_v2_views.record_usage_v2, name='internal-record-usage-v2'),
    path('v2/users/<uuid:user_id>/invalidate-permissions', internal_v2_views.invalidate_permissions_v2, name='internal-invalidate-permissions-v2'),
]
