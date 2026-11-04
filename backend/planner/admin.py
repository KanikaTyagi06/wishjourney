from django.contrib import admin

from .models import WishPlan


@admin.register(WishPlan)
class WishPlanAdmin(admin.ModelAdmin):
    list_display = ("wish", "provider", "language", "generated_at")
    list_filter = ("provider", "language")
    search_fields = ("wish__title", "wish__user__username")
    readonly_fields = ("id", "created_at", "updated_at", "generated_at")