import type { CSSProperties, ReactNode } from "react";
import DefaultAvatar from "@/components/DefaultAvatar";

export type FriendshipStatus =
  | "none"
  | "friends"
  | "request_sent"
  | "request_received";

export interface SocialUser {
  id: string;
  username: string;
  full_name: string;
  gender: string;
  bio: string;
  city: string;
  country: string;
  profile_picture: string | null;
  friendship_status: FriendshipStatus;
  request_id: string | null;
  mutual_friends: number;
  wishes_in_common: number;
  same_city: boolean;
  friends_since: string | null;
}

export interface RequestItem {
  id: string;
  created_at: string;
  user: SocialUser;
}

export interface Summary {
  friends: number;
  incoming: number;
  outgoing: number;
}

export type RequestAction = "accept" | "reject" | "cancel";

// ring / filter colours: 0 mutual, 1 same wishes, 2 nearby, 3 everyone
export const GROUP_COLORS = ["#E0409E", "#FF7A45", "#5271FF", "#B0A3C4"];

/** 0 = mutual friends, 1 = same wishes, 2 = nearby, 3 = everyone */
export function inGroup(user: SocialUser, group: number): boolean {
  if (group === 0) return user.mutual_friends > 0;
  if (group === 1) return user.wishes_in_common > 0;
  if (group === 2) return user.same_city;
  return true;
}

export const CARD_CLASS =
  "rounded-2xl border border-nebula-line hover:border-nebula-magenta/30 transition-colors";

export const CARD_BG: CSSProperties = { background: "var(--nebula-surface-2)" };

export const PRIMARY_BTN: CSSProperties = {
  background:
    "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
  color: "#1A0E24",
  boxShadow: "var(--nebula-glow)",
};

export const TAG_STYLES = {
  magenta: { color: "#E0409E", background: "rgba(224, 64, 158, 0.18)" },
  orange: { color: "#FF7A45", background: "rgba(255, 122, 69, 0.18)" },
  blue: { color: "#9FB0FF", background: "rgba(82, 113, 255, 0.2)" },
};

export function displayName(user: SocialUser): string {
  return user.full_name || `@${user.username}`;
}

export function locationText(user: SocialUser): string {
  return [user.city, user.country].filter(Boolean).join(", ");
}

export function formatDate(value: string, locale: string): string {
  try {
    return new Date(value).toLocaleDateString(
      locale === "hi" ? "hi-IN" : "en-IN",
      { day: "numeric", month: "short", year: "numeric" },
    );
  } catch {
    return "";
  }
}

export function UserAvatar({
  user,
  size = 56,
}: {
  user: SocialUser;
  size?: number;
}) {
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0"
      style={{
        width: size,
        height: size,
        border: "1.5px solid var(--nebula-line)",
      }}
    >
      {user.profile_picture ? (
        <img
          src={user.profile_picture}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <DefaultAvatar gender={user.gender} />
      )}
    </div>
  );
}

export function UserInfo({
  user,
  extra,
}: {
  user: SocialUser;
  extra?: string;
}) {
  const location = locationText(user);
  return (
    <div className="min-w-0">
      <p className="font-heading text-sm font-bold text-nebula-ink truncate">
        {displayName(user)}
      </p>
      {/* the @handle gets its own line only when the line above is a real name */}
      {user.full_name && (
        <p className="text-xs text-nebula-ink-soft truncate">
          @{user.username}
        </p>
      )}
      {location && (
        <p className="text-xs text-nebula-ink-soft/80 truncate">{location}</p>
      )}
      {user.bio && (
        <p className="text-xs text-nebula-ink-soft mt-1 line-clamp-1">
          {user.bio}
        </p>
      )}
      {extra && (
        <p className="text-[11px] text-nebula-ink-soft/70 mt-1">{extra}</p>
      )}
    </div>
  );
}

export function Tag({
  children,
  tone,
}: {
  children: ReactNode;
  tone: keyof typeof TAG_STYLES;
}) {
  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={TAG_STYLES[tone]}
    >
      {children}
    </span>
  );
}