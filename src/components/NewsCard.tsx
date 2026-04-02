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
    <article className="group bg-forex-card border border-forex-border rounded-xl overflow-hidden hover:border-forex-gold/40 transition-all duration-300 hover:shadow-lg hover:shadow-forex-gold/5">
      <Link href={`/haber/${article.slug}`} className="block">
        {/* Haber Görseli — native img kullanıyoruz, Next Image ORB hatası veriyor */}
        <div className="relative w-full h-44 bg-forex-dark overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showImage ? article.imageUrl! : "/news-placeholder.png"}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forex-card/80 to-transparent" />
        </div>

        <div className="p-5">
        {/* Kaynak ve Tarih */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-forex-gold bg-forex-gold/10 px-2 py-1 rounded-full">
            {article.sourceName}
          </span>
          <time
            dateTime={article.publishedAt}
            className="text-xs text-forex-muted"
          >
            {formatDateTurkish(article.publishedAt)}
          </time>
        </div>

        {/* Başlık */}
        <h2 className="text-lg font-bold text-white mb-2 group-hover:text-forex-gold transition-colors line-clamp-2">
          {article.title}
        </h2>

        {/* Açıklama */}
        <p className="text-sm text-forex-muted mb-3 line-clamp-2">
          {article.description}
        </p>

        {/* AI Özet Badge (varsa) */}
        {article.aiSummary && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs">🤖</span>
              <span className="text-xs font-semibold text-blue-400">
                AI Özet
              </span>
            </div>
            <p className="text-xs text-blue-200/80 line-clamp-2">
              {article.aiSummary.summary}
            </p>
          </div>
        )}

        {/* Alt Bilgiler */}
        <div className="flex items-center justify-between pt-3 border-t border-forex-border">
          {/* Etkilenen Pariteler */}
          {article.aiSummary?.affectedPairs &&
            article.aiSummary.affectedPairs.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {article.aiSummary.affectedPairs.slice(0, 3).map((pair) => (
                  <span
                    key={pair}
                    className="text-[10px] font-mono bg-forex-dark px-1.5 py-0.5 rounded text-forex-text"
                  >
                    {pair}
                  </span>
                ))}
              </div>
            )}

          {/* Sentiment */}
          {article.aiSummary && (
            <span className={`text-xs font-medium ${sentimentColor}`}>
              {sentimentLabel}
            </span>
          )}

          {/* Devamını oku (AI yoksa) */}
          {!article.aiSummary && (
            <span className="text-xs text-forex-gold font-medium group-hover:underline">
              Devamını oku →
            </span>
          )}
        </div>
        </div>
      </Link>
    </article>
  );
}
