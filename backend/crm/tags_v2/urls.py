from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TagV2ViewSet

router = DefaultRouter()
router.register(r'tags', TagV2ViewSet, basename='tags-v2')

urlpatterns = [
    path('', include(router.urls)),
]
