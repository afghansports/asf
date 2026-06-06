"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type SafetyResult = { ok: true; message?: string } | { ok: false; message: string };

/* ============================================================
   BLOCKING
   ============================================================ */

export async function blockUser(blockedId: string, reason?: string): Promise<SafetyResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in to block." };
    if (user.id === blockedId) return { ok: false, message: "You can not block yourself." };

    const { error } = await supabase
      .from("user_blocks")
      .insert({ blocker_id: user.id, blocked_id: blockedId, reason: reason ?? null });
    if (error && (error as { code?: string }).code !== "23505") {
      return { ok: false, message: error.message };
    }

    // Cascade: kill any follows in either direction so feed/discoverability
    // is fully severed without waiting for cron.
    await supabase
      .from("follows")
      .delete()
      .or(
        `and(follower_id.eq.${user.id},subject_type.eq.user,subject_id.eq.${blockedId}),and(follower_id.eq.${blockedId},subject_type.eq.user,subject_id.eq.${user.id})`,
      );

    revalidatePath("/profile/edit");
    return { ok: true, message: "Blocked." };
  } catch (e) {
    console.error("[safety/block]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function unblockUser(blockedId: string): Promise<SafetyResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in." };
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedId);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/profile/edit");
    return { ok: true, message: "Unblocked." };
  } catch (e) {
    console.error("[safety/unblock]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

/* ============================================================
   REPORTING
   ============================================================ */

export type ReportTarget =
  | "post"
  | "reel"
  | "comment"
  | "reel_comment"
  | "profile"
  | "team"
  | "dm"
  | "event"
  | "news";

export type ReportCategory =
  | "spam"
  | "harassment"
  | "hate"
  | "threats"
  | "impersonation"
  | "inappropriate"
  | "misinformation"
  | "underage"
  | "copyright"
  | "other";

export async function submitReport(input: {
  targetType: ReportTarget;
  targetId: string;
  category: ReportCategory;
  reasonText: string;
}): Promise<SafetyResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in to report." };

    const { error } = await supabase.rpc("submit_report", {
      p_target_type: input.targetType,
      p_target_id: input.targetId,
      p_category: input.category,
      p_reason_text: input.reasonText.slice(0, 500),
    });
    if (error) {
      // The RPC raises if the user is throttled or unauthenticated.
      const msg = error.message ?? "";
      if (msg.includes("restricted")) {
        return {
          ok: false,
          message:
            "Your reporting ability is restricted because of repeated false reports. Contact ASF support to appeal.",
        };
      }
      return { ok: false, message: "Could not submit report. Please try again." };
    }
    return {
      ok: true,
      message: "Thanks. ASF moderators will review this report.",
    };
  } catch (e) {
    console.error("[safety/report]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

/* ============================================================
   PRIVACY SETTINGS
   ============================================================ */

export type PrivacySettings = {
  who_can_dm: "everyone" | "follows" | "nobody";
  who_can_see_follows: "everyone" | "me";
  who_can_see_teams: "everyone" | "me";
  who_can_see_matches: "everyone" | "follows" | "me";
  who_can_comment: "everyone" | "follows" | "nobody";
  who_can_tag: "everyone" | "follows" | "nobody";
  read_receipts: boolean;
};

export async function savePrivacySettings(input: PrivacySettings): Promise<SafetyResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in." };
    const { error } = await supabase
      .from("profiles")
      .update({ privacy_settings: input })
      .eq("id", user.id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/profile/edit");
    return { ok: true, message: "Saved." };
  } catch (e) {
    console.error("[safety/privacy]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

/* ============================================================
   GDPR: account deletion + data export
   ============================================================ */

export async function requestAccountDeletion(): Promise<SafetyResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in." };
    const { error } = await supabase
      .from("profiles")
      .update({ deletion_requested_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/profile/edit");
    return {
      ok: true,
      message:
        "Deletion scheduled. Your account is hidden now. After 30 days it is permanently removed. Sign in within 30 days to cancel.",
    };
  } catch (e) {
    console.error("[safety/delete-request]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function cancelAccountDeletion(): Promise<SafetyResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in." };
    const { error } = await supabase
      .from("profiles")
      .update({ deletion_requested_at: null })
      .eq("id", user.id);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/profile/edit");
    return { ok: true, message: "Deletion cancelled. Welcome back." };
  } catch (e) {
    console.error("[safety/delete-cancel]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

/* ============================================================
   SOFT DELETES
   ============================================================ */

export async function softDeleteOwnReel(reelId: string): Promise<SafetyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in." };
  const { error } = await supabase
    .from("reels")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", reelId)
    .eq("author_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/reels");
  return { ok: true, message: "Removed. You can restore within 90 days." };
}

export async function restoreReel(reelId: string): Promise<SafetyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in." };
  const { error } = await supabase
    .from("reels")
    .update({ deleted_at: null })
    .eq("id", reelId)
    .eq("author_id", user.id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/reels");
  return { ok: true, message: "Restored." };
}

/* ============================================================
   ADMIN: report queue + purge cron
   ============================================================ */

export async function adminResolveReport(input: {
  reportId: string;
  outcome: "actioned" | "dismissed" | "false";
  note?: string;
}): Promise<SafetyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { ok: false, message: "Admin only." };

  const service = createServiceClient();

  // Update parent report status.
  const status =
    input.outcome === "actioned"
      ? "actioned"
      : input.outcome === "dismissed"
        ? "dismissed"
        : "dismissed";
  const { error: rerr } = await service
    .from("reports")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      resolution_note: input.note ?? null,
    })
    .eq("id", input.reportId);
  if (rerr) return { ok: false, message: rerr.message };

  // Update all submission outcomes.
  await service
    .from("report_submissions")
    .update({ outcome: input.outcome })
    .eq("report_id", input.reportId);

  // If reviewer marks as false, bump the false-report count for each reporter.
  if (input.outcome === "false") {
    const { data: subs } = await service
      .from("report_submissions")
      .select("reporter_id")
      .eq("report_id", input.reportId);
    const reporterIds = Array.from(new Set((subs ?? []).map((s) => s.reporter_id)));
    for (const rid of reporterIds) {
      const { data: row } = await service
        .from("profiles")
        .select("false_report_count")
        .eq("id", rid)
        .maybeSingle();
      await service
        .from("profiles")
        .update({ false_report_count: (row?.false_report_count ?? 0) + 1 })
        .eq("id", rid);
    }
  }

  revalidatePath("/admin/reports");
  return { ok: true };
}
