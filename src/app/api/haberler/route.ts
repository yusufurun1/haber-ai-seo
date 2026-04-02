// ==========================================
// Haberler API Route
// GET /api/haberler - Tüm haberleri getirir
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/news-fetcher";
import { NewsApiResponse } from "@/lib/types";

export const revalidate = 300; // 5 dakikada bir revalidate

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const source = searchParams.get("source"); // opsiyonel filtre

    let articles = await fetchAllNews();

    // Kaynak filtresi
    if (source) {
      articles = articles.filter(
        (a) => a.sourceName.toLowerCase() === source.toLowerCase()
      );
    }

    // Sayfalama
    const total = articles.length;
    const startIndex = (page - 1) * limit;
    const paginatedArticles = articles.slice(startIndex, startIndex + limit);

    const response: NewsApiResponse = {
      success: true,
      data: paginatedArticles,
      total,
      page,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Haberler API hatası:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        total: 0,
        page: 1,
        error: "Haberler yüklenirken bir hata oluştu",
      } satisfies NewsApiResponse,
      { status: 500 }
    );
  }
}
