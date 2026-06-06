import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "../_action-button";
import {
  deleteWallPost,
  toggleWallHidden,
  toggleWallPinned,
  clearExternalWall,
} from "../_wall-actions";
import { AnnouncementForm } from "./_announcement-form";

export const metadata = { title: "Admin wall" };

type SearchParams = { kind?: string };

const KIND_LABEL: Record<string, string> = {
  reel:              "Reel",
  event:             "Event",
  news:              "News",
  match:             "Match",
  match_result:      "Result",
  poll:              "Poll",
  tournament:        "Tournament",
  discussion:        "Discussion",
  team_created:      "New team",
  user_joined:       "Joined",
  external_fixture:  "Pro fixture",
  external_news:     "Sports news",
  announcement:      "Announcement",
};

const KIND_FILTERS = [
  { kind: null,                label: "All" },
  { kind: "announcement",      label: "Announcements" },
  { kind: "external_fixture",  label: "Pro fixtures" },
  { kind: "external_news",     label: "Sports news" },
  { kind: "reel",              label: "Reels" },
  { kind: "event",             label: "Events" },
  { kind: "news",              label: "News" },
  { kind: "match",             label: "Matches" },
  { kind: "match_result",      label: "Results" },
  { kind: "tournament",        label: "Tournaments" },
  { kind: "discussion",        label: "Discussions" },
  { kind: "team_created",      label: "Teams" },
  { kind: "user_joined",       label: "Joined" },
];

export default async function AdminWallPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const kindFilter = sp.kind ?? "";

  const supabase = await createClient();
  let query = supabase
    .from("wall_posts")
    .select("id, kind, actor_id, title, link, image_url, is_hidden, is_pinned, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (kindFilter) query = query.eq("kind", kindFilter);
  const { data: rows } = await query;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display font-black text-3xl text-asf-text">Wall</h1>
        <ActionButton
          action={clearExternalWall}
          label="Clear external"
          variant="danger"
          confirm="Delete every external fixture & news wall entry?"
        />
      </div>

      {/* Announcement form */}
      <AnnouncementForm />

      {/* Kind filter chips */}
      <nav className="flex flex-wrap gap-2" aria-label="Filter by kind">
        {KIND_FILTERS.map((f) => (
          <Link
            key={f.kind ?? "all"}
            href={f.kind ? `/admin/wall?kind=${f.kind}` : `/admin/wall`}
            className={
              kindFilter === (f.kind ?? "")
                ? "h-7 px-3 inline-flex items-center rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-asf-navy text-white"
                : "h-7 px-3 inline-flex items-center rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
            }
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-asf-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-start">
              <Th>Kind</Th>
              <Th>Title</Th>
              <Th>Flags</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-asf-muted text-sm">
                  No wall posts.
                </td>
              </tr>
            ) : null}
            {(rows ?? []).map((p) => (
              <tr key={p.id} className="border-t border-asf-border">
                {/* Kind badge */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-off-2 text-asf-text text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                    {KIND_LABEL[p.kind] ?? p.kind}
                  </span>
                </td>

                {/* Title */}
                <td className="px-4 py-3 max-w-xs">
                  {p.link ? (
                    p.link.startsWith("http") ? (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-asf-text hover:text-asf-red font-medium truncate block"
                      >
                        {p.title ?? "(no title)"}
                      </a>
                    ) : (
                      <Link
                        href={p.link}
                        className="text-asf-text hover:text-asf-red font-medium truncate block"
                      >
                        {p.title ?? "(no title)"}
                      </Link>
                    )
                  ) : (
                    <span className="text-asf-text font-medium truncate block">
                      {p.title ?? "(no title)"}
                    </span>
                  )}
                </td>

                {/* Flags */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {p.is_pinned ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-asf-gold/20 text-asf-text text-[0.6rem] font-condensed font-bold tracking-[0.16em] uppercase">
                        Pinned
                      </span>
                    ) : null}
                    {p.is_hidden ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-asf-off-2 text-asf-muted text-[0.6rem] font-condensed font-bold tracking-[0.16em] uppercase">
                        Hidden
                      </span>
                    ) : null}
                  </div>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-asf-muted whitespace-nowrap">
                  {p.created_at
                    ? new Date(p.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : ""}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <ActionButton
                      action={deleteWallPost.bind(null, p.id)}
                      label="Delete"
                      variant="danger"
                      confirm="Delete this wall entry?"
                    />
                    <ActionButton
                      action={toggleWallHidden.bind(null, p.id, !p.is_hidden)}
                      label={p.is_hidden ? "Show" : "Hide"}
                      variant="default"
                    />
                    <ActionButton
                      action={toggleWallPinned.bind(null, p.id, !p.is_pinned)}
                      label={p.is_pinned ? "Unpin" : "Pin"}
                      variant={p.is_pinned ? "default" : "ok"}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted text-start">
      {children}
    </th>
  );
}
