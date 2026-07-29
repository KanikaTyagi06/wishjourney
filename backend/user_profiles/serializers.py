from rest_framework import serializers

from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Used for viewing and updating a user's own profile.

    Fields like 'user', 'id', 'created_at', and 'updated_at' are
    read-only since they should never be changed directly by the
    client — they're either set automatically or reference other data.
    """

    email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "bio",
            "profile_picture",
            "city",
            "country",
            "preferred_language",
            "budget_preference",
            "is_public",
            "onboarding_completed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]