from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactV2ViewSet

router = DefaultRouter()
router.register(r'contacts', ContactV2ViewSet, basename='contacts-v2')

urlpatterns = [
    path('', include(router.urls)),
]
