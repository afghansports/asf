import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function SponsorsLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-12">
          {Array.from({ length: 3 }).map((_, tier) => (
            <div key={tier} className="space-y-5">
              <Skeleton className="h-4 w-40 rounded" />
              <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((__, i) => (
                  <li
                    key={i}
                    className="rounded-lg p-5 border border-asf-border bg-white flex flex-col items-center gap-3 text-center"
                  >
                    <Skeleton className="h-16 w-full rounded-md" />
                    <SkeletonLine width="60%" />
                    <SkeletonLine width="40%" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
