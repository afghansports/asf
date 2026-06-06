import { Skeleton, SkeletonCircle, SkeletonLine } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <>
      {/* Header banner */}
      <section className="w-full bg-asf-navy text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          {/* Avatar — tinted to read against the navy banner */}
          <Skeleton className="w-20 h-20 rounded-full bg-white/10 shrink-0" />
          <div className="flex-1 min-w-0 space-y-3">
            <Skeleton className="h-9 w-64 max-w-full rounded bg-white/10" />
            <Skeleton className="h-4 w-32 rounded bg-white/10" />
            {/* Stat row: location / member since / followers */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Skeleton className="h-4 w-36 rounded bg-white/10" />
              <Skeleton className="h-4 w-40 rounded bg-white/10" />
              <Skeleton className="h-4 w-28 rounded bg-white/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Body: main column + aside */}
      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-24 rounded" />
              <SkeletonLine />
              <SkeletonLine width="95%" />
              <SkeletonLine width="80%" />
            </div>

            {/* Teams grid */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-24 rounded" />
              <ul className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 p-4 rounded-lg bg-white border border-asf-border"
                  >
                    <SkeletonCircle size={40} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <SkeletonLine width="60%" />
                      <SkeletonLine width="45%" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Aside */}
          <aside className="space-y-6">
            <div className="p-5 rounded-lg bg-white border border-asf-border space-y-3">
              <Skeleton className="h-4 w-20 rounded" />
              <SkeletonLine width="55%" />
              <SkeletonLine width="70%" />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
