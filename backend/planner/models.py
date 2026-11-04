import uuid

from django.db import models
from django.utils import timezone


class WishPlan(models.Model):
    """
    The AI (or offline) plan for one wish. A wish has at most one plan:
    generating again replaces it.

    `content` holds the plan itself (summary, budget, roadmap, checklist,
    tips) exactly as produced by planner.schema.normalize_plan().
    `checked` holds the indexes of the checklist items the person ticked.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wish = models.OneToOneField(
        "wishes.UserWish",
        on_delete=models.CASCADE,
        related_name="plan",
    )
    inputs = models.JSONField(
        default=dict,
        blank=True,
        help_text="What the person told the planner (budget, days, people, style, notes).",
    )
    content = models.JSONField(default=dict)
    checked = models.JSONField(default=list, blank=True)
    provider = models.CharField(
        max_length=20,
        default="mock",
        help_text='Which provider wrote the plan: "mock" or "anthropic".',
    )
    language = models.CharField(max_length=5, default="en")
    generated_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "planner_wishplan"
        verbose_name = "Wish Plan"
        verbose_name_plural = "Wish Plans"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Plan for {self.wish.title} ({self.provider})"