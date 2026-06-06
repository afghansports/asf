"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PollResult = { ok: true; id?: string } | { ok: false; message: string };

export async function createPoll(input: {
  question: string;
  options: string[];
  closesInDays: number;
}): Promise<PollResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in." };

    const q = input.question.trim();
    if (q.length < 5 || q.length > 280) return { ok: false, message: "Question must be 5-280 characters." };

    const opts = input.options.map((o) => o.trim()).filter((o) => o.length > 0).slice(0, 4);
    if (opts.length < 2) return { ok: false, message: "Add at least 2 options." };

    const days = Math.max(1, Math.min(30, input.closesInDays));
    const closesAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { data: poll, error } = await supabase
      .from("polls")
      .insert({ author_id: user.id, question: q, closes_at: closesAt })
      .select("id")
      .single();
    if (error || !poll) return { ok: false, message: error?.message ?? "Could not create poll." };

    const { error: optErr } = await supabase
      .from("poll_options")
      .insert(opts.map((label, i) => ({ poll_id: poll.id, label, sort_order: i })));
    if (optErr) {
      // Rollback the poll if options failed.
      await supabase.from("polls").delete().eq("id", poll.id);
      return { ok: false, message: "Could not save options." };
    }

    revalidatePath("/polls");
    return { ok: true, id: poll.id };
  } catch (e) {
    console.error("[polls/create]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function votePoll(input: { pollId: string; optionId: string }): Promise<PollResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in to vote." };

    // RLS will reject closed polls and double-votes via the unique constraint.
    const { error } = await supabase.from("poll_votes").insert({
      poll_id: input.pollId,
      user_id: user.id,
      option_id: input.optionId,
    });
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return { ok: false, message: "You have already voted on this poll." };
      }
      return { ok: false, message: error.message };
    }
    revalidatePath(`/polls/${input.pollId}`);
    revalidatePath("/polls");
    return { ok: true };
  } catch (e) {
    console.error("[polls/vote]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function deletePoll(pollId: string): Promise<PollResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in." };
  const { error } = await supabase.from("polls").delete().eq("id", pollId).eq("author_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/polls");
  return { ok: true };
}
