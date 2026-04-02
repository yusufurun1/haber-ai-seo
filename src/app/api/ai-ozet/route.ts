// ==========================================
// AI Özet API Route
// POST /api/ai-ozet - Haber için AI özeti üretir
// Rate limiting + Input validation
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { generateAISummary, generateExpandedContent } from "@/lib/ai-processor";
import { AISummaryResponse } from "@/lib/types";

// ---- Basit IP-based Rate Limiter ----
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 dakika
const RATE_LIMIT_MAX = 10; // Dakikada max 10 istek

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

// Eski entry'leri periyodik temizle (memory leak önleme)
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitMap.entries()).forEach(([key, value]) => {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  });
}, 5 * 60 * 1000); // 5 dakikada bir temizle

// ---- Input Validation Sabitleri ----
const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 50_000; // ~50KB

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { title, content, sourceName, expand } = body;

    // Input validation
    if (!title || !content) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "title ve content alanları zorunludur",
        },
        { status: 400 }
      );
    }

    if (typeof title !== "string" || typeof content !== "string") {
      return NextResponse.json(
        { success: false, data: null, error: "Geçersiz veri tipi" },
        { status: 400 }
      );
    }

    // Boyut sınırlaması
    const safeTitle = title.slice(0, MAX_TITLE_LENGTH);
    const safeContent = content.slice(0, MAX_CONTENT_LENGTH);

    const summary = await generateAISummary(
      safeTitle,
      safeContent,
      sourceName || "Bilinmiyor"
    );

    if (expand) {
      const expanded = await generateExpandedContent(
        safeTitle,
        safeContent,
        sourceName || "Bilinmiyor"
      );
      if (expanded) {
        summary.expandedArticle = expanded;
      }
    }

    const response: AISummaryResponse = {
      success: true,
      data: summary,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("AI Özet API hatası:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "AI özet üretilirken bir hata oluştu",
      },
      { status: 500 }
    );
  }
}
