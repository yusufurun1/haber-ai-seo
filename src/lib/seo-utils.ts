// ==========================================
// SEO Yardımcı Fonksiyonlar
// Meta tag, Schema.org, sitemap yardımcıları
// ==========================================

import { NewsArticle, SEOMeta, NewsArticleSchema } from "./types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Forex Haber AI";

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
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.description,
    image: article.imageUrl || undefined,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
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
    articleSection: "Forex",
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
 */
function extractKeywords(text: string): string[] {
  const forexKeywords = [
    "forex",
    "döviz",
    "parite",
    "piyasa",
    "eur/usd",
    "usd/try",
    "gbp/usd",
    "usd/jpy",
    "altın",
    "xau/usd",
    "faiz",
    "merkez bankası",
    "fed",
    "ecb",
    "tcmb",
    "boj",
    "boe",
    "enflasyon",
    "gdp",
    "istihdam",
    "carry trade",
    "teknik analiz",
    "destek",
    "direnç",
    "trend",
    "volatilite",
    "dolar",
    "euro",
    "sterlin",
    "yen",
    "lira",
    "rekor",
    "yükseliş",
    "düşüş",
    "resesyon",
  ];

  const textLower = text.toLowerCase();
  const found = forexKeywords.filter((kw) => textLower.includes(kw));

  // Genel kategoriler ekle
  const baseKeywords = ["forex haberleri", "döviz piyasası", "forex analiz"];

  return Array.from(new Set([...baseKeywords, ...found])).slice(0, 10);
}

/**
 * Tarih formatla (SEO uyumlu)
 */
export function formatDateForSEO(dateString: string): string {
  return new Date(dateString).toISOString();
}

/**
 * Türkçe tarih formatla (kullanıcı gösterimi)
 */
export function formatDateTurkish(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Az önce";
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;

  return date.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
