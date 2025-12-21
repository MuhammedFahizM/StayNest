from django.urls import path
from .views import (
    ForgotPasswordView,
    LoginView,
    OwnerDashboardView,
    ResetPasswordView,
    VerifyEmailView,
    CombinedRegisterView,
    ResendVerificationView,
    OwnerProfileView,
    AdminOwnerProfileListView,
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

    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),

    path("resend-verification/", ResendVerificationView.as_view(), name="resend-verification"),

    path("owner/profile/", OwnerProfileView.as_view(), name="owner-profile"),
    
    path("admin/owners/", AdminOwnerProfileListView.as_view(), name="admin-owner-profiles"),



]


