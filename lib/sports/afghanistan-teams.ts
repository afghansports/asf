/**
 * Curated TheSportsDB team IDs for Afghanistan-connected sport, plus the FIFA
 * World Cup 2026 league. Verified live against the free public key ("3") on
 * 2026-06-06 — see search_all_teams.php?c=Afghanistan and league 4429.
 *
 * National teams pull both upcoming fixtures and recent results; domestic
 * franchises (Shpageeza / Afghanistan Premier League cricket) pull results
 * only, to stay well within the free-tier rate limit.
 */

export type AfgTeam = {
  id: string;
  sport: string;   // sport_code (matches public.sports.code)
  label: string;
  fetchNext: boolean;
};

export const AFGHANISTAN_TEAMS: AfgTeam[] = [
  // National teams
  { id: "140156", sport: "soccer",  label: "Afghanistan",         fetchNext: true },
  { id: "149431", sport: "soccer",  label: "Afghanistan U23",     fetchNext: true },
  { id: "137147", sport: "cricket", label: "Afghanistan Cricket", fetchNext: true },
  // Afghan domestic cricket franchises (results only)
  { id: "146014", sport: "cricket", label: "Boost Defenders",     fetchNext: false },
  { id: "146015", sport: "cricket", label: "Balkh Legends",       fetchNext: false },
  { id: "146018", sport: "cricket", label: "Kabul Zwanan",        fetchNext: false },
  { id: "146029", sport: "cricket", label: "Speenghar Tigers",    fetchNext: false },
  { id: "150085", sport: "cricket", label: "Amo Sharks",          fetchNext: false },
  { id: "150086", sport: "cricket", label: "Band-e-Amir Dragons", fetchNext: false },
  { id: "150087", sport: "cricket", label: "Mis Ainak Knights",   fetchNext: false },
];

/** TheSportsDB league "FIFA World Cup" (strCurrentSeason 2026). */
export const WORLD_CUP_2026_LEAGUE_ID = "4429";
