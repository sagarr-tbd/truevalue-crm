from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PipelineV2ViewSet

router = DefaultRouter()
router.register(r'pipelines', PipelineV2ViewSet, basename='pipelines-v2')

urlpatterns = [
    path('', include(router.urls)),
]
