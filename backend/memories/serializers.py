from rest_framework import serializers

from .models import Memory, MemoryPhoto


class MemoryPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemoryPhoto
        fields = ["id", "image", "caption", "order"]
        read_only_fields = ["id"]


class WishSummarySerializer(serializers.Serializer):
    """
    Small, read-only snapshot of the wish a memory belongs to —
    just enough to show it on a memory card without an extra API call.
    """

    id = serializers.UUIDField()
    title = serializers.CharField()
    category_name = serializers.CharField(source="category.name")
    completion_date = serializers.DateField()


class MemorySerializer(serializers.ModelSerializer):
    """
    Used for viewing memories. Includes nested wish summary and photos.
    """

    wish = WishSummarySerializer(read_only=True)
    photos = MemoryPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Memory
        fields = [
            "id",
            "wish",
            "story",
            "rating",
            "lessons_learned",
            "advice",
            "is_public",
            "photos",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class MemoryCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Used for creating or editing a memory. Accepts a wish_id on create;
    photos are uploaded separately via the photo endpoint.
    """

    wish_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Memory
        fields = [
            "id",
            "wish_id",
            "story",
            "rating",
            "lessons_learned",
            "advice",
            "is_public",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        from wishes.models import UserWish

        wish_id = validated_data.pop("wish_id", None)
        user = self.context["request"].user

        if not wish_id:
            raise serializers.ValidationError({"wish_id": "This field is required."})

        try:
            wish = UserWish.objects.get(id=wish_id, user=user)
        except UserWish.DoesNotExist:
            raise serializers.ValidationError({"wish_id": "Wish not found."})

        if wish.status != "completed":
            raise serializers.ValidationError(
                "Only completed wishes can have a memory."
            )

        if hasattr(wish, "memory"):
            raise serializers.ValidationError(
                "This wish already has a memory."
            )

        return Memory.objects.create(user=user, wish=wish, **validated_data)


class CommunityMemorySerializer(serializers.ModelSerializer):
    """
    A public memory as shown in the Community feed: the memory itself, a
    snapshot of its wish, its photos and a small public view of its author.

    Expects serializer context:
        request     - to build absolute photo / picture URLs
        friend_ids  - set of user ids who are friends with the viewer
    Never exposes the author's email, and never exposes private memories
    (the view only passes public ones in).
    """

    photos = MemoryPhotoSerializer(many=True, read_only=True)
    wish_title = serializers.CharField(source="wish.title", read_only=True)
    category_name = serializers.SerializerMethodField()
    completion_date = serializers.DateField(
        source="wish.completion_date", read_only=True
    )
    author = serializers.SerializerMethodField()

    class Meta:
        model = Memory
        fields = [
            "id",
            "wish_title",
            "category_name",
            "completion_date",
            "story",
            "rating",
            "lessons_learned",
            "advice",
            "photos",
            "created_at",
            "author",
        ]
        read_only_fields = fields

    def get_category_name(self, obj):
        category = getattr(obj.wish, "category", None)
        return category.name if category else ""

    def get_author(self, obj):
        user = obj.user
        profile = getattr(user, "profile", None)
        request = self.context.get("request")
        friend_ids = self.context.get("friend_ids") or set()

        picture = None
        if profile and profile.profile_picture:
            url = profile.profile_picture.url
            picture = request.build_absolute_uri(url) if request else url

        return {
            "id": str(user.id),
            "username": user.username,
            "full_name": profile.full_name if profile else "",
            "gender": profile.gender if profile else "",
            "profile_picture": picture,
            "is_friend": user.id in friend_ids,
            "is_me": bool(request) and user.id == request.user.id,
        }