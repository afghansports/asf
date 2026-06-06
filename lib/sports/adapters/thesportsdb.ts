/**
 * TheSportsDB adapter — refocused on Afghanistan + FIFA World Cup 2026.
 *
 * Free, no API key required (test key "3" gives the team/league event
 * endpoints we use). Docs: https://www.thesportsdb.com/api.php
 *
 *  - Afghanistan national + domestic teams  → eventslast / eventsnext by team,
 *    tagged feed_tag = 'afghanistan'.
 *  - FIFA World Cup 2026 (league 4429)       → eventspastleague /
 *    eventsnextleague, tagged feed_tag = 'wc2026'.
 *
 * Verified live 2026-06-06.
 */

import type { FixtureRow, NewsRow, SyncResult } from "./types";
import { createServiceClient } from "@/lib/supabase/server";
import { AFGHANISTAN_TEAMS, WORLD_CUP_2026_LEAGUE_ID } from "../afghanistan-teams";

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

function toFixture(e: Event, feedTag: "afghanistan" | "wc2026", sportHint?: string): FixtureRow {
  const sport = SPORT_MAP[e.strSport ?? ""] ?? sportHint ?? "soccer";
  const kickoff =
    e.strTimestamp ??
    (e.dateEvent && e.strTime ? `${e.dateEvent}T${e.strTime}` : e.dateEvent ?? null);
  return {
    provider: "thesportsdb",
    provider_id: e.idEvent,
    sport_code: sport,
    league: e.strLeague,
    league_id: e.idLeague,
    country_code: feedTag === "afghanistan" ? "AF" : null,
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
    feed_tag: feedTag,
    raw: e as unknown as Record<string, unknown>,
  };
}

/** Fetch one team/league event endpoint. Handles the two response shapes
 *  TheSportsDB uses: `{ results: [...] }` (eventslast) and `{ events: [...] }`
 *  (eventsnext / *league). Returns [] on any error or empty payload. */
async function fetchEvents(path: string): Promise<Event[]> {
  try {
    const res = await fetch(`${BASE}/${path}`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { events?: Event[] | null; results?: Event[] | null };
    return json.events ?? json.results ?? [];
  } catch {
    return [];
  }
}

export async function syncTheSportsDb(): Promise<SyncResult> {
  const supabase = createServiceClient();
  const byId = new Map<string, FixtureRow>();   // de-dupe across endpoints

  try {
    // --- Afghanistan teams ------------------------------------------------
    for (const team of AFGHANISTAN_TEAMS) {
      const last = await fetchEvents(`eventslast.php?id=${encodeURIComponent(team.id)}`);
      for (const e of last) byId.set(e.idEvent, toFixture(e, "afghanistan", team.sport));
      if (team.fetchNext) {
        const next = await fetchEvents(`eventsnext.php?id=${encodeURIComponent(team.id)}`);
        for (const e of next) byId.set(e.idEvent, toFixture(e, "afghanistan", team.sport));
      }
    }

    // --- World Cup 2026 ---------------------------------------------------
    const wcPast = await fetchEvents(`eventspastleague.php?id=${WORLD_CUP_2026_LEAGUE_ID}`);
    const wcNext = await fetchEvents(`eventsnextleague.php?id=${WORLD_CUP_2026_LEAGUE_ID}`);
    for (const e of [...wcPast, ...wcNext]) byId.set(e.idEvent, toFixture(e, "wc2026", "soccer"));

    const rows = Array.from(byId.values());
    if (rows.length === 0) {
      await supabase.from("external_sync_log").insert({
        provider: "thesportsdb", resource: "fixtures", status: "ok", records_upserted: 0,
      });
      return { ok: true, upserted: 0 };
    }

    const { error } = await supabase
      .from("external_fixtures")
      .upsert(rows, { onConflict: "provider,provider_id" });
    if (error) {
      await supabase.from("external_sync_log").insert({
        provider: "thesportsdb", resource: "fixtures", status: "error", error_message: error.message,
      });
      return { ok: false, status: "error", message: error.message };
    }

    await supabase.from("external_sync_log").insert({
      provider: "thesportsdb", resource: "fixtures", status: "ok", records_upserted: rows.length,
    });
    return { ok: true, upserted: rows.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("external_sync_log").insert({
      provider: "thesportsdb", resource: "fixtures", status: "error", error_message: msg,
    });
    return { ok: false, status: "error", message: msg };
  }
}

// Re-export NewsRow for type symmetry — TheSportsDB doesn't ship news here.
export type { FixtureRow, NewsRow };
