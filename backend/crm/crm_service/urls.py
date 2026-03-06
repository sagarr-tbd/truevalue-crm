from django.contrib import admin
from django.urls import path, include
from . import search_v2, audit_v2_views, reports_v2
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

admin.site.site_header = "TrueValue CRM Admin"
admin.site.site_title = "CRM Admin"
admin.site.index_title = "CRM Management"

schema_view = get_schema_view(
    openapi.Info(
        title="TrueValue CRM API",
        default_version='v2',
        description=(
            "TrueValue CRM Service API.\n\n"
            "**V1** (`/api/v1/`): Fixed-schema CRUD for Contacts, Companies, Deals, Leads, Activities, Pipelines, Tags.\n\n"
            "**V2** (`/api/v2/`): Dynamic form-builder architecture with JSONB entity_data, "
            "audit logging, global search, reports, and Kafka event publishing."
        ),
        contact=openapi.Contact(email="support@truevalue.com"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', include('crm.health_urls')),

    path('api/v1/', include('crm.urls')),

    path('api/v2/forms/', include('forms_v2.urls')),
    path('api/v2/', include('leads_v2.urls')),
    path('api/v2/', include('contacts_v2.urls')),
    path('api/v2/', include('companies_v2.urls')),
    path('api/v2/', include('deals_v2.urls')),
    path('api/v2/', include('pipelines_v2.urls')),
    path('api/v2/', include('activities_v2.urls')),
    path('api/v2/', include('tags_v2.urls')),
    path('api/v2/search/', search_v2.GlobalSearchV2View.as_view(), name='global-search-v2'),
    path('api/v2/audit-log/', audit_v2_views.AuditLogV2View.as_view(), name='audit-log-v2'),
    path('api/v2/reports/dashboard/', reports_v2.DashboardV2View.as_view(), name='dashboard-v2'),
    path('api/v2/reports/pipeline/', reports_v2.SalesPipelineReportV2View.as_view(), name='pipeline-report-v2'),
    path('api/v2/reports/team-activity/', reports_v2.TeamActivityReportV2View.as_view(), name='team-activity-report-v2'),
    path('api/v2/reports/lead-conversion/', reports_v2.LeadConversionReportV2View.as_view(), name='lead-conversion-report-v2'),

    path('internal/', include('crm.internal_urls')),

    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
