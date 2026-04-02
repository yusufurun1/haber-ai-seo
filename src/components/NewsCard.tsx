// ==========================================
// Haber Kartı Bileşeni
// Ana sayfada haber listesinde gösterilir
// ==========================================

"use client";

import Link from "next/link";
import { useState } from "react";
import { NewsArticle } from "@/lib/types";
import { formatDateTurkish } from "@/lib/seo-utils";

interface NewsCardProps {
  article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  const [imgError, setImgError] = useState(false);

  const sentimentColor =
    article.aiSummary?.sentiment === "positive"
      ? "text-forex-green"
      : article.aiSummary?.sentiment === "negative"
        ? "text-forex-red"
        : "text-forex-muted";

  const sentimentLabel =
    article.aiSummary?.sentiment === "positive"
      ? "📈 Pozitif"
      : article.aiSummary?.sentiment === "negative"
        ? "📉 Negatif"
        : "➡️ Nötr";

  const showImage = article.imageUrl && !imgError;

  return (
    <article className="group relative bg-white border border-slate-200 rounded-[20px] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(31,209,118,0.1)] hover:-translate-y-1">
      <Link href={`/haber/${article.slug}`} className="block">
        {/* Görsel Alanı */}
        <div className="relative w-full h-52 bg-slate-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showImage ? article.imageUrl! : "/news-placeholder.png"}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Kaynak Badge */}
          <div className="absolute top-4 left-4">
            <span className="badge-dark backdrop-blur-md bg-ui-dark/80">
              {article.sourceName}
            </span>
          </div>

          {/* Sentiment Badge - Görsel Üstünde */}
          {article.aiSummary && (
            <div className={`absolute bottom-4 right-4 px-3 py-1.5 rounded-lg backdrop-blur-md font-bold text-[10px] uppercase tracking-wider shadow-lg ${
              article.aiSummary.sentiment === "positive" ? "bg-primary/90 text-ui-dark" : 
              article.aiSummary.sentiment === "negative" ? "bg-red-500/90 text-white" : 
              "bg-slate-500/90 text-white"
            }`}>
              {sentimentLabel}
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col h-full">
          {/* Üst Bilgi */}
          <div className="flex items-center gap-3 mb-4">
            <time dateTime={article.publishedAt} className="text-xs font-bold text-slate-400">
              {formatDateTurkish(article.publishedAt)}
            </time>
          </div>

          {/* Başlık */}
          <h2 className="text-xl font-extrabold text-ui-dark mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
            {article.title}
          </h2>

          {/* Açıklama */}
          <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">
            {article.description}
          </p>

          {/* AI Özet Bölümü */}
          {article.aiSummary && (
            <div className="mb-6 p-4 rounded-[16px] bg-slate-50 border border-slate-100 group-hover:border-primary/20 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px]">🤖</span>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-ui-dark/60">
                  AI Analiz
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{article.aiSummary.summary}"
              </p>
            </div>
          )}

          {/* Alt Bilgiler */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
            {/* Pariteler */}
            <div className="flex gap-1.5 overflow-hidden">
              {article.aiSummary?.affectedPairs?.slice(0, 2).map((pair) => (
                <span key={pair} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-[6px]">
                  {pair}
                </span>
              ))}
            </div>

            {/* Read More Link */}
            <span className="inline-flex items-center gap-1 text-xs font-black text-primary uppercase tracking-widest">
              Detay <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
