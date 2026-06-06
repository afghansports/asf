"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * CMS server actions. Updates `site_content` rows. Defence in depth: re-checks
 * is_admin even though the admin layout already guards.
 *
 * The CmsEditor calls saveContent({ updates: [{key, value}, ...] }). We
 * UPSERT each row so creating a brand-new key from the admin works too.
 */

export type CmsResult = { ok: true; saved: number } | { ok: false; message: string };

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

export async function saveContent(
  updates: { key: string; value: string }[]
): Promise<CmsResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;

  const rows = updates
    .map((u) => ({ content_key: u.key.trim(), content_value: u.value }))
    .filter((u) => u.content_key);

  if (rows.length === 0) return { ok: true, saved: 0 };

  // Upsert by content_key. site_content has a UNIQUE constraint on content_key.
  const { error } = await ctx.supabase
    .from("site_content")
    .upsert(rows, { onConflict: "content_key" });

  if (error) {
    console.error("[cms/save]", error);
    return { ok: false, message: error.message };
  }

  // Bust caches for everywhere that reads CMS content.
  revalidatePath("/", "layout");
  return { ok: true, saved: rows.length };
}

export async function saveSettings(
  updates: { key: string; value: string }[]
): Promise<CmsResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;

  const rows = updates
    .map((u) => ({ setting_key: u.key.trim(), setting_value: u.value }))
    .filter((u) => u.setting_key);

  if (rows.length === 0) return { ok: true, saved: 0 };

  const { error } = await ctx.supabase
    .from("site_settings")
    .upsert(rows, { onConflict: "setting_key" });

  if (error) {
    console.error("[settings/save]", error);
    return { ok: false, message: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, saved: rows.length };
}
