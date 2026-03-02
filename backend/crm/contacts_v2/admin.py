from django.contrib import admin
from .models import ContactV2


@admin.register(ContactV2)
class ContactV2Admin(admin.ModelAdmin):

    list_display = [
        'id', 'get_display_name', 'get_display_email',
        'status', 'source', 'assigned_to_id', 'company_id',
        'org_id', 'owner_id', 'created_at', 'is_deleted',
    ]

    list_filter = [
        'status', 'source',
        'do_not_call', 'do_not_email',
        'created_at', 'deleted_at',
    ]

    search_fields = ['id', 'entity_data']

    readonly_fields = ['id', 'created_at', 'updated_at', 'deleted_at', 'converted_at']

    fieldsets = (
        ('Core Info', {
            'fields': ('id', 'org_id', 'owner_id')
        }),
        ('System Fields (Database Columns)', {
            'fields': ('status', 'source', 'assigned_to_id', 'company_id'),
            'description': 'Stored in real database columns for fast filtering.'
        }),
        ('Entity Data (Custom Fields)', {
            'fields': ('entity_data',),
            'description': 'Custom/dynamic fields stored as JSON.'
        }),
        ('Communication Preferences', {
            'fields': ('do_not_call', 'do_not_email'),
        }),
        ('Lead Conversion', {
            'fields': ('converted_from_lead_id', 'converted_at'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'deleted_at', 'last_activity_at', 'last_contacted_at'),
            'classes': ('collapse',)
        }),
    )

    def get_display_name(self, obj):
        first = obj.entity_data.get('first_name', '')
        last = obj.entity_data.get('last_name', '')
        name = f"{first} {last}".strip()
        return name if name else '(No name)'
    get_display_name.short_description = 'Name'

    def get_display_email(self, obj):
        return obj.entity_data.get('email', '(No email)')
    get_display_email.short_description = 'Email'

    def get_queryset(self, request):
        return ContactV2.objects.all()
