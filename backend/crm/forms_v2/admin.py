from django.contrib import admin
from .models import FormDefinition


@admin.register(FormDefinition)
class FormDefinitionAdmin(admin.ModelAdmin):
    list_display = ['name', 'entity_type', 'form_type', 'is_default', 'is_active', 'created_at']
    list_filter = ['entity_type', 'form_type', 'is_active', 'is_default']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('org_id', 'entity_type', 'name', 'description')
        }),
        ('Form Configuration', {
            'fields': ('form_type', 'is_default', 'is_active', 'schema')
        }),
        ('Metadata', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
