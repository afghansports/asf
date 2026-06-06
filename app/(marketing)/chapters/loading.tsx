import { SkeletonCircle, SkeletonLine } from "@/components/ui/skeleton";

export default function ChaptersLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <li
                key={i}
                className="flex flex-col h-full p-5 rounded-lg border border-asf-border bg-white"
              >
                <div className="flex items-start gap-3">
                  <SkeletonCircle size={48} className="shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <SkeletonLine width="70%" />
                    <SkeletonLine width="50%" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <SkeletonLine />
                  <SkeletonLine width="85%" />
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <SkeletonLine width="40%" />
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
