import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model for WishJourney.

    We extend Django's built-in AbstractUser instead of using the
    default User model, so that we have full control over fields
    like email (which we treat as unique) and can easily add more
    authentication-related fields in the future without a risky
    migration later.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the user (UUID instead of auto-increment integer for security).",
    )
    email = models.EmailField(
        unique=True,
        help_text="User's email address, must be unique across the platform.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # We still use 'username' for login by default (Django's standard),
    # but email must also always be unique. In a later step, we will
    # configure login to use email instead of username.
    REQUIRED_FIELDS = ["email"]

    is_email_verified = models.BooleanField(
        default=False,
        help_text="Whether the user has verified their email address.",
    )
    email_verification_token = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        help_text="Unique token sent in the verification email link.",
    )

    password_reset_token = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        help_text="Token used for password reset links. Regenerated each time a reset is requested.",
    )
    password_reset_requested_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the last password reset was requested, used to expire old links.",
    )

    class Meta:
        db_table = "accounts_user"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.email