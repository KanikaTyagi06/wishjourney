from django.contrib import admin

from .models import FriendRequest


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    """
    Lets staff inspect friend requests in /admin/ while we build and test
    the Friends system.
    """

    list_display = ("sender", "receiver", "status", "created_at", "updated_at")
    list_filter = ("status",)
    search_fields = (
        "sender__username",
        "sender__email",
        "receiver__username",
        "receiver__email",
    )
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at", "updated_at")