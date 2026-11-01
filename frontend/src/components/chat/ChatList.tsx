"use client";

import { useTranslations } from "next-intl";
import {
  UserAvatar,
  displayName,
} from "@/components/friends/shared";
import { Conversation, formatListTime } from "./shared";

interface ChatListProps {
  conversations: Conversation[];
  activeId: string | null;
  search: string;
  locale: string;
  onSearch: (value: string) => void;
  onSelect: (userId: string) => void;
}

export default function ChatList({
  conversations,
  activeId,
  search,
  locale,
  onSearch,
  onSelect,
}: ChatListProps) {
  const t = useTranslations("chat");

  const q = search.trim().toLowerCase();
  const visible = conversations.filter(
    (c) =>
      !q || `${c.user.full_name} ${c.user.username}`.toLowerCase().includes(q),
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-nebula-line">
        <h2 className="font-heading text-lg font-bold text-nebula-ink mb-3">
          {t("title")}
        </h2>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          className="w-full bg-white/5 border border-nebula-line rounded-xl px-3.5 py-2.5 text-sm text-nebula-ink placeholder:text-nebula-ink-soft/60 outline-none focus:border-nebula-magenta transition-colors"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-nebula-ink mb-1">
              {t("noChatsTitle")}
            </p>
            <p className="text-xs text-nebula-ink-soft mb-4">
              {t("noChatsText")}
            </p>
            <a
              href={`/${locale}/friends`}
              className="inline-block text-xs font-bold px-4 py-2 rounded-xl"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                color: "#1A0E24",
              }}
            >
              {t("goToFriends")}
            </a>
          </div>
        ) : visible.length === 0 ? (
          <p className="p-6 text-center text-xs text-nebula-ink-soft">
            {t("noMatch", { query: search.trim() })}
          </p>
        ) : (
          visible.map((conversation) => {
            const { user, last_message: last, unread_count: unread } =
              conversation;
            const active = activeId === user.id;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelect(user.id)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left border transition-colors hover:bg-white/5"
                style={{
                  background: active ? "var(--nebula-magenta-soft)" : undefined,
                  borderColor: active
                    ? "rgba(224, 64, 158, 0.35)"
                    : "transparent",
                }}
              >
                <UserAvatar user={user} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-nebula-ink truncate">
                      {displayName(user)}
                    </p>
                    {last && (
                      <span className="flex-shrink-0 text-[10.5px] text-nebula-ink-soft">
                        {formatListTime(last.created_at, locale)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                      className={`text-xs truncate ${
                        unread > 0
                          ? "text-nebula-ink font-semibold"
                          : "text-nebula-ink-soft"
                      }`}
                    >
                      {last
                        ? `${last.from_me ? `${t("you")}: ` : ""}${last.text}`
                        : t("startHint")}
                    </p>
                    {unread > 0 && (
                      <span
                        className="flex-shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={{
                          background: "var(--nebula-magenta)",
                          color: "#1A0E24",
                        }}
                      >
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}