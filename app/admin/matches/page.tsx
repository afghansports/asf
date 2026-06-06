import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActionButton } from "../_action-button";
import { adminConfirmMatch, deleteMatch } from "../_chapters-actions";

export const metadata = { title: "Admin matches" };

export default async function AdminMatchesPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("matches")
    .select(
      "id, sport, home_team_id, away_team_id, home_score, away_score, status, played_at, reported_at, city, state_province"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const ids = Array.from(new Set((rows ?? []).flatMap((m) => [m.home_team_id, m.away_team_id]).filter(Boolean) as string[]));
  const { data: teams } = ids.length
    ? await supabase.from("teams").select("id, name").in("id", ids)
    : { data: [] };
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t.name]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl text-asf-text">Matches</h1>
        <p className="text-sm text-asf-muted mt-1">Reported matches auto-confirm 48h after submission. Confirm earlier or delete here.</p>
      </div>
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
                        action={() => adminConfirmMatch(m.id)}
                        label="Confirm"
                        variant="ok"
                      />
                    ) : null}
                    <ActionButton
                      action={() => deleteMatch(m.id)}
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
