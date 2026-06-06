/**
 * RSS news adapter — Afghanistan sport + FIFA World Cup 2026.
 *
 * Mixes image-rich publisher feeds (BBC Sport, ESPN Cricinfo, ESPN Soccer —
 * which ship <media:thumbnail> images + real summaries + real article URLs)
 * with Google News search for Afghanistan breadth. All descriptions are HTML
 * entity-decoded and tag-stripped so no raw markup ever reaches a post body.
 *
 * Same-story duplicates across feeds collapse by content fingerprint (see
 * lib/sports/normalize.ts); the wall projection enforces the final
 * no-duplicates guarantee via dedupe_key.
 */

import type { NewsRow, SyncResult } from "./types";
import { createServiceClient } from "@/lib/supabase/server";
import { contentKey } from "../normalize";

const AFG = /afghan/i;
const WC = /world cup|fifa|wc ?2026/i;
// Sport keywords in Pashto + Dari/Persian — used to pull sport items out of the
// general Afghan-language news feeds (cricket, football, sport, volleyball,
// taekwondo, match/game, olympics, champion, national team, boxing, wrestling,
// cycling, basketball, goal, cup, athlete, player, Rashid Khan).
const SPORT_KW =
  /کرکټ|کرکت|فوټبال|فوتبال|سپورت|ورزش|والیبال|تکواندو|لوب|بازی|مسابق|المپیک|قهرمان|تیم ملی|بوکس|کشتی|پهلوان|بایسکل|دوچرخ|بسکتبال|گول|جام|ورزشکار|بازیکن|راشد خان/;
// "Afghanistan" in Pashto/Dari — keeps the broad regional feeds (BBC
// Pashto/Persian, which also cover Iran) on-topic.
const AFG_NATIVE = /افغان/;

type Tag = "afghanistan" | "wc2026";
type Lang = "en" | "fa" | "ps";
type Feed = {
  url: string;
  source: string;
  provider: string;
  language: Lang;
  /** Decide which feed a parsed item belongs to, or null to drop it. */
  classify: (it: ParsedItem) => Tag | null;
};

const both = (it: ParsedItem) => `${it.title} ${it.summary ?? ""}`;

const FEEDS: Feed[] = [
  // --- English Afghan sport (real article URLs) ------------------------------
  {
    url: "https://pajhwok.com/category/sports/feed/",
    source: "Pajhwok Afghan News",
    provider: "pajhwok-sport",
    language: "en",
    classify: () => "afghanistan",
  },
  {
    url: "https://www.ariananews.af/category/sport/feed/",
    source: "Ariana News",
    provider: "ariana-sport",
    language: "en",
    classify: () => "afghanistan",
  },
  {
    url: "https://www.espn.com/espn/rss/cricinfo/news",
    source: "ESPN Cricinfo",
    provider: "espn-cricinfo",
    language: "en",
    classify: (it) => (AFG.test(both(it)) ? "afghanistan" : null),
  },
  // --- World / World Cup 2026 (image-rich) -----------------------------------
  {
    url: "https://feeds.bbci.co.uk/sport/rss.xml",
    source: "BBC Sport",
    provider: "bbc-sport",
    language: "en",
    classify: (it) => (AFG.test(both(it)) ? "afghanistan" : WC.test(both(it)) ? "wc2026" : null),
  },
  {
    url: "https://www.espn.com/espn/rss/soccer/news",
    source: "ESPN Soccer",
    provider: "espn-soccer",
    language: "en",
    classify: (it) => (AFG.test(both(it)) ? "afghanistan" : WC.test(both(it)) ? "wc2026" : null),
  },
  // --- Native Dari + Pashto Afghan sport -------------------------------------
  // TOLOnews categorises by URL (…/sport-…), which is far more reliable than
  // keyword-matching its general feed.
  {
    url: "https://tolonews.com/rss.xml",
    source: "TOLOnews",
    provider: "tolo-ps",
    language: "ps",
    classify: (it) => (/\/sport/i.test(it.link) ? "afghanistan" : null),
  },
  {
    url: "https://tolonews.com/fa/rss.xml",
    source: "طلوع‌نیوز",
    provider: "tolo-fa",
    language: "fa",
    classify: (it) => (/\/sport/i.test(it.link) ? "afghanistan" : null),
  },
  // BBC Pashto/Persian are broad regional feeds (also Iran/world) — require a
  // sport keyword AND Afghanistan named in the headline itself.
  {
    url: "https://feeds.bbci.co.uk/pashto/rss.xml",
    source: "BBC پښتو",
    provider: "bbc-ps",
    language: "ps",
    classify: (it) => (SPORT_KW.test(both(it)) && AFG_NATIVE.test(it.title) ? "afghanistan" : null),
  },
  {
    url: "https://feeds.bbci.co.uk/persian/rss.xml",
    source: "BBC فارسی",
    provider: "bbc-fa",
    language: "fa",
    classify: (it) => (SPORT_KW.test(both(it)) && AFG_NATIVE.test(it.title) ? "afghanistan" : null),
  },
];

// --- HTML helpers ------------------------------------------------------------
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCp(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCp(parseInt(d, 10)))
    .replace(/&amp;/g, "&"); // ampersand last so it doesn't double-decode
}
function safeCp(n: number): string {
  try {
    return String.fromCodePoint(n);
  } catch {
    return "";
  }
}
/** Decode entities (twice — Google News descriptions are double-encoded, so
 *  one pass leaves &amp;nbsp; → &nbsp;), drop tags, collapse whitespace.
 *  Returns null if the result is empty or just a bare URL. */
function cleanText(raw: string | null, maxLen = 320): string | null {
  if (!raw) return null;
  let t = decodeEntities(decodeEntities(raw));
  t = t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!t || /^https?:\/\//i.test(t)) return null;
  return t.slice(0, maxLen);
}

/** Google News descriptions are just the headline repeated + the publisher —
 *  no value beyond the title. Drop a summary that merely restates the title. */
function isRedundant(summary: string | null, title: string): boolean {
  if (!summary) return true;
  // Keep Latin alphanumerics + Arabic-script (Pashto/Dari) letters; drop the rest.
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+/g, "");
  const t = norm(title);
  const s = norm(summary);
  if (!s) return true;
  return s.startsWith(t.slice(0, 24)) || t.startsWith(s.slice(0, 24));
}

type ParsedItem = {
  guid: string;
  title: string;
  link: string;
  summary: string | null;
  pubDate: string | null;
  imageUrl: string | null;
};

function extractImage(rawItem: string): string | null {
  // <media:content ... url="..." ... (medium="image"|type="image/...")>
  const mc = rawItem.match(
    /<media:content[^>]+url="([^"]+)"[^>]*(?:medium="image"|type="image)/i,
  );
  if (mc) return mc[1];
  // <media:thumbnail url="..." width="N"> — pick the widest if several
  const thumbs = Array.from(rawItem.matchAll(/<media:thumbnail[^>]+url="([^"]+)"(?:[^>]*width="(\d+)")?/gi));
  if (thumbs.length) {
    thumbs.sort((a, b) => Number(b[2] ?? 0) - Number(a[2] ?? 0));
    return thumbs[0][1];
  }
  // <enclosure url="..." type="image/...">
  const enc = rawItem.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image/i);
  if (enc) return enc[1];
  return null;
}

function parseRss(xml: string): ParsedItem[] {
  const out: ParsedItem[] = [];
  const items = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
  for (const raw of items) {
    const get = (tag: string) => {
      const m = raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      if (!m) return null;
      return m[1].replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim();
    };
    const rawTitle = get("title");
    const link = get("link");
    if (!rawTitle || !link) continue;
    let title = decodeEntities(rawTitle.replace(/<[^>]+>/g, "")).trim();
    // Google News appends " - Publisher" to titles — trim for a clean headline.
    title = title.replace(/\s+-\s+[^-]+$/, "").trim() || title;
    out.push({
      guid: get("guid") ?? link,
      title,
      link,
      summary: cleanText(get("description")),
      pubDate: get("pubDate"),
      imageUrl: extractImage(raw),
    });
  }
  return out;
}

function safeIso(d: string | null): string | null {
  if (!d) return null;
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

async function fetchFeed(feed: Feed): Promise<NewsRow[]> {
  try {
    const res = await fetch(feed.url, {
      next: { revalidate: 1800 },
      headers: { "user-agent": "Mozilla/5.0 (compatible; ASFBot/1.0)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const rows: NewsRow[] = [];
    for (const it of parseRss(xml)) {
      const tag = feed.classify(it);
      if (!tag) continue;
      rows.push({
        provider: feed.provider,
        provider_id: it.guid,
        sport_code: null,
        title: it.title,
        summary: isRedundant(it.summary, it.title) ? null : it.summary,
        url: it.link,
        image_url: it.imageUrl,
        source_name: feed.source,
        published_at: safeIso(it.pubDate),
        language: feed.language,
        feed_tag: tag,
      });
    }
    return rows;
  } catch {
    return [];
  }
}

export async function syncRssNews(): Promise<SyncResult> {
  const supabase = createServiceClient();
  try {
    const all: NewsRow[] = [];
    for (const feed of FEEDS) all.push(...(await fetchFeed(feed)));

    // Collapse same-story duplicates across feeds by content fingerprint,
    // preferring the copy that carries an image.
    const best = new Map<string, NewsRow>();
    for (const r of all) {
      const key = contentKey(r.title);
      if (!key) continue;
      const prev = best.get(key);
      if (!prev || (!prev.image_url && r.image_url)) best.set(key, r);
    }
    const rows = Array.from(best.values());
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
