from django.urls import path

from .views import MyProfileView, OnboardingView

urlpatterns = [
    path("me/", MyProfileView.as_view(), name="my_profile"),
    path("onboarding/", OnboardingView.as_view(), name="onboarding"),
]