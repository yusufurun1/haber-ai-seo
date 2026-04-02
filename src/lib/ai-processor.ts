// ==========================================
// AI İşleme Modülü v2
// Retry, Queue, Busy State, Gelişmiş Prompt
// ==========================================

import { AISummary } from "./types";
import { stripAllHtml } from "./news-fetcher";

// ============ CACHE ============
const cache = new Map<string, { data: AISummary; timestamp: number }>();
const expandedCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 saat

// ============ RATE LIMIT & CIRCUIT BREAKER ============
let rateLimitUntil = 0;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 10; // Daha toleranslı
let apiKeyValid = true;
let lastSuccessTime = 0;

// Rate limit'i sıfırla (her sunucu başlangıcında)
export function resetRateLimitState() {
  rateLimitUntil = 0;
  consecutiveFailures = 0;
  apiKeyValid = true;
}

// ============ REQUEST QUEUE (max 1 concurrent) ============
let queueBusy = false;
const requestQueue: Array<{
  fn: () => Promise<unknown>;
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
}> = [];

async function processQueue() {
  if (queueBusy || requestQueue.length === 0) return;
  queueBusy = true;

  while (requestQueue.length > 0) {
    const job = requestQueue.shift()!;
    try {
      const result = await job.fn();
      job.resolve(result);
    } catch (err) {
      job.reject(err);
    }
    // İstekler arası 0.5s bekle
    if (requestQueue.length > 0) {
      await sleep(500);
    }
  }

  queueBusy = false;
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestQueue.push({
      fn: fn as () => Promise<unknown>,
      resolve: resolve as (v: unknown) => void,
      reject,
    });
    processQueue();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ============ İÇERİK TEMİZLEME ============
function cleanContentForFallback(text: string): string {
  let clean = text;
  clean = clean.replace(
    /(?:Staff\s*Writer|Staff\s*Editor|Senior\s*Reporter|Market\s*Update|Cointelegraph\s*in\s*your\s*social\s*feed|FUNDAMENTAL\s*OVERVIEW|TECHNICAL\s*OVERVIEW|KEY\s*POINTS?:|Follow\s+us\s+on|Sign\s+up\s+for|Subscribe\s+to|Share\s+this\s+article|Read\s+more|Related\s+articles?|Editorial\s+Policy|investment\s+advice|do\s+your\s+own\s+research|Disclaimer|About\s+the\s+author)/gi,
    ""
  );
  return clean.replace(/\s{2,}/g, " ").trim();
}

function extractMeaningfulSentences(text: string): string[] {
  const cleaned = cleanContentForFallback(text);
  return cleaned
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => {
      if (s.length < 30) return false;
      if (/^(?:Staff|Editor|Writer|Source|Image|Photo|Chart|Data from)\s/i.test(s)) return false;
      if (/\b(?:TradingView|social feed|Editorial Policy|informational purposes)\b/i.test(s)) return false;
      return true;
    });
}

// ============ GEMINI API + RETRY ============
async function callGeminiWithRetry(
  prompt: string,
  apiKey: string,
  options: {
    maxRetries?: number;
    responseMimeType?: string;
    maxOutputTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const {
    maxRetries = 2,
    responseMimeType,
    maxOutputTokens = 600,
    temperature = 0.4,
  } = options;

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Rate limit kontrolü
      if (Date.now() < rateLimitUntil) {
        // Rate limit varsa bekle
        const waitTime = rateLimitUntil - Date.now();
        if (waitTime > 0 && waitTime < 10000) {
          console.log(`⏳ Rate limit bekleniyor: ${waitTime}ms`);
          await sleep(waitTime);
        } else if (waitTime > 10000) {
          throw new Error("RATE_LIMITED");
        }
      }

      const generationConfig: Record<string, unknown> = {
        temperature,
        maxOutputTokens,
      };
      if (responseMimeType) {
        generationConfig.responseMimeType = responseMimeType;
      }

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      const responseText = result.response.text();
      if (!responseText || responseText.trim().length === 0) {
        throw new Error("EMPTY_RESPONSE");
      }

      // Başarılı — counter'ları sıfırla
      consecutiveFailures = 0;
      lastSuccessTime = Date.now();
      apiKeyValid = true;
      console.log("✅ Gemini API başarılı!");

      return responseText;
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };

      if (err.message === "RATE_LIMITED") throw error;

      if (err.status === 429 || err.message?.includes("429")) {
        consecutiveFailures++;
        // 10 saniye bekle
        rateLimitUntil = Date.now() + 10000;
        console.warn(`⚠️ Gemini 429 (deneme ${attempt + 1}/${maxRetries}). 10s bekleniyor...`);

        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          rateLimitUntil = Date.now() + 60000; // 60s bekleme
          console.warn("🛑 Çok fazla 429. 60s bekleme moduna geçildi.");
        }
        
        // Retry için bekle
        if (attempt < maxRetries - 1) {
          await sleep(10000);
          continue;
        }
        throw new Error("RATE_LIMITED");
      }

      if (err.status === 400 || err.status === 403) {
        apiKeyValid = false;
        console.error("❌ Gemini API key geçersiz:", err.message);
        throw new Error("INVALID_API_KEY");
      }

      if (attempt < maxRetries - 1) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      consecutiveFailures++;
      throw new Error("API_ERROR");
    }
  }

  throw new Error("MAX_RETRIES_EXCEEDED");
}

// ============ ANA FONKSİYON: AI ÖZET ============
export async function generateAISummary(
  title: string,
  content: string,
  sourceName: string
): Promise<AISummary> {
  // 1. Cache
  const cacheKey = title.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // 2. API key kontrolü (Gemini öncelikli)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "") {
    return getBusyResponse("Gemini API anahtarı yapılandırılmamış.");
  }

  if (!apiKeyValid) {
    return getBusyResponse("API anahtarı geçersiz. .env.local dosyasını kontrol edin.");
  }

  // 3. Uzun süreli rate limit → direkt busy
  if (Date.now() < rateLimitUntil && rateLimitUntil - Date.now() > 30000) {
    return getBusyResponse("Yapay zeka şu an çok yoğun. Kısa süre sonra tekrar deneyin.");
  }

  // 4. Queue üzerinden API çağrısı
  try {
    const result = await enqueue(async () => {
      const cleanContent = stripAllHtml(content).substring(0, 3000);

      const prompt = `Sen son derece deneyimli bir forex ve makroekonomi analistisin.

KRİTİK KURALLAR:
1. SADECE bu haberin içeriğine odaklan — genel kalıp cümleler KULLANMA
2. Haberde geçen spesifik rakamları, isimleri, olayları analiz et
3. Haber forex/emtia/makro ile ilgili DEĞİLSE (PR, sponsorluk, ödül vb.) uydurma teknik analiz yazma
4. Türkçe yaz, profesyonel ton kullan
5. Sadece JSON döndür

HABER BAŞLIĞI: ${title}
İÇERİK: ${cleanContent}
KAYNAK: ${sourceName}

{
  "summary": "Bu haberin 2-3 cümlelik Türkçe özeti. Haberdeki spesifik bilgileri kullan.",
  "analysis": "Bu haberin piyasalara etkisinin 3-5 cümlelik detaylı Türkçe analizi. Somut verilere atıf yap.",
  "affectedPairs": ["EUR/USD"],
  "sentiment": "positive"
}`;

      return callGeminiWithRetry(prompt, apiKey, {
        maxRetries: 2,
        responseMimeType: "application/json",
        maxOutputTokens: 600,
        temperature: 0.4,
      });
    });

    const parsed = JSON.parse(result as string);

    const aiSummary: AISummary = {
      summary: parsed.summary || "Özet üretilemedi.",
      analysis: parsed.analysis || "Analiz üretilemedi.",
      affectedPairs: Array.isArray(parsed.affectedPairs) ? parsed.affectedPairs : [],
      sentiment: ["positive", "negative", "neutral"].includes(parsed.sentiment)
        ? parsed.sentiment
        : "neutral",
      generatedAt: new Date().toISOString(),
      isAIGenerated: true,
      aiStatus: "ready",
    };

    cache.set(cacheKey, { data: aiSummary, timestamp: Date.now() });
    return aiSummary;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.warn(`⚠️ AI özet başarısız (${title.substring(0, 40)}): ${err.message}`);

    if (err.message === "RATE_LIMITED" || err.message === "MAX_RETRIES_EXCEEDED") {
      return getBusyResponse("Yapay zeka şu an çok yoğun. Biraz sonra tekrar deneyin.");
    }
    if (err.message === "INVALID_API_KEY") {
      return getBusyResponse("API anahtarı geçersiz.");
    }
    return getBusyResponse("Yapay zeka geçici olarak kullanılamıyor.");
  }
}

// ============ TOPLU ÖZET — SIRALI ÇAĞRI ============
export async function generateBatchSummaries(
  articles: Array<{ title: string; content: string; sourceName: string }>
): Promise<Map<string, AISummary>> {
  const results = new Map<string, AISummary>();

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const summary = await generateAISummary(a.title, a.content, a.sourceName);
    results.set(a.title, summary);

    if (i < articles.length - 1 && summary.isAIGenerated) {
      await sleep(500);
    }
  }

  return results;
}

// ============ GENİŞLETİLMİŞ DETAYLI ANALİZ ============
export async function generateExpandedContent(
  title: string,
  content: string,
  sourceName: string
): Promise<string | null> {
  // Cache
  const cacheKey = "exp_" + title.toLowerCase().trim();
  const cached = expandedCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "" || !apiKeyValid) {
    return null; // null = busy → UI'da mesaj gösterilecek
  }

  if (Date.now() < rateLimitUntil && rateLimitUntil - Date.now() > 30000) {
    return null;
  }

  try {
    const result = await enqueue(async () => {
      const cleanContent = stripAllHtml(content).substring(0, 3000);

      const prompt = `Sen Wall Street kalibresinde kıdemli bir makroekonomi analistisin.

KRİTİK KURALLAR:
1. Haberdeki gerçek bilgileri temel al, uydurma veri YAZMA
2. Haber piyasa haberi DEĞİLSE (sponsorluk, PR, bağış vb.) teknik analiz YAZMA, kurumsal değerlendirme yap
3. Minimum 6 paragraf, profesyonel Türkçe
4. SADECE HTML döndür. Markdown veya \`\`\` KULLANMA
5. Her h2 başlığının önüne emoji koy

HABER: ${title}
İÇERİK: ${cleanContent}
KAYNAK: ${sourceName}

<h2>🔍 Makroekonomik Bağlam</h2>
<p>... haberdeki spesifik verilere dayanan analiz ...</p>
<h2>📊 Piyasa Dinamikleri</h2>
<p>... somut etki analizi ...</p>
<h2>📈 Teknik Değerlendirme</h2>
<p>... seviyeler veya kurumsal etki ...</p>
<h2>🔮 Gelecek Projeksiyonu</h2>
<p>... kısa/orta vade beklenti ...</p>
<h2>⚠️ Risk ve Tavsiyeler</h2>
<ul><li>...</li><li>...</li><li>...</li></ul>`;

      return callGeminiWithRetry(prompt, apiKey, {
        maxRetries: 2,
        maxOutputTokens: 3000,
        temperature: 0.5,
      });
    });

    let html = result as string;
    html = html.replace(/^```(html)?\n?/i, "").replace(/\n?```$/i, "").trim();

    if (html && html.length > 100) {
      expandedCache.set(cacheKey, { data: html, timestamp: Date.now() });
      return html;
    }

    return null;
  } catch {
    console.warn(`⚠️ Expanded content başarısız: ${title.substring(0, 40)}`);
    return null;
  }
}

// ============ BUSY RESPONSE ============
function getBusyResponse(message: string): AISummary {
  return {
    summary: "",
    analysis: "",
    affectedPairs: [],
    sentiment: "neutral",
    generatedAt: new Date().toISOString(),
    isAIGenerated: false,
    aiStatus: "busy",
    statusMessage: message,
  };
}

// ============ API DURUM BİLGİSİ ============
export function getAIStatus() {
  return {
    isAvailable: apiKeyValid && Date.now() >= rateLimitUntil,
    lastSuccess: lastSuccessTime,
    rateLimitedUntil: rateLimitUntil,
    consecutiveFailures,
    queueLength: requestQueue.length,
  };
}
