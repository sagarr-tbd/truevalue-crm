"""
Contacts V2 Models

Hybrid Architecture (mirrors Leads V2 pattern):
- System/Relationship fields → Database columns (indexed)
- Custom/Dynamic fields → JSONB storage (entity_data)
"""

import uuid
from django.db import models
from django.utils import timezone


class ContactV2(models.Model):

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        BOUNCED = 'bounced', 'Bounced'
        UNSUBSCRIBED = 'unsubscribed', 'Unsubscribed'
        ARCHIVED = 'archived', 'Archived'

    class Source(models.TextChoices):
        WEBSITE = 'website', 'Website'
        REFERRAL = 'referral', 'Referral'
        COLD_CALL = 'cold_call', 'Cold Call'
        TRADE_SHOW = 'trade_show', 'Trade Show'
        SOCIAL_MEDIA = 'social_media', 'Social Media'
        ADVERTISEMENT = 'advertisement', 'Advertisement'
        PARTNER = 'partner', 'Partner'
        WEBINAR = 'webinar', 'Webinar'
        EMAIL_CAMPAIGN = 'email_campaign', 'Email Campaign'
        LEAD_CONVERSION = 'lead_conversion', 'Lead Conversion'
        IMPORT = 'import', 'Data Import'
        OTHER = 'other', 'Other'

    # ═══════════════════════════════════════════════════════════
    # IDENTITY & ORGANIZATION
    # ═══════════════════════════════════════════════════════════
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)

    # ═══════════════════════════════════════════════════════════
    # OWNERSHIP & ASSIGNMENT
    # ═══════════════════════════════════════════════════════════
    owner_id = models.UUIDField(db_index=True, help_text="User who created this contact")
    assigned_to_id = models.UUIDField(
        null=True, blank=True, db_index=True,
        help_text="Currently assigned sales rep (UUID)"
    )

    # ═══════════════════════════════════════════════════════════
    # RELATIONSHIPS
    # ═══════════════════════════════════════════════════════════
    company_id = models.UUIDField(
        null=True, blank=True, db_index=True,
        help_text="Primary company (UUID)"
    )

    # ═══════════════════════════════════════════════════════════
    # LIFECYCLE & STATUS
    # ═══════════════════════════════════════════════════════════
    status = models.CharField(
        max_length=50, choices=Status.choices,
        default=Status.ACTIVE, db_index=True
    )
    source = models.CharField(
        max_length=50, choices=Source.choices,
        null=True, blank=True, db_index=True,
        help_text="How the contact was acquired"
    )

    # ═══════════════════════════════════════════════════════════
    # CUSTOM FIELDS (JSONB)
    # ═══════════════════════════════════════════════════════════
    entity_data = models.JSONField(default=dict, blank=True)

    # ═══════════════════════════════════════════════════════════
    # LEAD CONVERSION TRACKING
    # ═══════════════════════════════════════════════════════════
    converted_from_lead_id = models.UUIDField(null=True, blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)

    # ═══════════════════════════════════════════════════════════
    # COMMUNICATION PREFERENCES
    # ═══════════════════════════════════════════════════════════
    do_not_call = models.BooleanField(default=False)
    do_not_email = models.BooleanField(default=False)

    # ═══════════════════════════════════════════════════════════
    # AUDIT TRAIL & METADATA
    # ═══════════════════════════════════════════════════════════
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.UUIDField(null=True, blank=True)
    created_by_id = models.UUIDField(null=True, blank=True)
    updated_by_id = models.UUIDField(null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_contacted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'crm_contacts_v2'
        verbose_name = 'Contact V2 (Hybrid)'
        verbose_name_plural = 'Contacts V2 (Hybrid)'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['org_id', 'assigned_to_id', 'status'], name='contacts_v2_assigned_idx'),
            models.Index(fields=['org_id', 'created_at'], name='contacts_v2_recent_idx'),
            models.Index(fields=['org_id', 'status', 'created_at'], name='contacts_v2_status_idx'),
            models.Index(fields=['org_id', 'source'], name='contacts_v2_source_idx'),
            models.Index(fields=['org_id', 'company_id'], name='contacts_v2_company_idx'),
            models.Index(fields=['org_id', 'owner_id'], name='contacts_v2_owner_idx'),
            models.Index(fields=['org_id', 'deleted_at'], name='contacts_v2_deleted_idx'),
        ]

    def __str__(self):
        first_name = self.entity_data.get('first_name', '')
        last_name = self.entity_data.get('last_name', '')
        email = self.entity_data.get('email', '')

        if first_name or last_name:
            name = f"{first_name} {last_name}".strip()
            return f"{name} ({email})" if email else name
        elif email:
            return email
        return f"Contact {str(self.id)[:8]}"

    def get_full_name(self):
        first = self.entity_data.get('first_name', '')
        last = self.entity_data.get('last_name', '')
        return f"{first} {last}".strip() or "Unnamed Contact"

    def get_email(self):
        return self.entity_data.get('email', '')

    def get_phone(self):
        return self.entity_data.get('phone', '') or self.entity_data.get('mobile', '')

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self, deleted_by: uuid.UUID = None):
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by
        self.save(update_fields=['deleted_at', 'deleted_by', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['deleted_at', 'deleted_by', 'updated_at'])

    def get_field_value(self, field_name: str, default=None):
        return self.entity_data.get(field_name, default)

    def set_field_value(self, field_name: str, value):
        self.entity_data[field_name] = value
        self.save(update_fields=['entity_data', 'updated_at'])
