// ==========================================
// Haber Çekme ve İşleme Servisi
// RSS + Orijinal sayfa scraping ile tam içerik
// ==========================================

import Parser from "rss-parser";
import { NewsArticle, RawNewsItem } from "./types";

// ---- Yardımcı Fonksiyonlar ----

function generateSlug(text: string): string {
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
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

// ---- OG:IMAGE + TAM İÇERİK SCRAPING ----

interface ScrapedArticle {
  content: string;
  imageUrl: string | null;
}

const scrapeCache = new Map<string, ScrapedArticle>();

async function scrapeArticlePage(url: string): Promise<ScrapedArticle> {
  if (!url || !url.startsWith("http")) {
    return { content: "", imageUrl: null };
  }

  const cached = scrapeCache.get(url);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const empty: ScrapedArticle = { content: "", imageUrl: null };
      scrapeCache.set(url, empty);
      return empty;
    }

    const html = await res.text();

    // 1. OG:IMAGE
    let ogImage: string | null = null;
    const ogPatterns = [
      /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i,
    ];
    for (const pattern of ogPatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].startsWith("http")) {
        ogImage = match[1];
        break;
      }
    }

    // 2. MAKALE İÇERİĞİ
    let articleContent = "";

    // article tag
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch && stripAllHtml(articleMatch[1]).length > 200) {
      articleContent = articleMatch[1];
    }

    // Yaygın content class'ları
    if (stripAllHtml(articleContent).length < 200) {
      const divPatterns = [
        /<div[^>]*class="[^"]*(?:article-body|article-content|story-body|post-content|entry-content|single-content|article__body|articleBody|ct-prose)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<[^>]+itemprop=["']articleBody["'][^>]*>([\s\S]*?)<\/(?:div|section)>/i,
      ];
      for (const pattern of divPatterns) {
        const match = html.match(pattern);
        if (match && match[1] && stripAllHtml(match[1]).length > 200) {
          articleContent = match[1];
          break;
        }
      }
    }

    // Fallback: anlamlı <p> taglarını topla
    if (stripAllHtml(articleContent).length < 200) {
      const pTags = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
      const meaningfulP = pTags.filter((p) => {
        const text = stripAllHtml(p);
        return (
          text.length > 40 &&
          !/cookie|subscribe|newsletter|privacy|sign.?up|comment|share|follow us/i.test(
            text
          )
        );
      });
      if (meaningfulP.length > 2) {
        articleContent = meaningfulP.join("\n");
      }
    }

    // 3. Temizle
    articleContent = cleanArticleHtml(articleContent, url);

    const result: ScrapedArticle = {
      content: articleContent,
      imageUrl: ogImage,
    };
    scrapeCache.set(url, result);
    return result;
  } catch {
    const empty: ScrapedArticle = { content: "", imageUrl: null };
    scrapeCache.set(url, empty);
    return empty;
  }
}

function isValidArticleImage(src: string): boolean {
  if (!src || !src.startsWith("http")) return false;
  const bl = [
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
  ];
  return !bl.some((b) => src.toLowerCase().includes(b));
}

function cleanArticleHtml(html: string, baseUrl: string): string {
  if (!html) return "";
  let c = html;

  // Tehlikeli taglar
  c = c.replace(
    /<(script|style|iframe|object|embed|noscript|form|input|button|nav|footer|header|aside)[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );

  // Tracking pixel
  c = c.replace(
    /<img[^>]+(?:pixel|track|beacon|analytics|1x1|spacer|avatar|profile|headshot|staff|author|contributor|gravatar)[^>]*>/gi,
    ""
  );

  // Written by, Reviewed by
  c = c.replace(
    /<(?:span|p|div)[^>]*>\s*(?:Written|Reviewed|Edited)\s+by[\s\S]*?<\/(?:span|p|div)>/gi,
    ""
  );

  // Tarih etiketleri
  c = c.replace(/<time[^>]*>.*?<\/time>/gi, "");

  // Zararlı attribute
  c = c.replace(/ on\w+="[^"]*"/gi, "");
  c = c.replace(/ href="javascript:[^"]*"/gi, "");

  // width, height, style kaldır
  c = c.replace(/\s+(?:width|height)=["'][^"']*["']/gi, "");
  c = c.replace(/\s+style=["'][^"']*["']/gi, "");

  // data-*, morss_*, class kaldır
  c = c.replace(/\s+(?:data-\w+|morss_\w+|class)=["'][^"']*["']/gi, "");

  // Lazy-load fix
  c = c.replace(
    /<img([^>]*?)data-(?:src|original|lazy-src)=["']([^"']+)["']/gi,
    (_m: string, before: string, imgUrl: string) => {
      const withoutSrc = before.replace(/src=["'][^"']*["']/i, "");
      return "<img" + withoutSrc + ' src="' + imgUrl + '"';
    }
  );

  // Relative URL -> absolute
  try {
    const origin = new URL(baseUrl).origin;
    c = c.replace(
      /(href|src)=["'](\/[^"']+)["']/gi,
      '$1="' + origin + '$2"'
    );
  } catch {}

  // loading="lazy" ekle
  c = c.replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy"');

  // Boş taglar
  c = c.replace(/<(p|span|div|strong|b|em|i)[^>]*>\s*<\/\1>/gi, "");
  c = c.replace(/<(article|section|main)[^>]*>/gi, "");
  c = c.replace(/<\/(article|section|main)>/gi, "");

  // Ardışık br
  c = c.replace(/(<br\s*\/?>[\s\n]*){3,}/gi, "<br/><br/>");

  return c.trim();
}

// ---- RSS FEED ----

export async function fetchRSSFeeds(): Promise<RawNewsItem[]> {
  const parser = new Parser({
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ForexHaberAI/1.0)",
    },
    customFields: {
      item: [
        ["media:content", "mediaContent", { keepArray: false }],
        ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
        ["thumbnail", "thumbnailSingle", { keepArray: false }],
        ["enclosure", "enclosureObj", { keepArray: false }],
        ["description", "description", { keepArray: false }],
        ["content:encoded", "contentEncoded"],
      ],
    },
  });

  const feedsToFetch = [
    {
      url: "https://morss.it/https://cointelegraph.com/rss",
      sourceCode: "cointelegraph",
      sourceName: "Cointelegraph",
    },
    {
      url: "https://www.forexlive.com/feed",
      sourceCode: "forexlive",
      sourceName: "ForexLive",
    },
    {
      url: "https://www.investing.com/rss/news_301.rss",
      sourceCode: "investing",
      sourceName: "Investing.com",
    },
  ];

  const allItems: RawNewsItem[] = [];

  for (const feedSource of feedsToFetch) {
    try {
      const feed = await parser.parseURL(feedSource.url);
      const items = (feed.items || []).slice(0, 15);

      for (let i = 0; i < items.length; i += 5) {
        const batch = items.slice(i, i + 5);
        const processed = await Promise.allSettled(
          batch.map(async (item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const raw = item as any;
            const title = String(raw.title || "Adsiz Haber");
            const articleUrl = String(raw.link || "");

            const rssContent =
              String(raw.contentEncoded || "") ||
              String(raw["content:encoded"] || "") ||
              String(raw.content || "") ||
              String(raw.description || "");

            // RSS'ten gorsel
            let rssImageUrl: string | null = null;
            const enc = raw.enclosure;
            const encObj = raw.enclosureObj;
            const mc = raw.mediaContent;
            const mt = raw.mediaThumbnail;

            if (enc && enc.url) rssImageUrl = enc.url;
            else if (encObj?.$?.url) rssImageUrl = encObj.$.url;
            else if (mc?.$?.url) rssImageUrl = mc.$.url;
            else if (mt?.$?.url) rssImageUrl = mt.$.url;

            if (!rssImageUrl) {
              const imgMatch = rssContent.match(
                /<img[^>]+src=["']([^"']+)["'][^>]*>/i
              );
              if (
                imgMatch &&
                imgMatch[1] &&
                isValidArticleImage(imgMatch[1])
              ) {
                rssImageUrl = imgMatch[1];
              }
            }

            // ===== ANA FIX: Orijinal sayfadan tam içerik + görsel =====
            let finalContent = "";
            let finalImageUrl = rssImageUrl;

            const rssTextLen = stripAllHtml(rssContent).length;

            // RSS yeterli içerik verdiyse kullan
            if (rssTextLen > 300) {
              finalContent = cleanArticleHtml(rssContent, articleUrl);
            }

            // İçerik kısaysa -> orijinal sayfayı scrape et
            if (stripAllHtml(finalContent).length < 200 && articleUrl) {
              try {
                const scraped = await scrapeArticlePage(articleUrl);
                if (stripAllHtml(scraped.content).length > 200) {
                  finalContent = scraped.content;
                }
                if (scraped.imageUrl) {
                  finalImageUrl = scraped.imageUrl;
                }
              } catch {
                // scrape başarısız, devam et
              }
            }

            // Son çare: RSS snippet'ini paragraf yap
            if (stripAllHtml(finalContent).length < 50) {
              const snippet =
                String(raw.contentSnippet || "") ||
                stripAllHtml(
                  String(raw.description || "") ||
                    String(raw.content || "")
                );
              if (snippet.length > 20) {
                finalContent = snippet
                  .split(/\.\s+/)
                  .filter((s) => s.trim().length > 10)
                  .map((s) => "<p>" + s.trim() + ".</p>")
                  .join("\n");
              }
            }

            const rawDesc =
              String(raw.contentSnippet || "") ||
              stripAllHtml(
                String(raw.description || "") ||
                  String(raw.content || "")
              );

            return {
              title,
              description: rawDesc.substring(0, 200) + (rawDesc.length > 200 ? "..." : ""),
              content: finalContent,
              url: articleUrl,
              imageUrl: finalImageUrl,
              publishedAt:
                String(raw.isoDate || "") ||
                String(raw.pubDate || "") ||
                new Date().toISOString(),
              source: feedSource.sourceCode,
              sourceName: feedSource.sourceName,
              author: String(raw.creator || "") || feedSource.sourceName,
            } as RawNewsItem;
          })
        );

        for (const result of processed) {
          if (result.status === "fulfilled") {
            allItems.push(result.value);
          }
        }
      }
    } catch (error) {
      console.error(feedSource.sourceName + " fetch error:", error);
    }
  }

  return allItems;
}

// ---- NewsAPI.org ----

export async function fetchFromNewsAPI(): Promise<RawNewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey || apiKey === "your_newsapi_key_here") return [];

  try {
    const queries = ["forex", "currency", "EUR USD"];
    const allItems: RawNewsItem[] = [];

    for (const query of queries) {
      const url = new URL("https://newsapi.org/v2/everything");
      url.searchParams.set("q", query);
      url.searchParams.set("language", "en");
      url.searchParams.set("sortBy", "publishedAt");
      url.searchParams.set("pageSize", "8");
      url.searchParams.set("apiKey", apiKey);

      try {
        const res = await fetch(url.toString(), {
          next: { revalidate: 300 },
        });
        if (!res.ok) continue;
        const data = await res.json();

        const articles = (data.articles || [])
          .filter(
            (a: Record<string, unknown>) =>
              a.title &&
              a.title !== "[Removed]" &&
              a.description &&
              a.description !== "[Removed]"
          )
          .map((a: Record<string, unknown>): RawNewsItem => {
            const source = a.source as { name?: string } | undefined;
            return {
              title: a.title as string,
              description: stripAllHtml((a.description as string) || "").slice(
                0,
                200
              ),
              content: (a.content as string) || (a.description as string) || "",
              url: a.url as string,
              imageUrl: (a.urlToImage as string) || null,
              publishedAt: a.publishedAt as string,
              source: "newsapi",
              sourceName: source?.name || "NewsAPI",
              author: (a.author as string) || null,
            };
          });

        allItems.push(...articles);
      } catch {
        continue;
      }
    }

    // NewsAPI haberleri için de scrape
    for (let i = 0; i < Math.min(allItems.length, 10); i++) {
      const item = allItems[i];
      if (stripAllHtml(item.content).length < 200 && item.url) {
        try {
          const scraped = await scrapeArticlePage(item.url);
          if (stripAllHtml(scraped.content).length > 200) {
            allItems[i].content = scraped.content;
          }
          if (scraped.imageUrl && !item.imageUrl) {
            allItems[i].imageUrl = scraped.imageUrl;
          }
        } catch {
          // skip
        }
      }
    }

    return allItems;
  } catch (error) {
    console.error("NewsAPI hatasi:", error);
    return [];
  }
}

// ---- SERVER-SIDE CACHE ----
// Aynı revalidate döngüsünde çoklu çağrıyı önler
let newsCache: { data: NewsArticle[]; timestamp: number } | null = null;
const NEWS_CACHE_TTL = 1000 * 60 * 2; // 2 dakika

// ---- TÜM KAYNAKLARI BİRLEŞTİR ----

export async function fetchAllNews(): Promise<NewsArticle[]> {
  // Cache kontrolü
  if (newsCache && Date.now() - newsCache.timestamp < NEWS_CACHE_TTL) {
    return newsCache.data;
  }

  try {
    const [rssResult, newsApiResult] = await Promise.allSettled([
      fetchRSSFeeds(),
      fetchFromNewsAPI(),
    ]);

    const allRaw: RawNewsItem[] = [];
    if (rssResult.status === "fulfilled") allRaw.push(...rssResult.value);
    if (newsApiResult.status === "fulfilled")
      allRaw.push(...newsApiResult.value);

    if (allRaw.length === 0) {
      console.warn("Hiçbir kaynak haber döndürmedi, demo veriler gösteriliyor");
      const demoData = getDemoNews();
      newsCache = { data: demoData, timestamp: Date.now() };
      return demoData;
    }

    allRaw.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const seen = new Set<string>();
    const unique = allRaw.filter((item) => {
      const slug = generateSlug(item.title);
      if (seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });

    const result = unique.map((item) => {
      const slug = generateSlug(item.title);
      return {
        ...item,
        slug,
        seoMeta: {
          title: item.title.substring(0, 55) + " | Haber AI",
          description: item.description,
          keywords: [item.sourceName.toLowerCase(), "haber", "forex", "finans"],
          canonicalUrl: "https://www.haberai.com/haber/" + slug,
          ogImage: item.imageUrl,
          ogType: "article",
          articlePublishedTime: item.publishedAt,
          articleModifiedTime: item.publishedAt,
          articleAuthor: item.author || item.sourceName,
          articleSection: "Ekonomi",
        },
      } as NewsArticle;
    });

    // Cache'e kaydet
    newsCache = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error("fetchAllNews hatasi:", error);
    const demoData = getDemoNews();
    newsCache = { data: demoData, timestamp: Date.now() };
    return demoData;
  }
}

export async function fetchNewsBySlug(
  slug: string
): Promise<NewsArticle | null> {
  const allNews = await fetchAllNews();
  return allNews.find((article) => article.slug === slug) || null;
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
    sourceName: "Forex Haber AI",
    author: "Forex Analist",
    slug: generateSlug(d.title),
  }));
}
