/**
 * Aggregate sports-data sync, refocused on Afghanistan + FIFA World Cup 2026.
 * Honors the `module.external_sports` flag — does nothing if admin has switched
 * the feed off. Writes the `external_*` cache tables; the wall projection
 * (lib/sports/wall.ts) runs separately on a daily cron.
 */

import { isFeatureEnabled } from "@/lib/features/flags";
import { syncTheSportsDb } from "./adapters/thesportsdb";
import { syncRssNews } from "./adapters/rss-news";
import { syncFootballData } from "./adapters/football-data";

export type SyncReport = {
  thesportsdb?: { ok: boolean; upserted?: number; message?: string };
  news?: { ok: boolean; upserted?: number; message?: string };
  footballdata?: { ok: boolean; upserted?: number; message?: string };
};

export async function syncAllExternalSports(): Promise<SyncReport> {
  const enabled = await isFeatureEnabled("module.external_sports");
  if (!enabled) return {};

  const [tsdb, news, fd] = await Promise.all([
    syncTheSportsDb(),
    syncRssNews(),
    syncFootballData(),
  ]);

  return {
    thesportsdb: tsdb.ok ? { ok: true, upserted: tsdb.upserted } : { ok: false, message: tsdb.message },
    news: news.ok ? { ok: true, upserted: news.upserted } : { ok: false, message: news.message },
    footballdata: fd.ok ? { ok: true, upserted: fd.upserted } : { ok: false, message: fd.message },
  };
}
