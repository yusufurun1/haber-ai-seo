// ==========================================
// Kategori Filtresi - Profesyonel SVG ikonlu tasarım
// Haberleri kategoriye göre filtreler
// ==========================================

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { NewsCategory, CATEGORY_INFO } from "@/lib/types";

const CATEGORIES: NewsCategory[] = [
  "technical",
  "fundamental",
  "market",
  "crypto",
  "commodities",
  "central-banks",
];

// SVG ikonlar - her kategori için profesyonel ikon
function CategoryIcon({ category, className = "w-4 h-4" }: { category: NewsCategory | "all"; className?: string }) {
  switch (category) {
    case "all":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    case "technical":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "fundamental":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "market":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case "crypto":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727" />
        </svg>
      );
    case "commodities":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v12" /><path d="M6 12h12" /><circle cx="12" cy="12" r="4" />
        </svg>
      );
    case "central-banks":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="10" width="18" height="11" rx="1" /><path d="M12 2L2 10h20L12 2z" /><line x1="7" y1="14" x2="7" y2="17" /><line x1="12" y1="14" x2="12" y2="17" /><line x1="17" y1="14" x2="17" y2="17" />
        </svg>
      );
  }
}

// Aktif kategori renkleri
const ACTIVE_COLORS: Record<NewsCategory, string> = {
  technical: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25",
  fundamental: "bg-blue-600 text-white shadow-lg shadow-blue-600/25",
  market: "bg-slate-700 text-white shadow-lg shadow-slate-700/25",
  crypto: "bg-violet-600 text-white shadow-lg shadow-violet-600/25",
  commodities: "bg-amber-600 text-white shadow-lg shadow-amber-600/25",
  "central-banks": "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25",
};

const HOVER_COLORS: Record<NewsCategory, string> = {
  technical: "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200",
  fundamental: "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200",
  market: "hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300",
  crypto: "hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200",
  commodities: "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200",
  "central-banks": "hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200",
};

export default function CategoryFilter() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") as NewsCategory | null;
  const currentSource = searchParams.get("source");
  const currentQuery = searchParams.get("q");

  const buildUrl = (category: NewsCategory | null) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (currentSource) params.set("source", currentSource);
    if (currentQuery) params.set("q", currentQuery);
    const queryString = params.toString();
    return queryString ? `/?${queryString}` : "/";
  };

  return (
    <div className="mb-8">
      {/* Desktop */}
      <nav className="hidden md:block">
        <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Link
            href={buildUrl(null)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 border ${
              !currentCategory
                ? "bg-ui-dark text-white border-ui-dark shadow-lg shadow-ui-dark/20"
                : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-800 hover:border-slate-200"
            }`}
          >
            <CategoryIcon category="all" className="w-4 h-4" />
            All News
          </Link>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {CATEGORIES.map((cat) => {
            const info = CATEGORY_INFO[cat];
            const isActive = currentCategory === cat;

            return (
              <Link
                key={cat}
                href={buildUrl(cat)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 border ${
                  isActive
                    ? `${ACTIVE_COLORS[cat]} border-transparent`
                    : `text-slate-500 border-transparent ${HOVER_COLORS[cat]}`
                }`}
              >
                <CategoryIcon category={cat} className="w-4 h-4" />
                {info.shortLabel}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile */}
      <nav className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex items-center gap-2 pb-2 min-w-max">
          <Link
            href={buildUrl(null)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap border ${
              !currentCategory
                ? "bg-ui-dark text-white border-ui-dark shadow-md"
                : "bg-white text-slate-500 border-slate-200"
            }`}
          >
            <CategoryIcon category="all" className="w-3.5 h-3.5" />
            All
          </Link>

          {CATEGORIES.map((cat) => {
            const info = CATEGORY_INFO[cat];
            const isActive = currentCategory === cat;

            return (
              <Link
                key={cat}
                href={buildUrl(cat)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap border ${
                  isActive
                    ? `${ACTIVE_COLORS[cat]} border-transparent`
                    : `bg-white text-slate-500 border-slate-200`
                }`}
              >
                <CategoryIcon category={cat} className="w-3.5 h-3.5" />
                {info.shortLabel}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Aktif filtre göstergesi */}
      {currentCategory && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-slate-400">Filtering:</span>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${CATEGORY_INFO[currentCategory].bgColor} ${CATEGORY_INFO[currentCategory].color} border ${CATEGORY_INFO[currentCategory].borderColor}`}>
            <CategoryIcon category={currentCategory} className="w-3.5 h-3.5" />
            {CATEGORY_INFO[currentCategory].label}
            <Link
              href={buildUrl(null)}
              className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
              title="Clear filter"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}
