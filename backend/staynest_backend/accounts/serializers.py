from rest_framework import serializers
from django.contrib.auth import get_user_model
from accounts.models import Profile, Owner

User = get_user_model()


class OwnerRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(required=True)
    phone = serializers.CharField(required=True)
    address = serializers.CharField(required=True)

    class Meta:
        model = Owner
        fields = ['email', 'password', 'username', 'phone', 'address']

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        username = validated_data.pop('username')
        phone = validated_data.pop('phone')
        address = validated_data.pop('address')

        # 1. Create User
        user = User.objects.create_user(
            email=email,
            password=password,
            username=username
        )

        # 2. Update profile to owner
        profile = Profile.objects.get(user=user)
        profile.role = 'owner'
        profile.is_approved = False
        profile.save()

        # 3. Create Owner entry
        owner = Owner.objects.create(
            user=user,
            phone=phone,
            address=address
        )

        return owner
