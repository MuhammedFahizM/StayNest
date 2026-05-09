from rest_framework import serializers
from .models import Booking, TenantSlot
from django.db.models import Q
from django.utils import timezone


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ("id", "property", "sharing_option")

    def validate(self, attrs):
        user = self.context["request"].user
        now = timezone.now()

        exists = Booking.objects.filter(user=user).filter(
            Q(status__in=[
                Booking.Status.PENDING,
                Booking.Status.CONFIRMED,
                Booking.Status.ACTIVE,
            ]) |
            Q(
                status=Booking.Status.APPROVED_AWAITING_PAYMENT,
                payment_deadline__gt=now,
            )
        ).exists()

        if exists:
            raise serializers.ValidationError("You already have an active or pending booking.")

        sharing = attrs["sharing_option"]
        if sharing.available_beds <= 0:
            raise serializers.ValidationError("No beds available.")

        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        return Booking.objects.create(user=user, **validated_data)


class BookingReadSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source="property.property_name", read_only=True)
    sharing_label = serializers.SerializerMethodField()
    cancellation_reason_display = serializers.SerializerMethodField()
    owner_id = serializers.IntegerField(source="property.owner.id", read_only=True)
    user_name = serializers.SerializerMethodField()

    rent_amount = serializers.DecimalField(
        source="sharing_option.rent_amount", max_digits=10, decimal_places=2, read_only=True
    )
    advance_amount = serializers.DecimalField(
        source="sharing_option.advance_amount", max_digits=10, decimal_places=2, read_only=True
    )
    food_price = serializers.DecimalField(
        source="property.food_price", max_digits=10, decimal_places=2, read_only=True
    )
    food_provided = serializers.BooleanField(source="property.food_provided", read_only=True)
    security_deposit = serializers.DecimalField(
        source="property.security_deposit",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    deposit_amount = serializers.SerializerMethodField()
    deposit_status = serializers.SerializerMethodField()
    deposit_returned_amount = serializers.SerializerMethodField()
    deposit_marked_by_user = serializers.SerializerMethodField()
    deposit_marked_by_owner = serializers.SerializerMethodField()
    food_request_pending = serializers.SerializerMethodField()

    def get_cancellation_reason_display(self, obj):
        if obj.status == Booking.Status.CANCELLED:
            if obj.cancellation_reason == Booking.CancellationReason.USER_CANCELLED:
                return "Cancelled by user."
            if obj.cancellation_reason == Booking.CancellationReason.OWNER_REJECTED:
                return "Rejected by owner."
            if obj.cancellation_reason == Booking.CancellationReason.PAYMENT_TIMEOUT:
                return "Booking cancelled due to non-payment within deadline."
        return None

    def get_sharing_label(self, obj):
        return f"{obj.sharing_option.sharing_type}-Sharing"

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return None

    def get_deposit_amount(self, obj):
        try:
            return str(obj.deposit.original_amount)
        except Exception:
            return None

    def get_deposit_status(self, obj):
        try:
            return obj.deposit.status
        except Exception:
            return None
        
    def get_deposit_marked_by_owner(self, obj):
        try:
            return obj.deposit.marked_by_owner
        except Exception:
            return False
        
    def get_food_request_pending(self, obj):
        return obj.food_requests.filter(
            status="PENDING"
        ).exists()

    def get_deposit_marked_by_user(self, obj):
        try:
            return obj.deposit.marked_by_user
        except Exception:
            return False

    def get_deposit_returned_amount(self, obj):
        try:
            return str(obj.deposit.returned_amount)
        except Exception:
            return None
        
    

    class Meta:
        model = Booking
        fields = [
            "id",
            "status",
            "source",
            "created_at",
            "approved_at",
            "payment_deadline",
            "cancelled_at",
            "vacated_at",
            "property",
            "property_name",
            "sharing_option",
            "user",
            "user_name",
            "sharing_label",
            "cancellation_reason",
            "cancellation_reason_display",
            "owner_id",
            "user_vacate_requested",
            "owner_vacate_approved",
            "rent_amount",
            "advance_amount",
            "food_price",
            "food_provided",
            "food_opted_in",
            "security_deposit",
            "deposit_amount",
            "deposit_status",
            "deposit_returned_amount",
            "deposit_marked_by_user",
            "deposit_marked_by_owner",
            "food_request_pending",
            "food_opt_in_date",
        ]


class TenantSlotCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantSlot
        fields = ("id", "property", "sharing_option", "tenant_name")

    def validate(self, attrs):
        if attrs["sharing_option"].available_beds <= 0:
            raise serializers.ValidationError("No beds available.")
        return attrs