import { Skeleton } from "@/components/ui/skeleton";

/** Reels-shaped loading: a single 9:16 black panel + filter chips above. */
export default function ReelsLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <div className="bg-white border-b border-asf-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-md" />
          ))}
        </div>
      </div>
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
          <Skeleton className="h-[80vh] min-h-[560px] max-h-[820px] w-full rounded-lg" />
        </div>
      </section>
    </>
  );
}
