interface DefaultAvatarProps {
  gender?: string;
  className?: string;
}

export default function DefaultAvatar({
  gender,
  className = "w-full h-full",
}: DefaultAvatarProps) {
  if (gender === "female") {
    return (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="100" r="46" fill="var(--nebula-magenta-soft)" />
        <path
          d="M50 14c-14 0-24 11-24 26 0 6 1 11 3 15-2 2-4 6-4 10 0 6 4 10 8 10 1 8 8 15 17 15s16-7 17-15c4 0 8-4 8-10 0-4-2-8-4-10 2-4 3-9 3-15 0-15-10-26-24-26z"
          fill="var(--nebula-magenta)"
        />
        <circle cx="50" cy="46" r="20" fill="#F6E9D8" />
      </svg>
    );
  }

  if (gender === "male") {
    return (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="100" r="46" fill="var(--nebula-blue-soft)" />
        <path
          d="M50 16c-13 0-22 10-22 23 0 3 0 6 1 9-3 1-5 4-5 4l2 2s2-2 4-3c1 3 2 6 4 8-1 8 5 16 16 16s17-8 16-16c2-2 3-5 4-8 2 1 4 3 4 3l2-2s-2-3-5-4c1-3 1-6 1-9 0-13-9-23-22-23z"
          fill="var(--nebula-blue)"
        />
        <circle cx="50" cy="47" r="19" fill="#F6E9D8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="50" fill="rgba(255,255,255,0.06)" />
      <circle cx="50" cy="40" r="17" fill="var(--nebula-ink-soft)" />
      <path
        d="M18 96c0-19 14-34 32-34s32 15 32 34"
        fill="var(--nebula-ink-soft)"
      />
    </svg>
  );
}