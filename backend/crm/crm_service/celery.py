import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_service.settings')

app = Celery('crm_service')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'send-activity-reminders': {
        'task': 'crm.tasks.send_activity_reminders',
        'schedule': crontab(minute='*/5'),
        'options': {'expires': 240},
    },
    'send-activity-reminders-v2': {
        'task': 'crm.tasks.send_activity_v2_reminders',
        'schedule': crontab(minute='*/5'),
        'options': {'expires': 240},
    },
}

app.conf.timezone = 'UTC'


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
