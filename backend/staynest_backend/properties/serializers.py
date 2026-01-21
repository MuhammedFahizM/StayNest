from rest_framework import serializers
from .models import Property, SharingOption, PropertyImage


# =========================
# Sharing Option Serializer
# =========================

class SharingOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SharingOption
        # property is injected internally, not from client
        # available_beds is system-managed
        exclude = ("property", "available_beds")

# Property Image Upload Serializer

class PropertyImageUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ("id", "image")

# =========================
# Property Image Serializer
# =========================

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ("id", "image")


# =========================
# Property Serializer
# =========================

class PropertySerializer(serializers.ModelSerializer):
    sharing_options = SharingOptionSerializer(many=True)
    images = PropertyImageSerializer(many=True, required=False)

    class Meta:
        model = Property
        exclude = ("is_deleted",)
        read_only_fields = ("owner",)

    def create(self, validated_data):
        request = self.context.get("request")

        sharing_data = validated_data.pop("sharing_options")
        images_data = validated_data.pop("images", [])

        # Owner is enforced from request
        prop = Property.objects.create(
            owner=request.user,
            **validated_data
        )

        # Create sharing options
        for s in sharing_data:
            SharingOption.objects.create(
                property=prop,
                available_beds=s["total_beds"],
                **s
            )

        # Create images if present
        for img in images_data:
            PropertyImage.objects.create(
                property=prop,
                **img
            )

        return prop
    def update(self, instance, validated_data):
        sharing_data = validated_data.pop("sharing_options", None)

    # Update normal Property fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

    # Handle sharing options update
        if sharing_data is not None:
            existing = {
                opt.sharing_type: opt
                for opt in instance.sharing_options.all()
            }

            for s in sharing_data:
                opt = existing.get(s["sharing_type"])
                if opt:
                    opt.total_beds = s["total_beds"]
                    opt.rent_amount = s["rent_amount"]
                    opt.available_beds = s["total_beds"]
                    opt.save()
                else:
                    SharingOption.objects.create(
                        property=instance,
                        available_beds=s["total_beds"],
                        **s
                    )


        return instance


# =========================
# Property Location Serializer
# =========================

class PropertyLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            "address_text",
            "area",
            "city",
            "state",
            "pincode",
            "latitude",
            "longitude",
        ]
        read_only_fields = ("latitude", "longitude")

    def validate_city(self, value):
        if not value:
            raise serializers.ValidationError("City is mandatory.")
        return value
