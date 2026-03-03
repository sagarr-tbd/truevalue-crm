"""
CRM Service URL Configuration.
"""
from django.contrib import admin
from django.urls import path, include

# CRM Admin Panel Configuration
admin.site.site_header = "TrueValue CRM Admin"
admin.site.site_title = "CRM Admin"
admin.site.index_title = "CRM Management"
from . import search_v2, audit_v2_views, reports_v2
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# API Documentation
schema_view = get_schema_view(
    openapi.Info(
        title="TrueValue CRM API",
        default_version='v1',
        description="CRM Service API - Contacts, Companies, Deals, Leads, Activities",
        contact=openapi.Contact(email="support@truevalue.com"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Health checks
    path('health/', include('crm.health_urls')),
    
    # API v1
    path('api/v1/', include('crm.urls')),
    
    # API v2 - Dynamic Forms
    path('api/v2/forms/', include('forms_v2.urls')),
    
    # API v2 - Leads with Dynamic Forms
    path('api/v2/', include('leads_v2.urls')),
    
    # API v2 - Contacts with Dynamic Forms
    path('api/v2/', include('contacts_v2.urls')),
    
    # API v2 - Companies with Dynamic Forms
    path('api/v2/', include('companies_v2.urls')),
    
    # API v2 - Deals with Dynamic Forms
    path('api/v2/', include('deals_v2.urls')),
    
    # API v2 - Pipelines with Stages
    path('api/v2/', include('pipelines_v2.urls')),
    
    # API v2 - Activities (Tasks, Calls, Emails, Meetings, Notes)
    path('api/v2/', include('activities_v2.urls')),
    
    # API v2 - Tags (Polymorphic tagging)
    path('api/v2/', include('tags_v2.urls')),
    
    # API v2 - Global Search
    path('api/v2/search/', search_v2.GlobalSearchV2View.as_view(), name='global-search-v2'),
    
    # API v2 - Audit Log
    path('api/v2/audit-log/', audit_v2_views.AuditLogV2View.as_view(), name='audit-log-v2'),
    
    # API v2 - Reports & Analytics
    path('api/v2/reports/dashboard/', reports_v2.DashboardV2View.as_view(), name='dashboard-v2'),
    path('api/v2/reports/pipeline/', reports_v2.SalesPipelineReportV2View.as_view(), name='pipeline-report-v2'),
    path('api/v2/reports/team-activity/', reports_v2.TeamActivityReportV2View.as_view(), name='team-activity-report-v2'),
    path('api/v2/reports/lead-conversion/', reports_v2.LeadConversionReportV2View.as_view(), name='lead-conversion-report-v2'),
    
    # Internal endpoints (service-to-service)
    path('internal/', include('crm.internal_urls')),
    
    # API Documentation
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
