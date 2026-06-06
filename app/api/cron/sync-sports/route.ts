/**
 * GET /api/cron/sync-sports
 *
 * Pulls fixtures + standings from every configured external sports adapter,
 * upserting into the `external_*` cache tables. Wire to Vercel Cron at a
 * cadence that fits each provider's free-tier rate limit:
 *   - TheSportsDB: 30 min is fine
 *   - BallDontLie: 30 min is fine
 *   - Football-Data: 1 hour to stay under 10/min
 *
 * Header: x-asf-cron-key: <CRON_SECRET>
 */

import { NextResponse } from "next/server";
import { syncAllExternalSports } from "@/lib/sports/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-asf-cron-key");
  if (secret && provided !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const report = await syncAllExternalSports();
  return NextResponse.json({ ok: true, report });
}
