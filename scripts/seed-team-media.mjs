/**
 * Backfill team logos + banners for all existing teams that don't have them.
 * Uses CC0 photos from Unsplash (sport-themed) and pravatar.cc emblem-style
 * placeholders. Admin can replace with their own uploads from /admin/teams.
 *
 * Idempotent — only updates rows missing a logo or banner.
 *
 * Run:  node scripts/seed-team-media.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// Per-sport banner photos. Each sport gets multiple shots to avoid every team
// looking identical.
const BANNERS_BY_SPORT = {
  soccer: [
    "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80",
  ],
  futsal: [
    "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80",
  ],
  basketball: [
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=1600&q=80",
  ],
  volleyball: [
    "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1607627000458-210e8d2bdb1d?auto=format&fit=crop&w=1600&q=80",
  ],
  cricket: [
    "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1600&q=80",
  ],
  tennis: [
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1600&q=80",
  ],
  table_tennis: [
    "https://images.unsplash.com/photo-1611251135345-18c56206b863?auto=format&fit=crop&w=1600&q=80",
  ],
  badminton: [
    "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1600&q=80",
  ],
  bowling: [
    "https://images.unsplash.com/photo-1538154298815-39db82edca77?auto=format&fit=crop&w=1600&q=80",
  ],
};
const DEFAULT_BANNER = "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1600&q=80";

// Team logo style — sport-themed emblem images from DiceBear (free, CDN-hosted,
// deterministic per seed). These look like proper team badges, not letters.
function logoFor(slug, sport) {
  // DiceBear "shapes" gives geometric badges that look team-like.
  return `https://api.dicebear.com/7.x/shapes/png?seed=${encodeURIComponent(slug)}&backgroundType=gradientLinear&backgroundRotation=45,90,135&size=200`;
}

function pickFor(sport, seed) {
  const bank = BANNERS_BY_SPORT[sport] ?? [DEFAULT_BANNER];
  // deterministic pick so the same team always gets the same banner
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return bank[h % bank.length];
}

async function main() {
  const { data: teams, error } = await sb
    .from("teams")
    .select("id, slug, name, sport, logo_url, banner_url")
    .order("created_at", { ascending: true });
  if (error) { console.error(error); process.exit(1); }
  if (!teams || teams.length === 0) { console.log("No teams found."); return; }

  let updated = 0;
  for (const t of teams) {
    const updates = {};
    if (!t.logo_url)   updates.logo_url   = logoFor(t.slug, t.sport);
    if (!t.banner_url) updates.banner_url = pickFor(t.sport, t.slug);
    if (Object.keys(updates).length === 0) continue;

    const { error: upErr } = await sb.from("teams").update(updates).eq("id", t.id);
    if (upErr) { console.warn(`! ${t.slug}: ${upErr.message}`); continue; }
    updated++;
  }
  console.log(`✓ Updated media on ${updated} / ${teams.length} teams.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
