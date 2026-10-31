"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  CARD_BG,
  CARD_CLASS,
  FriendshipStatus,
  PRIMARY_BTN,
  RequestAction,
  SocialUser,
  Tag,
  UserAvatar,
  UserInfo,
} from "./shared";

const SEARCH_MIN_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 400;

interface FindTabProps {
  locale: string;
  // called after a successful action so the page can refresh counts and lists
  onChanged: () => Promise<void>;
}

export default function FindTab({ locale, onChanged }: FindTabProps) {
  const router = useRouter();
  const t = useTranslations("friends");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SocialUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const searchSeq = useRef(0);

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  async function runSearch(q: string) {
    const seq = ++searchSeq.current;
    setSearching(true);
    setSearchError(false);
    try {
      const res = await api.get("/social/users/search/", {
        params: { q },
        headers: authHeader(),
      });
      if (seq !== searchSeq.current) return; // a newer search replaced this one
      setResults(res.data);
      setSearched(true);
    } catch (err: any) {
      if (seq !== searchSeq.current) return;
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      setSearchError(true);
    } finally {
      if (seq === searchSeq.current) setSearching(false);
    }
  }

  useEffect(() => {
    const q = query.trim();
    if (q.length < SEARCH_MIN_LENGTH) {
      searchSeq.current++; // cancel any search still in flight
      setResults([]);
      setSearched(false);
      setSearching(false);
      setSearchError(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => runSearch(q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateResult(
    userId: string,
    status: FriendshipStatus,
    requestId: string | null,
  ) {
    setResults((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              friendship_status: status,
              request_id: status === "none" ? null : requestId,
            }
          : u,
      ),
    );
  }

  async function handleError(err: any) {
    if (err?.response?.status === 401) {
      router.push(`/${locale}/login`);
      return;
    }
    const code = err?.response?.data?.code;
    if (code === "user_not_found") {
      setError(t("userNotFound"));
    } else if (
      code === "request_not_found" ||
      code === "request_not_pending" ||
      code === "request_already_sent" ||
      code === "already_friends"
    ) {
      setError(t("requestGone"));
    } else {
      setError(t("actionError"));
    }
    // our view may be out of date: refresh everything
    await onChanged();
    const q = query.trim();
    if (q.length >= SEARCH_MIN_LENGTH) runSearch(q);
  }

  async function addFriend(user: SocialUser) {
    setBusyId(user.id);
    setError("");
    try {
      const res = await api.post(
        "/social/requests/",
        { receiver_id: user.id },
        { headers: authHeader() },
      );
      updateResult(user.id, res.data.friendship_status, res.data.id);
      await onChanged();
    } catch (err: any) {
      await handleError(err);
    } finally {
      setBusyId(null);
    }
  }

  async function requestAction(user: SocialUser, action: RequestAction) {
    if (!user.request_id) return;
    setBusyId(user.id);
    setError("");
    try {
      const res = await api.post(
        `/social/requests/${user.request_id}/${action}/`,
        {},
        { headers: authHeader() },
      );
      updateResult(user.id, res.data.friendship_status, res.data.id);
      await onChanged();
    } catch (err: any) {
      await handleError(err);
    } finally {
      setBusyId(null);
    }
  }

  const trimmedQuery = query.trim();
  const queryTooShort = trimmedQuery.length < SEARCH_MIN_LENGTH;

  return (
    <>
      <div className="relative mb-5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("findPlaceholder")}
          autoComplete="off"
          className="w-full bg-white/5 border border-nebula-line rounded-xl px-4 py-3 text-sm text-nebula-ink placeholder:text-nebula-ink-soft/60 outline-none focus:border-nebula-magenta transition-colors"
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-nebula-magenta border-t-transparent animate-spin" />
        )}
      </div>

      {error && <p className="text-xs text-[#FF5C6C] mb-4">{error}</p>}

      {queryTooShort ? (
        <div className={`${CARD_CLASS} p-10 text-center`} style={CARD_BG}>
          <p className="text-sm text-nebula-ink-soft">{t("findHint")}</p>
        </div>
      ) : searchError ? (
        <div className={`${CARD_CLASS} p-10 text-center`} style={CARD_BG}>
          <p className="text-sm text-[#FF5C6C] mb-3">{t("searchError")}</p>
          <button
            onClick={() => runSearch(trimmedQuery)}
            className="text-xs font-semibold px-5 py-2.5 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
          >
            {t("retry")}
          </button>
        </div>
      ) : searched && !searching && results.length === 0 ? (
        <div className={`${CARD_CLASS} p-10 text-center`} style={CARD_BG}>
          <p className="text-sm text-nebula-ink-soft">
            {t("noResults", { query: trimmedQuery })}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.map((user) => {
            const busy = busyId === user.id;
            return (
              <div
                key={user.id}
                className={`${CARD_CLASS} p-4 flex items-center gap-4`}
                style={CARD_BG}
              >
                <UserAvatar user={user} />
                <div className="flex-1 min-w-0">
                  <UserInfo user={user} />
                  {user.mutual_friends > 0 && (
                    <div className="mt-2">
                      <Tag tone="blue">
                        {t("mutualCount", { count: user.mutual_friends })}
                      </Tag>
                    </div>
                  )}
                </div>

                {user.friendship_status === "none" && (
                  <button
                    onClick={() => addFriend(user)}
                    disabled={busy}
                    className="flex-shrink-0 text-xs font-bold px-3.5 py-2 rounded-xl disabled:opacity-60"
                    style={PRIMARY_BTN}
                  >
                    {busy ? t("working") : t("addFriend")}
                  </button>
                )}

                {user.friendship_status === "request_sent" && (
                  <button
                    onClick={() => requestAction(user, "cancel")}
                    disabled={busy}
                    className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border border-nebula-line text-nebula-ink-soft hover:text-[#FF5C6C] hover:border-[#FF5C6C]/50 transition-colors disabled:opacity-60"
                  >
                    {busy ? t("working") : t("cancelRequest")}
                  </button>
                )}

                {user.friendship_status === "request_received" && (
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <button
                      onClick={() => requestAction(user, "accept")}
                      disabled={busy}
                      className="text-xs font-bold px-3.5 py-2 rounded-xl disabled:opacity-60"
                      style={PRIMARY_BTN}
                    >
                      {busy ? t("working") : t("accept")}
                    </button>
                    <button
                      onClick={() => requestAction(user, "reject")}
                      disabled={busy}
                      className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors disabled:opacity-60"
                    >
                      {t("reject")}
                    </button>
                  </div>
                )}

                {user.friendship_status === "friends" && (
                  <span
                    className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ color: "#4ADE80", background: "#4ADE8022" }}
                  >
                    ✓ {t("alreadyFriends")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}