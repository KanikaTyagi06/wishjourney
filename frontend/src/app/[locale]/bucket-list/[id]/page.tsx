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

interface Wish {
  id: string;
  title: string;
  description: string;
  status: Status;
  category: { id: string; name: string };
  estimated_budget: number | null;
  actual_cost: number | null;
  target_date: string | null;
  completion_date: string | null;
  progress_percentage: number;
  priority: boolean;
  is_public: boolean;
  notes: string;
}

export default function WishDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const wishId = params.id as string;
  const t = useTranslations("wishDetail");
  const tStatus = useTranslations("wishStatus");

  const [wish, setWish] = useState<Wish | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<Status>("idea");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [progress, setProgress] = useState(0);
  const [priority, setPriority] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  function loadWish() {
    setLoading(true);
    api
      .get(`/wishes/${wishId}/`, { headers: authHeader() })
      .then((res) => {
        const w: Wish = res.data;
        setWish(w);
        setTitle(w.title);
        setStatus(w.status);
        setDescription(w.description || "");
        setNotes(w.notes || "");
        setEstimatedBudget(
          w.estimated_budget !== null ? String(w.estimated_budget) : ""
        );
        setActualCost(w.actual_cost !== null ? String(w.actual_cost) : "");
        setTargetDate(w.target_date || "");
        setProgress(w.progress_percentage || 0);
        setPriority(w.priority);
        setIsPublic(w.is_public);
      })
      .catch(() => router.push(`/${locale}/bucket-list`))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    loadWish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSaving(true);

    try {
      const res = await api.patch(
        `/wishes/${wishId}/`,
        {
          title,
          status,
          description,
          notes,
          estimated_budget: estimatedBudget ? Number(estimatedBudget) : null,
          actual_cost: actualCost ? Number(actualCost) : null,
          target_date: targetDate || null,
          progress_percentage: progress,
          priority,
          is_public: isPublic,
        },
        { headers: authHeader() }
      );
      setWish(res.data);
      setSuccessMsg(t("saved"));
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setError(err.response?.data?.detail || t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkCompleted() {
    setSaving(true);
    setError("");
    try {
      const res = await api.patch(
        `/wishes/${wishId}/`,
        {
          status: "completed",
          completion_date: new Date().toISOString().split("T")[0],
          progress_percentage: 100,
        },
        { headers: authHeader() }
      );
      setWish(res.data);
      setStatus("completed");
      setProgress(100);
      setSuccessMsg(t("markedCompleted"));
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/wishes/${wishId}/`, { headers: authHeader() });
      router.push(`/${locale}/bucket-list`);
    } catch {
      alert(t("deleteError"));
      setDeleting(false);
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
      <AppNavbar />

      <main className="max-w-2xl mx-auto px-6 py-8 relative z-10">
        <a
          href={`/${locale}/bucket-list`}
          className="text-xs text-nebula-ink-soft hover:text-nebula-ink mb-4 inline-block transition-colors"
        >
          {t("backToBucketList")}
        </a>

        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-nebula-magenta font-semibold">
            {wish.category?.name}
          </span>
          {wish.status !== "completed" && (
            <Button
              onClick={handleMarkCompleted}
              disabled={saving}
              className="rounded-full px-4 py-3.5 text-xs font-bold border-0 text-[#1A0E24] disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
              }}
            >
              {t("markAsCompleted")}
            </Button>
          )}
        </div>

        <form
          onSubmit={handleSave}
          className="rounded-2xl p-5 border border-nebula-line mt-4 space-y-4"
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
              className="bg-white/5 border-nebula-line text-nebula-ink rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("status")}
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full h-9 rounded-xl border border-nebula-line bg-white/5 px-3 text-sm text-nebula-ink outline-none focus-visible:border-nebula-magenta"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} style={{ color: "#1A0E24" }}>
                    {tStatus(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("progress")}
              </Label>
              <div className="mt-1.5">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      background:
                        "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                    }}
                  />
                </div>
                <p className="text-[11px] text-nebula-ink-soft mt-1.5">
                  {progress}% · {t("progressHelper")}
                </p>
              </div>
            </div>
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
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                placeholder="₹"
                className="bg-white/5 border-nebula-line text-nebula-ink placeholder:text-nebula-ink-soft/60 rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
              />
            </div>
           <div>
              <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
                {t("actualCost")}
              </Label>
              <Input
                type="number"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
                placeholder="₹"
                className="bg-white/5 border-nebula-line text-nebula-ink placeholder:text-nebula-ink-soft/60 rounded-xl focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30"
              />
              <p className="text-[10px] text-nebula-ink-soft/70 mt-1">
                {t("actualCostHelper")}
              </p>
            </div>
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

          <div>
            <Label className="text-xs text-nebula-ink-soft mb-1.5 block">
              {t("notes")}
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-nebula-line bg-white/5 px-3 py-2 text-sm text-nebula-ink outline-none focus-visible:border-nebula-magenta resize-none"
            />
          </div>

          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-xs text-nebula-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={priority}
                onChange={(e) => setPriority(e.target.checked)}
                className="accent-[var(--nebula-magenta)]"
              />
              {t("priorityWish")}
            </label>
            <label className="flex items-center gap-2 text-xs text-nebula-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-[var(--nebula-magenta)]"
              />
              {t("publicWish")}
            </label>
          </div>

          {error && (
            <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {successMsg && (
            <p className="text-xs text-[#4ADE80] bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl px-3 py-2">
              {successMsg}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="text-xs font-semibold text-nebula-ink-soft hover:text-destructive transition-colors"
            >
              {t("deleteWish")}
            </button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl px-6 py-4 text-sm font-bold border-0 text-[#1A0E24] disabled:opacity-60"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
              }}
            >
              {saving ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        </form>
      </main>

      {deleteOpen && (
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
                onClick={() => setDeleteOpen(false)}
                className="flex-1 rounded-xl py-2.5 text-xs font-semibold border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-60"
                style={{ background: "#FF5C6C" }}
              >
                {deleting ? t("deleting") : t("deleteWish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}