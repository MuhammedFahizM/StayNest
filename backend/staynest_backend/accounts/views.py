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
        send_mail(
            "Verify your StayNest account",
            f"Click to verify your email: {verify_url}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        return Response({"message": "Verification email sent."}, status=status.HTTP_201_CREATED)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            token_obj = EmailVerificationToken.objects.get(token=token)
        except EmailVerificationToken.DoesNotExist:
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

        user = token_obj.user
        user.is_active = True
        user.save()

        token_obj.delete()

        return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)
