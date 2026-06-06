import { Skeleton, SkeletonCircle, SkeletonLine } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>

      {/* Sticky search bar + type tabs */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-asf-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-80 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <div className="flex flex-wrap gap-1 ml-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-16 rounded-md" />
            ))}
          </div>
        </div>
      </div>

      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
          {/* People group */}
          <div>
            <SkeletonLine width="20%" className="mb-3" />
            <ul className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-md bg-white border border-asf-border"
                >
                  <SkeletonCircle size={36} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonLine width="55%" />
                    <SkeletonLine width="35%" />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Teams group */}
          <div>
            <SkeletonLine width="20%" className="mb-3" />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-md bg-white border border-asf-border"
                >
                  <SkeletonCircle size={36} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonLine width="60%" />
                    <SkeletonLine width="40%" />
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
