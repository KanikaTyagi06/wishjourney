from rest_framework import generics, permissions

from .models import UserProfile
from .serializers import UserProfileSerializer


class MyProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/v1/profiles/me/   → view the logged-in user's profile
    PATCH /api/v1/profiles/me/   → partially update the logged-in user's profile
    PUT   /api/v1/profiles/me/   → fully update the logged-in user's profile

    Only accessible to authenticated users, and always operates on the
    requesting user's own profile — there's no way to view or edit
    someone else's profile through this endpoint.
    """

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

from .serializers import OnboardingSerializer


class OnboardingView(generics.UpdateAPIView):
    """
    PATCH /api/v1/profiles/onboarding/

    Accepts onboarding preferences (or an empty payload to skip) and
    marks the user's onboarding as completed. Always operates on the
    logged-in user's own profile.
    """

    serializer_class = OnboardingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile