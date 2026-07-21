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