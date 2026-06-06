import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/api/admin";

export async function GET() {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const { data, error } = await ctx.supabase.from("news_posts").select("*").order("created_at", { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ success: true, rows: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const body = await request.json();
  const { data, error } = await ctx.supabase.from("news_posts").insert({
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt || null,
    content: body.content || "",
    image_url: body.imageUrl || null,
    is_published: !!body.isPublished,
    published_at: body.isPublished ? new Date().toISOString() : null,
  }).select("*").single();
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true, row: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const body = await request.json();
  if (!body.id) return jsonError("id is required.");
  const { data, error } = await ctx.supabase.from("news_posts").update({
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt,
    content: body.content,
    image_url: body.imageUrl,
    is_published: body.isPublished,
    published_at: body.isPublished ? (body.publishedAt ?? new Date().toISOString()) : null,
  }).eq("id", body.id).select("*").single();
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true, row: data });
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx.ok) return jsonError(ctx.message, ctx.status);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("id is required.");
  const { error } = await ctx.supabase.from("news_posts").delete().eq("id", id);
  if (error) return jsonError(error.message, 400);
  return NextResponse.json({ success: true });
}
