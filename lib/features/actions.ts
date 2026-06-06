"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FlagResult = { ok: true } | { ok: false; message: string };

async function requireAdmin(): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!data?.is_admin) return { ok: false, message: "Admin only." };
  return { ok: true };
}

export async function setFeatureFlag(key: string, enabled: boolean): Promise<FlagResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const supabase = await createClient();
  const { error } = await supabase
    .from("feature_flags")
    .update({ is_enabled: enabled })
    .eq("key", key);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/modules");
  return { ok: true };
}

export async function resetFeatureFlag(key: string): Promise<FlagResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const supabase = await createClient();
  // reset to default_value
  const { data: row } = await supabase
    .from("feature_flags")
    .select("default_value")
    .eq("key", key)
    .maybeSingle();
  if (!row) return { ok: false, message: "Flag not found." };
  const { error } = await supabase
    .from("feature_flags")
    .update({ is_enabled: row.default_value })
    .eq("key", key);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/modules");
  return { ok: true };
}
