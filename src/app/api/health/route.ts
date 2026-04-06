// ==========================================
// GET /api/health
// Cache durumu, circuit breaker ve scrape istatistikleri
// ==========================================

import { NextResponse } from "next/server";
import { getCacheStats } from "@/lib/cache";
import { getScrapeStats } from "@/lib/scraper";
import { getCircuitBreakerStats } from "@/lib/news-fetcher";
import { HealthResponse } from "@/lib/types";

// Her istekte taze veri — cache yapma
export const dynamic = "force-dynamic";

export async function GET() {
  const cache = getCacheStats();
  const circuitBreakers = getCircuitBreakerStats();
  const scrapeStats = getScrapeStats();
  // Degraded: circuit breaker açık kaynak varsa veya cache çok eskiyse
  const hasOpenCircuit = Object.values(circuitBreakers).some(
    (cb) => cb.disabledUntilMs > Date.now()
  );
  const cacheVeryOld = cache.ageSeconds > 600; // 10 dakikadan eski

  const status: HealthResponse["status"] =
    hasOpenCircuit || cacheVeryOld ? "degraded" : "ok";

  const body: HealthResponse = {
    status,
    cache,
    circuitBreakers,
    scrapeStats,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: status === "ok" ? 200 : 207,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
