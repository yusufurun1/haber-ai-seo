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
}

export default function AISummary({
  title,
  content,
  sourceName,
  initialSummary,
}: AISummaryProps) {
  const [summary, setSummary] = useState<AISummaryType | null>(
    initialSummary || null
  );
  const [loading, setLoading] = useState(!initialSummary);
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
    if (initialSummary) return;
    fetchSummary();
  }, [initialSummary, fetchSummary]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    fetchSummary();
  };

  // === LOADING STATE ===
  if (loading) {
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
            <h3 className="text-base font-bold text-amber-400">
              Yapay Zeka Şu An Çok Yoğun
            </h3>
          </div>
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-medium">
            ⏳ Beklemede
          </span>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-200/80 leading-relaxed">
            {summary.statusMessage ||
              "Yapay zeka sunucusu şu anda yoğun talep nedeniyle geçici olarak meşgul. Bu durum genellikle birkaç dakika içinde düzelir."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-lg transition-all text-sm font-medium"
          >
            🔄 Tekrar Dene {retryCount > 0 && `(${retryCount})`}
          </button>
          <span className="text-xs text-amber-400/50">
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
          <h3 className="text-base font-bold text-red-400">
            AI Analiz Yüklenemedi
          </h3>
        </div>
        <p className="text-sm text-red-300/70 mb-3">
          {error || "Bilinmeyen bir hata oluştu."}
        </p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-4 py-2 rounded-lg transition-all text-sm font-medium"
        >
          🔄 Tekrar Dene
        </button>
      </div>
    );
  }

  // === READY STATE (Gerçek AI veya Demo) ===
  const sentimentConfig = {
    positive: {
      bg: "from-green-500/10 to-emerald-500/10",
      border: "border-green-500/20",
      icon: "📈",
      label: "Pozitif Etki",
      color: "text-green-400",
    },
    negative: {
      bg: "from-red-500/10 to-rose-500/10",
      border: "border-red-500/20",
      icon: "📉",
      label: "Negatif Etki",
      color: "text-red-400",
    },
    neutral: {
      bg: "from-blue-500/10 to-purple-500/10",
      border: "border-blue-500/20",
      icon: "➡️",
      label: "Nötr Etki",
      color: "text-blue-400",
    },
  };

  const config = sentimentConfig[summary.sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;

  return (
    <div
      className={`bg-gradient-to-r ${config.bg} border ${config.border} rounded-xl p-6 space-y-4`}
    >
      {/* Başlık + AI Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h3 className="text-base font-bold text-white">AI Analiz</h3>
          {summary.isAIGenerated ? (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
              ✅ Gemini AI
            </span>
          ) : (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
              ⚡ Hızlı Mod
            </span>
          )}
        </div>
        <span
          className={`text-sm font-medium ${config.color} flex items-center gap-1`}
        >
          {config.icon} {config.label}
        </span>
      </div>

      {/* Özet */}
      <div>
        <h4 className="text-xs font-semibold text-forex-muted uppercase tracking-wider mb-2">
          📝 Kısa Özet
        </h4>
        <p className="text-sm text-forex-text leading-relaxed">
          {summary.summary}
        </p>
      </div>

      {/* Analiz */}
      <div>
        <h4 className="text-xs font-semibold text-forex-muted uppercase tracking-wider mb-2">
          🔍 Piyasa Analizi
        </h4>
        <p className="text-sm text-forex-text leading-relaxed">
          {summary.analysis}
        </p>
      </div>

      {/* Etkilenen Pariteler */}
      {summary.affectedPairs.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-forex-muted uppercase tracking-wider mb-2">
            💱 Etkilenen Pariteler
          </h4>
          <div className="flex gap-2 flex-wrap">
            {summary.affectedPairs.map((pair: string) => (
              <span
                key={pair}
                className="text-xs font-mono bg-forex-dark/60 border border-forex-border px-3 py-1.5 rounded-lg text-forex-gold"
              >
                {pair}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Not + Yeniden dene */}
      <div className="flex items-center justify-between pt-2 border-t border-forex-border/50">
        <p className="text-[10px] text-forex-muted/60">
          ⚠️ Bu analiz yapay zeka tarafından üretilmiştir. Yatırım tavsiyesi
          niteliği taşımaz.
        </p>
        {!summary.isAIGenerated && (
          <button
            onClick={handleRetry}
            className="text-[10px] text-amber-400/70 hover:text-amber-300 transition-colors"
            title="Gemini AI ile yeniden analiz üret"
          >
            🔄 AI ile güncelle
          </button>
        )}
      </div>
    </div>
  );
}
