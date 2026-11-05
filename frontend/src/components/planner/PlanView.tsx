"use client";

import { useTranslations } from "next-intl";
import { CARD_BG, CARD_CLASS, GROUP_COLORS, Tag } from "@/components/friends/shared";
import { Difficulty, WishPlan } from "./types";

const BAR_COLORS = [...GROUP_COLORS.slice(0, 3), "#4ADE80", "#FFC24B"];

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: "#4ADE80",
  moderate: "#FFC24B",
  challenging: "#FF5C6C",
};

function money(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(value: string, locale: string): string {
  try {
    return new Date(value).toLocaleDateString(
      locale === "hi" ? "hi-IN" : "en-IN",
      { day: "numeric", month: "short", year: "numeric" },
    );
  } catch {
    return "";
  }
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-extrabold uppercase tracking-wide text-nebula-ink-soft mb-4">
      {children}
    </h2>
  );
}

interface PlanViewProps {
  plan: WishPlan;
  locale: string;
  onToggle: (index: number) => void;
}

export default function PlanView({ plan, locale, onToggle }: PlanViewProps) {
  const t = useTranslations("planner");
  const { content } = plan;

  const difficultyLabels: Record<Difficulty, string> = {
    easy: t("difficultyEasy"),
    moderate: t("difficultyModerate"),
    challenging: t("difficultyChallenging"),
  };

  const total = content.estimated_total || 1;
  const done = plan.checked.length;
  const checklistCount = content.checklist.length;
  const donePercent = checklistCount
    ? Math.round((done / checklistCount) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* overview */}
      <section className={`${CARD_CLASS} p-5`} style={CARD_BG}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h2 className="font-heading text-lg font-bold text-nebula-ink mr-auto">
            {t("planTitle")}
          </h2>
          <Tag tone={plan.provider === "anthropic" ? "magenta" : "blue"}>
            {plan.provider === "anthropic" ? t("providerAi") : t("providerMock")}
          </Tag>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{
              color: DIFFICULTY_COLOR[content.difficulty],
              background: `${DIFFICULTY_COLOR[content.difficulty]}22`,
            }}
          >
            {difficultyLabels[content.difficulty]}
          </span>
        </div>

        {content.summary && (
          <p className="text-sm text-nebula-ink leading-relaxed mb-4">
            {content.summary}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/5 px-3.5 py-3">
            <p className="text-[11px] text-nebula-ink-soft">{t("statDuration")}</p>
            <p className="font-heading text-sm font-bold text-nebula-ink mt-0.5">
              {content.duration_label || "-"}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-3.5 py-3">
            <p className="text-[11px] text-nebula-ink-soft">
              {content.budget_is_estimate ? t("budgetEstimate") : t("budgetGiven")}
            </p>
            <p className="font-heading text-sm font-bold text-nebula-ink mt-0.5">
              {money(content.estimated_total)}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-3.5 py-3">
            <p className="text-[11px] text-nebula-ink-soft">{t("statSteps")}</p>
            <p className="font-heading text-sm font-bold text-nebula-ink mt-0.5">
              {content.timeline.length}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-nebula-ink-soft/70 mt-3">
          {t("generatedOn", { date: formatDate(plan.generated_at, locale) })}
        </p>
      </section>

      {/* budget */}
      {content.budget.length > 0 && (
        <section className={`${CARD_CLASS} p-5`} style={CARD_BG}>
          <SectionTitle>{t("budgetTitle")}</SectionTitle>
          <div className="space-y-3.5">
            {content.budget.map((item, i) => {
              const percent = Math.round((item.amount / total) * 100);
              const color = BAR_COLORS[i % BAR_COLORS.length];
              return (
                <div key={`${item.label}-${i}`}>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="text-sm text-nebula-ink">{item.label}</span>
                    <span className="text-sm font-semibold text-nebula-ink whitespace-nowrap">
                      {money(item.amount)}
                      <span className="text-[11px] font-normal text-nebula-ink-soft ml-1.5">
                        {percent}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.amount > 0 ? Math.max(percent, 2) : 0}%`,
                        background: color,
                        boxShadow: `0 0 8px ${color}66`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-nebula-line mt-5 pt-3">
            <span className="text-xs font-semibold text-nebula-ink-soft">
              {t("budgetTotal")}
            </span>
            <span className="font-heading text-sm font-bold text-nebula-ink">
              {money(content.estimated_total)}
            </span>
          </div>
        </section>
      )}

      {/* roadmap */}
      <section className={`${CARD_CLASS} p-5`} style={CARD_BG}>
        <SectionTitle>{t("roadmapTitle")}</SectionTitle>
        <ol className="relative ml-2 border-l border-nebula-line space-y-5">
          {content.timeline.map((step, i) => (
            <li key={`${step.title}-${i}`} className="relative pl-6">
              <span
                className="absolute -left-[7px] top-1 w-3 h-3 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, var(--nebula-magenta), var(--nebula-orange))",
                  boxShadow: "0 0 10px rgba(224, 64, 158, 0.6)",
                }}
              />
              {step.when && (
                <span className="inline-block mb-1.5">
                  <Tag tone="orange">{step.when}</Tag>
                </span>
              )}
              <p className="text-sm font-bold text-nebula-ink">{step.title}</p>
              {step.detail && (
                <p className="text-xs text-nebula-ink-soft leading-relaxed mt-1">
                  {step.detail}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* checklist */}
      {checklistCount > 0 && (
        <section className={`${CARD_CLASS} p-5`} style={CARD_BG}>
          <SectionTitle>{t("checklistTitle")}</SectionTitle>
          <div className="flex items-center gap-3 mb-4 -mt-1">
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${donePercent}%`,
                  background:
                    "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                }}
              />
            </div>
            <span className="text-[11px] text-nebula-ink-soft whitespace-nowrap">
              {t("checklistProgress", { done, total: checklistCount })}
            </span>
          </div>

          <ul className="space-y-1">
            {content.checklist.map((item, index) => {
              const checked = plan.checked.includes(index);
              return (
                <li key={`${item}-${index}`}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => onToggle(index)}
                    className="w-full flex items-start gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5 transition-colors"
                  >
                    <span
                      className="mt-0.5 w-5 h-5 flex-shrink-0 rounded-md border flex items-center justify-center text-[12px] font-bold"
                      style={{
                        borderColor: checked
                          ? "transparent"
                          : "var(--nebula-line)",
                        background: checked
                          ? "linear-gradient(135deg, var(--nebula-magenta), var(--nebula-orange))"
                          : "transparent",
                        color: "#1A0E24",
                      }}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span
                      className={`text-sm ${
                        checked
                          ? "text-nebula-ink-soft line-through"
                          : "text-nebula-ink"
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* tips */}
      {content.tips.length > 0 && (
        <section className={`${CARD_CLASS} p-5`} style={CARD_BG}>
          <SectionTitle>{t("tipsTitle")}</SectionTitle>
          <ul className="space-y-2.5">
            {content.tips.map((tip, i) => (
              <li key={`${tip}-${i}`} className="flex gap-3 text-sm text-nebula-ink">
                <span style={{ color: "#FFC24B" }}>✦</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}