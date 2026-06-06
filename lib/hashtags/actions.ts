"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type HashResult = { ok: true; following: boolean } | { ok: false; message: string };

export async function toggleHashtagFollow(tag: string): Promise<HashResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in to follow tags." };

    const t = tag.toLowerCase().replace(/^#/, "");
    if (!/^[a-z0-9_]{1,50}$/.test(t)) return { ok: false, message: "Invalid tag." };

    // Make sure the hashtag exists in the registry first; FK requires it.
    await supabase
      .from("hashtags")
      .upsert({ tag: t }, { onConflict: "tag", ignoreDuplicates: true });

    const { data: existing } = await supabase
      .from("hashtag_follows")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("tag", t)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("hashtag_follows")
        .delete()
        .eq("user_id", user.id)
        .eq("tag", t);
      if (error) return { ok: false, message: error.message };
      revalidatePath(`/hashtags/${t}`);
      revalidatePath("/following/hashtags");
      return { ok: true, following: false };
    } else {
      const { error } = await supabase
        .from("hashtag_follows")
        .insert({ user_id: user.id, tag: t });
      if (error) return { ok: false, message: error.message };
      revalidatePath(`/hashtags/${t}`);
      revalidatePath("/following/hashtags");
      return { ok: true, following: true };
    }
  } catch (e) {
    console.error("[hashtags/toggle]", e);
    return { ok: false, message: "Something went wrong." };
  }
}
