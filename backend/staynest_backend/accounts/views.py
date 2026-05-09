# accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied

from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .serializers import (
    CombinedRegisterSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)

from .models import (
    EmailVerificationToken,
    PasswordResetToken,
)

from accounts.tasks import (
    send_verification_email,
    send_password_reset_email,
)

from bookings.models import Booking
from accounts.models import Profile, Owner
from accounts.serializers import (
    UserProfileReadSerializer,
    OwnerProfileReadSerializer,
    OwnerPublicProfileSerializer
)


User = get_user_model()


# ---------------------------------------------------------
# LOGIN
# ---------------------------------------------------------
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        # Check email exists
        if not User.objects.filter(email=email).exists():
            return Response(
                {"error": "Invalid email"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.get(email=email)

        # Block login until email verified
        if not user.is_active:
            return Response(
                {"error": "Please verify your email before logging in."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check password
        if not user.check_password(password):
            return Response(
                {"error": "Incorrect password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        # 🔒 DERIVE ROLE SAFELY (ADMIN IS NOT STORED)
        if user.is_staff or user.is_superuser:
            role = "admin"
        else:
            role = user.profile.role

        # Get phone from owner or profile
        phone = ""
        if hasattr(user, "owner"):
            phone = user.owner.phone or ""
        elif hasattr(user, "profile"):
            phone = user.profile.phone or ""

        profile_image = None

        if hasattr(user, "owner") and user.owner.profile_photo:
            profile_image = request.build_absolute_uri(user.owner.profile_photo.url)

        elif hasattr(user, "profile") and user.profile.profile_photo:
            profile_image = request.build_absolute_uri(user.profile.profile_photo.url)

        return Response(
            {
                "message": "Login success",
                "full_name": user.first_name,
                "email": user.email,
                "role": role,
                "phone": phone,

                "profile_image": profile_image,

                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
            },
            status=status.HTTP_200_OK
        )



# ---------------------------------------------------------
# OWNER DASHBOARD ACCESS CONTROL
# ---------------------------------------------------------
class OwnerDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Must be owner role
        if not hasattr(request.user, "profile") or request.user.profile.role != "owner":
            return Response(
                {"error": "Access denied. Not an owner."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Admin approval check
        if not request.user.profile.is_approved:
            return Response({
                "status": "pending_admin_approval",
                "message": "Your owner account is under admin review. Please wait for approval.",
            }, status=status.HTTP_200_OK)

        return Response({
            "status": "approved",
            "message": "Owner dashboard accessed successfully",
        }, status=status.HTTP_200_OK)


# ---------------------------------------------------------
# COMBINED REGISTRATION (User + Owner)
# ---------------------------------------------------------
class CombinedRegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = CombinedRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user_or_owner = serializer.save()

        # Resolve user object
        user = user_or_owner.user if hasattr(user_or_owner, "user") else user_or_owner

        # Create email verification token
        token_obj = EmailVerificationToken.objects.create(user=user)
        verify_url = f"{settings.FRONTEND_URL}/verify-email/{token_obj.token}"

        # Send verification email via Celery
        send_verification_email.delay(user.email, verify_url)

        return Response({"message": "Verification email sent."}, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------
# EMAIL VERIFICATION
# ---------------------------------------------------------
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            token_obj = EmailVerificationToken.objects.get(token=token)
            user = token_obj.user
            user.is_active = True
            user.save()
            token_obj.delete()

            return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)

        except EmailVerificationToken.DoesNotExist:
            # If token missing but user already active => success
            active_user = User.objects.filter(is_active=True).first()
            if active_user:
                return Response({"message": "Email already verified."}, status=status.HTTP_200_OK)

            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------
# FORGOT PASSWORD (CELERY)
# ---------------------------------------------------------
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Prevent email enumeration
            return Response({"message": "If the email exists, a reset link has been sent."},
                            status=status.HTTP_200_OK)

        token_obj = PasswordResetToken.objects.create(user=user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{token_obj.token}"

        # Send reset email via Celery
        send_password_reset_email.delay(user.email, reset_url)

        return Response({"message": "If the email exists, a reset link has been sent."},
                        status=status.HTTP_200_OK)


# ---------------------------------------------------------
# RESET PASSWORD (CELERY)
# ---------------------------------------------------------
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["password"]

        try:
            token_obj = PasswordResetToken.objects.get(token=token)
        except PasswordResetToken.DoesNotExist:
            return Response({"error": "Invalid or expired token."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Check expiry
        if token_obj.is_expired():
            token_obj.delete()
            return Response({"error": "Token has expired."},
                            status=status.HTTP_400_BAD_REQUEST)

        user = token_obj.user
        user.set_password(new_password)
        user.save()

        # Remove all reset tokens for this user
        PasswordResetToken.objects.filter(user=user).delete()

        return Response({"message": "Password reset successful. You can now log in with your new password."},
                        status=status.HTTP_200_OK)


# ---------------------------------------------------------
# RESEND VERIFICATION EMAIL
# ---------------------------------------------------------
class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "If your email is registered, a verification link has been sent."},
                            status=status.HTTP_200_OK)

        # Already active
        if user.is_active:
            return Response({"message": "Email already verified."},
                            status=status.HTTP_200_OK)

        # Delete old tokens
        EmailVerificationToken.objects.filter(user=user).delete()

        # Create new token
        token_obj = EmailVerificationToken.objects.create(user=user)
        verify_url = f"{settings.FRONTEND_URL}/verify-email/{token_obj.token}"

        # Celery email
        send_verification_email.delay(user.email, verify_url)

        return Response({"message": "A new verification link has been sent."},
                        status=status.HTTP_200_OK)


from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Owner
from .serializers import (
    OwnerProfileReadSerializer,
    OwnerProfileUpdateSerializer
)
from .permissions import IsOwnerSelf


class OwnerProfileView(RetrieveUpdateAPIView):
    """
    Owner Profile:
    - READ own profile
    - UPDATE allowed fields only (PATCH)
    - DELETE NOT ALLOWED
    """

    permission_classes = [IsAuthenticated, IsOwnerSelf]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Owner.objects.select_related("user", "user__profile")

    def get_object(self):
        return Owner.objects.get(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return OwnerProfileUpdateSerializer
        return OwnerProfileReadSerializer


from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser

class AdminOwnerProfileListView(ListAPIView):
    """
    Admin can READ owner profiles
    No update / delete here
    """
    permission_classes = [IsAdminUser]
    serializer_class = OwnerProfileReadSerializer
    queryset = Owner.objects.select_related("user", "user__profile")


from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from .models import Profile
from .serializers import (
    UserProfileReadSerializer,
    UserProfileUpdateSerializer
)
from .permissions import IsUserSelf


class UserProfileView(RetrieveUpdateAPIView):
    """
    User Profile:
    - READ own profile
    - UPDATE allowed fields only
    - DELETE NOT ALLOWED
    """
    permission_classes = [IsAuthenticated, IsUserSelf]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Profile.objects.select_related("user")

    def get_object(self):
        return Profile.objects.get(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return UserProfileUpdateSerializer
        return UserProfileReadSerializer


from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404


class PublicUserProfileView(RetrieveAPIView):
    """
    Owner can view User profile only if booking relationship
    exists in allowed states.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileReadSerializer

    def get_object(self):
        target_user_id = self.kwargs["user_id"]

        # Must be owner
        if not hasattr(self.request.user, "profile") or \
           self.request.user.profile.role != "owner":
            raise PermissionDenied("Only owners can access this endpoint.")

        relationship_exists = Booking.objects.filter(
            property__owner=self.request.user,
            user_id=target_user_id,
            status__in=Booking.PROFILE_ACCESS_STATES
        ).exists()

        if not relationship_exists:
            raise PermissionDenied(
                "Profile access not allowed in current booking state."
            )

        return get_object_or_404(Profile, user_id=target_user_id)



class PublicOwnerProfileView(RetrieveAPIView):
    """
    User can view Owner profile only if booking relationship
    exists in allowed states.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = OwnerPublicProfileSerializer

    def get_object(self):
        target_owner_id = self.kwargs["owner_id"]

        # Must be normal user
        if not hasattr(self.request.user, "profile") or \
           self.request.user.profile.role != "user":
            raise PermissionDenied("Only users can access this endpoint.")

        relationship_exists = Booking.objects.filter(
            user=self.request.user,
            property__owner_id=target_owner_id,
            status__in=Booking.PROFILE_ACCESS_STATES
        ).exists()

        if not relationship_exists:
            raise PermissionDenied(
                "Profile access not allowed in current booking state."
            )

        return get_object_or_404(Owner, user_id=target_owner_id)
