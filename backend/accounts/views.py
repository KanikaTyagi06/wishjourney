from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer


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
        return Response(
            {
                "message": "Account created successfully.",
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
