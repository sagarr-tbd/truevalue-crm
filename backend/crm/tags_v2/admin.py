from django.contrib import admin
from .models import TagV2, EntityTagV2


@admin.register(TagV2)
class TagV2Admin(admin.ModelAdmin):
    list_display = ['name', 'color', 'entity_type', 'org_id', 'created_at']
    list_filter = ['entity_type']
    search_fields = ['name']


@admin.register(EntityTagV2)
class EntityTagV2Admin(admin.ModelAdmin):
    list_display = ['tag', 'entity_type', 'entity_id', 'created_at']
    list_filter = ['entity_type']
