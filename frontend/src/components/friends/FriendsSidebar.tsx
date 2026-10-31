"use client";

import { useTranslations } from "next-intl";
import {
  CARD_BG,
  PRIMARY_BTN,
  RequestAction,
  RequestItem,
  SocialUser,
  UserAvatar,
  displayName,
  locationText,
} from "./shared";

interface FriendsSidebarProps {
  incoming: RequestItem[];
  suggestions: SocialUser[];
  busyId: string | null;
  addingId: string | null;
  addedIds: string[];
  onRequestAction: (item: RequestItem, action: RequestAction) => void;
  onAdd: (user: SocialUser) => void;
  onSeeAll: () => void;
}

export default function FriendsSidebar({
  incoming,
  suggestions,
  busyId,
  addingId,
  addedIds,
  onRequestAction,
  onAdd,
  onSeeAll,
}: FriendsSidebarProps) {
  const t = useTranslations("friends");

  function requestReason(user: SocialUser): string {
    if (user.mutual_friends > 0) {
      return t("mutualCount", { count: user.mutual_friends });
    }
    return t("wantsToConnect");
  }

  function suggestionReason(user: SocialUser): string {
    if (user.mutual_friends > 0) {
      return t("mutualCount", { count: user.mutual_friends });
    }
    if (user.wishes_in_common > 0) {
      return t("wishesInCommon", { count: user.wishes_in_common });
    }
    if (user.same_city) return t("sameCity");
    return locationText(user) || t("suggestedGeneric");
  }

  const shownRequests = incoming.slice(0, 2);

  return (
    <div className="space-y-5">
      {/* friend requests */}
      <div className="rounded-2xl border border-nebula-line p-4" style={CARD_BG}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-nebula-ink-soft">
            {t("sidebarRequestsTitle", { count: incoming.length })}
          </span>
          {incoming.length > 0 && (
            <button
              onClick={onSeeAll}
              className="text-[11px] font-bold text-nebula-magenta hover:underline"
            >
              {t("seeAll")}
            </button>
          )}
        </div>

        {shownRequests.length === 0 ? (
          <p className="text-xs text-nebula-ink-soft">
            {t("noPendingRequests")}
          </p>
        ) : (
          <div className="space-y-4">
            {shownRequests.map((item) => (
              <div key={item.id}>
                <div className="flex items-center gap-3">
                  <UserAvatar user={item.user} size={38} />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-nebula-ink truncate">
                      {displayName(item.user)}
                    </p>
                    <p className="text-[11px] text-nebula-ink-soft truncate">
                      {requestReason(item.user)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => onRequestAction(item, "accept")}
                    disabled={busyId === item.id}
                    className="flex-1 rounded-full py-2 text-[11.5px] font-bold disabled:opacity-60"
                    style={PRIMARY_BTN}
                  >
                    {busyId === item.id ? t("working") : t("accept")}
                  </button>
                  <button
                    onClick={() => onRequestAction(item, "reject")}
                    disabled={busyId === item.id}
                    className="flex-1 rounded-full py-2 text-[11.5px] font-semibold border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors disabled:opacity-60"
                  >
                    {t("reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* people you may know */}
      <div className="rounded-2xl border border-nebula-line p-4" style={CARD_BG}>
        <span className="block text-[11px] font-extrabold uppercase tracking-wide text-nebula-ink-soft mb-3">
          {t("sidebarSuggestTitle")}
        </span>

        {suggestions.length === 0 ? (
          <p className="text-xs text-nebula-ink-soft">{t("noSuggestions")}</p>
        ) : (
          <div className="space-y-3.5">
            {suggestions.map((user) => {
              const added = addedIds.includes(user.id);
              return (
                <div key={user.id} className="flex items-center gap-3">
                  <UserAvatar user={user} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-nebula-ink truncate">
                      {displayName(user)}
                    </p>
                    <p className="text-[11px] text-nebula-ink-soft truncate">
                      {suggestionReason(user)}
                    </p>
                  </div>
                  {added ? (
                    <span
                      className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                      style={{ color: "#4ADE80", background: "#4ADE8022" }}
                    >
                      ✓ {t("requestSent")}
                    </span>
                  ) : (
                    <button
                      onClick={() => onAdd(user)}
                      disabled={addingId === user.id}
                      className="flex-shrink-0 text-[11px] font-bold px-3.5 py-1.5 rounded-full border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors disabled:opacity-60"
                    >
                      {addingId === user.id ? t("working") : t("add")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}