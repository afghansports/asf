"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReplyResult = { ok: true } | { ok: false; message: string };

export async function postDiscussionReply(
  discussionId: string,
  body: string,
): Promise<ReplyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to reply." };

  const trimmed = (body ?? "").trim().slice(0, 4000);
  if (!trimmed) return { ok: false, message: "Reply cannot be empty." };

  // Reject if thread is locked.
  const { data: thread } = await supabase
    .from("discussions")
    .select("id, slug, is_locked")
    .eq("id", discussionId)
    .maybeSingle();
  if (!thread) return { ok: false, message: "Thread not found." };
  if (thread.is_locked) return { ok: false, message: "Thread is locked." };

  const { error } = await supabase
    .from("discussion_replies")
    .insert({
      discussion_id: discussionId,
      author_id: user.id,
      body: trimmed,
    });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/discussions/${thread.slug}`);
  revalidatePath(`/discussions`);
  revalidatePath(`/feed`);
  return { ok: true };
}
