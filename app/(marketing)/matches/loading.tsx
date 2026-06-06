import { Skeleton, SkeletonCircle, SkeletonLine } from "@/components/ui/skeleton";

export default function MatchesLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
          <ul className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <li
                key={i}
                className="p-4 rounded-lg border border-asf-border bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[72px] space-y-2">
                    <SkeletonLine width="80%" />
                    <SkeletonLine width="60%" />
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                    <div className="flex items-center gap-3">
                      <SkeletonCircle size={32} />
                      <SkeletonLine width="60%" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Skeleton className="h-7 w-16 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <SkeletonLine width="60%" />
                      <SkeletonCircle size={32} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
