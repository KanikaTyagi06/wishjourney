from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .utils import send_verification_email
from .serializers import RegisterSerializer
from .models import User
import uuid
from datetime import timedelta

from django.utils import timezone

from .serializers import ForgotPasswordSerializer, ResetPasswordSerializer
from .utils import send_password_reset_email


class RegisterView(generics.CreateAPIView):
    """
    POST /api/v1/auth/register/

    Allows any user (unauthenticated) to create a new account.
    Returns the created user's basic info (excluding password) on success.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_verification_email(user)
        return Response(
            {
                "message": "Account created. Please check your email to verify your account before logging in.",
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                },
            },
            status=201,
        )

from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import CustomTokenObtainPairSerializer

class LoginView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/

    Accepts username and password, returns access token, refresh token,
    and basic user info if credentials are valid.
    """

    serializer_class = CustomTokenObtainPairSerializer

from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import GoogleAuthSerializer


class GoogleAuthView(APIView):
    """
    POST /api/v1/auth/google/

    Accepts a Google ID token from the frontend, verifies it, and
    returns JWT access/refresh tokens for the corresponding user
    (creating a new account automatically if one doesn't exist yet).
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, created = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Account created and logged in." if created else "Logged in successfully.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                },
                "is_new_user": created,
            },
            status=200,
        )

class VerifyEmailView(APIView):
    """
    POST /api/v1/auth/verify-email/

    Accepts a verification token and activates the corresponding
    user's account if the token is valid.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"detail": "Token is required."}, status=400)

        try:
            user = User.objects.get(email_verification_token=token)
        except (User.DoesNotExist, ValueError):
            return Response({"detail": "Invalid or expired verification link."}, status=400)

        if user.is_active:
            return Response({"message": "Email already verified."}, status=200)

        user.is_active = True
        user.is_email_verified = True
        user.save()

        return Response({"message": "Email verified successfully. You can now log in."}, status=200)

class ForgotPasswordView(APIView):
    """
    POST /api/v1/auth/forgot-password/

    Triggers a password reset email if the email exists. Always
    returns a generic success message so we don't reveal which
    emails are registered on the platform.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email__iexact=email)
            user.password_reset_token = uuid.uuid4()
            user.password_reset_requested_at = timezone.now()
            user.save()
            send_password_reset_email(user)
        except User.DoesNotExist:
            pass

        return Response(
            {"message": "If an account with that email exists, a reset link has been sent."},
            status=200,
        )


class ResetPasswordView(APIView):
    """
    POST /api/v1/auth/reset-password/

    Accepts a reset token and new password. The token must be valid
    and requested within the last hour.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            user = User.objects.get(password_reset_token=token)
        except (User.DoesNotExist, ValueError):
            return Response({"detail": "Invalid or expired reset link."}, status=400)

        if not user.password_reset_requested_at:
            return Response({"detail": "Invalid or expired reset link."}, status=400)

        expiry_time = user.password_reset_requested_at + timedelta(hours=1)
        if timezone.now() > expiry_time:
            return Response({"detail": "This reset link has expired. Please request a new one."}, status=400)

        user.set_password(new_password)
        user.password_reset_token = uuid.uuid4()  # invalidate the used token
        user.password_reset_requested_at = None
        user.save()

        return Response({"message": "Password reset successfully. You can now log in."}, status=200)
