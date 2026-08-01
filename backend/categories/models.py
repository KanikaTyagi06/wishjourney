import uuid
from django.db import models


class Category(models.Model):
    """
    A category groups wishes into broad life areas (Travel, Fitness,
    Career, etc.). Categories are managed by admins and shown to
    users when browsing or filtering wishes.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.SlugField(
        max_length=50,
        unique=True,
        help_text="Stable internal identifier, e.g. 'travel'. Never shown to users directly.",
    )
    name = models.CharField(
        max_length=100,
        help_text="Display name shown to users, e.g. 'Travel'.",
    )
    description = models.CharField(max_length=255, blank=True)
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="Icon identifier for the frontend (e.g. an icon name like 'plane').",
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Controls the order categories appear in, lower numbers first.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive categories are hidden from users but preserved for existing wishes.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "categories_category"
        verbose_name_plural = "Categories"
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name