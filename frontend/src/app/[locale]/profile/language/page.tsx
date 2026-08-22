"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

export default function LanguageSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("profile");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null;

  return (
    <div className="min-h-screen relative" style={SOFT_BG}>
      <Stars count={10} className="opacity-40" />
      <AppNavbar />

      <main className="max-w-2xl mx-auto px-6 py-10 relative z-10">
        <a
          href={`/${locale}/profile`}
          className="text-xs text-nebula-ink-soft hover:text-nebula-ink mb-4 inline-block transition-colors"
        >
          {t("backToProfile")}
        </a>

        <div
          className="rounded-2xl border border-nebula-line p-7"
          style={{ background: "var(--nebula-surface-2)" }}
        >
          <h3 className="font-heading text-lg font-bold text-nebula-ink mb-1">
            {t("tileLanguageTitle")}
          </h3>
          <p className="text-xs text-nebula-ink-soft mb-6">
            {t("languagePanelSub")}
          </p>
          <div
            className="rounded-xl p-4 border border-nebula-line flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <span className="text-sm text-nebula-ink">
              {locale === "hi" ? "हिन्दी" : "English"}
            </span>
            <span className="text-xs text-nebula-ink-soft">
              {t("languageSwitcherHint")}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}