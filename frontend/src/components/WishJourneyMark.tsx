interface WishJourneyMarkProps {
  className?: string;
}

export default function WishJourneyMark({
  className = "w-7 h-7",
}: WishJourneyMarkProps) {
  return (
    <svg
      viewBox="0 0 76 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="wjLineGradient" x1="0" y1="0" x2="76" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5271FF" />
          <stop offset="25%" stopColor="#8A5FE0" />
          <stop offset="50%" stopColor="#E0409E" />
          <stop offset="75%" stopColor="#FF6F70" />
          <stop offset="100%" stopColor="#FF7A45" />
        </linearGradient>
      </defs>
      <polyline
        points="14,20 26,52 38,28 50,52 62,20"
        stroke="url(#wjLineGradient)"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="20" r="5.5" fill="#5271FF" />
      <circle cx="26" cy="52" r="5.5" fill="#8A5FE0" />
      <circle cx="38" cy="28" r="6.5" fill="#E0409E" />
      <circle cx="50" cy="52" r="5.5" fill="#FF6F70" />
      <circle cx="62" cy="20" r="5.5" fill="#FF7A45" />
    </svg>
  );
}