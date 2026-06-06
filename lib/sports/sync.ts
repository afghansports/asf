/**
 * Aggregate sports-data sync. Honors the `module.external_sports` flag —
 * does nothing if admin has switched the feed off.
 */

import { isFeatureEnabled } from "@/lib/features/flags";
import { syncTheSportsDb } from "./adapters/thesportsdb";
import { syncBallDontLie } from "./adapters/balldontlie";
import { syncFootballData } from "./adapters/football-data";
import { syncEspnRss } from "./adapters/espn-rss";

export type SyncReport = {
  thesportsdb?: { ok: boolean; upserted?: number; message?: string };
  balldontlie?: { ok: boolean; upserted?: number; message?: string };
  footballdata?: { ok: boolean; upserted?: number; message?: string };
  espn?: { ok: boolean; upserted?: number; message?: string };
};

export async function syncAllExternalSports(): Promise<SyncReport> {
  const enabled = await isFeatureEnabled("module.external_sports");
  if (!enabled) return {};

  const [tsdb, bdl, fd, espn] = await Promise.all([
    syncTheSportsDb(),
    syncBallDontLie(),
    syncFootballData(),
    syncEspnRss(),
  ]);

  return {
    thesportsdb: tsdb.ok ? { ok: true, upserted: tsdb.upserted } : { ok: false, message: tsdb.message },
    balldontlie: bdl.ok ? { ok: true, upserted: bdl.upserted } : { ok: false, message: bdl.message },
    footballdata: fd.ok ? { ok: true, upserted: fd.upserted } : { ok: false, message: fd.message },
    espn: espn.ok ? { ok: true, upserted: espn.upserted } : { ok: false, message: espn.message },
  };
}
