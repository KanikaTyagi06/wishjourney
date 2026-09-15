"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import { Button } from "@/components/ui/button";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

interface Wish {
  id: string;
  title: string;
  category: { name: string };
}

export default function NewMemoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const wishId = searchParams.get("wish");
  const t = useTranslations("memories");

  const [wish, setWish] = useState<Wish | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [story, setStory] = useState("");
  const [rating, setRating] = useState(0);
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [advice, setAdvice] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    if (!wishId) {
      router.push(`/${locale}/bucket-list`);
      return;
    }
    api
      .get(`/wishes/${wishId}/`, { headers: authHeader() })
      .then((res) => setWish(res.data))
      .catch(() => router.push(`/${locale}/bucket-list`))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await api.post(
        "/memories/",
        {
          wish_id: wishId,
          story,
          rating: rating || null,
          lessons_learned: lessonsLearned,
          advice,
          is_public: isPublic,
        },
        { headers: authHeader() }
      );
      router.push(`/${locale}/memories/${res.data.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          t("createError")
      );
      setSubmitting(false);
    }
  }

  if (loading || !wish) {
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
      <AppNavbar active="memories" />

      <main className="max-w-2xl mx-auto px-6 py-8 relative z-10">
        <a
          href={`/${locale}/bucket-list/${wishId}`}
          className="text-xs text-nebula-ink-soft hover:text-nebula-ink mb-4 inline-block transition-colors"
        >
          {t("backToWish")}
        </a>

        <div
          className="rounded-2xl p-6 border border-nebula-line"
          style={{ background: "var(--nebula-surface-2)" }}
        >
          <p className="text-xs text-nebula-magenta font-semibold mb-1">
            {wish.category?.name}
          </p>
          <h1 className="font-heading text-xl font-bold text-nebula-ink mb-1">
            {t("createTitle")}
          </h1>
          <p className="text-sm text-nebula-ink-soft mb-6">{wish.title}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-nebula-ink-soft mb-2 block">
                {t("rating")}
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="text-2xl leading-none transition-transform hover:scale-110"
                    style={{
                      color:
                        n <= rating ? "var(--nebula-orange)" : "var(--nebula-line)",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("story")}
              </label>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={4}
                placeholder={t("storyPlaceholder")}
                className="w-full rounded-xl border border-nebula-line bg-white/5 px-3 py-2 text-sm text-nebula-ink placeholder:text-nebula-ink-soft/60 outline-none focus-visible:border-nebula-magenta resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("lessonsLearned")}
              </label>
              <textarea
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-nebula-line bg-white/5 px-3 py-2 text-sm text-nebula-ink outline-none focus-visible:border-nebula-magenta resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("advice")}
              </label>
              <textarea
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-nebula-line bg-white/5 px-3 py-2 text-sm text-nebula-ink outline-none focus-visible:border-nebula-magenta resize-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-nebula-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-[var(--nebula-magenta)]"
              />
              {t("makePublic")}
            </label>

            {error && (
              <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-5 text-sm font-bold border-0 text-[#1A0E24] disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                boxShadow: "0 8px 22px -8px rgba(224, 64, 158, 0.5)",
              }}
            >
              {submitting ? t("creating") : t("createAndAddPhotos")}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}