"""
Celery tasks for CRM service.

This module contains all async and scheduled tasks.
"""
import logging
from datetime import timedelta
from typing import Dict

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from crm.models import Activity
from crm.utils import get_user_email_from_org_service

logger = logging.getLogger(__name__)


@shared_task(bind=True, name='crm.tasks.send_activity_reminders')
def send_activity_reminders(self, lookahead_minutes: int = 15) -> Dict:
    """
    Send email reminders for activities with reminders due.
    
    This task runs periodically (every 5 minutes via Celery Beat) to check
    for activities with reminders due and sends email notifications.
    
    Args:
        lookahead_minutes: How far ahead to look for reminders (default: 15 minutes)
    
    Returns:
        Dict with counts of sent, failed, and skipped reminders
    """
    logger.info("Starting activity reminder task")
    
    now = timezone.now()
    lookahead_time = now + timedelta(minutes=lookahead_minutes)
    
    # Find activities with reminders due
    activities_to_remind = Activity.objects.filter(
        reminder_at__lte=lookahead_time,
        reminder_sent=False,
    ).select_related('contact', 'company').order_by('reminder_at')
    
    count = activities_to_remind.count()
    logger.info(f"Found {count} reminder(s) to send (due between now and {lookahead_time})")
    
    sent = 0
    failed = 0
    skipped = 0
    
    for activity in activities_to_remind:
        try:
            # Get owner's email
            owner_email = get_user_email_from_org_service(activity.owner_id, activity.org_id)
            
            if not owner_email:
                # Try fallback email for development/testing
                fallback_email = getattr(settings, 'REMINDER_FALLBACK_EMAIL', None)
                if fallback_email:
                    logger.info(f"Using fallback email {fallback_email} for testing (owner: {activity.owner_id})")
                    owner_email = fallback_email
                else:
                    logger.warning(f"No email found for owner {activity.owner_id}, skipping reminder for activity {activity.id}")
                    skipped += 1
                    continue
            
            # Format activity details
            subject = f"Reminder: {activity.subject}"
            
            # Build email context
            context = {
                'activity_type': activity.activity_type.title(),
                'subject': activity.subject,
                'due_date': activity.due_date.strftime('%B %d, %Y at %I:%M %p') if activity.due_date else 'No due date',
                'contact_name': activity.contact.full_name if activity.contact else None,
                'company_name': activity.company.name if activity.company else None,
                'description': activity.description or '',
                'activity_url': f"{settings.FRONTEND_URL}/activities/{activity.activity_type}s/{activity.id}",
            }
            
            # Render email body
            message = _render_email_text(context)
            
            # Send email
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[owner_email],
                fail_silently=False,
            )
            
            # Mark as sent
            activity.reminder_sent = True
            activity.save(update_fields=['reminder_sent'])
            
            logger.info(f"Sent reminder email to {owner_email} for activity {activity.id}")
            sent += 1
            
        except Exception as e:
            logger.exception(f"Failed to send reminder for activity {activity.id}: {e}")
            failed += 1
    
    result = {
        'sent': sent,
        'failed': failed,
        'skipped': skipped,
        'total': count
    }
    
    logger.info(f"Activity reminder task completed: {result}")
    return result


def _render_email_text(context: dict) -> str:
    """
    Render plain text email body for activity reminder.
    
    Args:
        context: Dictionary containing activity details
    
    Returns:
        Formatted email text
    """
    template = """Hi there,

This is a reminder for your upcoming activity:

Activity Type: {activity_type}
Subject: {subject}
Due Date: {due_date}
"""
    
    # Add optional contact/company info
    if context.get('contact_name') or context.get('company_name'):
        template += "\nAdditional Details:"
        if context.get('contact_name'):
            template += f"\n- Contact: {context['contact_name']}"
        if context.get('company_name'):
            template += f"\n- Company: {context['company_name']}"
    
    # Add description if present
    if context.get('description'):
        template += f"\n\nDescription:\n{context['description']}"
    
    # Add link to view activity
    template += f"\n\nView Activity: {context['activity_url']}"
    
    template += "\n\nBest regards,\nTrueValue CRM"
    
    return template.format(**context)


@shared_task(name='crm.tasks.test_celery')
def test_celery():
    """Simple test task to verify Celery is working."""
    logger.info("Celery test task executed successfully!")
    return "Celery is working!"
