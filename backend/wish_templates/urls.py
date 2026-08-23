from django.urls import path

from .views import WishTemplateListView, WishTemplateDetailView

urlpatterns = [
    path("", WishTemplateListView.as_view(), name="wish_template_list"),
    path("<uuid:pk>/", WishTemplateDetailView.as_view(), name="wish_template_detail"),
]