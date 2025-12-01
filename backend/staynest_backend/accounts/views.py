from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from .serializers import OwnerRegisterSerializer


class RegisterView(APIView):
    def post(self, request):
        full_name = request.data.get('full_name')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role')  # NEW

        # Check if email already exists
        if User.objects.filter(username=email).exists():
            return Response({"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=full_name
        )

        # Update role in Profile model
        user.profile.role = role
        user.profile.save()

        return Response({"message": "User registered successfully"}, status=201)


from django.contrib.auth import get_user_model
User = get_user_model()

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # 1. Check if email exists
        if not User.objects.filter(email=email).exists():
            return Response({"error": "Invalid email"}, status=400)

        user = User.objects.get(email=email)

        # 2. Check password
        if not user.check_password(password):
            return Response({"error": "Incorrect password"}, status=400)

        # Create JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Return response
        return Response({
            "message": "Login success",
            "full_name": user.first_name,
            "email": user.email,
            "role": user.profile.role,
            "access_token": access_token,
            "refresh_token": refresh_token
        })


class OwnerDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # 1. Check role
        if request.user.profile.role != "owner":
            return Response({"error": "Access denied. Not an owner."}, status=403)

        # 2. Check admin approval
        if not request.user.profile.is_approved:
            return Response({"error": "Owner account not approved by admin."}, status=403)

        return Response({"message": "Owner dashboard accessed successfully"})



class OwnerRegisterView(APIView):
    def post(self, request):
        serializer = OwnerRegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Owner registered successfully. Pending admin approval."},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
