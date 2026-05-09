from celery import shared_task
from django.utils import timezone
from datetime import date

from .models import Booking,MonthlyLedger
from .ledger_utils import create_next_month_ledger
from dateutil.relativedelta import relativedelta


@shared_task(bind=True)
def auto_cancel_booking(self, booking_id):
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return

    if (
        booking.status == Booking.Status.APPROVED_AWAITING_PAYMENT
        and booking.payment_deadline
        and timezone.now() >= booking.payment_deadline
    ):
        booking.status = Booking.Status.CANCELLED
        booking.cancelled_at = timezone.now()
        booking.cancellation_reason = Booking.CancellationReason.PAYMENT_TIMEOUT
        booking.save()

        from .models import Notification
        from .ledger_utils import _notify
        if booking.user:
            _notify(
                recipient=booking.user,
                notif_type=Notification.NotifType.BOOKING_CANCELLED,
                title="Booking cancelled — payment not received",
                message=(
                    f"Your booking for {booking.property.property_name} "
                    "was automatically cancelled because the advance payment "
                    "was not completed within 24 hours."
                ),
                booking=booking,
            )

        sharing = booking.sharing_option
        sharing.available_beds += 1
        sharing.occupied_beds = max(sharing.occupied_beds - 1, 0)
        sharing.save(update_fields=["available_beds", "occupied_beds"])




@shared_task
def create_monthly_offline_register_entries():
    """
    Run on the 1st of each month alongside create_monthly_ledger_entries.
    Auto-creates OfflineRegister rows for all active (non-converted) TenantSlots.
    Also marks any PENDING entries from previous months — owner should handle them.
    """
    from .models import TenantSlot, OfflineRegister
    import logging
    logger = logging.getLogger(__name__)

    today = date.today()
    current_month_start = date(today.year, today.month, 1)

    active_slots = TenantSlot.objects.filter(
        is_converted=False
    ).select_related(
        "sharing_option", "property"
    )

    for slot in active_slots:
        try:
            rent_amount = slot.sharing_option.rent_amount

            # Check if food was opted in previous month's entry
            prev_entry = OfflineRegister.objects.filter(
                slot=slot
            ).order_by("-month").first()

            food_opted = prev_entry.food_opted if prev_entry else False
            food_amount = prev_entry.food_amount if (prev_entry and food_opted) else None
            food_status = (
                OfflineRegister.FoodStatus.PENDING
                if food_opted
                else OfflineRegister.FoodStatus.NOT_APPLICABLE
            )

            # Carry deposit info from first entry
            deposit_amount = None
            deposit_status = None
            if prev_entry:
                deposit_amount = prev_entry.deposit_amount
                deposit_status = prev_entry.deposit_status

            OfflineRegister.objects.get_or_create(
                slot=slot,
                month=current_month_start,
                defaults={
                    "rent_amount": rent_amount,
                    "rent_status": OfflineRegister.RentStatus.PENDING,
                    "food_opted": food_opted,
                    "food_amount": food_amount,
                    "food_status": food_status,
                    "deposit_amount": deposit_amount,
                    "deposit_status": deposit_status,
                },
            )
        except Exception as e:
            logger.error(
                f"Failed to create offline register for slot {slot.id}: {e}"
            )


@shared_task
def create_monthly_ledger_entries():
    """
    Run on the 1st of each month (configure in Celery Beat).
    Creates new MonthlyLedger rows for all active bookings.
    Also marks any unpaid ledger rows from previous months as OVERDUE.
    """
    from .models import MonthlyLedger

    today = date.today()
    current_month_start = date(today.year, today.month, 1)

    # Create new ledger entries for all active bookings
    active_bookings = Booking.objects.filter(
        status=Booking.Status.ACTIVE
    ).select_related(
        "property__owner__ownerpaymentprofile",
        "sharing_option",
        "property",
    )

    for booking in active_bookings:
        try:
        # Get last created ledger
            last_ledger = MonthlyLedger.objects.filter(
            booking=booking
            ).order_by("-month").first()

            if not last_ledger:
                continue  # safety (should not happen usually)

            next_month = last_ledger.month + relativedelta(months=1)

            # 🔥 BACKFILL LOOP
            while next_month <= current_month_start:
                create_next_month_ledger(booking, next_month)
                next_month += relativedelta(months=1)

        except Exception as e:
            import logging
            logging.getLogger(__name__).error(
                f"Failed to create ledger for booking {booking.id}: {e}"
            )

    # Mark overdue: any PENDING ledger rows from previous months
    MonthlyLedger.objects.filter(
        rent_status=MonthlyLedger.RentStatus.PENDING,
        rent_due_date__lt=today,
    ).update(rent_status=MonthlyLedger.RentStatus.OVERDUE)

    MonthlyLedger.objects.filter(
        food_status=MonthlyLedger.FoodStatus.PENDING,
        food_amount__isnull=False,
        rent_due_date__lt=today,  # food due date mirrors rent due date
    ).update(food_status=MonthlyLedger.FoodStatus.OVERDUE)


@shared_task
def send_payment_reminders():
    from .models import MonthlyLedger
    from .ledger_utils import _notify

    today = date.today()

    ledgers = MonthlyLedger.objects.filter(
        rent_status=MonthlyLedger.RentStatus.PENDING,
    )

    for ledger in ledgers:
        if ledger.rent_due_date:
            days_left = (ledger.rent_due_date - today).days

            if days_left in [3, 1, 0]:
                _notify(
                    recipient=ledger.booking.user,
                    notif_type="PAYMENT_DUE",
                    title="Upcoming rent due",
                    message=f"Your rent for {ledger.month_label} is due in {days_left} day(s).",
                    booking=ledger.booking,
                    ledger=ledger,
                )