/**
 * RSS news adapter — Afghanistan sport + FIFA World Cup 2026, from free,
 * keyless feeds:
 *
 *   - Google News RSS search (Afghanistan, all sports)   → feed_tag afghanistan
 *   - Google News RSS search (FIFA World Cup 2026)        → feed_tag wc2026
 *   - ESPN Cricinfo RSS, filtered to Afghanistan mentions → feed_tag afghanistan
 *
 * Same-story duplicates across feeds are collapsed by content fingerprint
 * (see lib/sports/normalize.ts) before they reach the cache; the wall
 * projection enforces the final no-duplicates guarantee via dedupe_key.
 */

import type { NewsRow, SyncResult } from "./types";
import { createServiceClient } from "@/lib/supabase/server";
import { contentKey } from "../normalize";

type Feed = {
  url: string;
  provider: string;
  source: string;
  feed_tag: "afghanistan" | "wc2026";
  sport: string | null;
  afghanOnly?: boolean;   // keep only items that mention Afghanistan
};

const gnews = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

const FEEDS: Feed[] = [
  {
    url: gnews(
      "Afghanistan (sport OR cricket OR football OR taekwondo OR wrestling OR athletics OR cycling OR boxing OR volleyball OR futsal) when:14d",
    ),
    provider: "google-news",
    source: "Google News",
    feed_tag: "afghanistan",
    sport: null,
  },
  {
    url: gnews('("FIFA World Cup 2026" OR "World Cup 2026") when:14d'),
    provider: "google-news",
    source: "Google News",
    feed_tag: "wc2026",
    sport: "soccer",
  },
  {
    url: "https://www.espn.com/espn/rss/cricinfo/news",
    provider: "espn-rss",
    source: "ESPN Cricinfo",
    feed_tag: "afghanistan",
    sport: "cricket",
    afghanOnly: true,
  },
];

type Item = {
  guid: string;
  title: string;
  link: string;
  summary: string | null;
  pubDate: string | null;
  imageUrl: string | null;
};

/** Minimal RSS parser — handles the subset Google News + ESPN emit: <item>
 *  with <title>, <link>, <guid>, <description>, <pubDate>, optional
 *  <media:thumbnail url="…">. Avoids pulling a full XML dependency. */
function parseRss(xml: string): Item[] {
  const out: Item[] = [];
  const items = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
  for (const raw of items) {
    const get = (tag: string) => {
      const m = raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      if (!m) return null;
      return m[1].replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim();
    };
    const title = get("title");
    const link = get("link");
    if (!title || !link) continue;
    const rawSummary = get("description");
    const summary = rawSummary
      ? rawSummary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280) || null
      : null;
    const thumb = raw.match(/<media:thumbnail[^>]+url="([^"]+)"/);
    out.push({
      guid: get("guid") ?? link,
      title: title.replace(/<[^>]+>/g, "").trim(),
      link,
      summary,
      pubDate: get("pubDate"),
      imageUrl: thumb ? thumb[1] : null,
    });
  }
  return out;
}

async function fetchFeed(feed: Feed): Promise<NewsRow[]> {
  try {
    const res = await fetch(feed.url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const xml = await res.text();
    let items = parseRss(xml);
    if (feed.afghanOnly) {
      items = items.filter((it) =>
        /afghan/i.test(`${it.title} ${it.summary ?? ""}`),
      );
    }
    return items.map((it) => ({
      provider: feed.provider,
      provider_id: it.guid,
      sport_code: feed.sport,
      title: it.title,
      summary: it.summary,
      url: it.link,
      image_url: it.imageUrl,
      source_name: feed.source,
      published_at: it.pubDate ? safeIso(it.pubDate) : null,
      language: "en",
      feed_tag: feed.feed_tag,
    }));
  } catch {
    return [];
  }
}

function safeIso(d: string): string | null {
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export async function syncRssNews(): Promise<SyncResult> {
  const supabase = createServiceClient();
  try {
    const all: NewsRow[] = [];
    for (const feed of FEEDS) {
      all.push(...(await fetchFeed(feed)));
    }

    // Collapse same-story duplicates across feeds by content fingerprint.
    const seen = new Set<string>();
    const rows: NewsRow[] = [];
    for (const r of all) {
      const key = contentKey(r.title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      rows.push(r);
    }

    if (rows.length === 0) {
      await supabase.from("external_sync_log").insert({
        provider: "rss-news", resource: "news", status: "ok", records_upserted: 0,
      });
      return { ok: true, upserted: 0 };
    }

    const { error } = await supabase
      .from("external_news")
      .upsert(rows, { onConflict: "provider,provider_id" });
    if (error) {
      await supabase.from("external_sync_log").insert({
        provider: "rss-news", resource: "news", status: "error", error_message: error.message,
      });
      return { ok: false, status: "error", message: error.message };
    }

    await supabase.from("external_sync_log").insert({
      provider: "rss-news", resource: "news", status: "ok", records_upserted: rows.length,
    });
    return { ok: true, upserted: rows.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("external_sync_log").insert({
      provider: "rss-news", resource: "news", status: "error", error_message: msg,
    });
    return { ok: false, status: "error", message: msg };
  }
}
