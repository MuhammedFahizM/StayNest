# accounts/models.py
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

User = get_user_model()

def owner_proof_upload_to(instance, filename):
    return f"id_proofs/owners/{instance.user.id}_{filename}"

def user_proof_upload_to(instance, filename):
    return f"id_proofs/users/{instance.user.id}_{filename}"


class Profile(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('owner', 'Owner'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    is_approved = models.BooleanField(default=False)
    proof = models.FileField(upload_to=user_proof_upload_to, null=True, blank=True)  # <-- added

    def __str__(self):
        # some projects use email, some username — keep username fallback
        username = getattr(self.user, "username", None) or getattr(self.user, "email", None)
        return f"{username} - {self.role}"


class Owner(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="owner")
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    proof = models.FileField(upload_to=owner_proof_upload_to, null=True, blank=True)  # <-- added
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # keep using email if available
        return getattr(self.user, "email", str(self.user))


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verification_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{getattr(self.user, 'email', str(self.user))} - {self.token}"


# Signal to create Profile automatically when a User is created
@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    else:
        # ensure profile exists and is saved
        if hasattr(instance, "profile"):
            instance.profile.save()
        else:
            Profile.objects.create(user=instance)
