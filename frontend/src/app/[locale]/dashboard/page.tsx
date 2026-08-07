"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import { Button } from "@/components/ui/button";

interface Profile {
  username: string;
  full_name: string;
}

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("dashboard");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    api
      .get("/profiles/me/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProfile(res.data))
      .catch(() => router.push(`/${locale}/login`))
      .finally(() => setLoading(false));
  }, [router, locale]);

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

  const displayName = profile?.full_name || profile?.username || "there";

  return (
    <div className="min-h-screen relative" style={SOFT_BG}>
      <Stars count={10} className="opacity-40" />

      <AppNavbar active="home" />

      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-8">
          <p className="text-sm text-nebula-ink-soft">{t("goodMorning")}</p>
          <h1 className="font-heading text-2xl font-bold text-nebula-ink mt-0.5">
            {displayName}
          </h1>
          <p className="text-sm text-nebula-ink-soft mt-1">
            {t("nextDreamAwaits")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div
              className="rounded-2xl p-5 border border-nebula-line"
              style={{ background: "var(--nebula-surface-2)" }}
            >
              <p className="text-xs text-nebula-magenta font-semibold mb-1">
                {t("inProgressTravel")}
              </p>
              <p className="text-lg font-semibold text-nebula-ink">
                Trek to Everest Base Camp
              </p>
              <p className="text-sm text-nebula-ink-soft mt-2">
                {t("budgetFriendlyPlan")}
              </p>
              <div className="h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full w-[68%] rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-2xl p-4 border border-nebula-line"
                style={{ background: "var(--nebula-surface-2)" }}
              >
                <p className="text-sm font-medium text-nebula-ink">
                  Learn Spanish
                </p>
                <p
                  className="text-xs mt-0.5 font-medium"
                  style={{ color: "var(--nebula-orange)" }}
                >
                  {t("idea")}
                </p>
              </div>
              <div
                className="rounded-2xl p-4 border border-nebula-line"
                style={{ background: "var(--nebula-surface-2)" }}
              >
                <p className="text-sm font-medium text-nebula-ink">
                  Cherry blossoms, Japan
                </p>
                <p
                  className="text-xs mt-0.5 font-medium"
                  style={{ color: "var(--nebula-blue)" }}
                >
                  {t("saved")}
                </p>
              </div>
            </div>

            <Button
              className="w-full rounded-xl py-5 text-sm font-bold border-0 text-[#1A0E24]"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                boxShadow: "0 8px 22px -8px rgba(224, 64, 158, 0.5)",
              }}
            >
              {t("planNextWish")}
            </Button>
          </div>

          <div className="space-y-4">
            <div
              className="rounded-2xl p-4 border border-nebula-line"
              style={{ background: "var(--nebula-surface-2)" }}
            >
              <p className="text-xs text-nebula-ink-soft mb-3 font-semibold">
                {t("yourProgress")}
              </p>
              <a
                href={`/${locale}/bucket-list`}
                className="flex justify-between text-sm mb-2 hover:opacity-80 transition-opacity"
              >
                <span className="text-nebula-ink-soft underline decoration-dotted">
                  {t("bucketList")}
                </span>
                <span className="font-semibold text-nebula-ink">14</span>
              </a>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-nebula-ink-soft">
                  {t("inProgress")}
                </span>
                <span className="font-semibold text-nebula-ink">3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-nebula-ink-soft">{t("completed")}</span>
                <span className="font-semibold text-nebula-ink">7</span>
              </div>
            </div>

            <div
              className="rounded-2xl p-4 border border-nebula-line"
              style={{ background: "var(--nebula-surface-2)" }}
            >
              <p className="text-xs text-nebula-ink-soft mb-3 font-semibold">
                {t("recommendedForYou")}
              </p>
              <p className="text-sm mb-1.5 text-nebula-ink">
                🏃 Run a marathon
              </p>
              <p className="text-sm mb-1.5 text-nebula-ink">
                👨‍🍳 Cooking class
              </p>
              <p className="text-sm text-nebula-ink">📷 Photography basics</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}