/**
 * GET /api/cron/sports-wall
 *
 * Projects cached Afghanistan + World Cup 2026 fixtures/results/news into the
 * activity wall. Runs daily (Vercel Cron) so the wall gets a steady trickle of
 * pro sport without flooding it every 30 minutes. De-duplication is enforced by
 * wall_posts.dedupe_key, so a re-run is always safe.
 *
 * Header: x-asf-cron-key: <CRON_SECRET>
 */

import { NextResponse } from "next/server";
import { projectToWall } from "@/lib/sports/wall";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-asf-cron-key");
  if (secret && provided !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const report = await projectToWall();
  return NextResponse.json({ ok: true, report });
}
