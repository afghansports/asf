/**
 * ESPN public RSS feeds. Free, no key, no rate limit reasonable use.
 *
 * Feed catalog: https://www.espn.com/espn/news/story?id=2625842
 *
 * We pull headline RSS per sport, normalize to NewsRow, and upsert.
 */

import type { NewsRow, SyncResult } from "./types";
import { createServiceClient } from "@/lib/supabase/server";

type Feed = { url: string; sport: string; source: string };

const FEEDS: Feed[] = [
  { url: "https://www.espn.com/espn/rss/soccer/news",     sport: "soccer",     source: "ESPN Soccer" },
  { url: "https://www.espn.com/espn/rss/nba/news",        sport: "basketball", source: "ESPN NBA" },
  { url: "https://www.espn.com/espn/rss/cricinfo/news",   sport: "cricket",    source: "ESPN Cricket" },
  { url: "https://www.espn.com/espn/rss/tennis/news",     sport: "tennis",     source: "ESPN Tennis" },
  { url: "https://www.espn.com/espn/rss/news",            sport: "",           source: "ESPN" },
];

/** Tiny RSS parser — avoids pulling a full XML library. Handles the subset
 *  ESPN actually emits: <item> with <title>, <link>, <description>, <pubDate>,
 *  optional <media:thumbnail url="..."/>. */
function parseRss(xml: string): {
  guid?: string;
  title: string;
  link: string;
  summary: string | null;
  pubDate: string | null;
  imageUrl: string | null;
}[] {
  const out: ReturnType<typeof parseRss> = [];
  const itemRegex = /<item[\s\S]*?<\/item>/g;
  const items = xml.match(itemRegex) ?? [];
  for (const raw of items) {
    const get = (tag: string) => {
      const m = raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      if (!m) return null;
      return m[1]
        .replace(/<!\[CDATA\[/g, "")
        .replace(/\]\]>/g, "")
        .trim();
    };
    const title = get("title");
    const link = get("link");
    if (!title || !link) continue;
    const pubDate = get("pubDate");
    const summary = get("description");
    const guid = get("guid") ?? link;
    const thumbMatch = raw.match(/<media:thumbnail[^>]+url="([^"]+)"/);
    const imageUrl = thumbMatch ? thumbMatch[1] : null;
    out.push({ guid, title, link, summary, pubDate, imageUrl });
  }
  return out;
}

async function fetchFeed(feed: Feed): Promise<NewsRow[]> {
  try {
    const res = await fetch(feed.url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseRss(xml);
    return items.map((it) => ({
      provider: "espn-rss",
      provider_id: it.guid ?? it.link,
      sport_code: feed.sport || null,
      title: it.title,
      summary: it.summary,
      url: it.link,
      image_url: it.imageUrl,
      source_name: feed.source,
      published_at: it.pubDate ? new Date(it.pubDate).toISOString() : null,
      language: "en",
    }));
  } catch {
    return [];
  }
}

export async function syncEspnRss(): Promise<SyncResult> {
  const supabase = createServiceClient();
  let upserted = 0;
  try {
    for (const feed of FEEDS) {
      const rows = await fetchFeed(feed);
      if (rows.length === 0) continue;
      const { error } = await supabase
        .from("external_news")
        .upsert(rows, { onConflict: "provider,provider_id" });
      if (error) return { ok: false, status: "error", message: error.message };
      upserted += rows.length;
    }
    await supabase.from("external_sync_log").insert({
      provider: "espn-rss",
      resource: "news",
      status: "ok",
      records_upserted: upserted,
    });
    return { ok: true, upserted };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("external_sync_log").insert({
      provider: "espn-rss",
      resource: "news",
      status: "error",
      error_message: msg,
    });
    return { ok: false, status: "error", message: msg };
  }
}
