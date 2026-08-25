from rest_framework import serializers

from categories.serializers import CategorySerializer
from wish_templates.models import WishTemplate
from categories.models import Category

from .models import UserWish


class UserWishSerializer(serializers.ModelSerializer):
    """
    Used for listing and viewing a user's wishes. Category details
    are nested so the frontend can show the name/icon without an
    extra API call.
    """

    category = CategorySerializer(read_only=True)

    class Meta:
        model = UserWish
        fields = [
            "id",
            "source_template",
            "category",
            "title",
            "description",
            "cover_image",
            "status",
            "priority",
            "is_public",
            "estimated_budget",
            "actual_cost",
            "target_date",
            "completion_date",
            "progress_percentage",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class UserWishCreateSerializer(serializers.ModelSerializer):
    """
    Used for creating a new wish. Accepts either:
    - source_template_id: creates a wish pre-filled from a recommended template
    - OR manual title/category: creates a fully custom wish

    The user is set automatically from the request, never from client input.
    """

    source_template_id = serializers.UUIDField(write_only=True, required=False)
    title = serializers.CharField(required=False)
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), required=False
    )

    class Meta:
        model = UserWish
        fields = [
            "id",
            "source_template_id",
            "category",
            "title",
            "description",
            "estimated_budget",
            "target_date",
            "priority",
            "is_public",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        source_template_id = attrs.get("source_template_id")

        if source_template_id:
            try:
                template = WishTemplate.objects.get(
                    id=source_template_id, is_published=True
                )
            except WishTemplate.DoesNotExist:
                raise serializers.ValidationError(
                    {"source_template_id": "This wish template does not exist."}
                )
            attrs["_template"] = template
        else:
            if not attrs.get("title") or not attrs.get("category"):
                raise serializers.ValidationError(
                    "Either source_template_id, or both title and category, are required."
                )

        return attrs

    def create(self, validated_data):
        validated_data.pop("source_template_id", None)
        template = validated_data.pop("_template", None)
        user = self.context["request"].user

        if template:
            wish = UserWish.objects.create(
                user=user,
                source_template=template,
                category=template.category,
                title=template.title,
                description=template.description,
                estimated_budget=template.estimated_budget_max,
                cover_image=template.cover_image if template.cover_image else None,
            )
        else:
            wish = UserWish.objects.create(user=user, **validated_data)

        return wish