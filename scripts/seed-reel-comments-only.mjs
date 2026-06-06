import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const COMMENTS = [
  "Filthy strike, mate. What a connection.",
  "Did anyone clip the assist? That run was unreal.",
  "Need that warm-up routine for our team.",
  "+1 — when's the next session?",
  "Best touch I've seen all season.",
  "Coach, can we do this drill on Sunday?",
  "Bay Area, when are we doing this again?",
  "Forwarded to my U-16 squad — they need to see this.",
  "Bro is built different.",
  "Sets up the volley perfectly.",
  "Body shape on the keeper saving the penalty — chef's kiss.",
  "How long was that rally?? Insane.",
  "More clips from this match please.",
  "Posted to our chapter group, hope you don't mind.",
  "Goal of the season nominee.",
  "What's the playlist intro song?",
  "Toronto chapter representing 🔥",
  "Add me to the lineup next time.",
  "Watching this on repeat.",
  "Pelé bicycle kick energy.",
  "Worth the rewatch.",
  "Mids are eating today.",
  "Defense was sleeping.",
  "Underrated keeper.",
];

const { data: reels } = await sb.from("reels").select("id").limit(150);
const { data: users } = await sb.from("profiles").select("id");
if (!reels?.length || !users?.length) {
  console.error("Need reels + users first.");
  process.exit(1);
}
function rand(a) { return a[Math.floor(Math.random() * a.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

let count = 0;
const TARGET = 250;
for (let i = 0; i < TARGET; i++) {
  const r = rand(reels);
  const u = rand(users);
  const daysAgo = randInt(0, 30);
  const created = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await sb.from("reel_comments").insert({
    reel_id: r.id,
    author_id: u.id,
    body: rand(COMMENTS),
    created_at: created,
  });
  if (!error) count++;
  else if (i === 0) console.warn(`  ! first error: ${error.message}`);
}
console.log(`✓ ${count} / ${TARGET} reel comments inserted.`);

const { count: total } = await sb.from("reel_comments").select("*", { count: "exact", head: true });
console.log(`Total reel_comments: ${total}`);
