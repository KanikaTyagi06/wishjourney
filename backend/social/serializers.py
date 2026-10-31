from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class PublicUserSerializer(serializers.ModelSerializer):
    """
    Safe, public view of a user for search results and friend lists.
    Never exposes email or any private data.

    Optional serializer context:
        relations = { user_uuid: (friendship_status, request_id) }
        extras    = { user_uuid: {mutual_friends, wishes_in_common,
                                  same_city, friends_since} }
    Users missing from either dict get safe defaults.
    """

    full_name = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    friendship_status = serializers.SerializerMethodField()
    request_id = serializers.SerializerMethodField()
    mutual_friends = serializers.SerializerMethodField()
    wishes_in_common = serializers.SerializerMethodField()
    same_city = serializers.SerializerMethodField()
    friends_since = serializers.SerializerMethodField()

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
            "mutual_friends",
            "wishes_in_common",
            "same_city",
            "friends_since",
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

    def _extra(self, obj, key, default):
        extras = self.context.get("extras") or {}
        return extras.get(obj.id, {}).get(key, default)

    def get_mutual_friends(self, obj):
        return self._extra(obj, "mutual_friends", 0)

    def get_wishes_in_common(self, obj):
        return self._extra(obj, "wishes_in_common", 0)

    def get_same_city(self, obj):
        return self._extra(obj, "same_city", False)

    def get_friends_since(self, obj):
        value = self._extra(obj, "friends_since", None)
        return value.isoformat() if value else None