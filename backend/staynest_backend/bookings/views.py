from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import date

from rest_framework import status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Booking, Notification, TenantSlot, Payment, MonthlyLedger
from .ledger_utils import auto_create_deposit_record
from .serializers import (
    BookingCreateSerializer,
    BookingReadSerializer,
    TenantSlotCreateSerializer,
)
from .tasks import auto_cancel_booking
from django.db.models import Q, Case, When, IntegerField


class UserBookingViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BookingReadSerializer

    def get_queryset(self):
        now = timezone.now()

        expired_bookings = Booking.objects.filter(
            user=self.request.user,
            status=Booking.Status.APPROVED_AWAITING_PAYMENT,
            payment_deadline__lt=now,
        )
        for booking in expired_bookings:
            booking.status = Booking.Status.CANCELLED
            booking.cancelled_at = now
            booking.cancellation_reason = Booking.CancellationReason.PAYMENT_TIMEOUT
            booking.save()

        return (
            Booking.objects
            .filter(user=self.request.user)
            .annotate(
                priority=Case(
    When(status=Booking.Status.PENDING, then=0),
    When(status=Booking.Status.APPROVED_AWAITING_PAYMENT, then=1),
    When(status=Booking.Status.CONFIRMED, then=2),
    When(status=Booking.Status.ACTIVE, then=2),
    When(status=Booking.Status.VACATED, then=3),
    When(status=Booking.Status.CANCELLED, then=4),
    default=5,
    output_field=IntegerField(),
)
            )
            .order_by("priority", "-created_at")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return BookingReadSerializer

    def perform_create(self, serializer):
        booking = serializer.save()
        from .ledger_utils import _notify
        owner = booking.property.owner
        owner_name = owner.get_full_name() or owner.username
        user_name = booking.user.get_full_name() or booking.user.username

        # Notify user
        _notify(
            recipient=booking.user,
            notif_type=Notification.NotifType.BOOKING_CREATED,
            title="Booking request sent",
            message=(
                f"Your booking request for {booking.property.property_name} "
                f"({booking.sharing_option.sharing_type}-Sharing) has been sent to {owner_name}. "
                "You will be notified once the owner responds."
            ),
            booking=booking,
        )
        # Notify owner
        _notify(
            recipient=owner,
            notif_type=Notification.NotifType.BOOKING_CREATED,
            title="New booking request",
            message=(
                f"{user_name} has requested a booking for "
                f"{booking.property.property_name} ({booking.sharing_option.sharing_type}-Sharing)."
            ),
            booking=booking,
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status != Booking.Status.PENDING:
            return Response(
                {"error": "Only pending bookings can be cancelled"}, status=400
            )
        booking.status = Booking.Status.CANCELLED
        booking.cancelled_at = timezone.now()
        booking.cancellation_reason = Booking.CancellationReason.USER_CANCELLED
        booking.save()

        sharing = booking.sharing_option
        sharing.available_beds += 1
        sharing.occupied_beds = max(sharing.occupied_beds - 1, 0)
        sharing.save(update_fields=["available_beds", "occupied_beds"])

        return Response({"status": "cancelled"})

    @action(detail=True, methods=["post"])
    def request_vacate(self, request, pk=None):
        booking = self.get_object()

        if booking.status != Booking.Status.ACTIVE:
            return Response(
                {"error": "Only active bookings can be vacated"}, status=400
            )

        # ── FIX: Only block if the CURRENT month's ledger has unpaid rent or food ──
        today = date.today()
        current_month_start = date(today.year, today.month, 1)

        current_ledger = MonthlyLedger.objects.filter(
            booking=booking,
            month=current_month_start,
        ).first()

        if current_ledger:
            if not current_ledger.rent_is_paid:
                return Response(
                    {"error": "Please clear your current month's rent before requesting to vacate."},
                    status=400,
                )
            if (
                current_ledger.food_status == MonthlyLedger.FoodStatus.PENDING
                and not current_ledger.food_is_paid
            ):
                return Response(
                    {"error": "Please clear your current month's food charges before requesting to vacate."},
                    status=400,
                )

        booking.user_vacate_requested = True
        booking.save(update_fields=["user_vacate_requested"])

        booking.user_vacate_requested = True
        booking.save(update_fields=["user_vacate_requested"])

        from .ledger_utils import _notify
        _notify(
            recipient=booking.property.owner,
            notif_type=Notification.NotifType.VACATE_REQUESTED,
            title="Tenant requested to vacate",
            message=(
                f"{booking.user.get_full_name() or booking.user.username} "
                f"has requested to vacate {booking.property.property_name}. "
                "Please review and approve from the Bookings page."
            ),
            booking=booking,
        )

        return Response({"status": "vacate_requested"})


class OwnerBookingViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        property_id = request.query_params.get("property")
        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")

        bookings = Booking.objects.filter(property__owner=request.user)

        if property_id:
            bookings = bookings.filter(property_id=property_id)

        if search:
            bookings = bookings.filter(
                Q(user__username__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)
            )

        if status_filter:
            bookings = bookings.filter(status=status_filter)

        bookings = bookings.annotate(
            priority=Case(
    When(status=Booking.Status.PENDING, then=0),
    When(status=Booking.Status.APPROVED_AWAITING_PAYMENT, then=1),
    When(status=Booking.Status.CONFIRMED, then=2),
    When(status=Booking.Status.ACTIVE, then=2),
    When(status=Booking.Status.VACATED, then=3),
    When(status=Booking.Status.CANCELLED, then=4),
    default=5,
    output_field=IntegerField(),
)
        ).order_by("priority", "-created_at")

        return Response(BookingReadSerializer(bookings, many=True).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        booking = get_object_or_404(
            Booking,
            pk=pk,
            property__owner=request.user,
            status=Booking.Status.PENDING,
        )

        sharing = booking.sharing_option
        if sharing.available_beds <= 0:
            return Response({"error": "No beds available"}, status=400)

        with transaction.atomic():
            sharing.available_beds -= 1
            sharing.occupied_beds += 1
            sharing.save(update_fields=["available_beds", "occupied_beds"])
            booking.status = Booking.Status.APPROVED_AWAITING_PAYMENT
            booking.start_payment_window()
            booking.save(update_fields=["status"])

        auto_cancel_booking.apply_async(
            args=[booking.id],
            eta=booking.payment_deadline,
        )

        from .ledger_utils import _notify
        _notify(
            recipient=booking.user,
            notif_type=Notification.NotifType.BOOKING_APPROVED,
            title="Booking approved! Pay advance to confirm",
            message=(
                f"Your booking for {booking.property.property_name} has been approved by the owner. "
                f"Please pay the advance of ₹{booking.sharing_option.advance_amount} "
                f"within 24 hours to confirm your bed."
            ),
            booking=booking,
        )

        return Response({"status": "approved"})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        booking = get_object_or_404(
            Booking,
            pk=pk,
            property__owner=request.user,
        )
        booking.status = Booking.Status.CANCELLED
        booking.cancelled_at = timezone.now()
        booking.cancellation_reason = Booking.CancellationReason.OWNER_REJECTED
        booking.save()

        from .ledger_utils import _notify
        _notify(
            recipient=booking.user,
            notif_type=Notification.NotifType.BOOKING_REJECTED,
            title="Booking not approved",
            message=(
                f"Your booking request for {booking.property.property_name} "
                "was not approved by the owner. You can browse other properties."
            ),
            booking=booking,
        )

        return Response({"status": "rejected"})

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        booking = get_object_or_404(
            Booking,
            pk=pk,
            property__owner=request.user,
            status=Booking.Status.CONFIRMED,
        )
        booking.status = Booking.Status.ACTIVE
        booking.save()
        # Auto-create deposit record from sharing option
        auto_create_deposit_record(booking)
        return Response({"status": "active"})

    @action(detail=True, methods=["post"])
    def approve_vacate(self, request, pk=None):
        booking = get_object_or_404(
            Booking,
            pk=pk,
            property__owner=request.user,
            status=Booking.Status.ACTIVE,
            user_vacate_requested=True,
        )

        with transaction.atomic():
            booking.status = Booking.Status.VACATED
            booking.vacated_at = timezone.now()
            booking.owner_vacate_approved = True
            booking.save()

            sharing = booking.sharing_option
            sharing.available_beds += 1
            sharing.occupied_beds = max(sharing.occupied_beds - 1, 0)
            sharing.save(update_fields=["available_beds", "occupied_beds"])

        from .ledger_utils import _notify
        _notify(
            recipient=booking.user,
            notif_type=Notification.NotifType.VACATE_APPROVED,
            title="Vacate request approved",
            message=(
                f"Your vacate request for {booking.property.property_name} "
                "has been approved by the owner."
            ),
            booking=booking,
        )

        return Response({"status": "vacated"})


class TenantSlotViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TenantSlotCreateSerializer

    def get_queryset(self):
        property_id = self.request.query_params.get("property")
        queryset = TenantSlot.objects.filter(property__owner=self.request.user)
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(tenant_name__icontains=search)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sharing = serializer.validated_data["sharing_option"]
        if sharing.available_beds <= 0:
            return Response({"error": "No beds available"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            sharing.available_beds -= 1
            sharing.occupied_beds += 1
            sharing.save(update_fields=["available_beds", "occupied_beds"])
            slot = serializer.save()

        return Response(self.get_serializer(slot).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        slot = self.get_object()
        with transaction.atomic():
            if not slot.is_converted:
                sharing = slot.sharing_option
                sharing.available_beds = min(sharing.available_beds + 1, sharing.total_beds)
                sharing.occupied_beds = max(sharing.occupied_beds - 1, 0)
                sharing.save(update_fields=["available_beds", "occupied_beds"])
            slot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        slot = self.get_object()
        slot.generate_invitation()
        return Response({"token": slot.invitation_token})


class InvitationAcceptViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["post"])
    def accept(self, request):
        token = request.data.get("token")
        slot = get_object_or_404(
            TenantSlot,
            invitation_token=token,
            is_converted=False,
        )

        with transaction.atomic():
            booking = Booking.objects.create(
                user=request.user,
                property=slot.property,
                sharing_option=slot.sharing_option,
                status=Booking.Status.ACTIVE,
                source=Booking.Source.OFFLINE_CONVERTED,
            )
            slot.is_converted = True
            slot.delete()

        # Auto-create deposit record for offline-converted booking
        auto_create_deposit_record(booking)
        return Response({"booking_id": booking.id})
    