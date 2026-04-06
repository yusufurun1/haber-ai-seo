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
export const CATEGORY_INFO: Record<NewsCategory, { label: string; icon: string }> = {
  technical: { label: "Technical Analysis", icon: "📊" },
  fundamental: { label: "Fundamental", icon: "📈" },
  market: { label: "Market News", icon: "📰" },
  crypto: { label: "Crypto", icon: "₿" },
  commodities: { label: "Commodities", icon: "🪙" },
  "central-banks": { label: "Central Banks", icon: "🏦" },
};

/** Haber kaynağı tipi */
export type NewsSource =
  | "cointelegraph"
  | "forexlive"
  | "financemagnates"
  | "coindesk"
  | "investing"
  | "bloomberg"
  | "cnbc"
  | "yahoo"
  | "guardian"
  | "ft"
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
