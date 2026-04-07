// ==========================================
// Ana Sayfa - Kategori Bazlı Dinamik UI
// ==========================================

import { Suspense } from "react";
import { fetchAllNews } from "@/lib/news-fetcher";
import NewsList from "@/components/NewsList";
import SourceFilter from "@/components/SourceFilter";
import CategoryFilter from "@/components/CategoryFilter";
import { NewsListSkeleton } from "@/components/NewsCardSkeleton";
import { formatDateTurkish } from "@/lib/seo-utils";
import { NewsCategory, CATEGORY_INFO } from "@/lib/types";

// 5 dakikada bir revalidate (ISR - Incremental Static Regeneration)
export const revalidate = 300;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; q?: string; category?: string }>;
}) {
  const { source, q, category } = await searchParams;
  const allArticles = await fetchAllNews();

  let filtered = source
    ? allArticles.filter((a) => a.source === source)
    : allArticles;

  if (category && Object.keys(CATEGORY_INFO).includes(category)) {
    filtered = filtered.filter((a) => a.category === category);
  }

  if (q && q.trim()) {
    const lower = q.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.description.toLowerCase().includes(lower)
    );
  }

  const lastUpdated = allArticles.length > 0 ? allArticles[0].publishedAt : null;
  const activeCategory = category as NewsCategory | undefined;

  return (
    <div className="animate-fadeIn">
      {/* Sayfa Başlığı (Hero) */}
      <div className="mb-14">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-[0.2em]">Live Feed</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl max-w-4xl leading-[1.05] tracking-tight">
            {activeCategory ? (
              <>
                <span className="text-primary italic">{CATEGORY_INFO[activeCategory].label}</span>
              </>
            ) : (
              <>Smart <span className="text-primary italic">Market</span> News</>
            )}
          </h1>

          <p className="text-text-muted text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
            {activeCategory
              ? `Browse the latest ${CATEGORY_INFO[activeCategory].label.toLowerCase()} from trusted sources.`
              : "Real-time forex news and market data from trusted sources to power smarter trading decisions."}
          </p>

          <div className="flex flex-wrap items-center gap-8 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] bg-primary/20 flex items-center justify-center text-primary font-bold">5m</div>
              <div className="text-sm">
                <p className="font-extrabold text-ui-dark">Live Data</p>
                <p className="text-text-muted">Continuously Updated</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] bg-slate-100 flex items-center justify-center text-ui-dark font-bold">{allArticles.length}+</div>
              <div className="text-sm">
                <p className="font-extrabold text-ui-dark">Daily Articles</p>
                <p className="text-text-muted">From 6 Sources</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kategori Filtresi */}
      <Suspense fallback={null}>
        <CategoryFilter />
      </Suspense>

      {/* Kaynak Filtresi */}
      <Suspense fallback={null}>
        <SourceFilter />
      </Suspense>

      {/* Arama kutusu */}
      <form method="get" className="mb-8 flex gap-3">
        {source && <input type="hidden" name="source" value={source} />}
        {category && <input type="hidden" name="category" value={category} />}
        <input
          type="search"
          name="q"
          defaultValue={q || ""}
          placeholder="Search news... (EUR/USD, FOMC...)"
          className="flex-1 px-5 py-3 rounded-full border border-slate-200 text-sm font-medium text-ui-dark placeholder:text-slate-400 focus:outline-none focus:border-primary transition-colors"
        />
        <button type="submit" className="btn-primary px-6">Search</button>
      </form>

      {/* ===== NEWS GRID ===== */}
      <div className="relative min-h-[400px]">
        {filtered.length === 0 && (q || source || category) ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No Results Found</h2>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto text-sm">
              {q ? `No news matching "${q}"` : category ? "No news in this category yet." : "No news from this source."}
            </p>
            <a href="/" className="btn-primary">Clear Filters</a>
          </div>
        ) : (
          <Suspense fallback={<NewsListSkeleton count={6} />}>
            <NewsList articles={filtered} />
          </Suspense>
        )}
      </div>

      {/* ===== LAST UPDATED ===== */}
      {lastUpdated && (
        <p className="text-center text-[11px] text-slate-400 font-medium pt-4">
          Last updated {formatDateTurkish(lastUpdated)}
        </p>
      )}
    </div>
  );
}

