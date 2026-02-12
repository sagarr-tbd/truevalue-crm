"""
Tag Service - Business logic for Tag management.
"""
import logging
from typing import List, Dict, Any
from uuid import UUID

from django.db import transaction
from django.db.models import Count

from ..models import Tag, EntityTag
from ..exceptions import DuplicateEntityError
from .base_service import BaseService

logger = logging.getLogger(__name__)


class TagService(BaseService[Tag]):
    """Service for Tag operations."""
    
    model = Tag
    entity_type = 'tag'
    
    def list(
        self,
        filters: Dict[str, Any] = None,
        entity_type: str = None,
        search: str = None,
        order_by: str = 'name',
    ):
        """List tags with filtering."""
        qs = self.get_queryset()
        
        if filters:
            qs = qs.filter(**filters)
        
        if entity_type:
            qs = qs.filter(
                models.Q(entity_type=entity_type) |
                models.Q(entity_type='all')
            )
        
        if search:
            qs = qs.filter(name__icontains=search)
        
        return qs.order_by(order_by)
    
    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> Tag:
        """Create a new tag."""
        name = data.get('name')
        entity_type = data.get('entity_type', 'all')
        
        # Check for duplicates
        if name and self.get_queryset().filter(
            name__iexact=name,
            entity_type=entity_type
        ).exists():
            raise DuplicateEntityError('Tag', 'name', name)
        
        return super().create(data, **kwargs)
    
    @transaction.atomic
    def update(self, entity_id: UUID, data: Dict[str, Any], **kwargs) -> Tag:
        """Update a tag."""
        tag = self.get_by_id(entity_id)
        
        # Check for duplicate name
        name = data.get('name')
        entity_type = data.get('entity_type', tag.entity_type)
        
        if name and name.lower() != tag.name.lower():
            if self.get_queryset().filter(
                name__iexact=name,
                entity_type=entity_type
            ).exclude(id=entity_id).exists():
                raise DuplicateEntityError('Tag', 'name', name)
        
        return super().update(entity_id, data, **kwargs)
    
    def get_with_counts(self, entity_type: str = None) -> List[Dict]:
        """Get tags with usage counts."""
        qs = self.get_queryset()
        
        if entity_type:
            qs = qs.filter(
                models.Q(entity_type=entity_type) |
                models.Q(entity_type='all')
            )
        
        # Annotate with counts
        qs = qs.annotate(
            usage_count=Count('entity_tags')
        ).order_by('-usage_count', 'name')
        
        return [
            {
                'id': str(tag.id),
                'name': tag.name,
                'color': tag.color,
                'entity_type': tag.entity_type,
                'usage_count': tag.usage_count,
            }
            for tag in qs
        ]
    
    def add_to_entity(
        self,
        tag_id: UUID,
        entity_type: str,
        entity_id: UUID,
    ) -> EntityTag:
        """Add a tag to an entity."""
        tag = self.get_by_id(tag_id)
        
        # Check if tag is applicable to this entity type
        if tag.entity_type != 'all' and tag.entity_type != entity_type:
            from ..exceptions import InvalidOperationError
            raise InvalidOperationError(
                f'Tag "{tag.name}" cannot be applied to {entity_type}'
            )
        
        # Check if already tagged
        existing = EntityTag.objects.filter(
            tag=tag,
            entity_type=entity_type,
            entity_id=entity_id,
        ).first()
        
        if existing:
            return existing
        
        # Create tag assignment
        entity_tag = EntityTag.objects.create(
            tag=tag,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        
        return entity_tag
    
    def remove_from_entity(
        self,
        tag_id: UUID,
        entity_type: str,
        entity_id: UUID,
    ) -> bool:
        """Remove a tag from an entity."""
        deleted, _ = EntityTag.objects.filter(
            tag_id=tag_id,
            entity_type=entity_type,
            entity_id=entity_id,
        ).delete()
        
        return deleted > 0
    
    def get_entity_tags(
        self,
        entity_type: str,
        entity_id: UUID,
    ) -> List[Tag]:
        """Get all tags for an entity."""
        tag_ids = EntityTag.objects.filter(
            entity_type=entity_type,
            entity_id=entity_id,
        ).values_list('tag_id', flat=True)
        
        return list(Tag.objects.filter(id__in=tag_ids).order_by('name'))
    
    def set_entity_tags(
        self,
        entity_type: str,
        entity_id: UUID,
        tag_ids: List[UUID],
    ) -> List[Tag]:
        """Set tags for an entity (replace existing)."""
        # Clear existing tags
        EntityTag.objects.filter(
            entity_type=entity_type,
            entity_id=entity_id,
        ).delete()
        
        # Add new tags
        tags = Tag.objects.filter(
            id__in=tag_ids,
            org_id=self.org_id,
        )
        
        for tag in tags:
            if tag.entity_type == 'all' or tag.entity_type == entity_type:
                EntityTag.objects.create(
                    tag=tag,
                    entity_type=entity_type,
                    entity_id=entity_id,
                )
        
        return self.get_entity_tags(entity_type, entity_id)
    
    def bulk_tag(
        self,
        tag_id: UUID,
        entity_type: str,
        entity_ids: List[UUID],
    ) -> int:
        """Add a tag to multiple entities."""
        tag = self.get_by_id(tag_id)
        
        count = 0
        for entity_id in entity_ids:
            try:
                self.add_to_entity(tag_id, entity_type, entity_id)
                count += 1
            except Exception:
                pass
        
        return count
    
    def bulk_untag(
        self,
        tag_id: UUID,
        entity_type: str,
        entity_ids: List[UUID],
    ) -> int:
        """Remove a tag from multiple entities."""
        deleted, _ = EntityTag.objects.filter(
            tag_id=tag_id,
            entity_type=entity_type,
            entity_id__in=entity_ids,
        ).delete()
        
        return deleted
    
    def merge(self, primary_id: UUID, secondary_id: UUID) -> Tag:
        """Merge two tags."""
        primary = self.get_by_id(primary_id)
        secondary = self.get_by_id(secondary_id)
        
        with transaction.atomic():
            # Move entity tags from secondary to primary
            EntityTag.objects.filter(tag=secondary).update(tag=primary)
            
            # Delete secondary
            secondary.delete()
        
        return primary


# Import models at function level to avoid circular imports
from django.db import models
