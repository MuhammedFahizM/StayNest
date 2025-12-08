from django.urls import path
from .views import (
    LoginView,
    OwnerDashboardView,
    VerifyEmailView,
    CombinedRegisterView,
)
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),

    path("owner/dashboard/", OwnerDashboardView.as_view(), name="owner-dashboard"),

    # NEW: Combined registration for both user + owner
    path("register/", CombinedRegisterView.as_view(), name="combined-register"),

    # Email verification
    path("verify-email/<str:token>/", VerifyEmailView.as_view(), name="verify-email"),

    path("accounts/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

]


