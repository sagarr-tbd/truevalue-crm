"""
Leads V2 URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadV2ViewSet

router = DefaultRouter()
router.register(r'leads', LeadV2ViewSet, basename='leads-v2')

urlpatterns = [
    path('', include(router.urls)),
]
