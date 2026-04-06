// ==========================================
// Kategori Filtresi - ActionForex benzeri menü
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

export default function CategoryFilter() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") as NewsCategory | null;
  const currentSource = searchParams.get("source");
  const currentQuery = searchParams.get("q");

  // URL oluşturma yardımcısı
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
      {/* Kategori Menüsü - Desktop */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-50/80 backdrop-blur-sm p-2 rounded-2xl border border-slate-100">
        <Link
          href={buildUrl(null)}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            !currentCategory
              ? "bg-primary text-white shadow-lg shadow-primary/25"
              : "text-slate-600 hover:bg-white hover:text-ui-dark hover:shadow-sm"
          }`}
        >
          All News
        </Link>
        
        {CATEGORIES.map((cat) => {
          const info = CATEGORY_INFO[cat];
          const isActive = currentCategory === cat;
          
          return (
            <Link
              key={cat}
              href={buildUrl(cat)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-slate-600 hover:bg-white hover:text-ui-dark hover:shadow-sm"
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Kategori Menüsü - Mobile (Yatay kaydırma) */}
      <nav className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex items-center gap-2 pb-2 min-w-max">
          <Link
            href={buildUrl(null)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              !currentCategory
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            All
          </Link>
          
          {CATEGORIES.map((cat) => {
            const info = CATEGORY_INFO[cat];
            const isActive = currentCategory === cat;
            
            return (
              <Link
                key={cat}
                href={buildUrl(cat)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Aktif filtre göstergesi */}
      {currentCategory && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-slate-400">Filtering by:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">
            {CATEGORY_INFO[currentCategory].icon} {CATEGORY_INFO[currentCategory].label}
            <Link
              href={buildUrl(null)}
              className="ml-1 hover:text-primary-hover"
              title="Clear filter"
            >
              ×
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}
