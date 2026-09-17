from django.urls import path

from .views import (
    MemoryListCreateView,
    MemoryDetailView,
    MemoryPhotoUploadView,
    MemoryPhotoDeleteView,
)

urlpatterns = [
    path("", MemoryListCreateView.as_view(), name="memory_list_create"),
    path("<uuid:pk>/", MemoryDetailView.as_view(), name="memory_detail"),
    path(
        "<uuid:pk>/photos/",
        MemoryPhotoUploadView.as_view(),
        name="memory_photo_upload",
    ),
    path(
        "photos/<uuid:photo_id>/",
        MemoryPhotoDeleteView.as_view(),
        name="memory_photo_delete",
    ),
]