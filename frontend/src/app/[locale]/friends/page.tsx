"use client";

import { useEffect, useRef, useState } from "react";
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

const SEARCH_MIN_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 400;

type FriendshipStatus = "none" | "friends" | "request_sent" | "request_received";

interface SocialUser {
  id: string;
  username: string;
  full_name: string;
  gender: string;
  bio: string;
  city: string;
  country: string;
  profile_picture: string | null;
  friendship_status: FriendshipStatus;
  request_id: string | null;
}

interface RequestItem {
  id: string;
  created_at: string;
  user: SocialUser;
}

interface Summary {
  friends: number;
  incoming: number;
  outgoing: number;
}

type Tab = "friends" | "requests" | "find";
type RequestAction = "accept" | "reject" | "cancel";

function displayName(user: SocialUser) {
  return user.full_name || `@${user.username}`;
}

function locationText(user: SocialUser) {
  return [user.city, user.country].filter(Boolean).join(", ");
}

function UserAvatar({ user }: { user: SocialUser }) {
  return (
    <div
      className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0"
      style={{ border: "1.5px solid var(--nebula-line)" }}
    >
      {user.profile_picture ? (
        <img
          src={user.profile_picture}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <DefaultAvatar gender={user.gender} />
      )}
    </div>
  );
}

function UserInfo({
  user,
  extra,
}: {
  user: SocialUser;
  extra?: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="font-heading text-sm font-bold text-nebula-ink truncate">
        {displayName(user)}
      </p>
      <p className="text-xs text-nebula-ink-soft truncate">
        @{user.username}
        {locationText(user) ? ` · ${locationText(user)}` : ""}
      </p>
      {user.bio && (
        <p className="text-xs text-nebula-ink-soft mt-1 line-clamp-1">
          {user.bio}
        </p>
      )}
      {extra && (
        <p className="text-[11px] text-nebula-ink-soft/70 mt-1">{extra}</p>
      )}
    </div>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("friends");

  const [tab, setTab] = useState<Tab>("friends");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [summary, setSummary] = useState<Summary>({
    friends: 0,
    incoming: 0,
    outgoing: 0,
  });
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [incoming, setIncoming] = useState<RequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<RequestItem[]>([]);

  const [removeTarget, setRemoveTarget] = useState<SocialUser | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // Find people tab
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SocialUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [findBusyId, setFindBusyId] = useState<string | null>(null);
  const [findError, setFindError] = useState("");
  const searchSeq = useRef(0);

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  // silent = true refreshes data without the full-screen spinner
  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    setLoadError(false);
    try {
      const [summaryRes, friendsRes, incomingRes, outgoingRes] =
        await Promise.all([
          api.get("/social/summary/", { headers: authHeader() }),
          api.get("/social/friends/", { headers: authHeader() }),
          api.get("/social/requests/incoming/", { headers: authHeader() }),
          api.get("/social/requests/outgoing/", { headers: authHeader() }),
        ]);
      setSummary(summaryRes.data);
      setFriends(friendsRes.data);
      setIncoming(incomingRes.data);
      setOutgoing(outgoingRes.data);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Find people: debounced search ----

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

  async function handleFindError(err: any) {
    if (err?.response?.status === 401) {
      router.push(`/${locale}/login`);
      return;
    }
    const code = err?.response?.data?.code;
    if (code === "user_not_found") {
      setFindError(t("userNotFound"));
    } else if (
      code === "request_not_found" ||
      code === "request_not_pending" ||
      code === "request_already_sent" ||
      code === "already_friends"
    ) {
      setFindError(t("requestGone"));
    } else {
      setFindError(t("actionError"));
    }
    // Our view may be out of date: refresh everything.
    await loadData(true);
    const q = query.trim();
    if (q.length >= SEARCH_MIN_LENGTH) runSearch(q);
  }

  async function addFriend(user: SocialUser) {
    setFindBusyId(user.id);
    setFindError("");
    try {
      const res = await api.post(
        "/social/requests/",
        { receiver_id: user.id },
        { headers: authHeader() },
      );
      updateResult(user.id, res.data.friendship_status, res.data.id);
      await loadData(true);
    } catch (err: any) {
      await handleFindError(err);
    } finally {
      setFindBusyId(null);
    }
  }

  async function findRequestAction(user: SocialUser, action: RequestAction) {
    if (!user.request_id) return;
    setFindBusyId(user.id);
    setFindError("");
    try {
      const res = await api.post(
        `/social/requests/${user.request_id}/${action}/`,
        {},
        { headers: authHeader() },
      );
      updateResult(user.id, res.data.friendship_status, res.data.id);
      await loadData(true);
    } catch (err: any) {
      await handleFindError(err);
    } finally {
      setFindBusyId(null);
    }
  }

  // ---- Requests tab actions ----

  async function runAction(item: RequestItem, action: RequestAction) {
    setBusyId(item.id);
    setActionError("");
    try {
      await api.post(
        `/social/requests/${item.id}/${action}/`,
        {},
        { headers: authHeader() },
      );
      await loadData(true);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      const code = err?.response?.data?.code;
      if (code === "request_not_found" || code === "request_not_pending") {
        setActionError(t("requestGone"));
        await loadData(true);
      } else {
        setActionError(t("actionError"));
      }
    } finally {
      setBusyId(null);
    }
  }

  // ---- Remove friend ----

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    setRemoveError(false);
    try {
      await api.delete(`/social/friends/${removeTarget.id}/`, {
        headers: authHeader(),
      });
      setFriends((prev) => prev.filter((f) => f.id !== removeTarget.id));
      setSummary((prev) => ({
        ...prev,
        friends: Math.max(prev.friends - 1, 0),
      }));
      // keep the Find people results in sync too
      setResults((prev) =>
        prev.map((u) =>
          u.id === removeTarget.id
            ? { ...u, friendship_status: "none", request_id: null }
            : u,
        ),
      );
      setRemoveTarget(null);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      setRemoveError(true);
    } finally {
      setRemoving(false);
    }
  }

  function closeRemoveModal() {
    setRemoveTarget(null);
    setRemoveError(false);
  }

  function formatDate(value: string) {
    try {
      return new Date(value).toLocaleDateString(
        locale === "hi" ? "hi-IN" : "en-IN",
        { day: "numeric", month: "short", year: "numeric" },
      );
    } catch {
      return "";
    }
  }

  const TABS: { key: Tab; label: string; badge: number }[] = [
    { key: "friends", label: t("tabFriends"), badge: 0 },
    { key: "requests", label: t("tabRequests"), badge: summary.incoming },
    { key: "find", label: t("tabFind"), badge: 0 },
  ];

  const trimmedQuery = query.trim();
  const queryTooShort = trimmedQuery.length < SEARCH_MIN_LENGTH;

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
      <AppNavbar active="friends" />

      <main className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        <h1 className="font-heading text-2xl font-bold text-nebula-ink mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-nebula-ink-soft mb-6">
          {t("subtitle", { count: summary.friends })}
        </p>

        {/* tabs */}
        <div className="flex flex-wrap gap-2 mb-7">
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setTab(item.key);
                  setActionError("");
                  setFindError("");
                }}
                className={
                  active
                    ? "rounded-full px-4 py-2 text-xs font-bold flex items-center gap-2"
                    : "rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-2 border border-nebula-line text-nebula-ink-soft hover:text-nebula-ink hover:bg-white/5 transition-colors"
                }
                style={
                  active
                    ? { background: "var(--nebula-ink)", color: "#1A0E24" }
                    : undefined
                }
              >
                {item.label}
                {item.badge > 0 && (
                  <span
                    className="min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{
                      background: "var(--nebula-magenta)",
                      color: "#1A0E24",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* load error */}
        {loadError && (
          <div
            className="rounded-2xl p-10 border border-nebula-line text-center"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <p className="text-sm text-[#FF5C6C] mb-3">{t("loadError")}</p>
            <button
              onClick={() => loadData()}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
            >
              {t("retry")}
            </button>
          </div>
        )}

        {/* FRIENDS TAB */}
        {!loadError && tab === "friends" && (
          <>
            {friends.length === 0 ? (
              <div
                className="rounded-2xl p-10 border border-nebula-line text-center"
                style={{ background: "var(--nebula-surface-2)" }}
              >
                <p className="text-sm text-nebula-ink-soft mb-2">
                  {t("emptyFriends")}
                </p>
                <button
                  onClick={() => setTab("find")}
                  className="text-xs font-semibold text-nebula-magenta hover:underline"
                >
                  {t("emptyFriendsCta")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friends.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-2xl p-4 border border-nebula-line flex items-center gap-4"
                    style={{ background: "var(--nebula-surface-2)" }}
                  >
                    <UserAvatar user={user} />
                    <UserInfo user={user} />
                    <button
                      onClick={() => setRemoveTarget(user)}
                      className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border border-nebula-line text-nebula-ink-soft hover:text-[#FF5C6C] hover:border-[#FF5C6C]/50 transition-colors"
                    >
                      {t("remove")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* REQUESTS TAB */}
        {!loadError && tab === "requests" && (
          <>
            {actionError && (
              <p className="text-xs text-[#FF5C6C] mb-4">{actionError}</p>
            )}

            {incoming.length === 0 && outgoing.length === 0 ? (
              <div
                className="rounded-2xl p-10 border border-nebula-line text-center"
                style={{ background: "var(--nebula-surface-2)" }}
              >
                <p className="text-sm text-nebula-ink-soft mb-2">
                  {t("emptyRequests")}
                </p>
                <button
                  onClick={() => setTab("find")}
                  className="text-xs font-semibold text-nebula-magenta hover:underline"
                >
                  {t("emptyFriendsCta")}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* received */}
                <section>
                  <p className="text-xs font-semibold text-nebula-ink-soft uppercase tracking-wide mb-3">
                    {t("receivedTitle", { count: incoming.length })}
                  </p>
                  {incoming.length === 0 ? (
                    <p className="text-xs text-nebula-ink-soft">
                      {t("emptyReceived")}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {incoming.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl p-4 border border-nebula-line"
                          style={{ background: "var(--nebula-surface-2)" }}
                        >
                          <div className="flex items-center gap-4">
                            <UserAvatar user={item.user} />
                            <UserInfo
                              user={item.user}
                              extra={formatDate(item.created_at)}
                            />
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => runAction(item, "reject")}
                              disabled={busyId === item.id}
                              className="flex-1 rounded-xl py-2.5 text-xs font-semibold border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors disabled:opacity-60"
                            >
                              {t("reject")}
                            </button>
                            <button
                              onClick={() => runAction(item, "accept")}
                              disabled={busyId === item.id}
                              className="flex-1 rounded-xl py-2.5 text-xs font-bold disabled:opacity-60"
                              style={{
                                background:
                                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                                color: "#1A0E24",
                                boxShadow: "var(--nebula-glow)",
                              }}
                            >
                              {busyId === item.id ? t("working") : t("accept")}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* sent */}
                <section>
                  <p className="text-xs font-semibold text-nebula-ink-soft uppercase tracking-wide mb-3">
                    {t("sentTitle", { count: outgoing.length })}
                  </p>
                  {outgoing.length === 0 ? (
                    <p className="text-xs text-nebula-ink-soft">
                      {t("emptySent")}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {outgoing.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl p-4 border border-nebula-line flex items-center gap-4"
                          style={{ background: "var(--nebula-surface-2)" }}
                        >
                          <UserAvatar user={item.user} />
                          <UserInfo
                            user={item.user}
                            extra={formatDate(item.created_at)}
                          />
                          <button
                            onClick={() => runAction(item, "cancel")}
                            disabled={busyId === item.id}
                            className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border border-nebula-line text-nebula-ink-soft hover:text-[#FF5C6C] hover:border-[#FF5C6C]/50 transition-colors disabled:opacity-60"
                          >
                            {busyId === item.id
                              ? t("working")
                              : t("cancelRequest")}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}

        {/* FIND PEOPLE TAB */}
        {!loadError && tab === "find" && (
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

            {findError && (
              <p className="text-xs text-[#FF5C6C] mb-4">{findError}</p>
            )}

            {queryTooShort ? (
              <div
                className="rounded-2xl p-10 border border-nebula-line text-center"
                style={{ background: "var(--nebula-surface-2)" }}
              >
                <p className="text-sm text-nebula-ink-soft">{t("findHint")}</p>
              </div>
            ) : searchError ? (
              <div
                className="rounded-2xl p-10 border border-nebula-line text-center"
                style={{ background: "var(--nebula-surface-2)" }}
              >
                <p className="text-sm text-[#FF5C6C] mb-3">
                  {t("searchError")}
                </p>
                <button
                  onClick={() => runSearch(trimmedQuery)}
                  className="text-xs font-semibold px-5 py-2.5 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
                >
                  {t("retry")}
                </button>
              </div>
            ) : searched && !searching && results.length === 0 ? (
              <div
                className="rounded-2xl p-10 border border-nebula-line text-center"
                style={{ background: "var(--nebula-surface-2)" }}
              >
                <p className="text-sm text-nebula-ink-soft">
                  {t("noResults", { query: trimmedQuery })}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((user) => {
                  const busy = findBusyId === user.id;
                  return (
                    <div
                      key={user.id}
                      className="rounded-2xl p-4 border border-nebula-line flex items-center gap-4"
                      style={{ background: "var(--nebula-surface-2)" }}
                    >
                      <UserAvatar user={user} />
                      <UserInfo user={user} />

                      {user.friendship_status === "none" && (
                        <button
                          onClick={() => addFriend(user)}
                          disabled={busy}
                          className="flex-shrink-0 text-xs font-bold px-3.5 py-2 rounded-xl disabled:opacity-60"
                          style={{
                            background:
                              "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                            color: "#1A0E24",
                            boxShadow: "var(--nebula-glow)",
                          }}
                        >
                          {busy ? t("working") : t("addFriend")}
                        </button>
                      )}

                      {user.friendship_status === "request_sent" && (
                        <button
                          onClick={() => findRequestAction(user, "cancel")}
                          disabled={busy}
                          className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border border-nebula-line text-nebula-ink-soft hover:text-[#FF5C6C] hover:border-[#FF5C6C]/50 transition-colors disabled:opacity-60"
                        >
                          {busy ? t("working") : t("cancelRequest")}
                        </button>
                      )}

                      {user.friendship_status === "request_received" && (
                        <div className="flex-shrink-0 flex flex-col gap-2">
                          <button
                            onClick={() => findRequestAction(user, "accept")}
                            disabled={busy}
                            className="text-xs font-bold px-3.5 py-2 rounded-xl disabled:opacity-60"
                            style={{
                              background:
                                "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                              color: "#1A0E24",
                            }}
                          >
                            {busy ? t("working") : t("accept")}
                          </button>
                          <button
                            onClick={() => findRequestAction(user, "reject")}
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
                          style={{
                            color: "#4ADE80",
                            background: "#4ADE8022",
                          }}
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
        )}
      </main>

      {/* remove friend confirmation modal */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-xs rounded-2xl p-5 border border-nebula-line text-center"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <p className="text-sm font-semibold text-nebula-ink mb-1">
              {t("removeTitle")}
            </p>
            <p className="text-xs text-nebula-ink-soft mb-5">
              {t("removeConfirm", { name: displayName(removeTarget) })}
            </p>
            {removeError && (
              <p className="text-xs text-[#FF5C6C] mb-3">{t("removeError")}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={closeRemoveModal}
                disabled={removing}
                className="flex-1 rounded-xl py-2.5 text-xs font-semibold border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                {t("cancel")}
              </button>
              <button
                onClick={confirmRemove}
                disabled={removing}
                className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-60"
                style={{ background: "#FF5C6C" }}
              >
                {removing ? t("removing") : t("remove")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}