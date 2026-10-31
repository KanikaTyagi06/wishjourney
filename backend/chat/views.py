from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from social.models import FriendRequest
from social.serializers import PublicUserSerializer

from .models import Message

User = get_user_model()

MESSAGE_MAX_LENGTH = 2000
THREAD_PAGE_SIZE = 100  # newest messages returned when a chat is first opened
POLL_PAGE_SIZE = 200  # most new messages returned in one poll
LAST_MESSAGE_SCAN = 3000  # newest messages scanned to find each last message


def error_response(detail, code, http_status):
    """
    Same error shape as the social app: the frontend uses `code` to show a
    translated message, `detail` is only a readable English fallback.
    """
    return Response({"detail": detail, "code": code}, status=http_status)


def are_friends(me, other_id):
    """
    True when `me` and the user `other_id` have an accepted friendship.
    """
    if other_id == me.id:
        return False
    return (
        FriendRequest.objects.friends_of(me)
        .filter(Q(sender_id=other_id) | Q(receiver_id=other_id))
        .exists()
    )


def message_payload(message, me):
    return {
        "id": str(message.id),
        "text": message.text,
        "created_at": message.created_at,
        "from_me": message.sender_id == me.id,
    }


def friend_users(me):
    """
    Active users who are friends with `me`.
    """
    friendships = FriendRequest.objects.friends_of(me).select_related(
        "sender__profile", "receiver__profile"
    )
    users = []
    for friendship in friendships:
        user = friendship.receiver if friendship.sender_id == me.id else friendship.sender
        if user.is_active:
            users.append(user)
    return users


def check_chat_partner(me, user_id):
    """
    Returns (error_response, None) when `me` may not chat with `user_id`,
    otherwise (None, other_user).
    """
    other = User.objects.filter(id=user_id, is_active=True).first()
    if other is None:
        return (
            error_response("User not found.", "user_not_found", status.HTTP_404_NOT_FOUND),
            None,
        )
    if not are_friends(me, other.id):
        return (
            error_response(
                "You can only chat with your friends.",
                "not_friends",
                status.HTTP_403_FORBIDDEN,
            ),
            None,
        )
    return None, other


class ConversationsView(APIView):
    """
    GET /api/v1/chat/conversations/

    One entry per friend, so a chat can be started with anyone. Friends with
    messages come first (most recent chat on top), the rest follow A-Z:
        { "user": {public user}, "last_message": {...} | null, "unread_count": 2 }
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        me = request.user
        friends = friend_users(me)
        friend_ids = [u.id for u in friends]

        # Newest message per friend. We scan newest-first and stop as soon as
        # every friend has one, so a busy chat history stays cheap.
        last_messages = {}
        if friend_ids:
            recent = Message.objects.filter(
                Q(sender=me, receiver_id__in=friend_ids)
                | Q(receiver=me, sender_id__in=friend_ids)
            ).order_by("-created_at")[:LAST_MESSAGE_SCAN]
            for message in recent:
                other_id = (
                    message.receiver_id if message.sender_id == me.id else message.sender_id
                )
                if other_id not in last_messages:
                    last_messages[other_id] = message
                    if len(last_messages) == len(friend_ids):
                        break

        unread = dict(
            Message.objects.filter(
                receiver=me, sender_id__in=friend_ids, read_at__isnull=True
            )
            .order_by()
            .values("sender_id")
            .annotate(total=Count("id"))
            .values_list("sender_id", "total")
        )

        def sort_key(user):
            message = last_messages.get(user.id)
            if message is not None:
                return (0, -message.created_at.timestamp(), "")
            return (1, 0, user.username.lower())

        friends.sort(key=sort_key)

        relations = {u.id: ("friends", None) for u in friends}
        serialized = PublicUserSerializer(
            friends,
            many=True,
            context={"request": request, "relations": relations},
        ).data

        items = []
        for user, user_data in zip(friends, serialized):
            message = last_messages.get(user.id)
            items.append(
                {
                    "user": user_data,
                    "last_message": message_payload(message, me) if message else None,
                    "unread_count": unread.get(user.id, 0),
                }
            )
        return Response(items)


class ThreadView(APIView):
    """
    GET  /api/v1/chat/messages/<user_id>/[?after=<ISO datetime>]
    POST /api/v1/chat/messages/<user_id>/   body: {"text": "hi"}

    GET without `after` returns the newest 100 messages (oldest first).
    GET with `after` returns only messages newer than that time, which is
    what the chat page polls for. Opening a chat marks the other person's
    messages as read. The reply also has `seen_until`: the time of the
    latest message of yours that the other person has seen (or null).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        me = request.user
        error, other = check_chat_partner(me, user_id)
        if error is not None:
            return error

        thread = Message.objects.between(me, other)
        after = request.query_params.get("after")

        if after:
            after_time = parse_datetime(after)
            if after_time is None:
                return error_response(
                    "`after` must be an ISO date-time.",
                    "invalid_after",
                    status.HTTP_400_BAD_REQUEST,
                )
            messages = list(
                thread.filter(created_at__gt=after_time).order_by("created_at")[
                    :POLL_PAGE_SIZE
                ]
            )
        else:
            messages = list(thread.order_by("-created_at")[:THREAD_PAGE_SIZE])
            messages.reverse()

        # The chat is open, so everything they sent me counts as read.
        Message.objects.filter(
            sender=other, receiver=me, read_at__isnull=True
        ).update(read_at=timezone.now())

        seen_until = (
            Message.objects.filter(sender=me, receiver=other, read_at__isnull=False)
            .order_by("-created_at")
            .values_list("created_at", flat=True)
            .first()
        )

        return Response(
            {
                "messages": [message_payload(m, me) for m in messages],
                "seen_until": seen_until,
            }
        )

    def post(self, request, user_id):
        me = request.user
        error, other = check_chat_partner(me, user_id)
        if error is not None:
            return error

        text = str(request.data.get("text", "")).strip()
        if not text:
            return error_response(
                "Message cannot be empty.",
                "empty_message",
                status.HTTP_400_BAD_REQUEST,
            )
        if len(text) > MESSAGE_MAX_LENGTH:
            return error_response(
                f"Message cannot be longer than {MESSAGE_MAX_LENGTH} characters.",
                "message_too_long",
                status.HTTP_400_BAD_REQUEST,
            )

        message = Message.objects.create(sender=me, receiver=other, text=text)
        return Response(message_payload(message, me), status=status.HTTP_201_CREATED)


class UnreadCountView(APIView):
    """
    GET /api/v1/chat/unread/   ->   { "unread": 3 }

    Total unread messages from current friends (used for the navbar badge).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        me = request.user
        friend_ids = FriendRequest.objects.friend_ids_of(me)
        total = Message.objects.filter(
            receiver=me, sender_id__in=friend_ids, read_at__isnull=True
        ).count()
        return Response({"unread": total})