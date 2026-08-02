from django.contrib import admin

from .models import UserWish, WishStatusHistory


@admin.register(UserWish)
class UserWishAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "category", "status", "created_at")
    list_filter = ("status", "category", "is_public")
    search_fields = ("title", "user__username", "user__email")


@admin.register(WishStatusHistory)
class WishStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ("wish", "previous_status", "new_status", "changed_at")