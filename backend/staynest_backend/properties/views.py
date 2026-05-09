from django.shortcuts import render

# Create your views here.

# Owner Views

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Property, PropertyAuditLog, PropertyImage, SharingOption
from .serializers import PropertySerializer
from django.shortcuts import get_object_or_404
from .serializers import PropertyImageUploadSerializer
from rest_framework.parsers import MultiPartParser, FormParser , JSONParser
from django.db import transaction


class OwnerPropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Property.objects.filter(
            owner=self.request.user,
            is_deleted=False
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        sensitive_fields = [
            "stay_type", "is_ac", "latitude", "longitude"
        ]

        for field in sensitive_fields:
            if field in serializer.validated_data:
                old = getattr(instance, field)
                new = serializer.validated_data[field]
                if old != new:
                    PropertyAuditLog.objects.create(
                        property=instance,
                        owner=self.request.user,
                        field_name=field,
                        old_value=str(old),
                        new_value=str(new),
                    )

        serializer.save()

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        prop = self.get_object()
        if prop.status in ["DRAFT", "REJECTED"]:
            if prop.images.count() < 3:
                return Response({"error": "Minimum 3 images required"}, status=400)
            prop.status = "SUBMITTED"
            prop.save()
            return Response({"status": "SUBMITTED"})
        return Response({"error": "Invalid state"}, status=400)

    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        prop = self.get_object()
        was_approved = prop.status == "APPROVED"
        if prop.status == "APPROVED":
            prop.status = "ACTIVE"
        elif prop.status == "ACTIVE":
            prop.status = "INACTIVE"
        elif prop.status == "INACTIVE":
            prop.status = "ACTIVE"
        else:
            return Response({"error": "Not allowed"}, status=400)
        prop.save()

        if was_approved and prop.status == "ACTIVE":
            try:
                from bookings.models import Notification
                from bookings.ledger_utils import _notify
                _notify(
                    recipient=prop.owner,
                    notif_type=Notification.NotifType.PROPERTY_ACTIVE,
                    title=f"{prop.property_name} is now live!",
                    message=(
                        f"Your property '{prop.property_name}' is now active on StayNest. "
                        "Users can find and book it from Browse Stays."
                    ),
                    property_id_ref=prop.id,
                )
            except Exception:
                pass

        return Response({"status": prop.status})

    @action(detail=True, methods=["post"])
    def images(self, request, pk=None):
        prop = self.get_object()

        files = request.FILES.getlist("images")
        if not files:
            return Response(
                {"error": "No images provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        created = []
        for f in files:
            img = PropertyImage.objects.create(
                property=prop,
                image=f
            )
            created.append(img)

        serializer = PropertyImageUploadSerializer(created, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
    detail=True,
    methods=["delete"],
    url_path="images/(?P<image_id>[^/.]+)"
    )
    def delete_image(self, request, pk=None, image_id=None):
        prop = self.get_object()

        image = get_object_or_404(
        PropertyImage,
        id=image_id,
        property=prop
        )

        current_count = prop.images.count()

    # Enforce minimum image rule for non-draft states
        if prop.status in ["SUBMITTED", "APPROVED", "ACTIVE"]:
            if current_count <= 3:
                return Response(
                    {
                        "error": "A minimum of 3 images is required for this property."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        image.delete()

        return Response(
            {"status": "image_deleted"},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["delete"])
    def delete(self, request, pk=None):
        prop = self.get_object()

        with transaction.atomic():
            # delete related data explicitly
            prop.images.all().delete()
            prop.sharing_options.all().delete()
            PropertyAuditLog.objects.filter(property=prop).delete()

            # finally delete property
            prop.delete()

        return Response(
            {"status": "property_deleted"},
            status=status.HTTP_204_NO_CONTENT
        )




# Admin Views

class AdminPropertyReviewViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Property.objects.filter(status="SUBMITTED", is_deleted=False)
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        prop = self.get_object()
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
        return Response({"status": "APPROVED"})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        reason = request.data.get("reason")
        if not reason:
            return Response({"error": "Reason required"}, status=400)
        prop = self.get_object()
        prop.status = "REJECTED"
        prop.rejection_reason = reason
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
                    f"Reason: {reason}. Please update your listing and resubmit."
                ),
                property_id_ref=prop.id,
            )
        except Exception:
            pass
        return Response({"status": "REJECTED"})

# Owner APIs
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Property
from .serializers import PropertyLocationSerializer

class OwnerPropertyLocationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        prop = get_object_or_404(
            Property,
            pk=pk,
            owner=request.user,
            is_deleted=False
        )

        serializer = PropertyLocationSerializer(
            prop,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)



# User APIs

from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from .models import Property
from .serializers import PropertyLocationSerializer
from .utils.location import haversine_distance

class PropertyByCityView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PropertyLocationSerializer

    def get_queryset(self):
        city = self.request.query_params.get("city")
        return Property.objects.filter(city__iexact=city)


class PropertyNearbyView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PropertyLocationSerializer

    def get_queryset(self):
        lat = float(self.request.query_params.get("lat"))
        lng = float(self.request.query_params.get("lng"))
        radius = float(self.request.query_params.get("radius", 3))

        results = []
        for prop in Property.objects.filter(
            status="ACTIVE", is_deleted=False,
            latitude__isnull=False, longitude__isnull=False
            ):
            dist = haversine_distance(
                lat, lng, prop.latitude, prop.longitude
            )
            if dist <= radius:
                prop.distance = round(dist, 2)
                results.append(prop)

        return results


class PropertyLocationDetailView(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = PropertyLocationSerializer
    queryset = Property.objects.all()



# ===============================
# PUBLIC PROPERTY VIEWS
# ===============================

from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from .models import Property
from .serializers import PropertySerializer
from django.db import models


from django.db.models import Q

class PublicPropertyListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PropertySerializer

    def get_queryset(self):
        qs = Property.objects.filter(status="ACTIVE", is_deleted=False)

        p = self.request.query_params

        search = p.get("search")
        if search:
            qs = qs.filter(
                models.Q(property_name__icontains=search) |
                models.Q(city__icontains=search) |
                models.Q(area__icontains=search)
            )

        city = p.get("city")
        if city:
            qs = qs.filter(city__iexact=city)

        area = p.get("area")
        if area:
            qs = qs.filter(area__icontains=area)

        stay_type = p.get("stay_type")
        if stay_type:
            qs = qs.filter(stay_type=stay_type)

        preferred = p.get("preferred_occupants")
        if preferred:
            qs = qs.filter(preferred_occupants__contains=preferred)

        is_ac = p.get("is_ac")
        if is_ac is not None:
            qs = qs.filter(is_ac=is_ac == "true")

        food = p.get("food_provided")
        if food is not None:
            qs = qs.filter(food_provided=food == "true")

        parking = p.get("parking_available")
        if parking is not None:
            qs = qs.filter(parking_available=parking == "true")

        wifi = p.get("wifi_available")
        if wifi is not None:
            qs = qs.filter(wifi_available=wifi == "true")

        power = p.get("power_backup")
        if power is not None:
            qs = qs.filter(power_backup=power == "true")

        has_deposit = p.get("has_deposit")
        if has_deposit == "true":
            qs = qs.filter(security_deposit__isnull=False, security_deposit__gt=0)

        sharing_type = p.get("sharing_type")
        min_rent = p.get("min_rent")
        max_rent = p.get("max_rent")

        if sharing_type or min_rent or max_rent:
            sharing_qs = SharingOption.objects.all()
            if sharing_type:
                sharing_qs = sharing_qs.filter(sharing_type=int(sharing_type))
            if min_rent:
                sharing_qs = sharing_qs.filter(rent_amount__gte=min_rent)
            if max_rent:
                sharing_qs = sharing_qs.filter(rent_amount__lte=max_rent)
            property_ids = sharing_qs.values_list("property_id", flat=True)
            qs = qs.filter(id__in=property_ids)

        lat = p.get("lat")
        lng = p.get("lng")
        radius = float(p.get("radius", 5))

        if lat and lng:
            from .utils.location import haversine_distance
            lat_f, lng_f = float(lat), float(lng)
            ids = [
                prop.id for prop in qs
                if prop.latitude and prop.longitude and
                haversine_distance(lat_f, lng_f, float(prop.latitude), float(prop.longitude)) <= radius
            ]
            qs = qs.filter(id__in=ids)

        return qs.order_by("-created_at")


class PublicPropertyDetailView(RetrieveAPIView):
    """
    Public:
    - View single ACTIVE property
    - No authentication required
    """
    permission_classes = [AllowAny]
    serializer_class = PropertySerializer

    def get_queryset(self):
        return Property.objects.filter(
            status="ACTIVE",
            is_deleted=False
        )
