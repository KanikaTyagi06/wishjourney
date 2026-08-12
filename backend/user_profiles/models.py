import uuid
from django.conf import settings
from django.db import models


def profile_picture_upload_path(instance, filename):
    """
    Builds a unique file path for each user's profile picture,
    e.g. profile_pictures/<user_id>/<filename>, so pictures from
    different users never collide or overwrite each other.
    """
    return f"profile_pictures/{instance.user.id}/{filename}"


class UserProfile(models.Model):
    """
    Stores personal and preference details for a user, separate from
    the core authentication data (which lives on the User model).

    Kept as a separate model/app so that authentication concerns and
    personal profile concerns don't mix — this matches the modular
    monolith structure planned for the project.
    """

    class BudgetPreference(models.TextChoices):
        LOW = "low", "Low budget"
        MEDIUM = "medium", "Medium budget"
        HIGH = "high", "High budget"

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"
        PREFER_NOT_TO_SAY = "prefer_not_to_say", "Prefer not to say"

    class GroupPreference(models.TextChoices):
        SOLO = "solo", "Solo"
        COUPLE = "couple", "Couple"
        FRIENDS = "friends", "Friends"
        FAMILY = "family", "Family"

    class ExperienceScope(models.TextChoices):
        LOCAL = "local", "Local"
        NATIONAL = "national", "National"
        INTERNATIONAL = "international", "International"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
        help_text="The user this profile belongs to.",
    )
    full_name = models.CharField(max_length=150, blank=True)
    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        blank=True,
        help_text="Used to show a suitable default avatar when no profile picture is set.",
    )
    bio = models.TextField(max_length=500, blank=True, help_text="Short biography, max 500 characters.")
    profile_picture = models.ImageField(
        upload_to=profile_picture_upload_path,
        blank=True,
        null=True,
        help_text="Optional profile picture. Falls back to a default avatar in the frontend if not set.",
    )
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    preferred_language = models.CharField(
        max_length=10,
        default="en",
        help_text="ISO language code, e.g. 'en', 'hi'. Used for future multilingual support.",
    )
    budget_preference = models.CharField(
        max_length=10,
        choices=BudgetPreference.choices,
        blank=True,
    )
    interests = models.JSONField(
        default=list,
        blank=True,
        help_text="List of interest tags selected during onboarding, e.g. ['travel', 'fitness'].",
    )
    wish_type_preference = models.JSONField(
        default=list,
        blank=True,
        help_text="List of preferred wish categories, e.g. ['travel', 'education'].",
    )
    group_preference = models.CharField(
        max_length=10,
        choices=GroupPreference.choices,
        blank=True,
    )
    experience_scope_preference = models.CharField(
        max_length=15,
        choices=ExperienceScope.choices,
        blank=True,
    )
    is_public = models.BooleanField(
        default=True,
        help_text="Whether this profile is visible to other users.",
    )
    onboarding_completed = models.BooleanField(
        default=False,
        help_text="Set to True once the user finishes (or skips) onboarding.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "profiles_userprofile"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"Profile of {self.user.email}"