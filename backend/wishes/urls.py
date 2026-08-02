from django.urls import path

from .views import UserWishDetailView, UserWishListCreateView

urlpatterns = [
    path("", UserWishListCreateView.as_view(), name="user_wish_list_create"),
    path("<uuid:pk>/", UserWishDetailView.as_view(), name="user_wish_detail"),
]