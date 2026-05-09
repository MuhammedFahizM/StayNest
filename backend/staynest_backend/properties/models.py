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
    def __str__(self):
        return self.property_name

    # Core identity
    property_name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    rules_and_regulations = models.TextField(blank=True)

    # Demographics
    stay_type = models.CharField(
        max_length=10,
        choices=[("GENTS", "Gents"), ("LADIES", "Ladies"), ("UNISEX", "Unisex")]
    )
    preferred_occupants = models.JSONField()  # validated list

    # Location (locked module feeds these)
    address_text = models.TextField(blank=True)
    area = models.CharField(max_length=255,blank=True)
    city = models.CharField(max_length=100, db_index=True, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    # Amenities
    is_ac = models.BooleanField(default=False)
    parking_available = models.BooleanField(default=False)
    food_provided = models.BooleanField(default=False)
    food_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

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
    # NEW (owner enters initially; system updates later)
    occupied_beds = models.PositiveIntegerField(default=0)
    available_beds = models.PositiveIntegerField()
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2)
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

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


