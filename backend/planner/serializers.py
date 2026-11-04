from rest_framework import serializers

from .models import WishPlan
from .schema import LANGUAGES, STYLES


class PlanInputSerializer(serializers.Serializer):
    """
    What the person can tell the planner. Everything is optional: missing
    values are filled from the wish itself (budget, target date).
    """

    budget = serializers.IntegerField(
        required=False, allow_null=True, min_value=0, max_value=100_000_000
    )
    days = serializers.IntegerField(
        required=False, allow_null=True, min_value=1, max_value=3650
    )
    people = serializers.IntegerField(required=False, min_value=1, max_value=50, default=1)
    style = serializers.ChoiceField(choices=STYLES, required=False, default="balanced")
    notes = serializers.CharField(
        required=False, allow_blank=True, max_length=500, default=""
    )
    language = serializers.ChoiceField(choices=LANGUAGES, required=False, default="en")


class WishPlanSerializer(serializers.ModelSerializer):
    wish = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = WishPlan
        fields = [
            "id",
            "wish",
            "inputs",
            "content",
            "checked",
            "provider",
            "language",
            "generated_at",
            "updated_at",
        ]
        read_only_fields = fields