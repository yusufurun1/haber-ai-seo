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
    <div className="flex flex-wrap items-center gap-1.5">
      {SOURCES.map((s) => (
        <button
          key={s.code}
          onClick={() => setSource(s.code)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border ${
            active === s.code
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
