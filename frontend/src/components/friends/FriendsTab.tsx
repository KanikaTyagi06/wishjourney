"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import FriendsMap from "./FriendsMap";
import {
  CARD_BG,
  CARD_CLASS,
  SocialUser,
  Tag,
  UserAvatar,
  UserInfo,
  displayName,
  inGroup,
} from "./shared";

interface FriendsTabProps {
  friends: SocialUser[];
  locale: string;
  onRemove: (user: SocialUser) => void;
  onFind: () => void;
}

export default function FriendsTab({
  friends,
  locale,
  onRemove,
  onFind,
}: FriendsTabProps) {
  const t = useTranslations("friends");

  const [group, setGroup] = useState(3);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "recent">("name");
  const [menuId, setMenuId] = useState<string | null>(null);

  if (friends.length === 0) {
    return (
      <div className={`${CARD_CLASS} p-10 text-center`} style={CARD_BG}>
        <p className="text-sm text-nebula-ink-soft mb-2">
          {t("emptyFriends")}
        </p>
        <button
          onClick={onFind}
          className="text-xs font-semibold text-nebula-magenta hover:underline"
        >
          {t("emptyFriendsCta")}
        </button>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const visible = friends
    .filter((f) => inGroup(f, group))
    .filter((f) => !q || `${f.full_name} ${f.username}`.toLowerCase().includes(q))
    .sort((a, b) =>
      sort === "recent"
        ? (b.friends_since ?? "").localeCompare(a.friends_since ?? "")
        : displayName(a).toLowerCase().localeCompare(displayName(b).toLowerCase()),
    );

  return (
    <>
      <FriendsMap friends={friends} active={group} onSelect={setGroup} />

      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchFriends")}
          autoComplete="off"
          className="flex-1 min-w-0 bg-white/5 border border-nebula-line rounded-xl px-4 py-2.5 text-sm text-nebula-ink placeholder:text-nebula-ink-soft/60 outline-none focus:border-nebula-magenta transition-colors"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "name" | "recent")}
          aria-label={t("sortLabel")}
          className="flex-shrink-0 bg-white/5 border border-nebula-line rounded-xl px-3 py-2.5 text-xs font-semibold text-nebula-ink outline-none focus:border-nebula-magenta transition-colors"
          style={{ colorScheme: "dark" }}
        >
          <option value="name">{t("sortName")}</option>
          <option value="recent">{t("sortRecent")}</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className={`${CARD_CLASS} p-8 text-center`} style={CARD_BG}>
          <p className="text-sm text-nebula-ink-soft">
            {q ? t("noFriendsMatch", { query: search.trim() }) : t("noFriendsInGroup")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((user) => (
            <div
              key={user.id}
              className={`${CARD_CLASS} p-4 flex items-start gap-4`}
              style={CARD_BG}
            >
              <UserAvatar user={user} />

              <div className="flex-1 min-w-0">
                <UserInfo user={user} />
                {(user.wishes_in_common > 0 ||
                  user.mutual_friends > 0 ||
                  user.same_city) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {user.wishes_in_common > 0 && (
                      <Tag tone="orange">
                        {t("wishesInCommon", { count: user.wishes_in_common })}
                      </Tag>
                    )}
                    {user.mutual_friends > 0 && (
                      <Tag tone="blue">
                        {t("mutualCount", { count: user.mutual_friends })}
                      </Tag>
                    )}
                    {user.same_city && <Tag tone="magenta">{t("nearbyTag")}</Tag>}
                  </div>
                )}
              </div>

              <div className="relative flex-shrink-0 flex items-center gap-2">
                <a
                  href={`/${locale}/chat?with=${user.id}`}
                  className="text-xs font-bold px-4 py-2 rounded-full border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors"
                >
                  {t("message")}
                </a>
                <button
                  type="button"
                  onClick={() => setMenuId(menuId === user.id ? null : user.id)}
                  aria-label={t("moreActions")}
                  className="w-8 h-8 rounded-full border border-nebula-line text-nebula-ink-soft hover:text-nebula-ink hover:bg-white/5 transition-colors flex items-center justify-center"
                >
                  ⋯
                </button>

                {menuId === user.id && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setMenuId(null)}
                    />
                    <div
                      className="absolute right-0 top-full mt-1.5 z-30 min-w-[160px] rounded-xl border border-nebula-line p-1 shadow-xl"
                      style={{ background: "#1B1334" }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMenuId(null);
                          onRemove(user);
                        }}
                        className="w-full text-left text-xs font-semibold px-3 py-2 rounded-lg text-[#FF5C6C] hover:bg-white/5"
                      >
                        {t("removeFriend")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}