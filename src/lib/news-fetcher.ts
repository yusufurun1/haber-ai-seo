// ==========================================
// Haber Çekme ve İşleme Servisi
// - RSS kaynakları (circuit breaker ile)
// - Paralel feed (Promise.allSettled)
// - Map tabanlı O(1) slug lookup
// ==========================================

import Parser from "rss-parser";
import { NewsArticle, RawNewsItem, NewsCategory, CATEGORY_INFO } from "./types";
import {
  isCacheValid,
  getCachedList,
  getCachedBySlug,
  setCache,
  updateArticleInCache,
  isRefreshing,
  setRefreshing,
} from "./cache";
import {
  scrapeArticlePage,
  stripAllHtmlSafe,
  cleanArticleHtml,
  isValidArticleImage,
} from "./scraper";

// ---- Kategori Atama Fonksiyonu ----

const CATEGORY_PATTERNS: { category: NewsCategory; patterns: RegExp[] }[] = [
  {
    category: "technical",
    patterns: [
      /technical\s*analysis/i,
      /chart\s*(alert|pattern|analysis)/i,
      /\b(support|resistance)\b.*\b(level|line|zone)\b/i,
      /\b(SMA|EMA|RSI|MACD|fibonacci|pivot\s*point|moving\s*average)\b/i,
      /\b(bullish|bearish)\s*(pattern|signal|divergence|trend)\b/i,
      /\b(candlestick|head\s*and\s*shoulders|double\s*(top|bottom)|wedge|triangle)\b/i,
      /\btrade\s*setup\b/i,
      /\bprice\s*(target|forecast|prediction)\b/i,
      /\boutlook\b.*\b(EUR|USD|GBP|JPY|AUD|NZD|CAD|CHF)\b/i,
    ],
  },
  {
    category: "fundamental",
    patterns: [
      /fundamental\s*analysis/i,
      /\b(GDP|inflation|unemployment|CPI|PPI|PMI|NFP|non-?farm)\b/i,
      /\b(economic|trade)\s*(data|report|indicator|release)\b/i,
      /\b(fiscal|monetary)\s*policy\b/i,
      /\binterest\s*rate\s*(decision|hike|cut)\b/i,
      /\b(hawkish|dovish)\b/i,
      /\b(recession|stagflation|deflation)\b/i,
      /\bmarket\s*sentiment\b/i,
    ],
  },
  {
    category: "central-banks",
    patterns: [
      /\b(Fed|Federal\s*Reserve|FOMC)\b/i,
      /\b(ECB|European\s*Central\s*Bank)\b/i,
      /\b(BoJ|Bank\s*of\s*Japan)\b/i,
      /\b(BoE|Bank\s*of\s*England)\b/i,
      /\b(SNB|Swiss\s*National\s*Bank)\b/i,
      /\b(RBA|Reserve\s*Bank\s*of\s*Australia)\b/i,
      /\b(RBNZ|Reserve\s*Bank\s*of\s*New\s*Zealand)\b/i,
      /\b(BoC|Bank\s*of\s*Canada)\b/i,
      /\bcentral\s*bank\b/i,
      /\b(Powell|Lagarde|Kuroda|Ueda|Bailey)\b/i,
    ],
  },
  {
    category: "crypto",
    patterns: [
      /\b(Bitcoin|BTC|Ethereum|ETH|crypto|cryptocurrency)\b/i,
      /\b(altcoin|DeFi|NFT|blockchain|Web3)\b/i,
      /\b(Binance|Coinbase|Kraken|FTX)\b/i,
      /\b(token|stablecoin|USDT|USDC)\b/i,
      /\b(mining|halving|wallet)\b/i,
    ],
  },
  {
    category: "commodities",
    patterns: [
      /\b(gold|XAU|silver|XAG|platinum|palladium)\b/i,
      /\b(oil|WTI|Brent|crude|petroleum|OPEC)\b/i,
      /\b(natural\s*gas|copper|wheat|corn|soybean)\b/i,
      /\bcommodit(y|ies)\b/i,
    ],
  },
];

/**
 * Haber başlığı ve içeriğine göre otomatik kategori atar
 */
function detectCategory(title: string, description: string, source: string): NewsCategory {
  const text = `${title} ${description}`.toLowerCase();
  
  // Kripto kaynakları için varsayılan crypto
  if (source === "cointelegraph" || source === "coindesk") {
    // Ama eğer technical/fundamental pattern varsa onu kullan
    for (const { category, patterns } of CATEGORY_PATTERNS) {
      if (category === "crypto") continue;
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return category;
        }
      }
    }
    return "crypto";
  }

  // Pattern eşleşmesi ara
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return category;
      }
    }
  }

  // Varsayılan: market news
  return "market";
}

/**
 * Kategori kodundan okunabilir label döndürür
 */
function getCategoryLabel(category: NewsCategory): string {
  return CATEGORY_INFO[category]?.label || "Market News";
}

// ---- Yardımcı Fonksiyonlar ----

export function generateSlug(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .slice(0, 80);
}

export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<(?!img\s*\/?)[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripAllHtml(html: string): string {
  return stripAllHtmlSafe(html);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 10))
    );
}

function parseDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// ---- Circuit Breaker ----

interface CircuitState {
  failures: number;
  disabledUntil: number;
}

const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_RESET_MS = 10 * 60 * 1000;

const circuitBreakers = new Map<string, CircuitState>();

function isCircuitOpen(sourceCode: string): boolean {
  const cb = circuitBreakers.get(sourceCode);
  if (!cb) return false;
  if (Date.now() > cb.disabledUntil) {
    cb.failures = 0;
    cb.disabledUntil = 0;
    return false;
  }
  return cb.failures >= CIRCUIT_THRESHOLD;
}

function recordFeedFailure(sourceCode: string): void {
  const cb = circuitBreakers.get(sourceCode) ?? { failures: 0, disabledUntil: 0 };
  cb.failures++;
  if (cb.failures >= CIRCUIT_THRESHOLD) {
    cb.disabledUntil = Date.now() + CIRCUIT_RESET_MS;
    console.warn(`[CircuitBreaker] ${sourceCode} devre dışı (10 dk)`);
  }
  circuitBreakers.set(sourceCode, cb);
}

function recordFeedSuccess(sourceCode: string): void {
  circuitBreakers.delete(sourceCode);
}

export function getCircuitBreakerStats(): Record<string, { failures: number; disabledUntilMs: number }> {
  const result: Record<string, { failures: number; disabledUntilMs: number }> = {};
  Array.from(circuitBreakers.entries()).forEach(([k, v]) => {
    result[k] = { failures: v.failures, disabledUntilMs: v.disabledUntil };
  });
  return result;
}

// ---- RSS Feed Yapılandırması ----

interface FeedConfig {
  url: string;
  sourceCode: string;
  sourceName: string;
  timeoutMs?: number;
}

const FEED_ITEM_LIMIT = parseInt(process.env.FEED_ITEM_LIMIT || "40");

// ---- Hızlı og:image Önbelleği ----
// Sadece meta tag okunur, tam sayfa indirilmez (max 15KB stream)
const ogImageFastCache = new Map<string, string | null>();
const OG_CACHE_TTL_MS = 60 * 60 * 1000; // 1 saat
const ogImageCacheTime = new Map<string, number>();

async function fetchOgImageFast(url: string): Promise<string | null> {
  if (!url || !url.startsWith("http")) return null;

  const now = Date.now();
  const cached = ogImageFastCache.get(url);
  const cachedAt = ogImageCacheTime.get(url) ?? 0;
  if (cached !== undefined && now - cachedAt < OG_CACHE_TTL_MS) return cached;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    clearTimeout(timer);
    if (!res.ok || !res.body) {
      ogImageFastCache.set(url, null);
      ogImageCacheTime.set(url, now);
      return null;
    }

    // Akımlı oku — <head> bitince dur, max 15KB
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let found: string | null = null;

    outer: while (text.length < 15000) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) text += decoder.decode(value, { stream: true });

      if (text.length < 500) continue;

      const patterns = [
        /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
        /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
        /name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i,
        /content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i,
      ];

      for (const p of patterns) {
        const m = text.match(p);
        if (m?.[1] && m[1].startsWith("http") && isValidArticleImage(m[1])) {
          found = m[1];
          break outer;
        }
      }

      if (text.includes("</head>") || text.includes("</HEAD>")) break;
    }

    try {
      await reader.cancel();
    } catch {
      // ignore
    }

    ogImageFastCache.set(url, found);
    ogImageCacheTime.set(url, now);
    return found;
  } catch {
    return null;
  }
}

// Önbellek boyutunu sınırla (memory leak önleme)
function trimOgImageCache(): void {
  if (ogImageFastCache.size > 500) {
    const keys = Array.from(ogImageFastCache.keys()).slice(0, 100);
    keys.forEach((k) => {
      ogImageFastCache.delete(k);
      ogImageCacheTime.delete(k);
    });
  }
}

// Kaynaklar için hangi kaynaklarda og:image fetch yapılacak

const OG_IMAGE_SOURCES = new Set(["forexlive", "financemagnates", "investing", "bloomberg", "cnbc", "yahoo", "guardian", "actionforex"]);


// ---- RSS Feed Listesi (10 Kaliteli Kaynak) ----

const RSS_FEEDS: FeedConfig[] = [
  // Forex & Finans Kaynakları
  {
    url: "https://www.forexlive.com/feed",
    sourceCode: "forexlive",
    sourceName: "ForexLive",
    timeoutMs: 10000,
  },
  {
    url: "https://www.financemagnates.com/feed/",
    sourceCode: "financemagnates",
    sourceName: "Finance Magnates",
    timeoutMs: 12000,
  },
  {
    url: "https://www.actionforex.com/feed/",
    sourceCode: "actionforex",
    sourceName: "ActionForex",
    timeoutMs: 12000,
  },
  // Kripto Kaynakları
  {
    url: "https://cointelegraph.com/rss",
    sourceCode: "cointelegraph",
    sourceName: "Cointelegraph",
    timeoutMs: 10000,
  },
  {
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    sourceCode: "coindesk",
    sourceName: "CoinDesk",
    timeoutMs: 12000,
  },
  // Uluslararası Finans Kuruluşları
  {
    url: "https://www.investing.com/rss/news.rss",
    sourceCode: "investing",
    sourceName: "Investing.com",
    timeoutMs: 12000,
  },
  {
    url: "https://feeds.bloomberg.com/markets/news.rss",
    sourceCode: "bloomberg",
    sourceName: "Bloomberg",
    timeoutMs: 12000,
  },
  {
    url: "https://www.cnbc.com/id/10000664/device/rss/rss.html",
    sourceCode: "cnbc",
    sourceName: "CNBC",
    timeoutMs: 12000,
  },
  {
    url: "https://finance.yahoo.com/news/rssindex",
    sourceCode: "yahoo",
    sourceName: "Yahoo Finance",
    timeoutMs: 12000,
  },
  {
    url: "https://www.theguardian.com/business/economics/rss",
    sourceCode: "guardian",
    sourceName: "The Guardian",
    timeoutMs: 12000,
  },
];

// ---- Tek Feed Çekme ----

async function fetchSingleFeed(feedConfig: FeedConfig): Promise<RawNewsItem[]> {
  const { url, sourceCode, sourceName, timeoutMs = 15000 } = feedConfig;

  if (isCircuitOpen(sourceCode)) {
    console.log(`[Feed] ${sourceName} devre dışı (circuit), atlandı`);
    return [];
  }

  const parser = new Parser({
    timeout: timeoutMs,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ForexHaber/2.0)",
    },
    customFields: {
      item: [
        ["media:content", "mediaContent", { keepArray: false }],
        ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
        ["thumbnail", "thumbnailSingle", { keepArray: false }],
        ["enclosure", "enclosureObj", { keepArray: false }],
        ["description", "description", { keepArray: false }],
        ["content:encoded", "contentEncoded"],
        ["dc:creator", "dcCreator"],
      ],
    },
  });

  const start = Date.now();

  try {
    const feed = await parser.parseURL(url);
    const items = (feed.items || []).slice(0, FEED_ITEM_LIMIT);
    const allItems: RawNewsItem[] = [];

    for (let i = 0; i < items.length; i += 5) {
      const batch = items.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (item) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = item as any;
          const title = decodeEntities(String(raw.title || "Adsiz Haber"));
          const articleUrl = String(raw.link || "");

          const rssContent =
            String(raw.contentEncoded || "") ||
            String(raw["content:encoded"] || "") ||
            String(raw.content || "") ||
            String(raw.description || "");

          let rssImageUrl: string | null = null;
          const enc = raw.enclosure;
          const encObj = raw.enclosureObj;
          const mc = raw.mediaContent;
          const mt = raw.mediaThumbnail;

          if (enc?.url && isValidArticleImage(enc.url)) rssImageUrl = enc.url;
          else if (encObj?.$?.url && isValidArticleImage(encObj.$.url)) rssImageUrl = encObj.$.url;
          else if (mc?.$?.url && isValidArticleImage(mc.$.url)) rssImageUrl = mc.$.url;
          else if (mt?.$?.url && isValidArticleImage(mt.$.url)) rssImageUrl = mt.$.url;

          if (!rssImageUrl) {
            const imgMatch = rssContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
            if (imgMatch?.[1] && isValidArticleImage(imgMatch[1])) {
              rssImageUrl = imgMatch[1];
            }
          }

          let finalContent = "";
          if (stripAllHtmlSafe(rssContent).length > 300) {
            finalContent = cleanArticleHtml(rssContent, articleUrl);
          }

          if (stripAllHtmlSafe(finalContent).length < 50) {
            const snippet =
              decodeEntities(String(raw.contentSnippet || "")) ||
              stripAllHtmlSafe(String(raw.description || "") || String(raw.content || ""));
            if (snippet.length > 20) {
              finalContent = snippet
                .split(/\.\s+/)
                .filter((s: string) => s.trim().length > 10)
                .map((s: string) => `<p>${s.trim()}.</p>`)
                .join("\n");
            }
          }

          const rawDesc =
            decodeEntities(String(raw.contentSnippet || "")) ||
            stripAllHtmlSafe(String(raw.description || "") || String(raw.content || "")) ||
            title; // Fallback to title if no description (Investing.com, Yahoo Finance etc.)

          const author = String(raw.dcCreator || raw.creator || "").trim() || null;

          // Otomatik kategori ata
          const category = detectCategory(title, rawDesc, sourceCode);

          return {
            title,
            description: rawDesc.substring(0, 200) + (rawDesc.length > 200 ? "..." : ""),
            content: finalContent,
            url: articleUrl,
            imageUrl: rssImageUrl,
            publishedAt: parseDate(String(raw.isoDate || raw.pubDate || "")),
            source: sourceCode,
            sourceName,
            author,
            category,
          } as RawNewsItem;
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") allItems.push(r.value);
      }
    }

    console.log(`[Feed] ${sourceName}: ${allItems.length} haber (${Date.now() - start}ms)`);
    recordFeedSuccess(sourceCode);

    // ---- og:image fetch: RSS'de görsel olmayan kaynaklar için ----
    if (OG_IMAGE_SOURCES.has(sourceCode)) {
      trimOgImageCache();
      const noImg = allItems.filter((item) => !item.imageUrl && item.url);
      if (noImg.length > 0) {
        // Max 10 item, 5'li batch'ler halinde
        const targets = noImg.slice(0, 10);
        console.log(`[Feed] ${sourceName}: ${targets.length} item için og:image çekiliyor...`);
        for (let i = 0; i < targets.length; i += 5) {
          const batch = targets.slice(i, i + 5);
          await Promise.allSettled(
            batch.map(async (item) => {
              const img = await fetchOgImageFast(item.url);
              if (img) item.imageUrl = img;
            })
          );
        }
        const found = targets.filter((item) => item.imageUrl).length;
        console.log(`[Feed] ${sourceName}: og:image — ${found}/${targets.length} bulundu`);
      }
    }

    return allItems;
  } catch (error) {
    console.error(
      `[Feed] ${sourceName} hata (${Date.now() - start}ms):`,
      error instanceof Error ? error.message : error
    );
    recordFeedFailure(sourceCode);
    return [];
  }
}

// ---- Tüm RSS Feed'leri Paralel Çek ----

export async function fetchRSSFeeds(): Promise<RawNewsItem[]> {
  const results = await Promise.allSettled(RSS_FEEDS.map((f) => fetchSingleFeed(f)));
  const allItems: RawNewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allItems.push(...r.value);
  }
  return allItems;
}



// ---- TÜM KAYNAKLARI BİRLEŞTİR (cache.ts ile) ----

export async function fetchAllNews(): Promise<NewsArticle[]> {
  if (isCacheValid()) return getCachedList();

  if (isRefreshing()) {
    const stale = getCachedList();
    if (stale.length > 0) return stale;
  }

  setRefreshing(true);

  try {
    const rssResult = await Promise.allSettled([fetchRSSFeeds()]);

    const allRaw: RawNewsItem[] = [];
    if (rssResult[0].status === "fulfilled") allRaw.push(...rssResult[0].value);

    if (allRaw.length === 0) {
      console.warn("[Haberler] Kaynak yok → demo");
      const demo = getDemoNews();
      setCache(demo);
      return demo;
    }

    allRaw.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const seenSlugs = new Set<string>();
    const seenUrls = new Set<string>();

    // Kalite filtresi: en az 15 karakter başlık ve 20 karakter açıklama
    const MIN_TITLE_LENGTH = 15;
    const MIN_DESC_LENGTH = 20;

    const unique = allRaw.filter((item) => {
      // Kalite kontrolü
      if (item.title.length < MIN_TITLE_LENGTH) {
        return false;
      }
      // Görsel varsa description kısa olabilir (Investing.com, Yahoo Finance)
      const hasImage = !!item.imageUrl;
      if (item.description.length < MIN_DESC_LENGTH && !item.content && !hasImage) {
        return false;
      }
      
      // Duplicate kontrolü
      const slug = generateSlug(item.title);
      const urlKey = item.url.replace(/[?#].*$/, "");
      if (seenSlugs.has(slug) || seenUrls.has(urlKey)) return false;
      seenSlugs.add(slug);
      seenUrls.add(urlKey);
      return true;
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const result: NewsArticle[] = unique.map((item) => {
      const slug = generateSlug(item.title);
      // Category zaten item'da mevcut veya yeniden hesapla
      const category = item.category || detectCategory(item.title, item.description, item.source);
      return {
        ...item,
        slug,
        category,
        seoMeta: {
          title: item.title.substring(0, 55) + " | Forex Haber",
          description: item.description,
          keywords: extractKeywords(item.title + " " + item.description, item.sourceName),
          canonicalUrl: `${siteUrl}/haber/${slug}`,
          ogImage: item.imageUrl,
          ogType: "article",
          articlePublishedTime: item.publishedAt,
          articleModifiedTime: item.publishedAt,
          articleAuthor: item.author || item.sourceName,
          articleSection: getCategoryLabel(category),
        },
      };
    });

    console.log(`[Haberler] ${result.length} haber cache (${allRaw.length - result.length} duplicate silindi)`);
    setCache(result);
    return result;
  } catch (error) {
    console.error("[fetchAllNews]:", error);
    const demo = getDemoNews();
    setCache(demo);
    return demo;
  } finally {
    setRefreshing(false);
  }
}

export async function fetchNewsBySlug(slug: string): Promise<NewsArticle | null> {
  await fetchAllNews();

  const article = getCachedBySlug(slug);
  if (!article) return null;

  if (stripAllHtmlSafe(article.content).length < 200 && article.url) {
    try {
      const scraped = await scrapeArticlePage(article.url);
      if (stripAllHtmlSafe(scraped.content).length > 200) {
        article.content = scraped.content;
      }
      if (scraped.imageUrl && !article.imageUrl) {
        article.imageUrl = scraped.imageUrl;
      }
      updateArticleInCache(slug, article);
    } catch {
      // mevcut içerikle devam
    }
  }

  return article;
}

// ---- Yardımcılar ----

function extractKeywords(text: string, sourceName: string): string[] {
  const base = [sourceName.toLowerCase(), "forex", "haber", "döviz", "finans"];
  const currencies = ["eur/usd", "gbp/usd", "usd/try", "usd/jpy", "xau"];
  const found = currencies.filter((c) => text.toLowerCase().includes(c));
  return Array.from(new Set([...base, ...found]));
}
// ---- DEMO VERİLER ----

function getDemoNews(): NewsArticle[] {
  const now = new Date();

  const demos: Array<{
    title: string;
    desc: string;
    content: string;
    img: string;
    hoursAgo: number;
  }> = [
    {
      title:
        "EUR/USD Paritesi 1.12 Seviyesini Test Ediyor - ECB Faiz Karari",
      desc: "Avrupa Merkez Bankasinin faiz karari sonrasinda EUR/USD paritesi guclu yukselis sergiledi.",
      content:
        "<h2>ECB Faiz Karari ve Piyasa Etkisi</h2><p>Avrupa Merkez Bankasi (ECB) bugun acikladi\u011fi faiz karariyla piyasalari sasirtti. Beklentilerin uzerinde gelen faiz artisi karari sonrasinda EUR/USD paritesi hizla yukselerek 1.12 seviyesini test etti.</p><p>ECB Baskani Christine Lagarde, enflasyonla mucadelenin kararlilikla surdurilecegini vurguladi. Euro bolgesinde cekirdek enflasyon %4.3 ile hala hedefin oldukca uzerinde seyrediyor.</p><h2>Teknik Analiz</h2><p>EUR/USD paritesinde 1.1150 kritik destek seviyesi olarak one cikiyor. Bu seviyenin uzerinde kalindigi surece yukselis trendi guclenerek devam edecek.</p><p>RSI gostergesi 62 seviyesinde olup henuz asiri alim bolgesine girmedi. MACD histogrami pozitif bolgede genisliyor.</p><h2>Piyasa Beklentileri</h2><p>Analistler, ECB'nin bir sonraki toplantida da sahin tutumunu surdurmesi halinde EUR/USD'nin 1.13 seviyelerini hedefleyebilecegini ongoruyor.</p>",
      img: "https://images.unsplash.com/photo-1519121785383-3229633bb75b?auto=format&fit=crop&q=80&w=800",
      hoursAgo: 1,
    },
    {
      title: "Fed Faiz Indirimi Sinyali - Dolar Sert Dustu",
      desc: "Federal Reserve faiz indirimi sinyali dolarda sert dususe neden oldu. DXY 103 altina indi.",
      content:
        "<h2>Fed'den Guvercin Mesajlar</h2><p>Federal Reserve Baskani Jerome Powell'in basin toplantisinda verdigi mesajlar piyasalarda dolar satisini hizlandirdi. Powell, enflasyonun hedef seviyeye yaklastigini ve yakin zamanda faiz indirimlerine baslanabilecegini ima etti.</p><p>Bu aciklama sonrasinda Dolar Endeksi (DXY) 103 seviyesinin altina dustu.</p><h2>Major Paritelere Etkisi</h2><ul><li><strong>USD/JPY:</strong> 150 seviyesinden 145.00'e geriledi</li><li><strong>GBP/USD:</strong> 1.30 seviyesini asti</li><li><strong>EUR/USD:</strong> 1.10 uzerine cikti</li></ul><h2>Gelisen Piyasalara Etkisi</h2><p>Analistler, Fed'in sahinligini terk etmesinin kuresel risk istahlni artirdigini belirtiyor.</p>",
      img: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800",
      hoursAgo: 3,
    },
    {
      title: "Altin Fiyatlari Rekor Kirdi: Ons Altin 2400 Dolari Asti",
      desc: "Jeopolitik riskler ve merkez bankalarinin altin alimlari, ons altin fiyatini tarihi zirveye tasidi.",
      content:
        "<h2>Tarihi Rekor</h2><p>Ons altin fiyati bugun 2.400 dolar seviyesini asarak yeni bir tarihi rekor kirdi. Orta Dogu'daki jeopolitik gerilimler, merkez bankalarinin artan altin alimlari ve dolardaki zayiflama altin fiyatlarini destekleyen ana faktorler.</p><h2>Merkez Bankasi Alimlari</h2><p>Dunya Altin Konseyi verilerine gore, merkez bankalari 2024'un ilk ceyreginde 290 ton altin alimi gerceklestirdi.</p><h2>Teknik Gorunum</h2><p>XAU/USD paritesi son bir ayda %8 deger kazandi. 2.350 dolar desteginin korunmasi halinde 2.500 dolar hedefi gundemde.</p><blockquote><p>Goldman Sachs: Altin 2025 yil sonuna kadar 2.700 dolari gorebilir.</p></blockquote>",
      img: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800",
      hoursAgo: 5,
    },
    {
      title: "GBP/USD Yukselis Trendinde - Ingiltere GDP Beklentileri Asti",
      desc: "Ingiltere ekonomisi %0.6 buyudu, resesyon korkulari hafifledi. Sterlin gucleniyor.",
      content:
        "<h2>Ingiltere Ekonomisi Toparlaniyor</h2><p>Ingiltere'nin aciklanan GDP verileri beklentilerin uzerinde geldi. Ekonomi %0.6 buyuyerek resesyon korkularini hafifletti.</p><h2>BoE Faiz Politikasi</h2><p>Ingiltere Merkez Bankasi'nin (BoE) guclu ekonomik veriler isiginda faiz indirimlerini erteleyecegi beklentisi GBP lehine bir faktor.</p><h2>GBP/USD Teknik Analiz</h2><p>GBP/USD paritesi 1.2980 seviyesine yukseldi. 1.30 psikolojik direnci kritik. Kirilmasi halinde 1.3150-1.3200 bandi hedeflenebilir.</p>",
      img: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&q=80&w=800",
      hoursAgo: 7,
    },
    {
      title: "USD/TRY: TCMB Siki Para Politikasini Surduruyor",
      desc: "TCMB faiz oranini %50'de sabit tuttu. CDS primi geriledi, yabanci yatirimci ilgisi artiyor.",
      content:
        "<h2>TCMB Karari</h2><p>Turkiye Cumhuriyet Merkez Bankasi (TCMB) son PPK toplantisinda politika faizini %50'de sabit tutarak siki durusunu korudu.</p><h2>Turk Lirasi ve Risk Algisi</h2><p>CDS primi 270 baz puanin altina gerileyerek risk algisinda belirgin bir iyilesmeye isaret ediyor. Reel faizin pozitif bolgeye gecmesi yabanci yatirimcilarin carry trade ilgisini artirdi.</p><h2>USD/TRY Gorunumu</h2><p>USD/TRY paritesi kontrollu bir seyir izliyor. Enflasyondaki dusus trendinin devam etmesi halinde yil sonuna dogru kademeli faiz indirimlerinin baslayabilecegi ongoruluyor.</p>",
      img: "https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&q=80&w=800",
      hoursAgo: 9,
    },
    {
      title: "USD/JPY Sert Dustu - BOJ Faiz Artisi Sinyali",
      desc: "Bank of Japan politika degisikligi sinyali verdi. Yen tum majorlere karsi guclendi.",
      content:
        "<h2>BOJ'dan Tarihi Adim Sinyali</h2><p>Japonya Merkez Bankasi (BOJ) Baskani Kazuo Ueda, negatif faiz politikasindan cikis surecinin hizlanabilecegini ima etti.</p><h2>Carry Trade Riski</h2><p>USD/JPY paritesi 150 seviyesinden 145'e geriledi. EUR/JPY de sert dususler yasadi. Carry trade pozisyonlarinin cozulmesi durumunda kuresel piyasalarda volatilite artisi kacinilmaz.</p><h2>Japon Ekonomisi</h2><p>Japonya'nin cekirdek enflasyonu %3.1 ile BOJ'un %2 hedefinin uzerinde. Isci ucretlerindeki artis da kalici enflasyon sinyali veriyor.</p>",
      img: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&q=80&w=800",
      hoursAgo: 11,
    },
  ];

  return demos.map((d, i) => ({
    title: d.title,
    description: d.desc,
    content: d.content,
    url: "https://example.com/demo-" + i,
    imageUrl: d.img,
    publishedAt: new Date(
      now.getTime() - d.hoursAgo * 60 * 60 * 1000
    ).toISOString(),
    source: "demo",
    sourceName: "Forex Haber",
    author: "Forex Analist",
    slug: generateSlug(d.title),
    category: detectCategory(d.title, d.desc, "demo"),
  }));
}
