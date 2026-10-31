"use client";

import { useTranslations } from "next-intl";
import {
  CARD_BG,
  GROUP_COLORS,
  SocialUser,
  displayName,
  inGroup,
} from "./shared";

const CX = 450;
const CY = 105;
const RING_RX = [120, 215, 320];
const RING_RY = [40, 70, 98];

// where friends sit on each ring (offsets from the centre)
const SPOTS: [number, number][][] = [
  [
    [-64, -20],
    [70, 26],
    [0, -40],
    [-26, 34],
  ],
  [
    [-150, -26],
    [150, -38],
    [170, 22],
    [-100, 60],
    [36, 70],
  ],
  [
    [-260, 8],
    [245, -26],
    [-205, -60],
    [270, 52],
    [-295, 60],
    [105, -92],
  ],
];

interface FriendsMapProps {
  friends: SocialUser[];
  active: number; // 0, 1, 2 = one ring, 3 = everyone
  onSelect: (group: number) => void;
}

export default function FriendsMap({
  friends,
  active,
  onSelect,
}: FriendsMapProps) {
  const t = useTranslations("friends");

  const labels = [
    t("groupMutual"),
    t("groupWishes"),
    t("groupNearby"),
    t("groupAll"),
  ];
  const members = [0, 1, 2].map((i) => friends.filter((f) => inGroup(f, i)));
  const counts = [
    members[0].length,
    members[1].length,
    members[2].length,
    friends.length,
  ];

  function toggle(group: number) {
    onSelect(active === group ? 3 : group);
  }

  return (
    <div
      className="rounded-2xl border border-nebula-line p-4 mb-5"
      style={CARD_BG}
    >
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-nebula-ink-soft">
          {t("mapTitle")}
        </span>
        <span className="text-[11px] text-nebula-ink-soft text-right">
          {t("mapHint")}
        </span>
      </div>

      <svg viewBox="0 0 900 210" className="w-full h-auto" role="img">
        <defs>
          <radialGradient id="friends-map-glow">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.4" stopColor="#E0409E" />
            <stop offset="1" stopColor="#E0409E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* rings, outer first so the inner ones sit on top */}
        {[2, 1, 0].map((i) => {
          const on = active === 3 || active === i;
          return (
            <g key={`ring-${i}`}>
              <ellipse
                cx={CX}
                cy={CY}
                rx={RING_RX[i]}
                ry={RING_RY[i]}
                fill="none"
                stroke={GROUP_COLORS[i]}
                strokeWidth={on && active !== 3 ? 2.4 : 1.2}
                strokeOpacity={on ? 0.55 : 0.14}
                strokeDasharray={i > 0 ? "4 6" : undefined}
              />
              {/* wider invisible stroke so thin rings are easy to click */}
              <ellipse
                cx={CX}
                cy={CY}
                rx={RING_RX[i]}
                ry={RING_RY[i]}
                fill="none"
                stroke="transparent"
                strokeWidth={18}
                pointerEvents="stroke"
                style={{ cursor: "pointer" }}
                onClick={() => toggle(i)}
              />
            </g>
          );
        })}

        {/* friends sitting on their rings */}
        {[0, 1, 2].map((i) => {
          const on = active === 3 || active === i;
          const shown = members[i].slice(0, SPOTS[i].length);
          const rest = members[i].length - shown.length;
          return (
            <g
              key={`dots-${i}`}
              style={{ cursor: "pointer" }}
              onClick={() => toggle(i)}
            >
              {shown.map((friend, j) => {
                const color = GROUP_COLORS[(i + j) % 3];
                return (
                  <circle
                    key={friend.id}
                    cx={CX + SPOTS[i][j][0]}
                    cy={CY + SPOTS[i][j][1] * 0.85}
                    r={10.5 - i * 1.4}
                    fill={color}
                    opacity={on ? 0.95 : 0.25}
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                  >
                    <title>{displayName(friend)}</title>
                  </circle>
                );
              })}
              {rest > 0 && (
                <g>
                  <rect
                    x={CX + RING_RX[i] * 0.7 - 22}
                    y={CY - RING_RY[i] * 0.72 - 11}
                    width={44}
                    height={22}
                    rx={11}
                    fill="#1B1334"
                    stroke={GROUP_COLORS[i]}
                    strokeOpacity={on ? 0.9 : 0.3}
                  />
                  <text
                    x={CX + RING_RX[i] * 0.7}
                    y={CY - RING_RY[i] * 0.72 + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={700}
                    fill="#F6F2FA"
                    opacity={on ? 1 : 0.5}
                  >
                    +{rest}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* you, in the middle */}
        <circle cx={CX} cy={CY} r={38} fill="url(#friends-map-glow)" />
        <circle cx={CX} cy={CY} r={16} fill="#fff" />
        <text
          x={CX}
          y={CY + 4}
          textAnchor="middle"
          fontSize={10}
          fontWeight={800}
          fill="#1A0E24"
        >
          {t("mapYou")}
        </text>
      </svg>

      <div className="flex flex-wrap justify-center gap-2 mt-1">
        {labels.map((label, i) => {
          const on = active === i;
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggle(i)}
              className="flex items-center gap-2 text-[11.5px] font-semibold px-3.5 py-1.5 rounded-full border transition-colors"
              style={{
                color: on ? "var(--nebula-ink)" : "var(--nebula-ink-soft)",
                background: on
                  ? "var(--nebula-magenta-soft)"
                  : "rgba(255,255,255,0.04)",
                borderColor: on
                  ? "rgba(224, 64, 158, 0.5)"
                  : "var(--nebula-line)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: GROUP_COLORS[i],
                  boxShadow: `0 0 6px ${GROUP_COLORS[i]}`,
                }}
              />
              {label}
              <b className="text-nebula-ink">{counts[i]}</b>
            </button>
          );
        })}
      </div>
    </div>
  );
}