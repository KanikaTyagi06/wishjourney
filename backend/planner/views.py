from datetime import date, timedelta

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from wishes.models import UserWish

from .models import WishPlan
from .providers import generate_plan
from .schema import PlanRequest
from .serializers import PlanInputSerializer, WishPlanSerializer

DEFAULT_DAYS = 90  # used when the wish has no usable target date
COOLDOWN_SECONDS = 5  # stops accidental double-clicks from hammering the AI


def error_response(detail, code, http_status):
    """
    Same error shape as the social and chat apps: the frontend uses `code`
    to show a translated message, `detail` is only an English fallback.
    """
    return Response({"detail": detail, "code": code}, status=http_status)


def get_own_wish(user, wish_id):
    return UserWish.objects.select_related("category").filter(id=wish_id, user=user).first()


def wish_not_found():
    return error_response("Wish not found.", "wish_not_found", status.HTTP_404_NOT_FOUND)


def build_plan_request(wish, data) -> PlanRequest:
    """Merge what the person typed with what we already know about the wish."""
    budget = data.get("budget")
    if budget is None:
        budget = wish.estimated_budget  # may still be None -> provider estimates

    days = data.get("days")
    if days is None:
        days = DEFAULT_DAYS
        if wish.target_date:
            remaining = (wish.target_date - date.today()).days
            if remaining >= 1:
                days = min(remaining, 3650)

    return PlanRequest(
        title=wish.title,
        description=wish.description or "",
        category_name=wish.category.name if wish.category else "",
        category_code=wish.category.code if wish.category else "",
        budget=budget,
        days=days,
        people=data.get("people", 1),
        style=data.get("style", "balanced"),
        notes=data.get("notes", ""),
        language=data.get("language", "en"),
    )


class PlanGenerateView(APIView):
    """
    POST /api/v1/planner/wishes/<wish_id>/generate/

    Body (all optional): {"budget": 50000, "days": 30, "people": 2,
                          "style": "budget|balanced|comfort", "notes": "...",
                          "language": "en|hi"}
    Creates the wish's plan, or replaces the existing one (and clears the
    ticked checklist). Returns the plan; `fallback` is true when the real AI
    could not be used and the offline planner wrote the plan instead.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, wish_id):
        wish = get_own_wish(request.user, wish_id)
        if wish is None:
            return wish_not_found()

        serializer = PlanInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        existing = WishPlan.objects.filter(wish=wish).first()
        if existing and timezone.now() - existing.generated_at < timedelta(
            seconds=COOLDOWN_SECONDS
        ):
            return error_response(
                "Please wait a few seconds before generating again.",
                "too_fast",
                status.HTTP_429_TOO_MANY_REQUESTS,
            )

        plan_request = build_plan_request(wish, data)
        content, provider, fallback = generate_plan(plan_request)

        plan, created = WishPlan.objects.update_or_create(
            wish=wish,
            defaults={
                "inputs": {
                    "budget": plan_request.budget,
                    "days": plan_request.days,
                    "people": plan_request.people,
                    "style": plan_request.style,
                    "notes": plan_request.notes,
                },
                "content": content,
                "checked": [],
                "provider": provider,
                "language": plan_request.language,
                "generated_at": timezone.now(),
            },
        )

        body = WishPlanSerializer(plan).data
        body["fallback"] = fallback
        return Response(
            body, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class PlanDetailView(APIView):
    """
    GET    /api/v1/planner/wishes/<wish_id>/   -> the saved plan (404 plan_not_found if none)
    PATCH  /api/v1/planner/wishes/<wish_id>/   -> {"checked": [0, 2]} saves ticked checklist items
    DELETE /api/v1/planner/wishes/<wish_id>/   -> removes the plan
    """

    permission_classes = [permissions.IsAuthenticated]

    def _get_plan(self, request, wish_id):
        wish = get_own_wish(request.user, wish_id)
        if wish is None:
            return None, wish_not_found()
        plan = WishPlan.objects.filter(wish=wish).first()
        if plan is None:
            return None, error_response(
                "This wish has no plan yet.", "plan_not_found", status.HTTP_404_NOT_FOUND
            )
        return plan, None

    def get(self, request, wish_id):
        plan, error = self._get_plan(request, wish_id)
        if error is not None:
            return error
        return Response(WishPlanSerializer(plan).data)

    def patch(self, request, wish_id):
        plan, error = self._get_plan(request, wish_id)
        if error is not None:
            return error

        checked = request.data.get("checked")
        item_count = len(plan.content.get("checklist", []))
        valid = (
            isinstance(checked, list)
            and all(isinstance(i, int) and not isinstance(i, bool) for i in checked)
            and all(0 <= i < item_count for i in checked)
        )
        if not valid:
            return error_response(
                "`checked` must be a list of checklist item numbers.",
                "invalid_checked",
                status.HTTP_400_BAD_REQUEST,
            )

        plan.checked = sorted(set(checked))
        plan.save(update_fields=["checked", "updated_at"])
        return Response(WishPlanSerializer(plan).data)

    def delete(self, request, wish_id):
        plan, error = self._get_plan(request, wish_id)
        if error is not None:
            return error
        plan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)