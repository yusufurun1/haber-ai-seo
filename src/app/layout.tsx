// ==========================================
// Root Layout - Header/Footer YOK (Aşama 1)
// SEO meta veriler burada tanımlanıyor
// ==========================================

import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Forex Haber AI";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Güncel Forex Haberleri ve AI Analiz`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Güncel forex haberleri, yapay zeka destekli piyasa özetleri ve profesyonel döviz analizi. EUR/USD, GBP/USD, USD/TRY ve daha fazlası.",
  keywords: [
    "forex haberleri",
    "döviz haberleri",
    "forex analiz",
    "EUR/USD",
    "döviz piyasası",
    "merkez bankası haberleri",
    "forex AI analiz",
    "piyasa özeti",
    "döviz kurları",
    "forex yorum",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Güncel Forex Haberleri ve AI Analiz`,
    description:
      "Güncel forex haberleri, yapay zeka destekli piyasa özetleri ve profesyonel döviz analizi.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Güncel Forex Haberleri`,
    description:
      "Güncel forex haberleri ve AI destekli piyasa analizi.",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org WebSite yapısal verisi
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Forex piyasası haberleri, AI destekli özetler ve piyasa analizleri",
  };

  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <head>
        {/* Schema.org yapısal veri */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body className="min-h-screen bg-bg-main antialiased selection:bg-primary/30 selection:text-ui-dark">
        {/* 
          Aşama 1: Header/Footer yok
          Design: comofx inspired minimalist start
        */}
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          {children}
        </main>
      </body>
    </html>
  );
}
