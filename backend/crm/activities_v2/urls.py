from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityV2ViewSet

router = DefaultRouter()
router.register(r'activities', ActivityV2ViewSet, basename='activities-v2')

urlpatterns = [
    path('', include(router.urls)),
]
