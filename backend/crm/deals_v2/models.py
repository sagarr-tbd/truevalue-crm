import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class DealV2(models.Model):

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        WON = 'won', 'Won'
        LOST = 'lost', 'Lost'
        ABANDONED = 'abandoned', 'Abandoned'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)

    owner_id = models.UUIDField(db_index=True, help_text="User who created this deal")
    assigned_to_id = models.UUIDField(
        null=True, blank=True, db_index=True,
        help_text="Currently assigned sales rep (UUID)"
    )

    pipeline_id = models.UUIDField(
        null=True, blank=True, db_index=True,
        help_text="Pipeline this deal belongs to (UUID referencing PipelineV2)"
    )

    contact_id = models.UUIDField(
        null=True, blank=True, db_index=True,
        help_text="Primary contact (UUID)"
    )
    company_id = models.UUIDField(
        null=True, blank=True, db_index=True,
        help_text="Associated company (UUID)"
    )

    status = models.CharField(
        max_length=20, choices=Status.choices,
        default=Status.OPEN, db_index=True
    )
    stage = models.CharField(
        max_length=50,
        default='Qualification', db_index=True
    )
    value = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
        db_index=True
    )
    currency = models.CharField(max_length=3, default='USD')
    probability = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    expected_close_date = models.DateField(null=True, blank=True, db_index=True)
    actual_close_date = models.DateField(null=True, blank=True)

    loss_reason = models.CharField(max_length=100, null=True, blank=True)

    converted_from_lead_id = models.UUIDField(null=True, blank=True)

    entity_data = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.UUIDField(null=True, blank=True)
    created_by_id = models.UUIDField(null=True, blank=True)
    updated_by_id = models.UUIDField(null=True, blank=True)
    last_activity_at = models.DateTimeField(null=True, blank=True, db_index=True)
    stage_entered_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'crm_deals_v2'
        verbose_name = 'Deal V2 (Hybrid)'
        verbose_name_plural = 'Deals V2 (Hybrid)'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['org_id', 'status', 'stage'], name='deals_v2_pipeline_idx'),
            models.Index(fields=['org_id', 'created_at'], name='deals_v2_recent_idx'),
            models.Index(fields=['org_id', 'status', 'created_at'], name='deals_v2_status_idx'),
            models.Index(fields=['org_id', 'value'], name='deals_v2_value_idx'),
            models.Index(fields=['org_id', 'expected_close_date'], name='deals_v2_close_idx'),
            models.Index(fields=['org_id', 'owner_id'], name='deals_v2_owner_idx'),
            models.Index(fields=['org_id', 'assigned_to_id'], name='deals_v2_assigned_idx'),
            models.Index(fields=['org_id', 'contact_id'], name='deals_v2_contact_idx'),
            models.Index(fields=['org_id', 'company_id'], name='deals_v2_company_idx'),
            models.Index(fields=['org_id', 'pipeline_id'], name='deals_v2_pipeline_fk_idx'),
            models.Index(fields=['org_id', 'deleted_at'], name='deals_v2_deleted_idx'),
        ]

    def __str__(self):
        name = self.entity_data.get('name', '')
        if name:
            return f"{name} (${self.value})"
        return f"Deal {str(self.id)[:8]}"

    def get_name(self):
        return self.entity_data.get('name', 'Unnamed Deal')

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


class DealStageHistoryV2(models.Model):
    """
    Tracks deal stage transitions for analytics and reporting.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.ForeignKey(
        DealV2,
        on_delete=models.CASCADE,
        related_name='stage_history'
    )
    from_stage = models.CharField(max_length=100, null=True, blank=True)
    to_stage = models.CharField(max_length=100)
    changed_by = models.UUIDField(null=True, blank=True)
    time_in_stage_seconds = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'crm_deal_stage_history_v2'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['deal', 'created_at'], name='deal_stage_hist_v2_idx'),
        ]
        verbose_name = 'Deal Stage History V2'
        verbose_name_plural = 'Deal Stage Histories V2'

    def __str__(self):
        return f"{self.deal}: {self.from_stage} → {self.to_stage}"
