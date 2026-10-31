"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import FriendsTab from "@/components/friends/FriendsTab";
import FriendsSidebar from "@/components/friends/FriendsSidebar";
import RequestsTab from "@/components/friends/RequestsTab";
import FindTab from "@/components/friends/FindTab";
import {
  CARD_BG,
  CARD_CLASS,
  RequestAction,
  RequestItem,
  SocialUser,
  Summary,
  displayName,
} from "@/components/friends/shared";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

type Tab = "friends" | "requests" | "find";

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
  const [suggestions, setSuggestions] = useState<SocialUser[]>([]);

  const [removeTarget, setRemoveTarget] = useState<SocialUser | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  // silent = refresh without the full-screen spinner
  // keepSuggestions = leave the "People you may know" card as it is
  async function loadData(silent = false, keepSuggestions = false) {
    if (!silent) setLoading(true);
    setLoadError(false);
    try {
      const [summaryRes, friendsRes, incomingRes, outgoingRes, suggestionsRes] =
        await Promise.all([
          api.get("/social/summary/", { headers: authHeader() }),
          api.get("/social/friends/", { headers: authHeader() }),
          api.get("/social/requests/incoming/", { headers: authHeader() }),
          api.get("/social/requests/outgoing/", { headers: authHeader() }),
          // suggestions are a nice-to-have: never break the page because of them
          api
            .get("/social/suggestions/", { headers: authHeader() })
            .catch(() => ({ data: [] as SocialUser[] })),
        ]);
      setSummary(summaryRes.data);
      setFriends(friendsRes.data);
      setIncoming(incomingRes.data);
      setOutgoing(outgoingRes.data);
      if (!keepSuggestions) {
        setSuggestions(suggestionsRes.data);
        setAddedIds([]);
      }
      // tell the navbar to refresh its pending-requests badge
      if (silent) window.dispatchEvent(new Event("social-summary-changed"));
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

  // accept / reject / cancel from the Requests tab or the sidebar
  async function runRequestAction(item: RequestItem, action: RequestAction) {
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

  // "Add" button in the People you may know card
  async function addSuggestion(user: SocialUser) {
    setAddingId(user.id);
    try {
      await api.post(
        "/social/requests/",
        { receiver_id: user.id },
        { headers: authHeader() },
      );
      setAddedIds((prev) => [...prev, user.id]);
      await loadData(true, true);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      // anything else: the list is probably out of date, so refresh it
      await loadData(true);
    } finally {
      setAddingId(null);
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    setRemoveError(false);
    try {
      await api.delete(`/social/friends/${removeTarget.id}/`, {
        headers: authHeader(),
      });
      setFriends((prev) => prev.filter((f) => f.id !== removeTarget.id));
      setRemoveTarget(null);
      await loadData(true);
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

  function openTab(next: Tab) {
    setTab(next);
    setActionError("");
  }

  const TABS: { key: Tab; label: string; badge: number }[] = [
    { key: "friends", label: t("tabFriends"), badge: 0 },
    { key: "requests", label: t("tabRequests"), badge: summary.incoming },
    { key: "find", label: t("tabFind"), badge: 0 },
  ];

  const STATS: { label: string; value: number; target: Tab }[] = [
    { label: t("statFriends"), value: summary.friends, target: "friends" },
    { label: t("statRequests"), value: summary.incoming, target: "requests" },
    { label: t("statSent"), value: summary.outgoing, target: "requests" },
    {
      label: t("statNearby"),
      value: friends.filter((f) => f.same_city).length,
      target: "friends",
    },
  ];

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

      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        {/* header + tabs */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-nebula-ink mb-1">
              {t("title")}
            </h1>
            <p className="text-sm text-nebula-ink-soft">
              {t("subtitle", { count: summary.friends })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => openTab(item.key)}
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
        </div>

        {/* load error */}
        {loadError && (
          <div className={`${CARD_CLASS} p-10 text-center`} style={CARD_BG}>
            <p className="text-sm text-[#FF5C6C] mb-3">{t("loadError")}</p>
            <button
              onClick={() => loadData()}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
            >
              {t("retry")}
            </button>
          </div>
        )}

        {/* FRIENDS TAB: stats + map + list, with a sidebar on wide screens */}
        {!loadError && tab === "friends" && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_290px] gap-6">
            <div className="min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {STATS.map((stat) => (
                  <button
                    key={stat.label}
                    type="button"
                    onClick={() => openTab(stat.target)}
                    className={`${CARD_CLASS} px-4 py-3.5 text-left`}
                    style={CARD_BG}
                  >
                    <b className="block font-heading text-2xl text-nebula-ink leading-tight">
                      {stat.value}
                    </b>
                    <span className="text-[11px] text-nebula-ink-soft">
                      {stat.label}
                    </span>
                  </button>
                ))}
              </div>

              <FriendsTab
                friends={friends}
                locale={locale}
                onRemove={setRemoveTarget}
                onFind={() => openTab("find")}
              />
            </div>

            <aside className="min-w-0">
              <FriendsSidebar
                incoming={incoming}
                suggestions={suggestions}
                busyId={busyId}
                addingId={addingId}
                addedIds={addedIds}
                onRequestAction={runRequestAction}
                onAdd={addSuggestion}
                onSeeAll={() => openTab("requests")}
              />
            </aside>
          </div>
        )}

        {/* REQUESTS TAB */}
        {!loadError && tab === "requests" && (
          <RequestsTab
            incoming={incoming}
            outgoing={outgoing}
            busyId={busyId}
            actionError={actionError}
            locale={locale}
            onAction={runRequestAction}
            onFind={() => openTab("find")}
          />
        )}

        {/* FIND PEOPLE TAB */}
        {!loadError && tab === "find" && (
          <FindTab locale={locale} onChanged={() => loadData(true)} />
        )}
      </main>

      {/* remove friend confirmation modal */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-xs rounded-2xl p-5 border border-nebula-line text-center"
            style={CARD_BG}
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