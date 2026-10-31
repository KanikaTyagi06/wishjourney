import uuid

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from wishes.models import UserWish

from .models import FriendRequest
from .serializers import PublicUserSerializer

User = get_user_model()

SEARCH_MIN_LENGTH = 2
SEARCH_MAX_RESULTS = 20
SUGGESTION_POOL = 200
SUGGESTION_COUNT = 5


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


def other_user(friend_request, me):
    """
    The user on the other side of a request, from the point of view of `me`.
    """
    if friend_request.sender_id == me.id:
        return friend_request.receiver
    return friend_request.sender


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


def _city_of(user):
    profile = getattr(user, "profile", None)
    return (profile.city if profile else "").strip().lower()


def build_extras(me, users, friends_since=None):
    """
    For the given users, work out how they relate to `me`:
      mutual_friends   - friends we both have
      wishes_in_common - wish templates we both added to our bucket lists
                         (only a COUNT, never titles)
      same_city        - same city, ignoring capitals
      friends_since    - when the friendship started (if known)

    Uses a fixed number of queries no matter how many users are listed.
    Returns { user_uuid: {...} }.
    """
    user_ids = [u.id for u in users]
    if not user_ids:
        return {}

    my_friend_ids = FriendRequest.objects.friend_ids_of(me)

    # Friends of every listed user, in one query.
    their_friends = {uid: set() for uid in user_ids}
    rows = FriendRequest.objects.filter(
        status=FriendRequest.Status.ACCEPTED
    ).filter(
        Q(sender_id__in=user_ids) | Q(receiver_id__in=user_ids)
    ).values_list("sender_id", "receiver_id")
    for sender_id, receiver_id in rows:
        if sender_id in their_friends:
            their_friends[sender_id].add(receiver_id)
        if receiver_id in their_friends:
            their_friends[receiver_id].add(sender_id)

    # Wish templates in common, in two queries.
    my_templates = set(
        UserWish.objects.filter(
            user=me, source_template__isnull=False
        ).values_list("source_template_id", flat=True)
    )
    common_templates = {uid: set() for uid in user_ids}
    if my_templates:
        rows = UserWish.objects.filter(
            user_id__in=user_ids, source_template_id__in=my_templates
        ).values_list("user_id", "source_template_id")
        for user_id, template_id in rows:
            common_templates[user_id].add(template_id)

    my_city = _city_of(me)
    friends_since = friends_since or {}

    extras = {}
    for user in users:
        city = _city_of(user)
        extras[user.id] = {
            "mutual_friends": len(their_friends[user.id] & my_friend_ids),
            "wishes_in_common": len(common_templates[user.id]),
            "same_city": bool(my_city) and city == my_city,
            "friends_since": friends_since.get(user.id),
        }
    return extras


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


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
        extras = build_extras(request.user, users)

        serializer = PublicUserSerializer(
            users,
            many=True,
            context={"request": request, "relations": relations, "extras": extras},
        )
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Send / accept / reject / cancel / remove
# ---------------------------------------------------------------------------


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


class FriendsView(APIView):
    """
    GET /api/v1/social/friends/   -> list of my friends (sorted by username)

    Each friend also carries mutual_friends, wishes_in_common, same_city
    and friends_since.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        me = request.user

        friendships = (
            FriendRequest.objects.friends_of(me)
            .select_related("sender__profile", "receiver__profile")
        )

        users = []
        relations = {}
        since = {}
        for friendship in friendships:
            user = other_user(friendship, me)
            if not user.is_active:
                continue
            users.append(user)
            relations[user.id] = ("friends", friendship.id)
            since[user.id] = friendship.updated_at

        users.sort(key=lambda u: u.username.lower())
        extras = build_extras(me, users, friends_since=since)

        serializer = PublicUserSerializer(
            users,
            many=True,
            context={"request": request, "relations": relations, "extras": extras},
        )
        return Response(serializer.data)


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


# ---------------------------------------------------------------------------
# Pending request lists + summary counts
# ---------------------------------------------------------------------------


class _PendingRequestListView(APIView):
    """
    Base for the incoming / outgoing lists. Each item looks like:
        { "id": <request id>, "created_at": ..., "user": {public user} }
    `user` is the person on the OTHER side of the request.
    """

    permission_classes = [permissions.IsAuthenticated]
    incoming = True  # True: requests sent to me. False: requests I sent.

    def get(self, request):
        me = request.user

        if self.incoming:
            queryset = FriendRequest.objects.filter(
                receiver=me,
                status=FriendRequest.Status.PENDING,
                sender__is_active=True,
            ).select_related("sender__profile")
            relation_name = "request_received"
        else:
            queryset = FriendRequest.objects.filter(
                sender=me,
                status=FriendRequest.Status.PENDING,
                receiver__is_active=True,
            ).select_related("receiver__profile")
            relation_name = "request_sent"

        friend_requests = list(queryset)  # newest first (model ordering)

        users = [other_user(fr, me) for fr in friend_requests]
        relations = {
            other_user(fr, me).id: (relation_name, fr.id) for fr in friend_requests
        }
        extras = build_extras(me, users)

        serialized_users = PublicUserSerializer(
            users,
            many=True,
            context={"request": request, "relations": relations, "extras": extras},
        ).data

        items = [
            {
                "id": str(fr.id),
                "created_at": fr.created_at,
                "user": serialized_user,
            }
            for fr, serialized_user in zip(friend_requests, serialized_users)
        ]
        return Response(items)


class IncomingRequestsView(_PendingRequestListView):
    """GET /api/v1/social/requests/incoming/"""

    incoming = True


class OutgoingRequestsView(_PendingRequestListView):
    """GET /api/v1/social/requests/outgoing/"""

    incoming = False


class SocialSummaryView(APIView):
    """
    GET /api/v1/social/summary/

    Small counts used for tab badges on /friends and the Friends counter
    on the profile page:
        { "friends": 3, "incoming": 1, "outgoing": 2 }
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        me = request.user

        friends_count = (
            FriendRequest.objects.friends_of(me)
            .filter(
                Q(sender=me, receiver__is_active=True)
                | Q(receiver=me, sender__is_active=True)
            )
            .count()
        )
        incoming_count = FriendRequest.objects.filter(
            receiver=me,
            status=FriendRequest.Status.PENDING,
            sender__is_active=True,
        ).count()
        outgoing_count = FriendRequest.objects.filter(
            sender=me,
            status=FriendRequest.Status.PENDING,
            receiver__is_active=True,
        ).count()

        return Response(
            {
                "friends": friends_count,
                "incoming": incoming_count,
                "outgoing": outgoing_count,
            }
        )


# ---------------------------------------------------------------------------
# People you may know
# ---------------------------------------------------------------------------


class SuggestionsView(APIView):
    """
    GET /api/v1/social/suggestions/

    Up to 5 public users the person is not yet connected to (no pending or
    accepted request either way), ranked by:
        mutual friends x 3  +  wishes in common x 2  +  same city x 1
    Users with no signal at all only fill empty slots at the end.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        me = request.user

        connected_ids = set()
        rows = FriendRequest.objects.filter(
            status__in=[FriendRequest.Status.PENDING, FriendRequest.Status.ACCEPTED]
        ).filter(Q(sender=me) | Q(receiver=me)).values_list(
            "sender_id", "receiver_id"
        )
        for sender_id, receiver_id in rows:
            connected_ids.add(receiver_id if sender_id == me.id else sender_id)

        candidates = list(
            User.objects.filter(is_active=True, profile__is_public=True)
            .exclude(id=me.id)
            .exclude(id__in=connected_ids)
            .select_related("profile")
            .order_by("username")[:SUGGESTION_POOL]
        )

        extras = build_extras(me, candidates)

        def score(user):
            e = extras[user.id]
            return (
                e["mutual_friends"] * 3
                + e["wishes_in_common"] * 2
                + (1 if e["same_city"] else 0)
            )

        candidates.sort(key=lambda u: (-score(u), u.username.lower()))
        picked = candidates[:SUGGESTION_COUNT]

        relations = {u.id: ("none", None) for u in picked}
        serializer = PublicUserSerializer(
            picked,
            many=True,
            context={"request": request, "relations": relations, "extras": extras},
        )
        return Response(serializer.data)