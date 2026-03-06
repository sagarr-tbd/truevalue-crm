from django.contrib import admin
from .models import CompanyV2


@admin.register(CompanyV2)
class CompanyV2Admin(admin.ModelAdmin):

    list_display = [
        'id', 'get_display_name', 'status', 'industry', 'size',
        'assigned_to_id', 'org_id', 'owner_id', 'created_at', 'is_deleted',
    ]

    list_filter = [
        'status', 'industry', 'size',
        'created_at', 'deleted_at',
    ]

    search_fields = ['id', 'entity_data']

    readonly_fields = ['id', 'created_at', 'updated_at', 'deleted_at']

    fieldsets = (
        ('Core Info', {
            'fields': ('id', 'org_id', 'owner_id')
        }),
        ('System Fields (Database Columns)', {
            'fields': ('status', 'industry', 'size', 'assigned_to_id', 'parent_company_id'),
            'description': 'Stored in real database columns for fast filtering.'
        }),
        ('Entity Data (Custom Fields)', {
            'fields': ('entity_data',),
            'description': 'Custom/dynamic fields stored as JSON.'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'deleted_at', 'last_activity_at'),
            'classes': ('collapse',)
        }),
    )

    def get_display_name(self, obj):
        return obj.entity_data.get('name', '(No name)')
    get_display_name.short_description = 'Company Name'

    def get_queryset(self, request):
        return CompanyV2.objects.all()
