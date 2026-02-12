"""
Health check URL configuration.
"""
from django.urls import path
from . import health_views

urlpatterns = [
    path('', health_views.health_check, name='health'),
    path('live', health_views.liveness_check, name='health-live'),
    path('ready', health_views.readiness_check, name='health-ready'),
]
