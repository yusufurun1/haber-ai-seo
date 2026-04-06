"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fadeIn">
      <div className="text-7xl mb-6">⚠️</div>
      <h1 className="text-3xl font-black text-ui-dark mb-3 tracking-tight">
        Something Went Wrong
      </h1>
      <p className="text-text-muted mb-8 max-w-md leading-relaxed">
        An unexpected error occurred while loading news. Please try again.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <button onClick={reset} className="btn-primary">
          Try Again
        </button>
        <a href="/" className="group inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-ui-dark transition-all">
          ← Home
        </a>
      </div>
    </div>
  );
}
