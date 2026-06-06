"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications/notify";

export type MsgResult = { ok: true; data?: unknown } | { ok: false; message: string };

/**
 * Open or create a 1:1 conversation between the current user and another
 * user. Honors the recipient's `who_can_dm` privacy setting:
 *   - everyone -> direct conversation
 *   - follows  -> direct only if recipient already follows me; otherwise create a message_request
 *   - nobody   -> rejected unless recipient already follows me
 */
export async function openConversation(input: {
  recipientId: string;
  firstMessage?: string;
}): Promise<MsgResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in." };
    if (user.id === input.recipientId)
      return { ok: false, message: "You can't message yourself." };

    // Block check.
    const { data: blocked } = await supabase.rpc("is_blocked", {
      p_viewer: user.id,
      p_target: input.recipientId,
    });
    if (blocked) return { ok: false, message: "This user can not be messaged." };

    // Privacy.
    const { data: r } = await supabase
      .from("profiles")
      .select("privacy_settings")
      .eq("id", input.recipientId)
      .maybeSingle();
    const policy = (r?.privacy_settings as { who_can_dm?: string } | null)?.who_can_dm ?? "everyone";

    const { data: follows } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", input.recipientId)
      .eq("subject_type", "user")
      .eq("subject_id", user.id)
      .maybeSingle();
    const recipientFollowsMe = !!follows;

    // Find an existing 1:1 conversation between the two users.
    const service = createServiceClient();
    const { data: convPart } = await service
      .from("dm_participants")
      .select("conversation_id, dm_conversations!inner(id, is_group)")
      .eq("user_id", user.id);
    const candidateConvIds = (convPart ?? [])
      .filter((p) => !((p as unknown as { dm_conversations: { is_group: boolean } }).dm_conversations.is_group))
      .map((p) => p.conversation_id);
    let convId: string | null = null;
    if (candidateConvIds.length) {
      const { data: shared } = await service
        .from("dm_participants")
        .select("conversation_id")
        .eq("user_id", input.recipientId)
        .in("conversation_id", candidateConvIds);
      convId = shared?.[0]?.conversation_id ?? null;
    }

    // Branch on policy if no existing conversation.
    if (!convId) {
      if (policy === "nobody" && !recipientFollowsMe) {
        return { ok: false, message: "This user only accepts messages from people they follow." };
      }
      if (policy === "follows" && !recipientFollowsMe) {
        // Create a message request, not a real conversation.
        const { data: existing } = await service
          .from("dm_message_requests")
          .select("id")
          .eq("sender_id", user.id)
          .eq("recipient_id", input.recipientId)
          .eq("status", "pending")
          .maybeSingle();
        if (!existing) {
          await service.from("dm_message_requests").insert({
            sender_id: user.id,
            recipient_id: input.recipientId,
            preview_body: (input.firstMessage ?? "").slice(0, 500),
          });
          await notify({
            userId: input.recipientId,
            type: "message_request",
            actorId: user.id,
            body: "Someone you don't follow wants to message you.",
            link: "/messages?tab=requests",
          });
        }
        return {
          ok: true,
          data: { kind: "request", message: "Message sent as a request. They will see it in their requests folder." },
        };
      }

      // Create the real conversation.
      const { data: conv, error: convErr } = await service
        .from("dm_conversations")
        .insert({ created_by: user.id, is_group: false })
        .select("id")
        .single();
      if (convErr || !conv) return { ok: false, message: convErr?.message ?? "Could not start a conversation." };
      convId = conv.id;
      await service.from("dm_participants").insert([
        { conversation_id: convId, user_id: user.id, role: "admin" },
        { conversation_id: convId, user_id: input.recipientId, role: "member" },
      ]);
    }

    if (input.firstMessage && input.firstMessage.trim()) {
      await service.from("dm_messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        body: input.firstMessage.trim().slice(0, 4000),
      });
      await service
        .from("dm_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", convId);
      await notify({
        userId: input.recipientId,
        type: "message",
        actorId: user.id,
        body: "New direct message.",
        link: `/messages/${convId}`,
      });
    }

    revalidatePath("/messages");
    return { ok: true, data: { kind: "conversation", id: convId } };
  } catch (e) {
    console.error("[messages/open]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function sendMessage(input: {
  conversationId: string;
  body: string;
}): Promise<MsgResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in." };
    const body = input.body.trim();
    if (!body) return { ok: false, message: "Message can not be empty." };
    if (body.length > 4000) return { ok: false, message: "Message too long." };

    const { error } = await supabase.from("dm_messages").insert({
      conversation_id: input.conversationId,
      sender_id: user.id,
      body,
    });
    if (error) return { ok: false, message: error.message };

    const service = createServiceClient();
    await service
      .from("dm_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", input.conversationId);

    // Notify other participants.
    const { data: others } = await service
      .from("dm_participants")
      .select("user_id")
      .eq("conversation_id", input.conversationId)
      .neq("user_id", user.id);
    for (const p of others ?? []) {
      await notify({
        userId: p.user_id,
        type: "message",
        actorId: user.id,
        body: "New direct message.",
        link: `/messages/${input.conversationId}`,
      });
    }

    revalidatePath(`/messages/${input.conversationId}`);
    return { ok: true };
  } catch (e) {
    console.error("[messages/send]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function reviewMessageRequest(input: {
  requestId: string;
  decision: "accepted" | "declined" | "blocked";
}): Promise<MsgResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in." };

    const { data: req } = await supabase
      .from("dm_message_requests")
      .select("id, sender_id, recipient_id, preview_body, status")
      .eq("id", input.requestId)
      .maybeSingle();
    if (!req || req.recipient_id !== user.id)
      return { ok: false, message: "Request not found." };
    if (req.status !== "pending")
      return { ok: false, message: "This request was already reviewed." };

    const service = createServiceClient();

    if (input.decision === "blocked") {
      await service.from("user_blocks").insert({
        blocker_id: user.id,
        blocked_id: req.sender_id,
      });
    }

    await service
      .from("dm_message_requests")
      .update({ status: input.decision, reviewed_at: new Date().toISOString() })
      .eq("id", req.id);

    if (input.decision === "accepted") {
      // Promote into a real conversation; carry over the preview body.
      const { data: conv } = await service
        .from("dm_conversations")
        .insert({ created_by: req.sender_id, is_group: false })
        .select("id")
        .single();
      if (conv) {
        await service.from("dm_participants").insert([
          { conversation_id: conv.id, user_id: req.sender_id, role: "member" },
          { conversation_id: conv.id, user_id: user.id, role: "admin" },
        ]);
        if (req.preview_body) {
          await service.from("dm_messages").insert({
            conversation_id: conv.id,
            sender_id: req.sender_id,
            body: req.preview_body,
          });
        }
        revalidatePath(`/messages/${conv.id}`);
      }
    }

    revalidatePath("/messages");
    return { ok: true };
  } catch (e) {
    console.error("[messages/review-request]", e);
    return { ok: false, message: "Something went wrong." };
  }
}
