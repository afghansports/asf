import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/api/admin";

export async function GET() {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const { data, error } = await ctx.supabase.from("history_timeline").select("*").order("sort_order", { ascending: true });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true, rows: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const body = await request.json();
  const { data, error } = await ctx.supabase.from("history_timeline").insert({
    year: Number(body.year),
    title: body.title,
    description: body.description || null,
    sort_order: body.sortOrder ?? 0,
    is_active: body.isActive ?? true,
  }).select("*").single();
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true, row: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const body = await request.json();
  if (!body.id) return jsonError("id is required.");
  const { data, error } = await ctx.supabase.from("history_timeline").update({
    year: body.year === undefined ? undefined : Number(body.year),
    title: body.title,
    description: body.description,
    sort_order: body.sortOrder,
    is_active: body.isActive,
  }).eq("id", body.id).select("*").single();
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true, row: data });
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("id is required.");
  const { error } = await ctx.supabase.from("history_timeline").delete().eq("id", id);
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true });
}
