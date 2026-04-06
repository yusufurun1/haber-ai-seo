"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const SOURCES = [
  { code: "", label: "Tümü" },
  { code: "cointelegraph", label: "Cointelegraph" },
  { code: "forexlive", label: "ForexLive" },
  { code: "financemagnates", label: "Finance Magnates" },
  { code: "coindesk", label: "CoinDesk" },
];

export default function SourceFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("source") || "";

  const setSource = useCallback(
    (code: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (code) {
        params.set("source", code);
      } else {
        params.delete("source");
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2 mb-10">
      {SOURCES.map((s) => (
        <button
          key={s.code}
          onClick={() => setSource(s.code)}
          className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-200 border ${
            active === s.code
              ? "bg-primary text-white border-primary shadow-md"
              : "bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
