"""
Celery configuration for CRM service.

This module configures Celery for handling async tasks and scheduled jobs.
"""
import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_service.settings')

# Create Celery app
app = Celery('crm_service')

# Load config from Django settings with 'CELERY_' prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered Django apps
app.autodiscover_tasks()

# Celery Beat Schedule - Periodic Tasks
app.conf.beat_schedule = {
    'send-activity-reminders': {
        'task': 'crm.tasks.send_activity_reminders',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
        'options': {'expires': 240}  # Task expires after 4 minutes if not executed
    },
}

# Set timezone
app.conf.timezone = 'UTC'


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to test Celery is working."""
    print(f'Request: {self.request!r}')
