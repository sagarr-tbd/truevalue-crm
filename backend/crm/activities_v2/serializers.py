from rest_framework import serializers
from .models import ActivityV2


class ActivityV2Serializer(serializers.ModelSerializer):
    display_owner = serializers.SerializerMethodField()
    display_assigned_to = serializers.SerializerMethodField()
    display_contact = serializers.SerializerMethodField()
    display_company = serializers.SerializerMethodField()
    display_deal = serializers.SerializerMethodField()
    display_lead = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = ActivityV2
        fields = [
            'id', 'org_id', 'owner_id',
            'activity_type', 'subject', 'description',
            'status', 'priority',
            'due_date', 'completed_at',
            'start_time', 'end_time', 'duration_minutes',
            'call_direction', 'call_outcome',
            'email_direction', 'email_message_id',
            'contact_id', 'company_id', 'deal_id', 'lead_id',
            'assigned_to_id', 'created_by_id',
            'reminder_at', 'reminder_sent',
            'display_owner', 'display_assigned_to',
            'display_contact', 'display_company',
            'display_deal', 'display_lead',
            'is_overdue',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'org_id', 'owner_id', 'created_by_id',
            'display_owner', 'display_assigned_to',
            'display_contact', 'display_company',
            'display_deal', 'display_lead',
            'is_overdue',
            'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        from datetime import time as dt_time
        reminder_at = attrs.get('reminder_at') or getattr(self.instance, 'reminder_at', None)
        due_date = attrs.get('due_date') or getattr(self.instance, 'due_date', None)
        if reminder_at and due_date:
            due_end = due_date
            if due_date.time() == dt_time.min:
                due_end = due_date.replace(hour=23, minute=59, second=59)
            if reminder_at >= due_end:
                raise serializers.ValidationError({
                    'reminder_at': 'Reminder must be before the due date.'
                })

        start_time = attrs.get('start_time') or getattr(self.instance, 'start_time', None)
        end_time = attrs.get('end_time') or getattr(self.instance, 'end_time', None)
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })

        return attrs

    def _resolve_user(self, user_id, org_id):
        if not user_id:
            return ''
        try:
            from crm.utils import fetch_member_names
            members = fetch_member_names(str(org_id))
            return members.get(str(user_id), '')
        except Exception:
            return ''

    def get_display_owner(self, obj):
        return self._resolve_user(obj.owner_id, obj.org_id)

    def get_display_assigned_to(self, obj):
        return self._resolve_user(obj.assigned_to_id, obj.org_id)

    def get_display_contact(self, obj):
        if not obj.contact_id:
            return ''
        try:
            from contacts_v2.models import ContactV2
            contact = ContactV2.objects.filter(id=obj.contact_id, deleted_at__isnull=True).first()
            if contact:
                first = contact.entity_data.get('first_name', '')
                last = contact.entity_data.get('last_name', '')
                return f"{first} {last}".strip()
            return ''
        except Exception:
            return ''

    def get_display_company(self, obj):
        if not obj.company_id:
            return ''
        try:
            from companies_v2.models import CompanyV2
            company = CompanyV2.objects.filter(id=obj.company_id, deleted_at__isnull=True).first()
            if company:
                return company.entity_data.get('name', '')
            return ''
        except Exception:
            return ''

    def get_display_deal(self, obj):
        if not obj.deal_id:
            return ''
        try:
            from deals_v2.models import DealV2
            deal = DealV2.objects.filter(id=obj.deal_id, deleted_at__isnull=True).first()
            if deal:
                return deal.entity_data.get('name', '')
            return ''
        except Exception:
            return ''

    def get_display_lead(self, obj):
        if not obj.lead_id:
            return ''
        try:
            from leads_v2.models import LeadV2
            lead = LeadV2.objects.filter(id=obj.lead_id, deleted_at__isnull=True).first()
            if lead:
                first = lead.entity_data.get('first_name', '')
                last = lead.entity_data.get('last_name', '')
                return f"{first} {last}".strip()
            return ''
        except Exception:
            return ''


class ActivityV2ListSerializer(serializers.ModelSerializer):
    display_contact = serializers.SerializerMethodField()
    display_company = serializers.SerializerMethodField()
    display_assigned_to = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = ActivityV2
        fields = [
            'id', 'activity_type', 'subject', 'status', 'priority',
            'due_date', 'completed_at', 'start_time', 'end_time',
            'duration_minutes',
            'call_direction', 'call_outcome',
            'email_direction',
            'contact_id', 'company_id', 'deal_id', 'lead_id',
            'assigned_to_id',
            'display_contact', 'display_company', 'display_assigned_to',
            'is_overdue',
            'created_at',
        ]

    def get_display_contact(self, obj):
        if not obj.contact_id:
            return ''
        try:
            from contacts_v2.models import ContactV2
            contact = ContactV2.objects.filter(id=obj.contact_id, deleted_at__isnull=True).first()
            if contact:
                first = contact.entity_data.get('first_name', '')
                last = contact.entity_data.get('last_name', '')
                return f"{first} {last}".strip()
            return ''
        except Exception:
            return ''

    def get_display_company(self, obj):
        if not obj.company_id:
            return ''
        try:
            from companies_v2.models import CompanyV2
            company = CompanyV2.objects.filter(id=obj.company_id, deleted_at__isnull=True).first()
            if company:
                return company.entity_data.get('name', '')
            return ''
        except Exception:
            return ''

    def get_display_assigned_to(self, obj):
        if not obj.assigned_to_id:
            return ''
        try:
            from crm.utils import fetch_member_names
            members = fetch_member_names(str(obj.org_id))
            return members.get(str(obj.assigned_to_id), '')
        except Exception:
            return ''
