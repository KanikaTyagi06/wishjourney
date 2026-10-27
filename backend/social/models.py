import uuid

from django.conf import settings
from django.db import models
from django.db.models import F, Q


class FriendRequestQuerySet(models.QuerySet):
    """
    Reusable query helpers so the views stay small and readable.
    """

    def between(self, user_a, user_b):
        """
        Every request (in either direction) between two users.
        Used to detect reverse-pair duplicates before sending a request.
        """
        return self.filter(
            Q(sender=user_a, receiver=user_b) | Q(sender=user_b, receiver=user_a)
        )

    def friends_of(self, user):
        """
        Accepted requests that involve this user, in either direction.
        A friendship is mutual, so it does not matter who sent it.
        """
        return self.filter(status=FriendRequest.Status.ACCEPTED).filter(
            Q(sender=user) | Q(receiver=user)
        )

    def friend_ids_of(self, user):
        """
        Returns a set of user ids who are friends with `user`.
        """
        ids = set()
        for sender_id, receiver_id in self.friends_of(user).values_list(
            "sender_id", "receiver_id"
        ):
            ids.add(receiver_id if sender_id == user.id else sender_id)
        return ids


class FriendRequest(models.Model):
    """
    A mutual friend request between two users.

    There is no separate Friendship table: two users are friends when a
    request between them has status "accepted" (in either direction).
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_friend_requests",
        help_text="The user who sent the request.",
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_friend_requests",
        help_text="The user who received the request.",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = FriendRequestQuerySet.as_manager()

    class Meta:
        db_table = "social_friendrequest"
        verbose_name = "Friend Request"
        verbose_name_plural = "Friend Requests"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["sender", "receiver"],
                name="unique_friend_request_per_direction",
            ),
            models.CheckConstraint(
                condition=~Q(sender=F("receiver")),
                name="friend_request_no_self",
            ),
        ]
        indexes = [
            models.Index(fields=["receiver", "status"], name="fr_receiver_status_idx"),
            models.Index(fields=["sender", "status"], name="fr_sender_status_idx"),
        ]

    def __str__(self):
        return f"{self.sender} -> {self.receiver} ({self.status})"