"""
Forms V2 URL Configuration.

API endpoints for dynamic form management.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FormDefinitionViewSet

router = DefaultRouter()
router.register(r'definitions', FormDefinitionViewSet, basename='form-definition')

app_name = 'forms_v2'

urlpatterns = [
    path('', include(router.urls)),
]
