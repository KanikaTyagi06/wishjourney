"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken, logout } from "@/lib/auth";
import { api } from "@/lib/api";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import WishJourneyMark from "@/components/WishJourneyMark";

type NavKey = "home" | "explore" | "memories" | "community" | "friends" | "chat";

interface AppNavbarProps {
  active?: NavKey;
}

const UNREAD_POLL_MS = 20000;

export default function AppNavbar({ active }: AppNavbarProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("dashboard");
  const tChat = useTranslations("chat");

  // friend requests waiting for me (badge on the Friends link)
  const [pendingRequests, setPendingRequests] = useState(0);
  // unread chat messages (badge on the chat icon)
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    function authHeader() {
      return { Authorization: `Bearer ${getAccessToken()}` };
    }

    function loadPending() {
      if (!getAccessToken()) return;
      api
        .get("/social/summary/", { headers: authHeader() })
        .then((res: any) => setPendingRequests(res.data.incoming ?? 0))
        .catch(() => {
          // The page itself handles expired tokens; the badge just stays hidden.
        });
    }

    function loadUnread() {
      if (!getAccessToken()) return;
      api
        .get("/chat/unread/", { headers: authHeader() })
        .then((res: any) => setUnreadChats(res.data.unread ?? 0))
        .catch(() => {});
    }

    loadPending();
    loadUnread();

    // Pages fire these events after they change something, so badges update instantly.
    window.addEventListener("social-summary-changed", loadPending);
    window.addEventListener("chat-unread-changed", loadUnread);
    const timer = setInterval(() => {
      if (!document.hidden) loadUnread();
    }, UNREAD_POLL_MS);

    return () => {
      window.removeEventListener("social-summary-changed", loadPending);
      window.removeEventListener("chat-unread-changed", loadUnread);
      clearInterval(timer);
    };
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

          {/* messages */}
          <a
            href={`/${locale}/chat`}
            aria-label={tChat("navLabel")}
            className={
              active === "chat"
                ? "relative w-7 h-7 rounded-full border border-nebula-magenta text-nebula-magenta flex items-center justify-center transition-colors"
                : "relative w-7 h-7 rounded-full border border-nebula-line text-nebula-ink-soft hover:text-nebula-ink hover:border-nebula-ink-soft flex items-center justify-center transition-colors"
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {unreadChats > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center leading-none"
                style={{
                  background: "var(--nebula-magenta)",
                  color: "#1A0E24",
                  boxShadow: "0 0 10px -2px rgba(224, 64, 158, 0.8)",
                }}
              >
                {unreadChats > 9 ? "9+" : unreadChats}
              </span>
            )}
          </a>

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