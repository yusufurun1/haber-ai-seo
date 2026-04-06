"use client";

import Link from "next/link";
import { useState } from "react";
import { NewsArticle, CATEGORY_INFO } from "@/lib/types";
import { formatDateTurkish } from "@/lib/seo-utils";

interface NewsCardProps {
  article: NewsArticle;
}

function readingTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").length;
  return Math.max(1, Math.ceil(words / 200));
}

const CATEGORY_COLORS: Record<string, string> = {
  technical: "bg-emerald-50 text-emerald-700 border-emerald-200",
  fundamental: "bg-blue-50 text-blue-700 border-blue-200",
  market: "bg-slate-50 text-slate-600 border-slate-200",
  crypto: "bg-violet-50 text-violet-700 border-violet-200",
  commodities: "bg-amber-50 text-amber-700 border-amber-200",
  "central-banks": "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const CATEGORY_DOT: Record<string, string> = {
  technical: "bg-emerald-500",
  fundamental: "bg-blue-500",
  market: "bg-slate-400",
  crypto: "bg-violet-500",
  commodities: "bg-amber-500",
  "central-banks": "bg-indigo-500",
};

export default function NewsCard({ article }: NewsCardProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = article.imageUrl && !imgError;
  const mins = readingTime(article.content || article.description || "");
  const category = article.category || "market";
  const categoryInfo = CATEGORY_INFO[category];
  const categoryClass = CATEGORY_COLORS[category] ?? CATEGORY_COLORS["market"];
  const dotClass = CATEGORY_DOT[category] ?? CATEGORY_DOT["market"];

  return (
    <article className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5">
      <Link href={`/haber/${article.slug}`} prefetch={false} className="block">
        {/* Image */}
        <div className="relative w-full aspect-[16/9] bg-slate-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showImage ? article.imageUrl! : "/news-placeholder.png"}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Source badge top-left */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
              {article.sourceName}
            </span>
          </div>

          {/* Reading time bottom-right */}
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-black/50 backdrop-blur-sm text-white">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {mins} min
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category + Date row */}
          <div className="flex items-center gap-2.5 mb-3">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${categoryClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
              {categoryInfo.shortLabel}
            </span>
            <time dateTime={article.publishedAt} className="text-[11px] text-slate-400 font-medium">
              {formatDateTurkish(article.publishedAt)}
            </time>
          </div>

          {/* Title */}
          <h2 className="text-[15px] font-bold text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors duration-200">
            {article.title}
          </h2>

          {/* Description */}
          <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
            {article.description}
          </p>

          {/* Read more */}
          <div className="mt-4 pt-3 border-t border-slate-50">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 group-hover:gap-2.5 transition-all duration-200">
              Read more
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

