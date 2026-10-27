import uuid

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FriendRequest
from .serializers import PublicUserSerializer

User = get_user_model()

SEARCH_MIN_LENGTH = 2
SEARCH_MAX_RESULTS = 20


def error_response(detail, code, http_status):
    """
    Consistent error shape. The frontend uses `code` to show a translated
    message, `detail` is only a readable English fallback.
    """
    return Response({"detail": detail, "code": code}, status=http_status)


def friendship_status_for(friend_request, me):
    """
    How a request looks from the point of view of `me`.
    """
    if friend_request.status == FriendRequest.Status.ACCEPTED:
        return "friends"
    if friend_request.status == FriendRequest.Status.PENDING:
        if friend_request.sender_id == me.id:
            return "request_sent"
        return "request_received"
    return "none"


def request_payload(friend_request, me):
    return {
        "id": str(friend_request.id),
        "status": friend_request.status,
        "friendship_status": friendship_status_for(friend_request, me),
    }


def build_relations(me, user_ids):
    """
    For the given user ids, work out how each one relates to `me`.

    Returns { user_uuid: (friendship_status, request_id) } using only
    pending/accepted requests, so rejected and cancelled count as "none".
    Done in ONE query for the whole list (no per-user queries).
    """
    relations = {}
    requests = FriendRequest.objects.filter(
        status__in=[FriendRequest.Status.PENDING, FriendRequest.Status.ACCEPTED]
    ).filter(
        Q(sender=me, receiver_id__in=user_ids)
        | Q(receiver=me, sender_id__in=user_ids)
    )

    for fr in requests:
        i_sent_it = fr.sender_id == me.id
        other_id = fr.receiver_id if i_sent_it else fr.sender_id

        if fr.status == FriendRequest.Status.ACCEPTED:
            relations[other_id] = ("friends", fr.id)
        elif i_sent_it:
            relations[other_id] = ("request_sent", fr.id)
        else:
            relations[other_id] = ("request_received", fr.id)

    return relations


class UserSearchView(APIView):
    """
    GET /api/v1/social/users/search/?q=<text>

    Finds other users with a public profile by username or full name.
    Returns at most 20 results, each with the friendship status relative
    to the logged-in user. Queries shorter than 2 characters return [].
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()

        if len(query) < SEARCH_MIN_LENGTH:
            return Response([])

        users = list(
            User.objects.filter(is_active=True, profile__is_public=True)
            .exclude(id=request.user.id)
            .filter(
                Q(username__icontains=query)
                | Q(profile__full_name__icontains=query)
            )
            .select_related("profile")
            .order_by("username")[:SEARCH_MAX_RESULTS]
        )

        relations = build_relations(request.user, [u.id for u in users])

        serializer = PublicUserSerializer(
            users,
            many=True,
            context={"request": request, "relations": relations},
        )
        return Response(serializer.data)


class SendFriendRequestView(APIView):
    """
    POST /api/v1/social/requests/    body: {"receiver_id": "<uuid>"}

    Rules (we keep at most ONE row per pair of users):
      - cannot send to yourself or to a missing/inactive/private user
      - already friends            -> 400 already_friends
      - you already sent a pending -> 400 request_already_sent
      - they already sent you one  -> auto-accept (200), you become friends
      - old rejected/cancelled row -> reused and set back to pending (201)
      - otherwise                  -> new pending request (201)
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        me = request.user

        try:
            receiver_id = uuid.UUID(str(request.data.get("receiver_id")))
        except (ValueError, TypeError):
            return error_response(
                "A valid receiver_id is required.",
                "invalid_receiver",
                status.HTTP_400_BAD_REQUEST,
            )

        if receiver_id == me.id:
            return error_response(
                "You cannot send a friend request to yourself.",
                "cannot_friend_self",
                status.HTTP_400_BAD_REQUEST,
            )

        receiver = User.objects.filter(
            id=receiver_id, is_active=True, profile__is_public=True
        ).first()
        if receiver is None:
            return error_response(
                "User not found.",
                "user_not_found",
                status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            existing = (
                FriendRequest.objects.select_for_update()
                .between(me, receiver)
                .first()
            )

            if existing is None:
                created = FriendRequest.objects.create(sender=me, receiver=receiver)
                return Response(
                    request_payload(created, me), status=status.HTTP_201_CREATED
                )

            if existing.status == FriendRequest.Status.ACCEPTED:
                return error_response(
                    "You are already friends.",
                    "already_friends",
                    status.HTTP_400_BAD_REQUEST,
                )

            if existing.status == FriendRequest.Status.PENDING:
                if existing.sender_id == me.id:
                    return error_response(
                        "You already sent a request to this user.",
                        "request_already_sent",
                        status.HTTP_400_BAD_REQUEST,
                    )
                # They already asked us: sending one back means "yes".
                existing.status = FriendRequest.Status.ACCEPTED
                existing.save(update_fields=["status", "updated_at"])
                return Response(
                    request_payload(existing, me), status=status.HTTP_200_OK
                )

            # Rejected or cancelled before: reuse the same row.
            existing.sender = me
            existing.receiver = receiver
            existing.status = FriendRequest.Status.PENDING
            existing.save(update_fields=["sender", "receiver", "status", "updated_at"])
            return Response(
                request_payload(existing, me), status=status.HTTP_201_CREATED
            )


class _RequestActionView(APIView):
    """
    Base for accept / reject / cancel. Subclasses set:
      role       -> "receiver" or "sender" (who is allowed to do it)
      new_status -> the status to move a PENDING request to
    A request that is not yours (or does not exist) gives 404, so we never
    leak whether someone else's request id exists.
    """

    permission_classes = [permissions.IsAuthenticated]
    role = None
    new_status = None

    def post(self, request, pk):
        friend_request = FriendRequest.objects.filter(
            **{"id": pk, self.role: request.user}
        ).first()

        if friend_request is None:
            return error_response(
                "Friend request not found.",
                "request_not_found",
                status.HTTP_404_NOT_FOUND,
            )

        if friend_request.status != FriendRequest.Status.PENDING:
            return error_response(
                "This request is no longer pending.",
                "request_not_pending",
                status.HTTP_400_BAD_REQUEST,
            )

        friend_request.status = self.new_status
        friend_request.save(update_fields=["status", "updated_at"])
        return Response(request_payload(friend_request, request.user))


class AcceptFriendRequestView(_RequestActionView):
    """POST /api/v1/social/requests/<id>/accept/  (receiver only)"""

    role = "receiver"
    new_status = FriendRequest.Status.ACCEPTED


class RejectFriendRequestView(_RequestActionView):
    """POST /api/v1/social/requests/<id>/reject/  (receiver only)"""

    role = "receiver"
    new_status = FriendRequest.Status.REJECTED


class CancelFriendRequestView(_RequestActionView):
    """POST /api/v1/social/requests/<id>/cancel/  (sender only)"""

    role = "sender"
    new_status = FriendRequest.Status.CANCELLED


class RemoveFriendView(APIView):
    """
    DELETE /api/v1/social/friends/<user_id>/

    Removes the friendship with that user. The accepted row is deleted, so
    either of you can send a fresh request later.
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, user_id):
        friendship = (
            FriendRequest.objects.friends_of(request.user)
            .filter(Q(sender_id=user_id) | Q(receiver_id=user_id))
            .first()
        )

        if friendship is None:
            return error_response(
                "Friendship not found.",
                "friendship_not_found",
                status.HTTP_404_NOT_FOUND,
            )

        friendship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)