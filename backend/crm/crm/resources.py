from import_export import resources, fields

from .models import Contact, Company, Lead, Deal, Activity


class BaseExportResource(resources.ModelResource):
    """Base resource that accepts a member_map for resolving owner UUIDs to names."""

    def __init__(self, member_map=None, **kwargs):
        super().__init__(**kwargs)
        self._member_map = member_map or {}

    def _resolve_uid(self, uid):
        uid = str(uid) if uid else ''
        if not uid or not self._member_map:
            return uid
        return self._member_map.get(uid, uid)


class ContactResource(BaseExportResource):
    id = fields.Field(attribute='id', column_name='ID')
    first_name = fields.Field(attribute='first_name', column_name='First Name')
    last_name = fields.Field(attribute='last_name', column_name='Last Name')
    full_name = fields.Field(column_name='Full Name')
    email = fields.Field(attribute='email', column_name='Email')
    phone = fields.Field(attribute='phone', column_name='Phone')
    mobile = fields.Field(attribute='mobile', column_name='Mobile')
    title = fields.Field(attribute='title', column_name='Job Title')
    department = fields.Field(attribute='department', column_name='Department')
    company = fields.Field(column_name='Company')
    status = fields.Field(attribute='status', column_name='Status')
    source = fields.Field(attribute='source', column_name='Source')
    tags = fields.Field(column_name='Tags')
    deal_count = fields.Field(column_name='Deal Count')
    activity_count = fields.Field(column_name='Activity Count')
    owner = fields.Field(column_name='Owner')
    last_activity_at = fields.Field(attribute='last_activity_at', column_name='Last Activity')
    created_at = fields.Field(attribute='created_at', column_name='Created Date')

    class Meta:
        model = Contact
        fields = (
            'id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'mobile', 'title', 'department',
            'company', 'status', 'source', 'tags',
            'deal_count', 'activity_count', 'owner',
            'last_activity_at', 'created_at',
        )
        export_order = fields

    def dehydrate_full_name(self, obj):
        return obj.full_name

    def dehydrate_company(self, obj):
        return obj.primary_company.name if obj.primary_company else ''

    def dehydrate_tags(self, obj):
        return ', '.join(t.name for t in obj.tags.all())

    def dehydrate_owner(self, obj):
        return self._resolve_uid(obj.owner_id)

    def dehydrate_deal_count(self, obj):
        return getattr(obj, 'deal_count', 0)

    def dehydrate_activity_count(self, obj):
        return getattr(obj, 'activity_count', 0)


class CompanyResource(BaseExportResource):
    id = fields.Field(attribute='id', column_name='ID')
    name = fields.Field(attribute='name', column_name='Company Name')
    industry = fields.Field(attribute='industry', column_name='Industry')
    size = fields.Field(attribute='size', column_name='Size')
    phone = fields.Field(attribute='phone', column_name='Phone')
    email = fields.Field(attribute='email', column_name='Email')
    city = fields.Field(attribute='city', column_name='City')
    state = fields.Field(attribute='state', column_name='State')
    country = fields.Field(attribute='country', column_name='Country')
    annual_revenue = fields.Field(attribute='annual_revenue', column_name='Annual Revenue')
    employee_count = fields.Field(attribute='employee_count', column_name='Employees')
    tags = fields.Field(column_name='Tags')
    owner = fields.Field(column_name='Owner')
    created_at = fields.Field(attribute='created_at', column_name='Created Date')

    class Meta:
        model = Company
        fields = (
            'id', 'name', 'industry', 'size',
            'phone', 'email', 'city', 'state', 'country',
            'annual_revenue', 'employee_count', 'tags', 'owner',
            'created_at',
        )
        export_order = fields

    def dehydrate_tags(self, obj):
        return ', '.join(t.name for t in obj.tags.all())

    def dehydrate_owner(self, obj):
        return self._resolve_uid(obj.owner_id)


class LeadResource(BaseExportResource):
    id = fields.Field(attribute='id', column_name='ID')
    first_name = fields.Field(attribute='first_name', column_name='First Name')
    last_name = fields.Field(attribute='last_name', column_name='Last Name')
    full_name = fields.Field(column_name='Full Name')
    email = fields.Field(attribute='email', column_name='Email')
    company_name = fields.Field(attribute='company_name', column_name='Company')
    status = fields.Field(attribute='status', column_name='Status')
    source = fields.Field(attribute='source', column_name='Source')
    score = fields.Field(attribute='score', column_name='Score')
    tags = fields.Field(column_name='Tags')
    owner = fields.Field(column_name='Owner')
    last_activity_at = fields.Field(attribute='last_activity_at', column_name='Last Activity')
    created_at = fields.Field(attribute='created_at', column_name='Created Date')

    class Meta:
        model = Lead
        fields = (
            'id', 'first_name', 'last_name', 'full_name',
            'email', 'company_name', 'status', 'source', 'score',
            'tags', 'owner', 'last_activity_at', 'created_at',
        )
        export_order = fields

    def dehydrate_full_name(self, obj):
        return obj.full_name

    def dehydrate_tags(self, obj):
        return ', '.join(t.name for t in obj.tags.all())

    def dehydrate_owner(self, obj):
        return self._resolve_uid(obj.owner_id)


class DealResource(BaseExportResource):
    id = fields.Field(attribute='id', column_name='ID')
    name = fields.Field(attribute='name', column_name='Deal Name')
    stage_name = fields.Field(column_name='Stage')
    value = fields.Field(attribute='value', column_name='Value')
    currency = fields.Field(attribute='currency', column_name='Currency')
    weighted_value = fields.Field(column_name='Weighted Value')
    expected_close_date = fields.Field(attribute='expected_close_date', column_name='Expected Close Date')
    status = fields.Field(attribute='status', column_name='Status')
    contact_name = fields.Field(column_name='Contact')
    company_name = fields.Field(column_name='Company')
    tags = fields.Field(column_name='Tags')
    description = fields.Field(attribute='description', column_name='Description')
    owner = fields.Field(column_name='Owner')
    stage_entered_at = fields.Field(attribute='stage_entered_at', column_name='Stage Entered At')
    last_activity_at = fields.Field(attribute='last_activity_at', column_name='Last Activity')
    created_at = fields.Field(attribute='created_at', column_name='Created Date')

    class Meta:
        model = Deal
        fields = (
            'id', 'name', 'stage_name', 'value', 'currency',
            'weighted_value', 'expected_close_date', 'status',
            'contact_name', 'company_name', 'tags', 'description',
            'owner', 'stage_entered_at', 'last_activity_at', 'created_at',
        )
        export_order = fields

    def dehydrate_stage_name(self, obj):
        return obj.stage.name if obj.stage else ''

    def dehydrate_contact_name(self, obj):
        return obj.contact.full_name if obj.contact else ''

    def dehydrate_company_name(self, obj):
        return obj.company.name if obj.company else ''

    def dehydrate_tags(self, obj):
        return ', '.join(t.name for t in obj.tags.all())

    def dehydrate_owner(self, obj):
        return self._resolve_uid(obj.owner_id)

    def dehydrate_weighted_value(self, obj):
        return obj.weighted_value


class ActivityResource(BaseExportResource):
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
    contact_name = fields.Field(column_name='Contact')
    company_name = fields.Field(column_name='Company')
    deal_name = fields.Field(column_name='Deal')
    lead_name = fields.Field(column_name='Lead')
    owner = fields.Field(column_name='Owner')
    assigned_to_name = fields.Field(column_name='Assigned To')
    created_at = fields.Field(attribute='created_at', column_name='Created Date')

    class Meta:
        model = Activity
        fields = (
            'id', 'activity_type', 'subject', 'description',
            'status', 'priority', 'due_date', 'completed_at',
            'start_time', 'end_time', 'duration_minutes',
            'contact_name', 'company_name', 'deal_name', 'lead_name',
            'owner', 'assigned_to_name', 'created_at',
        )
        export_order = fields

    def dehydrate_contact_name(self, obj):
        return obj.contact.full_name if obj.contact else ''

    def dehydrate_company_name(self, obj):
        return obj.company.name if obj.company else ''

    def dehydrate_deal_name(self, obj):
        return obj.deal.name if obj.deal else ''

    def dehydrate_lead_name(self, obj):
        return obj.lead.full_name if obj.lead else ''

    def dehydrate_owner(self, obj):
        return self._resolve_uid(obj.owner_id)

    def dehydrate_assigned_to_name(self, obj):
        return self._resolve_uid(obj.assigned_to) if obj.assigned_to else ''
