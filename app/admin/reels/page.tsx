import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "../_action-button";
import { AdminToggle } from "../_toggle";
import {
  toggleReelPublished,
  toggleReelFeatured,
  deleteReel,
} from "../_reels-actions";

export const metadata = { title: "Admin reels" };

type SearchParams = { filter?: string };

export default async function AdminReelsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const filter = sp.filter ?? "all";

  const supabase = await createClient();
  let q = supabase
    .from("reels")
    .select(
      "id, video_url, thumbnail_url, caption, sport, country_code, view_count, like_count, comment_count, is_published, is_featured, created_at, author_id"
    )
    .order("created_at", { ascending: false });
  if (filter === "hidden") q = q.eq("is_published", false);
  if (filter === "featured") q = q.eq("is_featured", true);
  const { data: rows } = await q.limit(200);
  const reels = rows ?? [];

  const authorIds = Array.from(new Set(reels.map((r) => r.author_id)));
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, username").in("id", authorIds)
    : { data: [] };
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a.username]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Reels</h1>
        <div className="inline-flex rounded-md border border-asf-border bg-white overflow-hidden">
          {[
            { code: "all", label: "All" },
            { code: "hidden", label: "Hidden" },
            { code: "featured", label: "Featured" },
          ].map((o) => {
            const active = filter === o.code;
            return (
              <Link
                key={o.code}
                href={o.code === "all" ? "/admin/reels" : `/admin/reels?filter=${o.code}`}
                className={
                  active
                    ? "h-9 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-asf-navy text-white"
                    : "h-9 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-text hover:bg-asf-off-2"
                }
              >
                {o.label}
              </Link>
            );
          })}
        </div>
      </div>

      <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {reels.map((r) => (
          <li key={r.id} className="rounded-lg border border-asf-border bg-white overflow-hidden flex flex-col">
            <div className="relative aspect-[9/12] bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={r.video_url}
                poster={r.thumbnail_url ?? undefined}
                className="absolute inset-0 w-full h-full object-cover"
                preload="metadata"
                muted
                playsInline
                controls
              />
              {!r.is_published ? (
                <span className="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded bg-asf-red text-white text-[0.6rem] font-condensed font-bold tracking-[0.18em] uppercase">
                  Hidden
                </span>
              ) : null}
              {r.is_featured ? (
                <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded bg-asf-gold text-asf-text text-[0.6rem] font-condensed font-bold tracking-[0.18em] uppercase">
                  Featured
                </span>
              ) : null}
            </div>
            <div className="p-4 flex-1 flex flex-col gap-2">
              {authorMap.get(r.author_id) ? (
                <Link
                  href={`/profile/${authorMap.get(r.author_id)}`}
                  className="text-xs text-asf-muted hover:text-asf-red"
                >
                  @{authorMap.get(r.author_id)}
                </Link>
              ) : null}
              {r.caption ? (
                <p className="text-sm text-asf-text line-clamp-2">{r.caption}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 text-[0.7rem] text-asf-muted">
                <span>{r.view_count.toLocaleString()} views</span>
                <span>{r.like_count.toLocaleString()} likes</span>
                <span>{r.comment_count.toLocaleString()} comments</span>
              </div>
              <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-[0.65rem] text-asf-muted">
                  <label className="inline-flex items-center gap-1.5">
                    <AdminToggle
                      initial={r.is_published}
                      action={toggleReelPublished.bind(null, r.id)}
                      ariaLabel="Publish toggle"
                    />
                    <span>Pub</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <AdminToggle
                      initial={r.is_featured}
                      action={toggleReelFeatured.bind(null, r.id)}
                      ariaLabel="Feature toggle"
                    />
                    <span>Feat</span>
                  </label>
                </div>
                <ActionButton
                  action={deleteReel.bind(null, r.id)}
                  label="Delete"
                  variant="danger"
                  confirm="Delete this reel? This cannot be undone."
                />
              </div>
            </div>
          </li>
        ))}
        {reels.length === 0 ? (
          <li className="col-span-full rounded-lg p-10 border border-dashed border-asf-border bg-white text-center text-asf-muted text-sm">
            No reels yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
