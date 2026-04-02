// ==========================================
// Haber Listesi Bileşeni
// Haber kartlarını grid olarak listeler
// ==========================================

import { NewsArticle } from "@/lib/types";
import NewsCard from "./NewsCard";

interface NewsListProps {
  articles: NewsArticle[];
}

export default function NewsList({ articles }: NewsListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-xl font-bold text-ui-dark mb-2">
          Henüz haber bulunamadı
        </h2>
        <p className="text-text-muted">
          Forex haberleri yükleniyor veya kaynak bağlantısı kontrol ediliyor...
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {articles.map((article) => (
        <NewsCard key={article.slug} article={article} />
      ))}
    </div>
  );
}
