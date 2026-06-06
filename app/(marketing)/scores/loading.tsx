import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function ScoresLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-10">
          {/* Sport filter chips */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-md" />
            ))}
          </div>

          {/* Fixtures */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="p-4 rounded-lg bg-white border border-asf-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <SkeletonLine width="40%" />
                    <Skeleton className="h-4 w-12 rounded" />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 flex-1">
                      <Skeleton className="h-5 w-5 rounded" />
                      <SkeletonLine width="55%" />
                    </div>
                    <Skeleton className="h-4 w-5 rounded" />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 flex-1">
                      <Skeleton className="h-5 w-5 rounded" />
                      <SkeletonLine width="55%" />
                    </div>
                    <Skeleton className="h-4 w-5 rounded" />
                  </div>
                  <SkeletonLine width="70%" />
                </li>
              ))}
            </ul>
          </div>

          {/* Standings */}
          <div>
            <Skeleton className="h-4 w-28 rounded" />
            <ul className="grid gap-4 mt-3 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <li
                  key={i}
                  className="p-4 rounded-lg bg-white border border-asf-border"
                >
                  <SkeletonLine width="45%" className="mb-3" />
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((__, r) => (
                      <div
                        key={r}
                        className="flex items-center gap-2 border-t border-asf-border/50 pt-2"
                      >
                        <Skeleton className="h-3 w-4 rounded" />
                        <Skeleton className="h-4 w-4 rounded" />
                        <SkeletonLine width="40%" />
                        <Skeleton className="h-3 w-5 rounded ml-auto" />
                        <Skeleton className="h-3 w-5 rounded" />
                        <Skeleton className="h-3 w-5 rounded" />
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Headlines */}
          <div>
            <Skeleton className="h-4 w-28 rounded" />
            <ul className="grid gap-3 mt-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="flex flex-col h-full p-4 rounded-lg bg-white border border-asf-border"
                >
                  <Skeleton className="h-32 w-full rounded-md mb-3" />
                  <div className="space-y-2">
                    <SkeletonLine />
                    <SkeletonLine width="80%" />
                  </div>
                  <div className="mt-auto pt-3 flex items-center justify-between">
                    <SkeletonLine width="30%" />
                    <SkeletonLine width="15%" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
