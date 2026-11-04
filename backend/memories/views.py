from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from social.models import FriendRequest

from .models import Memory, MemoryPhoto
from .serializers import (
    CommunityMemorySerializer,
    MemorySerializer,
    MemoryCreateUpdateSerializer,
    MemoryPhotoSerializer,
)

COMMUNITY_PAGE_SIZE = 10


class MemoryListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/memories/   -> list the logged-in user's memories
    POST /api/v1/memories/   -> create a memory for a completed wish
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Memory.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MemoryCreateUpdateSerializer
        return MemorySerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        memory = serializer.save()
        return Response(
            MemorySerializer(memory, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )


class CommunityFeedView(APIView):
    """
    GET /api/v1/memories/community/?scope=all|friends&page=1

    The Community feed: memories that people chose to share (is_public) and
    whose author also has a public profile and an active account. Newest
    first, 10 per page. `scope=friends` keeps only memories by the viewer's
    friends. The viewer's own public memories are included (is_me = true).

        { "results": [...], "has_more": true, "page": 1 }
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        me = request.user

        scope = request.query_params.get("scope", "all")
        try:
            page = max(int(request.query_params.get("page", 1)), 1)
        except (TypeError, ValueError):
            page = 1

        memories = (
            Memory.objects.filter(
                is_public=True,
                user__is_active=True,
                user__profile__is_public=True,
            )
            .select_related("user__profile", "wish__category")
            .prefetch_related("photos")
            .order_by("-created_at", "-id")
        )

        friend_ids = FriendRequest.objects.friend_ids_of(me)
        if scope == "friends":
            memories = memories.filter(user_id__in=friend_ids)

        # Fetch one extra row so we know whether another page exists.
        start = (page - 1) * COMMUNITY_PAGE_SIZE
        rows = list(memories[start : start + COMMUNITY_PAGE_SIZE + 1])
        has_more = len(rows) > COMMUNITY_PAGE_SIZE

        serializer = CommunityMemorySerializer(
            rows[:COMMUNITY_PAGE_SIZE],
            many=True,
            context={"request": request, "friend_ids": friend_ids},
        )
        return Response(
            {"results": serializer.data, "has_more": has_more, "page": page}
        )


class MemoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/memories/<id>/   -> view a single memory
    PATCH  /api/v1/memories/<id>/   -> edit story, rating, notes, privacy
    DELETE /api/v1/memories/<id>/   -> delete the memory
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Memory.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return MemoryCreateUpdateSerializer
        return MemorySerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        memory = serializer.save()
        return Response(
            MemorySerializer(memory, context=self.get_serializer_context()).data
        )


class MemoryPhotoUploadView(APIView):
    """
    POST /api/v1/memories/<id>/photos/   -> add a photo to a memory
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            memory = Memory.objects.get(id=pk, user=request.user)
        except Memory.DoesNotExist:
            return Response(
                {"detail": "Memory not found."}, status=status.HTTP_404_NOT_FOUND
            )

        image = request.data.get("image")
        if not image:
            return Response(
                {"detail": "No image provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        photo = MemoryPhoto.objects.create(
            memory=memory,
            image=image,
            caption=request.data.get("caption", ""),
            order=memory.photos.count(),
        )
        return Response(
            MemoryPhotoSerializer(photo, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MemoryPhotoDeleteView(APIView):
    """
    DELETE /api/v1/memories/photos/<photo_id>/   -> remove a single photo
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, photo_id):
        try:
            photo = MemoryPhoto.objects.get(
                id=photo_id, memory__user=request.user
            )
        except MemoryPhoto.DoesNotExist:
            return Response(
                {"detail": "Photo not found."}, status=status.HTTP_404_NOT_FOUND
            )
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)