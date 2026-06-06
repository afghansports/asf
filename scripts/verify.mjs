/**
 * Verifier — sanity-check the database state after migrations.
 * Lists every important table with its row count and flags anything that's
 * empty when it shouldn't be.
 *
 *   node scripts/verify.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// `expected` = minimum row count after migrations. 0 means "table optional".
const TABLES = [
  ["profiles",                  0],
  ["teams",                     0],
  ["team_members",              0],
  ["team_followers",            0],
  ["events",                    8],
  ["news_posts",                5],
  ["sponsors",                  6],
  ["gallery_images",            6],
  ["chapters",                 12],
  ["clubs",                     5],
  ["club_members",              0],
  ["club_followers",            0],
  ["federations",               1],
  ["federation_followers",      0],
  ["feature_flags",            45],
  ["sports",                   13],
  ["sport_positions",          28],
  ["sport_stats",              23],
  ["sport_match_formats",      13],
  ["sport_match_event_types",   0],
  ["match_events",              0],
  ["reels",                     6],
  ["polls",                     3],
  ["matches",                   4],
  ["tournaments",               4],
  ["external_fixtures",         0],
  ["external_standings",        0],
  ["external_news",             0],
  ["external_sync_log",         0],
  ["push_subscriptions",        0],
  ["push_deliveries",           0],
  ["hashtags",                  0],
  ["hashtag_follows",           0],
  ["achievements",             10],
  ["user_achievements",         0],
  ["player_stats",              0],
  ["profile_roles",             0],
  ["notifications",             0],
  ["bookmarks",                 0],
  ["dm_conversations",          0],
];

console.log("Table".padEnd(28), "Rows".padStart(6), " Status");
console.log("-".repeat(50));
let problems = 0;
for (const [t, expected] of TABLES) {
  const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
  let status;
  if (error) {
    status = `MISSING (${error.code ?? "?"})`;
    problems++;
  } else if (expected > 0 && (count ?? 0) < expected) {
    status = `THIN (expected ≥ ${expected})`;
    problems++;
  } else {
    status = "ok";
  }
  console.log(t.padEnd(28), String(count ?? "-").padStart(6), " " + status);
}
console.log("-".repeat(50));
if (problems === 0) {
  console.log("\n✓ All systems green.");
} else {
  console.log(`\n${problems} problem(s) — re-run COMBINED_015_to_021.sql in Supabase SQL editor.`);
}
