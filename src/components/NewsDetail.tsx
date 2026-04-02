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
    <article className="max-w-4xl mx-auto animate-fadeIn">
      {/* Breadcrumb - Minimalist comofx style */}
      <nav aria-label="Breadcrumb" className="mb-10">
        <ol className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">
              Ana Sayfa
            </Link>
          </li>
          <li className="text-slate-200">/</li>
          <li>
            <span className="text-ui-dark">Forex Haber Detay</span>
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
            Yazar: <span className="text-ui-dark">{article.author}</span>
          </span>
        )}
        {hasContent && (
          <span className="text-sm text-slate-500 flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full font-bold">
            ⏱ {readingTime} dk okuma
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

      {/* AI Özet & Analiz Kutusu */}
      <div className="mb-14 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-hover rounded-[28px] opacity-20 blur-lg group-hover:opacity-30 transition duration-500"></div>
        <div className="relative">
          <AISummary
            title={article.title}
            content={article.content}
            sourceName={article.sourceName}
            initialSummary={article.aiSummary}
          />
        </div>
      </div>

      {/* Yapay Zeka ile Genişletilmiş Haber İçeriği */}
      {expandedContent ? (
        <div className="mb-16">
          <div className="bg-ui-dark rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32"></div>
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <span className="text-primary italic uppercase tracking-wider">✨ AI</span> Detaylı Analiz
            </h2>
            <div
              className="text-slate-300 leading-relaxed article-html-content space-y-6"
              dangerouslySetInnerHTML={{ __html: expandedContent }}
            />
          </div>
        </div>
      ) : expandedLoading ? (
        <div className="mb-16">
          <div className="bg-slate-50 rounded-[32px] p-10 md:p-14 border-2 border-dashed border-slate-200 animate-pulse-soft flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-xl font-black text-ui-dark mb-4">
              AI Derinlemesine Analiz Hazırlanıyor...
            </h2>
            <div className="w-full max-w-md space-y-4">
              <div className="h-3 bg-slate-200 rounded-full w-full" />
              <div className="h-3 bg-slate-200 rounded-full w-5/6 mx-auto" />
              <div className="h-3 bg-slate-200 rounded-full w-4/6 mx-auto" />
            </div>
          </div>
        </div>
      ) : expandedError ? (
        <div className="mb-16">
          <div className="bg-red-50 rounded-[32px] p-10 md:p-14 border border-red-100 text-center">
            <span className="text-4xl mb-6 block">⚠️</span>
            <h2 className="text-xl font-black text-red-900 mb-4 italic uppercase tracking-wider">
              AI Analiz Geçici Olarak Kullanılamıyor
            </h2>
            <p className="text-red-700/70 max-w-sm mx-auto mb-8">
              Yapay zeka şu an yoğun olduğu için analiz yüklenemedi. Lütfen tekrar deneyin.
            </p>
            <button
              onClick={() => fetchExpandedContent()}
              className="px-8 py-3 bg-red-600 text-white rounded-full font-black uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 text-xs"
            >
              🔄 Tekrar Dene
            </button>
          </div>
        </div>
      ) : null}

      {/* Orijinal Haber İçeriği */}
      <div className="mb-16">
        <div className="bg-white border border-slate-200 rounded-[32px] p-8 md:p-14 shadow-sm">
          <h2 className="text-xs font-black text-ui-dark/40 uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-slate-200"></span> 📰 Orijinal İçerik
          </h2>

          {hasContent ? (
            <div
              className="text-ui-dark leading-relaxed article-html-content font-medium opacity-90"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg mb-10 italic">
                Bu haberin detaylı içeriği sadece orijinal kaynak üzerinden erişilebilirdir.
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn-primary"
              >
                🔗 Orijinal Haberi Oku
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
              Tam içeriği görüntüle <span className="transition-transform group-hover:translate-x-2">→</span>
            </a>
            <p className="text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest">
              Kaynak: <span className="text-ui-dark">{article.sourceName}</span>
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
          <span className="transition-transform group-hover:-translate-x-2">←</span> Tüm Haberler
        </Link>
      </div>
    </article>
  );
}

