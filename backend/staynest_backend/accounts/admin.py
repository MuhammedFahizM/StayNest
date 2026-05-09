from django.contrib import admin
from django.utils.html import format_html
from .models import Profile, Owner, EmailVerificationToken, PasswordResetToken


# ─────────────────────────────────────────────
# Profile Admin
# ─────────────────────────────────────────────

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "is_approved", "email", "phone")
    list_filter = ("role", "is_approved")
    search_fields = ("user__email", "user__first_name")
    readonly_fields = ("is_approved", "user", "role", "proof_preview")

    fieldsets = (
        ("User", {
            "fields": ("user",)
        }),
        ("Role & Status", {
            "fields": ("role", "is_approved")
        }),
        ("Contact", {
            "fields": ("phone", "address")
        }),
        ("Media", {
            "fields": ("profile_photo", "proof", "proof_preview")
        }),
    )

    def email(self, obj):
        return obj.user.email
    email.short_description = "Email"

    def proof_preview(self, obj):
        if obj.proof:
            url = obj.proof.url
            if url.lower().endswith((".jpg", ".jpeg", ".png")):
                return format_html('<img src="{}" style="max-height:120px;border-radius:6px;" />', url)
            return format_html('<a href="{}" target="_blank">View Document</a>', url)
        return "—"
    proof_preview.short_description = "Proof Preview"

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# ─────────────────────────────────────────────
# Owner Admin
# ─────────────────────────────────────────────

@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = ("email", "full_name", "phone", "is_verified", "city", "state", "has_bank_details", "created_at")
    list_filter = ("is_verified", "city", "state")
    search_fields = ("user__email", "user__first_name", "phone")
    readonly_fields = ("created_at", "proof_preview", "user")
    actions = ["approve_owner_account", "reject_owner_account"]

    fieldsets = (
        ("User Account", {
            "fields": ("user", "created_at")
        }),
        ("Verification", {
            "fields": ("is_verified", "proof", "proof_preview")
        }),
        ("Personal Info", {
            "fields": ("phone", "address", "city", "state", "postal_code")
        }),
        ("Profile Photo", {
            "fields": ("profile_photo",)
        }),
        ("Bank Details", {
            "fields": ("bank_beneficiary_name", "bank_account_number", "bank_ifsc_code"),
            "classes": ("collapse",),
        }),
    )

    def email(self, obj):
        return obj.user.email
    email.short_description = "Email"
    email.admin_order_field = "user__email"

    def full_name(self, obj):
        return obj.user.first_name or "—"
    full_name.short_description = "Full Name"

    def has_bank_details(self, obj):
        complete = all([
            obj.bank_account_number,
            obj.bank_ifsc_code,
            obj.bank_beneficiary_name,
        ])
        if complete:
            return format_html('<span style="color:#059669;font-weight:600;">✓ Complete</span>')
        return format_html('<span style="color:#9ca3af;">Incomplete</span>')
    has_bank_details.short_description = "Bank Details"

    def proof_preview(self, obj):
        if obj.proof:
            url = obj.proof.url
            if url.lower().endswith((".jpg", ".jpeg", ".png")):
                return format_html('<img src="{}" style="max-height:120px;border-radius:6px;" />', url)
            return format_html('<a href="{}" target="_blank">View Document</a>', url)
        return "—"
    proof_preview.short_description = "Proof Preview"

    def approve_owner_account(self, request, queryset):
        count = 0
        for owner in queryset:
            if not owner.is_verified:
                owner.is_verified = True
                owner.save()
                count += 1
        self.message_user(request, f"{count} owner(s) approved successfully.")
    approve_owner_account.short_description = "Approve selected owner accounts"

    def reject_owner_account(self, request, queryset):
        count = 0
        for owner in queryset:
            if not owner.is_verified:
                try:
                    from bookings.models import Notification
                    from bookings.ledger_utils import _notify
                    _notify(
                        recipient=owner.user,
                        notif_type=Notification.NotifType.ACCOUNT_REJECTED,
                        title="Owner account not approved",
                        message=(
                            "Your owner account application was not approved at this time. "
                            "Please contact StayNest support for more information."
                        ),
                    )
                    count += 1
                except Exception:
                    pass
        self.message_user(request, f"Rejection notification sent to {count} owner(s).")
    reject_owner_account.short_description = "Send rejection notification to selected owners"

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# ─────────────────────────────────────────────
# Email Verification Token Admin
# ─────────────────────────────────────────────

@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("user_email", "token", "created_at")
    search_fields = ("user__email",)
    readonly_fields = ("user", "token", "created_at")

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Email"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


# ─────────────────────────────────────────────
# Password Reset Token Admin
# ─────────────────────────────────────────────

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("user_email", "token", "created_at", "expires_at", "is_expired_display")
    search_fields = ("user__email",)
    readonly_fields = ("user", "token", "created_at", "expires_at")

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Email"

    def is_expired_display(self, obj):
        expired = obj.is_expired()
        if expired:
            return format_html('<span style="color:#dc2626;font-weight:600;">Expired</span>')
        return format_html('<span style="color:#059669;font-weight:600;">Valid</span>')
    is_expired_display.short_description = "Status"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False