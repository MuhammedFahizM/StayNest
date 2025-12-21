from django.contrib import admin
from .models import Profile, Owner


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "is_approved")
    list_filter = ("role",)
    search_fields = ("user__email",)

    # 🔒 System-managed field (do not allow manual edit)
    readonly_fields = ("is_approved",)

    # 🚫 Disable delete
    def has_delete_permission(self, request, obj=None):
        return False
    
    def has_add_permission(self, request):
        return False

    

@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = ("user", "phone", "is_verified", "created_at")
    list_filter = ("is_verified",)
    search_fields = ("user__email",)

