// ==========================================
// Haber Detay Sayfası - [slug]
// Dinamik SEO meta veriler + Schema.org
// ==========================================

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchNewsBySlug, fetchAllNews } from "@/lib/news-fetcher";
import {
  generateSEOMeta,
  generateArticleSchema,
  generateBreadcrumbSchema,
} from "@/lib/seo-utils";
import NewsDetail from "@/components/NewsDetail";
import NewsCard from "@/components/NewsCard";

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
  const [article, allNews] = await Promise.all([
    fetchNewsBySlug(slug),
    fetchAllNews(),
  ]);

  if (!article) {
    notFound();
  }

  // İlgili haberler: aynı kaynak VEYA aynı kategori, max 3 adet
  const articleSection = article.seoMeta?.articleSection || "";
  const related = allNews
    .filter(
      (a) =>
        a.slug !== slug &&
        (a.source === article.source ||
          a.seoMeta?.articleSection === articleSection)
    )
    .slice(0, 3);

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

      {/* İlgili Haberler */}
      {related.length > 0 && (
        <section className="mt-16 mb-8">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-slate-200"></span> Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map((a) => (
              <NewsCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
