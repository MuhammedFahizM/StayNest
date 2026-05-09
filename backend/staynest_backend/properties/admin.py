from django.contrib import admin
from django.utils.html import format_html
from .models import Property, SharingOption, PropertyImage, PropertyAuditLog


# ─────────────────────────────────────────────
# Inlines
# ─────────────────────────────────────────────

class SharingOptionInline(admin.TabularInline):
    model = SharingOption
    extra = 0
    readonly_fields = ("sharing_type", "total_beds", "occupied_beds", "available_beds", "rent_amount", "advance_amount")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 0
    readonly_fields = ("image_preview",)
    fields = ("image_preview",)
    can_delete = False

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height:80px;border-radius:6px;" />',
                obj.image.url
            )
        return "—"
    image_preview.short_description = "Image"

    def has_add_permission(self, request, obj=None):
        return False


# ─────────────────────────────────────────────
# Property Admin
# ─────────────────────────────────────────────

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        "id", "property_name", "owner_email", "city", "state",
        "stay_type", "status_badge", "food_provided", "is_ac",
        "image_count", "created_at",
    )
    list_filter = ("status", "stay_type", "city", "state", "food_provided", "is_ac", "is_deleted")
    search_fields = ("property_name", "city", "owner__email", "owner__first_name")
    readonly_fields = (
        "owner", "created_at", "updated_at",
        "latitude", "longitude",
        "preferred_occupants",
    )
    actions = ["approve_properties", "reject_properties", "mark_inactive"]
    inlines = [SharingOptionInline, PropertyImageInline]

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
                "address_text", "area", "city", "state",
                "pincode", "latitude", "longitude",
            )
        }),
        ("Amenities", {
            "fields": (
                "is_ac", "parking_available", "food_provided", "food_price",
                "wifi_available", "power_backup",
            )
        }),
        ("Optional Details", {
            "fields": (
                "security_deposit", "notice_period",
                "visiting_hours", "nearby_landmarks", "floor_info",
            )
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )

    # ── Display helpers ──

    def owner_email(self, obj):
        return obj.owner.email
    owner_email.short_description = "Owner"
    owner_email.admin_order_field = "owner__email"

    def status_badge(self, obj):
        colors = {
            "DRAFT":     "#94a3b8",
            "SUBMITTED": "#f59e0b",
            "REJECTED":  "#ef4444",
            "APPROVED":  "#3b82f6",
            "ACTIVE":    "#10b981",
            "INACTIVE":  "#6b7280",
        }
        color = colors.get(obj.status, "#94a3b8")
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;'
            'border-radius:999px;font-size:.78rem;font-weight:600;">{}</span>',
            color, obj.status
        )
    status_badge.short_description = "Status"
    status_badge.admin_order_field = "status"

    def image_count(self, obj):
        count = obj.images.count()
        color = "#10b981" if count >= 3 else "#ef4444"
        return format_html(
            '<span style="color:{};">{} photo{}</span>',
            color, count, "s" if count != 1 else ""
        )
    image_count.short_description = "Images"

    # ── Actions ──

    def approve_properties(self, request, queryset):
        count = 0
        for prop in queryset.filter(status="SUBMITTED"):
            prop.status = "APPROVED"
            prop.rejection_reason = ""
            prop.save()
            try:
                from bookings.models import Notification
                from bookings.ledger_utils import _notify
                _notify(
                    recipient=prop.owner,
                    notif_type=Notification.NotifType.PROPERTY_APPROVED,
                    title="Property approved!",
                    message=(
                        f"Your property '{prop.property_name}' has been approved by StayNest. "
                        "Go to your properties and activate it to make it live on Browse Stays."
                    ),
                    property_id_ref=prop.id,
                )
            except Exception:
                pass
            count += 1
        self.message_user(request, f"{count} property(s) approved.")
    approve_properties.short_description = "Approve selected submitted properties"

    def reject_properties(self, request, queryset):
        count = 0
        for prop in queryset.filter(status="SUBMITTED"):
            prop.status = "REJECTED"
            prop.rejection_reason = "Rejected by admin. Please review and resubmit."
            prop.save()
            try:
                from bookings.models import Notification
                from bookings.ledger_utils import _notify
                _notify(
                    recipient=prop.owner,
                    notif_type=Notification.NotifType.PROPERTY_REJECTED,
                    title="Property not approved",
                    message=(
                        f"Your property '{prop.property_name}' was not approved. "
                        "Please update your listing and resubmit."
                    ),
                    property_id_ref=prop.id,
                )
            except Exception:
                pass
            count += 1
        self.message_user(request, f"{count} property(s) rejected.")
    reject_properties.short_description = "Reject selected submitted properties"

    def mark_inactive(self, request, queryset):
        count = queryset.filter(status="ACTIVE").update(status="INACTIVE")
        self.message_user(request, f"{count} property(s) marked inactive.")
    mark_inactive.short_description = "Mark selected active properties as inactive"

    # ── Permissions ──

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        # Allow opening detail page but only status + rejection_reason are editable
        return True


# ─────────────────────────────────────────────
# Audit Log Admin
# ─────────────────────────────────────────────

@admin.register(PropertyAuditLog)
class PropertyAuditLogAdmin(admin.ModelAdmin):
    list_display = ("property", "owner_email", "field_name", "old_value", "new_value", "created_at")
    list_filter = ("field_name", "created_at")
    search_fields = ("property__property_name", "owner__email")
    readonly_fields = ("property", "owner", "field_name", "old_value", "new_value", "created_at")
    date_hierarchy = "created_at"

    def owner_email(self, obj):
        return obj.owner.email
    owner_email.short_description = "Owner"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False