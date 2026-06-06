/**
 * Backfill wall_posts from existing content. Migration 023's wall triggers
 * aren't installed yet (URGENT_FIX only created the table), so we manually
 * populate the wall here so /feed has content right away.
 *
 * Idempotent: deletes existing wall_posts first, then re-inserts everything.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

console.log("Wiping existing wall_posts...");
await sb.from("wall_posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

const wallRows = [];

// REELS
console.log("Reading reels...");
{
  const { data } = await sb
    .from("reels")
    .select("id, author_id, caption, thumbnail_url, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(500);
  for (const r of data ?? []) {
    wallRows.push({
      actor_id: r.author_id,
      kind: "reel",
      target_type: "reel",
      target_id: r.id,
      title: r.caption ? r.caption.slice(0, 120) : "New reel",
      body: r.caption,
      image_url: r.thumbnail_url,
      link: `/reels/${r.id}`,
      created_at: r.created_at,
    });
  }
}

// EVENTS
console.log("Reading events...");
{
  const { data } = await sb
    .from("events")
    .select("id, organizer_id, title, description, banner_url, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(500);
  for (const e of data ?? []) {
    wallRows.push({
      actor_id: e.organizer_id,
      kind: "event",
      target_type: "event",
      target_id: e.id,
      title: e.title,
      body: e.description ? e.description.slice(0, 240) : null,
      image_url: e.banner_url,
      link: `/events/${e.id}`,
      created_at: e.created_at,
    });
  }
}

// NEWS
console.log("Reading news...");
{
  const { data } = await sb
    .from("news_posts")
    .select("id, author_id, title, slug, excerpt, image_url, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(500);
  for (const n of data ?? []) {
    wallRows.push({
      actor_id: n.author_id,
      kind: "news",
      target_type: "news_post",
      target_id: n.id,
      title: n.title,
      body: n.excerpt,
      image_url: n.image_url,
      link: `/news/${n.slug}`,
      created_at: n.published_at ?? new Date().toISOString(),
    });
  }
}

// POLLS
console.log("Reading polls...");
{
  const { data } = await sb
    .from("polls")
    .select("id, author_id, question, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(500);
  for (const p of data ?? []) {
    wallRows.push({
      actor_id: p.author_id,
      kind: "poll",
      target_type: "poll",
      target_id: p.id,
      title: p.question,
      body: "New community poll — cast your vote.",
      link: `/polls/${p.id}`,
      created_at: p.created_at,
    });
  }
}

// TOURNAMENTS (if any seeded)
console.log("Reading tournaments...");
{
  const { data } = await sb
    .from("tournaments")
    .select("id, slug, name, description, banner_url, created_at")
    .eq("is_published", true);
  for (const t of data ?? []) {
    wallRows.push({
      actor_id: null,
      kind: "tournament",
      target_type: "tournament",
      target_id: t.id,
      title: t.name,
      body: t.description ? t.description.slice(0, 240) : null,
      image_url: t.banner_url,
      link: `/tournaments/${t.slug}`,
      created_at: t.created_at,
    });
  }
}

// DISCUSSIONS
console.log("Reading discussions...");
{
  const { data } = await sb
    .from("discussions")
    .select("id, slug, title, body, author_id, created_at");
  for (const d of data ?? []) {
    wallRows.push({
      actor_id: d.author_id,
      kind: "discussion",
      target_type: "discussion",
      target_id: d.id,
      title: d.title,
      body: d.body ? d.body.slice(0, 240) : null,
      link: `/discussions/${d.slug}`,
      created_at: d.created_at,
    });
  }
}

// DISCUSSION REPLIES
console.log("Reading discussion replies...");
{
  const { data: replies } = await sb
    .from("discussion_replies")
    .select("id, discussion_id, author_id, body, created_at");
  const threadIds = [...new Set((replies ?? []).map((r) => r.discussion_id))];
  const { data: threads } = await sb
    .from("discussions")
    .select("id, slug, title")
    .in("id", threadIds);
  const tMap = new Map((threads ?? []).map((t) => [t.id, t]));
  for (const r of replies ?? []) {
    const t = tMap.get(r.discussion_id);
    if (!t) continue;
    wallRows.push({
      actor_id: r.author_id,
      kind: "discussion_reply",
      target_type: "discussion",
      target_id: r.discussion_id,
      title: `Replied to: ${t.title}`,
      body: r.body.slice(0, 240),
      link: `/discussions/${t.slug}`,
      created_at: r.created_at,
    });
  }
}

// CONFIRMED MATCHES
console.log("Reading match results...");
{
  const { data: matches } = await sb
    .from("matches")
    .select("id, home_team_id, away_team_id, home_score, away_score, played_at, venue")
    .eq("status", "confirmed")
    .order("played_at", { ascending: false })
    .limit(200);
  const teamIds = new Set();
  for (const m of matches ?? []) { teamIds.add(m.home_team_id); teamIds.add(m.away_team_id); }
  const { data: teams } = await sb.from("teams").select("id, name").in("id", [...teamIds]);
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t.name]));
  for (const m of matches ?? []) {
    const home = teamMap.get(m.home_team_id) ?? "Home";
    const away = teamMap.get(m.away_team_id) ?? "Away";
    wallRows.push({
      actor_id: null,
      kind: "match_result",
      target_type: "match",
      target_id: m.id,
      title: `Result: ${home} ${m.home_score} – ${m.away_score} ${away}`,
      body: m.venue ? `Played at ${m.venue}` : null,
      link: `/matches/${m.id}`,
      created_at: m.played_at ?? new Date().toISOString(),
    });
  }
}

// USER JOINED (for the 10 most recent profiles)
console.log("Reading recent profiles...");
{
  const { data } = await sb
    .from("profiles")
    .select("id, username, full_name, avatar_url, city, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  for (const p of data ?? []) {
    if (!p.username) continue;
    wallRows.push({
      actor_id: p.id,
      kind: "user_joined",
      target_type: "profile",
      target_id: p.id,
      title: `${p.full_name ?? p.username} joined ASF`,
      body: p.city ? `From ${p.city}` : null,
      image_url: p.avatar_url,
      link: `/profile/${p.username}`,
      created_at: p.created_at,
    });
  }
}

// TEAM CREATED (for the most recent teams)
console.log("Reading recent teams...");
{
  const { data } = await sb
    .from("teams")
    .select("id, slug, name, captain_id, logo_url, city, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  for (const t of data ?? []) {
    wallRows.push({
      actor_id: t.captain_id,
      kind: "team_created",
      target_type: "team",
      target_id: t.id,
      title: `New team: ${t.name}`,
      body: t.city ? `Based in ${t.city}` : null,
      image_url: t.logo_url,
      link: `/teams/${t.slug}`,
      created_at: t.created_at,
    });
  }
}

// Insert in chunks
console.log(`\nInserting ${wallRows.length} wall posts...`);
const CHUNK = 200;
let ok = 0;
for (let i = 0; i < wallRows.length; i += CHUNK) {
  const slice = wallRows.slice(i, i + CHUNK);
  const { error } = await sb.from("wall_posts").insert(slice);
  if (error) console.warn(`  ! batch ${i}: ${error.message}`);
  else ok += slice.length;
}
console.log(`✓ ${ok} wall posts inserted.`);

const { count } = await sb.from("wall_posts").select("*", { count: "exact", head: true });
console.log(`Final wall_posts count: ${count}`);
