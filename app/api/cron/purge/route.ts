import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/cron/purge
 *
 * Daily purge job. Hard-deletes content soft-deleted >90 days ago
 * (purge_soft_deleted) and anonymizes accounts whose deletion was requested
 * >30 days ago (purge_deleted_accounts). Wire to Vercel Cron at 03:00 UTC.
 *
 * Auth: header `x-asf-cron-key: <CRON_SECRET>` if CRON_SECRET is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-asf-cron-key");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 1. Hard-delete soft-deleted content older than 90 days.
  const { data: purgeRows, error: purgeErr } = await supabase.rpc("purge_soft_deleted");
  if (purgeErr) {
    console.error("[cron/purge] soft-delete purge failed:", purgeErr);
  }

  // 2. Anonymize accounts whose deletion was requested >30 days ago.
  const { data: anonCount, error: anonErr } = await supabase.rpc("purge_deleted_accounts");
  if (anonErr) {
    console.error("[cron/purge] account anonymize failed:", anonErr);
  }

  return NextResponse.json({
    ok: true,
    soft_deleted_purged: purgeRows ?? [],
    accounts_anonymized: anonCount ?? 0,
  });
}
