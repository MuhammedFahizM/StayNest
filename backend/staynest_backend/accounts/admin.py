from django.contrib import admin
from .models import Profile,Owner
# Register your models here.




from django.contrib import admin
from .models import Profile, Owner

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "is_approved")
    list_filter = ("role", "is_approved")
    search_fields = ("user__email",)

@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = ("user", "phone", "is_verified", "created_at")
