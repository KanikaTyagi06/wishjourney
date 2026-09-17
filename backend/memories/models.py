import uuid
from django.conf import settings
from django.db import models


def memory_photo_upload_path(instance, filename):
    """
    Builds a unique file path for each memory photo, e.g.
    memory_photos/<memory_id>/<filename>, so photos from different
    memories never collide.
    """
    return f"memory_photos/{instance.memory.id}/{filename}"


class Memory(models.Model):
    """
    A memory is created once a user marks a wish as completed —
    it holds their story, rating, and lessons learned, plus any
    photos they attach. One memory per completed wish.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memories",
    )
    wish = models.OneToOneField(
        "wishes.UserWish",
        on_delete=models.CASCADE,
        related_name="memory",
        help_text="The completed wish this memory belongs to.",
    )
    story = models.TextField(blank=True)
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="Rating from 1 to 5 stars.",
    )
    lessons_learned = models.TextField(blank=True)
    advice = models.TextField(blank=True)
    is_public = models.BooleanField(
        default=False,
        help_text="Whether this memory is visible to other users.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "memories_memory"
        verbose_name = "Memory"
        verbose_name_plural = "Memories"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Memory for {self.wish.title} by {self.user.username}"


class MemoryPhoto(models.Model):
    """
    A single photo attached to a memory. A memory can have multiple
    photos, shown as a gallery.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    memory = models.ForeignKey(
        Memory,
        on_delete=models.CASCADE,
        related_name="photos",
    )
    image = models.ImageField(upload_to=memory_photo_upload_path)
    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "memories_memoryphoto"
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"Photo for {self.memory_id}"