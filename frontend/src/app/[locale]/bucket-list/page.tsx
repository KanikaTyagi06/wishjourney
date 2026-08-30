"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

const STATUS_OPTIONS = [
  "idea",
  "saved",
  "planning",
  "in_progress",
  "completed",
  "paused",
  "cancelled",
  "archived",
] as const;

type Status = (typeof STATUS_OPTIONS)[number];

const STATUS_COLORS: Record<Status, string> = {
  idea: "var(--nebula-orange)",
  saved: "var(--nebula-blue)",
  planning: "var(--nebula-magenta)",
  in_progress: "var(--nebula-magenta)",
  completed: "#4ADE80",
  paused: "var(--nebula-ink-soft)",
  cancelled: "#FF5C6C",
  archived: "var(--nebula-ink-soft)",
};

interface Category {
  id: string;
  name: string;
}

interface Wish {
  id: string;
  title: string;
  description: string;
  status: Status;
  category: Category;
  estimated_budget: number | null;
  target_date: string | null;
  is_public: boolean;
  cover_image: string | null;
}

export default function BucketListPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("bucketList");
  const tStatus = useTranslations("wishStatus");

  const [wishes, setWishes] = useState<Wish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Status | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Wish | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [targetDate, setTargetDate] = useState("");

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      api.get("/wishes/", { headers: authHeader() }),
      api.get("/categories/", { headers: authHeader() }),
    ])
      .then(([wishesRes, categoriesRes]) => {
        setWishes(wishesRes.data);
        setCategories(categoriesRes.data);
      })
      .catch(() => router.push(`/${locale}/login`))
      .finally(() => setLoading(false));
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

  async function handleAddWish(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await api.post(
        "/wishes/",
        {
          title,
          category: categoryId,
          description,
          estimated_budget: budget ? Number(budget) : undefined,
          target_date: targetDate || undefined,
        },
        { headers: authHeader() }
      );
      setTitle("");
      setCategoryId("");
      setDescription("");
      setBudget("");
      setTargetDate("");
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setFormError(
        err.response?.data?.detail ||
          err.response?.data?.title?.[0] ||
          t("addError")
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/wishes/${deleteTarget.id}/`, {
        headers: authHeader(),
      });
      setWishes((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert(t("deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  const filteredWishes =
    activeFilter === "all"
      ? wishes
      : wishes.filter((w) => w.status === activeFilter);

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
      <AppNavbar />

      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-nebula-ink">
              {t("title")}
            </h1>
            <p className="text-sm text-nebula-ink-soft mt-1">
              {t("wishCount", { count: wishes.length })}
            </p>
          </div>
          <Button
            onClick={() => setShowForm((prev) => !prev)}
            className="rounded-xl px-5 py-5 text-sm font-bold border-0 text-[#1A0E24]"
            style={{
              background:
                "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
              boxShadow: "0 8px 22px -8px rgba(224, 64, 158, 0.5)",
            }}
          >
            {showForm ? t("cancel") : t("addWish")}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddWish}
            className="rounded-2xl p-5 border border-nebula-line mb-6 space-y-4"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <div>
              <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("wishTitle")}
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={t("wishTitlePlaceholder")}
                className="bg-white/5 border-nebula-line text-nebula-ink placeholder:text-nebula-ink-soft/60 rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
              />
            </div>

            <div>
              <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("category")}
              </Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full h-9 rounded-xl border border-nebula-line bg-white/5 px-3 text-sm text-nebula-ink outline-none focus-visible:border-nebula-magenta"
              >
                <option value="" style={{ color: "#1A0E24" }}>
                  {t("selectCategory")}
                </option>
                {categories.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    style={{ color: "#1A0E24" }}
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("description")}
              </Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-nebula-line bg-white/5 px-3 py-2 text-sm text-nebula-ink outline-none focus-visible:border-nebula-magenta resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                  {t("estimatedBudget")}
                </Label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="₹"
                  className="bg-white/5 border-nebula-line text-nebula-ink placeholder:text-nebula-ink-soft/60 rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
                />
              </div>
              <div>
                <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                  {t("targetDate")}
                </Label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="bg-white/5 border-nebula-line text-nebula-ink rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
                />
              </div>
            </div>

            {formError && (
              <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-6 py-4 text-sm font-bold border-0 text-[#1A0E24] disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
              }}
            >
              {submitting ? t("saving") : t("saveWish")}
            </Button>
          </form>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter("all")}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
            style={{
              background:
                activeFilter === "all" ? "var(--nebula-ink)" : "transparent",
              color:
                activeFilter === "all" ? "#1A0E24" : "var(--nebula-ink-soft)",
              border:
                activeFilter === "all"
                  ? "none"
                  : "1px solid var(--nebula-line)",
            }}
          >
            {t("filterAll")}
          </button>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
              style={{
                background:
                  activeFilter === status
                    ? "var(--nebula-ink)"
                    : "transparent",
                color:
                  activeFilter === status
                    ? "#1A0E24"
                    : "var(--nebula-ink-soft)",
                border:
                  activeFilter === status
                    ? "none"
                    : "1px solid var(--nebula-line)",
              }}
            >
              {tStatus(status)}
            </button>
          ))}
        </div>

        {filteredWishes.length === 0 ? (
          <div
            className="rounded-2xl p-10 border border-nebula-line text-center"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <p className="text-sm text-nebula-ink-soft">{t("emptyState")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWishes.map((wish) => (
              <div
                key={wish.id}
                onClick={() =>
                  router.push(`/${locale}/bucket-list/${wish.id}`)
                }
                className="rounded-2xl overflow-hidden border border-nebula-line cursor-pointer hover:border-nebula-magenta/40 transition-colors"
                style={{ background: "var(--nebula-surface-2)" }}
              >
                <div
                  className="h-24"
                  style={{
                    background: wish.cover_image
                      ? `url(${wish.cover_image}) center/cover no-repeat`
                      : "linear-gradient(135deg, var(--nebula-magenta-soft), var(--nebula-orange-soft))",
                  }}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                      style={{
                        color: STATUS_COLORS[wish.status],
                        backgroundColor: `${STATUS_COLORS[wish.status]}22`,
                      }}
                    >
                      {tStatus(wish.status)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(wish);
                      }}
                      className="text-[10px] font-semibold text-nebula-ink-soft hover:text-destructive border border-nebula-line hover:border-destructive/40 rounded-full px-2.5 py-1 transition-colors"
                    >
                      {t("delete")}
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-nebula-ink">
                    {wish.title}
                  </p>
                  <p className="text-xs text-nebula-ink-soft mt-0.5">
                    {wish.category?.name}
                  </p>
                  {(wish.estimated_budget || wish.target_date) && (
                    <div className="flex items-center gap-3 mt-3 text-xs text-nebula-ink-soft">
                      {wish.estimated_budget && (
                        <span>₹{wish.estimated_budget}</span>
                      )}
                      {wish.target_date && <span>{wish.target_date}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-xs rounded-2xl p-5 border border-nebula-line text-center"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <p className="text-sm font-semibold text-nebula-ink mb-1">
              {t("confirmDeleteTitle")}
            </p>
            <p className="text-xs text-nebula-ink-soft mb-5">
              {t("confirmDelete")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl py-2.5 text-xs font-semibold border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-60"
                style={{ background: "#FF5C6C" }}
              >
                {deleting ? t("deleting") : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}