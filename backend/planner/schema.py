from dataclasses import dataclass

STYLES = ("budget", "balanced", "comfort")
LANGUAGES = ("en", "hi")
DIFFICULTIES = ("easy", "moderate", "challenging")

MAX_TIMELINE_STEPS = 12
MAX_BUDGET_ITEMS = 10
MAX_CHECKLIST_ITEMS = 15
MAX_TIPS = 8


class ProviderError(Exception):
    """A plan provider could not produce a usable plan."""


@dataclass
class PlanRequest:
    """
    Everything a provider needs to know to plan one wish. Providers never
    touch the database: they only receive this and return a plain dict.
    """

    title: str
    description: str
    category_name: str
    category_code: str
    budget: int | None  # total budget in rupees, None = let the provider estimate
    days: int  # how many days the person has
    people: int
    style: str  # "budget" | "balanced" | "comfort"
    notes: str
    language: str  # "en" | "hi"


def _text(value, limit: int) -> str:
    return str(value if value is not None else "").strip()[:limit]


def _whole_number(value, default: int = 0) -> int:
    try:
        return max(int(round(float(value))), 0)
    except (TypeError, ValueError):
        return default


def _list(value) -> list:
    return value if isinstance(value, list) else []


def normalize_plan(raw) -> dict:
    """
    Turns whatever a provider returned into the exact shape the frontend
    expects, trimming and coercing values. Raises ValueError when the plan
    is unusable (no roadmap steps at all).

    {
      "summary": str, "difficulty": "easy|moderate|challenging",
      "duration_label": str, "estimated_total": int, "budget_is_estimate": bool,
      "budget":    [{"label": str, "amount": int}],
      "timeline":  [{"when": str, "title": str, "detail": str}],
      "checklist": [str], "tips": [str]
    }
    """
    if not isinstance(raw, dict):
        raise ValueError("The plan must be a JSON object.")

    timeline = []
    for item in _list(raw.get("timeline")):
        if not isinstance(item, dict):
            continue
        title = _text(item.get("title"), 120)
        if not title:
            continue
        timeline.append(
            {
                "when": _text(item.get("when"), 40),
                "title": title,
                "detail": _text(item.get("detail"), 400),
            }
        )
        if len(timeline) == MAX_TIMELINE_STEPS:
            break
    if not timeline:
        raise ValueError("The plan has no roadmap steps.")

    budget = []
    for item in _list(raw.get("budget")):
        if not isinstance(item, dict):
            continue
        label = _text(item.get("label"), 60)
        if not label:
            continue
        budget.append({"label": label, "amount": _whole_number(item.get("amount"))})
        if len(budget) == MAX_BUDGET_ITEMS:
            break

    checklist = [t for t in (_text(x, 160) for x in _list(raw.get("checklist"))) if t]
    tips = [t for t in (_text(x, 220) for x in _list(raw.get("tips"))) if t]

    difficulty = _text(raw.get("difficulty"), 20).lower()
    if difficulty not in DIFFICULTIES:
        difficulty = "moderate"

    estimated_total = (
        sum(item["amount"] for item in budget)
        if budget
        else _whole_number(raw.get("estimated_total"))
    )

    return {
        "summary": _text(raw.get("summary"), 800),
        "difficulty": difficulty,
        "duration_label": _text(raw.get("duration_label"), 60),
        "estimated_total": estimated_total,
        "budget_is_estimate": bool(raw.get("budget_is_estimate", False)),
        "budget": budget,
        "timeline": timeline,
        "checklist": checklist[:MAX_CHECKLIST_ITEMS],
        "tips": tips[:MAX_TIPS],
    }