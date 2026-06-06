import { Skeleton } from "@/components/ui/skeleton";

// Varied heights so the masonry placeholder mirrors the real columns layout.
const HEIGHTS = [240, 320, 200, 280, 360, 220, 300, 260, 340, 210, 290, 250];

export default function GalleryLoading() {
  return (
    <>
      <section className="relative w-full bg-asf-navy text-white">
        <div className="relative h-44 sm:h-56 w-full overflow-hidden" aria-hidden />
      </section>
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-4 w-20 rounded ml-auto" />
          </div>
          {/* Masonry grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {HEIGHTS.map((h, i) => (
              <Skeleton
                key={i}
                className="block w-full mb-4 break-inside-avoid rounded-lg"
                style={{ height: h }}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
