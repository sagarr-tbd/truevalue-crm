import logging
from datetime import timedelta
from typing import Dict

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, name='activities_v2.tasks.send_activity_reminders_v2')
def send_activity_reminders_v2(self, lookahead_minutes: int = 15) -> Dict:
    from .models import ActivityV2
    from crm.utils import get_user_email_from_org_service

    logger.info("Starting V2 activity reminder task")

    now = timezone.now()
    lookahead_time = now + timedelta(minutes=lookahead_minutes)

    activities = ActivityV2.all_objects.filter(
        reminder_at__lte=lookahead_time,
        reminder_sent=False,
        deleted_at__isnull=True,
    ).order_by('reminder_at')

    count = activities.count()
    logger.info(f"Found {count} V2 reminder(s) to send")

    contact_ids = {a.contact_id for a in activities if a.contact_id}
    company_ids = {a.company_id for a in activities if a.company_id}

    contact_names = {}
    company_names = {}

    if contact_ids:
        from contacts_v2.models import ContactV2
        for c in ContactV2.objects.filter(id__in=contact_ids).only('id', 'entity_data'):
            contact_names[c.id] = c.get_full_name()

    if company_ids:
        from companies_v2.models import CompanyV2
        for c in CompanyV2.objects.filter(id__in=company_ids).only('id', 'entity_data'):
            company_names[c.id] = c.get_name()

    sent = 0
    failed = 0
    skipped = 0

    for activity in activities:
        try:
            owner_email = get_user_email_from_org_service(activity.owner_id, activity.org_id)

            if not owner_email:
                fallback_email = getattr(settings, 'REMINDER_FALLBACK_EMAIL', None)
                if fallback_email:
                    owner_email = fallback_email
                else:
                    skipped += 1
                    continue

            contact_name = contact_names.get(activity.contact_id)
            company_name = company_names.get(activity.company_id)

            due_str = (
                activity.due_date.strftime('%B %d, %Y at %I:%M %p')
                if activity.due_date else 'No due date'
            )

            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            activity_url = f"{frontend_url}/activities-v2/{activity.activity_type}s/{activity.id}"

            body = f"""Hi there,

This is a reminder for your upcoming activity:

Activity Type: {activity.activity_type.title()}
Subject: {activity.subject}
Due Date: {due_str}
"""
            if contact_name:
                body += f"\nContact: {contact_name}"
            if company_name:
                body += f"\nCompany: {company_name}"
            if activity.description:
                body += f"\n\nDescription:\n{activity.description}"

            body += f"\n\nView Activity: {activity_url}"
            body += "\n\nBest regards,\nTrueValue CRM"

            send_mail(
                subject=f"Reminder: {activity.subject}",
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[owner_email],
                fail_silently=False,
            )

            activity.reminder_sent = True
            activity.save(update_fields=['reminder_sent'])
            sent += 1

        except Exception as e:
            logger.exception(f"Failed V2 reminder for activity {activity.id}: {e}")
            failed += 1

    result = {'sent': sent, 'failed': failed, 'skipped': skipped, 'total': count}
    logger.info(f"V2 activity reminder task completed: {result}")
    return result
