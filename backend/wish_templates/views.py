from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend

from .models import WishTemplate
from .serializers import WishTemplateSerializer


class WishTemplateListView(generics.ListAPIView):
    """
    GET /api/v1/wish-templates/
    GET /api/v1/wish-templates/?category=<category_id>

    Returns all published wish templates. Supports filtering by
    category. Public endpoint — no login required for browsing.
    """

    serializer_class = WishTemplateSerializer
    permission_classes = [permissions.AllowAny]
    queryset = WishTemplate.objects.filter(is_published=True)
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category"]