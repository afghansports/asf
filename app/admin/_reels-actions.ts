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
  return { ok: true as const, supabase: createServiceClient() };
}

export async function toggleReelPublished(id: string, value: boolean): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("reels").update({ is_published: value }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/reels");
  revalidatePath("/reels");
  return { ok: true };
}

export async function toggleReelFeatured(id: string, value: boolean): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("reels").update({ is_featured: value }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/reels");
  return { ok: true };
}

export async function deleteReel(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("reels").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/reels");
  revalidatePath("/reels");
  return { ok: true };
}

/* ------------------------------ GEO ------------------------------ */

export async function saveDistrict(input: {
  id?: string;
  countryCode: string;
  provinceCode: string;
  provinceName: string;
  code: string;
  name: string;
  isActive: boolean;
}): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const payload = {
    country_code: input.countryCode,
    province_code: input.provinceCode,
    province_name: input.provinceName,
    code: input.code,
    name: input.name,
    is_active: input.isActive,
  };
  if (input.id) {
    const { error } = await ctx.supabase.from("geo_districts").update(payload).eq("id", input.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await ctx.supabase.from("geo_districts").insert(payload);
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return { ok: false, message: "A district with that code already exists." };
      }
      return { ok: false, message: error.message };
    }
  }
  revalidatePath("/admin/geo");
  return { ok: true };
}

export async function deleteDistrict(id: string): Promise<AdminResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase.from("geo_districts").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/geo");
  return { ok: true };
}
