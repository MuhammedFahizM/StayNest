from rest_framework import serializers
from django.contrib.auth import get_user_model
from accounts.models import Profile, Owner
from .validators import validate_id_proof

User = get_user_model()


class CombinedRegisterSerializer(serializers.Serializer):
    # common fields
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(required=True)

    role = serializers.ChoiceField(choices=[('user', 'User'), ('owner', 'Owner')])

    # proof for BOTH user + owner
    proof = serializers.FileField(write_only=True, required=True,
                                  error_messages={"required": "ID proof is required."})

    # owner-only
    phone = serializers.CharField(required=False)
    address = serializers.CharField(required=False)

    def validate_proof(self, value):
        validate_id_proof(value)
        return value

    def validate(self, attrs):
        role = attrs.get("role")

        # Owner mandatory fields
        if role == "owner":
            if not attrs.get("phone"):
                raise serializers.ValidationError({"phone": "Phone is required for owners"})
            if not attrs.get("address"):
                raise serializers.ValidationError({"address": "Address is required for owners"})

            # email check (username == email)
            # Email already registered — check active status
        existing_user = User.objects.filter(username=attrs["email"]).first()

        if existing_user:
            if existing_user.is_active:
            # Fully registered user → block
                raise serializers.ValidationError({"email": "Email already registered."})
            else:
            # User registered but not verified → allow re-registration?
            # For now, we resend verification instead of blocking:
                raise serializers.ValidationError({
                "email": "Email already registered but not verified. Please verify your email or request a new verification link."
            })


        return attrs

    def create(self, validated_data):
        role = validated_data.pop("role")
        proof = validated_data.pop("proof")

        phone = validated_data.pop("phone", None)
        address = validated_data.pop("address", None)

        email = validated_data.pop("email")
        password = validated_data.pop("password")
        full_name = validated_data.pop("full_name")

        # -------------------------------
        # Create user
        # -------------------------------
        user = User.objects.create_user(
            email=email,
            username=email,
            password=password,
        )
        user.first_name = full_name
        
        user.is_active = False  # block login until verification
        user.save()

        # -------------------------------
        # Create/update profile
        # -------------------------------
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.role = role
        profile.proof = proof
        profile.is_approved = False
        profile.save()

        # -------------------------------
        # Create owner only if owner
        # -------------------------------
        if role == "owner":
            owner = Owner.objects.create(
                user=user,
                phone=phone,
                address=address,
                proof=proof
            )
            return owner

        return user


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs
