from rest_framework.permissions import BasePermission

class IsOwnerSelf(BasePermission):
    """
    Owner can access ONLY their own profile
    """

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class IsUserSelf(BasePermission):
    """
    User can access ONLY their own profile
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
