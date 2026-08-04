"use client";

import { useParams, usePathname, useRouter } from "next/navigation";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;

  function handleChange(newLocale: string) {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  }

  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-sm"
      style={{ backgroundColor: "var(--nebula-blue-soft)" }}
    >
      <span className="text-sm" aria-hidden="true">
        🌐
      </span>
      <div className="relative flex items-center">
        <select
          value={currentLocale}
          onChange={(e) => handleChange(e.target.value)}
          aria-label="Select language"
          className="text-xs font-semibold bg-transparent outline-none cursor-pointer appearance-none pr-4"
          style={{ color: "var(--nebula-magenta)" }}
        >
          {languages.map((lang) => (
            <option
              key={lang.code}
              value={lang.code}
              style={{ color: "#1A0E24" }}
            >
              {lang.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-0 text-[10px]"
          style={{ color: "var(--nebula-magenta)" }}
          aria-hidden="true"
        >
          ▾
        </span>
      </div>
    </div>
  );
}