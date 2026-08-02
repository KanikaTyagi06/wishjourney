from django.urls import path

from .views import WishTemplateListView

urlpatterns = [
    path("", WishTemplateListView.as_view(), name="wish_template_list"),
]