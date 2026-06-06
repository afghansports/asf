import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function EventsLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <div className="bg-white border-b border-asf-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center gap-3">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="rounded-lg bg-white border border-asf-border overflow-hidden">
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <SkeletonLine width="70%" />
                  <SkeletonLine width="50%" />
                  <SkeletonLine />
                  <SkeletonLine width="40%" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
