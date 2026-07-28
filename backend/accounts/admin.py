from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Register our custom User model with Django admin so that
    administrators can view and manage users through /admin/.
    """

    list_display = ("email", "username", "is_active", "is_staff", "created_at")
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at", "updated_at")