"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DefaultAvatar from "@/components/DefaultAvatar";
import {
  CARD_BG,
  CARD_CLASS,
  PRIMARY_BTN,
  Tag,
} from "@/components/friends/shared";

export interface CommunityPhoto {
  id: string;
  image: string;
  caption: string;
  order: number;
}

export interface CommunityAuthor {
  id: string;
  username: string;
  full_name: string;
  gender: string;
  profile_picture: string | null;
  is_friend: boolean;
  is_me: boolean;
}

export interface CommunityMemory {
  id: string;
  wish_title: string;
  category_name: string;
  completion_date: string | null;
  story: string;
  rating: number | null;
  lessons_learned: string;
  advice: string;
  photos: CommunityPhoto[];
  created_at: string;
  author: CommunityAuthor;
}

const STORY_PREVIEW_CHARS = 220;
const MAX_THUMBS = 4;

function formatDate(value: string | null, locale: string): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(
      locale === "hi" ? "hi-IN" : "en-IN",
      { day: "numeric", month: "short", year: "numeric" },
    );
  } catch {
    return "";
  }
}

function PhotoLightbox({
  photos,
  index,
  onChange,
  onClose,
}: {
  photos: CommunityPhoto[];
  index: number;
  onChange: (next: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("community");
  const total = photos.length;
  const photo = photos[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onChange((index - 1 + total) % total);
      if (e.key === "ArrowRight") onChange((index + 1) % total);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total, onChange, onClose]);

  if (!photo) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 bg-black/85 backdrop-blur-sm cursor-pointer"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("close")}
        className="absolute top-5 right-5 text-white/80 hover:text-white text-2xl leading-none"
      >
        ✕
      </button>

      <img
        src={photo.image}
        alt={photo.caption}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[78vh] rounded-2xl object-contain cursor-default"
      />

      {photo.caption && (
        <p className="mt-3 text-sm text-white/80 text-center max-w-md">
          {photo.caption}
        </p>
      )}
      <p className="mt-2 text-xs text-white/60">
        {index + 1} / {total}
      </p>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange((index - 1 + total) % total);
            }}
            aria-label={t("previous")}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg flex items-center justify-center transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange((index + 1) % total);
            }}
            aria-label={t("next")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg flex items-center justify-center transition-colors"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

interface MemoryCardProps {
  memory: CommunityMemory;
  locale: string;
  requestSent: boolean;
  adding: boolean;
  onAddFriend: (authorId: string) => void;
}

export default function MemoryCard({
  memory,
  locale,
  requestSent,
  adding,
  onAddFriend,
}: MemoryCardProps) {
  const t = useTranslations("community");
  const [expanded, setExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { author, photos } = memory;
  const authorName = author.full_name || `@${author.username}`;
  const completed = formatDate(memory.completion_date, locale);
  const rating = Math.min(Math.max(memory.rating ?? 0, 0), 5);

  const canExpand =
    memory.story.length > STORY_PREVIEW_CHARS ||
    !!memory.lessons_learned ||
    !!memory.advice;

  const thumbs = photos.slice(0, MAX_THUMBS);
  const extraPhotos = photos.length - MAX_THUMBS;

  return (
    <article className={`${CARD_CLASS} p-5`} style={CARD_BG}>
      {/* author */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
          style={{ border: "1.5px solid var(--nebula-line)" }}
        >
          {author.profile_picture ? (
            <img
              src={author.profile_picture}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <DefaultAvatar gender={author.gender} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-heading text-sm font-bold text-nebula-ink truncate">
            {authorName}
          </p>
          <p className="text-xs text-nebula-ink-soft truncate">
            {author.full_name ? `@${author.username} · ` : ""}
            {formatDate(memory.created_at, locale)}
          </p>
        </div>

        {author.is_me ? (
          <Tag tone="blue">{t("youTag")}</Tag>
        ) : author.is_friend ? (
          <span
            className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ color: "#4ADE80", background: "#4ADE8022" }}
          >
            ✓ {t("friendTag")}
          </span>
        ) : requestSent ? (
          <span
            className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full"
            style={{ color: "#4ADE80", background: "#4ADE8022" }}
          >
            ✓ {t("requestSent")}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onAddFriend(author.id)}
            disabled={adding}
            className="flex-shrink-0 text-[11px] font-bold px-3.5 py-1.5 rounded-full disabled:opacity-60"
            style={PRIMARY_BTN}
          >
            {adding ? t("working") : t("addFriend")}
          </button>
        )}
      </div>

      {/* the wish */}
      <h3 className="font-heading text-lg font-bold text-nebula-ink leading-snug">
        {memory.wish_title}
      </h3>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 mb-3">
        {memory.category_name && <Tag tone="orange">{memory.category_name}</Tag>}
        {completed && (
          <span className="text-xs text-nebula-ink-soft">
            {t("completedOn", { date: completed })}
          </span>
        )}
        {rating > 0 && (
          <span
            className="text-sm tracking-wide"
            style={{ color: "#FFC24B" }}
            aria-label={t("ratingLabel", { rating })}
          >
            {"★".repeat(rating)}
            <span style={{ opacity: 0.25 }}>{"★".repeat(5 - rating)}</span>
          </span>
        )}
      </div>

      {/* photos */}
      {thumbs.length > 0 && (
        <div
          className={`grid gap-2 mb-4 ${
            thumbs.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {thumbs.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className={`relative overflow-hidden rounded-xl border border-nebula-line ${
                thumbs.length === 1 ? "h-64" : "h-40"
              }`}
            >
              <img
                src={photo.image}
                alt={photo.caption}
                className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
              />
              {i === MAX_THUMBS - 1 && extraPhotos > 0 && (
                <span className="absolute inset-0 bg-black/55 flex items-center justify-center font-heading text-xl font-bold text-white">
                  {t("morePhotos", { count: extraPhotos })}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* story, lessons and advice */}
      {memory.story && (
        <p
          className={`text-sm text-nebula-ink leading-relaxed whitespace-pre-wrap break-words ${
            expanded ? "" : "line-clamp-4"
          }`}
        >
          {memory.story}
        </p>
      )}

      {expanded && memory.lessons_learned && (
        <div className="mt-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-nebula-ink-soft mb-1">
            {t("lessonsLabel")}
          </p>
          <p className="text-sm text-nebula-ink leading-relaxed whitespace-pre-wrap break-words">
            {memory.lessons_learned}
          </p>
        </div>
      )}

      {expanded && memory.advice && (
        <div className="mt-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-nebula-ink-soft mb-1">
            {t("adviceLabel")}
          </p>
          <p className="text-sm text-nebula-ink leading-relaxed whitespace-pre-wrap break-words">
            {memory.advice}
          </p>
        </div>
      )}

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs font-semibold text-nebula-magenta hover:underline"
        >
          {expanded ? t("readLess") : t("readMore")}
        </button>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          onChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  );
}