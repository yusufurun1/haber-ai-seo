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
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-xl font-bold text-ui-dark mb-2">
          No news found
        </h2>
        <p className="text-text-muted">
          No news matches your criteria. Try changing the filters.
        </p>
      </div>
    );
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
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 border-slate-200 text-sm font-black uppercase tracking-widest text-slate-500 hover:border-primary hover:text-primary transition-all duration-300"
          >
            Load More
            <span className="text-lg transition-transform duration-300 group-hover:translate-y-1">↓</span>
          </button>
          <span className="ml-4 self-center text-xs text-slate-400 font-bold">
            {shown.length} / {articles.length}
          </span>
        </div>
      )}
    </div>
  );
}

