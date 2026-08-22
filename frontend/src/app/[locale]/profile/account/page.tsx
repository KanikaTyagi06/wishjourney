"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

interface Profile {
  username: string;
  email: string;
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("profile");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !profile) {
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
            {t("tileAccountTitle")}
          </h3>
          <p className="text-xs text-nebula-ink-soft mb-6">
            {t("accountPanelSub")}
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                {t("username")}
              </p>
              <p className="text-sm text-nebula-ink">@{profile.username}</p>
            </div>
            <div>
              <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                {t("email")}
              </p>
              <p className="text-sm text-nebula-ink">{profile.email}</p>
            </div>
          </div>
          <a href={`/${locale}/forgot-password`}>
            <button
              type="button"
              className="text-xs font-semibold px-5 py-3 rounded-xl border-0 text-[#1A0E24]"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
              }}
            >
              {t("changePassword")}
            </button>
          </a>
        </div>
      </main>
    </div>
  );
}