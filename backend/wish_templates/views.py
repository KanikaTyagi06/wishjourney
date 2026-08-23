from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend

from .models import WishTemplate
from .serializers import WishTemplateSerializer, WishTemplateWriteSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Anyone can read (list/retrieve) published templates.
    Only staff/admin users can create, update, or delete templates.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )


class WishTemplateListView(generics.ListCreateAPIView):
    """
    GET  /api/v1/wish-templates/                 -> public, published templates only
    GET  /api/v1/wish-templates/?category=<id>    -> filter by category
    POST /api/v1/wish-templates/                  -> staff/admin only, create new template
    """

    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category"]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            return WishTemplate.objects.all()
        return WishTemplate.objects.filter(is_published=True)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return WishTemplateWriteSerializer
        return WishTemplateSerializer


class WishTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/wish-templates/<id>/   -> view a single template
    PATCH  /api/v1/wish-templates/<id>/   -> staff/admin only, edit
    DELETE /api/v1/wish-templates/<id>/   -> staff/admin only, delete
    """

    queryset = WishTemplate.objects.all()
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return WishTemplateWriteSerializer
        return WishTemplateSerializer