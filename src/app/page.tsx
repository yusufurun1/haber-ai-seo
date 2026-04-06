// ==========================================
// Ana Sayfa - Forex Haber Listesi
// SSR ile haber çekme (SEO uyumlu)
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

  // Source filtresi
  let filtered = source
    ? allArticles.filter((a) => a.source === source)
    : allArticles;

  // Kategori filtresi
  if (category && Object.keys(CATEGORY_INFO).includes(category)) {
    filtered = filtered.filter((a) => a.category === category);
  }

  // Arama filtresi
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
                <p className="text-text-muted">From 9 Sources</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kategori Filtresi - ActionForex Benzeri */}
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

      {/* Haber Listesi */}
      <div className="relative min-h-[400px]">
        {filtered.length === 0 && (q || source || category) ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-black text-ui-dark mb-3">No Results Found</h2>
            <p className="text-text-muted mb-8 max-w-sm mx-auto leading-relaxed">
              {q ? `No news found for "${q}"` : category ? `No news in this category yet.` : source ? `No news from "${source}"` : "No news found."}
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-colors"
            >
              Reset Filters
            </a>
          </div>
        ) : (
          <Suspense fallback={<NewsListSkeleton count={6} />}>
            <NewsList articles={filtered} />
          </Suspense>
        )}
      </div>

      {/* Son Güncelleme Zamanı */}
      {lastUpdated && (
        <p className="text-center text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-10">
          Last updated: {formatDateTurkish(lastUpdated)}
        </p>
      )}

      {/* Bilgilendirme Kartı */}
      <section className="mt-24 overflow-hidden rounded-[32px] bg-ui-dark p-10 md:p-16 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] -mr-48 -mt-48"></div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl text-white mb-8 tracking-tight">Why Follow Us?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-3">
                <h3 className="text-primary text-xl font-black italic uppercase tracking-wider">Speed</h3>
                <p className="text-slate-400 leading-relaxed">Analyze market movements in seconds and stay ahead of the competition.</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-primary text-xl font-black italic uppercase tracking-wider">Accuracy</h3>
                <p className="text-slate-400 leading-relaxed">Access the cleanest and most original data with our automated aggregation algorithms.</p>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[24px] text-white flex flex-col items-center text-center">
              <p className="text-5xl font-black mb-2 text-primary">{allArticles.length}+</p>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-[0.2em]">Daily Articles</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

