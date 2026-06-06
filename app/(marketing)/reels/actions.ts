"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReelActionResult = { ok: true } | { ok: false; message: string };

/**
 * Like / unlike a reel. Idempotent. Like-count syncs via DB trigger.
 */
export async function toggleReelLike(reelId: string): Promise<ReelActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in to like." };

    const { data: existing } = await supabase
      .from("reel_likes")
      .select("reel_id")
      .eq("reel_id", reelId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("reel_likes")
        .delete()
        .eq("reel_id", reelId)
        .eq("user_id", user.id);
      if (error) return { ok: false, message: error.message };
    } else {
      const { error } = await supabase
        .from("reel_likes")
        .insert({ reel_id: reelId, user_id: user.id });
      if (error) return { ok: false, message: error.message };
    }
    revalidatePath("/reels");
    return { ok: true };
  } catch (e) {
    console.error("[reels/like] unexpected", e);
    return { ok: false, message: "Something went wrong." };
  }
}

/**
 * Increment view count. Best-effort, no auth required.
 */
export async function bumpReelView(reelId: string): Promise<{ ok: boolean }> {
  try {
    const supabase = await createClient();
    // Use raw RPC-like increment via update + select-then-write pattern.
    const { data: row } = await supabase
      .from("reels")
      .select("view_count")
      .eq("id", reelId)
      .maybeSingle();
    if (!row) return { ok: false };
    await supabase
      .from("reels")
      .update({ view_count: (row.view_count ?? 0) + 1 })
      .eq("id", reelId);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/**
 * Post a comment.
 */
export async function postReelComment(input: {
  reelId: string;
  body: string;
}): Promise<ReelActionResult> {
  try {
    const body = input.body.trim();
    if (!body) return { ok: false, message: "Comment can not be empty." };
    if (body.length > 500) return { ok: false, message: "Max 500 characters." };
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in to comment." };
    const { error } = await supabase
      .from("reel_comments")
      .insert({ reel_id: input.reelId, author_id: user.id, body });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/reels");
    return { ok: true };
  } catch (e) {
    console.error("[reels/comment]", e);
    return { ok: false, message: "Something went wrong." };
  }
}
