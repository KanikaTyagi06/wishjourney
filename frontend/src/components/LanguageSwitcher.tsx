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
    <div className="flex items-center gap-1.5 border border-border-soft rounded-lg px-2 py-1.5">
      <span className="text-sm" aria-hidden="true">
        🌐
      </span>
      <select
        value={currentLocale}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Select language"
        className="text-xs bg-background outline-none cursor-pointer"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}