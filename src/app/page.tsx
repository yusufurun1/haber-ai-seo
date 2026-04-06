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

export const revalidate = 300;

// Kategori bazlı gradient mapping (Tailwind JIT safe)
const HERO_GRADIENTS: Record<string, string> = {
  technical: "from-emerald-600 via-emerald-500 to-teal-500",
  fundamental: "from-blue-600 via-blue-500 to-indigo-500",
  market: "from-slate-700 via-slate-600 to-slate-500",
  crypto: "from-violet-600 via-violet-500 to-purple-500",
  commodities: "from-amber-600 via-amber-500 to-orange-500",
  "central-banks": "from-indigo-600 via-indigo-500 to-blue-500",
  default: "from-slate-900 via-slate-800 to-slate-700",
};

const HERO_ACCENT_DOT: Record<string, string> = {
  technical: "bg-emerald-400",
  fundamental: "bg-blue-400",
  market: "bg-slate-400",
  crypto: "bg-violet-400",
  commodities: "bg-amber-400",
  "central-banks": "bg-indigo-400",
  default: "bg-emerald-400",
};

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
  const cat = category as NewsCategory | undefined;
  const catInfo = cat ? CATEGORY_INFO[cat] : null;
  const heroGradient = HERO_GRADIENTS[cat || "default"];
  const dotColor = HERO_ACCENT_DOT[cat || "default"];

  return (
    <div className="animate-fadeIn space-y-8">

      {/* ===== HERO SECTION ===== */}
      <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${heroGradient} px-8 py-12 md:px-12 md:py-16`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        
        <div className="relative z-10">
          {/* Live indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full mb-6">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
            </span>
            <span className="text-[11px] font-semibold text-white/90 uppercase tracking-widest">Live Feed</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white max-w-3xl leading-[1.1] tracking-tight mb-4">
            {catInfo ? catInfo.label : "Market Intelligence"}
          </h1>

          {/* Subtitle */}
          <p className="text-white/70 text-base md:text-lg max-w-xl leading-relaxed mb-8">
            {catInfo
              ? catInfo.heroSubtitle
              : "Real-time news and analysis from trusted financial sources worldwide."}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl">
              <span className="text-2xl font-bold text-white">{filtered.length}</span>
              <span className="text-xs text-white/60 font-medium leading-tight">articles<br/>available</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl">
              <span className="text-2xl font-bold text-white">6</span>
              <span className="text-xs text-white/60 font-medium leading-tight">trusted<br/>sources</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl">
              <span className="text-2xl font-bold text-white">5m</span>
              <span className="text-xs text-white/60 font-medium leading-tight">refresh<br/>interval</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORY FILTER ===== */}
      <Suspense fallback={null}>
        <CategoryFilter />
      </Suspense>

      {/* ===== SOURCE FILTER + SEARCH ===== */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Suspense fallback={null}>
          <SourceFilter />
        </Suspense>

        <form method="get" className="w-full sm:w-auto sm:min-w-[320px]">
          {source && <input type="hidden" name="source" value={source} />}
          {category && <input type="hidden" name="category" value={category} />}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="search"
              name="q"
              defaultValue={q || ""}
              placeholder="Search news..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </form>
      </div>

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

