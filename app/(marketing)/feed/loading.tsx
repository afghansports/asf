import { Skeleton, SkeletonLine, SkeletonCircle } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
          {/* Filter chip row skeleton */}
          <div className="flex gap-2 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-md" />
            ))}
          </div>
          {/* Wall posts skeleton */}
          <ol className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="rounded-lg bg-white border border-asf-border overflow-hidden">
                <div className="p-4 flex items-start gap-3">
                  <SkeletonCircle size={40} />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16 rounded" />
                      <SkeletonLine width="25%" />
                    </div>
                    <SkeletonLine width="80%" />
                    <SkeletonLine width="55%" />
                  </div>
                </div>
                {i % 2 === 0 ? <Skeleton className="h-48 w-full rounded-none" /> : null}
                <div className="px-4 py-2 border-t border-asf-border">
                  <SkeletonLine width="30%" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
