"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import WishJourneyMark from "@/components/WishJourneyMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

const BUDGET_OPTIONS = ["low", "medium", "high"] as const;
const GROUP_OPTIONS = ["solo", "couple", "friends", "family"] as const;
const SCOPE_OPTIONS = ["local", "national", "international"] as const;

interface Profile {
  username: string;
  email: string;
  full_name: string;
  bio: string;
  city: string;
  country: string;
  budget_preference: string;
  group_preference: string;
  experience_scope_preference: string;
  is_public: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [budget, setBudget] = useState("");
  const [group, setGroup] = useState("");
  const [scope, setScope] = useState("");
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
      .then((res) => {
        const p: Profile = res.data;
        setUsername(p.username);
        setEmail(p.email);
        setFullName(p.full_name || "");
        setBio(p.bio || "");
        setCity(p.city || "");
        setCountry(p.country || "");
        setBudget(p.budget_preference || "");
        setGroup(p.group_preference || "");
        setScope(p.experience_scope_preference || "");
        setIsPublic(p.is_public);
      })
      .catch(() => router.push(`/${locale}/login`))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSaving(true);

    try {
      await api.patch(
        "/profiles/me/",
        {
          full_name: fullName,
          bio,
          city,
          country,
          budget_preference: budget,
          group_preference: group,
          experience_scope_preference: scope,
          is_public: isPublic,
        },
        { headers: authHeader() }
      );
      setSuccessMsg(t("saved"));
      setTimeout(() => setSuccessMsg(""), 2500);
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

      <main className="max-w-2xl mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "#171025" }}
          >
            <WishJourneyMark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-nebula-ink">
              {t("title")}
            </h1>
            <p className="text-xs text-nebula-ink-soft">
              @{username} · {email}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="rounded-2xl p-5 border border-nebula-line space-y-4"
          style={{ background: "var(--nebula-surface-2)" }}
        >
          <div>
            <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
              {t("fullName")}
            </Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-white/5 border-nebula-line text-nebula-ink rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
            />
          </div>

          <div>
            <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
              {t("bio")}
            </Label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={t("bioPlaceholder")}
              className="w-full rounded-xl border border-nebula-line bg-white/5 px-3 py-2 text-sm text-nebula-ink placeholder:text-nebula-ink-soft/60 outline-none focus-visible:border-nebula-magenta resize-none"
            />
            <p className="text-[10px] text-nebula-ink-soft/70 mt-1 text-right">
              {bio.length}/500
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("city")}
              </Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-white/5 border-nebula-line text-nebula-ink rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
              />
            </div>
            <div>
              <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("country")}
              </Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-white/5 border-nebula-line text-nebula-ink rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-nebula-ink-soft mb-2 block">
              {t("budgetPreference")}
            </Label>
            <div className="flex gap-2">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBudget(opt)}
                  className="flex-1 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                  style={{
                    background:
                      budget === opt
                        ? "var(--nebula-magenta-soft)"
                        : "rgba(255,255,255,0.05)",
                    color:
                      budget === opt
                        ? "var(--nebula-magenta)"
                        : "var(--nebula-ink-soft)",
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
          </div>

          <div>
            <Label className="text-xs text-nebula-ink-soft mb-2 block">
              {t("groupPreference")}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {GROUP_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setGroup(opt)}
                  className="text-xs font-semibold py-2.5 rounded-xl transition-colors"
                  style={{
                    background:
                      group === opt
                        ? "var(--nebula-magenta-soft)"
                        : "rgba(255,255,255,0.05)",
                    color:
                      group === opt
                        ? "var(--nebula-magenta)"
                        : "var(--nebula-ink-soft)",
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
          </div>

          <div>
            <Label className="text-xs text-nebula-ink-soft mb-2 block">
              {t("scopePreference")}
            </Label>
            <div className="flex gap-2">
              {SCOPE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setScope(opt)}
                  className="flex-1 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                  style={{
                    background:
                      scope === opt
                        ? "var(--nebula-magenta-soft)"
                        : "rgba(255,255,255,0.05)",
                    color:
                      scope === opt
                        ? "var(--nebula-magenta)"
                        : "var(--nebula-ink-soft)",
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
          </div>

          <label className="flex items-center gap-2 text-xs text-nebula-ink-soft cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-[var(--nebula-magenta)]"
            />
            {t("publicProfile")}
          </label>

          {error && (
            <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {successMsg && (
            <p className="text-xs text-[#4ADE80] bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl px-3 py-2">
              {successMsg}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl px-6 py-4 text-sm font-bold border-0 text-[#1A0E24] disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                boxShadow: "0 8px 22px -8px rgba(224, 64, 158, 0.5)",
              }}
            >
              {saving ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}