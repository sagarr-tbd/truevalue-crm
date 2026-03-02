"""
Companies V2 Models

Hybrid Architecture (mirrors Contacts V2 / Leads V2 pattern):
- System/Relationship fields → Database columns (indexed)
- Custom/Dynamic fields → JSONB storage (entity_data)
"""

import uuid
from django.db import models
from django.utils import timezone


class CompanyV2(models.Model):

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        PROSPECT = 'prospect', 'Prospect'
        CUSTOMER = 'customer', 'Customer'
        PARTNER = 'partner', 'Partner'
        ARCHIVED = 'archived', 'Archived'

    class Size(models.TextChoices):
        SOLO = '1', '1'
        MICRO = '2-10', '2-10'
        SMALL = '11-50', '11-50'
        MEDIUM = '51-200', '51-200'
        LARGE = '201-500', '201-500'
        ENTERPRISE = '501-1000', '501-1000'
        CORPORATE = '1000+', '1000+'

    # IDENTITY & ORGANIZATION
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)

    # OWNERSHIP & ASSIGNMENT
    owner_id = models.UUIDField(db_index=True, help_text="User who created this company")
    assigned_to_id = models.UUIDField(
        null=True, blank=True, db_index=True,
        help_text="Currently assigned account manager (UUID)"
    )

    # RELATIONSHIPS
    parent_company_id = models.UUIDField(
        null=True, blank=True, db_index=True,
        help_text="Parent company (UUID, self-referencing)"
    )

    # LIFECYCLE & STATUS
    status = models.CharField(
        max_length=50, choices=Status.choices,
        default=Status.ACTIVE, db_index=True
    )
    industry = models.CharField(
        max_length=100, null=True, blank=True, db_index=True,
        help_text="Company industry for filtering"
    )
    size = models.CharField(
        max_length=20, choices=Size.choices,
        null=True, blank=True, db_index=True,
        help_text="Company size range"
    )

    # CUSTOM FIELDS (JSONB)
    entity_data = models.JSONField(default=dict, blank=True)

    # AUDIT TRAIL & METADATA
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.UUIDField(null=True, blank=True)
    created_by_id = models.UUIDField(null=True, blank=True)
    updated_by_id = models.UUIDField(null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = 'crm_companies_v2'
        verbose_name = 'Company V2 (Hybrid)'
        verbose_name_plural = 'Companies V2 (Hybrid)'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['org_id', 'assigned_to_id', 'status'], name='companies_v2_assigned_idx'),
            models.Index(fields=['org_id', 'created_at'], name='companies_v2_recent_idx'),
            models.Index(fields=['org_id', 'status', 'created_at'], name='companies_v2_status_idx'),
            models.Index(fields=['org_id', 'industry'], name='companies_v2_industry_idx'),
            models.Index(fields=['org_id', 'size'], name='companies_v2_size_idx'),
            models.Index(fields=['org_id', 'owner_id'], name='companies_v2_owner_idx'),
            models.Index(fields=['org_id', 'deleted_at'], name='companies_v2_deleted_idx'),
            models.Index(fields=['org_id', 'parent_company_id'], name='companies_v2_parent_idx'),
        ]

    def __str__(self):
        name = self.entity_data.get('name', '')
        if name:
            return name
        return f"Company {str(self.id)[:8]}"

    def get_name(self):
        return self.entity_data.get('name', 'Unnamed Company')

    def get_website(self):
        return self.entity_data.get('website', '')

    def get_email(self):
        return self.entity_data.get('email', '')

    def get_phone(self):
        return self.entity_data.get('phone', '')

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
