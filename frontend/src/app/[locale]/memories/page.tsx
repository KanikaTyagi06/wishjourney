"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

interface Memory {
  id: string;
  story: string;
  rating: number | null;
  is_public: boolean;
  wish: {
    id: string;
    title: string;
    category_name: string;
    completion_date: string;
  };
  photos: { id: string; image: string }[];
}

export default function MemoriesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("memories");

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    api
      .get("/memories/", { headers: authHeader() })
      .then((res) => setMemories(res.data))
      .catch(() => router.push(`/${locale}/login`))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openStory(index: number) {
    setActiveIndex(index);
    setPhotoIndex(0);
  }

  function closeStory() {
    setActiveIndex(null);
    setPhotoIndex(0);
  }

  function nextPhoto() {
    if (activeIndex === null) return;
    const mem = memories[activeIndex];
    if (photoIndex < mem.photos.length - 1) {
      setPhotoIndex((p) => p + 1);
    } else if (activeIndex < memories.length - 1) {
      setActiveIndex(activeIndex + 1);
      setPhotoIndex(0);
    } else {
      closeStory();
    }
  }

  function prevPhoto() {
    if (activeIndex === null) return;
    if (photoIndex > 0) {
      setPhotoIndex((p) => p - 1);
    } else if (activeIndex > 0) {
      const prevMem = memories[activeIndex - 1];
      setActiveIndex(activeIndex - 1);
      setPhotoIndex(Math.max(prevMem.photos.length - 1, 0));
    }
  }

  const activeMemory = activeIndex !== null ? memories[activeIndex] : null;
  const activePhoto = activeMemory?.photos[photoIndex];

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
      <AppNavbar active="memories" />

      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        <h1 className="font-heading text-2xl font-bold text-nebula-ink mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-nebula-ink-soft mb-7">
          {t("subtitle", { count: memories.length })}
        </p>

        {memories.length === 0 ? (
          <div
            className="rounded-2xl p-10 border border-nebula-line text-center"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <p className="text-sm text-nebula-ink-soft mb-1">
              {t("emptyState")}
            </p>
            <a
              href={`/${locale}/bucket-list`}
              className="text-xs font-semibold text-nebula-magenta hover:underline"
            >
              {t("emptyStateCta")}
            </a>
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-3">
            {memories.map((mem, i) => (
              <button
                key={mem.id}
                onClick={() => openStory(i)}
                className="flex flex-col items-center gap-2 flex-shrink-0 w-20"
              >
                <div
                  className="w-[76px] h-[76px] rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--nebula-magenta), var(--nebula-orange), var(--nebula-blue))",
                    padding: "3px",
                    boxShadow: "0 0 16px -4px rgba(224, 64, 158, 0.6)",
                  }}
                >
                  <div
                    className="w-full h-full rounded-full overflow-hidden"
                    style={{ border: "2.5px solid var(--nebula-bg)" }}
                  >
                    {mem.photos[0] ? (
                      <img
                        src={mem.photos[0].image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-lg"
                        style={{ background: "var(--nebula-surface-2)" }}
                      >
                        ✦
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[10.5px] text-nebula-ink text-center leading-tight line-clamp-2">
                  {mem.wish.title}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>

      {activeMemory && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full max-w-md h-full sm:h-[92vh] sm:rounded-2xl overflow-hidden bg-black">
            {/* progress segments */}
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1.5">
              {activeMemory.photos.length > 0
                ? activeMemory.photos.map((_, pIdx) => (
                    <div
                      key={pIdx}
                      className="h-[3px] flex-1 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.3)" }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: pIdx <= photoIndex ? "100%" : "0%",
                          background: "#fff",
                          transition: "width 0.2s",
                        }}
                      />
                    </div>
                  ))
                : (
                    <div
                      className="h-[3px] flex-1 rounded-full"
                      style={{ background: "#fff" }}
                    />
                  )}
            </div>

            {/* header */}
            <div className="absolute top-7 left-3 right-3 z-20 flex items-center justify-between">
              <div>
                <p className="text-white text-xs font-bold">
                  {activeMemory.wish.title}
                </p>
                <p className="text-white/70 text-[10px]">
                  {activeMemory.wish.category_name} ·{" "}
                  {activeMemory.wish.completion_date}
                </p>
              </div>
              <button
                onClick={closeStory}
                className="text-white/80 hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* image / tap zones */}
            <div className="relative w-full h-full flex items-center justify-center">
              {activePhoto ? (
                <img
                  src={activePhoto.image}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--nebula-magenta-soft), var(--nebula-orange-soft))",
                  }}
                >
                  <span className="text-5xl">✦</span>
                </div>
              )}
              <button
                onClick={prevPhoto}
                className="absolute left-0 top-0 h-full w-1/3"
                aria-label="Previous"
              />
              <button
                onClick={nextPhoto}
                className="absolute right-0 top-0 h-full w-1/3"
                aria-label="Next"
              />
            </div>

            {/* bottom overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 z-20 p-4 pt-14"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
              }}
            >
              {activeMemory.rating && (
                <p className="text-nebula-orange text-sm mb-1">
                  {"★".repeat(activeMemory.rating)}
                  <span className="text-white/30">
                    {"★".repeat(5 - activeMemory.rating)}
                  </span>
                </p>
              )}
              {activeMemory.story && (
                <p className="text-white text-sm leading-snug mb-3 line-clamp-3">
                  {activeMemory.story}
                </p>
              )}
              <a
                href={`/${locale}/memories/${activeMemory.id}`}
                className="inline-block text-xs font-bold px-4 py-2 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                  color: "#1A0E24",
                }}
              >
                {t("viewFullMemory")}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}