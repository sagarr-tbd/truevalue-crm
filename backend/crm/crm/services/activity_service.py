"""
Activity Service - Business logic for Activity management.
"""
import logging
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timedelta

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from ..models import Activity, Contact, Company, Deal, Lead
from .base_service import BaseService

logger = logging.getLogger(__name__)


class ActivityService(BaseService[Activity]):
    """Service for Activity operations."""
    
    model = Activity
    entity_type = 'activity'
    
    def list(
        self,
        filters: Dict[str, Any] = None,
        search: str = None,
        order_by: str = '-created_at',
        limit: int = None,
        offset: int = 0,
        owner_id: UUID = None,
        assigned_to: UUID = None,
        activity_type: str = None,
        status: str = None,
        priority: str = None,
        contact_id: UUID = None,
        company_id: UUID = None,
        deal_id: UUID = None,
        lead_id: UUID = None,
        due_from: datetime = None,
        due_to: datetime = None,
        overdue: bool = None,
    ):
        """List activities with advanced filtering."""
        qs = self.get_queryset()
        
        # Apply basic filters
        if filters:
            qs = qs.filter(**filters)
        
        if owner_id:
            qs = qs.filter(owner_id=owner_id)
        
        if assigned_to:
            qs = qs.filter(assigned_to=assigned_to)
        
        if activity_type:
            qs = qs.filter(activity_type=activity_type)
        
        if status:
            qs = qs.filter(status=status)
        
        if priority:
            qs = qs.filter(priority=priority)
        
        if contact_id:
            qs = qs.filter(contact_id=contact_id)
        
        if company_id:
            qs = qs.filter(company_id=company_id)
        
        if deal_id:
            qs = qs.filter(deal_id=deal_id)
        
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        
        if due_from:
            qs = qs.filter(due_date__gte=due_from)
        
        if due_to:
            qs = qs.filter(due_date__lte=due_to)
        
        if overdue is True:
            qs = qs.filter(
                due_date__lt=timezone.now(),
                status__in=['pending', 'in_progress']
            )
        
        # Apply search
        if search:
            qs = qs.filter(
                Q(subject__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Apply ordering
        qs = qs.order_by(order_by)
        
        # Apply pagination
        if limit:
            qs = qs[offset:offset + limit]
        
        return qs
    
    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> Activity:
        """Create a new activity."""
        # Handle entity IDs
        for field in ['contact_id', 'company_id', 'deal_id', 'lead_id']:
            entity_id = data.pop(field, None)
            if entity_id:
                entity_field = field.replace('_id', '')
                data[entity_field + '_id'] = entity_id
        
        # Set default assigned_to if not provided
        if 'assigned_to' not in data:
            data['assigned_to'] = self.user_id
        
        activity = super().create(data, **kwargs)
        
        # Update last_activity_at on related entities
        self._update_entity_activity(activity)
        
        return activity
    
    def _update_entity_activity(self, activity: Activity):
        """Update last_activity_at on related entities."""
        now = timezone.now()
        
        if activity.contact_id:
            Contact.objects.filter(id=activity.contact_id).update(
                last_activity_at=now
            )
            if activity.activity_type in ['call', 'email', 'meeting']:
                Contact.objects.filter(id=activity.contact_id).update(
                    last_contacted_at=now
                )
        
        if activity.company_id:
            pass  # Companies don't have last_activity_at yet
        
        if activity.deal_id:
            Deal.objects.filter(id=activity.deal_id).update(
                last_activity_at=now
            )
        
        if activity.lead_id:
            Lead.objects.filter(id=activity.lead_id).update(
                last_activity_at=now
            )
            if activity.activity_type in ['call', 'email', 'meeting']:
                Lead.objects.filter(id=activity.lead_id).update(
                    last_contacted_at=now
                )
    
    @transaction.atomic
    def complete(self, activity_id: UUID) -> Activity:
        """Mark an activity as completed."""
        activity = self.get_by_id(activity_id)
        activity.complete()
        activity.save()
        
        # Update entity activity timestamps
        self._update_entity_activity(activity)
        
        return activity
    
    @transaction.atomic
    def reschedule(self, activity_id: UUID, due_date: datetime) -> Activity:
        """Reschedule an activity."""
        activity = self.get_by_id(activity_id)
        activity.due_date = due_date
        activity.save(update_fields=['due_date', 'updated_at'])
        return activity
    
    def get_upcoming(
        self,
        user_id: UUID = None,
        days: int = 7,
        limit: int = 50,
    ) -> List[Activity]:
        """Get upcoming activities for a user."""
        qs = self.get_queryset().filter(
            status__in=['pending', 'in_progress'],
            due_date__gte=timezone.now(),
            due_date__lte=timezone.now() + timedelta(days=days),
        )
        
        if user_id:
            qs = qs.filter(Q(owner_id=user_id) | Q(assigned_to=user_id))
        
        return list(qs.order_by('due_date')[:limit])
    
    def get_overdue(
        self,
        user_id: UUID = None,
        limit: int = 50,
    ) -> List[Activity]:
        """Get overdue activities for a user."""
        qs = self.get_queryset().filter(
            status__in=['pending', 'in_progress'],
            due_date__lt=timezone.now(),
        )
        
        if user_id:
            qs = qs.filter(Q(owner_id=user_id) | Q(assigned_to=user_id))
        
        return list(qs.order_by('due_date')[:limit])
    
    def get_timeline(
        self,
        contact_id: UUID = None,
        company_id: UUID = None,
        deal_id: UUID = None,
        lead_id: UUID = None,
        limit: int = 50,
    ) -> List[Activity]:
        """Get activity timeline for an entity."""
        qs = self.get_queryset()
        
        if contact_id:
            qs = qs.filter(contact_id=contact_id)
        elif company_id:
            qs = qs.filter(company_id=company_id)
        elif deal_id:
            qs = qs.filter(deal_id=deal_id)
        elif lead_id:
            qs = qs.filter(lead_id=lead_id)
        else:
            return []
        
        return list(qs.order_by('-created_at')[:limit])
    
    def log_call(
        self,
        contact_id: UUID = None,
        lead_id: UUID = None,
        subject: str = None,
        description: str = None,
        duration_minutes: int = None,
        direction: str = 'outbound',
        outcome: str = 'answered',
    ) -> Activity:
        """Log a phone call."""
        data = {
            'activity_type': Activity.ActivityType.CALL,
            'subject': subject or 'Phone Call',
            'description': description,
            'status': Activity.Status.COMPLETED,
            'duration_minutes': duration_minutes,
            'call_direction': direction,
            'call_outcome': outcome,
            'completed_at': timezone.now(),
        }
        
        if contact_id:
            data['contact_id'] = contact_id
        if lead_id:
            data['lead_id'] = lead_id
        
        return self.create(data)
    
    def log_email(
        self,
        contact_id: UUID = None,
        lead_id: UUID = None,
        subject: str = None,
        description: str = None,
        direction: str = 'sent',
        message_id: str = None,
    ) -> Activity:
        """Log an email."""
        data = {
            'activity_type': Activity.ActivityType.EMAIL,
            'subject': subject or 'Email',
            'description': description,
            'status': Activity.Status.COMPLETED,
            'email_direction': direction,
            'email_message_id': message_id,
            'completed_at': timezone.now(),
        }
        
        if contact_id:
            data['contact_id'] = contact_id
        if lead_id:
            data['lead_id'] = lead_id
        
        return self.create(data)
    
    def add_note(
        self,
        contact_id: UUID = None,
        company_id: UUID = None,
        deal_id: UUID = None,
        lead_id: UUID = None,
        content: str = None,
    ) -> Activity:
        """Add a note to an entity."""
        data = {
            'activity_type': Activity.ActivityType.NOTE,
            'subject': content[:100] if content else 'Note',
            'description': content,
            'status': Activity.Status.COMPLETED,
            'completed_at': timezone.now(),
        }
        
        if contact_id:
            data['contact_id'] = contact_id
        if company_id:
            data['company_id'] = company_id
        if deal_id:
            data['deal_id'] = deal_id
        if lead_id:
            data['lead_id'] = lead_id
        
        return self.create(data)
    
    def create_task(
        self,
        subject: str,
        due_date: datetime = None,
        contact_id: UUID = None,
        company_id: UUID = None,
        deal_id: UUID = None,
        lead_id: UUID = None,
        assigned_to: UUID = None,
        priority: str = 'normal',
        description: str = None,
    ) -> Activity:
        """Create a task."""
        data = {
            'activity_type': Activity.ActivityType.TASK,
            'subject': subject,
            'description': description,
            'status': Activity.Status.PENDING,
            'priority': priority,
            'due_date': due_date,
            'assigned_to': assigned_to or self.user_id,
        }
        
        if contact_id:
            data['contact_id'] = contact_id
        if company_id:
            data['company_id'] = company_id
        if deal_id:
            data['deal_id'] = deal_id
        if lead_id:
            data['lead_id'] = lead_id
        
        return self.create(data)
    
    def get_stats(self, user_id: UUID = None) -> Dict:
        """Get activity statistics."""
        qs = self.get_queryset()
        
        if user_id:
            qs = qs.filter(Q(owner_id=user_id) | Q(assigned_to=user_id))
        
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        
        return {
            'total': qs.count(),
            'pending': qs.filter(status='pending').count(),
            'in_progress': qs.filter(status='in_progress').count(),
            'completed': qs.filter(status='completed').count(),
            'overdue': qs.filter(
                status__in=['pending', 'in_progress'],
                due_date__lt=now
            ).count(),
            'due_today': qs.filter(
                status__in=['pending', 'in_progress'],
                due_date__gte=today_start,
                due_date__lt=today_start + timedelta(days=1)
            ).count(),
            'completed_this_week': qs.filter(
                status='completed',
                completed_at__gte=week_start
            ).count(),
            'by_type': {
                'tasks': qs.filter(activity_type='task').count(),
                'calls': qs.filter(activity_type='call').count(),
                'emails': qs.filter(activity_type='email').count(),
                'meetings': qs.filter(activity_type='meeting').count(),
                'notes': qs.filter(activity_type='note').count(),
            }
        }
