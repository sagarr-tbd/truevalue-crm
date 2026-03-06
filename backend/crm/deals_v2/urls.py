from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DealV2ViewSet

router = DefaultRouter()
router.register(r'deals', DealV2ViewSet, basename='deals-v2')

urlpatterns = [
    path('', include(router.urls)),
]
