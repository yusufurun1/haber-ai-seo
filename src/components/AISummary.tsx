// ==========================================
// AI Özet & Analiz Bileşeni
// Busy state, yeniden dene, gerçek AI badge
// ==========================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { AISummary as AISummaryType } from "@/lib/types";

interface AISummaryProps {
  title: string;
  content: string;
  sourceName: string;
  initialSummary?: AISummaryType;
  isLoading?: boolean;
}

export default function AISummary({
  title,
  content,
  sourceName,
  initialSummary,
  isLoading: parentLoading,
}: AISummaryProps) {
  const [summary, setSummary] = useState<AISummaryType | null>(
    initialSummary || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ai-ozet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, sourceName }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setSummary(data.data);
      } else {
        setError(data.error || "AI özet üretilemedi");
      }
    } catch {
      setError("AI özet yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [title, content, sourceName]);

  useEffect(() => {
    // Sadece eğer initialSummary yoksa VE ebeveyn yükleme yapmıyorsa VE henüz özetimiz yoksa istek at
    if (!initialSummary && !parentLoading && !summary) {
      fetchSummary();
    }
  }, [initialSummary, parentLoading, summary, fetchSummary]);

  // initialSummary değişirse (ebeveyn yüklemeyi bitirdiğinde) state'i güncelle
  useEffect(() => {
    if (initialSummary) {
      setSummary(initialSummary);
    }
  }, [initialSummary]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    fetchSummary();
  };

  // === LOADING STATE ===
  if (loading || (parentLoading && !summary)) {
    return (
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-blue-500/30 rounded-full" />
          <div className="h-4 w-32 bg-blue-500/20 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-blue-500/15 rounded w-full" />
          <div className="h-3 bg-blue-500/15 rounded w-5/6" />
          <div className="h-3 bg-blue-500/15 rounded w-4/6" />
        </div>
        <p className="text-xs text-blue-400/50 mt-4">
          🤖 AI analiz hazırlanıyor...
        </p>
      </div>
    );
  }

  // === BUSY STATE (API yoğun / rate limited) ===
  if (summary && summary.aiStatus === "busy") {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">🤖</span>
            <h3 className="text-base font-bold text-amber-600">
              Yapay Zeka Şu An Çok Yoğun
            </h3>
          </div>
          <span className="text-xs bg-amber-500/20 text-amber-600 px-2.5 py-1 rounded-full font-medium">
            ⏳ Beklemede
          </span>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-700 leading-relaxed">
            {summary.statusMessage ||
              "Yapay zeka sunucusu şu anda yoğun talep nedeniyle geçici olarak meşgul. Bu durum genellikle birkaç dakika içinde düzelir."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 border border-amber-500/30 px-4 py-2 rounded-lg transition-all text-sm font-medium"
          >
            🔄 Tekrar Dene {retryCount > 0 && `(${retryCount})`}
          </button>
          <span className="text-xs text-amber-600/70">
            Yapay zeka analizi hazır olduğunda otomatik görünecektir
          </span>
        </div>
      </div>
    );
  }

  // === ERROR STATE ===
  if (error || !summary) {
    return (
      <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">⚠️</span>
          <h3 className="text-base font-bold text-red-600">
            AI Analiz Yüklenemedi
          </h3>
        </div>
        <p className="text-sm text-red-500 mb-3">
          {error || "Bilinmeyen bir hata oluştu."}
        </p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 border border-red-500/30 px-4 py-2 rounded-lg transition-all text-sm font-medium"
        >
          🔄 Tekrar Dene
        </button>
      </div>
    );
  }

  // === READY STATE (Gerçek AI veya Demo) ===
  const sentimentConfig = {
    positive: {
      bg: "bg-primary/5",
      border: "border-primary/20",
      icon: "📈",
      label: "Pozitif Etki",
      color: "text-primary",
      badge: "bg-primary text-ui-dark",
    },
    negative: {
      bg: "bg-red-50",
      border: "border-red-100",
      icon: "📉",
      label: "Negatif Etki",
      color: "text-red-600",
      badge: "bg-red-600 text-white",
    },
    neutral: {
      bg: "bg-slate-50",
      border: "border-slate-100",
      icon: "➡️",
      label: "Nötr Etki",
      color: "text-slate-600",
      badge: "bg-ui-dark text-white",
    },
  };

  const config = sentimentConfig[summary.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-[24px] p-8 shadow-sm transition-all duration-500`}
    >
      {/* Başlık + AI Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-ui-dark flex items-center justify-center text-white shadow-lg">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-ui-dark uppercase tracking-tight leading-none mb-1">AI Analiz</h3>
            <div className="flex items-center gap-2">
              {summary.isAIGenerated ? (
                <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse"></span> Gemini AI Güdümlü
                </span>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span> Hızlı Mod
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 ${config.badge}`}>
          {config.icon} {config.label}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Özet */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-[2px] bg-primary"></div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Özet Rapor
            </h4>
          </div>
          <p className="text-ui-dark/90 leading-relaxed font-medium">
            {summary.summary}
          </p>
        </div>

        {/* Analiz */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-[2px] bg-primary"></div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Piyasa Etkisi
            </h4>
          </div>
          <p className="text-ui-dark/90 leading-relaxed font-medium">
            {summary.analysis}
          </p>
        </div>
      </div>

      {/* Etkilenen Pariteler */}
      {summary.affectedPairs.length > 0 && (
        <div className="mt-10 pt-8 border-t border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Takip Edilecek Pariteler
          </h4>
          <div className="flex gap-3 flex-wrap">
            {summary.affectedPairs.map((pair: string) => (
              <span
                key={pair}
                className="text-xs font-black bg-white border border-slate-200 px-4 py-2 rounded-xl text-ui-dark shadow-sm hover:border-primary transition-colors cursor-default"
              >
                {pair}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Not + Yeniden dene */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100/50">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center sm:text-left leading-relaxed">
          ⚠️ Yapay zeka verileri bilgilendirme amaçlıdır. <br className="hidden sm:block" />
          Finansal tavsiye olarak değerlendirilemez.
        </p>
        {!summary.isAIGenerated && (
          <button
            onClick={handleRetry}
            className="group flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] hover:text-amber-600 transition-all bg-amber-50 px-4 py-2 rounded-full"
          >
            <span className="transition-transform group-hover:rotate-180 duration-500">🔄</span> AI GÜNCELLE
          </button>
        )}
      </div>
    </div>
  );
}
