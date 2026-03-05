import uuid
from django.db import models
from django.utils import timezone


class LeadV2(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', 'New'
        CONTACTED = 'contacted', 'Contacted'
        QUALIFIED = 'qualified', 'Qualified'
        UNQUALIFIED = 'unqualified', 'Unqualified'
        CONVERTED = 'converted', 'Converted'
        LOST = 'lost', 'Lost'
    
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
        OTHER = 'other', 'Other'
    
    class Rating(models.TextChoices):
        HOT = 'hot', 'Hot'
        WARM = 'warm', 'Warm'
        COLD = 'cold', 'Cold'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    
    owner_id = models.UUIDField(db_index=True, help_text="User who created this lead")
    assigned_to_id = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Currently assigned sales rep (UUID)"
    )
    
    company_id = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Associated company (UUID)"
    )
    contact_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="Related contact (UUID)"
    )
    
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.NEW,
        db_index=True
    )
    source = models.CharField(
        max_length=50,
        choices=Source.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="How the lead was acquired"
    )
    rating = models.CharField(
        max_length=20,
        choices=Rating.choices,
        null=True,
        blank=True,
        help_text="Lead quality rating"
    )
    
    entity_data = models.JSONField(default=dict, blank=True)

    is_converted = models.BooleanField(default=False, db_index=True)
    converted_at = models.DateTimeField(null=True, blank=True)
    converted_contact_id = models.UUIDField(null=True, blank=True)
    converted_company_id = models.UUIDField(null=True, blank=True)
    converted_deal_id = models.UUIDField(null=True, blank=True)
    converted_by = models.UUIDField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.UUIDField(null=True, blank=True)
    created_by_id = models.UUIDField(null=True, blank=True)
    updated_by_id = models.UUIDField(null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True, db_index=True)
    
    class Meta:
        db_table = 'crm_leads_v2'
        verbose_name = 'Lead V2 (Hybrid)'
        verbose_name_plural = 'Leads V2 (Hybrid)'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['org_id', 'assigned_to_id', 'status'], name='leads_v2_my_leads_idx'),
            models.Index(fields=['org_id', 'created_at'], name='leads_v2_recent_idx'),
            models.Index(fields=['org_id', 'status', 'created_at'], name='leads_v2_status_idx'),
            models.Index(fields=['org_id', 'is_converted'], name='leads_v2_conversion_idx'),
            models.Index(fields=['org_id', 'source'], name='leads_v2_source_idx'),
            models.Index(fields=['org_id', 'owner_id']),
            models.Index(fields=['org_id', 'deleted_at']),
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
        return f"Lead {str(self.id)[:8]}"
    
    def get_full_name(self):
        first = self.entity_data.get('first_name', '')
        last = self.entity_data.get('last_name', '')
        return f"{first} {last}".strip() or "Unnamed Lead"
    
    def get_email(self):
        return self.entity_data.get('email', '')
    
    def get_phone(self):
        return self.entity_data.get('phone', '') or self.entity_data.get('mobile', '')
    
    @property
    def is_deleted(self):
        return self.deleted_at is not None
    
    def soft_delete(self, deleted_by: uuid.UUID = None):
        """Soft delete this lead."""
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
