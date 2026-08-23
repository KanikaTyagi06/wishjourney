from rest_framework import serializers

from categories.serializers import CategorySerializer

from .models import WishTemplate


class WishTemplateSerializer(serializers.ModelSerializer):
    """
    Used for listing wish templates. Includes the full category
    details (not just the ID) so the frontend doesn't need a
    separate API call to show category name/icon alongside each wish.
    """

    category = CategorySerializer(read_only=True)

    class Meta:
        model = WishTemplate
        fields = [
            "id",
            "category",
            "title",
            "description",
            "cover_image",
            "estimated_budget_min",
            "estimated_budget_max",
            "estimated_duration",
            "difficulty_level",
            "suggested_season",
            "tags",
            "is_published",
        ]


class WishTemplateWriteSerializer(serializers.ModelSerializer):
    """
    Used by admins to create or edit wish templates. Accepts a plain
    category ID (not the nested object) since this is a write operation.
    """

    class Meta:
        model = WishTemplate
        fields = [
            "id",
            "category",
            "title",
            "description",
            "cover_image",
            "estimated_budget_min",
            "estimated_budget_max",
            "estimated_duration",
            "difficulty_level",
            "suggested_season",
            "tags",
            "is_published",
        ]
        read_only_fields = ["id"]