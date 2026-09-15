"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import axios from "axios";
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

interface Photo {
  id: string;
  image: string;
  caption: string;
}

interface Memory {
  id: string;
  story: string;
  rating: number | null;
  lessons_learned: string;
  advice: string;
  is_public: boolean;
  photos: Photo[];
  wish: {
    id: string;
    title: string;
    category_name: string;
    completion_date: string;
  };
}

export default function MemoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const memoryId = params.id as string;
  const t = useTranslations("memories");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState<string | null>(null);

  const [story, setStory] = useState("");
  const [rating, setRating] = useState(0);
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [advice, setAdvice] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  function loadMemory() {
    return api
      .get(`/memories/${memoryId}/`, { headers: authHeader() })
      .then((res) => {
        const m: Memory = res.data;
        setMemory(m);
        setStory(m.story || "");
        setRating(m.rating || 0);
        setLessonsLearned(m.lessons_learned || "");
        setAdvice(m.advice || "");
        setIsPublic(m.is_public);
      });
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    if (!memoryId || memoryId === "undefined") {
      router.push(`/${locale}/memories`);
      return;
    }
    loadMemory()
      .catch(() => router.push(`/${locale}/memories`))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoryId]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await axios.post(
        `http://127.0.0.1:8000/api/v1/memories/${memoryId}/photos/`,
        formData,
        { headers: { Authorization: `Bearer ${getAccessToken()}` } }
      );
      await loadMemory();
    } catch {
      setError(t("photoUploadError"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePhotoDelete(photoId: string) {
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/v1/memories/photos/${photoId}/`,
        { headers: { Authorization: `Bearer ${getAccessToken()}` } }
      );
      await loadMemory();
    } catch {
      setError(t("photoDeleteError"));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.patch(
        `/memories/${memoryId}/`,
        {
          story,
          rating: rating || null,
          lessons_learned: lessonsLearned,
          advice,
          is_public: isPublic,
        },
        { headers: authHeader() }
      );
      await loadMemory();
      setMode("view");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/memories/${memoryId}/`, { headers: authHeader() });
      router.push(`/${locale}/memories`);
    } catch {
      alert(t("deleteError"));
      setDeleting(false);
    }
  }

  if (loading || !memory) {
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
          href={`/${locale}/memories`}
          className="text-xs text-nebula-ink-soft hover:text-nebula-ink mb-4 inline-block transition-colors"
        >
          {t("backToMemories")}
        </a>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-nebula-magenta font-semibold">
              {memory.wish.category_name}
            </p>
            <h1 className="font-heading text-xl font-bold text-nebula-ink">
              {memory.wish.title}
            </h1>
            <p className="text-xs text-nebula-ink-soft mt-0.5">
              {memory.wish.completion_date}
            </p>
          </div>
          {mode === "view" && (
            <Button
              onClick={() => setMode("edit")}
              className="rounded-xl px-4 py-4 text-xs font-bold border-0 text-[#1A0E24]"
              style={{
                background:
                  "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
              }}
            >
              {t("editMemory")}
            </Button>
          )}
        </div>

        {error && (
          <p className="text-xs text-nebula-ink bg-destructive/20 border border-destructive/30 rounded-xl px-3 py-2 mb-4">
            {error}
          </p>
        )}
        {savedFlash && (
          <p className="text-xs text-[#4ADE80] bg-[#4ADE80]/10 border border-[#4ADE80]/30 rounded-xl px-3 py-2 mb-4">
            {t("saved")}
          </p>
        )}

        <div
          className="rounded-2xl p-5 border border-nebula-line mb-4"
          style={{ background: "var(--nebula-surface-2)" }}
        >
          <p className="text-xs text-nebula-ink-soft font-semibold mb-2">
            {t("photos")}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
            {memory.photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-xl overflow-hidden group"
              >
                <img
                  src={photo.image}
                  alt=""
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowFullPhoto(photo.image)}
                />
                <button
                  onClick={() => handlePhotoDelete(photo.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-nebula-line flex items-center justify-center text-nebula-ink-soft hover:border-nebula-magenta hover:text-nebula-magenta transition-colors"
            >
              {uploading ? (
                <div className="w-4 h-4 rounded-full border-2 border-nebula-magenta border-t-transparent animate-spin" />
              ) : (
                <span className="text-2xl">+</span>
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        {mode === "view" ? (
          <div
            className="rounded-2xl p-5 border border-nebula-line space-y-4"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            {memory.rating && (
              <div>
                <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                  {t("rating")}
                </p>
                <p className="text-lg text-nebula-orange">
                  {"★".repeat(memory.rating)}
                  <span className="text-nebula-ink-soft">
                    {"★".repeat(5 - memory.rating)}
                  </span>
                </p>
              </div>
            )}
            {memory.story && (
              <div>
                <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                  {t("story")}
                </p>
                <p className="text-sm text-nebula-ink leading-relaxed">
                  {memory.story}
                </p>
              </div>
            )}
            {memory.lessons_learned && (
              <div>
                <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                  {t("lessonsLearned")}
                </p>
                <p className="text-sm text-nebula-ink leading-relaxed">
                  {memory.lessons_learned}
                </p>
              </div>
            )}
            {memory.advice && (
              <div>
                <p className="text-[10px] text-nebula-ink-soft uppercase tracking-wide font-semibold mb-1">
                  {t("advice")}
                </p>
                <p className="text-sm text-nebula-ink leading-relaxed">
                  {memory.advice}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-nebula-line">
              <p className="text-sm text-nebula-ink-soft">
                {t("visibility")}
              </p>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  color: memory.is_public
                    ? "#4ADE80"
                    : "var(--nebula-ink-soft)",
                  background: memory.is_public
                    ? "#4ADE8022"
                    : "rgba(255,255,255,0.06)",
                }}
              >
                {memory.is_public ? t("public") : t("private")}
              </span>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setDeleteOpen(true)}
                className="text-xs font-semibold text-nebula-ink-soft hover:text-destructive transition-colors"
              >
                {t("deleteMemory")}
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="rounded-2xl p-5 border border-nebula-line space-y-4"
            style={{ background: "var(--nebula-surface-2)" }}
          >
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
                        n <= rating
                          ? "var(--nebula-orange)"
                          : "var(--nebula-line)",
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
                className="w-full rounded-xl border border-nebula-line bg-white/5 px-3 py-2 text-sm text-nebula-ink outline-none focus-visible:border-nebula-magenta resize-none"
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

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setMode("view")}
                className="text-xs font-semibold text-nebula-ink-soft hover:text-nebula-ink transition-colors"
              >
                {t("cancel")}
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
        )}
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
                {deleting ? t("deleting") : t("deleteMemory")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFullPhoto && (
        <div
          onClick={() => setShowFullPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <button
            onClick={() => setShowFullPhoto(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white text-2xl leading-none"
          >
            ✕
          </button>
          <img
            src={showFullPhoto}
            alt=""
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}