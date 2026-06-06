import type { Metadata } from "next";
import Link from "next/link";
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
  title: "Scores & news",
  description: "Live and recent fixtures plus headlines pulled from public sports APIs.",
};

const SPORT_LABEL: Record<string, string> = {
  soccer: "Soccer",
  basketball: "Basketball",
  cricket: "Cricket",
  volleyball: "Volleyball",
  tennis: "Tennis",
};

type Props = { searchParams?: Promise<{ sport?: string }> | { sport?: string } };

export default async function ScoresPage({ searchParams }: Props) {
  if (!(await isFeatureEnabled("module.external_sports"))) {
    return <ModuleDisabled name="Scores & news" />;
  }
  const sp = (searchParams ? await searchParams : {}) as { sport?: string };
  const sportFilter = sp.sport ?? "";

  const supabase = await createClient();
  const now = new Date();
  const past = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  let fixturesQuery = supabase
    .from("external_fixtures")
    .select(
      "id, provider, sport_code, league, league_id, kickoff, status, home_name, home_logo_url, home_score, away_name, away_logo_url, away_score, venue",
    )
    .gte("kickoff", past)
    .lte("kickoff", future)
    .order("kickoff", { ascending: true })
    .limit(40);
  if (sportFilter) fixturesQuery = fixturesQuery.eq("sport_code", sportFilter);
  const { data: fixtures } = await fixturesQuery;

  let newsQuery = supabase
    .from("external_news")
    .select("id, sport_code, title, summary, url, image_url, source_name, published_at")
    .order("published_at", { ascending: false })
    .limit(20);
  if (sportFilter) newsQuery = newsQuery.eq("sport_code", sportFilter);
  const { data: news } = await newsQuery;

  // Standings — top of every league we have data for
  const { data: standings } = await supabase
    .from("external_standings")
    .select("league_id, league_name, position, team_name, team_logo_url, played, won, drawn, lost, points, goal_difference")
    .order("league_id")
    .order("position")
    .limit(120);

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
  const byLeague = new Map<string, StandingRow[]>();
  for (const s of (standings ?? []) as StandingRow[]) {
    const arr = byLeague.get(s.league_id) ?? [];
    if (arr.length < 6) arr.push(s);
    byLeague.set(s.league_id, arr);
  }

  const sportTabs = [
    { code: "", label: "All sports" },
    ...Object.entries(SPORT_LABEL).map(([code, label]) => ({ code, label })),
  ];

  return (
    <>
      <PageHero
        eyebrow="Live"
        title="Scores & news"
        subtitle="Pro and international fixtures, headlines, and league tables. Powered by public sports APIs."
      />
      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-10">
          {/* Sport filter chips */}
          <nav className="flex flex-wrap gap-2" aria-label="Filter by sport">
            {sportTabs.map((t) => (
              <Link
                key={t.code || "all"}
                href={t.code ? `/scores?sport=${t.code}` : `/scores`}
                className={
                  sportFilter === t.code
                    ? "h-8 px-3 inline-flex items-center rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-asf-navy text-white"
                    : "h-8 px-3 inline-flex items-center rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
                }
              >
                {t.label}
              </Link>
            ))}
          </nav>

          {/* Fixtures */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Fixtures</SectionLabel>
              <p className="text-xs text-asf-muted">Past 4 days · next 14 days</p>
            </div>
            {!fixtures || fixtures.length === 0 ? (
              <EmptyState
                icon={<Trophy className="w-5 h-5" />}
                title="No fixtures cached yet."
                description="The next sync will populate this list. Admin can trigger one from /admin/modules."
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fixtures.map((f) => (
                  <li key={f.id} className="p-4 rounded-lg bg-white border border-asf-border">
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
                    <Row name={f.home_name} logo={f.home_logo_url} score={f.home_score} />
                    <Row name={f.away_name} logo={f.away_logo_url} score={f.away_score} />
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
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Standings */}
          {byLeague.size > 0 ? (
            <div>
              <SectionLabel>Standings</SectionLabel>
              <ul className="grid gap-4 mt-3 lg:grid-cols-2">
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
                            <td className="py-1.5 inline-flex items-center gap-2">
                              {r.team_logo_url ? (
                                <FixedImage src={cdnUrl(r.team_logo_url)} alt="" width={16} height={16} className="w-4 h-4 object-contain" />
                              ) : null}
                              {r.team_name}
                            </td>
                            <td className="py-1.5 text-right">{r.played}</td>
                            <td className="py-1.5 text-right">{r.goal_difference > 0 ? `+${r.goal_difference}` : r.goal_difference}</td>
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

          {/* News */}
          <div>
            <SectionLabel>Headlines</SectionLabel>
            {!news || news.length === 0 ? (
              <p className="mt-3 text-sm text-asf-muted">No headlines cached yet.</p>
            ) : (
              <ul className="grid gap-3 mt-3 sm:grid-cols-2 lg:grid-cols-3">
                {news.map((n) => (
                  <li key={n.id}>
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
                ))}
              </ul>
            )}
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

function Row({ name, logo, score }: { name: string; logo: string | null; score: number | null }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="inline-flex items-center gap-2 min-w-0">
        {logo ? (
          <FixedImage src={cdnUrl(logo)} alt="" width={20} height={20} className="w-5 h-5 object-contain shrink-0" />
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
