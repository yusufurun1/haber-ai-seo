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
          <span className="text-sm text-slate-500 flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full font-bold">
            ⏱ {readingTime} min read
          </span>
        )}
      </div>

      {/* Başlık - Büyük ve Etkileyici */}
      <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-ui-dark mb-10 leading-[1.1] tracking-tight">
        {article.title}
      </h1>

      {/* Haber Görseli - Premium Görünüm */}
      <div className="relative w-full h-[400px] md:h-[500px] rounded-[32px] overflow-hidden mb-12 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={!imgError && article.imageUrl ? article.imageUrl : "/news-placeholder.png"}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
          onError={() => setImgError(true)}
        />
      </div>



      {/* Orijinal Haber İçeriği */}
      <div className="mb-16">
        <div className="bg-white border border-slate-200 rounded-[32px] p-8 md:p-14 shadow-sm">
          <h2 className="text-xs font-black text-ui-dark/40 uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-slate-200"></span> 📰 Original Content
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
                🔗 Read Original Article
              </a>
            </div>
          )}

          {/* Orijinal Kaynağa Git Butonu */}
          <div className="mt-12 pt-10 border-t border-slate-100 flex flex-col items-center">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group inline-flex items-center gap-3 text-sm font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-all"
            >
              View full article <span className="transition-transform group-hover:translate-x-2">→</span>
            </a>
            <p className="text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest">
              Source: <span className="text-ui-dark">{article.sourceName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Geri Dön Butonu */}
      <div className="py-12 border-t border-slate-100 flex justify-center">
        <Link
          href="/"
          className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-ui-dark transition-all"
        >
          <span className="transition-transform group-hover:-translate-x-2">←</span> All News
        </Link>
      </div>
    </article>
  );
}

