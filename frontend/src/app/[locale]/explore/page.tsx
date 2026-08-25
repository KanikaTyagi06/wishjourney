"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAccessToken } from "@/lib/auth";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";
import Stars from "@/components/Stars";
import { Input } from "@/components/ui/input";

const SOFT_BG = {
  background:
    "radial-gradient(140% 90% at 15% 0%, rgba(224, 64, 158, 0.16) 0%, transparent 55%), " +
    "radial-gradient(120% 80% at 100% 20%, rgba(255, 122, 69, 0.12) 0%, transparent 50%), " +
    "radial-gradient(120% 90% at 50% 110%, rgba(82, 113, 255, 0.15) 0%, transparent 55%), " +
    "var(--nebula-bg)",
};

interface Category {
  id: string;
  name: string;
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: Category;
  estimated_budget_min: number | null;
  estimated_budget_max: number | null;
  estimated_duration: string;
  difficulty_level: string;
  cover_image: string | null;
}

export default function ExplorePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("explore");

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");

  function authHeader() {
    return { Authorization: `Bearer ${getAccessToken()}` };
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }
    Promise.all([
      api.get("/wish-templates/", { headers: authHeader() }),
      api.get("/categories/", { headers: authHeader() }),
    ])
      .then(([templatesRes, categoriesRes]) => {
        setTemplates(templatesRes.data);
        setCategories(categoriesRes.data);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddToBucketList(templateId: string) {
    setAddingId(templateId);
    try {
      await api.post(
        "/wishes/",
        { source_template_id: templateId },
        { headers: authHeader() }
      );
      setAddedIds((prev) => new Set(prev).add(templateId));
      setToast(t("addedToast"));
      setTimeout(() => setToast(""), 2200);
    } catch {
      setToast(t("addError"));
      setTimeout(() => setToast(""), 2200);
    } finally {
      setAddingId(null);
    }
  }

  const filtered = templates.filter((tpl) => {
    const matchesCategory =
      activeCategory === "all" || tpl.category?.id === activeCategory;
    const matchesSearch = tpl.title
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen relative" style={SOFT_BG}>
      <Stars count={10} className="opacity-40" />
      <AppNavbar active="explore" />

      <main className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        <h1 className="font-heading text-2xl font-bold text-nebula-ink mb-1">
          {t("title")}
        </h1>
        <p className="text-sm text-nebula-ink-soft mb-6">{t("subtitle")}</p>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="bg-white/5 border-nebula-line text-nebula-ink placeholder:text-nebula-ink-soft/60 rounded-xl mb-5 focus-visible:border-nebula-magenta focus-visible:ring-nebula-magenta/30 max-w-sm"
        />

        <div className="flex gap-2 mb-7 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory("all")}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
            style={{
              background:
                activeCategory === "all" ? "var(--nebula-ink)" : "transparent",
              color:
                activeCategory === "all" ? "#1A0E24" : "var(--nebula-ink-soft)",
              border:
                activeCategory === "all"
                  ? "none"
                  : "1px solid var(--nebula-line)",
            }}
          >
            {t("filterAll")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
              style={{
                background:
                  activeCategory === cat.id
                    ? "var(--nebula-ink)"
                    : "transparent",
                color:
                  activeCategory === cat.id
                    ? "#1A0E24"
                    : "var(--nebula-ink-soft)",
                border:
                  activeCategory === cat.id
                    ? "none"
                    : "1px solid var(--nebula-line)",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-nebula-magenta border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl p-10 border border-nebula-line text-center"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            <p className="text-sm text-nebula-ink-soft">{t("emptyState")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tpl) => {
              const alreadyAdded = addedIds.has(tpl.id);
              return (
                <div
                  key={tpl.id}
                  className="rounded-2xl overflow-hidden border border-nebula-line flex flex-col"
                  style={{ background: "var(--nebula-surface-2)" }}
                >
                                    <div
                    className="h-24"
                    style={{
                      background: tpl.cover_image
                        ? `url(${tpl.cover_image}) center/cover no-repeat`
                        : "linear-gradient(135deg, var(--nebula-magenta-soft), var(--nebula-orange-soft))",
                    }}
                  />
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-nebula-magenta mb-1">
                      {tpl.category?.name}
                    </span>
                    <p className="text-sm font-semibold text-nebula-ink">
                      {tpl.title}
                    </p>
                    {tpl.description && (
                      <p className="text-xs text-nebula-ink-soft mt-1.5 line-clamp-2">
                        {tpl.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-nebula-ink-soft">
                      {(tpl.estimated_budget_min || tpl.estimated_budget_max) && (
                        <span>
                          ₹{tpl.estimated_budget_min ?? "?"}–
                          {tpl.estimated_budget_max ?? "?"}
                        </span>
                      )}
                      {tpl.estimated_duration && (
                        <span>{tpl.estimated_duration}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToBucketList(tpl.id)}
                      disabled={addingId === tpl.id || alreadyAdded}
                      className="mt-4 rounded-xl py-2.5 text-xs font-bold border-0 disabled:opacity-70"
                      style={{
                        background: alreadyAdded
                          ? "rgba(74,222,128,0.15)"
                          : "linear-gradient(90deg, var(--nebula-magenta), var(--nebula-orange))",
                        color: alreadyAdded ? "#4ADE80" : "#1A0E24",
                      }}
                    >
                      {alreadyAdded
                        ? t("added")
                        : addingId === tpl.id
                          ? t("adding")
                          : t("addToBucketList")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <p
            className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-nebula-line text-nebula-ink"
            style={{ background: "var(--nebula-surface-2)" }}
          >
            {toast}
          </p>
        </div>
      )}
    </div>
  );
}