// ==========================================
// SEO Yardımcı Fonksiyonlar
// Meta tag, Schema.org, sitemap yardımcıları
// ==========================================

import { NewsArticle, SEOMeta, NewsArticleSchema } from "./types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Forex Haber";

/**
 * Haber için SEO meta verileri oluşturur
 */
export function generateSEOMeta(article: NewsArticle): SEOMeta {
  // SEO için optimize edilmiş title (max 60 karakter)
  const seoTitle =
    article.title.length > 57
      ? article.title.slice(0, 57) + "..."
      : article.title;

  // Meta description (max 160 karakter)
  const description =
    article.description.length > 155
      ? article.description.slice(0, 155) + "..."
      : article.description;

  // Otomatik anahtar kelime çıkarma
  const keywords = extractKeywords(article.title + " " + article.description);

  return {
    title: `${seoTitle} | ${SITE_NAME}`,
    description,
    keywords,
    canonicalUrl: `${SITE_URL}/haber/${article.slug}`,
    ogImage: article.imageUrl,
    ogType: "article",
    articlePublishedTime: article.publishedAt,
    articleModifiedTime: article.publishedAt,
    articleAuthor: article.author || article.sourceName,
    articleSection: "Forex",
  };
}

/**
 * Schema.org NewsArticle yapısal verisi oluşturur
 * Google News ve zengin sonuçlar için kritik
 */
export function generateArticleSchema(
  article: NewsArticle
): NewsArticleSchema {
  const wordCount = article.content
    ? article.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").length
    : 0;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.description,
    image: article.imageUrl || undefined,
    thumbnailUrl: article.imageUrl || undefined,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    inLanguage: "en",
    wordCount: wordCount > 0 ? wordCount : undefined,
    author: {
      "@type": "Organization",
      name: article.sourceName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/haber/${article.slug}`,
    },
    url: `${SITE_URL}/haber/${article.slug}`,
    articleSection: article.seoMeta?.articleSection || "Forex",
    keywords: extractKeywords(article.title + " " + article.description),
  };
}

/**
 * Breadcrumb yapısal verisi (navigasyon için)
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * WebSite yapısal verisi (site geneli)
 */
export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: "Forex piyasası haberleri, AI destekli özetler ve piyasa analizleri",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/arama?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Metinden forex ile ilgili anahtar kelimeleri çıkarır
 * Para birimleri, ülkeler, kurumlar ve teknik terimler dahil
 */
function extractKeywords(text: string): string[] {
  const textLower = text.toLowerCase();

  const currencyPairs = [
    "eur/usd", "gbp/usd", "usd/jpy", "usd/try", "usd/chf",
    "aud/usd", "nzd/usd", "usd/cad", "xau/usd", "xag/usd",
    "btc/usd", "eur/gbp", "eur/jpy", "gbp/jpy",
  ];

  const currencies = [
    "dolar", "euro", "sterlin", "yen", "frank", "lira",
    "dollar", "pound", "franc", "ruble", "yuan", "renminbi",
    "altın", "gümüş", "petrol", "bitcoin", "ethereum",
  ];

  const institutions = [
    "fed", "ecb", "boj", "boe", "tcmb", "snb", "rba", "rbnz", "boc",
    "federal reserve", "european central bank", "bank of japan",
    "bank of england", "imf", "world bank", "bis",
    "merkez bankası", "hazine", "treasury",
  ];

  const countries = [
    "usa", "united states", "eurozone", "uk", "japan", "china",
    "türkiye", "turkey", "germany", "almanya", "france", "fransa",
    "russia", "rusya", "india", "hindistan", "australia", "avustralya",
  ];

  const economicTerms = [
    "faiz", "enflasyon", "gdp", "inflation", "interest rate",
    "cpi", "ppi", "nfp", "fomc", "gdp", "pmi", "ism",
    "carry trade", "swap", "hedge", "volatility", "volatilite",
    "teknik analiz", "fundamental", "rsi", "macd", "fibonacci",
    "destek", "direnç", "support", "resistance", "trend",
    "boğa piyasası", "ayı piyasası", "bull", "bear",
    "rekor", "yükseliş", "düşüş", "rallye", "rally",
    "resesyon", "recession", "stagflasyon", "stagflation",
  ];

  const all = [...currencyPairs, ...currencies, ...institutions, ...countries, ...economicTerms];
  const found = all.filter((kw) => textLower.includes(kw));
  const baseKeywords = ["forex haberleri", "döviz piyasası", "forex analiz"];

  return Array.from(new Set([...baseKeywords, ...found])).slice(0, 15);
}

/**
 * Tarih formatla (SEO uyumlu)
 */
export function formatDateForSEO(dateString: string): string {
  return new Date(dateString).toISOString();
}

/**
 * Format date for display (English)
 */
export function formatDateTurkish(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
