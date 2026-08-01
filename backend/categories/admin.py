from django.contrib import admin

from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "display_order", "is_active")
    list_editable = ("display_order", "is_active")
    search_fields = ("name", "code")
    prepopulated_fields = {"code": ("name",)}