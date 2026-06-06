"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications/notify";

export type GroupResult = { ok: true; id: string } | { ok: false; message: string };

/**
 * Create a group conversation. Caller is the group's first admin.
 * Skips members who have blocked the caller (or are blocked by the caller).
 * Members whose `who_can_dm = nobody` and don't follow the caller are skipped
 * with a warning, not a hard error — group still gets created with the rest.
 */
export async function startGroupConversation(input: {
  memberIds: string[];
  title: string | null;
  firstMessage: string | null;
}): Promise<GroupResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in." };

    const memberIds = Array.from(new Set(input.memberIds.filter((id) => id !== user.id)));
    if (memberIds.length === 0) return { ok: false, message: "Add at least one recipient." };
    if (memberIds.length > 30) return { ok: false, message: "Max 30 other members." };

    // Block + privacy filter.
    const allowed: string[] = [];
    for (const m of memberIds) {
      const { data: blocked } = await supabase.rpc("is_blocked", {
        p_viewer: user.id,
        p_target: m,
      });
      if (blocked) continue;

      const { data: rec } = await supabase
        .from("profiles")
        .select("privacy_settings")
        .eq("id", m)
        .maybeSingle();
      const policy = (rec?.privacy_settings as { who_can_dm?: string } | null)?.who_can_dm ?? "everyone";
      if (policy === "nobody") {
        const { data: f } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", m)
          .eq("subject_type", "user")
          .eq("subject_id", user.id)
          .maybeSingle();
        if (!f) continue;
      }
      allowed.push(m);
    }
    if (allowed.length === 0) {
      return { ok: false, message: "None of the selected members accept group messages." };
    }

    const service = createServiceClient();
    const { data: conv, error: convErr } = await service
      .from("dm_conversations")
      .insert({
        is_group: allowed.length > 1,
        title: input.title,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (convErr || !conv) return { ok: false, message: convErr?.message ?? "Could not create group." };

    const participants = [
      { conversation_id: conv.id, user_id: user.id, role: "admin" as const },
      ...allowed.map((id) => ({ conversation_id: conv.id, user_id: id, role: "member" as const })),
    ];
    const { error: pErr } = await service.from("dm_participants").insert(participants);
    if (pErr) {
      await service.from("dm_conversations").delete().eq("id", conv.id);
      return { ok: false, message: pErr.message };
    }

    if (input.firstMessage && input.firstMessage.trim()) {
      await service.from("dm_messages").insert({
        conversation_id: conv.id,
        sender_id: user.id,
        body: input.firstMessage.trim().slice(0, 4000),
      });
      await service
        .from("dm_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conv.id);
    }

    // Notify everyone except the sender.
    for (const id of allowed) {
      await notify({
        userId: id,
        type: "message",
        actorId: user.id,
        body: input.title ? `Added to ${input.title}` : "Added to a new conversation.",
        link: `/messages/${conv.id}`,
      });
    }

    revalidatePath("/messages");
    return { ok: true, id: conv.id };
  } catch (e) {
    console.error("[messages/start-group]", e);
    return { ok: false, message: "Something went wrong." };
  }
}
