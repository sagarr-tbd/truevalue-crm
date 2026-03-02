from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyV2ViewSet

router = DefaultRouter()
router.register(r'companies', CompanyV2ViewSet, basename='companies-v2')

urlpatterns = [
    path('', include(router.urls)),
]
