"""
Tags V2 Models

Polymorphic tagging system for V2 entities.
Uses UUID references (no FKs to entity models) to stay decoupled.
"""

import uuid
from django.db import models
from django.utils import timezone


class TagV2(models.Model):

    class EntityType(models.TextChoices):
        CONTACT = 'contact', 'Contact'
        COMPANY = 'company', 'Company'
        DEAL = 'deal', 'Deal'
        LEAD = 'lead', 'Lead'
        ALL = 'all', 'All'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org_id = models.UUIDField(db_index=True)

    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6B7280')
    entity_type = models.CharField(
        max_length=20,
        choices=EntityType.choices,
        default=EntityType.ALL
    )
    description = models.CharField(max_length=200, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = 'crm_tags_v2'
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(
                fields=['org_id', 'name', 'entity_type'],
                name='unique_tag_v2_per_org'
            ),
        ]
        indexes = [
            models.Index(fields=['org_id', 'entity_type'], name='tags_v2_org_type_idx'),
        ]

    def __str__(self):
        return self.name


class EntityTagV2(models.Model):
    """
    Polymorphic tag assignment.
    Uses entity_type + entity_id (UUID) — no FKs to entity models.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tag = models.ForeignKey(TagV2, on_delete=models.CASCADE, related_name='assignments')

    entity_type = models.CharField(max_length=20)
    entity_id = models.UUIDField()

    created_at = models.DateTimeField(auto_now_add=True)
    created_by_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = 'crm_entity_tags_v2'
        constraints = [
            models.UniqueConstraint(
                fields=['tag', 'entity_type', 'entity_id'],
                name='unique_entity_tag_v2'
            ),
        ]
        indexes = [
            models.Index(fields=['entity_type', 'entity_id'], name='entity_tags_v2_entity_idx'),
            models.Index(fields=['tag'], name='entity_tags_v2_tag_idx'),
        ]

    def __str__(self):
        return f"{self.tag.name} on {self.entity_type}:{self.entity_id}"
