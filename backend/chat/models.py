import uuid

from django.conf import settings
from django.db import models
from django.db.models import F, Q


class MessageQuerySet(models.QuerySet):
    def between(self, user_a, user_b):
        """
        Every message (in either direction) between two users.
        """
        return self.filter(
            Q(sender=user_a, receiver=user_b) | Q(sender=user_b, receiver=user_a)
        )


class Message(models.Model):
    """
    A single text message from one user to another.

    There is no separate "conversation" table: a conversation is simply all
    the messages between two users. Only people who are friends can send
    messages to each other (checked in the views).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages",
    )
    text = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the receiver opened the conversation and saw it.",
    )

    objects = MessageQuerySet.as_manager()

    class Meta:
        db_table = "chat_message"
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ["created_at"]
        constraints = [
            models.CheckConstraint(
                condition=~Q(sender=F("receiver")),
                name="message_no_self",
            ),
        ]
        indexes = [
            models.Index(
                fields=["sender", "receiver", "created_at"],
                name="msg_pair_created_idx",
            ),
            models.Index(
                fields=["receiver", "read_at"],
                name="msg_receiver_read_idx",
            ),
        ]

    def __str__(self):
        return f"{self.sender} -> {self.receiver}: {self.text[:30]}"