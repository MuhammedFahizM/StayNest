import uuid
from datetime import timedelta
from django.conf import settings
from django.db import models
from django.utils import timezone

from properties.models import Property, SharingOption

User = settings.AUTH_USER_MODEL


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING"
        APPROVED_AWAITING_PAYMENT = "APPROVED_AWAITING_PAYMENT"
        ACTIVE = "ACTIVE"
        REJECTED = "REJECTED"
        CANCELLED = "CANCELLED"
        CONFIRMED = "CONFIRMED"
        VACATED = "VACATED"

    PROFILE_ACCESS_STATES = [
        Status.PENDING,
        Status.APPROVED_AWAITING_PAYMENT,
        Status.CONFIRMED,
        Status.ACTIVE,
    ]

    class Source(models.TextChoices):
        ONLINE = "ONLINE"
        OFFLINE_CONVERTED = "OFFLINE_CONVERTED"

    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="bookings",
    )
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    sharing_option = models.ForeignKey(SharingOption, on_delete=models.PROTECT)

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING,
    )
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.ONLINE,
    )

    # Food subscription fields
    food_opted_in = models.BooleanField(default=False)
    food_opt_in_date = models.DateField(null=True, blank=True)
    food_opt_out_date = models.DateField(null=True, blank=True)

    # Frozen rent — set when Month 1 ledger is created; used for all subsequent months
    frozen_rent_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    payment_deadline = models.DateTimeField(null=True, blank=True)

    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(null=True, blank=True)
    vacated_at = models.DateTimeField(null=True, blank=True)
    user_vacate_requested = models.BooleanField(default=False)
    owner_vacate_approved = models.BooleanField(default=False)

    def start_payment_window(self):
        self.approved_at = timezone.now()
        self.payment_deadline = self.approved_at + timedelta(hours=24)
        self.save(update_fields=["approved_at", "payment_deadline"])

    class CancellationReason(models.TextChoices):
        USER_CANCELLED = "USER_CANCELLED"
        OWNER_REJECTED = "OWNER_REJECTED"
        PAYMENT_TIMEOUT = "PAYMENT_TIMEOUT"


class TenantSlot(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    sharing_option = models.ForeignKey(SharingOption, on_delete=models.PROTECT)

    tenant_name = models.CharField(max_length=255)
    occupied_at = models.DateTimeField(auto_now_add=True)

    invitation_token = models.UUIDField(null=True, blank=True, unique=True)
    is_converted = models.BooleanField(default=False)

    def generate_invitation(self):
        self.invitation_token = uuid.uuid4()
        self.save(update_fields=["invitation_token"])


class FoodSubscriptionRequest(models.Model):
    """
    Tracks food opt-in/opt-out requests that need owner acknowledgement.
    """
    class RequestType(models.TextChoices):
        OPT_IN = "OPT_IN", "Opt In"
        OPT_OUT = "OPT_OUT", "Opt Out"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Owner Acknowledgement"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="food_requests",
    )
    request_type = models.CharField(max_length=10, choices=RequestType.choices)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    effective_from_month = models.DateField(null=True, blank=True)


class Payment(models.Model):

    class Meta:
        indexes = [
            models.Index(fields=["booking", "status"]),
        ]

    class PaymentType(models.TextChoices):
        ADVANCE = "ADVANCE", "Advance"
        RENT = "RENT", "Rent"
        DEPOSIT = "DEPOSIT", "Deposit"
        FOOD = "FOOD", "Food"
        BALANCE = "BALANCE", "Balance Rent"

    class Status(models.TextChoices):
        CREATED = "CREATED", "Created"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    trace_id = models.UUIDField(default=uuid.uuid4, editable=False)

    booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="payments"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    payment_type = models.CharField(
        max_length=20,
        choices=PaymentType.choices,
        default=PaymentType.ADVANCE
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    # Which ledger month this payment covers (null for advance/deposit)
    ledger = models.ForeignKey(
        "bookings.MonthlyLedger",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="payments",
    )

    razorpay_order_id = models.CharField(
        max_length=200, unique=True, null=True, blank=True
    )
    razorpay_payment_id = models.CharField(max_length=200, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=500, null=True, blank=True)

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.CREATED
    )

    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)


class MonthlyLedger(models.Model):
    """
    One row per booking per calendar month.
    Tracks rent + food payment status for that month.
    """
    class RentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID_ONLINE = "PAID_ONLINE", "Paid Online"
        PAID_OFFLINE = "PAID_OFFLINE", "Paid Offline"
        OVERDUE = "OVERDUE", "Overdue"

    class FoodStatus(models.TextChoices):
        NOT_APPLICABLE = "NA", "Not Applicable"
        PENDING = "PENDING", "Pending"
        PAID_ONLINE = "PAID_ONLINE", "Paid Online"
        PAID_OFFLINE = "PAID_OFFLINE", "Paid Offline"
        OVERDUE = "OVERDUE", "Overdue"

    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="ledger_entries",
    )

    # e.g. date(2025, 6, 1) means June 2025
    month = models.DateField()

    rent_amount = models.DecimalField(max_digits=10, decimal_places=2)
    rent_due_date = models.DateField()
    rent_status = models.CharField(
        max_length=20,
        choices=RentStatus.choices,
        default=RentStatus.PENDING,
    )
    rent_paid_at = models.DateTimeField(null=True, blank=True)

    food_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    food_status = models.CharField(
        max_length=20,
        choices=FoodStatus.choices,
        default=FoodStatus.NOT_APPLICABLE,
    )
    food_paid_at = models.DateTimeField(null=True, blank=True)

    # Offline confirmation tracking
    rent_offline_confirmed_by_owner = models.BooleanField(default=False)
    rent_offline_confirmed_by_user = models.BooleanField(default=False)
    food_offline_confirmed_by_owner = models.BooleanField(default=False)
    food_offline_confirmed_by_user = models.BooleanField(default=False)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("booking", "month")
        ordering = ["-month"]

    def __str__(self):
        return f"Ledger {self.booking_id} — {self.month.strftime('%b %Y')}"

    @property
    def month_label(self):
        return self.month.strftime("%B %Y")

    @property
    def rent_is_paid(self):
        return self.rent_status in [
            self.RentStatus.PAID_ONLINE,
            self.RentStatus.PAID_OFFLINE,
        ]

    @property
    def food_is_paid(self):
        return self.food_status in [
            self.FoodStatus.PAID_ONLINE,
            self.FoodStatus.PAID_OFFLINE,
        ]
    
    @property
    def overall_status(self):
        if self.rent_is_paid and (
            self.food_status == self.FoodStatus.NOT_APPLICABLE or self.food_is_paid
        ):
            return "PAID"

        if self.rent_is_paid or self.food_is_paid:
            return "PARTIAL"

        return "PENDING"


class DepositRecord(models.Model):
    """
    Deposit can be paid online (Razorpay) or offline (cash/transfer).
    No forced timing — user and owner decide between themselves.

    Move-in:
      Online  → user pays via Razorpay → webhook sets HELD_BY_OWNER, notifies owner.
      Offline → either side marks it paid → other side confirms → HELD_BY_OWNER.

    Vacate:
      Owner marks returned → user confirms → RETURNED / PARTIAL_RETURNED.
    """

    class Status(models.TextChoices):
        PENDING_RECEIPT = "PENDING_RECEIPT", "Awaiting Deposit"
        PENDING_CONFIRMATION = "PENDING_CONFIRMATION", "Marked — Awaiting Confirmation"
        HELD_BY_OWNER = "HELD_BY_OWNER", "Deposit Confirmed Held"
        RETURN_MARKED = "RETURN_MARKED", "Owner Marked Returned"
        RETURNED = "RETURNED", "User Confirmed Returned"
        PARTIAL_RETURNED = "PARTIAL_RETURNED", "Partial Return Confirmed"

    booking = models.OneToOneField(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="deposit",
    )

    original_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    returned_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING_RECEIPT,
    )

    # Online payment
    paid_online = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)

    # Offline dual-confirm flags (either side can initiate)
    marked_by_owner = models.BooleanField(default=False)
    marked_by_user = models.BooleanField(default=False)

    note = models.TextField(blank=True)
    owner_return_note = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class Notification(models.Model):
    """
    In-app notifications for both owners and users.
    """
    class NotifType(models.TextChoices):
        PAYMENT_DUE = "PAYMENT_DUE", "Payment Due"
        PAYMENT_RECEIVED = "PAYMENT_RECEIVED", "Payment Received"
        FOOD_REQUEST = "FOOD_REQUEST", "Food Subscription Request"
        FOOD_CANCELLED = "FOOD_CANCELLED", "Food Subscription Cancelled"
        OFFLINE_MARK = "OFFLINE_MARK", "Offline Payment Marked"
        OFFLINE_CONFIRMED = "OFFLINE_CONFIRMED", "Offline Payment Confirmed"
        VACATE_REQUESTED = "VACATE_REQUESTED", "Vacate Requested"
        VACATE_APPROVED = "VACATE_APPROVED", "Vacate Approved"
        DEPOSIT_RECEIVED = "DEPOSIT_RECEIVED", "Deposit Received"
        DEPOSIT_RETURNED = "DEPOSIT_RETURNED", "Deposit Returned"
        BOOKING_APPROVED = "BOOKING_APPROVED", "Booking Approved"
        BOOKING_REJECTED = "BOOKING_REJECTED", "Booking Rejected"
        BOOKING_CREATED = "BOOKING_CREATED", "Booking Created"
        BOOKING_ACTIVE = "BOOKING_ACTIVE", "Booking Active"
        BOOKING_CANCELLED = "BOOKING_CANCELLED", "Booking Cancelled"
        ACCOUNT_APPROVED = "ACCOUNT_APPROVED", "Account Approved"
        ACCOUNT_REJECTED = "ACCOUNT_REJECTED", "Account Rejected"
        PROPERTY_APPROVED = "PROPERTY_APPROVED", "Property Approved"
        PROPERTY_REJECTED = "PROPERTY_REJECTED", "Property Rejected"
        PROPERTY_ACTIVE = "PROPERTY_ACTIVE", "Property Active"

    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    notif_type = models.CharField(max_length=30, choices=NotifType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    booking = models.ForeignKey(
        Booking, null=True, blank=True, on_delete=models.SET_NULL
    )
    ledger = models.ForeignKey(
        MonthlyLedger, null=True, blank=True, on_delete=models.SET_NULL
    )
    property_id_ref = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class OfflineTransaction(models.Model):

    class TransactionType(models.TextChoices):
        RENT = "RENT", "Offline Rent"
        FOOD = "FOOD", "Offline Food"
        DEPOSIT_RETURN = "DEPOSIT_RETURN", "Deposit Return"

    class Status(models.TextChoices):
        PENDING_CONFIRMATION = "PENDING_CONFIRMATION", "Waiting for Confirmation"
        SUCCESS = "SUCCESS", "Confirmed"
        DISPUTED = "DISPUTED", "Disputed"

    booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="offline_transactions",
    )
    ledger = models.ForeignKey(
        MonthlyLedger,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="offline_transactions",
    )
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    note = models.TextField(blank=True)
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING_CONFIRMATION,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)


class OfflineRegister(models.Model):

    class RentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID_CASH = "PAID_CASH", "Paid (Cash)"
        WAIVED = "WAIVED", "Waived"

    class FoodStatus(models.TextChoices):
        NOT_APPLICABLE = "NA", "Not Applicable"
        PENDING = "PENDING", "Pending"
        PAID_CASH = "PAID_CASH", "Paid (Cash)"
        WAIVED = "WAIVED", "Waived"

    class DepositStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        HELD = "HELD", "Held by Owner"
        RETURNED = "RETURNED", "Returned"
        PARTIAL_RETURNED = "PARTIAL_RETURNED", "Partial Return"

    slot = models.ForeignKey(
        TenantSlot,
        on_delete=models.CASCADE,
        related_name="register_entries",
    )
    month = models.DateField()  # always first of month e.g. date(2026, 4, 1)

    # Rent
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2)
    rent_status = models.CharField(
        max_length=20,
        choices=RentStatus.choices,
        default=RentStatus.PENDING,
    )
    rent_paid_date = models.DateField(null=True, blank=True)

    # Food
    food_opted = models.BooleanField(default=False)
    food_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    food_status = models.CharField(
        max_length=20,
        choices=FoodStatus.choices,
        default=FoodStatus.NOT_APPLICABLE,
    )
    food_paid_date = models.DateField(null=True, blank=True)

    # Deposit (one record per slot — only on first month entry)
    deposit_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    deposit_status = models.CharField(
        max_length=20,
        choices=DepositStatus.choices,
        default=DepositStatus.PENDING,
        null=True, blank=True,
    )
    deposit_returned_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("slot", "month")
        ordering = ["-month"]

    def __str__(self):
        return f"Register {self.slot.tenant_name} — {self.month.strftime('%b %Y')}"

    @property
    def month_label(self):
        return self.month.strftime("%B %Y")

class OwnerPaymentProfile(models.Model):

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    razorpay_account_id = models.CharField(max_length=200)
    payments_enabled = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    # Day of month rent is due (1–28). Owner configures this per their preference.
    rent_due_day = models.PositiveSmallIntegerField(default=5)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)