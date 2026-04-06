import { NextRequest, NextResponse } from "next/server";
import { fetchNewsBySlug } from "@/lib/news-fetcher";

export const revalidate = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const start = Date.now();
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ success: false, error: "slug gerekli" }, { status: 400 });
  }

  const article = await fetchNewsBySlug(slug);

  if (!article) {
    return NextResponse.json({ success: false, error: "Haber bulunamadı" }, { status: 404 });
  }

  const etag = `"${article.slug}-${article.publishedAt}"`;
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 });
  }

  console.log(`[API] GET /haberler/${slug} ${Date.now() - start}ms`);

  return NextResponse.json(
    { success: true, data: article },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        ETag: etag,
        "Last-Modified": new Date(article.publishedAt).toUTCString(),
        "X-Response-Time": `${Date.now() - start}ms`,
      },
    }
  );
}
