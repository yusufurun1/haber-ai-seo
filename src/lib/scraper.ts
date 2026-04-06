// ==========================================
// Makale Scraping Motoru
// - 10 dönen User-Agent
// - Site bazlı içerik seçicileri (CT, FL, DFX, FXS, Reuters, MW)
// - Exponential backoff retry (maks 2 deneme)
// - LRU cache (30 dk TTL, maks 300 kayıt)
// - Kaynak bazlı başarı oranı takibi + otomatik devre dışı
// ==========================================

// ---- User-Agent Havuzu ----

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OPR/110.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
];

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ---- Site-Specific Selectors ----

/**
 * Her alan adı için öncelikli içerik seçicileri.
 * İlk eşleşen + 200 char üstü içerik kullanılır.
 */
const SITE_SELECTORS: Record<string, RegExp[]> = {
  "cointelegraph.com": [
    /<div[^>]*class="[^"]*post__content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
  ],
  "forexlive.com": [
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ],
  "dailyfx.com": [
    /<div[^>]*class="[^"]*dfx-articleBody[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
  ],
  "fxstreet.com": [
    /<div[^>]*class="[^"]*fxs_article_content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
  ],
  "reuters.com": [
    /<div[^>]*data-testid="[^"]*paragraph[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
  ],
  "marketwatch.com": [
    /<div[^>]*class="[^"]*article__content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
  ],
};

// ---- LRU Scrape Cache ----

const SCRAPE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 dakika
const SCRAPE_CACHE_MAX = 300;

interface ScrapeEntry {
  content: string;
  imageUrl: string | null;
  timestamp: number;
}

const scrapeCache = new Map<string, ScrapeEntry>();

function evictOldest(): void {
  if (scrapeCache.size < SCRAPE_CACHE_MAX) return;
  // Map insertion order korunur — ilk giren = en yaşlı
  const oldest = scrapeCache.keys().next().value;
  if (oldest) scrapeCache.delete(oldest);
}

// ---- Başarı Oranı Takibi ----

const scrapeStats = new Map<string, { ok: number; fail: number }>();

function recordResult(domain: string, success: boolean): void {
  const stat = scrapeStats.get(domain) ?? { ok: 0, fail: 0 };
  if (success) stat.ok++;
  else stat.fail++;
  scrapeStats.set(domain, stat);
}

/** Başarı oranı < %30 ve 10+ deneme varsa devre dışı */
export function isScrapeDisabled(domain: string): boolean {
  const stat = scrapeStats.get(domain);
  if (!stat) return false;
  const total = stat.ok + stat.fail;
  if (total < 10) return false;
  return stat.ok / total < 0.3;
}

/** Tüm kaynak scrape istatistiklerini döndür */
export function getScrapeStats(): Record<
  string,
  { ok: number; fail: number; rate: string }
> {
  const result: Record<string, { ok: number; fail: number; rate: string }> =
    {};
  Array.from(scrapeStats.entries()).forEach(([domain, stat]) => {
    const total = stat.ok + stat.fail;
    result[domain] = {
      ...stat,
      rate: total > 0 ? `${Math.round((stat.ok / total) * 100)}%` : "N/A",
    };
  });
  return result;
}

// ---- Yardımcı ----

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function stripAllHtmlSafe(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

export function isValidArticleImage(src: string): boolean {
  if (!src || !src.startsWith("http")) return false;
  const blacklist = [
    "pixel",
    "tracking",
    "beacon",
    "1x1",
    "spacer",
    "blank",
    "avatar",
    "icon",
    "logo",
    "badge",
    "emoji",
    "author",
    "profile",
    "headshot",
    "staff",
    "gravatar",
    "spinner",
    "analytics",
    // ForexLive generic fallback
    "fl-static",
    "il-thumbnail",
    // Genel generic/static asset yolları
    "/static/images/default",
    "placeholder",
    "no-image",
    "noimage",
    "no_image",
    "default-thumb",
  ];
  return !blacklist.some((b) => src.toLowerCase().includes(b));
}

/** HTML içeriğini temizler: tehlikeli tag'lar, reklam, event handler vb. */
export function cleanArticleHtml(html: string, baseUrl: string): string {
  if (!html) return "";
  let c = html;

  // Tehlikeli tag'lar
  c = c.replace(
    /<(script|style|iframe|object|embed|noscript|form|input|button|nav|footer|header|aside)[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );

  // Tracking pixel & profil görselleri
  c = c.replace(
    /<img[^>]+(?:pixel|track|beacon|analytics|1x1|spacer|avatar|profile|headshot|staff|author|contributor|gravatar)[^>]*>/gi,
    ""
  );

  // Yazar/editör kutuları
  c = c.replace(
    /<(?:span|p|div)[^>]*>\s*(?:Written|Reviewed|Edited|By|Author)\s+by[\s\S]*?<\/(?:span|p|div)>/gi,
    ""
  );

  // "İlgili haberler" bölümleri
  c = c.replace(
    /<(?:div|section)[^>]*(?:related[_-]?articles?|more[_-]?stories?|you[_-]?may[_-]?also)[^>]*>[\s\S]*?<\/(?:div|section)>/gi,
    ""
  );

  // Sosyal medya paylaşım butonları
  c = c.replace(
    /<(?:div|span|ul)[^>]*(?:social[_-]?share|share[_-]?buttons?|follow[_-]?us)[^>]*>[\s\S]*?<\/(?:div|span|ul)>/gi,
    ""
  );

  // Reklam bölümleri
  c = c.replace(
    /<(?:div|section)[^>]*(?:advertisement|ad-wrapper|ad-container|banner)[^>]*>[\s\S]*?<\/(?:div|section)>/gi,
    ""
  );

  // Tarih etiketleri
  c = c.replace(/<time[^>]*>.*?<\/time>/gi, "");

  // Event handler'lar
  c = c.replace(/ on\w+="[^"]*"/gi, "");
  c = c.replace(/ href="javascript:[^"]*"/gi, "");

  // Tasarım attribute'ları
  c = c.replace(/\s+(?:width|height)=["'][^"']*["']/gi, "");
  c = c.replace(/\s+style=["'][^"']*["']/gi, "");
  c = c.replace(/\s+(?:data-\w+|morss_\w+|class)=["'][^"']*["']/gi, "");

  // Lazy-load src düzeltme
  c = c.replace(
    /<img([^>]*?)data-(?:src|original|lazy-src)=["']([^"']+)["']/gi,
    (_m: string, before: string, imgUrl: string) => {
      const withoutSrc = before.replace(/src=["'][^"']*["']/i, "");
      return "<img" + withoutSrc + ' src="' + imgUrl + '"';
    }
  );

  // Relative → absolute URL (hem href hem src)
  try {
    const origin = new URL(baseUrl).origin;
    c = c.replace(
      /(href|src)=["'](\/[^"']+)["']/gi,
      '$1="' + origin + '$2"'
    );
  } catch {
    // ignore
  }

  // loading="lazy" ekle
  c = c.replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy"');

  // Boş tag'lar
  c = c.replace(/<(p|span|div|strong|b|em|i)[^>]*>\s*<\/\1>/gi, "");
  c = c.replace(/<(article|section|main)[^>]*>/gi, "");
  c = c.replace(/<\/(article|section|main)>/gi, "");

  // Ardışık br
  c = c.replace(/(<br\s*\/?>[\s\n]*){3,}/gi, "<br/><br/>");

  return c.trim();
}

// ---- Fetch With Retry ----

async function fetchWithRetry(
  url: string,
  timeoutMs: number,
  maxRetries = 2
): Promise<Response | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": getRandomUA(),
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
        },
        redirect: "follow",
      });

      clearTimeout(timer);
      if (res.ok) return res;
    } catch {
      // Sonraki denemeye geç
    }
  }
  return null;
}

// ---- Ana Scraping Fonksiyonu ----

export interface ScrapedArticle {
  content: string;
  imageUrl: string | null;
}

export async function scrapeArticlePage(url: string): Promise<ScrapedArticle> {
  if (!url || !url.startsWith("http")) {
    return { content: "", imageUrl: null };
  }

  const domain = getDomain(url);

  // Başarı oranı düşük kaynak için erken çıkış
  if (isScrapeDisabled(domain)) {
    return { content: "", imageUrl: null };
  }

  // Cache kontrolü (TTL geçerliyse doğrudan dön)
  const cached = scrapeCache.get(url);
  if (cached && Date.now() - cached.timestamp < SCRAPE_CACHE_TTL_MS) {
    return { content: cached.content, imageUrl: cached.imageUrl };
  }

  evictOldest();

  const res = await fetchWithRetry(url, 12000);
  if (!res) {
    recordResult(domain, false);
    scrapeCache.set(url, { content: "", imageUrl: null, timestamp: Date.now() });
    return { content: "", imageUrl: null };
  }

  try {
    // Boyut güvenliği: maks 2MB
    const contentLength = Number(res.headers.get("content-length") ?? 0);
    if (contentLength > 2 * 1024 * 1024) {
      recordResult(domain, false);
      return { content: "", imageUrl: null };
    }

    const html = await res.text();
    if (html.length > 2 * 1024 * 1024) {
      recordResult(domain, false);
      return { content: "", imageUrl: null };
    }

    // ---- OG Image ----
    let ogImage: string | null = null;
    const ogPatterns = [
      /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i,
    ];
    for (const pattern of ogPatterns) {
      const match = html.match(pattern);
      if (match?.[1]?.startsWith("http")) {
        ogImage = match[1];
        break;
      }
    }

    // ---- İçerik Çıkarma ----
    let articleContent = "";

    // 1. Site-specific selector
    const siteKey = Object.keys(SITE_SELECTORS).find((k) =>
      domain.includes(k)
    );
    if (siteKey) {
      for (const pattern of SITE_SELECTORS[siteKey]) {
        const match = html.match(pattern);
        if (match?.[1] && stripAllHtmlSafe(match[1]).length > 200) {
          articleContent = match[1];
          break;
        }
      }
    }

    // 2. Generic <article>
    if (stripAllHtmlSafe(articleContent).length < 200) {
      const m = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (m?.[1] && stripAllHtmlSafe(m[1]).length > 200) {
        articleContent = m[1];
      }
    }

    // 3. Yaygın CSS class'ları
    if (stripAllHtmlSafe(articleContent).length < 200) {
      const patterns = [
        /<div[^>]*class="[^"]*(?:article-body|article-content|story-body|post-content|entry-content|articleBody|ct-prose)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<[^>]+itemprop=["']articleBody["'][^>]*>([\s\S]*?)<\/(?:div|section)>/i,
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1] && stripAllHtmlSafe(m[1]).length > 200) {
          articleContent = m[1];
          break;
        }
      }
    }

    // 4. JSON-LD articleBody
    if (stripAllHtmlSafe(articleContent).length < 200) {
      const ldBlocks =
        html.match(
          /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
        ) ?? [];

      for (const block of ldBlocks) {
        try {
          const jsonStr = block.replace(/<\/?script[^>]*>/gi, "");
          const data = JSON.parse(jsonStr);
          const body: string =
            data.articleBody ?? data.description ?? "";
          if (body.length > 200) {
            articleContent = body
              .split(/\n+/)
              .filter((s: string) => s.trim().length > 10)
              .map((s: string) => `<p>${s.trim()}</p>`)
              .join("\n");
            break;
          }
        } catch {
          // skip
        }
      }
    }

    // 5. Anlamlı <p> fallback
    if (stripAllHtmlSafe(articleContent).length < 200) {
      const pTags = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) ?? [];
      const meaningful = pTags.filter((p) => {
        const text = stripAllHtmlSafe(p);
        return (
          text.length > 40 &&
          !/cookie|subscribe|newsletter|privacy|sign.?up|comment|share|follow us|advertisement/i.test(
            text
          )
        );
      });
      if (meaningful.length > 2) {
        articleContent = meaningful.join("\n");
      }
    }

    articleContent = cleanArticleHtml(articleContent, url);

    const success = stripAllHtmlSafe(articleContent).length > 100;
    recordResult(domain, success);

    scrapeCache.set(url, {
      content: articleContent,
      imageUrl: ogImage,
      timestamp: Date.now(),
    });

    return { content: articleContent, imageUrl: ogImage };
  } catch {
    recordResult(domain, false);
    scrapeCache.set(url, { content: "", imageUrl: null, timestamp: Date.now() });
    return { content: "", imageUrl: null };
  }
}
