from import_export import resources, fields

from .models import ActivityV2


class ActivityV2ExportResource(resources.ModelResource):
    """Export resource for V2 activities with member name resolution."""

    def __init__(self, member_map=None, **kwargs):
        super().__init__(**kwargs)
        self._member_map = member_map or {}

    def _resolve_uid(self, uid):
        uid = str(uid) if uid else ''
        if not uid or not self._member_map:
            return uid
        return self._member_map.get(uid, uid)

    id = fields.Field(attribute='id', column_name='ID')
    activity_type = fields.Field(attribute='activity_type', column_name='Type')
    subject = fields.Field(attribute='subject', column_name='Subject')
    description = fields.Field(attribute='description', column_name='Description')
    status = fields.Field(attribute='status', column_name='Status')
    priority = fields.Field(attribute='priority', column_name='Priority')
    due_date = fields.Field(attribute='due_date', column_name='Due Date')
    completed_at = fields.Field(attribute='completed_at', column_name='Completed At')
    start_time = fields.Field(attribute='start_time', column_name='Start Time')
    end_time = fields.Field(attribute='end_time', column_name='End Time')
    duration_minutes = fields.Field(attribute='duration_minutes', column_name='Duration (min)')
    call_direction = fields.Field(attribute='call_direction', column_name='Call Direction')
    call_outcome = fields.Field(attribute='call_outcome', column_name='Call Outcome')
    email_direction = fields.Field(attribute='email_direction', column_name='Email Direction')
    owner = fields.Field(column_name='Owner')
    assigned_to_name = fields.Field(column_name='Assigned To')
    created_at = fields.Field(attribute='created_at', column_name='Created Date')

    class Meta:
        model = ActivityV2
        fields = (
            'id', 'activity_type', 'subject', 'description',
            'status', 'priority', 'due_date', 'completed_at',
            'start_time', 'end_time', 'duration_minutes',
            'call_direction', 'call_outcome', 'email_direction',
            'owner', 'assigned_to_name', 'created_at',
        )
        export_order = fields

    def dehydrate_owner(self, obj):
        return self._resolve_uid(obj.owner_id)

    def dehydrate_assigned_to_name(self, obj):
        return self._resolve_uid(obj.assigned_to_id) if obj.assigned_to_id else ''
