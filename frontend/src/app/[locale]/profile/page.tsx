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
  email: string;
  full_name: string;
  gender: string;
  bio: string;
  city: string;
  country: string;
  budget_preference: string;
  group_preference: string;
  experience_scope_preference: string;
  is_public: boolean;
  profile_picture: string | null;
}

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

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [showFullPhoto, setShowFullPhoto] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
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
      setIsPublic(p.is_public);
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
        headers: {
          ...authHeader(),
          "Content-Type": undefined,
        },
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
          is_public: isPublic,
        },
        { headers: authHeader() }
      );
      await loadProfile();
      setMode("view");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
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

      <main className="max-w-2xl mx-auto px-6 py-8 relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div
                onClick={() =>
                  profile.profile_picture && setShowFullPhoto(true)
                }
                className="relative w-24 h-24 rounded-full overflow-hidden flex-shrink-0"
                style={{
                  border: "1.5px solid var(--nebula-line)",
                  cursor: profile.profile_picture ? "pointer" : "default",
                }}
              >
                {profile.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt={t("changePhoto")}
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
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
              {profile.profile_picture ? (
                <div className="flex items-center gap-1.5 text-[10.5px]">
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
                  className="text-[10.5px] font-semibold hover:underline"
                  style={{ color: "var(--nebula-magenta)" }}
                >
                  {t("addPhoto")}
                </button>
              )}
            </div>

            <div className="pt-1">
              <h1 className="font-heading text-xl font-bold text-nebula-ink">
                {mode === "view" ? t("title") : t("editTitle")}
              </h1>
              <p className="text-xs text-nebula-ink-soft">
                @{profile.username} · {profile.email}
              </p>
            </div>
          </div>
          {mode === "view" && (
            <Button
              onClick={() => setMode("edit")}
              className="rounded-xl px-5 py-4.5 text-sm font-bold border-0 text-[#1A0E24]"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
              }}
            >
              {t("editSettings")}
            </Button>
          )}
        </div>

        {avatarError && (
          <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2 mb-4">
            {avatarError}
          </p>
        )}
        {savedFlash && (
          <p className="text-xs text-[#4ADE80] bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl px-3 py-2 mb-4">
            {t("saved")}
          </p>
        )}

        {mode === "view" ? (
          <div
            className="rounded-2xl p-5 border border-nebula-line space-y-4"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                  {t("fullName")}
                </p>
                <p className="text-sm text-nebula-ink">
                  {profile.full_name || t("notSet")}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                  {t("gender")}
                </p>
                <p className="text-sm text-nebula-ink">
                  {profile.gender ? t(`gender_${profile.gender}`) : t("notSet")}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                {t("bio")}
              </p>
              <p className="text-sm text-nebula-ink">
                {profile.bio || t("notSet")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                  {t("city")}
                </p>
                <p className="text-sm text-nebula-ink">
                  {profile.city || t("notSet")}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                  {t("country")}
                </p>
                <p className="text-sm text-nebula-ink">
                  {profile.country || t("notSet")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                  {t("budgetPreference")}
                </p>
                <p className="text-sm text-nebula-ink">
                  {profile.budget_preference
                    ? t(`budget_${profile.budget_preference}`)
                    : t("notSet")}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                  {t("groupPreference")}
                </p>
                <p className="text-sm text-nebula-ink">
                  {profile.group_preference
                    ? t(`group_${profile.group_preference}`)
                    : t("notSet")}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                  {t("scopePreference")}
                </p>
                <p className="text-sm text-nebula-ink">
                  {profile.experience_scope_preference
                    ? t(`scope_${profile.experience_scope_preference}`)
                    : t("notSet")}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-nebula-line">
              <p className="text-sm text-nebula-ink-soft">
                {t("publicProfile")}
              </p>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  color: profile.is_public
                    ? "#4ADE80"
                    : "var(--nebula-ink-soft)",
                  background: profile.is_public
                    ? "#4ADE8022"
                    : "rgba(255,255,255,0.06)",
                }}
              >
                {profile.is_public ? t("public") : t("private")}
              </span>
            </div>
          </div>
        ) : (
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

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-nebula-ink-soft">
                {t("publicProfile")}
              </p>
              <ToggleSwitch checked={isPublic} onChange={setIsPublic} />
            </div>

            {error && (
              <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setMode("view")}
                className="text-xs font-semibold text-nebula-ink-soft hover:text-nebula-ink transition-colors"
              >
                {t("cancel")}
              </button>
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
        )}
      </main>

      {showFullPhoto && profile.profile_picture && (
        <div
          onClick={() => setShowFullPhoto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <button
            onClick={() => setShowFullPhoto(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white text-2xl leading-none"
            aria-label={t("close")}
          >
            ✕
          </button>
          <img
            src={profile.profile_picture}
            alt={t("changePhoto")}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}