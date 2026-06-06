import Link from "next/link";
import Image from "next/image";
import { ImageIcon, ArrowRight, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/shared/section-label";
import { EmptyState } from "@/components/shared/empty-state";
import { detectMediaKind, youtubeEmbedUrl } from "@/lib/gallery/media";

/** YouTube thumbnail from the embed URL, for a static poster in the teaser. */
function youtubeThumb(url: string): string | null {
  const embed = youtubeEmbedUrl(url);
  if (!embed) return null;
  const id = embed.split("/embed/")[1];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/**
 * GalleryTeaser (server). Per ASF_LAUNCH_PRD.md > STEP 5 > Gallery Teaser.
 *
 * Query: SELECT * FROM gallery_images WHERE is_published = true
 *   ORDER BY sort_order ASC LIMIT 6.
 * Masonry grid via CSS columns: 3 / 2 / 1.
 *
 * Decision: when an image has no `image_url` (current placeholder rows are
 * captioned "Photo coming soon"), render a styled placeholder tile instead
 * of a broken image element.
 */

type GalleryRow = {
  id: string;
  image_url: string | null;
  caption: string | null;
  event_name: string | null;
  year: number | null;
};

export async function GalleryTeaser() {
  let items: GalleryRow[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("gallery_images")
      .select("id, image_url, caption, event_name, year")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(6);
    items = (data ?? []) as GalleryRow[];
  } catch {
    items = [];
  }

  return (
    <section className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div className="space-y-3">
            <SectionLabel>Gallery</SectionLabel>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-asf-text leading-tight">
              Moments from the community
            </h2>
          </div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-red hover:underline underline-offset-4"
          >
            View full gallery
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="w-5 h-5" aria-hidden />}
            title="Photos coming soon."
            description="The ASF gallery will fill up as we host events. Check back after Afghan Cup 2026."
          />
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {items.map((it, idx) => {
              const kind = it.image_url ? detectMediaKind(it.image_url) : "image";
              const poster =
                kind === "youtube" && it.image_url ? youtubeThumb(it.image_url) : null;
              return (
              <figure
                key={it.id}
                className="mb-4 break-inside-avoid overflow-hidden rounded-lg border border-asf-border bg-asf-off"
              >
                {it.image_url && kind === "image" ? (
                  <div className="relative w-full h-56">
                    <Image
                      src={it.image_url}
                      alt={it.caption ?? "ASF gallery image"}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      unoptimized
                    />
                  </div>
                ) : it.image_url ? (
                  // Video / YouTube: static poster (or play badge) linking users
                  // to the full gallery, where the media plays inline.
                  <div className="relative w-full h-56 bg-asf-navy">
                    {poster ? (
                      <Image
                        src={poster}
                        alt={it.caption ?? "ASF gallery video"}
                        fill
                        className="object-cover opacity-90"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        unoptimized
                      />
                    ) : null}
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white">
                        <Play className="h-6 w-6" aria-hidden />
                      </span>
                    </span>
                  </div>
                ) : (
                  <div
                    className="w-full bg-gradient-to-br from-asf-navy via-asf-navy-light to-asf-navy text-white/60 flex items-center justify-center"
                    style={{ height: 180 + ((idx * 37) % 100) }}
                    aria-hidden
                  >
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                {it.caption ? (
                  <figcaption className="p-3 text-xs text-asf-muted">
                    <span className="text-asf-text font-medium">{it.caption}</span>
                    {it.event_name || it.year ? (
                      <span className="block text-[0.7rem] mt-0.5">
                        {[it.event_name, it.year].filter(Boolean).join(" . ")}
                      </span>
                    ) : null}
                  </figcaption>
                ) : null}
              </figure>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
