import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { FillImage } from "@/components/shared/optimized-image";

export const metadata: Metadata = { title: "Saved" };

type SearchParams = { type?: string };

const TYPES = [
  { code: "all", label: "All" },
  { code: "reel", label: "Reels" },
  { code: "event", label: "Events" },
  { code: "news", label: "News" },
  { code: "team", label: "Teams" },
  { code: "tournament", label: "Tournaments" },
];

export default async function SavedPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const type = sp.type ?? "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/saved");

  let q = supabase
    .from("bookmarks")
    .select("target_type, target_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (type !== "all") q = q.eq("target_type", type);
  const { data: marks } = await q;

  // Resolve targets in batches by type.
  const byType: Record<string, string[]> = {};
  for (const m of marks ?? []) {
    if (!byType[m.target_type]) byType[m.target_type] = [];
    byType[m.target_type].push(m.target_id);
  }

  const [reels, events, news, teams, tournaments] = await Promise.all([
    byType.reel?.length
      ? supabase.from("reels").select("id, video_url, thumbnail_url, caption").in("id", byType.reel)
      : Promise.resolve({ data: [] }),
    byType.event?.length
      ? supabase.from("events").select("id, slug, title, start_datetime, city, state_province").in("id", byType.event)
      : Promise.resolve({ data: [] }),
    byType.news?.length
      ? supabase.from("news_posts").select("id, slug, title, image_url, excerpt").in("id", byType.news)
      : Promise.resolve({ data: [] }),
    byType.team?.length
      ? supabase.from("teams").select("id, slug, name, sport, logo_url, member_count").in("id", byType.team)
      : Promise.resolve({ data: [] }),
    byType.tournament?.length
      ? supabase.from("tournaments").select("id, slug, name, sport, start_date, status").in("id", byType.tournament)
      : Promise.resolve({ data: [] }),
  ]);

  const total = (marks ?? []).length;

  return (
    <>
      <PageHero
        eyebrow="Saved"
        title="Your bookmarks."
        subtitle={`${total} item${total === 1 ? "" : "s"} saved across the platform.`}
      />
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-asf-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap gap-1">
          {TYPES.map((t) => {
            const active = type === t.code;
            return (
              <Link
                key={t.code}
                href={t.code === "all" ? "/saved" : `/saved?type=${t.code}`}
                className={
                  active
                    ? "h-9 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-asf-navy text-white rounded-md"
                    : "h-9 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-text hover:bg-asf-off-2 rounded-md"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-10">
          {total === 0 ? (
            <EmptyState
              icon={<Bookmark className="w-5 h-5" aria-hidden />}
              title="Nothing saved yet."
              description="Tap the bookmark icon on any reel, event, news post, team, or tournament to save it here."
            />
          ) : null}

          {(type === "all" || type === "reel") && (reels.data ?? []).length > 0 ? (
            <Group title={`Reels (${(reels.data ?? []).length})`}>
              <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {(reels.data ?? []).map((r) => (
                  <li key={r.id}>
                    <Link href={`/reels/${r.id}`} className="block aspect-[9/16] rounded-md overflow-hidden bg-black relative">
                      {r.thumbnail_url ? (
                        <FillImage src={r.thumbnail_url} alt="" className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                      ) : (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video src={r.video_url} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <p className="absolute bottom-1 left-1 right-1 text-white text-[0.65rem] line-clamp-2 drop-shadow">
                        {r.caption ?? ""}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Group>
          ) : null}

          {(type === "all" || type === "event") && (events.data ?? []).length > 0 ? (
            <Group title={`Events (${(events.data ?? []).length})`}>
              <ul className="space-y-2">
                {(events.data ?? []).map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/events/${e.slug ?? e.id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-md bg-white border border-asf-border hover:border-asf-red/40"
                    >
                      <span className="text-sm text-asf-text">{e.title}</span>
                      <span className="text-xs text-asf-muted">
                        {new Date(e.start_datetime).toLocaleDateString("en-US")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Group>
          ) : null}

          {(type === "all" || type === "news") && (news.data ?? []).length > 0 ? (
            <Group title={`News (${(news.data ?? []).length})`}>
              <ul className="space-y-2">
                {(news.data ?? []).map((n) => (
                  <li key={n.id}>
                    <Link href={`/news/${n.slug}`} className="block p-3 rounded-md bg-white border border-asf-border hover:border-asf-red/40">
                      <p className="text-sm text-asf-text">{n.title}</p>
                      {n.excerpt ? (
                        <p className="text-xs text-asf-muted line-clamp-2 mt-0.5">{n.excerpt}</p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </Group>
          ) : null}

          {(type === "all" || type === "team") && (teams.data ?? []).length > 0 ? (
            <Group title={`Teams (${(teams.data ?? []).length})`}>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(teams.data ?? []).map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/teams/${t.slug}`}
                      className="flex items-center gap-3 p-3 rounded-md bg-white border border-asf-border hover:border-asf-red/40"
                    >
                      <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                        {t.logo_url ? (
                          <FillImage src={t.logo_url} alt="" className="object-cover" sizes="36px" />
                        ) : (
                          <span aria-hidden>{t.name.charAt(0).toUpperCase()}</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-asf-text truncate">{t.name}</span>
                        <span className="block text-xs text-asf-muted capitalize">{t.sport}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Group>
          ) : null}

          {(type === "all" || type === "tournament") && (tournaments.data ?? []).length > 0 ? (
            <Group title={`Tournaments (${(tournaments.data ?? []).length})`}>
              <ul className="space-y-2">
                {(tournaments.data ?? []).map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/tournaments/${t.slug}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-md bg-white border border-asf-border hover:border-asf-red/40"
                    >
                      <span className="text-sm text-asf-text">{t.name}</span>
                      <span className="text-xs text-asf-muted capitalize">{t.status.replace("_", " ")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Group>
          ) : null}
        </div>
      </section>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article>
      <h2 className="font-condensed font-bold text-xs tracking-[0.22em] uppercase text-asf-muted mb-3">
        {title}
      </h2>
      {children}
    </article>
  );
}
