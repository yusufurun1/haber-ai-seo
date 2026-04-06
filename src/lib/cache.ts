// ==========================================
// Haber Cache Yönetimi
// Map tabanlı O(1) slug lookup + TTL + max boyut
// ==========================================

import type { NewsArticle } from "./types";

interface CacheStore {
  list: NewsArticle[];
  bySlug: Map<string, NewsArticle>;
  timestamp: number;
  isRefreshing: boolean;
}

const CACHE_TTL_MS =
  parseInt(process.env.REVALIDATE_SECONDS || "300") * 1000;

/** Maksimum cache boyutu */
const MAX_CACHE_SIZE = 1000;

/** 7 günden eski haberler cache'e alınmaz */
const MAX_AGE_DAYS = 7;

let store: CacheStore | null = null;

/** Cache hâlâ geçerli mi? */
export function isCacheValid(): boolean {
  return store !== null && Date.now() - store.timestamp < CACHE_TTL_MS;
}

/** Arka planda yenileme devam ediyor mu? */
export function isRefreshing(): boolean {
  return store?.isRefreshing ?? false;
}

export function setRefreshing(val: boolean): void {
  if (store) store.isRefreshing = val;
}

/** Sıralı haber listesini döndür */
export function getCachedList(): NewsArticle[] {
  return store?.list ?? [];
}

/** Slug'a göre O(1) arama */
export function getCachedBySlug(slug: string): NewsArticle | undefined {
  return store?.bySlug.get(slug);
}

/** Cache'i yeni makalelerle doldur */
export function setCache(articles: NewsArticle[]): void {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  const filtered = articles
    .filter((a) => {
      const ts = new Date(a.publishedAt).getTime();
      return !isNaN(ts) && ts >= cutoff;
    })
    .slice(0, MAX_CACHE_SIZE);

  const bySlug = new Map<string, NewsArticle>();
  for (const a of filtered) bySlug.set(a.slug, a);

  store = {
    list: filtered,
    bySlug,
    timestamp: Date.now(),
    isRefreshing: false,
  };
}

/** Tek bir makaleyi yerinde güncelle (lazy scraping için) */
export function updateArticleInCache(
  slug: string,
  updated: NewsArticle
): void {
  if (!store) return;
  store.bySlug.set(slug, updated);
  const idx = store.list.findIndex((a) => a.slug === slug);
  if (idx !== -1) store.list[idx] = updated;
}

/** Cache istatistikleri (health endpoint için) */
export function getCacheStats(): {
  size: number;
  ageSeconds: number;
  isRefreshing: boolean;
} {
  if (!store)
    return { size: 0, ageSeconds: -1, isRefreshing: false };
  return {
    size: store.list.length,
    ageSeconds: Math.floor((Date.now() - store.timestamp) / 1000),
    isRefreshing: store.isRefreshing,
  };
}
