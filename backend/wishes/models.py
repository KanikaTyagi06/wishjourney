import uuid
from django.conf import settings
from django.db import models

from categories.models import Category
from wish_templates.models import WishTemplate


class UserWish(models.Model):
    """
    A single item on a user's personal bucket list. Can be created
    either from a WishTemplate (a recommended wish) or entirely from
    scratch as a custom wish.
    """

    class Status(models.TextChoices):
        IDEA = "idea", "Idea"
        SAVED = "saved", "Saved"
        PLANNING = "planning", "Planning"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        PAUSED = "paused", "Paused"
        CANCELLED = "cancelled", "Cancelled"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishes",
    )
    source_template = models.ForeignKey(
        WishTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="added_by_users",
        help_text="If this wish was added from a recommended template, this links back to it.",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="user_wishes",
    )

    title = models.CharField(max_length=200)
    description = models.TextField(max_length=1000, blank=True)
    cover_image = models.ImageField(
        upload_to="wish_covers/",
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IDEA,
    )
    priority = models.BooleanField(
        default=False,
        help_text="Whether the user has marked this wish as a priority.",
    )
    is_public = models.BooleanField(
        default=False,
        help_text="Whether this wish is visible to other users.",
    )

    estimated_budget = models.PositiveIntegerField(null=True, blank=True)
    actual_cost = models.PositiveIntegerField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)
    progress_percentage = models.PositiveIntegerField(default=0)
    notes = models.TextField(max_length=1000, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "wishes_userwish"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.user.username})"


class WishStatusHistory(models.Model):
    """
    Tracks every status change a wish goes through, so users can see
    their journey (e.g. Idea -> Planning -> In Progress -> Completed)
    and so we have an audit trail.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wish = models.ForeignKey(
        UserWish,
        on_delete=models.CASCADE,
        related_name="status_history",
    )
    previous_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wishes_wishstatushistory"
        ordering = ["-changed_at"]

    def __str__(self):
        return f"{self.wish.title}: {self.previous_status} -> {self.new_status}"