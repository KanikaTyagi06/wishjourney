from django.contrib import admin

from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """
    Lets staff inspect messages in /admin/ while we build and test chat.
    """

    list_display = ("sender", "receiver", "short_text", "created_at", "read_at")
    list_filter = ("created_at",)
    search_fields = (
        "sender__username",
        "receiver__username",
        "text",
    )
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at")

    @admin.display(description="Text")
    def short_text(self, obj):
        return obj.text[:50]