"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import { Button } from "@/components/ui/button";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0"
      style={{
        background: checked
          ? "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))"
          : "rgba(255,255,255,0.12)",
      }}
    >
      <span
        className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all"
        style={{ left: checked ? "20px" : "2px" }}
      />
    </button>
  );
}

export default function PrivacyPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isPublic, setIsPublic] = useState(true);

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
      .get("/profiles/me/", { headers: authHeader() })
      .then((res) => setIsPublic(res.data.is_public))
      .catch(() => router.push(`/${locale}/login`))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.patch(
        "/profiles/me/",
        { is_public: isPublic },
        { headers: authHeader() }
      );
      router.push(`/${locale}/profile`);
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
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
            {t("tilePrivacyTitle")}
          </h3>
          <p className="text-xs text-nebula-ink-soft mb-6">
            {t("tilePrivacyDesc")}
          </p>

          <form onSubmit={handleSave}>
            <div className="flex items-center justify-between py-3 border-t border-nebula-line">
              <div>
                <p className="text-sm text-nebula-ink font-medium">
                  {t("publicProfile")}
                </p>
                <p className="text-xs text-nebula-ink-soft mt-0.5">
                  {t("publicProfileHelper")}
                </p>
              </div>
              <ToggleSwitch checked={isPublic} onChange={setIsPublic} />
            </div>

            {error && (
              <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2 mt-4">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <a href={`/${locale}/profile`}>
                <button
                  type="button"
                  className="text-xs font-semibold px-5 py-3 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
                >
                  {t("cancel")}
                </button>
              </a>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl px-6 py-3.5 text-sm font-bold border-0 text-[#1A0E24] disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                }}
              >
                {saving ? t("saving") : t("saveChanges")}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}