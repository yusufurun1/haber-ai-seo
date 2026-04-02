// ==========================================
// 404 Haber Bulunamadı Sayfası
// comofx tema uyumlu
// ==========================================

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fadeIn">
      <div className="text-7xl mb-6">📭</div>
      <h1 className="text-3xl font-black text-ui-dark mb-3 tracking-tight">
        Haber Bulunamadı
      </h1>
      <p className="text-text-muted mb-8 max-w-md leading-relaxed">
        Aradığınız forex haberi bulunamadı veya kaldırılmış olabilir. Güncel
        haberler için ana sayfayı ziyaret edin.
      </p>
      <Link
        href="/"
        className="btn-primary"
      >
        ← Ana Sayfaya Dön
      </Link>
    </div>
  );
}
