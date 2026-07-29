from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "city", "country", "preferred_language", "onboarding_completed")
    search_fields = ("user__email", "user__username", "city", "country")
    readonly_fields = ("id", "created_at", "updated_at")