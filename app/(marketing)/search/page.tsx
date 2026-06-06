import type { Metadata } from "next";
import Link from "next/link";
import { Search, User, Users, Calendar, Newspaper, Trophy, Video, Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { FillImage } from "@/components/shared/optimized-image";

export const metadata: Metadata = {
  title: "Search",
  description: "Search ASF for people, teams, events, news, reels, and tournaments.",
};

type SearchParams = { q?: string; type?: string };

const TYPES = [
  { code: "all", label: "All" },
  { code: "people", label: "People" },
  { code: "teams", label: "Teams" },
  { code: "events", label: "Events" },
  { code: "tournaments", label: "Tournaments" },
  { code: "reels", label: "Reels" },
  { code: "news", label: "News" },
  { code: "hashtags", label: "Hashtags" },
];

/**
 * /search — text search across the platform. pg_trgm GIN indexes on each
 * searchable text column (added in migration 013). Query uses `ilike` with
 * trigram-friendly patterns; pg_trgm makes those fast at scale.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const q = (sp.q ?? "").trim();
  const type = sp.type ?? "all";
  const supabase = await createClient();

  const empty = q.length === 0;
  const pattern = `%${q}%`;

  const showAll = type === "all";

  // Run only the queries we need.
  const [people, teams, events, tournaments, reels, news, hashtags, staff] = await Promise.all([
    !empty && (showAll || type === "people")
      ? supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, verification_status, country_code")
          .or(`username.ilike.${pattern},full_name.ilike.${pattern}`)
          .eq("is_active", true)
          .limit(20)
      : Promise.resolve({ data: [] }),
    !empty && (showAll || type === "teams")
      ? supabase
          .from("teams")
          .select("id, name, slug, sport, city, state_province, logo_url")
          .ilike("name", pattern)
          .limit(20)
      : Promise.resolve({ data: [] }),
    !empty && (showAll || type === "events")
      ? supabase
          .from("events")
          .select("id, slug, title, start_datetime, city, state_province, event_type")
          .ilike("title", pattern)
          .eq("is_published", true)
          .limit(20)
      : Promise.resolve({ data: [] }),
    !empty && (showAll || type === "tournaments")
      ? supabase
          .from("tournaments")
          .select("id, slug, name, sport, start_date, status")
          .ilike("name", pattern)
          .eq("is_published", true)
          .limit(20)
      : Promise.resolve({ data: [] }),
    !empty && (showAll || type === "reels")
      ? supabase
          .from("reels")
          .select("id, caption, thumbnail_url, video_url, sport, view_count")
          .ilike("caption", pattern)
          .eq("is_published", true)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    !empty && (showAll || type === "news")
      ? supabase
          .from("news_posts")
          .select("id, slug, title, excerpt, image_url")
          .ilike("title", pattern)
          .eq("is_published", true)
          .limit(20)
      : Promise.resolve({ data: [] }),
    !empty && (showAll || type === "hashtags")
      ? supabase
          .from("hashtags")
          .select("tag, reel_count")
          .ilike("tag", `%${q.replace(/^#/, "").toLowerCase()}%`)
          .order("reel_count", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    // ASF Team / leadership roster (president, coordinators, alumni). These are
    // not registered profiles, so search them here and link to /about/team.
    !empty && (showAll || type === "people")
      ? supabase
          .from("management_team")
          .select("id, name, role, photo_url, category")
          .eq("is_active", true)
          .or(`name.ilike.${pattern},role.ilike.${pattern}`)
          .order("sort_order", { ascending: true })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ]);

  const totalHits =
    (people.data?.length ?? 0) +
    (teams.data?.length ?? 0) +
    (events.data?.length ?? 0) +
    (tournaments.data?.length ?? 0) +
    (reels.data?.length ?? 0) +
    (news.data?.length ?? 0) +
    (hashtags.data?.length ?? 0) +
    (staff.data?.length ?? 0);

  return (
    <>
      <PageHero
        eyebrow="Search"
        title={empty ? "Search ASF." : `Results for "${q}"`}
        subtitle={empty ? "Type above to find people, teams, events, news, reels, and hashtags." : `${totalHits} hits across the platform.`}
      />

      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-asf-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center gap-3">
          <form action="/search" className="flex items-stretch gap-2">
            <div className="flex items-stretch h-9 rounded-md border border-asf-border bg-white">
              <span className="inline-flex items-center px-3 text-asf-muted">
                <Search className="w-4 h-4" aria-hidden />
              </span>
              <input
                name="q"
                defaultValue={q}
                placeholder="People, teams, events, hashtags..."
                className="px-2 text-sm outline-none w-72"
              />
            </div>
            <input type="hidden" name="type" value={type} />
            <button
              type="submit"
              className="h-9 px-4 rounded-md bg-asf-navy text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-navy-light"
            >
              Search
            </button>
          </form>
          <ul className="flex flex-wrap gap-1 ms-auto">
            {TYPES.map((t) => {
              const active = type === t.code;
              return (
                <li key={t.code}>
                  <Link
                    href={`/search?q=${encodeURIComponent(q)}&type=${t.code}`}
                    className={
                      active
                        ? "h-9 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-asf-navy text-white rounded-md"
                        : "h-9 px-3 inline-flex items-center text-xs font-condensed font-bold tracking-[0.16em] uppercase text-asf-text hover:bg-asf-off-2 rounded-md"
                    }
                  >
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
          {empty ? (
            <p className="text-asf-muted text-sm">Start typing to search.</p>
          ) : null}

          {(showAll || type === "people") && (people.data ?? []).length > 0 ? (
            <Group icon={<User className="w-4 h-4" aria-hidden />} title="People">
              <ul className="grid gap-3 sm:grid-cols-2">
                {people.data!.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/profile/${p.username}`}
                      className="flex items-center gap-3 p-3 rounded-md bg-white border border-asf-border hover:border-asf-red/40"
                    >
                      <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                        {p.avatar_url ? (
                          <FillImage src={p.avatar_url} alt="" className="object-cover" sizes="36px" />
                        ) : (
                          <span aria-hidden>{(p.full_name ?? p.username ?? "?").charAt(0).toUpperCase()}</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-asf-text truncate inline-flex items-center gap-1">
                          {p.full_name ?? p.username}
                          <VerifiedBadge status={p.verification_status} />
                        </span>
                        <span className="block text-xs text-asf-muted">@{p.username}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Group>
          ) : null}

          {(showAll || type === "people") && (staff.data ?? []).length > 0 ? (
            <Group icon={<Users className="w-4 h-4" aria-hidden />} title="ASF Team">
              <ul className="grid gap-3 sm:grid-cols-2">
                {staff.data!.map((m) => (
                  <li key={m.id}>
                    <Link
                      href="/about/team"
                      className="flex items-center gap-3 p-3 rounded-md bg-white border border-asf-border hover:border-asf-red/40"
                    >
                      <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                        {m.photo_url ? (
                          <FillImage src={m.photo_url} alt="" className="object-cover" sizes="36px" />
                        ) : (
                          <span aria-hidden>{(m.name ?? "?").charAt(0).toUpperCase()}</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-asf-text truncate">{m.name}</span>
                        <span className="block text-xs text-asf-muted">{m.role}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Group>
          ) : null}

          {(showAll || type === "teams") && (teams.data ?? []).length > 0 ? (
            <Group icon={<Users className="w-4 h-4" aria-hidden />} title="Teams">
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.data!.map((t) => (
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
                        <span className="block text-xs text-asf-muted capitalize">
                          {t.sport} . {[t.city, t.state_province].filter(Boolean).join(", ")}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Group>
          ) : null}

          {(showAll || type === "events") && (events.data ?? []).length > 0 ? (
            <Group icon={<Calendar className="w-4 h-4" aria-hidden />} title="Events">
              <ul className="space-y-2">
                {events.data!.map((e) => (
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

          {(showAll || type === "tournaments") && (tournaments.data ?? []).length > 0 ? (
            <Group icon={<Trophy className="w-4 h-4" aria-hidden />} title="Tournaments">
              <ul className="space-y-2">
                {tournaments.data!.map((t) => (
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

          {(showAll || type === "reels") && (reels.data ?? []).length > 0 ? (
            <Group icon={<Video className="w-4 h-4" aria-hidden />} title="Reels">
              <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {reels.data!.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/reels/${r.id}`}
                      className="block aspect-[9/16] rounded-md overflow-hidden bg-black relative"
                    >
                      {r.thumbnail_url ? (
                        <FillImage src={r.thumbnail_url} alt="" className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                      ) : (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video
                          src={r.video_url}
                          muted
                          playsInline
                          preload="metadata"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/30" />
                      <p className="absolute bottom-1 left-1 right-1 text-white text-[0.65rem] line-clamp-2 drop-shadow">
                        {r.caption ?? ""}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Group>
          ) : null}

          {(showAll || type === "news") && (news.data ?? []).length > 0 ? (
            <Group icon={<Newspaper className="w-4 h-4" aria-hidden />} title="News">
              <ul className="space-y-2">
                {news.data!.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/news/${n.slug}`}
                      className="block p-3 rounded-md bg-white border border-asf-border hover:border-asf-red/40"
                    >
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

          {(showAll || type === "hashtags") && (hashtags.data ?? []).length > 0 ? (
            <Group icon={<Hash className="w-4 h-4" aria-hidden />} title="Hashtags">
              <ul className="flex flex-wrap gap-2">
                {hashtags.data!.map((h) => (
                  <li key={h.tag}>
                    <Link
                      href={`/hashtags/${h.tag}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-asf-border text-sm text-asf-text hover:border-asf-red/40"
                    >
                      <Hash className="w-3 h-3 text-asf-red" aria-hidden />
                      {h.tag}
                      <span className="text-xs text-asf-muted">{h.reel_count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Group>
          ) : null}

          {!empty && totalHits === 0 ? (
            <p className="text-asf-muted text-sm">No matches. Try different words.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}

function Group({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article>
      <h2 className="font-condensed font-bold text-xs tracking-[0.22em] uppercase text-asf-muted mb-3 inline-flex items-center gap-1.5">
        {icon}
        {title}
      </h2>
      {children}
    </article>
  );
}
