// ==========================================
// AI Özet API Route
// POST /api/ai-ozet - Haber için AI özeti üretir
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { generateAISummary, generateExpandedContent } from "@/lib/ai-processor";
import { AISummaryResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, sourceName, expand } = body;

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

    const summary = await generateAISummary(
      title,
      content,
      sourceName || "Bilinmiyor"
    );

    if (expand) {
      const expanded = await generateExpandedContent(
        title,
        content,
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
