"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import DefaultAvatar from "@/components/DefaultAvatar";

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
  full_name: string;
  gender: string;
  bio: string;
  profile_picture: string | null;
  is_public: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("profile");

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ wishes: 0, stars: 0, friends: 0 });
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

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
      .then((res) => setProfile(res.data))
      .catch(() => router.push(`/${locale}/login`))
      .finally(() => setLoading(false));

    api
      .get("/wishes/", { headers: authHeader() })
      .then((res) => {
        const wishes = res.data;
        setStats({
          wishes: wishes.length,
          stars: wishes.filter((w: any) => w.status === "completed").length,
          friends: 0,
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const TILES = [
    {
      key: "profile",
      href: `/${locale}/profile/edit`,
      icon: "👤",
      iconColor: "var(--nebula-magenta)",
      iconBg: "var(--nebula-magenta-soft)",
      title: t("tileProfileTitle"),
      desc: t("tileProfileDesc"),
    },
    {
      key: "privacy",
      href: `/${locale}/profile/privacy`,
      icon: "🔒",
      iconColor: "var(--nebula-orange)",
      iconBg: "var(--nebula-orange-soft)",
      title: t("tilePrivacyTitle"),
      desc: t("tilePrivacyDesc"),
    },
    {
      key: "notifications",
      href: `/${locale}/profile/notifications`,
      icon: "🔔",
      iconColor: "#5CE0C6",
      iconBg: "rgba(92,224,198,.15)",
      title: t("tileNotificationsTitle"),
      desc: t("tileNotificationsDesc"),
    },
    {
      key: "language",
      href: `/${locale}/profile/language`,
      icon: "🌐",
      iconColor: "var(--nebula-blue)",
      iconBg: "var(--nebula-blue-soft)",
      title: t("tileLanguageTitle"),
      desc: t("tileLanguageDesc"),
    },
    {
      key: "account",
      href: `/${locale}/profile/account`,
      icon: "🔑",
      iconColor: "#FFC24B",
      iconBg: "rgba(255,194,75,.15)",
      title: t("tileAccountTitle"),
      desc: t("tileAccountDesc"),
    },
    {
      key: "danger",
      href: `/${locale}/profile/danger`,
      icon: "⚠",
      iconColor: "#FF6B6B",
      iconBg: "rgba(255,107,107,.13)",
      title: t("tileDangerTitle"),
      desc: t("tileDangerDesc"),
    },
  ];

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

      <main className="max-w-4xl mx-auto px-6 py-10 relative z-10">
        <div
          className="rounded-2xl border border-nebula-line p-7 mb-8"
          style={{ background: "var(--nebula-surface-2)" }}
        >
          <div className="flex items-start gap-4">
            <div
              onClick={() =>
                profile.profile_picture && setShowFullPhoto(true)
              }
              className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
              style={{
                border: "1.5px solid var(--nebula-line)",
                boxShadow: "0 0 24px -6px rgba(224, 64, 158, 0.45)",
                cursor: profile.profile_picture ? "pointer" : "default",
              }}
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
            </div>
            <div className="flex-1 pt-1">
              <h1 className="font-heading text-xl font-bold text-nebula-ink">
                {profile.full_name || `@${profile.username}`}
              </h1>
              <p className="text-xs text-nebula-ink-soft mt-0.5">
                @{profile.username} · {profile.email}
              </p>
              {profile.bio ? (
                <p className="text-sm text-nebula-ink mt-3 max-w-lg leading-relaxed">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-sm text-nebula-ink-soft mt-3 italic">
                  {t("noBioYet")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-8 mt-6 pt-5 border-t border-nebula-line">
            <a
              href={`/${locale}/bucket-list`}
              className="text-center hover:opacity-80 transition-opacity"
            >
              <p className="font-heading text-lg font-bold text-nebula-ink">
                {stats.wishes}
              </p>
              <p className="text-[11px] text-nebula-ink-soft">
                {t("wishes")}
              </p>
            </a>
            <button
              type="button"
              onClick={() => setComingSoonOpen(true)}
              className="text-center hover:opacity-80 transition-opacity"
            >
              <p className="font-heading text-lg font-bold text-nebula-ink">
                {stats.stars}
              </p>
              <p className="text-[11px] text-nebula-ink-soft">{t("stars")}</p>
            </button>
            <button
              type="button"
              onClick={() => setComingSoonOpen(true)}
              className="text-center hover:opacity-80 transition-opacity"
            >
              <p className="font-heading text-lg font-bold text-nebula-ink">
                {stats.friends}
              </p>
              <p className="text-[11px] text-nebula-ink-soft">
                {t("friends")}
              </p>
            </button>
            <span
              className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                color: profile.is_public ? "#4ADE80" : "var(--nebula-ink-soft)",
                background: profile.is_public
                  ? "#4ADE8022"
                  : "rgba(255,255,255,0.06)",
              }}
            >
              {profile.is_public ? t("public") : t("private")}
            </span>
          </div>
        </div>

        <p className="text-xs font-semibold text-nebula-ink-soft uppercase tracking-wide mb-3">
          {t("manageBelow")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TILES.map((tile) => (
            <a
              key={tile.key}
              href={tile.href}
              className="text-left rounded-2xl p-5 border border-nebula-line hover:border-nebula-magenta/40 transition-colors flex flex-col gap-3"
              style={{ background: "var(--nebula-surface-2)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: tile.iconBg, color: tile.iconColor }}
              >
                {tile.icon}
              </div>
              <div>
                <h4 className="font-heading text-sm font-bold text-nebula-ink">
                  {tile.title}
                </h4>
                <p className="text-xs text-nebula-ink-soft mt-1 leading-relaxed">
                  {tile.desc}
                </p>
              </div>
            </a>
          ))}
        </div>
      </main>

      {comingSoonOpen && (
        <div
          onClick={() => setComingSoonOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl p-6 border border-nebula-line text-center cursor-default"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <p className="text-sm font-semibold text-nebula-ink mb-1">
              {t("comingSoonTitle")}
            </p>
            <p className="text-xs text-nebula-ink-soft mb-4">
              {t("comingSoonMessage")}
            </p>
            <button
              onClick={() => setComingSoonOpen(false)}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl border-0 text-[#1A0E24]"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
              }}
            >
              {t("gotIt")}
            </button>
          </div>
        </div>
      )}

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
            alt=""
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}