from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import (
    UserBookingViewSet,
    OwnerBookingViewSet,
    TenantSlotViewSet,
    InvitationAcceptViewSet,
)
from .payment_views import (
    OwnerActivatePayments,
    CreatePaymentOrder,
    OwnerPaymentStatus,
    OwnerUpdateRentDueDay,
    RazorpayWebhook,
    CreateRentPaymentOrder,
    CreateFoodPaymentOrder,
    # Ledger
    UserLedgerView,
    OwnerPropertyLedgerView,
    CurrentLedgerView,
    OwnerTenantLedgerView,
    OwnerTenantListView,
    # Offline
    MarkOfflinePayment,
    ConfirmOfflinePayment,
    # Food subscription
    UserFoodSubscriptionView,
    OwnerFoodSubscriptionResponseView,
    OwnerFoodRequestsView,
    # Deposit
    CreateDepositPaymentOrder,
    MarkDepositPaidOffline,
    ConfirmDepositPaid,
    OwnerMarkDepositReturned,
    UserConfirmDepositReturned,
    OwnerDepositListView,
    OwnerConfirmDepositPaid,
    # Notifications
    NotificationListView,
    NotificationMarkReadView,

    OfflineRegisterListView,
    OfflineRegisterUpdateView,
    OfflineRegisterHistoryView,

    UserUpcomingPaymentView,
    OwnerUpcomingPaymentView,
)

router = DefaultRouter()
router.register("user/bookings", UserBookingViewSet, basename="user-bookings")
router.register("owner/bookings", OwnerBookingViewSet, basename="owner-bookings")
router.register("owner/slots", TenantSlotViewSet, basename="tenant-slots")

urlpatterns = router.urls + [
    path("tenant/accept-invite/", InvitationAcceptViewSet.as_view({"post": "accept"})),

    # ── Owner payment setup ──
    path("owner/payments/activate/", OwnerActivatePayments.as_view()),
    path("owner/payments/status/", OwnerPaymentStatus.as_view()),
    path("owner/payments/set-due-day/", OwnerUpdateRentDueDay.as_view()),

    # ── Online payment orders ──
    path("payments/create-order/", CreatePaymentOrder.as_view()),
    path("payments/create-rent-order/", CreateRentPaymentOrder.as_view()),
    path("payments/create-food-order/", CreateFoodPaymentOrder.as_view()),
    path("payments/webhook/", RazorpayWebhook.as_view()),

    # ── Ledger ──
    path("payments/user-ledger/", UserLedgerView.as_view()),
    path("payments/owner-ledger/", OwnerPropertyLedgerView.as_view()),
    path("payments/current-ledger/", CurrentLedgerView.as_view()),
    path("payments/owner-tenant-list/", OwnerTenantListView.as_view()),
    path("payments/owner-tenant-ledger/", OwnerTenantLedgerView.as_view()),

    # ── Offline marking ──
    path("payments/mark-offline/", MarkOfflinePayment.as_view()),
    path("payments/confirm-offline/", ConfirmOfflinePayment.as_view()),

    # ── Food subscription ──
    path("food/subscribe/", UserFoodSubscriptionView.as_view()),
    path("food/owner-respond/", OwnerFoodSubscriptionResponseView.as_view()),
    path("food/owner-requests/", OwnerFoodRequestsView.as_view()),

    # ── Deposit ──
    path("deposit/pay-online/", CreateDepositPaymentOrder.as_view()),
    path("deposit/mark-offline/", MarkDepositPaidOffline.as_view()),
    path("deposit/confirm-paid/", ConfirmDepositPaid.as_view()),
    path("deposit/owner-mark-returned/", OwnerMarkDepositReturned.as_view()),
    path("deposit/user-confirm-returned/", UserConfirmDepositReturned.as_view()),
    path("deposit/owner-list/", OwnerDepositListView.as_view()),
    path("deposit/owner-confirm-paid/", OwnerConfirmDepositPaid.as_view()),

    # ── Notifications ──
    path("notifications/", NotificationListView.as_view()),
    path("notifications/<int:pk>/read/", NotificationMarkReadView.as_view()),

    path("register/list/", OfflineRegisterListView.as_view()),
    path("register/update/", OfflineRegisterUpdateView.as_view()),
    path("register/history/", OfflineRegisterHistoryView.as_view()),

    path("payments/user-upcoming/", UserUpcomingPaymentView.as_view()),
    path("payments/owner-upcoming/", OwnerUpcomingPaymentView.as_view()),
]