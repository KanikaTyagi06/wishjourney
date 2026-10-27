from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class PublicUserSerializer(serializers.ModelSerializer):
    """
    Safe, public view of a user for search results and friend lists.
    Never exposes email or any private data.

    Expects an optional `relations` dict in the serializer context:
        { user_uuid: (friendship_status, request_id) }
    Users missing from that dict get friendship_status = "none".
    """

    full_name = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    friendship_status = serializers.SerializerMethodField()
    request_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "gender",
            "bio",
            "city",
            "country",
            "profile_picture",
            "friendship_status",
            "request_id",
        ]

    def _profile(self, obj):
        return getattr(obj, "profile", None)

    def get_full_name(self, obj):
        profile = self._profile(obj)
        return profile.full_name if profile else ""

    def get_gender(self, obj):
        profile = self._profile(obj)
        return profile.gender if profile else ""

    def get_bio(self, obj):
        profile = self._profile(obj)
        return profile.bio if profile else ""

    def get_city(self, obj):
        profile = self._profile(obj)
        return profile.city if profile else ""

    def get_country(self, obj):
        profile = self._profile(obj)
        return profile.country if profile else ""

    def get_profile_picture(self, obj):
        profile = self._profile(obj)
        if not profile or not profile.profile_picture:
            return None
        url = profile.profile_picture.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    def _relation(self, obj):
        relations = self.context.get("relations") or {}
        return relations.get(obj.id, ("none", None))

    def get_friendship_status(self, obj):
        return self._relation(obj)[0]

    def get_request_id(self, obj):
        request_id = self._relation(obj)[1]
        return str(request_id) if request_id else None