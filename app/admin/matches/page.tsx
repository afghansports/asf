import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "../_action-button";
import { adminConfirmMatch, deleteMatch } from "../_chapters-actions";
import { ModuleToggle } from "../modules/module-toggle";
import { isFeatureEnabled } from "@/lib/features/flags";
import { MatchForm } from "./match-form";

export const metadata = { title: "Admin matches" };

type SearchParams = { new?: string };

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (searchParams ? await searchParams : {}) as SearchParams;
  const creating = !!sp.new;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("matches")
    .select(
      "id, sport, home_team_id, away_team_id, home_score, away_score, status, played_at, reported_at, city, state_province"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const moduleEnabled = await isFeatureEnabled("module.matches");

  const ids = Array.from(new Set((rows ?? []).flatMap((m) => [m.home_team_id, m.away_team_id]).filter(Boolean) as string[]));
  const { data: teams } = ids.length
    ? await supabase.from("teams").select("id, name").in("id", ids)
    : { data: [] };
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t.name]));

  const { data: allTeams } = creating
    ? await supabase
        .from("teams")
        .select("id, name, sport")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .limit(500)
    : { data: [] };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-black text-3xl text-asf-text">Matches</h1>
          <p className="text-sm text-asf-muted mt-1">Reported matches auto-confirm 48h after submission. Confirm earlier or delete here.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <Link
            href="/admin/matches?new=1"
            className="inline-flex items-center h-9 px-4 rounded-md bg-asf-red text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-red-dark"
          >
            + New match
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
              Show on site
            </span>
            <ModuleToggle flagKey="module.matches" initialEnabled={moduleEnabled} />
          </div>
        </div>
      </div>

      {creating ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-xl text-asf-text">New match</h2>
            <Link href="/admin/matches" className="text-sm text-asf-muted hover:text-asf-red">
              Cancel
            </Link>
          </div>
          <MatchForm teams={allTeams ?? []} />
        </div>
      ) : null}
      <div className="rounded-lg border border-asf-border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border text-left">
            <tr>
              <Th>Date</Th>
              <Th>Sport</Th>
              <Th>Home</Th>
              <Th>Score</Th>
              <Th>Away</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((m) => (
              <tr key={m.id} className="border-t border-asf-border">
                <td className="px-4 py-3 text-asf-muted">
                  {m.played_at ? new Date(m.played_at).toLocaleDateString("en-US") : "TBD"}
                </td>
                <td className="px-4 py-3 capitalize text-asf-muted">{m.sport}</td>
                <td className="px-4 py-3 text-asf-text">{teamMap.get(m.home_team_id) ?? "-"}</td>
                <td className="px-4 py-3 font-display font-black text-asf-text tabular-nums">
                  {m.home_score ?? "-"} . {m.away_score ?? "-"}
                </td>
                <td className="px-4 py-3 text-asf-text">{teamMap.get(m.away_team_id) ?? "-"}</td>
                <td className="px-4 py-3 capitalize text-asf-muted">{m.status}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <Link
                      href={`/matches/${m.id}`}
                      className="inline-flex items-center h-8 px-3 rounded-md bg-asf-off-2 text-asf-text text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-navy hover:text-white"
                    >
                      View
                    </Link>
                    {m.status === "reported" || m.status === "disputed" ? (
                      <ActionButton
                        action={adminConfirmMatch.bind(null, m.id)}
                        label="Confirm"
                        variant="ok"
                      />
                    ) : null}
                    <ActionButton
                      action={deleteMatch.bind(null, m.id)}
                      label="Delete"
                      variant="danger"
                      confirm="Delete this match?"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-asf-muted text-sm">No matches yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
      {children}
    </th>
  );
}
