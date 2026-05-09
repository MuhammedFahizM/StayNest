from django.contrib import admin
from .models import (
    Booking, Payment, OwnerPaymentProfile,
    OfflineTransaction, DepositRecord, TenantSlot,
    MonthlyLedger, Notification, FoodSubscriptionRequest,
    OfflineRegister,
)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        "id", "user", "property", "sharing_option",
        "status", "source", "food_opted_in", "created_at",
    ]
    list_filter = ["status", "source", "food_opted_in"]
    search_fields = ["user__email", "user__username", "property__title"]
    readonly_fields = ["created_at", "approved_at", "payment_deadline", "cancelled_at", "vacated_at"]


@admin.register(MonthlyLedger)
class MonthlyLedgerAdmin(admin.ModelAdmin):
    list_display = [
        "booking", "month", "rent_amount", "rent_status",
        "food_amount", "food_status", "created_at",
    ]
    list_filter = ["rent_status", "food_status"]
    search_fields = ["booking__id", "booking__user__email"]
    readonly_fields = ["created_at"]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "trace_id", "user", "booking", "payment_type",
        "amount", "status", "ledger", "paid_at",
    ]
    list_filter = ["payment_type", "status"]
    search_fields = ["trace_id", "user__email", "razorpay_order_id"]
    readonly_fields = ["trace_id", "razorpay_order_id", "razorpay_payment_id", "paid_at", "created_at"]


@admin.register(OwnerPaymentProfile)
class OwnerPaymentProfileAdmin(admin.ModelAdmin):
    list_display = [
        "owner", "razorpay_account_id", "payments_enabled",
        "is_verified", "rent_due_day", "created_at",
    ]
    list_filter = ["payments_enabled", "is_verified"]
    search_fields = ["owner__email", "razorpay_account_id"]


@admin.register(FoodSubscriptionRequest)
class FoodSubscriptionRequestAdmin(admin.ModelAdmin):
    list_display = ["booking", "request_type", "status", "requested_at", "responded_at"]
    list_filter = ["request_type", "status"]


@admin.register(OfflineTransaction)
class OfflineTransactionAdmin(admin.ModelAdmin):
    list_display = ["booking", "ledger", "initiated_by", "transaction_type", "amount", "status"]
    list_filter = ["transaction_type", "status"]


@admin.register(DepositRecord)
class DepositRecordAdmin(admin.ModelAdmin):
    list_display = ["booking", "original_amount", "returned_amount", "status", "updated_at"]
    list_filter = ["status"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["recipient", "notif_type", "title", "is_read", "created_at"]
    list_filter = ["notif_type", "is_read"]
    search_fields = ["recipient__email", "title"]


@admin.register(TenantSlot)
class TenantSlotAdmin(admin.ModelAdmin):
    list_display = ["property", "sharing_option", "tenant_name", "is_converted", "occupied_at"]
    list_filter = ["is_converted"]
    search_fields = ["tenant_name", "property__title"]


@admin.register(OfflineRegister)
class OfflineRegisterAdmin(admin.ModelAdmin):
    list_display = [
        "slot", "month", "rent_amount", "rent_status",
        "food_opted", "food_status", "deposit_status", "created_at"
    ]
    list_filter = ["rent_status", "food_status", "deposit_status"]
    search_fields = ["slot__tenant_name", "slot__property__title"]
    