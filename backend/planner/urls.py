from django.urls import path

from .views import PlanDetailView, PlanGenerateView

urlpatterns = [
    path("wishes/<uuid:wish_id>/", PlanDetailView.as_view(), name="planner_plan"),
    path(
        "wishes/<uuid:wish_id>/generate/",
        PlanGenerateView.as_view(),
        name="planner_generate",
    ),
]