// ==========================================
// Root Layout - Header/Footer YOK (Aşama 1)
// SEO meta veriler burada tanımlanıyor
// ==========================================

import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Forex Haber";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Real-Time Forex & Market News`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Real-time forex news, market summaries and professional currency analysis. EUR/USD, GBP/USD and more.",
  keywords: [
    "forex news",
    "currency news",
    "forex analysis",
    "EUR/USD",
    "currency market",
    "central bank news",
    "market summary",
    "exchange rates",
    "forex commentary",
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
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Real-Time Forex & Market News`,
    description:
      "Real-time forex news, market summaries and professional currency analysis.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Real-Time Forex & Market News`,
    description:
      "Real-time forex news and professional market analysis.",
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
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-bg-main antialiased selection:bg-primary/20 selection:text-ui-dark">
        <main className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-7xl">
          {children}
        </main>
      </body>
    </html>
  );
}
