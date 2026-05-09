"""
bookings/ledger_utils.py

Helpers for creating and managing MonthlyLedger rows.
Called from the webhook (Month 1) and the Celery monthly task (Month 2+).
"""
from datetime import date
from calendar import monthrange

from django.utils import timezone

from .models import Booking, MonthlyLedger, Notification, DepositRecord
from django.db import transaction

def get_due_date(year: int, month: int, due_day: int) -> date:
    """
    Return the due date for a given month, clamping due_day to the last
    day of the month (so day=31 in February becomes Feb 28/29).
    """
    last_day = monthrange(year, month)[1]
    clamped = min(due_day, last_day)
    return date(year, month, clamped)


def create_month1_ledger(booking: Booking) -> MonthlyLedger:
    """
    Create the Month 1 ledger entry after advance + balance rent are paid.
    The rent is considered PAID_ONLINE for this month already.
    Called from the Razorpay webhook when BALANCE payment succeeds.
    """
    with transaction.atomic():
        today = timezone.now().date()
        month_start = date(today.year, today.month, 1)

        # Freeze the rent amount from the sharing option
        rent = booking.sharing_option.rent_amount
        booking.frozen_rent_amount = rent
        booking.save(update_fields=["frozen_rent_amount"])

    # Determine due date using owner profile setting (default 5)
    due_day = 5
    try:
        due_day = booking.property.owner.ownerpaymentprofile.rent_due_day
    except Exception:
        pass

    due_date = get_due_date(today.year, today.month, due_day)

    food_status = MonthlyLedger.FoodStatus.NOT_APPLICABLE
    food_amount = None

    food_active = False


    if booking.food_opted_in and booking.property.food_provided:
        # Month 1 = always current month → food applies immediately if opted
        food_active = True

    if food_active:
        food_status = MonthlyLedger.FoodStatus.PENDING
        food_amount = booking.property.food_price

    ledger, created = MonthlyLedger.objects.get_or_create(
        booking=booking,
        month=month_start,
        defaults={
            "rent_amount": rent,
            "rent_due_date": due_date,
            "rent_status": MonthlyLedger.RentStatus.PAID_ONLINE,
            "rent_paid_at": timezone.now(),
            "food_amount": food_amount,
            "food_status": food_status,
        },
    )

    if created:
        # Notify owner
        _notify(
            recipient=booking.property.owner,
            notif_type=Notification.NotifType.PAYMENT_RECEIVED,
            title="Rent received",
            message=(
                f"{_user_name(booking.user)} has completed payment for Month 1 "
                f"({ledger.month_label}) at {booking.property.property_name}. "
                f"Amount: ₹{rent}."
            ),
            booking=booking,
            ledger=ledger,
        )
        # Notify user
        _notify(
            recipient=booking.user,
            notif_type=Notification.NotifType.PAYMENT_RECEIVED,
            title="First month payment complete",
            message=(
                f"Your Month 1 rent for {booking.property.property_name} "
                f"({ledger.month_label}) is paid. ₹{rent}. "
                "From next month onwards you will receive a monthly payment reminder."
            ),
            booking=booking,
            ledger=ledger,
        )

    return ledger


def auto_create_deposit_record(booking: Booking):
    """
    Auto-create a DepositRecord when a booking becomes ACTIVE,
    pulling security_deposit from the Property model.
    Safe to call multiple times — uses get_or_create.
    Returns None if no deposit amount is set on the property.
    """
    amount = booking.property.security_deposit
    if not amount:
        return None

    deposit, created = DepositRecord.objects.get_or_create(
        booking=booking,
        defaults={"original_amount": amount},
    )

    if created:
        # Notify both sides that a deposit is expected
        _notify(
            recipient=booking.user,
            notif_type=Notification.NotifType.DEPOSIT_RECEIVED,
            title="Deposit required",
            message=(
                f"A security deposit of ₹{amount} is required for your stay at "
                f"{booking.property.property_name}. You can pay online or settle "
                "it directly with the owner."
            ),
            booking=booking,
        )
        _notify(
            recipient=booking.property.owner,
            notif_type=Notification.NotifType.DEPOSIT_RECEIVED,
            title="Deposit pending from tenant",
            message=(
                f"A security deposit of ₹{amount} is pending from "
                f"{_user_name(booking.user)} for {booking.property.property_name}."
            ),
            booking=booking,
        )

    return deposit


def create_next_month_ledger(booking: Booking, target_month: date) -> MonthlyLedger:
    """
    Create a new ledger entry for the given month (called by Celery on the 1st).
    Uses frozen_rent_amount if set, otherwise falls back to sharing_option.rent_amount.
    """
    rent = booking.frozen_rent_amount or booking.sharing_option.rent_amount

    due_day = 5
    try:
        due_day = booking.property.owner.ownerpaymentprofile.rent_due_day
    except Exception:
        pass

    due_date = get_due_date(target_month.year, target_month.month, due_day)

    food_status = MonthlyLedger.FoodStatus.NOT_APPLICABLE
    food_amount = None

    food_active = False

    if booking.food_opted_in and booking.property.food_provided:
        if booking.food_opt_in_date:
            food_active = booking.food_opt_in_date <= target_month
        else:
            food_active = True

    if food_active:
        food_status = MonthlyLedger.FoodStatus.PENDING
        food_amount = booking.property.food_price

    ledger, created = MonthlyLedger.objects.get_or_create(
        booking=booking,
        month=target_month,
        defaults={
            "rent_amount": rent,
            "rent_due_date": due_date,
            "rent_status": MonthlyLedger.RentStatus.PENDING,
            "food_amount": food_amount,
            "food_status": food_status,
        },
    )

    if created:
        # Notify both sides
        _notify(
            recipient=booking.property.owner,
            notif_type=Notification.NotifType.PAYMENT_DUE,
            title="Monthly rent due",
            message=(
                f"Rent for {_user_name(booking.user)} at "
                f"{booking.property.property_name} is due by {due_date.strftime('%d %b %Y')}. "
                f"Amount: ₹{rent}."
            ),
            booking=booking,
            ledger=ledger,
        )
        _notify(
            recipient=booking.user,
            notif_type=Notification.NotifType.PAYMENT_DUE,
            title="Monthly rent reminder",
            message=(
                f"Your rent for {booking.property.property_name} "
                f"({ledger.month_label}) is due by {due_date.strftime('%d %b %Y')}. "
                f"Amount: ₹{rent}."
            ),
            booking=booking,
            ledger=ledger,
        )

    return ledger


def _user_name(user) -> str:
    if not user:
        return "A tenant"
    return user.get_full_name() or user.username


def _notify(recipient, notif_type, title, message, booking=None, ledger=None, property_id_ref=None):
    if not recipient:
        return
    Notification.objects.create(
        recipient=recipient,
        notif_type=notif_type,
        title=title,
        message=message,
        booking=booking,
        ledger=ledger,
        property_id_ref=property_id_ref or (booking.property_id if booking else None),
    )