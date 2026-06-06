import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";

/**
 * notify() — server-only helper for inserting an in-app notification (and
 * optionally sending an email, gated by the recipient's notification_prefs).
 *
 * Used by every server action that produces a user-visible event:
 * blockUser, issueStrike, issueSuspension, resolveAppeal, addPlayer, etc.
 */

export type NotificationType =
  | "follow"
  | "like_reel"
  | "comment_reel"
  | "mention"
  | "team_invite"
  | "match_reported"
  | "match_confirmed"
  | "event_approved"
  | "event_rejected"
  | "announcement"
  | "message"
  | "message_request"
  | "strike"
  | "suspension";

export async function notify(input: {
  userId: string;
  type: NotificationType;
  actorId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  body: string;
  link?: string | null;
  emailSubject?: string;
  emailHtml?: string;
}): Promise<{ ok: boolean }> {
  try {
    const supabase = createServiceClient();

    // Insert in-app row if the user has the in-app channel on for this type.
    const { data: prefRow } = await supabase
      .from("profiles")
      .select("notification_prefs")
      .eq("id", input.userId)
      .maybeSingle();

    const prefs = (prefRow?.notification_prefs ?? {}) as Record<
      string,
      { inapp?: boolean; email?: boolean } | undefined
    >;
    const channelPrefs = prefs[input.type] ?? { inapp: true, email: false };

    if (channelPrefs.inapp !== false) {
      await supabase.from("notifications").insert({
        user_id: input.userId,
        type: input.type,
        actor_id: input.actorId ?? null,
        target_type: input.targetType ?? null,
        target_id: input.targetId ?? null,
        body: input.body,
        link: input.link ?? null,
      });
    }

    // Email channel — fire and forget; the resend wrapper no-ops if unconfigured.
    if (channelPrefs.email && input.emailSubject) {
      // Need the recipient's email address. Pull from auth.users via RPC or admin endpoint.
      // Using service client we can read auth.users by user id.
      const { data: { user } = { user: null } } = await supabase.auth.admin.getUserById(input.userId);
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: input.emailSubject,
          html: input.emailHtml ?? `<p>${input.body}</p>`,
          text: input.body,
        });
      }
    }
    return { ok: true };
  } catch (e) {
    console.error("[notify]", e);
    return { ok: false };
  }
}
