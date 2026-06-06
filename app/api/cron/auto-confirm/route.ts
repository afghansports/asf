import { NextResponse } from "next/server";
import { autoConfirmStaleMatches } from "@/app/admin/_chapters-actions";

/**
 * GET /api/cron/auto-confirm
 *
 * Auto-confirms reported matches older than 48 hours. Wire this to a Vercel
 * Cron Job (every hour) with header `x-asf-cron-key: <CRON_SECRET>`.
 *
 * If the secret is not set in env, the route is open in dev (logs a warning).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-asf-cron-key");
  if (secret && provided !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!secret) {
    console.warn("[cron] CRON_SECRET not set; auto-confirm endpoint is open in dev.");
  }
  const result = await autoConfirmStaleMatches();
  return NextResponse.json({ ok: true, ...result });
}
