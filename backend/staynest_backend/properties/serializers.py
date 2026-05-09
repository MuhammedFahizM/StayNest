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
        exclude = ("property",)
        read_only_fields = ("available_beds",)

    def validate(self, data):
        rent = data.get("rent_amount")
        advance = data.get("advance_amount", 0)

        if advance > rent:
            raise serializers.ValidationError(
                "Advance cannot be greater than rent amount."
            )

        return data    

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
    sharing_options = SharingOptionSerializer(many=True, required=False)
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
            total = s["total_beds"]
            occupied = s.get("occupied_beds", 0)

            if occupied > total:
                raise serializers.ValidationError(
                    "Occupied beds cannot exceed total beds."
                )

            SharingOption.objects.create(
                property=prop,
                sharing_type=s["sharing_type"],
                total_beds=total,
                occupied_beds=occupied,
                available_beds=total - occupied,
                rent_amount=s["rent_amount"],
                advance_amount=s.get("advance_amount", 0),
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
                total = s["total_beds"]
                occupied = s.get("occupied_beds", 0)

                if occupied > total:
                    raise serializers.ValidationError(
                        "Occupied beds cannot exceed total beds."
                    )

                opt = existing.get(s["sharing_type"])
                if opt:
                    opt.total_beds = total
                    opt.occupied_beds = occupied
                    opt.available_beds = total - occupied
                    opt.rent_amount = s["rent_amount"]
                    opt.advance_amount = s.get("advance_amount", 0)
                    opt.save()
                else:
                    SharingOption.objects.create(
                        property=instance,
                        sharing_type=s["sharing_type"],
                        total_beds=total,
                        occupied_beds=occupied,
                        available_beds=total - occupied,
                        rent_amount=s["rent_amount"],
                        advance_amount=s.get("advance_amount", 0),
                    )
        return instance
    
    def validate(self, data):
        food_provided = data.get("food_provided")
        food_price = data.get("food_price")

        if food_provided and not food_price:
            raise serializers.ValidationError(
                "Food price is required when food is provided."
            )

        return data


# =========================
# Property Location Serializer
# =========================

class PropertyLocationSerializer(serializers.ModelSerializer):
    latitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True
    )
    longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, required=False, allow_null=True
    )

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

    def validate_city(self, value):
        if not value:
            raise serializers.ValidationError("City is mandatory.")
        return value
