export default function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      <div className="w-full aspect-[16/9] bg-slate-100" />
      <div className="p-5">
        <div className="flex gap-2 mb-3">
          <div className="h-4 w-16 bg-slate-100 rounded" />
          <div className="h-4 w-20 bg-slate-50 rounded" />
        </div>
        <div className="space-y-2 mb-2">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-4/5" />
        </div>
        <div className="space-y-1.5 mb-4">
          <div className="h-3 bg-slate-50 rounded w-full" />
          <div className="h-3 bg-slate-50 rounded w-3/4" />
        </div>
        <div className="pt-3 border-t border-slate-50">
          <div className="h-3 w-20 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export function NewsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  );
}
