import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SPORTS = ["soccer","futsal","basketball","volleyball","cricket","tennis"];
const FORMATS = ["round_robin","single_elimination","double_elimination","group_then_knockout"];
const NAMES = [
  "Spring Soccer Cup","Summer Classic","Autumn Volleyball Open","Winter Indoor League",
  "Youth Cup","Women's Championship","Diaspora Trophy","International Friendly Cup",
  "Cricket T20 League","Bay Area Showdown","Toronto Open","London Invitational",
  "Hamburg Derby Series","Sydney Showdown","ASF Champions League","Afghan Cup 2026",
];
const CITIES = ["Fremont","Toronto","Hamburg","London","Sydney","Fairfax","Berlin","Vancouver","Manchester"];
const IMAGES = [
  "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
];
function rand(a){return a[Math.floor(Math.random()*a.length)];}
function ri(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function slug(s){return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60);}

let count = 0;
for (let i = 0; i < 14; i++) {
  const name = NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${i+1}` : "");
  const s = new Date();
  s.setDate(s.getDate() + ri(-15, 120));
  const e = new Date(s.getTime() + ri(1, 3) * 24 * 60 * 60 * 1000);
  const { error } = await sb.from("tournaments").insert({
    slug: slug(`${name}-${Date.now()}-${i}`),
    name,
    sport: rand(SPORTS),
    format: rand(FORMATS),
    start_date: s.toISOString().slice(0, 10),
    end_date: e.toISOString().slice(0, 10),
    city: rand(CITIES),
    banner_url: rand(IMAGES),
    status: s < new Date() ? "in_progress" : rand(["announced","registration"]),
    description: `${name}. Open to ASF-affiliated teams. ${rand(FORMATS).replace(/_/g," ")} format.`,
    is_published: true,
    is_featured: Math.random() < 0.25,
  });
  if (!error) count++;
  else console.warn(`  ! ${name}: ${error.message}`);
}
console.log(`✓ ${count} tournaments inserted.`);

// Also write wall posts for them
const { data: tournaments } = await sb.from("tournaments").select("id, slug, name, description, banner_url, created_at").eq("is_published", true);
const wallRows = (tournaments ?? []).map((t) => ({
  actor_id: null, kind: "tournament", target_type: "tournament", target_id: t.id,
  title: t.name, body: t.description ? t.description.slice(0, 240) : null,
  image_url: t.banner_url, link: `/tournaments/${t.slug}`, created_at: t.created_at,
}));
if (wallRows.length) {
  await sb.from("wall_posts").insert(wallRows);
  console.log(`✓ ${wallRows.length} tournament wall posts added.`);
}
