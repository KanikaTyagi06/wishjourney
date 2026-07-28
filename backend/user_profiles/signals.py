from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserProfile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create an empty UserProfile whenever a new User is
    created, regardless of whether they signed up via normal registration
    or Google OAuth. This ensures every user always has a profile to
    read from and update, without needing a separate creation step.
    """
    if created:
        UserProfile.objects.get_or_create(user=instance)