import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function DiscussionsLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <section className="w-full bg-asf-off">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
          <div className="flex gap-2 mb-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-md" />
            ))}
          </div>
          <ul className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="rounded-lg bg-white border border-asf-border p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <SkeletonLine width="70%" />
                <SkeletonLine width="90%" />
                <SkeletonLine width="40%" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
