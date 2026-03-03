"""
Activity V2 Model

Fixed-column model — activities (task, note, call, email, meeting) have
well-defined structured fields. No JSONB hybrid needed.

Uses UUID references instead of FKs so it can reference V2 entities directly.
Completely independent of V1 crm.Activity.
"""

import uuid
from django.db import models
from django.core.validators import MaxValueValidator
from django.utils import timezone


class ActivityV2Manager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class ActivityV2AllManager(models.Manager):
    pass


class ActivityV2(models.Model):

    class ActivityType(models.TextChoices):
        TASK = 'task', 'Task'
        NOTE = 'note', 'Note'
        CALL = 'call', 'Call'
        EMAIL = 'email', 'Email'
        MEETING = 'meeting', 'Meeting'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        NORMAL = 'normal', 'Normal'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    class CallDirection(models.TextChoices):
        INBOUND = 'inbound', 'Inbound'
        OUTBOUND = 'outbound', 'Outbound'

    class CallOutcome(models.TextChoices):
        ANSWERED = 'answered', 'Answered'
        VOICEMAIL = 'voicemail', 'Voicemail'
        NO_ANSWER = 'no_answer', 'No Answer'
        BUSY = 'busy', 'Busy'
        FAILED = 'failed', 'Failed'

    class EmailDirection(models.TextChoices):
        SENT = 'sent', 'Sent'
        RECEIVED = 'received', 'Received'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)
    owner_id = models.UUIDField(db_index=True)

    activity_type = models.CharField(
        max_length=20, choices=ActivityType.choices, db_index=True
    )
    subject = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    priority = models.CharField(
        max_length=20, choices=Priority.choices, default=Priority.NORMAL
    )

    due_date = models.DateTimeField(null=True, blank=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MaxValueValidator(1440)]
    )

    call_direction = models.CharField(
        max_length=10, null=True, blank=True, choices=CallDirection.choices
    )
    call_outcome = models.CharField(
        max_length=50, null=True, blank=True, choices=CallOutcome.choices
    )

    email_direction = models.CharField(
        max_length=10, null=True, blank=True, choices=EmailDirection.choices
    )
    email_message_id = models.CharField(max_length=255, null=True, blank=True)

    contact_id = models.UUIDField(null=True, blank=True, db_index=True)
    company_id = models.UUIDField(null=True, blank=True, db_index=True)
    deal_id = models.UUIDField(null=True, blank=True, db_index=True)
    lead_id = models.UUIDField(null=True, blank=True, db_index=True)

    assigned_to_id = models.UUIDField(null=True, blank=True, db_index=True)
    created_by_id = models.UUIDField(null=True, blank=True)

    reminder_at = models.DateTimeField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.UUIDField(null=True, blank=True)

    objects = ActivityV2Manager()
    all_objects = ActivityV2AllManager()

    class Meta:
        db_table = 'crm_activities_v2'
        verbose_name = 'Activity V2'
        verbose_name_plural = 'Activities V2'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['org_id', 'activity_type'], name='activities_v2_type_idx'),
            models.Index(fields=['org_id', 'status'], name='activities_v2_status_idx'),
            models.Index(fields=['org_id', 'owner_id'], name='activities_v2_owner_idx'),
            models.Index(fields=['org_id', 'assigned_to_id'], name='activities_v2_assigned_idx'),
            models.Index(fields=['org_id', 'due_date'], name='activities_v2_due_idx'),
            models.Index(fields=['org_id', 'deleted_at'], name='activities_v2_deleted_idx'),
        ]

    def __str__(self):
        return f"{self.activity_type}: {self.subject}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    @property
    def is_overdue(self):
        if self.due_date and self.status not in (self.Status.COMPLETED, self.Status.CANCELLED):
            return timezone.now() > self.due_date
        return False

    def soft_delete(self, deleted_by=None):
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by
        self.save(update_fields=['deleted_at', 'deleted_by', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['deleted_at', 'deleted_by', 'updated_at'])

    def complete(self):
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at', 'updated_at'])
