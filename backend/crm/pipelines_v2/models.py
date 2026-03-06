import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class PipelineV2(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    owner_id = models.UUIDField(db_index=True)

    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    currency = models.CharField(max_length=3, default='USD')
    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.UUIDField(null=True, blank=True)
    created_by_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = 'crm_pipelines_v2'
        ordering = ['order', 'name']
        indexes = [
            models.Index(fields=['org_id', 'is_default'], name='pipelines_v2_default_idx'),
            models.Index(fields=['org_id', 'is_active'], name='pipelines_v2_active_idx'),
            models.Index(fields=['org_id', 'deleted_at'], name='pipelines_v2_deleted_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['org_id'],
                condition=models.Q(is_default=True, deleted_at__isnull=True),
                name='unique_default_pipeline_v2_per_org'
            ),
        ]
        verbose_name = 'Pipeline V2'
        verbose_name_plural = 'Pipelines V2'

    def __str__(self):
        return self.name

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self, deleted_by=None):
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by
        self.save(update_fields=['deleted_at', 'deleted_by', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['deleted_at', 'deleted_by', 'updated_at'])


class PipelineStageV2(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pipeline = models.ForeignKey(
        PipelineV2,
        on_delete=models.CASCADE,
        related_name='stages'
    )

    name = models.CharField(max_length=100)
    probability = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    order = models.PositiveIntegerField(default=0)
    is_won = models.BooleanField(default=False)
    is_lost = models.BooleanField(default=False)
    rotting_days = models.PositiveIntegerField(null=True, blank=True)
    color = models.CharField(max_length=7, default='#6B7280')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crm_pipeline_stages_v2'
        ordering = ['pipeline', 'order']
        indexes = [
            models.Index(fields=['pipeline', 'order'], name='stages_v2_pipeline_order_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['pipeline'],
                condition=models.Q(is_won=True),
                name='unique_won_stage_v2_per_pipeline'
            ),
            models.UniqueConstraint(
                fields=['pipeline'],
                condition=models.Q(is_lost=True),
                name='unique_lost_stage_v2_per_pipeline'
            ),
            models.CheckConstraint(
                check=~models.Q(is_won=True, is_lost=True),
                name='stage_v2_not_both_won_and_lost'
            ),
        ]
        verbose_name = 'Pipeline Stage V2'
        verbose_name_plural = 'Pipeline Stages V2'

    def __str__(self):
        return f"{self.pipeline.name} - {self.name}"

    @property
    def is_closed(self):
        return self.is_won or self.is_lost
