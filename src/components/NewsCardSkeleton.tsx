export default function NewsCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden animate-pulse">
      <div className="w-full h-52 bg-slate-100" />
      <div className="p-6">
        <div className="flex gap-3 mb-4">
          <div className="h-3 w-16 bg-slate-200 rounded-full" />
          <div className="h-3 w-24 bg-slate-100 rounded-full" />
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-5 bg-slate-200 rounded-full w-full" />
          <div className="h-5 bg-slate-200 rounded-full w-4/5" />
        </div>
        <div className="space-y-2 mb-6">
          <div className="h-3 bg-slate-100 rounded-full w-full" />
          <div className="h-3 bg-slate-100 rounded-full w-3/4" />
        </div>
        <div className="pt-4 border-t border-slate-100">
          <div className="h-3 w-16 bg-slate-200 rounded-full" />
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
