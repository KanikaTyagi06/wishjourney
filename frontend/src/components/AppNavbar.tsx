"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { logout } from "@/lib/auth";
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
                  ? "text-nebula-magenta font-semibold"
                  : "hover:text-nebula-ink transition-colors"
              }
            >
              {link.label}
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