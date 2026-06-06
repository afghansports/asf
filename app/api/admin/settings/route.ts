import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/api/admin";

export async function GET() {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const { data, error } = await ctx.supabase.from("site_settings").select("*").order("group_name").order("setting_key");
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true, rows: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const body = await request.json() as { settings?: { key: string; value: string }[] };
  const settings = body.settings ?? [];
  if (!settings.length) return NextResponse.json({ success: true, saved: 0 });

  const rows = settings.map((s) => ({ setting_key: s.key, setting_value: s.value }));
  const { error } = await ctx.supabase.from("site_settings").upsert(rows, { onConflict: "setting_key" });
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true, saved: rows.length });
}
