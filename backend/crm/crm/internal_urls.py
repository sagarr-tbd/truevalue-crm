"""
Internal endpoints for service-to-service communication.
"""
from django.urls import path
from . import internal_views

urlpatterns = [
    # Get contact by ID (for other services)
    path('contacts/<uuid:contact_id>', internal_views.get_contact, name='internal-contact'),
    
    # Get company by ID (for other services)
    path('companies/<uuid:company_id>', internal_views.get_company, name='internal-company'),
    
    # Get deal by ID (for other services)
    path('deals/<uuid:deal_id>', internal_views.get_deal, name='internal-deal'),
    
    # Get CRM stats for an org (for billing/analytics)
    path('orgs/<uuid:org_id>/stats', internal_views.get_org_stats, name='internal-org-stats'),
    
    # Record usage (for billing)
    path('orgs/<uuid:org_id>/usage', internal_views.record_usage, name='internal-record-usage'),
    
    # Invalidate cached permissions (called when role changes)
    path('users/<uuid:user_id>/invalidate-permissions', internal_views.invalidate_permissions, name='internal-invalidate-permissions'),
]
