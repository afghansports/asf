import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/api/admin";

export async function GET() {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const { data, error } = await ctx.supabase.from("events").select("*").order("created_at", { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true, rows: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const body = await request.json();
  if (!body.id) return jsonError("id is required.");
  const { id, ...patch } = body;
  const { data, error } = await ctx.supabase.from("events").update({
    title: patch.title,
    event_type: patch.eventType,
    sport: patch.sport,
    description: patch.description,
    banner_url: patch.bannerUrl,
    start_datetime: patch.startDatetime,
    end_datetime: patch.endDatetime,
    city: patch.city,
    state_province: patch.state,
    venue_name: patch.venueName,
    address: patch.address,
    is_free: patch.isFree,
    registration_link: patch.registrationLink,
    is_published: patch.isPublished,
    is_featured: patch.isFeatured,
  }).eq("id", id).select("*").single();
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true, row: data });
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("id is required.");
  const { error } = await ctx.supabase.from("events").delete().eq("id", id);
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true });
}
