"use client";

import Link from "next/link";
import { useState } from "react";
import { NewsArticle } from "@/lib/types";
import { formatDateTurkish } from "@/lib/seo-utils";

interface NewsCardProps {
  article: NewsArticle;
}

function readingTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").length;
  return Math.max(1, Math.ceil(words / 200));
}

const CATEGORY_COLORS: Record<string, string> = {
  Fed: "bg-blue-100 text-blue-700",
  ECB: "bg-indigo-100 text-indigo-700",
  BOJ: "bg-rose-100 text-rose-700",
  TCMB: "bg-orange-100 text-orange-700",
  Crypto: "bg-violet-100 text-violet-700",
  Commodities: "bg-yellow-100 text-yellow-700",
  "Technical Analysis": "bg-emerald-100 text-emerald-700",
  Economy: "bg-slate-100 text-slate-600",
};

export default function NewsCard({ article }: NewsCardProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = article.imageUrl && !imgError;
  const mins = readingTime(article.content || article.description || "");
  const category = article.seoMeta?.articleSection || "Economy";
  const categoryClass = CATEGORY_COLORS[category] ?? CATEGORY_COLORS["Economy"];

  return (
    <article className="group relative bg-white border border-slate-200 rounded-[20px] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(31,209,118,0.1)] hover:-translate-y-1">
      <Link href={`/haber/${article.slug}`} prefetch={false} className="block">
        {/* Görsel Alanı */}
        <div className="relative w-full h-52 bg-slate-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showImage ? article.imageUrl! : "/news-placeholder.png"}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Kaynak Badge */}
          <div className="absolute top-4 left-4">
            <span className="badge-dark backdrop-blur-md bg-ui-dark/80">
              {article.sourceName}
            </span>
          </div>
        </div>

        <div className="p-6 flex flex-col h-full">
          {/* Üst Bilgi */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {/* Kategori rozeti */}
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${categoryClass}`}>
              {category}
            </span>
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

          {/* Alt Bilgiler */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
            {/* Read More Link */}
            <span className="inline-flex items-center gap-1 text-xs font-black text-primary uppercase tracking-widest">
              Read More <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
            {/* Okuma süresi rozeti */}
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              ⏱ {mins} min
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

