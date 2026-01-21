from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import (
    Property,
    SharingOption,
    PropertyImage,
    PropertyAuditLog,
)

# -----------------------------------
# Inline configurations
# -----------------------------------

class SharingOptionInline(admin.TabularInline):
    model = SharingOption
    extra = 0
    readonly_fields = (
        "sharing_type",
        "total_beds",
        "rent_amount",
        "available_beds",
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False



class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 0
    readonly_fields = ("image",)

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False



# -----------------------------------
# Property Admin
# -----------------------------------

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "property_name",
        "owner",
        "city",
        "status",
        "food_provided",
        "is_ac",
        "created_at",
    )

    list_display_links = ("property_name",)


    list_filter = (
        "status",
        "city",
        "food_provided",
        "is_ac",
        "stay_type",
    )

    search_fields = (
        "property_name",
        "city",
        "owner__email",
    )

    readonly_fields = (
        "latitude",
        "longitude",
        "created_at",
        "updated_at",
    )

    inlines = [
        SharingOptionInline,
        PropertyImageInline,
    ]

    fieldsets = (
        ("Owner & Status", {
            "fields": ("owner", "status", "rejection_reason", "is_deleted")
        }),
        ("Core Details", {
            "fields": ("property_name", "description", "rules_and_regulations")
        }),
        ("Demographics", {
            "fields": ("stay_type", "preferred_occupants")
        }),
        ("Location", {
            "fields": (
                "address_text",
                "area",
                "city",
                "state",
                "pincode",
                "latitude",
                "longitude",
            )
        }),
        ("Amenities", {
            "fields": ("is_ac", "parking_available", "food_provided")
        }),
        ("Optional Details", {
            "fields": (
                "security_deposit",
                "notice_period",
                "wifi_available",
                "power_backup",
                "visiting_hours",
                "nearby_landmarks",
                "floor_info",
            )
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )

    readonly_fields = [
        field.name
        for field in Property._meta.fields
        if field.name not in ("status", "rejection_reason")
    ]   


    def has_change_permission(self, request, obj=None):
        return True  # allow opening

    def has_add_permission(self, request):
        return False  # admin should not create properties

    def has_delete_permission(self, request, obj=None):
        return False  # no hard deletes


# -----------------------------------
# Audit Log (Read-only, Internal)
# -----------------------------------

@admin.register(PropertyAuditLog)
class PropertyAuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "property",
        "owner",
        "field_name",
        "old_value",
        "new_value",
        "created_at",
    )

    list_filter = ("field_name", "created_at")
    search_fields = ("property__property_name", "owner__email")

    readonly_fields = (
        "property",
        "owner",
        "field_name",
        "old_value",
        "new_value",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

