import logging
import os

from ..schema import PlanRequest, ProviderError, normalize_plan
from . import mock

logger = logging.getLogger(__name__)


def generate_plan(request: PlanRequest) -> tuple[dict, str, bool]:
    """
    Builds a plan with the provider chosen in .env (PLANNER_PROVIDER =
    "mock" or "anthropic"; default "mock").

    Returns (plan, provider_used, used_fallback). If the real provider
    fails for any reason (no key, no internet, bad answer) we quietly fall
    back to the offline mock, so the planner never breaks in a demo.
    """
    name = os.getenv("PLANNER_PROVIDER", "mock").strip().lower()

    if name == "anthropic":
        try:
            from . import anthropic_provider

            raw = anthropic_provider.generate(request)
            return normalize_plan(raw), "anthropic", False
        except (ProviderError, ValueError) as exc:
            logger.warning("Planner provider failed, using the mock instead: %s", exc)
            return normalize_plan(mock.generate(request)), "mock", True

    return normalize_plan(mock.generate(request)), "mock", False