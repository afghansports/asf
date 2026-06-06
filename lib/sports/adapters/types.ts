/**
 * Shared adapter types. Every adapter normalizes its provider's payload to
 * these shapes before writing to the cache tables.
 */

export type FixtureRow = {
  provider: string;
  provider_id: string;
  sport_code: string;
  league: string | null;
  league_id: string | null;
  country_code: string | null;
  season: string | null;
  kickoff: string | null;        // ISO timestamp
  status: "scheduled" | "live" | "final" | "postponed" | "cancelled";
  home_name: string;
  home_logo_url: string | null;
  home_score: number | null;
  away_name: string;
  away_logo_url: string | null;
  away_score: number | null;
  venue: string | null;
  notes: string | null;
  raw: Record<string, unknown>;
};

export type StandingRow = {
  provider: string;
  provider_id: string;
  sport_code: string;
  league_id: string;
  league_name: string | null;
  season: string | null;
  position: number;
  team_name: string;
  team_logo_url: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  raw: Record<string, unknown>;
};

export type NewsRow = {
  provider: string;
  provider_id: string;
  sport_code: string | null;
  title: string;
  summary: string | null;
  url: string;
  image_url: string | null;
  source_name: string | null;
  published_at: string | null;
  language: string;
};

export type SyncResult =
  | { ok: true; upserted: number }
  | { ok: false; status: "rate-limited" | "error"; message: string };
