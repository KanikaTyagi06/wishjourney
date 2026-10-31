"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken, logout } from "@/lib/auth";
import { api } from "@/lib/api";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import WishJourneyMark from "@/components/WishJourneyMark";

type NavKey = "home" | "explore" | "memories" | "community" | "friends";

interface AppNavbarProps {
  active?: NavKey;
}

export default function AppNavbar({ active }: AppNavbarProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("dashboard");

  // number of friend requests waiting for me (shown on the Friends link)
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    function loadPending() {
      const token = getAccessToken();
      if (!token) return;
      api
        .get("/social/summary/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setPendingRequests(res.data.incoming ?? 0))
        .catch(() => {
          // The page itself handles expired tokens; the badge just stays hidden.
        });
    }

    loadPending();
    // The Friends page fires this after accept/reject/cancel so the badge updates instantly.
    window.addEventListener("social-summary-changed", loadPending);
    return () =>
      window.removeEventListener("social-summary-changed", loadPending);
  }, []);

  function handleLogout() {
    logout();
    router.push(`/${locale}/login`);
  }

  const links: { key: NavKey; label: string; href: string }[] = [
    { key: "home", label: t("navHome"), href: `/${locale}/dashboard` },
    { key: "explore", label: t("navExplore"), href: `/${locale}/explore` },
    { key: "memories", label: t("navMemories"), href: `/${locale}/memories` },
    {
      key: "community",
      label: t("navCommunity"),
      href: `/${locale}/community`,
    },
    { key: "friends", label: t("navFriends"), href: `/${locale}/friends` },
  ];

  return (
    <nav className="border-b border-nebula-line relative z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <a
          href={`/${locale}/dashboard`}
          className="flex items-center gap-2.5"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#171025" }}
          >
            <WishJourneyMark className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-sm text-nebula-ink">
            WishJourney
          </span>
        </a>
        <div className="flex items-center gap-6 text-sm text-nebula-ink-soft">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className={
                active === link.key
                  ? "inline-flex items-center gap-1.5 text-nebula-magenta font-semibold"
                  : "inline-flex items-center gap-1.5 hover:text-nebula-ink transition-colors"
              }
            >
              {link.label}
              {link.key === "friends" && pendingRequests > 0 && (
                <span
                  className="min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center leading-none"
                  style={{
                    background: "var(--nebula-magenta)",
                    color: "#1A0E24",
                    boxShadow: "0 0 10px -2px rgba(224, 64, 158, 0.8)",
                  }}
                >
                  {pendingRequests > 9 ? "9+" : pendingRequests}
                </span>
              )}
            </a>
          ))}
          <a
            href={`/${locale}/profile`}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{
              background:
                "linear-gradient(135deg, var(--nebula-magenta), var(--nebula-orange))",
            }}
            aria-label="Profile"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="#1A0E24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8v1H4v-1z" />
            </svg>
          </a>
          <LanguageSwitcher />
          <button
            onClick={handleLogout}
            className="text-xs text-nebula-ink-soft border border-nebula-line rounded-lg px-3 py-1.5 ml-1 hover:text-nebula-ink hover:border-nebula-ink-soft transition-colors"
          >
            {t("logOut")}
          </button>
        </div>
      </div>
    </nav>
  );
}