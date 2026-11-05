"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import PlanForm from "@/components/planner/PlanForm";
import PlanView from "@/components/planner/PlanView";
import { PlanFormValues, WishPlan } from "@/components/planner/types";
import { CARD_BG, CARD_CLASS } from "@/components/friends/shared";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

interface WishSummary {
  id: string;
  title: string;
  status: string;
  category: { id: string; name: string } | null;
  estimated_budget: number | null;
  target_date: string | null;
}

/** Days from today until the wish's target date (empty when there is none). */
function daysUntil(targetDate: string | null): string {
  if (!targetDate) return "";
  const target = new Date(`${targetDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  return days >= 1 ? String(Math.min(days, 3650)) : "";
}

export default function WishPlanPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const wishId = params.id as string;
  const t = useTranslations("planner");

  const [wish, setWish] = useState<WishSummary | null>(null);
  const [plan, setPlan] = useState<WishPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false); // the "adjust" form when a plan exists
  const [error, setError] = useState("");
  const [fallbackNote, setFallbackNote] = useState(false);

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const wishRes = await api.get(`/wishes/${wishId}/`, {
        headers: authHeader(),
      });
      setWish(wishRes.data);

      try {
        const planRes = await api.get(`/planner/wishes/${wishId}/`, {
          headers: authHeader(),
        });
        setPlan(planRes.data);
      } catch (err: any) {
        // "no plan yet" is a normal state, anything else is a real error
        if (err?.response?.data?.code !== "plan_not_found") throw err;
        setPlan(null);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      if (err?.response?.status === 404) {
        router.push(`/${locale}/bucket-list`);
        return;
      }
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    if (!wishId || wishId === "undefined") {
      router.push(`/${locale}/bucket-list`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishId]);

  async function generate(values: PlanFormValues) {
    const budget = values.budget.trim() === "" ? null : Number(values.budget);
    const days = values.days.trim() === "" ? null : Number(values.days);
    const people = Number(values.people);

    const valid =
      (budget === null || (Number.isFinite(budget) && budget >= 0)) &&
      (days === null || (Number.isInteger(days) && days >= 1 && days <= 3650)) &&
      Number.isInteger(people) &&
      people >= 1 &&
      people <= 50;
    if (!valid) {
      setError(t("invalidInput"));
      return;
    }

    setError("");
    setFallbackNote(false);
    setGenerating(true);
    try {
      const res = await api.post(
        `/planner/wishes/${wishId}/generate/`,
        {
          budget,
          days,
          people,
          style: values.style,
          notes: values.notes.trim(),
          language: locale === "hi" ? "hi" : "en",
        },
        { headers: authHeader() },
      );
      setPlan(res.data);
      setFallbackNote(Boolean(res.data.fallback));
      setShowForm(false);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      const code = err?.response?.data?.code;
      if (code === "too_fast") {
        setError(t("tooFast"));
      } else if (err?.response?.status === 400) {
        setError(t("invalidInput"));
      } else {
        setError(t("generateError"));
      }
    } finally {
      setGenerating(false);
    }
  }

  // tick / untick a checklist item: update the screen at once, then save
  async function toggleItem(index: number) {
    if (!plan) return;
    const previous = plan.checked;
    const next = previous.includes(index)
      ? previous.filter((i) => i !== index)
      : [...previous, index].sort((a, b) => a - b);
    setPlan({ ...plan, checked: next });

    try {
      await api.patch(
        `/planner/wishes/${wishId}/`,
        { checked: next },
        { headers: authHeader() },
      );
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      setPlan((current) => (current ? { ...current, checked: previous } : current));
      setError(t("saveTickError"));
    }
  }

  // what the form starts with: the last plan's inputs, else the wish's own data
  function initialValues(): PlanFormValues {
    if (plan) {
      return {
        budget: plan.inputs.budget !== null ? String(plan.inputs.budget) : "",
        days: String(plan.inputs.days),
        people: String(plan.inputs.people),
        style: plan.inputs.style,
        notes: plan.inputs.notes || "",
      };
    }
    return {
      budget:
        wish?.estimated_budget !== null && wish?.estimated_budget !== undefined
          ? String(wish.estimated_budget)
          : "",
      days: daysUntil(wish?.target_date ?? null),
      people: "1",
      style: "balanced",
      notes: "",
    };
  }

  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={SOFT_BG}
      >
        <div className="w-6 h-6 rounded-full border-2 border-nebula-magenta border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <div className="min-h-screen relative" style={SOFT_BG}>
      <Stars count={10} className="opacity-40" />
      <AppNavbar />

      <main className="max-w-3xl mx-auto px-6 py-8 relative z-10">
        <a
          href={`/${locale}/bucket-list/${wishId}`}
          className="text-xs text-nebula-ink-soft hover:text-nebula-ink mb-4 inline-block transition-colors"
        >
          {t("backToWish")}
        </a>

        {loadError || !wish ? (
          <div className={`${CARD_CLASS} p-10 text-center`} style={CARD_BG}>
            <p className="text-sm text-[#FF5C6C] mb-3">{t("loadError")}</p>
            <button
              onClick={load}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <span className="text-xs text-nebula-magenta font-semibold">
                ✨ {t("pageTitle")}
                {wish.category?.name ? ` · ${wish.category.name}` : ""}
              </span>
              <h1 className="font-heading text-2xl font-bold text-nebula-ink mt-1">
                {wish.title}
              </h1>
            </div>

            {error && (
              <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2 mb-4">
                {error}
              </p>
            )}

            {generating ? (
              <div className={`${CARD_CLASS} p-12 text-center`} style={CARD_BG}>
                <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 border-nebula-magenta border-t-transparent animate-spin" />
                <p className="text-sm font-semibold text-nebula-ink mb-1">
                  {t("generatingTitle")}
                </p>
                <p className="text-xs text-nebula-ink-soft">
                  {t("generatingText")}
                </p>
              </div>
            ) : plan === null ? (
              <div className={`${CARD_CLASS} p-6`} style={CARD_BG}>
                <h2 className="font-heading text-lg font-bold text-nebula-ink mb-1">
                  {t("introTitle")}
                </h2>
                <p className="text-sm text-nebula-ink-soft mb-5">
                  {t("introText")}
                </p>
                <PlanForm
                  initial={initialValues()}
                  submitLabel={t("generate")}
                  disabled={generating}
                  onSubmit={generate}
                />
              </div>
            ) : (
              <>
                {fallbackNote && (
                  <p className="text-xs text-nebula-ink-soft bg-white/5 border border-nebula-line rounded-xl px-3 py-2 mb-4">
                    {t("fallbackNote")}
                  </p>
                )}

                <PlanView plan={plan} locale={locale} onToggle={toggleItem} />

                <div className={`${CARD_CLASS} p-5 mt-5`} style={CARD_BG}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-sm font-bold text-nebula-ink">
                        {t("adjustTitle")}
                      </h2>
                      <p className="text-xs text-nebula-ink-soft mt-0.5">
                        {t("adjustHint")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForm((v) => !v)}
                      className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
                    >
                      {showForm ? t("hideForm") : t("showForm")}
                    </button>
                  </div>

                  {showForm && (
                    <div className="mt-5 pt-5 border-t border-nebula-line">
                      <PlanForm
                        initial={initialValues()}
                        submitLabel={t("regenerate")}
                        disabled={generating}
                        onSubmit={generate}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}