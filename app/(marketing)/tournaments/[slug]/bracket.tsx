import Link from "next/link";
import { cn } from "@/lib/utils";
import { FillImage } from "@/components/shared/optimized-image";

export type BracketMatch = {
  id: string;
  round: number;
  position: number;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  status: string | null;
  scheduled_for: string | null;
};

type Team = { id: string; name: string; slug: string; logo_url: string | null };

/**
 * Single-elimination bracket. Renders matches grouped by round in horizontal
 * columns. Wrapped in overflow-x for mobile.
 *
 * Pure server component (no state) — the browser scrolls horizontally on
 * narrow viewports. Each match clicks through to the team page of either side.
 */
export function Bracket({ matches, teamMap }: { matches: BracketMatch[]; teamMap: Map<string, Team> }) {
  const rounds = Array.from(
    matches.reduce<Map<number, BracketMatch[]>>((m, x) => {
      const list = m.get(x.round) ?? [];
      list.push(x);
      m.set(x.round, list);
      return m;
    }, new Map())
  ).sort(([a], [b]) => a - b);

  if (rounds.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-6 min-w-full pb-3">
        {rounds.map(([roundNum, list]) => (
          <div key={roundNum} className="min-w-[14rem] flex-shrink-0">
            <p className="font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted mb-3">
              {roundLabel(roundNum, rounds.length)}
            </p>
            <ul
              className={cn(
                "flex flex-col",
                roundNum === 1 ? "gap-3" : roundNum === 2 ? "gap-12" : roundNum === 3 ? "gap-32" : "gap-44"
              )}
            >
              {list
                .sort((a, b) => a.position - b.position)
                .map((m) => {
                  const home = m.home_team_id ? teamMap.get(m.home_team_id) : undefined;
                  const away = m.away_team_id ? teamMap.get(m.away_team_id) : undefined;
                  const winner = m.winner_team_id;
                  return (
                    <li key={m.id} className="rounded-lg border border-asf-border bg-white overflow-hidden">
                      <BracketRow team={home} score={m.home_score} winner={winner === home?.id} />
                      <div className="border-t border-asf-border" />
                      <BracketRow team={away} score={m.away_score} winner={winner === away?.id} />
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketRow({
  team,
  score,
  winner,
}: {
  team: Team | undefined;
  score: number | null;
  winner: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2",
        winner ? "bg-asf-green-light" : ""
      )}
    >
      <span className="relative inline-flex w-6 h-6 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-[0.65rem] overflow-hidden shrink-0">
        {team?.logo_url ? (
          <FillImage src={team.logo_url} alt="" className="object-cover" sizes="24px" />
        ) : (
          <span aria-hidden>{team ? team.name.charAt(0).toUpperCase() : "?"}</span>
        )}
      </span>
      {team ? (
        <Link href={`/teams/${team.slug}`} className="text-sm text-asf-text truncate flex-1 hover:text-asf-red">
          {team.name}
        </Link>
      ) : (
        <span className="text-sm text-asf-muted flex-1">TBD</span>
      )}
      <span className={cn("font-display font-black tabular-nums text-sm", winner ? "text-asf-green" : "text-asf-muted")}>
        {score ?? "-"}
      </span>
    </div>
  );
}

function roundLabel(round: number, total: number): string {
  if (round === total) return "Final";
  if (round === total - 1) return "Semifinal";
  if (round === total - 2) return "Quarterfinal";
  return `Round ${round}`;
}
