// ==========================================
// Haber Detay Bileşeni
// Tam haber içeriğini gösterir
// AI özet ve expanded content client-side lazy load
// ==========================================

"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { NewsArticle } from "@/lib/types";
import { formatDateTurkish } from "@/lib/seo-utils";
import AISummary from "./AISummary";

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
  const [expandedContent, setExpandedContent] = useState<string | null>(article.expandedContent || null);
  const [expandedLoading, setExpandedLoading] = useState(!article.expandedContent);
  const [expandedError, setExpandedError] = useState(false);
  
  const readingTime = estimateReadingTime(article.content);
  const hasContent = article.content && article.content.trim().length > 50;

  // Expanded content'i client-side'da lazy load et
  const fetchExpandedContent = useCallback(async () => {
    if (article.expandedContent) return; // Zaten varsa tekrar çekme
    
    try {
      setExpandedLoading(true);
      setExpandedError(false);
      
      const res = await fetch("/api/ai-ozet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: article.title,
          content: article.content,
          sourceName: article.sourceName,
          expand: true, // Expanded content de iste
        }),
      });
      
      const data = await res.json();
      
      if (data.success && data.data?.expandedArticle) {
        setExpandedContent(data.data.expandedArticle);
      } else {
        setExpandedError(true);
      }
    } catch {
      setExpandedError(true);
    } finally {
      setExpandedLoading(false);
    }
  }, [article.title, article.content, article.sourceName, article.expandedContent]);

  useEffect(() => {
    // Sayfa yüklendiğinde expanded content'i çek
    fetchExpandedContent();
  }, [fetchExpandedContent]);

  return (
    <article className="max-w-3xl mx-auto">
      {/* Breadcrumb (SEO için önemli) */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-forex-muted">
          <li>
            <Link
              href="/"
              className="hover:text-forex-gold transition-colors"
            >
              Ana Sayfa
            </Link>
          </li>
          <li>/</li>
          <li>
            <span className="text-forex-text">Forex Haberleri</span>
          </li>
        </ol>
      </nav>

      {/* Kaynak, Tarih ve Okuma Süresi */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-sm font-medium text-forex-gold bg-forex-gold/10 px-3 py-1 rounded-full">
          {article.sourceName}
        </span>
        <time
          dateTime={article.publishedAt}
          className="text-sm text-forex-muted"
        >
          {formatDateTurkish(article.publishedAt)}
        </time>
        {article.author && (
          <>
            <span className="text-forex-muted">•</span>
            <span className="text-sm text-forex-muted">
              {article.author}
            </span>
          </>
        )}
        {hasContent && (
          <>
            <span className="text-forex-muted hidden sm:inline">•</span>
            <span className="text-sm text-forex-muted hidden sm:inline-flex items-center gap-1">
              ⏱ {readingTime} dk okuma
            </span>
          </>
        )}
      </div>

      {/* Başlık (H1 - SEO için kritik) */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
        {article.title}
      </h1>

      {/* Haber Görseli — native img, ORB/CORS sorunlarını önler */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={!imgError && article.imageUrl ? article.imageUrl : "/news-placeholder.png"}
          alt={article.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>

      {/* AI Özet & Analiz Kutusu */}
      <div className="mb-8">
        <AISummary
          title={article.title}
          content={article.content}
          sourceName={article.sourceName}
          initialSummary={article.aiSummary}
        />
      </div>

      {/* Yapay Zeka ile Genişletilmiş Haber İçeriği */}
      {expandedContent ? (
        <div className="mb-8 prose prose-invert prose-lg max-w-none">
          <div className="bg-gradient-to-b from-forex-card to-forex-dark border border-forex-gold/30 rounded-xl p-6 md:p-8 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
            <h2 className="text-xl font-bold text-forex-gold mb-6 flex items-center gap-2 border-b border-forex-border pb-4">
              ✨ Detaylı Analiz ve Değerlendirme
            </h2>
            <div
              className="text-forex-text leading-relaxed article-html-content space-y-4"
              dangerouslySetInnerHTML={{ __html: expandedContent }}
            />
          </div>
        </div>
      ) : expandedLoading ? (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-6 md:p-8 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🤖</span>
              <h2 className="text-lg font-bold text-blue-400">
                Detaylı AI Analiz Yükleniyor...
              </h2>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-blue-500/10 rounded w-full" />
              <div className="h-4 bg-blue-500/10 rounded w-5/6" />
              <div className="h-4 bg-blue-500/10 rounded w-4/6" />
              <div className="h-4 bg-blue-500/10 rounded w-3/4" />
            </div>
            <p className="text-xs text-blue-400/50 mt-4">
              Yapay zeka analizi hazırlanıyor, lütfen bekleyin...
            </p>
          </div>
        </div>
      ) : expandedError ? (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⏳</span>
              <h2 className="text-lg font-bold text-amber-400">
                Detaylı AI Analiz Geçici Olarak Kullanılamıyor
              </h2>
            </div>
            <p className="text-sm text-amber-200/70 leading-relaxed">
              Yapay zeka şu an yoğun olduğu için detaylı analiz yüklenemedi.
              Sayfayı yenileyerek tekrar deneyebilirsiniz.
            </p>
            <button
              onClick={() => fetchExpandedContent()}
              className="mt-4 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm font-medium"
            >
              🔄 Tekrar Dene
            </button>
          </div>
        </div>
      ) : null}

      {/* Orijinal Haber İçeriği */}
      <div className="prose prose-invert prose-lg max-w-none">
        <div className="bg-forex-card border border-forex-border rounded-xl p-6 md:p-8 opacity-90">
          <h2 className="text-lg font-semibold text-forex-gold mb-4 flex items-center gap-2">
            📰 Orijinal Kaynak İçeriği
          </h2>

          {hasContent ? (
            <div
              className="text-forex-text leading-relaxed article-html-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-forex-muted text-lg mb-4">
                Bu haberin detaylı içeriği orijinal kaynaktan okunabilir.
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-2 bg-forex-gold/10 text-forex-gold border border-forex-gold/30 px-5 py-2.5 rounded-lg hover:bg-forex-gold/20 transition-colors font-medium"
              >
                🔗 Orijinal haberi oku →
              </a>
            </div>
          )}

          {/* Orijinal Kaynağa Git Butonu */}
          <div className="mt-6 pt-4 border-t border-forex-border">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-forex-gold/10 to-forex-gold/5 border border-forex-gold/20 text-forex-gold py-2.5 px-4 rounded-lg hover:from-forex-gold/20 hover:to-forex-gold/10 transition-all text-sm font-medium"
            >
              🔗 Haberi Orijinal Kaynağından Okumaya Devam Et →
            </a>
            <p className="text-xs text-forex-muted mt-2 text-center">
              📌 Orijinal kaynak:{" "}
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-forex-gold hover:underline"
              >
                {article.sourceName} - Haberin orijinalini oku →
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Geri Dön Butonu */}
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-forex-muted hover:text-forex-gold transition-colors"
        >
          ← Tüm haberlere dön
        </Link>
      </div>
    </article>
  );
}

