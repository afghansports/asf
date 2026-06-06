/**
 * Projects cached external sport (Afghanistan + World Cup 2026) into the
 * activity wall. Run daily from /api/cron/sports-wall.
 *
 * Balance: the wall is kept ~50/50 Afghanistan vs world (World Cup) — for
 * however many Afghanistan items we have (up to a cap), we take the same number
 * of world items, so World Cup volume never drowns out Afghanistan. Within each
 * side, items that carry an image are preferred so posts look complete.
 *
 * De-duplication is guaranteed by `wall_posts.dedupe_key` + its unique index:
 *  - fixtures → `fixture:{provider}:{id}:{scheduled|final}`
 *  - news     → `news:{contentKey(title)}`
 * The insert uses ON CONFLICT DO NOTHING, so re-running never double-posts.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/features/flags";
import { contentKey } from "./normalize";

const NEWS_PER_SIDE = 12;
const FIXTURES_PER_SIDE = 8;

type WallInsert = {
  actor_id: null;
  kind: "external_fixture" | "external_news";
  target_type: string;
  target_id: null;
  title: string;
  body: string | null;
  image_url: string | null;
  link: string;
  dedupe_key: string;
};

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Take an equal number from each side (Afghanistan drives the count; world
 * matches it). If there's no Afghanistan content, fall back to up to `cap`
 * world items so the wall isn't empty. Returns the two sides interleaved.
 */
function balance<T>(afg: T[], world: T[], cap: number): T[] {
  const a = afg.slice(0, cap);
  const w = world.slice(0, a.length > 0 ? a.length : cap);
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, w.length); i++) {
    if (i < a.length) out.push(a[i]);
    if (i < w.length) out.push(w[i]);
  }
  return out;
}

/** Interleave two lists 1:1 (a, b, a, b, …), appending the longer tail. */
function mix<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

export type ProjectReport = {
  ok: boolean;
  inserted?: number;
  candidates?: number;
  message?: string;
};

export async function projectToWall(): Promise<ProjectReport> {
  if (!(await isFeatureEnabled("module.external_sports"))) {
    return { ok: true, inserted: 0 };
  }

  const supabase = createServiceClient();
  const now = Date.now();
  const past = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
  const future = new Date(now + 21 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: fixtures } = await supabase
      .from("external_fixtures")
      .select(
        "provider, provider_id, feed_tag, league, kickoff, status, home_name, home_score, home_logo_url, away_name, away_score, away_logo_url, venue",
      )
      .not("feed_tag", "is", null)
      .gte("kickoff", past)
      .lte("kickoff", future)
      .order("kickoff", { ascending: false })
      .limit(120);

    const { data: news } = await supabase
      .from("external_news")
      .select("feed_tag, title, summary, url, image_url, source_name, published_at, language")
      .not("feed_tag", "is", null)
      .order("published_at", { ascending: false })
      .limit(160);

    // Prefer the most complete posts: image + body first, then image, then body.
    const newsScore = (x: { image_url: string | null; summary: string | null }) =>
      (x.image_url ? 0 : 1) + (x.summary ? 0 : 1);
    const fxImg = (x: { home_logo_url: string | null; away_logo_url: string | null }) =>
      x.home_logo_url || x.away_logo_url ? 0 : 1;

    const fxAfg = (fixtures ?? []).filter((f) => f.feed_tag === "afghanistan").sort((a, b) => fxImg(a) - fxImg(b));
    const fxWorld = (fixtures ?? []).filter((f) => f.feed_tag === "wc2026").sort((a, b) => fxImg(a) - fxImg(b));

    // Afghanistan news: interleave native Dari/Pashto with English so the
    // native-language items always make the cut (they carry no image, so a
    // pure completeness sort would bury them).
    const afgAll = (news ?? []).filter((n) => n.feed_tag === "afghanistan");
    const afgEn = afgAll.filter((n) => n.language === "en").sort((a, b) => newsScore(a) - newsScore(b));
    const afgNative = afgAll.filter((n) => n.language !== "en").sort((a, b) => newsScore(a) - newsScore(b));
    const newsAfg = mix(afgNative, afgEn);
    const newsWorld = (news ?? []).filter((n) => n.feed_tag === "wc2026").sort((a, b) => newsScore(a) - newsScore(b));

    const chosenFixtures = balance(fxAfg, fxWorld, FIXTURES_PER_SIDE);
    const chosenNews = balance(newsAfg, newsWorld, NEWS_PER_SIDE);

    const byKey = new Map<string, WallInsert>();

    for (const f of chosenFixtures) {
      const isFinal = f.status === "final" || (f.home_score != null && f.away_score != null);
      const bucket = isFinal ? "final" : "scheduled";
      const dedupe_key = `fixture:${f.provider}:${f.provider_id}:${bucket}`;
      const score = isFinal
        ? `${f.home_name} ${f.home_score ?? "?"}–${f.away_score ?? "?"} ${f.away_name}`
        : `${f.home_name} vs ${f.away_name}`;
      const bodyBits = [f.league, fmtDate(f.kickoff), f.venue].filter(Boolean);
      // Link to the real match page on TheSportsDB; football-data fixtures have
      // no public page, so those fall back to the internal scores hub.
      const link =
        f.provider === "thesportsdb"
          ? `https://www.thesportsdb.com/event/${f.provider_id}`
          : "/scores";
      byKey.set(dedupe_key, {
        actor_id: null,
        kind: "external_fixture",
        target_type: "external_fixture",
        target_id: null,
        title: `${isFinal ? "Result" : "Upcoming"}: ${score}`,
        body: bodyBits.length ? bodyBits.join(" · ") : null,
        image_url: f.home_logo_url ?? f.away_logo_url ?? null,
        link,
        dedupe_key,
      });
    }

    for (const n of chosenNews) {
      const key = contentKey(n.title);
      if (!key) continue;
      const dedupe_key = `news:${key}`;
      if (byKey.has(dedupe_key)) continue;
      byKey.set(dedupe_key, {
        actor_id: null,
        kind: "external_news",
        target_type: "external_news",
        target_id: null,
        title: n.title,
        body: n.summary,
        image_url: n.image_url,
        link: n.url,
        dedupe_key,
      });
    }

    const rows = Array.from(byKey.values());
    if (rows.length === 0) return { ok: true, inserted: 0, candidates: 0 };

    const { error, count } = await supabase
      .from("wall_posts")
      .upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true, count: "exact" });
    if (error) return { ok: false, message: error.message };

    return { ok: true, inserted: count ?? 0, candidates: rows.length };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
