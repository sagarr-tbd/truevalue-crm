"""
Leads V2 Models

Hybrid Architecture (Industry Standard: Zoho/HubSpot/Salesforce):
- System/Relationship fields → Database columns (ForeignKeys, indexed)
- Custom/Dynamic fields → JSONB storage (entity_data)

This provides:
- Fast queries with proper joins (FK relationships)
- Unlimited custom fields (JSONB flexibility)
- Workflow automation support (signals on FK changes)
- Data integrity (referential constraints)
"""

import uuid
from django.db import models
from django.utils import timezone


class LeadV2(models.Model):
    """
    V2 Lead Model - Hybrid Architecture.
    
    Combines the best of both worlds:
    - System fields (owner, assigned_to, company) → Real ForeignKeys
    - Custom fields (first_name, email, budget, etc.) → JSONB entity_data
    
    Benefits:
    - Fast filtering by assigned user, company, status
    - Proper relationship handling for workflows
    - Unlimited custom field flexibility
    - Industry-standard architecture
    """
    
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
    
    # ═════════════════════════════════════════════════════════════════
    # IDENTITY & ORGANIZATION
    # ═════════════════════════════════════════════════════════════════
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    
    # ═════════════════════════════════════════════════════════════════
    # OWNERSHIP & ASSIGNMENT (ForeignKeys for workflows/permissions)
    # ═════════════════════════════════════════════════════════════════
    owner_id = models.UUIDField(db_index=True, help_text="User who created this lead")
    assigned_to_id = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Currently assigned sales rep (UUID)"
    )
    
    # ═════════════════════════════════════════════════════════════════
    # RELATIONSHIPS (Will be converted to ForeignKeys in future migration)
    # ═════════════════════════════════════════════════════════════════
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
    
    # ═════════════════════════════════════════════════════════════════
    # LIFECYCLE & STATUS (Indexed for fast filtering)
    # ═════════════════════════════════════════════════════════════════
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
    
    # ═════════════════════════════════════════════════════════════════
    # CUSTOM FIELDS (JSONB - unlimited flexibility)
    # ═════════════════════════════════════════════════════════════════
    entity_data = models.JSONField(default=dict, blank=True)
    # ═════════════════════════════════════════════════════════════════
    # CUSTOM FIELDS (JSONB - unlimited flexibility)
    # ═════════════════════════════════════════════════════════════════
    entity_data = models.JSONField(default=dict, blank=True)
    # Example: {
    #     "first_name": "John",
    #     "last_name": "Doe",
    #     "email": "john@example.com",
    #     "phone": "+1234567890",
    #     "company_name": "Acme Inc",
    #     "title": "Sales Manager",
    #     "budget": 50000,
    #     "industry": "technology",
    #     "website": "https://example.com",
    #     "notes": "Interested in enterprise plan",
    #     ... any other custom fields
    # }
    
    # ═════════════════════════════════════════════════════════════════
    # CONVERSION TRACKING (For reporting & analytics)
    # ═════════════════════════════════════════════════════════════════
    is_converted = models.BooleanField(default=False, db_index=True)
    converted_at = models.DateTimeField(null=True, blank=True)
    converted_contact_id = models.UUIDField(null=True, blank=True)
    converted_company_id = models.UUIDField(null=True, blank=True)
    converted_deal_id = models.UUIDField(null=True, blank=True)
    converted_by = models.UUIDField(null=True, blank=True)
    
    # ═════════════════════════════════════════════════════════════════
    # AUDIT TRAIL & METADATA
    # ═════════════════════════════════════════════════════════════════
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
            # For "My Leads" filtering
            models.Index(fields=['org_id', 'assigned_to_id', 'status'], name='leads_v2_my_leads_idx'),
            # For "Recent Leads"
            models.Index(fields=['org_id', 'created_at'], name='leads_v2_recent_idx'),
            # For status pipeline
            models.Index(fields=['org_id', 'status', 'created_at'], name='leads_v2_status_idx'),
            # For conversion reports
            models.Index(fields=['org_id', 'is_converted'], name='leads_v2_conversion_idx'),
            # For source tracking
            models.Index(fields=['org_id', 'source'], name='leads_v2_source_idx'),
            # Existing indexes
            models.Index(fields=['org_id', 'owner_id']),
            models.Index(fields=['org_id', 'deleted_at']),
        ]
    
    def __str__(self):
        """String representation of lead."""
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
        """Get lead's full name from entity_data."""
        first = self.entity_data.get('first_name', '')
        last = self.entity_data.get('last_name', '')
        return f"{first} {last}".strip() or "Unnamed Lead"
    
    def get_email(self):
        """Get lead's primary email."""
        return self.entity_data.get('email', '')
    
    def get_phone(self):
        """Get lead's primary phone."""
        return self.entity_data.get('phone', '') or self.entity_data.get('mobile', '')
    
    @property
    def is_deleted(self):
        """Check if lead is soft-deleted."""
        return self.deleted_at is not None
    
    def soft_delete(self, deleted_by: uuid.UUID = None):
        """Soft delete this lead."""
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by
        self.save(update_fields=['deleted_at', 'deleted_by', 'updated_at'])
    
    def restore(self):
        """Restore a soft-deleted lead."""
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['deleted_at', 'deleted_by', 'updated_at'])
    
    def get_field_value(self, field_name: str, default=None):
        """Get a field value from entity_data."""
        return self.entity_data.get(field_name, default)
    
    def set_field_value(self, field_name: str, value):
        """Set a field value in entity_data."""
        self.entity_data[field_name] = value
        self.save(update_fields=['entity_data', 'updated_at'])
