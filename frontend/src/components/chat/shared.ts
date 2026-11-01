import type { SocialUser } from "@/components/friends/shared";

export const MAX_MESSAGE_LENGTH = 2000;

export interface ChatMessage {
  id: string;
  text: string;
  created_at: string;
  from_me: boolean;
}

export interface Conversation {
  user: SocialUser;
  last_message: ChatMessage | null;
  unread_count: number;
}

function intlLocale(locale: string): string {
  return locale === "hi" ? "hi-IN" : "en-IN";
}

export function formatClock(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleTimeString(intlLocale(locale), {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function formatShortDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(intlLocale(locale), {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export function formatLongDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(intlLocale(locale), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** Time for today's messages, short date for older ones (used in the chat list). */
export function formatListTime(iso: string, locale: string): string {
  const isToday = new Date(iso).toDateString() === new Date().toDateString();
  return isToday ? formatClock(iso, locale) : formatShortDate(iso, locale);
}

/** One key per calendar day, used to put day separators between messages. */
export function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

export function isYesterday(iso: string): boolean {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return new Date(iso).toDateString() === yesterday.toDateString();
}

/** True when timestamp `a` is later than timestamp `b`. */
export function isNewer(a: string, b: string): boolean {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (ta !== tb) return ta > tb;
  return a > b;
}

/** Add new messages to the list without duplicates, oldest first. */
export function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const known = new Set(current.map((m) => m.id));
  const added = incoming.filter((m) => !known.has(m.id));
  if (added.length === 0) return current;
  return [...current, ...added].sort((a, b) =>
    isNewer(a.created_at, b.created_at) ? 1 : -1,
  );
}

/** The newest created_at of `list`, or `current` if that is newer. */
export function latestCreatedAt(
  list: ChatMessage[],
  current: string | null,
): string | null {
  let latest = current;
  for (const message of list) {
    if (latest === null || isNewer(message.created_at, latest)) {
      latest = message.created_at;
    }
  }
  return latest;
}