// ==========================================
// Forex Haber - TypeScript Tip Tanımları
// ==========================================

/** Haber kategorileri */
export type NewsCategory =
  | "technical"    // Teknik Analiz
  | "fundamental"  // Temel Analiz
  | "market"       // Piyasa Haberleri
  | "crypto"       // Kripto
  | "commodities"  // Emtia (Gold, Oil)
  | "central-banks"; // Merkez Bankaları

/** Kategori bilgileri */
export const CATEGORY_INFO: Record<NewsCategory, { label: string; shortLabel: string; color: string; bgColor: string; borderColor: string }> = {
  technical: { label: "Technical Analysis", shortLabel: "Technical", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" },
  fundamental: { label: "Fundamental Analysis", shortLabel: "Fundamental", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  market: { label: "Market News", shortLabel: "Markets", color: "text-slate-600", bgColor: "bg-slate-50", borderColor: "border-slate-200" },
  crypto: { label: "Crypto & Blockchain", shortLabel: "Crypto", color: "text-violet-600", bgColor: "bg-violet-50", borderColor: "border-violet-200" },
  commodities: { label: "Commodities", shortLabel: "Commodities", color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
  "central-banks": { label: "Central Banks", shortLabel: "Central Banks", color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
};

/** Haber kaynağı tipi */
export type NewsSource =
  | "cointelegraph"
  | "forexlive"
  | "financemagnates"
  | "coindesk"
  | "cnbc"
  | "guardian"
  | "demo";

/** Ham haber verisi (kaynaklardan çekilen) */
export interface RawNewsItem {
  title: string;
  description: string;
  content: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  source: string;
  sourceName: string;
  author: string | null;
  category?: NewsCategory;
}

/** İşlenmiş haber verisi (slug ile) */
export interface NewsArticle extends RawNewsItem {
  slug: string;
  category: NewsCategory;
  seoMeta?: SEOMeta;
}



/** SEO meta verileri */
export interface SEOMeta {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage: string | null;
  ogType: string;
  articlePublishedTime: string;
  articleModifiedTime: string;
  articleAuthor: string;
  articleSection: string;
}

/** Schema.org NewsArticle yapısal verisi */
export interface NewsArticleSchema {
  "@context": "https://schema.org";
  "@type": "NewsArticle";
  headline: string;
  description: string;
  image?: string;
  thumbnailUrl?: string;
  datePublished: string;
  dateModified: string;
  inLanguage?: string;
  wordCount?: number;
  url?: string;
  author: {
    "@type": "Organization" | "Person";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo?: {
      "@type": "ImageObject";
      url: string;
    };
  };
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  articleSection: string;
  keywords: string[];
}

/** API yanıt tipleri */
export interface NewsApiResponse {
  success: boolean;
  data: NewsArticle[];
  total: number;
  page: number;
  hasMore?: boolean;
  error?: string;
}

/** Kaynak istatistikleri */
export interface SourceStats {
  sourceCode: string;
  sourceName: string;
  count: number;
  latestAt: string;
}

/** Health endpoint yanıtı */
export interface HealthResponse {
  status: "ok" | "degraded";
  cache: {
    size: number;
    ageSeconds: number;
    isRefreshing: boolean;
  };
  circuitBreakers: Record<string, { failures: number; disabledUntilMs: number }>;
  scrapeStats: Record<string, { ok: number; fail: number; rate: string }>;
  timestamp: string;
}



/** NewsAPI.org yanıt yapısı */
export interface NewsAPIRawResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string;
  }>;
}

/** RSS Feed item yapısı */
export interface RSSFeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  isoDate?: string;
  enclosure?: {
    url?: string;
  };
}
