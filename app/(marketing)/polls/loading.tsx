import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function PollsLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <section className="w-full bg-asf-off">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
          <ul className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <li
                key={i}
                className="p-5 rounded-lg bg-white border border-asf-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonLine width="80%" />
                    <SkeletonLine width="35%" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
