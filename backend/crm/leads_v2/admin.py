"""
Leads V2 Admin

Admin interface for pure dynamic LeadV2 model.
"""

from django.contrib import admin
from .models import LeadV2


@admin.register(LeadV2)
class LeadV2Admin(admin.ModelAdmin):
    """
    Admin for V2 Leads (Pure Dynamic).
    
    Shows entity_data as JSON and allows filtering by status.
    """
    
    list_display = [
        'id',
        'get_display_name',
        'get_display_email',
        'status',
        'source',
        'assigned_to_id',
        'company_id',
        'org_id',
        'owner_id',
        'created_at',
        'is_deleted',
    ]
    
    list_filter = [
        'status',
        'source',
        'rating',
        'is_converted',
        'created_at',
        'deleted_at',
    ]
    
    search_fields = [
        'id',
        'entity_data',  # Search in JSONB
    ]
    
    readonly_fields = [
        'id',
        'created_at',
        'updated_at',
        'deleted_at',
        'converted_at',
    ]
    
    fieldsets = (
        ('Core Info', {
            'fields': ('id', 'org_id', 'owner_id')
        }),
        ('System Fields (Database Columns)', {
            'fields': ('status', 'source', 'rating', 'assigned_to_id', 'company_id', 'contact_id'),
            'description': 'These fields are stored in real database columns for fast filtering and relationships.'
        }),
        ('Entity Data (Custom Fields)', {
            'fields': ('entity_data',),
            'description': 'Custom/dynamic fields stored as JSON. Defined in Forms V2.'
        }),
        ('Conversion', {
            'fields': (
                'is_converted',
                'converted_at',
                'converted_contact_id',
                'converted_company_id',
                'converted_deal_id',
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'deleted_at', 'last_activity_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_display_name(self, obj):
        """Extract name from entity_data."""
        first = obj.entity_data.get('first_name', '')
        last = obj.entity_data.get('last_name', '')
        name = f"{first} {last}".strip()
        return name if name else '(No name)'
    get_display_name.short_description = 'Name'
    
    def get_display_email(self, obj):
        """Extract email from entity_data."""
        return obj.entity_data.get('email', '(No email)')
    get_display_email.short_description = 'Email'
    
    def get_queryset(self, request):
        """Include soft-deleted records in admin."""
        return LeadV2.objects.all()  # Show all including deleted
