import { Skeleton, SkeletonLine, SkeletonCircle } from "@/components/ui/skeleton";

export default function TeamsLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
          {/* Filter chips */}
          <div className="flex gap-2 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-md" />
            ))}
          </div>
          {/* Team card grid */}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <li key={i} className="rounded-lg bg-white border border-asf-border overflow-hidden">
                <Skeleton className="h-32 w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <SkeletonCircle size={48} />
                    <div className="flex-1 space-y-2">
                      <SkeletonLine width="60%" />
                      <SkeletonLine width="35%" />
                    </div>
                  </div>
                  <SkeletonLine />
                  <SkeletonLine width="80%" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
