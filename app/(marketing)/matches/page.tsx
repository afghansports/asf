import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { SectionLabel } from "@/components/shared/section-label";
import { EmptyState } from "@/components/shared/empty-state";
import { getSport } from "@/lib/data/sports";
import { US_STATES } from "@/lib/data/us-states";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";
import { FillImage } from "@/components/shared/optimized-image";

export const metadata: Metadata = {
  title: "Matches",
  description: "Match results across ASF teams. Submitted by captains, auto-confirmed after 48 hours.",
};

type SearchParams = { sport?: string; status?: string };

export default async function MatchesListPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  if (!(await isFeatureEnabled("module.matches"))) return <ModuleDisabled name="Matches" />;
  const sp = (searchParams ? await searchParams : {}) as SearchParams;

  const supabase = await createClient();
  let q = supabase
    .from("matches")
    .select(
      "id, sport, home_team_id, away_team_id, played_at, scheduled_for, city, state_province, status, home_score, away_score"
    )
    .order("played_at", { ascending: false, nullsFirst: false })
    .order("scheduled_for", { ascending: false, nullsFirst: false })
    .limit(80);

  if (sp.sport) q = q.eq("sport", sp.sport);
  if (sp.status === "confirmed") q = q.eq("status", "confirmed");
  if (sp.status === "scheduled") q = q.eq("status", "scheduled");
  if (sp.status === "reported") q = q.eq("status", "reported");

  const { data: matches } = await q;
  const list = matches ?? [];

  const teamIds = Array.from(
    new Set(list.flatMap((m) => [m.home_team_id, m.away_team_id]).filter(Boolean))
  ) as string[];
  const { data: teams } = teamIds.length
    ? await supabase
        .from("teams")
        .select("id, name, slug, logo_url")
        .in("id", teamIds)
    : { data: [] };
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));

  return (
    <>
      <PageHero
        eyebrow="Matches"
        title="Recent matches."
        subtitle="Captains submit results from their phone. Results auto-confirm 48 hours later unless the opposing captain disputes."
      >
        <Link
          href="/matches/submit"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.18em] uppercase hover:bg-asf-red-dark"
        >
          <PlusCircle className="w-4 h-4" aria-hidden />
          Submit a result
        </Link>
      </PageHero>

      <section className="w-full bg-asf-off">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
          {list.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-5 h-5" aria-hidden />}
              title="No matches yet."
              description="When captains submit their first result, it will show up here."
              action={{ label: "Submit a result", href: "/matches/submit" }}
            />
          ) : (
            <ul className="space-y-3">
              {list.map((m) => {
                const home = teamMap.get(m.home_team_id);
                const away = teamMap.get(m.away_team_id);
                const sport = m.sport ? getSport(m.sport) : undefined;
                const stateName = m.state_province
                  ? US_STATES.find((s) => s.code === m.state_province)?.name
                  : undefined;
                const date = (m.played_at ?? m.scheduled_for)
                  ? new Date(m.played_at ?? m.scheduled_for!).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "TBD";
                const homeWon = (m.home_score ?? 0) > (m.away_score ?? 0);
                const awayWon = (m.away_score ?? 0) > (m.home_score ?? 0);
                const showScore = m.status === "confirmed" || m.status === "reported";
                return (
                  <li key={m.id}>
                    <Link
                      href={`/matches/${m.id}`}
                      className="block p-4 rounded-lg border border-asf-border bg-white hover:border-asf-red/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[72px]">
                          <p className="text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted">
                            {date}
                          </p>
                          {sport ? (
                            <p className="text-[0.7rem] text-asf-text mt-1">{sport.name}</p>
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                          <TeamSide team={home} winning={showScore && homeWon} />
                          <div className="text-center">
                            {showScore ? (
                              <p className="font-display font-black text-2xl text-asf-text tabular-nums">
                                {m.home_score ?? 0} . {m.away_score ?? 0}
                              </p>
                            ) : (
                              <p className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-muted">
                                vs
                              </p>
                            )}
                            <StatusBadge status={m.status} />
                          </div>
                          <TeamSide team={away} winning={showScore && awayWon} reverse />
                        </div>
                      </div>
                      {stateName ? (
                        <SectionLabel className="mt-3">{[m.city, stateName].filter(Boolean).join(", ")}</SectionLabel>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

function TeamSide({
  team,
  winning,
  reverse,
}: {
  team: { name: string; slug: string; logo_url: string | null } | undefined;
  winning: boolean;
  reverse?: boolean;
}) {
  if (!team) {
    return <p className="text-asf-muted text-sm">TBD</p>;
  }
  return (
    <div className={reverse ? "flex items-center gap-3 justify-end" : "flex items-center gap-3"}>
      {!reverse ? (
        <span className="relative inline-flex w-8 h-8 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
          {team.logo_url ? (
            <FillImage src={team.logo_url} alt="" className="object-cover" sizes="32px" />
          ) : (
            <span aria-hidden>{team.name.charAt(0).toUpperCase()}</span>
          )}
        </span>
      ) : null}
      <p className={`text-sm truncate ${winning ? "font-bold text-asf-text" : "text-asf-text"}`}>
        {team.name}
      </p>
      {reverse ? (
        <span className="relative inline-flex w-8 h-8 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
          {team.logo_url ? (
            <FillImage src={team.logo_url} alt="" className="object-cover" sizes="32px" />
          ) : (
            <span aria-hidden>{team.name.charAt(0).toUpperCase()}</span>
          )}
        </span>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "confirmed"
      ? "bg-asf-green-light text-asf-green"
      : status === "reported"
        ? "bg-asf-gold-light text-asf-text"
        : status === "disputed"
          ? "bg-asf-red-light text-asf-red"
          : "bg-asf-off-2 text-asf-muted";
  return (
    <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded text-[0.6rem] font-condensed font-bold tracking-[0.16em] uppercase ${tone}`}>
      {status}
    </span>
  );
}
