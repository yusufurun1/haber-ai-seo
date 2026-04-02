// ==========================================
// Dinamik Sitemap Oluşturucu
// Google'ın haberleri hızlı indexlemesi için
// ==========================================

import { MetadataRoute } from "next";
import { fetchAllNews } from "@/lib/news-fetcher";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Haberleri çek
  const articles = await fetchAllNews();

  // Haber sayfaları için sitemap entry'leri
  const newsEntries = articles.map((article) => ({
    url: `${SITE_URL}/haber/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  // Ana sayfa
  const staticEntries = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "always" as const,
      priority: 1.0,
    },
  ];

  return [...staticEntries, ...newsEntries];
}
