from django.shortcuts import render

# Create your views here.

# Owner Views

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Property, PropertyAuditLog, PropertyImage
from .serializers import PropertySerializer
from django.shortcuts import get_object_or_404
from .serializers import PropertyImageUploadSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class OwnerPropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

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
        if prop.status == "APPROVED":
            prop.status = "ACTIVE"
        elif prop.status == "ACTIVE":
            prop.status = "INACTIVE"
        elif prop.status == "INACTIVE":
            prop.status = "ACTIVE"
        else:
            return Response({"error": "Not allowed"}, status=400)
        prop.save()
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
        return Response({"status": "REJECTED"})

# Owner APIs
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Property
from .serializers import PropertyLocationSerializer

class OwnerPropertyLocationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
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
        for prop in Property.objects.all():
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
