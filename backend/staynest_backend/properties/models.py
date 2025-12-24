from django.db import models

# Create your models here.

from django.conf import settings
from django.db import models
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class Property(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("SUBMITTED", "Submitted"),
        ("REJECTED", "Rejected"),
        ("APPROVED", "Approved"),
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="properties")

    # Core identity
    property_name = models.CharField(max_length=255, db_index=True)
    description = models.TextField()
    rules_and_regulations = models.TextField()

    # Demographics
    stay_type = models.CharField(
        max_length=10,
        choices=[("GENTS", "Gents"), ("LADIES", "Ladies"), ("UNISEX", "Unisex")]
    )
    preferred_occupants = models.JSONField()  # validated list

    # Location (locked module feeds these)
    address_text = models.TextField()
    area = models.CharField(max_length=255)
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    # Amenities
    is_ac = models.BooleanField()
    parking_available = models.BooleanField()
    food_provided = models.BooleanField()

    # Optional fields
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notice_period = models.PositiveIntegerField(null=True, blank=True)
    wifi_available = models.BooleanField(default=False)
    power_backup = models.BooleanField(default=False)
    visiting_hours = models.CharField(max_length=255, blank=True)
    nearby_landmarks = models.TextField(blank=True)
    floor_info = models.CharField(max_length=255, blank=True)

    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="DRAFT")
    rejection_reason = models.TextField(blank=True)

    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


  # Sharing Capacity:-

class SharingOption(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="sharing_options")
    sharing_type = models.PositiveSmallIntegerField()  # 1,2,3,4
    total_beds = models.PositiveIntegerField()
    available_beds = models.PositiveIntegerField()
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ("property", "sharing_type")

# Media:-

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="properties/")

# Audit Log (INTERNAL ONLY)

class PropertyAuditLog(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    field_name = models.CharField(max_length=100)
    old_value = models.TextField()
    new_value = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)


