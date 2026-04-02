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
      {/* Sayfa Başlığı (Hero) - comofx Style */}
      <div className="mb-14">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-[0.2em]">Canlı Akış</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl max-w-4xl leading-[1.05] tracking-tight">
            Akıllı Piyasa <span className="text-primary italic">Analizi</span> ve Haberleri
          </h1>
          
          <p className="text-text-muted text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
            Yapay zeka ile güçlendirilmiş, gerçek zamanlı forex haberleri ve 
            derinlemesine piyasa özetleri ile kararlarınızı temellendirin.
          </p>

          <div className="flex flex-wrap items-center gap-8 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] bg-ui-dark flex items-center justify-center text-white font-bold shadow-lg">AI</div>
              <div className="text-sm">
                <p className="font-extrabold text-ui-dark">Yapay Zeka</p>
                <p className="text-text-muted">Anlık Özetleme</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] bg-primary/20 flex items-center justify-center text-primary font-bold">5m</div>
              <div className="text-sm">
                <p className="font-extrabold text-ui-dark">Güncel Veri</p>
                <p className="text-text-muted">Sürekli Yenilenen</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Haber Listesi */}
      <div className="relative min-h-[400px]">
        <NewsList articles={articles} />
      </div>

      {/* Bilgilendirme Kartı */}
      <section className="mt-24 overflow-hidden rounded-[32px] bg-ui-dark p-10 md:p-16 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] -mr-48 -mt-48"></div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl text-white mb-8 tracking-tight">Neden Bizi Takip Etmelisiniz?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-3">
                <h3 className="text-primary text-xl font-black italic uppercase tracking-wider">Hız</h3>
                <p className="text-slate-400 leading-relaxed">Piyasa hareketlerini saniyeler içinde analiz edin ve rakiplerinizin önüne geçin.</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-primary text-xl font-black italic uppercase tracking-wider">Doğruluk</h3>
                <p className="text-slate-400 leading-relaxed">Gürültüyü temizleyen AI algoritmalarımızla en saf verilere ulaşın.</p>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[24px] text-white flex flex-col items-center text-center">
              <p className="text-5xl font-black mb-2 text-primary">{articles.length}+</p>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-[0.2em]">Günlük Analiz</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
