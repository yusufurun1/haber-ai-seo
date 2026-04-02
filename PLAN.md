# 📰 Forex Haber AI SEO Projesi - Detaylı Plan

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
