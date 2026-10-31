from django.urls import path

from .views import (
    AcceptFriendRequestView,
    CancelFriendRequestView,
    FriendsView,
    IncomingRequestsView,
    OutgoingRequestsView,
    RejectFriendRequestView,
    RemoveFriendView,
    SendFriendRequestView,
    SocialSummaryView,
    SuggestionsView,
    UserSearchView,
)

urlpatterns = [
    path("users/search/", UserSearchView.as_view(), name="social_user_search"),
    path("summary/", SocialSummaryView.as_view(), name="social_summary"),
    path("suggestions/", SuggestionsView.as_view(), name="social_suggestions"),
    path("friends/", FriendsView.as_view(), name="social_friends"),
    path(
        "friends/<uuid:user_id>/",
        RemoveFriendView.as_view(),
        name="social_remove_friend",
    ),
    path("requests/", SendFriendRequestView.as_view(), name="social_send_request"),
    path(
        "requests/incoming/",
        IncomingRequestsView.as_view(),
        name="social_incoming_requests",
    ),
    path(
        "requests/outgoing/",
        OutgoingRequestsView.as_view(),
        name="social_outgoing_requests",
    ),
    path(
        "requests/<uuid:pk>/accept/",
        AcceptFriendRequestView.as_view(),
        name="social_accept_request",
    ),
    path(
        "requests/<uuid:pk>/reject/",
        RejectFriendRequestView.as_view(),
        name="social_reject_request",
    ),
    path(
        "requests/<uuid:pk>/cancel/",
        CancelFriendRequestView.as_view(),
        name="social_cancel_request",
    ),
]