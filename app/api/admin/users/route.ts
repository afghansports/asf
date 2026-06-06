import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/api/admin";

export async function GET(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const q = new URL(request.url).searchParams.get("q")?.trim();
  let query = ctx.supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
  if (q) {
    query = query.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true, rows: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const body = await request.json();
  if (!body.id) return jsonError("id is required.");
  const { data, error } = await ctx.supabase.from("profiles").update({
    is_admin: body.isAdmin,
    is_active: body.isActive,
  }).eq("id", body.id).select("*").single();
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true, row: data });
}
