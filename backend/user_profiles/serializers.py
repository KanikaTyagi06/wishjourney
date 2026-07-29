from rest_framework import serializers

from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Used for viewing and updating a user's own profile.
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
            "interests",
            "wish_type_preference",
            "group_preference",
            "experience_scope_preference",
            "is_public",
            "onboarding_completed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class OnboardingSerializer(serializers.ModelSerializer):
    """
    Handles the onboarding flow. A user can either submit their
    preferences (interests, budget, group type, etc.) or skip
    onboarding entirely — either way, onboarding_completed gets
    set to True so we don't ask again.
    """

    class Meta:
        model = UserProfile
        fields = [
            "interests",
            "wish_type_preference",
            "budget_preference",
            "group_preference",
            "experience_scope_preference",
            "preferred_language",
            "city",
            "onboarding_completed",
        ]
        read_only_fields = ["onboarding_completed"]

    def update(self, instance, validated_data):
        validated_data["onboarding_completed"] = True
        return super().update(instance, validated_data)