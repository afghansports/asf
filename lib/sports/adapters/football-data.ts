/**
 * Football-Data.org adapter — FIFA World Cup 2026 only (groups + standings).
 *
 * Free tier (10 calls/min) includes the "WC" competition. Requires an API key
 * (free signup at https://www.football-data.org/client/register). Set
 * `FOOTBALL_DATA_KEY` in env. If unset, the adapter is a no-op — TheSportsDB
 * still provides World Cup fixtures, this just adds the group standings table.
 *
 * Docs: https://www.football-data.org/documentation/api
 */

import type { FixtureRow, StandingRow, SyncResult } from "./types";
import { createServiceClient } from "@/lib/supabase/server";

const KEY = process.env.FOOTBALL_DATA_KEY ?? "";
const BASE = "https://api.football-data.org/v4";

const COMPETITIONS: { code: string; label: string }[] = [
  { code: "WC", label: "FIFA World Cup" },
];

type Match = {
  id: number;
  utcDate: string;
  status: string;
  competition: { code: string; name: string };
  season: { startDate: string };
  homeTeam: { name: string; crest: string };
  awayTeam: { name: string; crest: string };
  score: { fullTime: { home: number | null; away: number | null } };
  venue: string | null;
};

type StandingsTeam = {
  position: number;
  team: { name: string; crest: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

function statusOf(s: string): FixtureRow["status"] {
  const u = s.toUpperCase();
  if (u === "FINISHED") return "final";
  if (u === "IN_PLAY" || u === "PAUSED") return "live";
  if (u === "POSTPONED" || u === "CANCELLED" || u === "SUSPENDED") return "postponed";
  return "scheduled";
}

async function fetchJson<T>(path: string): Promise<T | null> {
  if (!KEY) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "X-Auth-Token": KEY },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function syncFootballData(): Promise<SyncResult> {
  if (!KEY) return { ok: false, status: "error", message: "football-data not configured" };
  const supabase = createServiceClient();
  let upserted = 0;
  try {
    for (const comp of COMPETITIONS) {
      const json = await fetchJson<{ matches: Match[] }>(
        `/competitions/${comp.code}/matches?dateFrom=${todayStr(-7)}&dateTo=${todayStr(14)}`,
      );
      const matches = json?.matches ?? [];
      if (matches.length === 0) continue;

      const rows: FixtureRow[] = matches.map((m) => ({
        provider: "football-data",
        provider_id: String(m.id),
        sport_code: "soccer",
        league: m.competition.name,
        league_id: m.competition.code,
        country_code: null,
        season: m.season?.startDate?.slice(0, 4) ?? null,
        kickoff: m.utcDate,
        status: statusOf(m.status),
        home_name: m.homeTeam.name,
        home_logo_url: m.homeTeam.crest,
        home_score: m.score?.fullTime?.home ?? null,
        away_name: m.awayTeam.name,
        away_logo_url: m.awayTeam.crest,
        away_score: m.score?.fullTime?.away ?? null,
        venue: m.venue,
        notes: null,
        feed_tag: "wc2026",
        raw: m as unknown as Record<string, unknown>,
      }));
      const { error } = await supabase
        .from("external_fixtures")
        .upsert(rows, { onConflict: "provider,provider_id" });
      if (error) return { ok: false, status: "error", message: error.message };
      upserted += rows.length;

      // Standings (one extra call per competition; respects 10/min)
      const stJson = await fetchJson<{ standings: { table: StandingsTeam[] }[] }>(
        `/competitions/${comp.code}/standings`,
      );
      const table = stJson?.standings?.[0]?.table ?? [];
      if (table.length > 0) {
        const stRows: StandingRow[] = table.map((t) => ({
          provider: "football-data",
          provider_id: `${comp.code}:${t.team.name}`,
          sport_code: "soccer",
          league_id: comp.code,
          league_name: comp.label,
          season: null,
          position: t.position,
          team_name: t.team.name,
          team_logo_url: t.team.crest,
          played: t.playedGames,
          won: t.won,
          drawn: t.draw,
          lost: t.lost,
          goals_for: t.goalsFor,
          goals_against: t.goalsAgainst,
          goal_difference: t.goalDifference,
          points: t.points,
          feed_tag: "wc2026",
          raw: t as unknown as Record<string, unknown>,
        }));
        await supabase
          .from("external_standings")
          .upsert(stRows, { onConflict: "provider,provider_id" });
      }
    }
    await supabase.from("external_sync_log").insert({
      provider: "football-data",
      resource: "fixtures",
      status: "ok",
      records_upserted: upserted,
    });
    return { ok: true, upserted };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("external_sync_log").insert({
      provider: "football-data",
      resource: "fixtures",
      status: "error",
      error_message: msg,
    });
    return { ok: false, status: "error", message: msg };
  }
}

function todayStr(deltaDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}
