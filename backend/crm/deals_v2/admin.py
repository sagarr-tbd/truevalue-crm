from django.contrib import admin
from .models import DealV2


@admin.register(DealV2)
class DealV2Admin(admin.ModelAdmin):

    list_display = [
        'id', 'get_display_name', 'status', 'stage', 'value', 'currency',
        'probability', 'expected_close_date',
        'org_id', 'owner_id', 'created_at', 'is_deleted',
    ]

    list_filter = [
        'status', 'stage', 'currency',
        'created_at', 'expected_close_date', 'deleted_at',
    ]

    search_fields = ['id', 'entity_data']

    readonly_fields = ['id', 'created_at', 'updated_at', 'deleted_at', 'stage_entered_at']

    fieldsets = (
        ('Core Info', {
            'fields': ('id', 'org_id', 'owner_id')
        }),
        ('Deal Details (Database Columns)', {
            'fields': (
                'status', 'stage', 'value', 'currency', 'probability',
                'expected_close_date', 'actual_close_date',
                'loss_reason', 'pipeline_id',
                'assigned_to_id', 'contact_id', 'company_id',
                'converted_from_lead_id',
            ),
            'description': 'Stored in real database columns for fast filtering & aggregation.'
        }),
        ('Entity Data (Custom Fields)', {
            'fields': ('entity_data',),
            'description': 'Custom/dynamic fields stored as JSON.'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'deleted_at', 'stage_entered_at', 'last_activity_at'),
            'classes': ('collapse',)
        }),
    )

    def get_display_name(self, obj):
        return obj.entity_data.get('name', '(No name)')
    get_display_name.short_description = 'Deal Name'

    def get_queryset(self, request):
        return DealV2.objects.all()
