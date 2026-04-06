// ==========================================
// Haber Detay Bileşeni
// Tam haber içeriğini gösterir
// Haber içeriği gösterim bileşeni
// ==========================================

"use client";

import Link from "next/link";
import { useState } from "react";
import { NewsArticle } from "@/lib/types";
import { formatDateTurkish } from "@/lib/seo-utils";
import { sanitizeHTML } from "@/lib/sanitize";

interface NewsDetailProps {
  article: NewsArticle;
}

/**
 * İçerikten düz metin çıkarıp okuma süresini hesaplar
 */
function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").length;
  return Math.max(1, Math.ceil(words / 200)); // 200 kelime/dakika
}

export default function NewsDetail({ article }: NewsDetailProps) {
  const [imgError, setImgError] = useState(false);

  const readingTime = estimateReadingTime(article.content);
  const hasContent = article.content && article.content.trim().length > 50;


  return (
    <article className="max-w-4xl mx-auto animate-fadeIn">
      {/* Breadcrumb - Minimalist comofx style */}
      <nav aria-label="Breadcrumb" className="mb-10">
        <ol className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
          </li>
          <li className="text-slate-200">/</li>
          <li>
            <span className="text-ui-dark">Market News Detail</span>
          </li>
        </ol>
      </nav>

      {/* Kaynak, Tarih ve Okuma Süresi */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <span className="badge-green">
          {article.sourceName}
        </span>
        <time dateTime={article.publishedAt} className="text-sm font-bold text-slate-500">
          {formatDateTurkish(article.publishedAt)}
        </time>
        {article.author && (
          <span className="text-sm text-slate-500 font-medium">
            Author: <span className="text-ui-dark">{article.author}</span>
          </span>
        )}
        {hasContent && (
          <span className="text-sm text-slate-500 flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg font-medium">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {readingTime} min read
          </span>
        )}
      </div>

      {/* Başlık - Büyük ve Etkileyici */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-10 leading-[1.15] tracking-tight">
        {article.title}
      </h1>

      {/* Haber Görseli */}
      <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden mb-12 bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={!imgError && article.imageUrl ? article.imageUrl : "/news-placeholder.png"}
          alt={article.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>



      {/* Orijinal Haber İçeriği */}
      <div className="mb-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12">
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
            <span className="w-6 h-px bg-slate-200"></span> Article Content
          </h2>

          {hasContent ? (
            <div
              className="text-ui-dark leading-relaxed article-html-content font-medium opacity-90"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(article.content) }}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg mb-10 italic">
                Full content of this article is only available on the original source.
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn-primary"
              >
                Read Original Article
              </a>
            </div>
          )}

          {/* Orijinal Kaynağa Git Butonu */}
          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              View full article on {article.sourceName}
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Geri Dön Butonu */}
      <div className="py-10 border-t border-slate-100 flex justify-center">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to all news
        </Link>
      </div>
    </article>
  );
}

