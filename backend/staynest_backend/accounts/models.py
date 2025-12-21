# accounts/models.py
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
import datetime
from django.utils import timezone

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
    # ADD ONLY THIS FIELD INSIDE Owner MODEL
    profile_photo = models.ImageField(
        upload_to="owner_profiles/",
        null=True,
        blank=True
    ) 
    def __str__(self):
        # keep using email if available
        return getattr(self.user, "email", str(self.user))
    
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=Owner)
def sync_profile_on_owner_verification(sender, instance, **kwargs):
    """
    Source of truth:
    Owner.is_verified == True

    Effect:
    Profile.is_approved == True
    """
    if instance.is_verified:
        profile = instance.user.profile
        if not profile.is_approved:
            profile.is_approved = True
            profile.save(update_fields=["is_approved"])



class EmailVerificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verification_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{getattr(self.user, 'email', str(self.user))} - {self.token}"



class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        # set default expiry to 24 hours from creation if not provided
        if not self.expires_at:
            self.expires_at = timezone.now() + datetime.timedelta(hours=24)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

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

from django.db.models.signals import pre_delete
from django.dispatch import receiver

@receiver(pre_delete, sender=Owner)
def delete_user_when_owner_deleted(sender, instance, **kwargs):
    """
    When an Owner is deleted by admin,
    delete the associated User (which cascades Profile).
    """
    user = instance.user
    if user:
        user.delete()

