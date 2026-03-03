from django.contrib import admin
from .models import ActivityV2


@admin.register(ActivityV2)
class ActivityV2Admin(admin.ModelAdmin):
    list_display = [
        'subject', 'activity_type', 'status', 'priority',
        'due_date', 'assigned_to_id', 'created_at',
    ]
    list_filter = ['activity_type', 'status', 'priority', 'deleted_at']
    search_fields = ['subject', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at', 'deleted_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Core', {
            'fields': ('id', 'org_id', 'owner_id', 'activity_type', 'subject', 'description')
        }),
        ('Status', {
            'fields': ('status', 'priority', 'due_date', 'completed_at')
        }),
        ('Scheduling', {
            'fields': ('start_time', 'end_time', 'duration_minutes'),
            'classes': ('collapse',)
        }),
        ('Call/Email', {
            'fields': ('call_direction', 'call_outcome', 'email_direction', 'email_message_id'),
            'classes': ('collapse',)
        }),
        ('Related Entities', {
            'fields': ('contact_id', 'company_id', 'deal_id', 'lead_id')
        }),
        ('Assignment', {
            'fields': ('assigned_to_id', 'created_by_id')
        }),
        ('Reminders', {
            'fields': ('reminder_at', 'reminder_sent'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return ActivityV2.all_objects.all()
