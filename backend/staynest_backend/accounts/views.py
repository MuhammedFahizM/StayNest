# accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny

from .serializers import CombinedRegisterSerializer
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .models import EmailVerificationToken
from django.db import transaction

from accounts.tasks import send_verification_email
from accounts.tasks import send_password_reset_email
from .models import PasswordResetToken
from django.utils import timezone
from .serializers import ForgotPasswordSerializer, ResetPasswordSerializer



User = get_user_model()

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # 1. Check if email exists
        if not User.objects.filter(email=email).exists():
            return Response({"error": "Invalid email"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(email=email)

        # ✅ 2. BLOCK LOGIN UNTIL EMAIL IS VERIFIED
        if not user.is_active:
            return Response(
                {"error": "Please verify your email before logging in."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 3. Check password
        if not user.check_password(password):
            return Response({"error": "Incorrect password"}, status=status.HTTP_401_UNAUTHORIZED)

        # 4. Create JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Login success",
            "full_name": user.first_name,
            "email": user.email,
            "role": user.profile.role,
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh)
        }, status=status.HTTP_200_OK)


class OwnerDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # 1. Role check
        if not hasattr(request.user, "profile") or request.user.profile.role != "owner":
            return Response(
                {"error": "Access denied. Not an owner."},
                status=status.HTTP_403_FORBIDDEN
            )

        # ✅ 2. Admin approval check — RETURN PENDING, NOT ERROR
        if not request.user.profile.is_approved:
            return Response({
                "status": "pending_admin_approval",
                "message": "Your owner account is under admin review. Please wait for approval."
            }, status=status.HTTP_200_OK)

        # ✅ 3. Approved owner
        return Response({
            "status": "approved",
            "message": "Owner dashboard accessed successfully"
        }, status=status.HTTP_200_OK)


class CombinedRegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        
        serializer = CombinedRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user_or_owner = serializer.save()

        # Create email verification token
        user = user_or_owner.user if hasattr(user_or_owner, "user") else user_or_owner

        token_obj = EmailVerificationToken.objects.create(user=user)
        token = token_obj.token
        verify_url = f"{settings.FRONTEND_URL}/verify-email/{token}"

        # Send email
        send_verification_email.delay(user.email, verify_url)

        # ForgotPassword
        # send_password_reset_email.delay(user.email, reset_url)



        return Response({"message": "Verification email sent."}, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            token_obj = EmailVerificationToken.objects.get(token=token)

            # Token exists → verify user
            user = token_obj.user
            user.is_active = True
            user.save()

            token_obj.delete()

            return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)

        except EmailVerificationToken.DoesNotExist:
            # IMPORTANT FIX:
            # If token already deleted but user is active → return success
            match_user = User.objects.filter(is_active=True).first()

            if match_user:
                return Response({"message": "Email already verified."}, status=status.HTTP_200_OK)

            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)



# accounts/views.py (append)

from .models import PasswordResetToken  # new model
from .serializers import ForgotPasswordSerializer, ResetPasswordSerializer
from django.utils import timezone

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # For security, respond with success even if email not found
            return Response({"message": "If the email exists, a reset link has been sent."}, status=status.HTTP_200_OK)

        # Create a password reset token
        token_obj = PasswordResetToken.objects.create(user=user)
        token = token_obj.token
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{token}"

        # Send reset email (uses existing send_mail setup)
        send_mail(
            "Reset your StayNest password",
            f"Click the link to reset your password: {reset_url}\nThis link expires in 24 hours.",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        return Response({"message": "If the email exists, a reset link has been sent."}, status=status.HTTP_200_OK)


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
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        if token_obj.is_expired():
            token_obj.delete()
            return Response({"error": "Token has expired."}, status=status.HTTP_400_BAD_REQUEST)

        user = token_obj.user
        user.set_password(new_password)
        user.save()

        # remove all existing password reset tokens for this user
        PasswordResetToken.objects.filter(user=user).delete()

        return Response({"message": "Password reset successful. You can now log in with your new password."}, status=status.HTTP_200_OK)



class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Always return success — prevents email enumeration
            return Response({"message": "If the email exists, a reset link has been sent."},
                            status=status.HTTP_200_OK)

        # Create password reset token
        token_obj = PasswordResetToken.objects.create(user=user)
        token = token_obj.token

        reset_url = f"{settings.FRONTEND_URL}/reset-password/{token}"

        # CELERY TASK
        send_password_reset_email.delay(user.email, reset_url)

        return Response({"message": "If the email exists, a reset link has been sent."},
                        status=status.HTTP_200_OK)



class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        password = serializer.validated_data["password"]

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
        user.set_password(password)
        user.save()

        # Delete all reset tokens for this user for safety
        PasswordResetToken.objects.filter(user=user).delete()

        return Response({"message": "Password reset successful. You can now log in with your new password."},
                        status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Always success response for security
            return Response({"message": "If your email is registered, a verification link has been sent."},
                            status=status.HTTP_200_OK)

        # If user already verified
        if user.is_active:
            return Response({"message": "Email already verified."}, status=status.HTTP_200_OK)

        # Delete old tokens (optional but clean)
        EmailVerificationToken.objects.filter(user=user).delete()

        # Create new token
        token_obj = EmailVerificationToken.objects.create(user=user)
        token = token_obj.token

        verify_url = f"{settings.FRONTEND_URL}/verify-email/{token}"

        # Send email via Celery
        send_verification_email.delay(user.email, verify_url)

        return Response({"message": "A new verification email has been sent."},
                        status=status.HTTP_200_OK)
