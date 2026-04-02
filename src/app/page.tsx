// ==========================================
// Ana Sayfa - Forex Haber Listesi
// SSR ile haber çekme (SEO uyumlu)
// ==========================================

import { fetchAllNews } from "@/lib/news-fetcher";
import NewsList from "@/components/NewsList";

// 5 dakikada bir revalidate (ISR - Incremental Static Regeneration)
export const revalidate = 300;

export default async function HomePage() {
  // Ana sayfada AI çağrısı YAPMA — haberler anında yüklensin
  // AI özet sadece haber detay sayfasında üretilir
  const articles = await fetchAllNews();

  return (
    <div className="animate-fadeIn">
      {/* Sayfa Başlığı */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📊</span>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Forex Haberleri
          </h1>
        </div>
        <p className="text-forex-muted text-sm md:text-base">
          Güvenilir kaynaklardan derlenen güncel forex haberleri ve AI destekli
          piyasa analizleri
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs text-forex-muted">
          <span className="flex items-center gap-1">
            🤖 AI ile özetleniyor
          </span>
          <span className="flex items-center gap-1">
            🔄 Her 5 dakikada güncelleniyor
          </span>
          <span className="flex items-center gap-1">
            📰 {articles.length} haber
          </span>
        </div>
      </div>

      {/* Haber Listesi */}
      <NewsList articles={articles} />

      {/* SEO İçin Ek Metin */}
      <section className="mt-12 bg-forex-card border border-forex-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-3">
          Forex Piyasası Hakkında
        </h2>
        <div className="text-sm text-forex-muted space-y-2">
          <p>
            Forex (Foreign Exchange) piyasası, dünyanın en büyük ve en likit
            finansal piyasasıdır. Günlük işlem hacmi 6 trilyon doları aşan bu
            piyasada, döviz çiftleri aracılığıyla para birimleri alınıp
            satılmaktadır.
          </p>
          <p>
            EUR/USD, GBP/USD, USD/JPY ve USD/TRY gibi popüler döviz çiftlerinin
            fiyat hareketleri; merkez bankası kararları, ekonomik veriler ve
            jeopolitik gelişmelerden doğrudan etkilenmektedir.
          </p>
          <p>
            Bu sayfada, güvenilir haber kaynaklarından derlenen güncel forex
            haberlerini, yapay zeka destekli özetler ve piyasa analizleri ile
            birlikte sunuyoruz.
          </p>
        </div>
      </section>
    </div>
  );
}
