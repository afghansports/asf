import type { Metadata } from "next";
import { Trophy, Newspaper, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionLabel } from "@/components/shared/section-label";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";
import { cdnUrl } from "@/lib/cdn/cloudflare";
import { FixedImage } from "@/components/shared/optimized-image";

export const metadata: Metadata = {
  title: "Afghanistan & World Cup 2026",
  description: "Afghanistan national fixtures and World Cup 2026 scores, headlines, and standings.",
};

type StandingRow = {
  league_id: string;
  league_name: string | null;
  position: number;
  team_name: string;
  team_logo_url: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goal_difference: number;
};

type FixtureRow = {
  id: string;
  provider: string | null;
  sport_code: string | null;
  league: string | null;
  league_id: string | null;
  kickoff: string | null;
  status: string | null;
  home_name: string;
  home_logo_url: string | null;
  home_score: number | null;
  away_name: string;
  away_logo_url: string | null;
  away_score: number | null;
  venue: string | null;
};

type NewsRow = {
  id: string;
  sport_code: string | null;
  title: string;
  summary: string | null;
  url: string;
  image_url: string | null;
  source_name: string | null;
  published_at: string | null;
};

export default async function ScoresPage() {
  if (!(await isFeatureEnabled("module.external_sports"))) {
    return <ModuleDisabled name="Scores & news" />;
  }

  const supabase = await createClient();
  const now = new Date();
  const past = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  // Fixtures tagged for afghanistan or wc2026
  const { data: allFixtures } = await supabase
    .from("external_fixtures")
    .select(
      "id, provider, sport_code, league, league_id, kickoff, status, home_name, home_logo_url, home_score, away_name, away_logo_url, away_score, venue, feed_tag",
    )
    .in("feed_tag", ["afghanistan", "wc2026"])
    .gte("kickoff", past)
    .lte("kickoff", future)
    .order("kickoff", { ascending: true })
    .limit(60);

  // News tagged for afghanistan or wc2026
  const { data: allNews } = await supabase
    .from("external_news")
    .select("id, sport_code, title, summary, url, image_url, source_name, published_at, feed_tag")
    .in("feed_tag", ["afghanistan", "wc2026"])
    .order("published_at", { ascending: false })
    .limit(40);

  // Standings tagged wc2026
  const { data: standings } = await supabase
    .from("external_standings")
    .select(
      "league_id, league_name, position, team_name, team_logo_url, played, won, drawn, lost, points, goal_difference, feed_tag",
    )
    .in("feed_tag", ["afghanistan", "wc2026"])
    .order("league_id")
    .order("position")
    .limit(120);

  // Split into sections
  const afgFixtures = ((allFixtures ?? []) as (FixtureRow & { feed_tag: string })[]).filter(
    (f) => f.feed_tag === "afghanistan",
  );
  const wcFixtures = ((allFixtures ?? []) as (FixtureRow & { feed_tag: string })[]).filter(
    (f) => f.feed_tag === "wc2026",
  );
  const afgNews = ((allNews ?? []) as (NewsRow & { feed_tag: string })[]).filter(
    (n) => n.feed_tag === "afghanistan",
  );
  const wcNews = ((allNews ?? []) as (NewsRow & { feed_tag: string })[]).filter(
    (n) => n.feed_tag === "wc2026",
  );

  const byLeague = new Map<string, StandingRow[]>();
  for (const s of (standings ?? []) as (StandingRow & { feed_tag: string })[]) {
    if (s.feed_tag !== "wc2026") continue;
    const arr = byLeague.get(s.league_id) ?? [];
    if (arr.length < 6) arr.push(s);
    byLeague.set(s.league_id, arr);
  }

  return (
    <>
      <PageHero
        eyebrow="Live"
        title="Afghanistan & World Cup 2026"
        subtitle="Afghanistan national fixtures and World Cup 2026 scores, headlines, and standings."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-14">

          {/* ── Afghanistan section ── */}
          <div className="space-y-8">
            <SectionLabel>Afghanistan</SectionLabel>

            {/* Afghanistan fixtures */}
            <div>
              <p className="mb-3 text-xs font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted">
                Fixtures
              </p>
              {afgFixtures.length === 0 ? (
                <EmptyState
                  icon={<Trophy className="w-5 h-5" />}
                  title="No Afghanistan fixtures cached yet."
                  description="Fixtures will appear here once the next sync completes."
                />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {afgFixtures.map((f) => (
                    <li key={f.id} className="p-4 rounded-lg bg-white border border-asf-border">
                      <FixtureCard f={f} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Afghanistan news */}
            <div>
              <p className="mb-3 text-xs font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted">
                Headlines
              </p>
              {afgNews.length === 0 ? (
                <p className="text-sm text-asf-muted">No Afghanistan headlines cached yet.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {afgNews.map((n) => (
                    <NewsCard key={n.id} n={n} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── World Cup 2026 section ── */}
          <div className="space-y-8">
            <SectionLabel>World Cup 2026</SectionLabel>

            {/* WC fixtures */}
            <div>
              <p className="mb-3 text-xs font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted">
                Fixtures
              </p>
              {wcFixtures.length === 0 ? (
                <EmptyState
                  icon={<Trophy className="w-5 h-5" />}
                  title="No World Cup fixtures cached yet."
                  description="Fixtures will appear here once the next sync completes."
                />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {wcFixtures.map((f) => (
                    <li key={f.id} className="p-4 rounded-lg bg-white border border-asf-border">
                      <FixtureCard f={f} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* WC standings */}
            {byLeague.size > 0 ? (
              <div>
                <p className="mb-3 text-xs font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted">
                  Group standings
                </p>
                <ul className="grid gap-4 lg:grid-cols-2">
                  {Array.from(byLeague.entries()).map(([leagueId, rows]) => (
                    <li key={leagueId} className="p-4 rounded-lg bg-white border border-asf-border">
                      <p className="font-display font-bold text-sm text-asf-text mb-2">
                        {rows[0]?.league_name ?? leagueId}
                      </p>
                      <table className="w-full text-xs">
                        <thead className="text-asf-muted">
                          <tr className="text-left">
                            <th className="py-1 font-condensed font-bold tracking-wider uppercase">#</th>
                            <th className="py-1 font-condensed font-bold tracking-wider uppercase">Team</th>
                            <th className="py-1 font-condensed font-bold tracking-wider uppercase text-right">P</th>
                            <th className="py-1 font-condensed font-bold tracking-wider uppercase text-right">GD</th>
                            <th className="py-1 font-condensed font-bold tracking-wider uppercase text-right">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr key={`${leagueId}-${r.position}`} className="border-t border-asf-border/50">
                              <td className="py-1.5">{r.position}</td>
                              <td className="py-1.5">
                                <span className="inline-flex items-center gap-2">
                                  {r.team_logo_url ? (
                                    <FixedImage
                                      src={cdnUrl(r.team_logo_url)}
                                      alt=""
                                      width={16}
                                      height={16}
                                      className="w-4 h-4 object-contain"
                                    />
                                  ) : null}
                                  {r.team_name}
                                </span>
                              </td>
                              <td className="py-1.5 text-right">{r.played}</td>
                              <td className="py-1.5 text-right">
                                {r.goal_difference > 0 ? `+${r.goal_difference}` : r.goal_difference}
                              </td>
                              <td className="py-1.5 text-right font-bold text-asf-text">{r.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* WC news */}
            <div>
              <p className="mb-3 text-xs font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted">
                Headlines
              </p>
              {wcNews.length === 0 ? (
                <p className="text-sm text-asf-muted">No World Cup headlines cached yet.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {wcNews.map((n) => (
                    <NewsCard key={n.id} n={n} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="text-xs text-asf-muted inline-flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Data from TheSportsDB, Football-Data.org, BallDontLie, and ESPN public RSS.
          </p>
        </div>
      </section>
    </>
  );
}

function FixtureCard({ f }: { f: FixtureRow }) {
  return (
    <>
      <div className="flex items-center justify-between text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted mb-2">
        <span>{f.league}</span>
        <span
          className={
            f.status === "live"
              ? "px-2 py-0.5 rounded bg-asf-red text-white"
              : f.status === "final"
              ? "px-2 py-0.5 rounded bg-asf-green-light text-asf-green"
              : "px-2 py-0.5 rounded bg-asf-off-2 text-asf-text"
          }
        >
          {f.status}
        </span>
      </div>
      <TeamRow name={f.home_name} logo={f.home_logo_url} score={f.home_score} />
      <TeamRow name={f.away_name} logo={f.away_logo_url} score={f.away_score} />
      <p className="mt-2 text-[0.65rem] text-asf-muted">
        {f.kickoff
          ? new Date(f.kickoff).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : ""}
        {f.venue ? ` · ${f.venue}` : ""}
      </p>
    </>
  );
}

function TeamRow({ name, logo, score }: { name: string; logo: string | null; score: number | null }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="inline-flex items-center gap-2 min-w-0">
        {logo ? (
          <FixedImage
            src={cdnUrl(logo)}
            alt=""
            width={20}
            height={20}
            className="w-5 h-5 object-contain shrink-0"
          />
        ) : (
          <span className="inline-flex w-5 h-5 rounded bg-asf-off-2 shrink-0" aria-hidden />
        )}
        <span className="text-sm text-asf-text truncate">{name}</span>
      </span>
      <span className="font-display font-bold text-sm text-asf-text tabular-nums">
        {score ?? "—"}
      </span>
    </div>
  );
}

function NewsCard({ n }: { n: NewsRow }) {
  return (
    <li>
      <a
        href={n.url}
        target="_blank"
        rel="noreferrer noopener"
        className="group flex flex-col h-full p-4 rounded-lg bg-white border border-asf-border hover:border-asf-red/50 hover:shadow-sm transition-all"
      >
        {n.image_url ? (
          <FixedImage
            src={cdnUrl(n.image_url)}
            alt=""
            width={600}
            height={320}
            className="w-full h-32 object-cover rounded-md mb-3"
          />
        ) : null}
        <p className="font-display font-bold text-sm text-asf-text line-clamp-3">{n.title}</p>
        {n.summary ? (
          <p className="mt-1 text-xs text-asf-muted line-clamp-3">{n.summary}</p>
        ) : null}
        <div className="mt-auto pt-3 flex items-center justify-between text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted">
          <span className="inline-flex items-center gap-1">
            <Newspaper className="w-3 h-3" />
            {n.source_name ?? "News"}
          </span>
          <span>
            {n.published_at
              ? new Date(n.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
        </div>
      </a>
    </li>
  );
}
