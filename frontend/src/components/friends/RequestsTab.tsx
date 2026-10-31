"use client";

import { useTranslations } from "next-intl";
import {
  CARD_BG,
  CARD_CLASS,
  PRIMARY_BTN,
  RequestAction,
  RequestItem,
  Tag,
  UserAvatar,
  UserInfo,
  formatDate,
} from "./shared";

interface RequestsTabProps {
  incoming: RequestItem[];
  outgoing: RequestItem[];
  busyId: string | null;
  actionError: string;
  locale: string;
  onAction: (item: RequestItem, action: RequestAction) => void;
  onFind: () => void;
}

export default function RequestsTab({
  incoming,
  outgoing,
  busyId,
  actionError,
  locale,
  onAction,
  onFind,
}: RequestsTabProps) {
  const t = useTranslations("friends");

  return (
    <>
      {actionError && (
        <p className="text-xs text-[#FF5C6C] mb-4">{actionError}</p>
      )}

      {incoming.length === 0 && outgoing.length === 0 ? (
        <div className={`${CARD_CLASS} p-10 text-center`} style={CARD_BG}>
          <p className="text-sm text-nebula-ink-soft mb-2">
            {t("emptyRequests")}
          </p>
          <button
            onClick={onFind}
            className="text-xs font-semibold text-nebula-magenta hover:underline"
          >
            {t("emptyFriendsCta")}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* received */}
          <section>
            <p className="text-xs font-semibold text-nebula-ink-soft uppercase tracking-wide mb-3">
              {t("receivedTitle", { count: incoming.length })}
            </p>
            {incoming.length === 0 ? (
              <p className="text-xs text-nebula-ink-soft">
                {t("emptyReceived")}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {incoming.map((item) => (
                  <div
                    key={item.id}
                    className={`${CARD_CLASS} p-4`}
                    style={CARD_BG}
                  >
                    <div className="flex items-start gap-4">
                      <UserAvatar user={item.user} />
                      <div className="flex-1 min-w-0">
                        <UserInfo
                          user={item.user}
                          extra={formatDate(item.created_at, locale)}
                        />
                        {item.user.mutual_friends > 0 && (
                          <div className="mt-2">
                            <Tag tone="blue">
                              {t("mutualCount", {
                                count: item.user.mutual_friends,
                              })}
                            </Tag>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => onAction(item, "reject")}
                        disabled={busyId === item.id}
                        className="flex-1 rounded-xl py-2.5 text-xs font-semibold border border-nebula-line text-nebula-ink hover:bg-white/5 transition-colors disabled:opacity-60"
                      >
                        {t("reject")}
                      </button>
                      <button
                        onClick={() => onAction(item, "accept")}
                        disabled={busyId === item.id}
                        className="flex-1 rounded-xl py-2.5 text-xs font-bold disabled:opacity-60"
                        style={PRIMARY_BTN}
                      >
                        {busyId === item.id ? t("working") : t("accept")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* sent */}
          <section>
            <p className="text-xs font-semibold text-nebula-ink-soft uppercase tracking-wide mb-3">
              {t("sentTitle", { count: outgoing.length })}
            </p>
            {outgoing.length === 0 ? (
              <p className="text-xs text-nebula-ink-soft">{t("emptySent")}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {outgoing.map((item) => (
                  <div
                    key={item.id}
                    className={`${CARD_CLASS} p-4 flex items-center gap-4`}
                    style={CARD_BG}
                  >
                    <UserAvatar user={item.user} />
                    <div className="flex-1 min-w-0">
                      <UserInfo
                        user={item.user}
                        extra={formatDate(item.created_at, locale)}
                      />
                    </div>
                    <button
                      onClick={() => onAction(item, "cancel")}
                      disabled={busyId === item.id}
                      className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-xl border border-nebula-line text-nebula-ink-soft hover:text-[#FF5C6C] hover:border-[#FF5C6C]/50 transition-colors disabled:opacity-60"
                    >
                      {busyId === item.id ? t("working") : t("cancelRequest")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}