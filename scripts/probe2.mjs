import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

for (const t of ["wall_posts","discussions","feature_flags","federations","sports","reels","tournaments","team_followers"]) {
  const { data, error } = await sb.from(t).select("*").limit(1);
  if (error) console.log(`${t.padEnd(20)} ERR ${error.code}: ${error.message}`);
  else console.log(`${t.padEnd(20)} OK rows=${data?.length ?? "?"}`);
}

console.log("\nTry insert into reels:");
const { data: u } = await sb.from("profiles").select("id").limit(1).maybeSingle();
const { error } = await sb.from("reels").insert({
  author_id: u?.id,
  video_url: "https://test.example/video.mp4",
  thumbnail_url: null,
  caption: "probe",
  sport: "soccer",
  country_code: "US",
  is_published: true,
  video_kind: "file",
  processing_state: "ready",
});
console.log("reels insert:", error ? `ERR ${error.code}: ${error.message}` : "OK");
