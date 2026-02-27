"""
CRM Service URL Configuration.
"""
from django.contrib import admin
from django.urls import path, include

# CRM Admin Panel Configuration
admin.site.site_header = "TrueValue CRM Admin"
admin.site.site_title = "CRM Admin"
admin.site.index_title = "CRM Management"
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
    
    # Internal endpoints (service-to-service)
    path('internal/', include('crm.internal_urls')),
    
    # API Documentation
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
