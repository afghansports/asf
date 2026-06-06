/**
 * TheSportsDB adapter. Fully free, no API key needed (test key "3" gives
 * basic data, "1" is the public key listed on their docs).
 *
 * Docs: https://www.thesportsdb.com/api.php
 *
 * Coverage: soccer, basketball, american football, baseball, cricket,
 * volleyball, tennis, rugby, motorsport, ice hockey. Not every endpoint is
 * available on the free tier — we stick to ones that are.
 */

import type { FixtureRow, NewsRow, SyncResult } from "./types";
import { createServiceClient } from "@/lib/supabase/server";

const KEY = process.env.THESPORTSDB_KEY ?? "3";          // free public key
const BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`;

const SPORT_MAP: Record<string, string> = {
  Soccer: "soccer",
  Basketball: "basketball",
  Volleyball: "volleyball",
  Cricket: "cricket",
  Tennis: "tennis",
  "Table Tennis": "table_tennis",
  Badminton: "badminton",
  Wrestling: "wrestling",
  Boxing: "boxing",
  Athletics: "athletics",
};

type Event = {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  dateEvent: string | null;
  strTime: string | null;
  strTimestamp: string | null;
  strLeague: string;
  idLeague: string;
  strVenue: string | null;
  strCountry: string | null;
  strSeason: string | null;
  strSport: string | null;
  strHomeTeamBadge: string | null;
  strAwayTeamBadge: string | null;
  strStatus: string | null;
  strPostponed: string | null;
};

function statusOf(e: Event): FixtureRow["status"] {
  if (e.strPostponed === "yes") return "postponed";
  const s = (e.strStatus ?? "").toLowerCase();
  if (s.includes("ft") || s.includes("final") || (e.intHomeScore && e.intAwayScore)) return "final";
  if (s.includes("live") || s.includes("ht") || s.includes("1h") || s.includes("2h")) return "live";
  return "scheduled";
}

/** Pull next 15 events for one league. Repeat call for each league you care about. */
export async function fetchUpcomingByLeague(leagueId: string): Promise<FixtureRow[]> {
  const url = `${BASE}/eventsnextleague.php?id=${encodeURIComponent(leagueId)}`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return [];
  const json = (await res.json()) as { events: Event[] | null };
  const out: FixtureRow[] = [];
  for (const e of json.events ?? []) {
    out.push(toFixture(e));
  }
  return out;
}

/** Pull last 15 events for a league (results). */
export async function fetchPastByLeague(leagueId: string): Promise<FixtureRow[]> {
  const url = `${BASE}/eventspastleague.php?id=${encodeURIComponent(leagueId)}`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return [];
  const json = (await res.json()) as { events: Event[] | null };
  return (json.events ?? []).map(toFixture);
}

function toFixture(e: Event): FixtureRow {
  const sport = SPORT_MAP[e.strSport ?? ""] ?? "soccer";
  const kickoff =
    e.strTimestamp ??
    (e.dateEvent && e.strTime ? `${e.dateEvent}T${e.strTime}` : null);
  return {
    provider: "thesportsdb",
    provider_id: e.idEvent,
    sport_code: sport,
    league: e.strLeague,
    league_id: e.idLeague,
    country_code: e.strCountry?.slice(0, 2)?.toUpperCase() ?? null,
    season: e.strSeason,
    kickoff,
    status: statusOf(e),
    home_name: e.strHomeTeam,
    home_logo_url: e.strHomeTeamBadge,
    home_score: e.intHomeScore ? Number(e.intHomeScore) : null,
    away_name: e.strAwayTeam,
    away_logo_url: e.strAwayTeamBadge,
    away_score: e.intAwayScore ? Number(e.intAwayScore) : null,
    venue: e.strVenue,
    notes: null,
    raw: e as unknown as Record<string, unknown>,
  };
}

/** Default leagues we ingest on the free tier. Mix of regions so users see
 *  familiar leagues no matter where they live. */
export const DEFAULT_LEAGUES: { id: string; sport: string; label: string }[] = [
  { id: "4328", sport: "soccer",     label: "English Premier League" },
  { id: "4335", sport: "soccer",     label: "La Liga" },
  { id: "4332", sport: "soccer",     label: "Bundesliga" },
  { id: "4331", sport: "soccer",     label: "Serie A" },
  { id: "4334", sport: "soccer",     label: "Ligue 1" },
  { id: "4480", sport: "soccer",     label: "AFC Champions League" },
  { id: "4337", sport: "basketball", label: "NBA" },
  { id: "4391", sport: "cricket",    label: "ICC Cricket World Cup" },
  { id: "4426", sport: "volleyball", label: "FIVB Nations League" },
];

/** Run the full ingest. Returns how many rows were upserted into the cache. */
export async function syncTheSportsDb(): Promise<SyncResult> {
  const supabase = createServiceClient();
  let upserted = 0;
  try {
    for (const lg of DEFAULT_LEAGUES) {
      const upcoming = await fetchUpcomingByLeague(lg.id);
      const past = await fetchPastByLeague(lg.id);
      const rows = [...upcoming, ...past];
      if (rows.length === 0) continue;
      const { error } = await supabase
        .from("external_fixtures")
        .upsert(rows, { onConflict: "provider,provider_id" });
      if (error) {
        return { ok: false, status: "error", message: error.message };
      }
      upserted += rows.length;
    }
    await supabase.from("external_sync_log").insert({
      provider: "thesportsdb",
      resource: "fixtures",
      status: "ok",
      records_upserted: upserted,
    });
    return { ok: true, upserted };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("external_sync_log").insert({
      provider: "thesportsdb",
      resource: "fixtures",
      status: "error",
      error_message: msg,
    });
    return { ok: false, status: "error", message: msg };
  }
}

// Re-export NewsRow for type symmetry — TheSportsDB doesn't ship news.
export type { FixtureRow, NewsRow };
