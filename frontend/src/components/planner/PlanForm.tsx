"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PRIMARY_BTN } from "@/components/friends/shared";
import { PlanFormValues, PlanStyle } from "./types";

const STYLES: PlanStyle[] = ["budget", "balanced", "comfort"];

const FIELD_CLASS =
  "w-full bg-white/5 border border-nebula-line rounded-xl px-3.5 py-2.5 text-sm text-nebula-ink placeholder:text-nebula-ink-soft/60 outline-none focus:border-nebula-magenta transition-colors";

interface PlanFormProps {
  initial: PlanFormValues;
  submitLabel: string;
  disabled: boolean;
  onSubmit: (values: PlanFormValues) => void;
}

export default function PlanForm({
  initial,
  submitLabel,
  disabled,
  onSubmit,
}: PlanFormProps) {
  const t = useTranslations("planner");
  const [values, setValues] = useState<PlanFormValues>(initial);

  function set<K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const styleLabels: Record<PlanStyle, string> = {
    budget: t("styleBudget"),
    balanced: t("styleBalanced"),
    comfort: t("styleComfort"),
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-nebula-ink-soft mb-1.5 block">
            {t("formBudget")}
          </label>
          <input
            type="number"
            min={0}
            value={values.budget}
            onChange={(e) => set("budget", e.target.value)}
            placeholder="₹"
            className={FIELD_CLASS}
          />
          <p className="text-[10.5px] text-nebula-ink-soft/70 mt-1">
            {t("formBudgetHint")}
          </p>
        </div>

        <div>
          <label className="text-xs text-nebula-ink-soft mb-1.5 block">
            {t("formDays")}
          </label>
          <input
            type="number"
            min={1}
            max={3650}
            value={values.days}
            onChange={(e) => set("days", e.target.value)}
            className={FIELD_CLASS}
          />
          <p className="text-[10.5px] text-nebula-ink-soft/70 mt-1">
            {t("formDaysHint")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-nebula-ink-soft mb-1.5 block">
            {t("formPeople")}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={values.people}
            onChange={(e) => set("people", e.target.value)}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <span className="text-xs text-nebula-ink-soft mb-1.5 block">
            {t("formStyle")}
          </span>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((style) => {
              const active = values.style === style;
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => set("style", style)}
                  className={
                    active
                      ? "rounded-full px-3.5 py-2 text-xs font-bold"
                      : "rounded-full px-3.5 py-2 text-xs font-semibold border border-nebula-line text-nebula-ink-soft hover:text-nebula-ink hover:bg-white/5 transition-colors"
                  }
                  style={
                    active
                      ? { background: "var(--nebula-ink)", color: "#1A0E24" }
                      : undefined
                  }
                >
                  {styleLabels[style]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-nebula-ink-soft mb-1.5 block">
          {t("formNotes")}
        </label>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={t("formNotesPlaceholder")}
          className={`${FIELD_CLASS} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-xl py-3 text-sm font-bold disabled:opacity-60"
        style={PRIMARY_BTN}
      >
        {submitLabel}
      </button>
    </form>
  );
}