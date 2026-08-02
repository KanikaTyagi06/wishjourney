from django.contrib import admin

from .models import WishTemplate


@admin.register(WishTemplate)
class WishTemplateAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "difficulty_level", "is_published")
    list_filter = ("category", "difficulty_level", "is_published")
    search_fields = ("title", "description")