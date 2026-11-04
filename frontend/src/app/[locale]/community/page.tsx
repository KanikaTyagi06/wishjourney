"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import MemoryCard, {
  CommunityMemory,
} from "@/components/community/MemoryCard";
import { CARD_BG, CARD_CLASS } from "@/components/friends/shared";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

type Scope = "all" | "friends";

interface FeedResponse {
  results: CommunityMemory[];
  has_more: boolean;
  page: number;
}

export default function CommunityPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("community");

  const [scope, setScope] = useState<Scope>("all");
  const [items, setItems] = useState<CommunityMemory[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [ready, setReady] = useState(false); // first load finished
  const [loading, setLoading] = useState(true); // first load or tab switch
  const [loadError, setLoadError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);

  const [sentIds, setSentIds] = useState<string[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState("");

  const requestSeq = useRef(0);

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  async function fetchPage(
    targetScope: Scope,
    targetPage: number,
  ): Promise<FeedResponse> {
    const res = await api.get("/memories/community/", {
      params: { scope: targetScope, page: targetPage },
      headers: authHeader(),
    });
    return res.data;
  }

  // first page of a tab (also used when switching tabs)
  async function loadFirst(targetScope: Scope) {
    const seq = ++requestSeq.current;
    setLoading(true);
    setLoadError(false);
    setMoreError(false);
    try {
      const data = await fetchPage(targetScope, 1);
      if (seq !== requestSeq.current) return; // a newer request replaced this one
      setItems(data.results);
      setPage(1);
      setHasMore(data.has_more);
    } catch (err: any) {
      if (seq !== requestSeq.current) return;
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      setLoadError(true);
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setReady(true);
      }
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    const seq = requestSeq.current;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const data = await fetchPage(scope, page + 1);
      if (seq !== requestSeq.current) return;
      setItems((prev) => {
        const known = new Set(prev.map((m) => m.id));
        return [...prev, ...data.results.filter((m) => !known.has(m.id))];
      });
      setPage(page + 1);
      setHasMore(data.has_more);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    loadFirst("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchScope(next: Scope) {
    if (next === scope) return;
    setScope(next);
    setItems([]);
    setAddError("");
    loadFirst(next);
  }

  function markFriend(authorId: string) {
    setItems((prev) =>
      prev.map((m) =>
        m.author.id === authorId
          ? { ...m, author: { ...m.author, is_friend: true } }
          : m,
      ),
    );
  }

  async function addFriend(authorId: string) {
    setAddingId(authorId);
    setAddError("");
    try {
      const res = await api.post(
        "/social/requests/",
        { receiver_id: authorId },
        { headers: authHeader() },
      );
      if (res.data.friendship_status === "friends") {
        markFriend(authorId); // they had already asked us: now friends
      } else {
        setSentIds((prev) => [...prev, authorId]);
      }
      window.dispatchEvent(new Event("social-summary-changed"));
    } catch (err: any) {
      if (err?.response?.status === 401) {
        router.push(`/${locale}/login`);
        return;
      }
      const code = err?.response?.data?.code;
      if (code === "request_already_sent") {
        setSentIds((prev) => [...prev, authorId]);
      } else if (code === "already_friends") {
        markFriend(authorId);
      } else {
        setAddError(t("addError"));
      }
    } finally {
      setAddingId(null);
    }
  }

  const TABS: { key: Scope; label: string }[] = [
    { key: "all", label: t("tabEveryone") },
    { key: "friends", label: t("tabFriends") },
  ];

  if (!ready && loading) {
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
      <AppNavbar active="community" />

      <main className="max-w-3xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-nebula-ink mb-1">
            {t("title")}
          </h1>
          <p className="text-sm text-nebula-ink-soft">{t("subtitle")}</p>
        </div>

        {/* tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map((item) => {
            const active = scope === item.key;
            return (
              <button
                key={item.key}
                onClick={() => switchScope(item.key)}
                className={
                  active
                    ? "rounded-full px-4 py-2 text-xs font-bold"
                    : "rounded-full px-4 py-2 text-xs font-semibold border border-nebula-line text-nebula-ink-soft hover:text-nebula-ink hover:bg-white/5 transition-colors"
                }
                style={
                  active
                    ? { background: "var(--nebula-ink)", color: "#1A0E24" }
                    : undefined
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {addError && <p className="text-xs text-[#FF5C6C] mb-4">{addError}</p>}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-nebula-magenta border-t-transparent animate-spin" />
          </div>
        ) : loadError ? (
          <div className={`${CARD_CLASS} p-10 text-center`} style={CARD_BG}>
            <p className="text-sm text-[#FF5C6C] mb-3">{t("loadError")}</p>
            <button
              onClick={() => loadFirst(scope)}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
            >
              {t("retry")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className={`${CARD_CLASS} p-10 text-center`} style={CARD_BG}>
            <p className="text-sm text-nebula-ink-soft mb-3">
              {scope === "friends" ? t("emptyFriends") : t("emptyAll")}
            </p>
            <a
              href={
                scope === "friends"
                  ? `/${locale}/friends`
                  : `/${locale}/memories`
              }
              className="text-xs font-semibold text-nebula-magenta hover:underline"
            >
              {scope === "friends" ? t("emptyFriendsCta") : t("emptyAllCta")}
            </a>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                locale={locale}
                requestSent={sentIds.includes(memory.author.id)}
                adding={addingId === memory.author.id}
                onAddFriend={addFriend}
              />
            ))}

            {moreError && (
              <p className="text-xs text-[#FF5C6C] text-center">
                {t("loadError")}
              </p>
            )}

            {hasMore && (
              <div className="flex justify-center pt-1">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-xs font-semibold px-6 py-2.5 rounded-xl border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors disabled:opacity-60"
                >
                  {loadingMore ? t("loadingMore") : t("loadMore")}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}