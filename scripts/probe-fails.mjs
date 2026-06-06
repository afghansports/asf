import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: u } = await sb.from("profiles").select("id").limit(1).maybeSingle();
const { data: reel } = await sb.from("reels").select("id").limit(1).maybeSingle();

// 1. Tournament
const t = await sb.from("tournaments").insert({
  slug: "probe-tournament-" + Date.now(),
  name: "Probe",
  sport: "soccer",
  format: "round_robin",
  start_date: "2026-06-01",
  end_date: "2026-06-02",
  city: "Test",
  country_code: "US",
  status: "announced",
  is_published: true,
}).select("id").maybeSingle();
console.log("tournament:", t.error ? `${t.error.code}: ${t.error.message}` : "OK");
if (t.data?.id) await sb.from("tournaments").delete().eq("id", t.data.id);

// 2. Reel comment
if (reel?.id && u?.id) {
  const c = await sb.from("reel_comments").insert({
    reel_id: reel.id,
    author_id: u.id,
    body: "probe",
  }).select("id").maybeSingle();
  console.log("reel_comment:", c.error ? `${c.error.code}: ${c.error.message}` : "OK");
  if (c.data?.id) await sb.from("reel_comments").delete().eq("id", c.data.id);
}
