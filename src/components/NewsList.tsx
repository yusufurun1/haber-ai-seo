"use client";

import { useState } from "react";
import { NewsArticle } from "@/lib/types";
import NewsCard from "./NewsCard";

const PAGE_SIZE = 12;

interface NewsListProps {
  articles: NewsArticle[];
}

export default function NewsList({ articles }: NewsListProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (articles.length === 0) {
    return null;
  }

  const shown = articles.slice(0, visible);
  const hasMore = visible < articles.length;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {shown.map((article) => (
          <NewsCard key={article.slug} article={article} />
        ))}
      </div>

      {hasMore && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
          >
            Load more
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <span className="text-xs text-slate-400 font-medium">
            {shown.length} of {articles.length}
          </span>
        </div>
      )}
    </div>
  );
}

