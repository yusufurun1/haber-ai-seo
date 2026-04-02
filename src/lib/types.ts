// ==========================================
// Forex Haber AI - TypeScript Tip Tanımları
// ==========================================

/** Haber kaynağı tipi */
export type NewsSource =
  | "newsapi"
  | "cointelegraph"
  | "forexlive"
  | "investing"
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
}

/** İşlenmiş haber verisi (slug ve AI özeti ile) */
export interface NewsArticle extends RawNewsItem {
  slug: string;
  expandedContent?: string;
  aiSummary?: AISummary;
  seoMeta?: SEOMeta;
}

/** AI tarafından üretilen özet ve analiz */
export interface AISummary {
  /** 2-3 cümlelik kısa özet */
  summary: string;
  /** Haberin piyasaya etkisi analizi */
  analysis: string;
  /** Etkilenen döviz çiftleri */
  affectedPairs: string[];
  /** Piyasa etkisi: pozitif, negatif, nötr */
  sentiment: "positive" | "negative" | "neutral";
  /** Genişletilmiş uzun makale içeriği (HTML formatında) */
  expandedArticle?: string;
  /** AI tarafından üretildiği tarih */
  generatedAt: string;
  /** Gerçek AI tarafından mı üretildi yoksa fallback mı */
  isAIGenerated: boolean;
  /** AI durumu: ready=hazır, busy=yoğun, error=hata */
  aiStatus: "ready" | "busy" | "error";
  /** Hata veya durum mesajı */
  statusMessage?: string;
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
  datePublished: string;
  dateModified: string;
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
  error?: string;
}

export interface AISummaryResponse {
  success: boolean;
  data: AISummary;
  error?: string;
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
