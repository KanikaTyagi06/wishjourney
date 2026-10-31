from django.urls import path

from .views import ConversationsView, ThreadView, UnreadCountView

urlpatterns = [
    path("conversations/", ConversationsView.as_view(), name="chat_conversations"),
    path("messages/<uuid:user_id>/", ThreadView.as_view(), name="chat_thread"),
    path("unread/", UnreadCountView.as_view(), name="chat_unread"),
]