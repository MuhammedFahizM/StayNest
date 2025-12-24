from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()

@receiver(post_save, sender=User)
def sync_admin_role(sender, instance, created, **kwargs):
    if instance.is_staff or instance.is_superuser:
        Profile.objects.update_or_create(
            user=instance,
            defaults={"role": "admin"}
        )
