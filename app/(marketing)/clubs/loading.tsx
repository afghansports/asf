import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function ClubsLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <li
                key={i}
                className="flex flex-col h-full p-5 rounded-lg bg-white border border-asf-border"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonLine width="70%" />
                    <SkeletonLine width="45%" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <SkeletonLine />
                  <SkeletonLine width="85%" />
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <SkeletonLine width="25%" />
                  <SkeletonLine width="15%" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
