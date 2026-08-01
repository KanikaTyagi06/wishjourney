from django.shortcuts import render

from rest_framework import generics, permissions

from .models import Category
from .serializers import CategorySerializer


class CategoryListView(generics.ListAPIView):
    """
    GET /api/v1/categories/

    Returns all active categories, ordered for display. Public endpoint —
    no login required, since categories are shown before users sign up too.
    """

    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = Category.objects.filter(is_active=True)


