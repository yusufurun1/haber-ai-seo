// ==========================================
// GET /api/haberler/kaynaklar
// Kaynak listesi ve haber sayıları
// ==========================================

import { NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/news-fetcher";
import { SourceStats } from "@/lib/types";

export const revalidate = 300;

export async function GET() {
  try {
    const articles = await fetchAllNews();

    // Kaynak bazlı istatistik
    const statsMap = new Map<string, SourceStats>();

    for (const a of articles) {
      const existing = statsMap.get(a.source);
      if (!existing) {
        statsMap.set(a.source, {
          sourceCode: a.source,
          sourceName: a.sourceName,
          count: 1,
          latestAt: a.publishedAt,
        });
      } else {
        existing.count++;
        if (a.publishedAt > existing.latestAt) {
          existing.latestAt = a.publishedAt;
        }
      }
    }

    const sources = Array.from(statsMap.values()).sort(
      (a, b) => b.count - a.count
    );

    return NextResponse.json(
      { success: true, data: sources, total: articles.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Kaynaklar API hatası:", error);
    return NextResponse.json(
      { success: false, data: [], total: 0, error: "Kaynaklar yüklenemedi" },
      { status: 500 }
    );
  }
}
