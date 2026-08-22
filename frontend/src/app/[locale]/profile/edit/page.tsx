"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import DefaultAvatar from "@/components/DefaultAvatar";
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
const GENDER_OPTIONS = ["male", "female", "other", "prefer_not_to_say"] as const;

interface Profile {
  username: string;
  full_name: string;
  gender: string;
  bio: string;
  city: string;
  country: string;
  budget_preference: string;
  group_preference: string;
  experience_scope_preference: string;
  profile_picture: string | null;
}

export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [budget, setBudget] = useState("");
  const [group, setGroup] = useState("");
  const [scope, setScope] = useState("");

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  function loadProfile() {
    return api.get("/profiles/me/", { headers: authHeader() }).then((res) => {
      const p: Profile = res.data;
      setProfile(p);
      setFullName(p.full_name || "");
      setGender(p.gender || "");
      setBio(p.bio || "");
      setCity(p.city || "");
      setCountry(p.country || "");
      setBudget(p.budget_preference || "");
      setGroup(p.group_preference || "");
      setScope(p.experience_scope_preference || "");
    });
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    loadProfile()
      .catch(() => router.push(`/${locale}/login`))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError("");
    try {
      const formData = new FormData();
      formData.append("profile_picture", file);
      const res = await api.patch("/profiles/me/", formData, {
        headers: { ...authHeader(), "Content-Type": undefined },
      });
      setProfile(res.data);
    } catch {
      setAvatarError(t("avatarError"));
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemovePhoto() {
    setAvatarUploading(true);
    setAvatarError("");
    try {
      const res = await api.patch(
        "/profiles/me/",
        { profile_picture: null },
        { headers: authHeader() }
      );
      setProfile(res.data);
    } catch {
      setAvatarError(t("avatarError"));
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.patch(
        "/profiles/me/",
        {
          full_name: fullName,
          gender,
          bio,
          city,
          country,
          budget_preference: budget,
          group_preference: group,
          experience_scope_preference: scope,
        },
        { headers: authHeader() }
      );
      router.push(`/${locale}/profile`);
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

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
            {t("tileProfileTitle")}
          </h3>
          <p className="text-xs text-nebula-ink-soft mb-6">
            {t("profilePanelSub")}
          </p>

          {avatarError && (
            <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2 mb-4">
              {avatarError}
            </p>
          )}

          <form onSubmit={handleSave}>
            <div className="flex items-center gap-4 mb-6">
              <div
                className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: "1.5px solid var(--nebula-line)" }}
              >
                {profile.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <DefaultAvatar gender={profile.gender} />
                )}
                {avatarUploading && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              {profile.profile_picture ? (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-semibold hover:underline"
                    style={{ color: "var(--nebula-magenta)" }}
                  >
                    {t("changePhoto")}
                  </button>
                  <span className="text-nebula-ink-soft">·</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="font-semibold text-nebula-ink-soft hover:text-destructive transition-colors"
                  >
                    {t("removePhoto")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-semibold hover:underline"
                  style={{ color: "var(--nebula-magenta)" }}
                >
                  {t("addPhoto")}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
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
                  {t("username")}
                </Label>
                <Input
                  value={`@${profile.username}`}
                  disabled
                  className="bg-white/5 border-nebula-line text-nebula-ink-soft rounded-xl opacity-60"
                />
              </div>
            </div>

            <div className="mb-4">
              <Label className="text-xs text-nebula-ink-soft mb-2 block">
                {t("gender")}
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setGender(opt)}
                    className="text-[11px] font-semibold py-2.5 rounded-xl transition-colors"
                    style={{
                      background:
                        gender === opt
                          ? "var(--nebula-magenta-soft)"
                          : "rgba(255,255,255,0.05)",
                      color:
                        gender === opt
                          ? "var(--nebula-magenta)"
                          : "var(--nebula-ink-soft)",
                      border:
                        gender === opt
                          ? "1.4px solid var(--nebula-magenta)"
                          : "1.4px solid var(--nebula-line)",
                    }}
                  >
                    {t(`gender_${opt}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
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

            <div className="grid grid-cols-2 gap-4 mb-4">
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

            <div className="mb-4">
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

            <div className="mb-4">
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

            <div className="mb-6">
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

            {error && (
              <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
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