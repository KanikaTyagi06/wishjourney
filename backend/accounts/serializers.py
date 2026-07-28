from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles validation and creation of a new user during registration.

    We accept a plain-text password from the client, validate it using
    Django's built-in password validators (checks for length, common
    passwords, etc.), and then hash it before saving using create_user().
    """

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        help_text="Must be at least 8 characters and not too common.",
    )
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "password_confirm"]
        read_only_fields = ["id"]

    def validate_email(self, value):
        """Ensure email is unique (case-insensitive check)."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Ensure username is unique (case-insensitive check)."""
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, attrs):
        """Ensure password and password_confirm match."""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        """
        Create the user using create_user() so that the password
        is properly hashed (never stored as plain text).
        """
        validated_data.pop("password_confirm")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user
    
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends the default JWT login serializer to also return basic
    user info (id, username, email) alongside the access/refresh tokens,
    so the frontend doesn't need a separate API call right after login.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": str(self.user.id),
            "username": self.user.username,
            "email": self.user.email,
        }
        return data

from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


class GoogleAuthSerializer(serializers.Serializer):
    """
    Accepts a Google ID token (obtained by the frontend after the user
    signs in with Google), verifies it against Google's servers, and
    either logs in an existing user or creates a new one.
    """

    id_token = serializers.CharField(write_only=True, required=True)

    def validate_id_token(self, value):
        """
        Verify the token with Google. This confirms the token is genuine,
        not expired, and was issued for our specific app (client ID).
        """
        try:
            idinfo = id_token.verify_oauth2_token(
                value,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            raise serializers.ValidationError("Invalid or expired Google token.")

        if idinfo.get("email_verified") is not True:
            raise serializers.ValidationError("Google account email is not verified.")

        return idinfo

    def save(self):
        """
        Look up the user by email. If found, log them in. If not found,
        create a new account using the info Google gave us.
        """
        idinfo = self.validated_data["id_token"]
        email = idinfo["email"]
        first_name = idinfo.get("given_name", "")

        user = User.objects.filter(email__iexact=email).first()
        created = False

        if user is None:
            user = User.objects.create_user(
                username=self._generate_unique_username(email),
                email=email,
                first_name=first_name,
            )
            user.set_unusable_password()
            user.save()
            created = True

        return user, created