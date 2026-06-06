import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/api/admin";

export async function GET() {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const { data, error } = await ctx.supabase.from("gallery_images").select("*").order("sort_order", { ascending: true });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true, rows: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const body = await request.json();
  const { data, error } = await ctx.supabase.from("gallery_images").insert({
    image_url: body.imageUrl,
    caption: body.caption || null,
    event_name: body.eventName || null,
    year: body.year ? Number(body.year) : null,
    sort_order: body.sortOrder ? Number(body.sortOrder) : 0,
    is_published: body.isPublished ?? true,
  }).select("*").single();
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true, row: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const body = await request.json();
  const { id, ...patch } = body;
  if (!id) return jsonError("id is required.");
  const { data, error } = await ctx.supabase.from("gallery_images").update({
    caption: patch.caption,
    event_name: patch.eventName,
    year: patch.year,
    sort_order: patch.sortOrder,
    is_published: patch.isPublished,
  }).eq("id", id).select("*").single();
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true, row: data });
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("id is required.");
  const { error } = await ctx.supabase.from("gallery_images").delete().eq("id", id);
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true });
}
