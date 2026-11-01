"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import ChatList from "@/components/chat/ChatList";
import ChatThread from "@/components/chat/ChatThread";
import { Conversation } from "@/components/chat/shared";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

const CONVERSATION_POLL_MS = 8000;

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("chat");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // the open chat never shows an unread badge, even if a poll lands late
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  async function loadConversations(
    silent = false,
  ): Promise<Conversation[] | null> {
    if (!silent) {
      setLoading(true);
      setLoadError(false);
    }
    try {
      const res = await api.get("/chat/conversations/", {
        headers: authHeader(),
      });
      const data: Conversation[] = res.data;
      setConversations(
        data.map((c) =>
          c.user.id === activeIdRef.current ? { ...c, unread_count: 0 } : c,
        ),
      );
      // the open chat's friend was removed: go back to the list
      if (
        activeIdRef.current &&
        !data.some((c) => c.user.id === activeIdRef.current)
      ) {
        setActiveId(null);
      }
      return data;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return null;
      }
      if (!silent) setLoadError(true);
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    (async () => {
      const data = await loadConversations();
      // /chat?with=<user id> opens that chat straight away (Message button)
      const wanted = new URLSearchParams(window.location.search).get("with");
      if (data && wanted && data.some((c) => c.user.id === wanted)) {
        setActiveId(wanted);
      }
    })();

    const timer = setInterval(() => {
      if (!document.hidden) loadConversations(true);
    }, CONVERSATION_POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectChat(userId: string) {
    setActiveId(userId);
    window.history.replaceState(null, "", `/${locale}/chat?with=${userId}`);
  }

  function goBack() {
    setActiveId(null);
    window.history.replaceState(null, "", `/${locale}/chat`);
  }

  function handleRead() {
    setConversations((prev) =>
      prev.map((c) =>
        c.user.id === activeIdRef.current ? { ...c, unread_count: 0 } : c,
      ),
    );
    // tell the navbar to refresh its unread badge
    window.dispatchEvent(new Event("chat-unread-changed"));
  }

  const active = conversations.find((c) => c.user.id === activeId) ?? null;

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
      <AppNavbar active="chat" />

      <main className="max-w-5xl mx-auto px-6 py-6 relative z-10">
        {loadError ? (
          <div
            className="rounded-2xl p-10 border border-nebula-line text-center"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <p className="text-sm text-[#FF5C6C] mb-3">{t("listError")}</p>
            <button
              onClick={() => loadConversations()}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl border border-nebula-line overflow-hidden grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] h-[calc(100vh-140px)] min-h-[520px]"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            {/* left: chat list (hidden on phones while a chat is open) */}
            <div
              className={`${
                active ? "hidden md:block" : "block"
              } min-h-0 md:border-r border-nebula-line`}
            >
              <ChatList
                conversations={conversations}
                activeId={activeId}
                search={search}
                locale={locale}
                onSearch={setSearch}
                onSelect={selectChat}
              />
            </div>

            {/* right: the open chat (or a hint) */}
            <div className={`${active ? "block" : "hidden md:block"} min-h-0`}>
              {active ? (
                <ChatThread
                  key={active.user.id}
                  partner={active.user}
                  locale={locale}
                  onBack={goBack}
                  onRead={handleRead}
                  onActivity={() => loadConversations(true)}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
                    style={{ background: "var(--nebula-magenta-soft)" }}
                  >
                    💬
                  </div>
                  <p className="text-sm font-semibold text-nebula-ink mb-1">
                    {t("selectChat")}
                  </p>
                  <p className="text-xs text-nebula-ink-soft">
                    {t("selectChatHint")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}