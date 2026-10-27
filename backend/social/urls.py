from django.urls import path

from .views import (
    AcceptFriendRequestView,
    CancelFriendRequestView,
    RejectFriendRequestView,
    RemoveFriendView,
    SendFriendRequestView,
    UserSearchView,
)

urlpatterns = [
    path("users/search/", UserSearchView.as_view(), name="social_user_search"),
    path("requests/", SendFriendRequestView.as_view(), name="social_send_request"),
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
    path(
        "friends/<uuid:user_id>/",
        RemoveFriendView.as_view(),
        name="social_remove_friend",
    ),
]