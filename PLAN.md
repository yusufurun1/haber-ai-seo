# 📰 Forex Haber SEO Projesi - 100 Adımlık Uygulama Planı

## 🎯 Proje Amacı
RSS feed'leri ve açık API'lardan forex haberlerini en iyi şekilde çekip, SEO uyumlu, hızlı ve güvenilir bir haber platformu oluşturmak. **Yapay zeka kullanılmaz.**

---

## ✅ TAMAMLANAN ADIMLAR

| # | Görev | Durum |
|---|-------|-------|
| 1 | `@google/generative-ai` paketini kaldır | ✅ Tamamlandı |
| 2 | `.env.local` ve `.env.local.example` AI anahtarlarını kaldır | ✅ Tamamlandı |
| 3 | `layout.tsx` AI metin referanslarını temizle | ✅ Tamamlandı |
| 4 | `seo-utils.ts` site adını güncelle | ✅ Tamamlandı |
| 5 | `news-fetcher.ts` AI metin referanslarını temizle | ✅ Tamamlandı |
| 6 | `types.ts` AI yorum satırlarını güncelle | ✅ Tamamlandı |
| 7 | `NewsDetail.tsx`, `page.tsx`, `[slug]/page.tsx` AI yorumlarını kaldır | ✅ Tamamlandı |

---

## 📋 UYGULAMA AŞAMALARI

---

### 🟦 AŞAMA A — RSS Feed Altyapısı (Adım 8–30)

**Adım 8:** Mevcut üç RSS feed kaynağını (Cointelegraph, ForexLive, Investing.com) kararlılık testinden geçir  
**Adım 9:** `morss.it` proxy'si üzerinden çekilen Cointelegraph feed'ini doğrudan RSS URL'siyle değiştir  
**Adım 10:** Her feed için bireysel `try/catch` ile izolasyon sağla — bir feed'in çökmesi diğerlerini etkilemez  
**Adım 11:** Reuters Forex RSS feed'ini ekle: `https://feeds.reuters.com/reuters/businessNews`  
**Adım 12:** DailyFX RSS feed'ini ekle: `https://www.dailyfx.com/feeds/all`  
**Adım 13:** FXStreet RSS feed'ini ekle: `https://www.fxstreet.com/rss`  
**Adım 14:** MarketWatch Currencies RSS feed'ini ekle: `https://feeds.marketwatch.com/marketwatch/marketpulse/`  
**Adım 15:** Her feed için `timeout` değerini bağımsız konfigüre et (hızlı feed: 8sn, yavaş feed: 15sn)  
**Adım 16:** Feed başarısızlık sayacı ekle — ardışık 3 hata sonrası feed'i devre dışı bırak (circuit breaker)  
**Adım 17:** Devre dışı feed'leri 10 dakika sonra otomatik yeniden dene  
**Adım 18:** Tüm feed'leri `Promise.allSettled` ile paralel çek  
**Adım 19:** Feed başına çekilecek maksimum haber sayısını `.env`'den konfigüre et (`FEED_ITEM_LIMIT=20`)  
**Adım 20:** RSS item'larında `media:content`, `media:thumbnail`, `enclosure` tüm görsel alanlarını tara  
**Adım 21:** RSS `content:encoded` içinde `<img>` tag'larından görsel URL'yi fallback olarak çıkar  
**Adım 22:** RSS `pubDate` ve `isoDate` için güçlü tarih parse fonksiyonu yaz (moment bağımlılığı olmadan)  
**Adım 23:** RSS item'larından `author`/`creator`/`dc:creator` alanlarını öncelik sırasıyla oku  
**Adım 24:** RSS içeriğindeki HTML encoding sorunlarını düzelt (HTML entities decode)  
**Adım 25:** Çok büyük feed response'larını sınırla (max 2MB limit)  
**Adım 26:** Feed'lerde `ETag` / `Last-Modified` header'ı ile conditional GET uygula — bant genişliğinden tasarruf  
**Adım 27:** Feed per-item işlemeyi `Promise.allSettled` batch sistemiyle (5'li gruplar) devam ettir  
**Adım 28:** Her başarılı feed çekiminden sonra kaynak adını, item sayısını ve süresini logla  
**Adım 29:** RSS parser kütüphanesinin (`rss-parser`) versiyon güncelleme gereksinimini kontrol et  
**Adım 30:** Tüm RSS kaynaklarını local'de çalıştırıp içerik kalitesini doğrula  

---

### 🟩 AŞAMA B — NewsAPI Entegrasyonu (Adım 31–45)

**Adım 31:** NewsAPI query listesini forex'e özelleştir: `["forex", "EUR/USD", "GBP/USD", "USD/TRY", "currency trading", "FOMC", "ECB", "central bank"]`  
**Adım 32:** NewsAPI isteklerini `domains` filtresiyle güvenilir kaynaklara kısıtla (reuters.com, bloomberg.com, ft.com, marketwatch.com, cnbc.com)  
**Adım 33:** NewsAPI her sorgu için max `pageSize=10` ile toplam istek sayısını günlük limitte tut  
**Adım 34:** NewsAPI'ya günlük istek sayacı ekle — 90/100 limitine ulaşınca logu uyar  
**Adım 35:** NewsAPI `[Removed]` başlıklı makaleleri kesin olarak filtrele  
**Adım 36:** NewsAPI `urlToImage` alanını doğrula — geçersiz URL ise `null` ata  
**Adım 37:** NewsAPI `content` alanı kesilmiş geliyorsa ham `description` alanını `content` olarak kullan  
**Adım 38:** NewsAPI kaynaklarından gelen haberlerin slug'larında NewsAPI prefix ekle (duplicate önleme)  
**Adım 39:** NewsAPI için yedek: `GNews API` (gnews.io) entegrasyon hazırlığı — API keyi `.env`'e ekle  
**Adım 40:** NewsAPI `language=en` ve `language=tr` için ayrı sorgu döngüsü yaz  
**Adım 41:** NewsAPI hata durumlarını granüler yönet: 401 (key hatalı), 429 (rate limit), 500 (server)  
**Adım 42:** NewsAPI'dan gelen verileri diğer kaynaklarla aynı `RawNewsItem` yapısına normalize et  
**Adım 43:** NewsAPI publish time'ını UTC'den Türkiye saatine normalize et (görüntüleme için)  
**Adım 44:** NewsAPI için `stale-while-revalidate` Next.js fetch seçeneği ile 5 dakikalık cache uygula  
**Adım 45:** NewsAPI bağımlılığı olmadan sistemin çalışmaya devam ettiğini test et  

---

### 🟨 AŞAMA C — İçerik Scraping Motoru (Adım 46–65)

**Adım 46:** `scrapeArticlePage` fonksiyonunu site bazında özelleştirilebilir hale getir  
**Adım 47:** Cointelegraph için özel `articleBody` selector yaz  
**Adım 48:** ForexLive için özel `entry-content` selector yaz  
**Adım 49:** Investing.com için scraping deneme / hata analizi — paywall olmayan bölümleri tespit et  
**Adım 50:** User-Agent listesi oluştur ve her istekte rastgele seç (10+ gerçekçi browser UA)  
**Adım 51:** Scraping isteklerine `Accept-Encoding: gzip, deflate, br` header ekle  
**Adım 52:** Scraping `fetch` çağrısı için exponential backoff retry (max 2 deneme, 2sn gecikme) uygula  
**Adım 53:** Scraping sonucunu `url → ScrapedArticle` Map'inde TTL ile cache'le (TTL: 30 dakika)  
**Adım 54:** Scrape cache boyutunu dinamik yönet — LRU (en az kullanılan önce silinir) algoritması uygula  
**Adım 55:** `cleanArticleHtml` fonksiyonunu güncel sosyal medya butonları, paywall overlay'leri için güncelle  
**Adım 56:** İçerik kelime sayacı — 100 kelimeden az sonucu `shortContent` olarak işaretle  
**Adım 57:** Scraping başarı/başarısız oranını kaynak bazında hafızada tut ve logla  
**Adım 58:** Başarı oranı %30'un altına düşen kaynaklar için scraping'i otomatik devre dışı bırak  
**Adım 59:** `fetchNewsBySlug` içinde lazy scraping akışını test et — ilk tıklamada içerik gelmeli  
**Adım 60:** Scraping'de görsel kalite doğrulama: min 200×150px boyutunu kontrol et (og:image meta'sından)  
**Adım 61:** `<article>` tag'ı bulunamadığında JSON-LD `articleBody` alanını parse et  
**Adım 62:** İçerikteki yazar kutularını, "Related Articles" bölümlerini, reklamları kaldıran regex listesini genişlet  
**Adım 63:** Scraping'de absolute URL'ye çevirme işlemini `<a href>` tag'larına da uygula  
**Adım 64:** Scraping'den dönen HTML'i `sanitize.ts` ile güvenlik filtresi geçirecek şekilde entegre et  
**Adım 65:** Tüm scraping işlemlerini server-side'da tutarak XSS riskini sıfırla  

---

### 🟧 AŞAMA D — Cache ve Veri Birleştirme (Adım 66–75)

**Adım 66:** `fetchAllNews` cache TTL'ini `NEWS_CACHE_TTL=5 dakika` sabiti ile konfigüre edilebilir yap  
**Adım 67:** Cache'i `slug → NewsArticle` Map'ine dönüştür — `fetchNewsBySlug` için O(n) yerine O(1) lookup  
**Adım 68:** Duplicate tespitini başlık benzerligi + URL bazlı hibrit yap (Levenshtein yerine basit n-gram)  
**Adım 69:** Maksimum cache boyutunu `MAX_CACHE_SIZE=1000` ile sınırla  
**Adım 70:** 7 günden eski haberleri cache'e almayı engelle  
**Adım 71:** `fetchAllNews` çağrısında Promise.allSettled döngüsünden toplam kaynak sayısını logla  
**Adım 72:** Cache miss durumunda "stale" veri döndürüp arka planda yenileme başlat (background revalidation)  
**Adım 73:** Haber sıralama: `publishedAt DESC` + kaynak güvenilirlik skoru ile kompozit sıralama  
**Adım 74:** `getDemoNews` fonksiyonunu güncel sahte verilerle yenile — gerçekçi içerik  
**Adım 75:** Cache'in uygulama restart sonrasında sıfırlandığını ve yeniden doldurulduğunu test et  

---

### 🟥 AŞAMA E — API Katmanı Geliştirme (Adım 76–83)

**Adım 76:** `/api/haberler` route'una `?category=` filtresi ekle (merkez_bankasi, teknik_analiz, ekonomi)  
**Adım 77:** `/api/haberler` route'una `?q=` arama parametresi ekle — başlık ve açıklamada arama  
**Adım 78:** `/api/haberler` route'una `?from=` ve `?to=` tarih aralığı filtresi ekle  
**Adım 79:** Yanıtlara `ETag` ve `Last-Modified` header ekle — client-side caching optimizasyonu  
**Adım 80:** `/api/haberler/[slug]` endpoint'ini oluştur — tek haber için JSON yanıt  
**Adım 81:** `/api/haberler/kaynaklar` endpoint'ini oluştur — kaynak listesi ve haber sayıları  
**Adım 82:** API yanıt sürelerini logla (response time ms olarak)  
**Adım 83:** `/api/health` endpoint'i ekle — kaynak durumlarını ve cache metriklerini döndürür  

---

### 🟪 AŞAMA F — SEO ve İçerik Kalitesi (Adım 84–91)

**Adım 84:** `sitemap.ts`'yi güncelle — tüm mevcut haber slug'larını statik olarak listele  
**Adım 85:** `robots.txt`'ye yeni API endpoint'lerini `Disallow` veya `Allow` ile ekle  
**Adım 86:** NewsArticle JSON-LD schema'sına `wordCount`, `thumbnailUrl`, `inLanguage` alanlarını ekle  
**Adım 87:** Haber içeriğinden otomatik anahtar kelime çıkarma fonksiyonunu geliştir (para birimi adları, ülkeler, kurumlar)  
**Adım 88:** Haber URL'lerini `/haber/[slug]`'dan `/haber/[yil]/[ay]/[slug]` formatına geçir (SEO: tarih bilgisi URL'de)  
**Adım 89:** Haber detay sayfasına "İlgili Haberler" bölümü ekle (aynı kaynak veya benzer başlık)  
**Adım 90:** Canonical URL'nin her durumda doğru site URL'siyle oluşturulduğunu test et  
**Adım 91:** Core Web Vitals için görsel optimizasyonu: `loading="lazy"`, `decoding="async"`, boyut belirtme  

---

### 🟫 AŞAMA G — UI/UX Geliştirme (Adım 92–100)

**Adım 92:** Ana sayfaya kaynak filtre butonları ekle (Tümü | Cointelegraph | ForexLive | …)  
**Adım 93:** Kaynak bazlı filtreyi URL query param ile senkronize et (`?source=forexlive`)  
**Adım 94:** Haber listesine skeleton loader ekle — veri yüklenirken görsel geri bildirim  
**Adım 95:** "Daha Fazla Yükle" butonuyla client-side pagination uygula  
**Adım 96:** Haber kartına okuma süresi rozeti ekle (hesaplama: kelime sayısı / 200)  
**Adım 97:** Haber kartına kategori rozeti ekle (otomatik tespit: "Merkez Bankası", "Teknik Analiz" vb.)  
**Adım 98:** Son güncelleme zamanını sayfanın altında göster (`X dakika önce güncellendi`)  
**Adım 99:** Boş arama sonucu ve API hatası için kullanıcı dostu hata UI'ı ekle  
**Adım 100:** `manifest.json` ekle ve PWA temel desteğini hazırla — offline durumda önbellekten oku  

---

## 🏗️ TEKNİK MİMARİ (AI'sız)

```
┌─────────────────────────────────────────────┐
│              KULLANICI (Tarayıcı)            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           NEXT.JS APP (SSR/ISR)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Ana Sayfa│  │  Haber   │  │ Sitemap  │  │
│  │ (Liste)  │  │  Detay   │  │ & SEO    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│            API KATMANI                       │
│  /api/haberler  /api/haberler/[slug]         │
│  /api/haberler/kaynaklar   /api/health       │
└─────────────────┬───────────────────────────┘
                  │
       ┌──────────┴──────────┐
┌──────▼──────┐       ┌──────▼──────────────┐
│  RSS FEEDS  │       │    NewsAPI.org       │
│ • Cointele. │       │ + GNews (yedek)      │
│ • ForexLive │       └────────────────────-┘
│ • Investing │
│ • Reuters   │
│ • DailyFX   │
│ • FXStreet  │
│ • MarketW.  │
└──────┬──────┘
       │
┌──────▼───────────────────────────────────┐
│   SCRAPING MOTORU (lazy, sunucu taraflı) │
│   İçerik yetersizse orijinal sayfadan:   │
│   og:image + articleBody parse           │
└──────────────────────────────────────────┘
```

---

## 📁 DOSYA YAPISI (Hedef)

```
src/
├── app/
│   ├── page.tsx                    # Ana sayfa
│   ├── layout.tsx                  # Root layout + SEO meta
│   ├── not-found.tsx               # 404 sayfası
│   ├── sitemap.ts                  # Otomatik sitemap
│   ├── globals.css
│   ├── haber/
│   │   └── [slug]/
│   │       └── page.tsx            # Haber detay (ISR)
│   └── api/
│       └── haberler/
│           ├── route.ts            # Haber listesi API
│           ├── kaynaklar/
│           │   └── route.ts        # Kaynak stats API
│           └── [slug]/
│               └── route.ts        # Tek haber API
├── components/
│   ├── NewsCard.tsx
│   ├── NewsDetail.tsx
│   ├── NewsList.tsx
│   └── SourceFilter.tsx            # Kaynak filtre butonu (YENİ)
└── lib/
    ├── news-fetcher.ts             # Haber çekme motoru
    ├── scraper.ts                  # Scraping motoru (ayrı dosya)
    ├── cache.ts                    # Cache yönetimi (ayrı dosya)
    ├── sanitize.ts                 # HTML güvenlik filtresi
    ├── seo-utils.ts                # SEO yardımcıları
    └── types.ts                    # TypeScript tipleri
```


## 🎯 Proje Amacı
Güvenilir haber kaynaklarından forex haberlerini çekerek, AI ile özetleyip analiz eden ve SEO uyumlu bir haber platformu oluşturmak.

---

## 📋 AŞAMALAR

### 🟢 Aşama 1: Haber Çekme & Listeleme (Header/Footer Yok)
- Güvenilir kaynaklardan forex haberlerini çekme (RSS/API)
- Haber kartları ile listeleme
- Haber detay sayfaları
- Responsive tasarım
- **Kaynaklar:**
  - NewsAPI.org (ücretsiz plan: 100 istek/gün)
  - Forex Factory RSS
  - Investing.com RSS
  - Reuters RSS (forex kategorisi)
  - DailyFX RSS

### 🔵 Aşama 2: AI Entegrasyonu
- Her haberin üstünde **kısa AI özeti** (2-3 cümle)
- Haberin **ne anlam ifade ettiğinin analizi** (piyasa etkisi, yatırımcı yorumu)
- OpenAI GPT-4 entegrasyonu
- Özet ve analizler cache'lenerek maliyet optimize edilir

### 🟡 Aşama 3: Siteye Entegrasyon (Gelecek)
- Header & Footer eklenmesi
- Ana siteye entegrasyon
- Navigasyon yapısı

---

## 🔍 SEO STRATEJİSİ & KATMA DEĞERİ

### Teknik SEO
| Özellik | Açıklama | Etki |
|---------|----------|------|
| **SSR/SSG** | Next.js ile server-side rendering | Google bot'ları içeriği tam görür |
| **Meta Tags** | Her sayfa için dinamik title, description | Arama sonuçlarında görünürlük |
| **Open Graph** | Sosyal medya paylaşım kartları | Sosyal medya trafiği |
| **Schema.org** | NewsArticle yapısal veri | Google News entegrasyonu |
| **Sitemap.xml** | Otomatik oluşturulan sitemap | Daha hızlı indexlenme |
| **robots.txt** | Crawler yönlendirmesi | Doğru sayfaların indexlenmesi |
| **Canonical URL** | Duplicate content önleme | SEO penalty'den kaçınma |

### İçerik SEO
| Özellik | Açıklama | Etki |
|---------|----------|------|
| **AI Özet** | Orijinal içerik üretimi | Benzersiz içerik skoru |
| **AI Analiz** | Haberin anlamını açıklama | Uzun form içerik, dwell time artışı |
| **Kaynak Atıf** | Orijinal kaynağa link verme | E-E-A-T skoru artışı |
| **Güncel İçerik** | Sürekli güncellenen haberler | Freshness sinyali |
| **Anahtar Kelime** | Forex odaklı kelime optimizasyonu | Hedef kitle trafiği |

### SEO Puanı Tahmini
- ✅ Core Web Vitals optimizasyonu (Next.js Image, lazy loading)
- ✅ Mobile-first responsive tasarım
- ✅ Semantic HTML yapısı (article, section, time, etc.)
- ✅ Internal linking yapısı
- ✅ Breadcrumb navigasyonu
- ✅ Hızlı sayfa yükleme (< 2sn)

---

## 🏗️ TEKNİK MİMARİ

```
┌─────────────────────────────────────────────┐
│              KULLANICI (Tarayıcı)            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           NEXT.JS APP (SSR/SSG)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Ana Sayfa│  │ Haber    │  │ Sitemap  │  │
│  │ (Liste)  │  │ Detay    │  │ & SEO    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│              API KATMANI                     │
│  ┌──────────────┐  ┌────────────────────┐   │
│  │ /api/haberler│  │ /api/ai-ozet       │   │
│  │ Haber çekme  │  │ AI özet & analiz   │   │
│  └──────┬───────┘  └────────┬───────────┘   │
└─────────┼────────────────────┼──────────────┘
          │                    │
┌─────────▼──────┐  ┌─────────▼──────────────┐
│ HABER KAYNAKLARI│ │     OPENAI API         │
│ • NewsAPI       │ │  • GPT-4 Özet          │
│ • RSS Feeds     │ │  • Piyasa Analizi      │
│ • Investing.com │ │  • SEO İçerik          │
└─────────────────┘ └────────────────────────┘
```

---

## 📁 DOSYA YAPISI

```
haber-ai-seo/
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── .env.local.example
├── PLAN.md
├── public/
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Ana layout (header/footer yok)
│   │   ├── page.tsx            # Ana sayfa - haber listesi
│   │   ├── globals.css         # Global stiller
│   │   ├── haber/
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Haber detay sayfası
│   │   ├── api/
│   │   │   ├── haberler/
│   │   │   │   └── route.ts    # Haber çekme API
│   │   │   └── ai-ozet/
│   │   │       └── route.ts    # AI özet API
│   │   └── sitemap.ts          # Dinamik sitemap
│   ├── lib/
│   │   ├── types.ts            # TypeScript tipleri
│   │   ├── news-fetcher.ts     # Haber çekme modülü
│   │   ├── ai-processor.ts     # AI işleme modülü
│   │   └── seo-utils.ts        # SEO yardımcı fonksiyonlar
│   └── components/
│       ├── NewsCard.tsx         # Haber kartı bileşeni
│       ├── NewsList.tsx         # Haber listesi bileşeni
│       ├── AISummary.tsx        # AI özet bileşeni
│       └── NewsDetail.tsx       # Haber detay bileşeni
```

---

## 🚀 ÇALIŞTIRMA

```bash
# Bağımlılıkları kur
npm install

# .env.local dosyasını oluştur
cp .env.local.example .env.local
# API anahtarlarını .env.local'a ekle

# Geliştirme sunucusu
npm run dev

# Production build
npm run build && npm start
```

---

## 📊 GELECEK GELİŞTİRMELER
- [ ] Google News entegrasyonu
- [ ] Push notification ile anlık haber bildirimi
- [ ] Kullanıcı tercihleri (döviz çifti filtreleme)
- [ ] Haber karşılaştırma (aynı olay farklı kaynaklar)
- [ ] Grafik/chart entegrasyonu (TradingView widget)
- [ ] Çoklu dil desteği (EN/TR)
