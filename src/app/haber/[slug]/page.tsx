// ==========================================
// Haber Detay Sayfası - [slug]
// Dinamik SEO meta veriler + Schema.org
// ==========================================

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchAllNews, fetchNewsBySlug } from "@/lib/news-fetcher";
import {
  generateSEOMeta,
  generateArticleSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo-utils";
import NewsDetail from "@/components/NewsDetail";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// ISR: 5 dakikada bir revalidate
export const revalidate = 300;

// Statik parametreleri önceden oluşturma — tamamen ISR'a bırak
// Build sırasında RSS + scraping çağrısını önler
export async function generateStaticParams() {
  return [];
}

// Bilinen olmayan slug'lar on-demand ISR ile oluşturulacak
export const dynamicParams = true;

// Dinamik SEO meta verileri
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchNewsBySlug(slug);

  if (!article) {
    return {
      title: "Haber Bulunamadı",
      description: "Aradığınız forex haberi bulunamadı.",
    };
  }

  const seo = generateSEOMeta(article);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "article",
      publishedTime: seo.articlePublishedTime,
      modifiedTime: seo.articleModifiedTime,
      authors: [seo.articleAuthor],
      section: seo.articleSection,
      images: seo.ogImage ? [seo.ogImage] : [],
      url: seo.canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : [],
    },
    alternates: {
      canonical: seo.canonicalUrl,
    },
  };
}

export default async function HaberDetayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await fetchNewsBySlug(slug);

  if (!article) {
    notFound();
  }

  // NOT: AI özet ve expanded content artık client-side'da yükleniyor
  // Bu sayede build sırasında rate limit hatası oluşmuyor

  // Schema.org yapısal verileri
  const articleSchema = generateArticleSchema(article);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Ana Sayfa", url: SITE_URL },
    { name: "Forex Haberleri", url: `${SITE_URL}/#haberler` },
    { name: article.title, url: `${SITE_URL}/haber/${article.slug}` },
  ]);

  return (
    <>
      {/* Schema.org yapısal veriler (SEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {/* Haber İçeriği */}
      <div className="animate-fadeIn">
        <NewsDetail article={article} />
      </div>
    </>
  );
}
