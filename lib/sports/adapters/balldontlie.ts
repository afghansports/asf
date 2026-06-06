/**
 * BallDontLie adapter — NBA basketball data.
 *
 * Free tier: no key required, ~60 req/min from a single IP. We pull recent
 * games + standings.
 *
 * Docs: https://www.balldontlie.io/
 */

import type { FixtureRow, StandingRow, SyncResult } from "./types";
import { createServiceClient } from "@/lib/supabase/server";

const BASE = "https://www.balldontlie.io/api/v1";

type Game = {
  id: number;
  date: string;
  home_team: { id: number; full_name: string; abbreviation: string };
  visitor_team: { id: number; full_name: string; abbreviation: string };
  home_team_score: number;
  visitor_team_score: number;
  status: string;
  season: number;
  postseason: boolean;
};

async function fetchRecentGames(): Promise<Game[]> {
  // Last 7 days of games
  const today = new Date();
  const start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const params = new URLSearchParams({
    "start_date": fmt(start),
    "end_date": fmt(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)),
    per_page: "100",
  });
  try {
    const res = await fetch(`${BASE}/games?${params.toString()}`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Game[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

function statusOf(g: Game): FixtureRow["status"] {
  const s = (g.status ?? "").toLowerCase();
  if (s.includes("final")) return "final";
  if (s.match(/\d+:\d+/)) return "live";          // ESPN-like clock string
  if (s.includes("postpone")) return "postponed";
  return "scheduled";
}

function toFixture(g: Game): FixtureRow {
  return {
    provider: "balldontlie",
    provider_id: String(g.id),
    sport_code: "basketball",
    league: "NBA",
    league_id: "nba",
    country_code: "US",
    season: String(g.season),
    kickoff: g.date,
    status: statusOf(g),
    home_name: g.home_team.full_name,
    home_logo_url: null,
    home_score: g.home_team_score,
    away_name: g.visitor_team.full_name,
    away_logo_url: null,
    away_score: g.visitor_team_score,
    venue: null,
    notes: g.postseason ? "Postseason" : null,
    raw: g as unknown as Record<string, unknown>,
  };
}

export async function syncBallDontLie(): Promise<SyncResult> {
  const supabase = createServiceClient();
  try {
    const games = await fetchRecentGames();
    if (games.length === 0) return { ok: true, upserted: 0 };
    const rows = games.map(toFixture);
    const { error } = await supabase
      .from("external_fixtures")
      .upsert(rows, { onConflict: "provider,provider_id" });
    if (error) return { ok: false, status: "error", message: error.message };
    await supabase.from("external_sync_log").insert({
      provider: "balldontlie",
      resource: "fixtures",
      status: "ok",
      records_upserted: rows.length,
    });
    return { ok: true, upserted: rows.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("external_sync_log").insert({
      provider: "balldontlie",
      resource: "fixtures",
      status: "error",
      error_message: msg,
    });
    return { ok: false, status: "error", message: msg };
  }
}

export type { StandingRow };
