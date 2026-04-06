"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const SOURCES = [
  { code: "", label: "All Sources" },
  { code: "forexlive", label: "ForexLive" },
  { code: "financemagnates", label: "Finance Magnates" },
  { code: "cointelegraph", label: "Cointelegraph" },
  { code: "coindesk", label: "CoinDesk" },
  { code: "cnbc", label: "CNBC" },
  { code: "guardian", label: "The Guardian" },
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
    <div className="mb-6">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Filter by Source</p>
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <button
            key={s.code}
            onClick={() => setSource(s.code)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border ${
              active === s.code
                ? "bg-ui-dark text-white border-ui-dark"
                : "bg-white text-slate-500 border-slate-200 hover:border-ui-dark hover:text-ui-dark"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
