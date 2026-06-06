"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type AdminResult = { ok: true } | { ok: false; message: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Not signed in." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { ok: false as const, message: "Admin access required." };
  return { ok: true as const, supabase: createServiceClient(), userId: user.id };
}

export async function deleteWallPost(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("wall_posts").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/wall");
  revalidatePath("/feed");
  return { ok: true };
}

export async function toggleWallHidden(id: string, value: boolean): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("wall_posts").update({ is_hidden: value }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/wall");
  revalidatePath("/feed");
  return { ok: true };
}

export async function toggleWallPinned(id: string, value: boolean): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("wall_posts").update({ is_pinned: value }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/wall");
  revalidatePath("/feed");
  return { ok: true };
}

export async function clearExternalWall(): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase
    .from("wall_posts")
    .delete()
    .in("kind", ["external_fixture", "external_news"]);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/wall");
  revalidatePath("/feed");
  return { ok: true };
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  link: string;
  imageUrl: string | null;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;

  const title = input.title.trim();
  if (!title) return { ok: false, message: "Title is required." };

  const { error } = await ctx.supabase.from("wall_posts").insert({
    kind: "announcement",
    actor_id: ctx.userId,
    title,
    body: input.body.trim() || null,
    link: input.link.trim() || "/feed",
    image_url: input.imageUrl,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/wall");
  revalidatePath("/feed");
  return { ok: true };
}
