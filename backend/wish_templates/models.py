import uuid
from django.db import models

from categories.models import Category


class WishTemplate(models.Model):
    """
    A pre-made wish suggestion that users can browse and add to their
    own bucket list. Created by admins (or in the future, by AI),
    and linked to a category for browsing and filtering.
    """

    class DifficultyLevel(models.TextChoices):
        EASY = "easy", "Easy"
        MODERATE = "moderate", "Moderate"
        CHALLENGING = "challenging", "Challenging"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="wish_templates",
        help_text="Category this wish belongs to.",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(max_length=1000, blank=True)
    cover_image = models.ImageField(
        upload_to="wish_template_covers/",
        blank=True,
        null=True,
    )
    estimated_budget_min = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Estimated minimum cost in the platform's base currency.",
    )
    estimated_budget_max = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Estimated maximum cost in the platform's base currency.",
    )
    estimated_duration = models.CharField(
        max_length=100,
        blank=True,
        help_text="Human-readable duration estimate, e.g. '2 weeks' or '3 months'.",
    )
    difficulty_level = models.CharField(
        max_length=15,
        choices=DifficultyLevel.choices,
        blank=True,
    )
    suggested_season = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Helpful search tags, e.g. ['mountains', 'nepal', 'trekking'].",
    )
    is_published = models.BooleanField(
        default=True,
        help_text="Unpublished templates are hidden from users but kept for editing.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "wish_templates_wishtemplate"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title