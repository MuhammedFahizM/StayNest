from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import (
    OwnerPropertyViewSet,
    AdminPropertyReviewViewSet,
    OwnerPropertyLocationView,
    PropertyByCityView,
    PropertyNearbyView,
    PropertyLocationDetailView,
    PublicPropertyListView,
    PublicPropertyDetailView,
)

router = DefaultRouter()
router.register("owner/properties", OwnerPropertyViewSet, basename="owner-properties")
router.register("api/admin/properties", AdminPropertyReviewViewSet, basename="admin-properties")

urlpatterns = router.urls + [
    path("owner/property/location/", OwnerPropertyLocationView.as_view()),
    path("owner/property/location/<int:pk>/", OwnerPropertyLocationView.as_view()),

    path("properties/by-city/", PropertyByCityView.as_view()),
    path("properties/nearby/", PropertyNearbyView.as_view()),
    path("properties/location/<int:pk>/", PropertyLocationDetailView.as_view()),


     # ===============================
    # PUBLIC PROPERTY APIs
    # ===============================
    path("properties/", PublicPropertyListView.as_view(), name="public-property-list"),
    path("properties/<int:pk>/", PublicPropertyDetailView.as_view(), name="public-property-detail"),
]
