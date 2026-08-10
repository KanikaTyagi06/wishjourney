"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import Stars from "@/components/Stars";
import WishJourneyMark from "@/components/WishJourneyMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  code: string;
  name: string;
}

const BUDGET_OPTIONS = ["low", "medium", "high"] as const;
const GROUP_OPTIONS = ["solo", "couple", "friends", "family"] as const;
const SCOPE_OPTIONS = ["local", "national", "international"] as const;

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("onboarding");

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [interests, setInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [group, setGroup] = useState("");
  const [scope, setScope] = useState("");
  const [city, setCity] = useState("");

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    api
      .get("/categories/", { headers: authHeader() })
      .then((res) => setCategories(res.data))
      .finally(() => setLoadingCategories(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleInterest(code: string) {
    setInterests((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function submitOnboarding(skip: boolean) {
    setSubmitting(true);
    setError("");
    try {
      const payload = skip
        ? {}
        : {
            interests,
            wish_type_preference: interests,
            budget_preference: budget || undefined,
            group_preference: group || undefined,
            experience_scope_preference: scope || undefined,
            city: city || undefined,
            preferred_language: locale,
          };
      await api.patch("/profiles/onboarding/", payload, {
        headers: authHeader(),
      });
      router.push(`/${locale}/dashboard`);
    } catch {
      setError(t("submitError"));
      setSubmitting(false);
    }
  }

  function goNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      submitOnboarding(false);
    }
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden py-10">
      <Stars count={22} />

      <div className="absolute top-5 right-5 z-10">
        <button
          onClick={() => submitOnboarding(true)}
          disabled={submitting}
          className="text-xs text-nebula-ink-soft hover:text-nebula-ink transition-colors"
        >
          {t("skip")}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#171025" }}
          >
            <WishJourneyMark className="w-5 h-5" />
          </div>
        </div>

        <div className="flex gap-1.5 justify-center mb-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? "24px" : "8px",
                background:
                  i <= step ? "var(--nebula-magenta)" : "var(--nebula-line)",
              }}
            />
          ))}
        </div>
        <p className="text-center text-[11px] text-nebula-ink-soft font-semibold uppercase tracking-wide mb-8">
          {t("stepOf", { current: step + 1, total: TOTAL_STEPS })}
        </p>

        <div
          className="rounded-2xl p-6 border border-nebula-line"
          style={{ background: "var(--nebula-surface-2)" }}
        >
          {step === 0 && (
            <>
              <h2 className="font-heading text-xl font-bold text-nebula-ink mb-1 text-center">
                {t("interestsTitle")}
              </h2>
              <p className="text-xs text-nebula-ink-soft text-center mb-5">
                {t("interestsSubtitle")}
              </p>
              {loadingCategories ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 rounded-full border-2 border-nebula-magenta border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center">
                  {categories.map((cat) => {
                    const selected = interests.includes(cat.code);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleInterest(cat.code)}
                        className="text-xs font-semibold px-3.5 py-2 rounded-full transition-colors"
                        style={{
                          background: selected
                            ? "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))"
                            : "rgba(255,255,255,0.05)",
                          color: selected
                            ? "#1A0E24"
                            : "var(--nebula-ink-soft)",
                          border: selected
                            ? "none"
                            : "1px solid var(--nebula-line)",
                        }}
                      >
                        {selected && "✓ "}
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-heading text-xl font-bold text-nebula-ink mb-1 text-center">
                {t("budgetTitle")}
              </h2>
              <p className="text-xs text-nebula-ink-soft text-center mb-5">
                {t("budgetSubtitle")}
              </p>
              <div className="space-y-2.5">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBudget(opt)}
                    className="w-full text-left text-sm font-medium px-4 py-3 rounded-xl transition-colors"
                    style={{
                      background:
                        budget === opt
                          ? "var(--nebula-magenta-soft)"
                          : "rgba(255,255,255,0.05)",
                      color:
                        budget === opt
                          ? "var(--nebula-magenta)"
                          : "var(--nebula-ink)",
                      border:
                        budget === opt
                          ? "1.4px solid var(--nebula-magenta)"
                          : "1.4px solid var(--nebula-line)",
                    }}
                  >
                    {t(`budget_${opt}`)}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-heading text-xl font-bold text-nebula-ink mb-1 text-center">
                {t("groupTitle")}
              </h2>
              <p className="text-xs text-nebula-ink-soft text-center mb-5">
                {t("groupSubtitle")}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {GROUP_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setGroup(opt)}
                    className="text-sm font-medium px-4 py-4 rounded-xl transition-colors"
                    style={{
                      background:
                        group === opt
                          ? "var(--nebula-magenta-soft)"
                          : "rgba(255,255,255,0.05)",
                      color:
                        group === opt
                          ? "var(--nebula-magenta)"
                          : "var(--nebula-ink)",
                      border:
                        group === opt
                          ? "1.4px solid var(--nebula-magenta)"
                          : "1.4px solid var(--nebula-line)",
                    }}
                  >
                    {t(`group_${opt}`)}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-heading text-xl font-bold text-nebula-ink mb-1 text-center">
                {t("locationTitle")}
              </h2>
              <p className="text-xs text-nebula-ink-soft text-center mb-5">
                {t("locationSubtitle")}
              </p>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t("cityPlaceholder")}
                className="bg-white/5 border-nebula-line text-nebula-ink placeholder:text-nebula-ink-soft/60 rounded-xl mb-4 focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
              />
              <div className="space-y-2.5">
                {SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setScope(opt)}
                    className="w-full text-left text-sm font-medium px-4 py-3 rounded-xl transition-colors"
                    style={{
                      background:
                        scope === opt
                          ? "var(--nebula-magenta-soft)"
                          : "rgba(255,255,255,0.05)",
                      color:
                        scope === opt
                          ? "var(--nebula-magenta)"
                          : "var(--nebula-ink)",
                      border:
                        scope === opt
                          ? "1.4px solid var(--nebula-magenta)"
                          : "1.4px solid var(--nebula-line)",
                    }}
                  >
                    {t(`scope_${opt}`)}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2 mt-4">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goBack}
              disabled={step === 0}
              className="text-xs font-semibold text-nebula-ink-soft hover:text-nebula-ink transition-colors disabled:opacity-0"
            >
              {t("back")}
            </button>
            <Button
              onClick={goNext}
              disabled={submitting}
              className="rounded-xl px-6 py-4 text-sm font-bold border-0 text-[#1A0E24] disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                boxShadow: "0 8px 22px -8px rgba(224, 64, 158, 0.5)",
              }}
            >
              {submitting
                ? t("saving")
                : step === TOTAL_STEPS - 1
                  ? t("finish")
                  : t("continue")}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}