// ==========================================
// Haberler API Route
// GET /api/haberler - Tüm haberleri getirir
// Desteklenen parametreler:
//   ?page=1&limit=20
//   ?source=forexlive
//   ?category=Fed
//   ?q=EUR/USD
//   ?from=2026-04-01&to=2026-04-06
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/news-fetcher";
import { NewsApiResponse } from "@/lib/types";

export const revalidate = 300; // 5 dakikada bir revalidate

export async function GET(request: NextRequest) {
  const start = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const source = searchParams.get("source");
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let articles = await fetchAllNews();

    // Kaynak filtresi
    if (source) {
      articles = articles.filter(
        (a) => a.source.toLowerCase() === source.toLowerCase()
      );
    }

    // Kategori filtresi (articleSection)
    if (category) {
      articles = articles.filter(
        (a) =>
          (a.seoMeta?.articleSection || "").toLowerCase() ===
          category.toLowerCase()
      );
    }

    // Arama filtresi
    if (q && q.trim()) {
      const lower = q.trim().toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(lower) ||
          a.description.toLowerCase().includes(lower)
      );
    }

    // Tarih aralığı filtresi
    if (from) {
      const fromDate = new Date(from).getTime();
      articles = articles.filter(
        (a) => new Date(a.publishedAt).getTime() >= fromDate
      );
    }
    if (to) {
      const toDate = new Date(to).getTime() + 86400000; // to günün sonu
      articles = articles.filter(
        (a) => new Date(a.publishedAt).getTime() <= toDate
      );
    }

    // Sayfalama
    const total = articles.length;
    const startIndex = (page - 1) * limit;
    const paginatedArticles = articles.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + paginatedArticles.length < total;

    // ETag: içerik hash'i (slug listesi)
    const etag = `"${total}-${paginatedArticles[0]?.slug || "empty"}"`;
    const lastModified = paginatedArticles[0]
      ? new Date(paginatedArticles[0].publishedAt).toUTCString()
      : new Date().toUTCString();

    // Conditional GET: If-None-Match
    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const response: NewsApiResponse = {
      success: true,
      data: paginatedArticles,
      total,
      page,
      hasMore,
    };

    console.log(`[API] GET /haberler ${Date.now() - start}ms — ${total} sonuç`);

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        ETag: etag,
        "Last-Modified": lastModified,
        "X-Response-Time": `${Date.now() - start}ms`,
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
        hasMore: false,
        error: "Haberler yüklenirken bir hata oluştu",
      } satisfies NewsApiResponse,
      { status: 500 }
    );
  }
}

