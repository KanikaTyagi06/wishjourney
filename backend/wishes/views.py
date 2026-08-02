from django.shortcuts import render
from rest_framework import generics, permissions

from .models import UserWish
from .serializers import UserWishCreateSerializer, UserWishSerializer


class UserWishListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/wishes/   -> list the logged-in user's wishes
    POST /api/v1/wishes/   -> add a new wish (from a template or custom)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserWish.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserWishCreateSerializer
        return UserWishSerializer


class UserWishDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/wishes/<id>/   -> view a single wish
    PATCH  /api/v1/wishes/<id>/   -> update a wish (status, notes, etc.)
    DELETE /api/v1/wishes/<id>/   -> delete a wish

    Only accessible for wishes owned by the logged-in user.
    """

    serializer_class = UserWishSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserWish.objects.filter(user=self.request.user)
