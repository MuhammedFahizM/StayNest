# staynest_backend/staynest_backend/celery.py

from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "staynest_backend.settings")

app = Celery("staynest_backend")

# Using RabbitMQ as the broker
app.conf.broker_url = "amqp://guest:guest@localhost:5672//"

# Auto-discover tasks from all installed apps
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f"Request: {self.request!r}")


 