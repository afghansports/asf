/**
 * Projects cached external sport (Afghanistan + World Cup 2026) into the
 * activity wall. Run daily from /api/cron/sports-wall.
 *
 * De-duplication is guaranteed by `wall_posts.dedupe_key` + its unique index:
 *  - fixtures → `fixture:{provider}:{id}:{scheduled|final}` (one upcoming + one
 *    result post per match at most)
 *  - news     → `news:{contentKey(title)}` (same story from two feeds collapses)
 * The insert uses ON CONFLICT DO NOTHING, so re-running never double-posts.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/features/flags";
import { contentKey } from "./normalize";

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
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type ProjectReport = { ok: boolean; inserted?: number; message?: string };

export async function projectToWall(): Promise<ProjectReport> {
  if (!(await isFeatureEnabled("module.external_sports"))) {
    return { ok: true, inserted: 0 };
  }

  const supabase = createServiceClient();
  const now = Date.now();
  const past = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
  const future = new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString();

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
      .limit(60);

    const { data: news } = await supabase
      .from("external_news")
      .select("feed_tag, title, summary, url, image_url, source_name, published_at")
      .not("feed_tag", "is", null)
      .order("published_at", { ascending: false })
      .limit(40);

    const byKey = new Map<string, WallInsert>();

    for (const f of fixtures ?? []) {
      const isFinal =
        f.status === "final" || (f.home_score != null && f.away_score != null);
      const bucket = isFinal ? "final" : "scheduled";
      const dedupe_key = `fixture:${f.provider}:${f.provider_id}:${bucket}`;
      const score = isFinal
        ? `${f.home_name} ${f.home_score ?? "?"}–${f.away_score ?? "?"} ${f.away_name}`
        : `${f.home_name} vs ${f.away_name}`;
      const bodyBits = [f.league, fmtDate(f.kickoff), f.venue].filter(Boolean);
      byKey.set(dedupe_key, {
        actor_id: null,
        kind: "external_fixture",
        target_type: "external_fixture",
        target_id: null,
        title: `${isFinal ? "Result" : "Upcoming"}: ${score}`,
        body: bodyBits.length ? bodyBits.join(" · ") : null,
        image_url: f.home_logo_url ?? f.away_logo_url ?? null,
        link: "/scores",
        dedupe_key,
      });
    }

    for (const n of news ?? []) {
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
        body: n.summary ?? n.source_name ?? null,
        image_url: n.image_url,
        link: n.url,
        dedupe_key,
      });
    }

    const rows = Array.from(byKey.values());
    if (rows.length === 0) return { ok: true, inserted: 0 };

    // ON CONFLICT (dedupe_key) DO NOTHING — never double-posts across runs.
    const { error, count } = await supabase
      .from("wall_posts")
      .upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true, count: "exact" });
    if (error) return { ok: false, message: error.message };

    return { ok: true, inserted: count ?? 0 };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
