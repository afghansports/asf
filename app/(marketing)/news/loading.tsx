import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function NewsLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="rounded-lg bg-white border border-asf-border overflow-hidden">
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="p-5 space-y-2">
                  <SkeletonLine width="30%" />
                  <SkeletonLine />
                  <SkeletonLine width="85%" />
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
