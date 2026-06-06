import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const TABLES = [
  "reels","discussions","discussion_replies","wall_posts","feature_flags",
  "federations","clubs","sports","team_followers","poll_options","poll_votes",
  "external_fixtures","external_news","tournaments","matches",
];
console.log("TABLES:");
for (const t of TABLES) {
  const { error, count } = await sb.from(t).select("*", { count: "exact" }).limit(1);
  if (error) console.log(`  ${t.padEnd(22)} MISSING (${error.code})`);
  else console.log(`  ${t.padEnd(22)} ok  rows=${count ?? 0}`);
}

console.log("\nREELS COLUMNS (probe insert without optional fields):");
const { data: u } = await sb.from("profiles").select("id").limit(1).maybeSingle();
const r1 = await sb.from("reels").insert({
  author_id: u?.id,
  video_url: "https://example.com/probe.mp4",
  caption: "probe",
  sport: "soccer",
  country_code: "US",
  is_published: true,
}).select("id").maybeSingle();
console.log("  bare insert:", r1.error ? `ERR ${r1.error.code}: ${r1.error.message}` : `OK id=${r1.data?.id}`);
if (r1.data?.id) await sb.from("reels").delete().eq("id", r1.data.id);
