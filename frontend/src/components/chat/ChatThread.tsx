"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  SocialUser,
  UserAvatar,
  displayName,
} from "@/components/friends/shared";
import {
  ChatMessage,
  MAX_MESSAGE_LENGTH,
  dayKey,
  formatClock,
  formatLongDate,
  isNewer,
  isYesterday,
  latestCreatedAt,
  mergeMessages,
} from "./shared";

const POLL_MS = 4000;

interface ChatThreadProps {
  partner: SocialUser;
  locale: string;
  onBack: () => void;
  onRead: () => void; // the thread was opened, so unread counts can reset
  onActivity: () => void; // a message was sent or received
}

export default function ChatThread({
  partner,
  locale,
  onBack,
  onRead,
  onActivity,
}: ChatThreadProps) {
  const router = useRouter();
  const t = useTranslations("chat");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [seenUntil, setSeenUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [lostFriend, setLostFriend] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastCreatedRef = useRef<string | null>(null);
  const stickToBottom = useRef(true);
  const pollBusy = useRef(false);

  // always call the newest callbacks from inside the long-lived interval
  const onReadRef = useRef(onRead);
  const onActivityRef = useRef(onActivity);
  onReadRef.current = onRead;
  onActivityRef.current = onActivity;

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  // open a chat: load the newest messages, then keep polling for new ones
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    setMessages([]);
    setSeenUntil(null);
    setLoading(true);
    setLoadError(false);
    setLostFriend(false);
    setDraft("");
    setSendError("");
    lastCreatedRef.current = null;
    stickToBottom.current = true;

    async function poll() {
      if (cancelled || pollBusy.current || document.hidden) return;
      pollBusy.current = true;
      try {
        const res = await api.get(`/chat/messages/${partner.id}/`, {
          params: lastCreatedRef.current
            ? { after: lastCreatedRef.current }
            : undefined,
          headers: authHeader(),
        });
        if (cancelled) return;
        const incoming: ChatMessage[] = res.data.messages;
        setSeenUntil(res.data.seen_until);
        if (incoming.length > 0) {
          lastCreatedRef.current = latestCreatedAt(
            incoming,
            lastCreatedRef.current,
          );
          setMessages((prev) => mergeMessages(prev, incoming));
          if (incoming.some((m) => !m.from_me)) onActivityRef.current();
        }
      } catch (err: any) {
        if (cancelled) return;
        if (err?.response?.status === 401) {
          router.push(`/${locale}/login`);
        } else if (err?.response?.data?.code === "not_friends") {
          setLostFriend(true);
        }
        // other errors: stay quiet, the next poll will try again
      } finally {
        pollBusy.current = false;
      }
    }

    async function load() {
      try {
        const res = await api.get(`/chat/messages/${partner.id}/`, {
          headers: authHeader(),
        });
        if (cancelled) return;
        const loaded: ChatMessage[] = res.data.messages;
        setMessages(loaded);
        setSeenUntil(res.data.seen_until);
        lastCreatedRef.current = latestCreatedAt(loaded, null);
        onReadRef.current();
        timer = setInterval(poll, POLL_MS);
      } catch (err: any) {
        if (cancelled) return;
        if (err?.response?.status === 401) {
          router.push(`/${locale}/login`);
          return;
        }
        if (err?.response?.data?.code === "not_friends") {
          setLostFriend(true);
        } else {
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner.id, reloadKey]);

  // keep the newest message in view (unless the person scrolled up to read)
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // grow the message box with its text, up to a limit
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      setSendError(t("messageTooLong", { max: MAX_MESSAGE_LENGTH }));
      return;
    }
    setSending(true);
    setSendError("");
    try {
      const res = await api.post(
        `/chat/messages/${partner.id}/`,
        { text },
        { headers: authHeader() },
      );
      const sent: ChatMessage = res.data;
      lastCreatedRef.current = latestCreatedAt([sent], lastCreatedRef.current);
      stickToBottom.current = true;
      setMessages((prev) => mergeMessages(prev, [sent]));
      setDraft("");
      onActivityRef.current();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      const code = err?.response?.data?.code;
      if (code === "not_friends") {
        setLostFriend(true);
      } else if (code === "message_too_long") {
        setSendError(t("messageTooLong", { max: MAX_MESSAGE_LENGTH }));
      } else {
        setSendError(t("sendError"));
      }
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  function dayLabel(iso: string): string {
    if (dayKey(iso) === new Date().toDateString()) return t("today");
    if (isYesterday(iso)) return t("yesterday");
    return formatLongDate(iso, locale);
  }

  const lastMine = [...messages].reverse().find((m) => m.from_me);
  const lastMineSeen =
    !!lastMine && !!seenUntil && !isNewer(lastMine.created_at, seenUntil);
  const charsLeft = MAX_MESSAGE_LENGTH - draft.length;

  let previousDay = "";

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-nebula-line">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("back")}
          className="md:hidden w-8 h-8 rounded-full border border-nebula-line text-nebula-ink-soft hover:text-nebula-ink hover:bg-white/5 transition-colors flex items-center justify-center"
        >
          ←
        </button>
        <UserAvatar user={partner} size={40} />
        <div className="min-w-0">
          <p className="font-heading text-sm font-bold text-nebula-ink truncate">
            {displayName(partner)}
          </p>
          {partner.full_name && (
            <p className="text-xs text-nebula-ink-soft truncate">
              @{partner.username}
            </p>
          )}
        </div>
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-nebula-magenta border-t-transparent animate-spin" />
          </div>
        ) : loadError ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-sm text-[#FF5C6C] mb-3">{t("loadError")}</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
            >
              {t("retry")}
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm text-nebula-ink-soft">
              {t("emptyThread", { name: displayName(partner) })}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {messages.map((message) => {
              const day = dayKey(message.created_at);
              const showDay = day !== previousDay;
              previousDay = day;
              const mine = message.from_me;
              return (
                <div key={message.id}>
                  {showDay && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10.5px] font-semibold text-nebula-ink-soft bg-white/5 rounded-full px-3 py-1">
                        {dayLabel(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                        mine
                          ? "rounded-2xl rounded-br-md"
                          : "rounded-2xl rounded-bl-md border border-nebula-line text-nebula-ink"
                      }`}
                      style={
                        mine
                          ? {
                              background:
                                "linear-gradient(135deg, var(--nebula-magenta), var(--nebula-orange))",
                              color: "#1A0E24",
                            }
                          : { background: "rgba(255,255,255,0.07)" }
                      }
                    >
                      {message.text}
                      <span
                        className="block text-[10px] mt-1 text-right"
                        style={{ opacity: mine ? 0.65 : 0.5 }}
                      >
                        {formatClock(message.created_at, locale)}
                      </span>
                    </div>
                  </div>
                  {mine && lastMine?.id === message.id && lastMineSeen && (
                    <p className="text-[10.5px] text-nebula-ink-soft text-right mt-0.5 pr-1">
                      ✓ {t("seen")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* composer */}
      {lostFriend ? (
        <div className="px-4 py-4 border-t border-nebula-line text-center">
          <p className="text-xs text-nebula-ink-soft">{t("notFriends")}</p>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-nebula-line">
          {sendError && (
            <p className="text-xs text-[#FF5C6C] mb-2">{sendError}</p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("typeMessage")}
              rows={1}
              disabled={loading || loadError}
              className="flex-1 min-w-0 resize-none bg-white/5 border border-nebula-line rounded-2xl px-4 py-2.5 text-sm text-nebula-ink placeholder:text-nebula-ink-soft/60 outline-none focus:border-nebula-magenta transition-colors disabled:opacity-60"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !draft.trim() || loading || loadError}
              className="flex-shrink-0 rounded-2xl px-5 py-2.5 text-xs font-bold disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                color: "#1A0E24",
                boxShadow: "var(--nebula-glow)",
              }}
            >
              {t("send")}
            </button>
          </div>
          {charsLeft <= 200 && (
            <p
              className="text-[10.5px] mt-1.5 text-right"
              style={{ color: charsLeft < 0 ? "#FF5C6C" : "var(--nebula-ink-soft)" }}
            >
              {t("charsLeft", { count: charsLeft })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}