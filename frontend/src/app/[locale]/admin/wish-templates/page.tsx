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

const DIFFICULTY_OPTIONS = ["easy", "moderate", "challenging"] as const;

interface Category {
  id: string;
  name: string;
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: Category;
  estimated_budget_min: number | null;
  estimated_budget_max: number | null;
  estimated_duration: string;
  difficulty_level: string;
  is_published: boolean;
}

export default function AdminWishTemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("admin");

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      api.get("/wish-templates/", { headers: authHeader() }),
      api.get("/categories/", { headers: authHeader() }),
    ])
      .then(([templatesRes, categoriesRes]) => {
        setTemplates(templatesRes.data);
        setCategories(categoriesRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    api
      .get("/profiles/me/", { headers: authHeader() })
      .then((res) => {
        if (!res.data.is_staff) {
          setAuthorized(false);
        } else {
          setAuthorized(true);
          loadData();
        }
      })
      .catch(() => router.push(`/${locale}/login`))
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setTitle("");
    setCategoryId("");
    setDescription("");
    setBudgetMin("");
    setBudgetMax("");
    setDuration("");
    setDifficulty("");
    setIsPublished(true);
    setEditingId(null);
    setFormError("");
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(tpl: Template) {
    setTitle(tpl.title);
    setCategoryId(tpl.category?.id || "");
    setDescription(tpl.description || "");
    setBudgetMin(
      tpl.estimated_budget_min !== null ? String(tpl.estimated_budget_min) : ""
    );
    setBudgetMax(
      tpl.estimated_budget_max !== null ? String(tpl.estimated_budget_max) : ""
    );
    setDuration(tpl.estimated_duration || "");
    setDifficulty(tpl.difficulty_level || "");
    setIsPublished(tpl.is_published);
    setEditingId(tpl.id);
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    const payload = {
      title,
      category: categoryId,
      description,
      estimated_budget_min: budgetMin ? Number(budgetMin) : null,
      estimated_budget_max: budgetMax ? Number(budgetMax) : null,
      estimated_duration: duration,
      difficulty_level: difficulty || "",
      is_published: isPublished,
    };

    try {
      if (editingId) {
        await api.patch(`/wish-templates/${editingId}/`, payload, {
          headers: authHeader(),
        });
      } else {
        await api.post("/wish-templates/", payload, {
          headers: authHeader(),
        });
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setFormError(
        err.response?.data?.detail ||
          err.response?.data?.title?.[0] ||
          t("saveError")
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/wish-templates/${deleteTarget.id}/`, {
        headers: authHeader(),
      });
      setTemplates((prev) => prev.filter((tp) => tp.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert(t("deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  if (checking) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={SOFT_BG}
      >
        <div className="w-6 h-6 rounded-full border-2 border-nebula-magenta border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen relative" style={SOFT_BG}>
        <AppNavbar />
        <main className="max-w-md mx-auto px-6 py-20 text-center relative z-10">
          <h1 className="font-heading text-xl font-bold text-nebula-ink mb-2">
            {t("accessDeniedTitle")}
          </h1>
          <p className="text-sm text-nebula-ink-soft">
            {t("accessDeniedMessage")}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={SOFT_BG}>
      <Stars count={10} className="opacity-40" />
      <AppNavbar />

      <main className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-nebula-ink">
              {t("title")}
            </h1>
            <p className="text-sm text-nebula-ink-soft mt-1">
              {t("subtitle")}
            </p>
          </div>
          <Button
            onClick={openCreateForm}
            className="rounded-xl px-5 py-5 text-sm font-bold border-0 text-[#1A0E24]"
            style={{
              background:
                "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
              boxShadow: "0 8px 22px -8px rgba(224, 64, 158, 0.5)",
            }}
          >
            {t("addTemplate")}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-nebula-magenta border-t-transparent animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div
            className="rounded-2xl p-10 border border-nebula-line text-center"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <p className="text-sm text-nebula-ink-soft">{t("emptyState")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-2xl p-4 border border-nebula-line"
                style={{ background: "var(--nebula-surface-2)" }}
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                    style={{
                      color: tpl.is_published
                        ? "#4ADE80"
                        : "var(--nebula-ink-soft)",
                      background: tpl.is_published
                        ? "#4ADE8022"
                        : "rgba(255,255,255,0.06)",
                    }}
                  >
                    {tpl.is_published ? t("published") : t("unpublished")}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditForm(tpl)}
                      className="text-[10px] font-semibold text-nebula-ink-soft hover:text-nebula-ink transition-colors"
                    >
                      {t("edit")}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(tpl)}
                      className="text-[10px] font-semibold text-nebula-ink-soft hover:text-destructive transition-colors"
                    >
                      {t("delete")}
                    </button>
                  </div>
                </div>
                <p className="text-sm font-semibold text-nebula-ink">
                  {tpl.title}
                </p>
                <p className="text-xs text-nebula-ink-soft mt-0.5">
                  {tpl.category?.name}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-nebula-ink-soft">
                  {(tpl.estimated_budget_min || tpl.estimated_budget_max) && (
                    <span>
                      ₹{tpl.estimated_budget_min ?? "?"}–
                      {tpl.estimated_budget_max ?? "?"}
                    </span>
                  )}
                  {tpl.estimated_duration && <span>{tpl.estimated_duration}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl p-6 border border-nebula-line space-y-4"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <h3 className="font-heading text-lg font-bold text-nebula-ink">
              {editingId ? t("editTemplate") : t("addTemplate")}
            </h3>

            <div>
              <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("wishTitle")}
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-white/5 border-nebula-line text-nebula-ink rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
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
                  <option key={cat.id} value={cat.id} style={{ color: "#1A0E24" }}>
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
                  {t("budgetMin")}
                </Label>
                <Input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="bg-white/5 border-nebula-line text-nebula-ink rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
                />
              </div>
              <div>
                <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                  {t("budgetMax")}
                </Label>
                <Input
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="bg-white/5 border-nebula-line text-nebula-ink rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                  {t("duration")}
                </Label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 2 weeks"
                  className="bg-white/5 border-nebula-line text-nebula-ink placeholder:text-nebula-ink-soft/60 rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
                />
              </div>
              <div>
                <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                  {t("difficulty")}
                </Label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full h-9 rounded-xl border border-nebula-line bg-white/5 px-3 text-sm text-nebula-ink outline-none focus-visible:border-nebula-magenta"
                >
                  <option value="" style={{ color: "#1A0E24" }}>
                    —
                  </option>
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} style={{ color: "#1A0E24" }}>
                      {t(`difficulty_${opt}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-nebula-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-[var(--nebula-magenta)]"
              />
              {t("published")}
            </label>

            {formError && (
              <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-xs font-semibold text-nebula-ink-soft hover:text-nebula-ink transition-colors"
              >
                {t("cancel")}
              </button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl px-6 py-4 text-sm font-bold border-0 text-[#1A0E24] disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                }}
              >
                {submitting ? t("saving") : t("saveTemplate")}
              </Button>
            </div>
          </form>
        </div>
      )}

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