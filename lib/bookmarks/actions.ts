"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BookmarkResult = { ok: true; saved: boolean } | { ok: false; message: string };

export type BookmarkTarget = "reel" | "event" | "news" | "team" | "tournament";

export async function toggleBookmark(input: {
  targetType: BookmarkTarget;
  targetId: string;
}): Promise<BookmarkResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in to save." };

    const { data: existing } = await supabase
      .from("bookmarks")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("target_type", input.targetType)
      .eq("target_id", input.targetId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", input.targetType)
        .eq("target_id", input.targetId);
      if (error) return { ok: false, message: error.message };
      revalidatePath("/saved");
      return { ok: true, saved: false };
    } else {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        target_type: input.targetType,
        target_id: input.targetId,
      });
      if (error) return { ok: false, message: error.message };
      revalidatePath("/saved");
      return { ok: true, saved: true };
    }
  } catch (e) {
    console.error("[bookmarks/toggle]", e);
    return { ok: false, message: "Something went wrong." };
  }
}
