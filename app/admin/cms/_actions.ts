"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { translationKey } from "@/lib/i18n/translate";

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

/**
 * Save admin-entered Dari/Pashto for content fields. Stores each as a manual
 * translation override in `content_translations`, keyed by a hash of the English
 * source — the same key the public translate-on-read looks up, so overrides take
 * effect immediately and replace the machine translation. A blank value deletes
 * the override (reverts that field to auto-translation).
 */
export async function saveContentTranslations(
  locale: string,
  items: { sourceText: string; value: string }[],
): Promise<CmsResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  if (locale !== "fa-AF" && locale !== "ps") return { ok: false, message: "Unsupported language." };

  const upserts: {
    source_hash: string;
    target_locale: string;
    source_text: string;
    translated_text: string;
  }[] = [];
  const deletes: string[] = [];
  for (const it of items) {
    const src = (it.sourceText ?? "").trim();
    if (!src) continue;
    const hash = translationKey(src);
    const value = (it.value ?? "").trim();
    if (value) {
      upserts.push({ source_hash: hash, target_locale: locale, source_text: src, translated_text: value });
    } else {
      deletes.push(hash);
    }
  }

  if (upserts.length) {
    const { error } = await ctx.supabase
      .from("content_translations")
      .upsert(upserts, { onConflict: "source_hash,target_locale" });
    if (error) return { ok: false, message: error.message };
  }
  if (deletes.length) {
    await ctx.supabase
      .from("content_translations")
      .delete()
      .eq("target_locale", locale)
      .in("source_hash", deletes);
  }

  revalidatePath("/", "layout");
  return { ok: true, saved: upserts.length };
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
