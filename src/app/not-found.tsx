// ==========================================
// 404 Haber Bulunamadı Sayfası
// ==========================================

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">📭</div>
      <h1 className="text-2xl font-bold text-white mb-2">
        Haber Bulunamadı
      </h1>
      <p className="text-forex-muted mb-6 max-w-md">
        Aradığınız forex haberi bulunamadı veya kaldırılmış olabilir. Güncel
        haberler için ana sayfayı ziyaret edin.
      </p>
      <Link
        href="/"
        className="bg-forex-gold text-forex-dark font-semibold px-6 py-3 rounded-lg hover:bg-forex-gold/90 transition-colors"
      >
        ← Ana Sayfaya Dön
      </Link>
    </div>
  );
}
