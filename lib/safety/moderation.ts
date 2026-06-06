"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications/notify";

export type ModResult = { ok: true; message?: string } | { ok: false; message: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Not signed in." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { ok: false as const, message: "Admin access required." };
  return { ok: true as const, supabase: createServiceClient(), adminId: user.id };
}

/* ============================================================
   STRIKES
   ============================================================ */

export async function issueStrike(input: {
  userId: string;
  severity: "minor" | "moderate" | "severe" | "immediate_ban";
  reason: string;
  category?: string | null;
}): Promise<ModResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;

  const expiresAt =
    input.severity === "minor"
      ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      : input.severity === "moderate"
        ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        : null; // severe + immediate_ban never expire

  const { error } = await ctx.supabase.from("user_strikes").insert({
    user_id: input.userId,
    severity: input.severity,
    reason: input.reason,
    category: input.category ?? null,
    issued_by: ctx.adminId,
    expires_at: expiresAt?.toISOString() ?? null,
  });
  if (error) return { ok: false, message: error.message };

  await notify({
    userId: input.userId,
    type: "strike",
    body: `You received a ${input.severity} strike. Reason: ${input.reason}`,
    link: "/profile/edit",
  });

  // Auto-suspend on threshold.
  if (input.severity === "immediate_ban") {
    await ctx.supabase.from("user_suspensions").insert({
      user_id: input.userId,
      type: "permanent",
      reason: input.reason,
      issued_by: ctx.adminId,
    });
  } else {
    // Count active strikes in the last 90 days.
    const { count } = await ctx.supabase
      .from("user_strikes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    const n = count ?? 0;
    if (n >= 4) {
      await ctx.supabase.from("user_suspensions").insert({
        user_id: input.userId,
        type: "full",
        reason: "Auto-suspension: 4 strikes in 90 days.",
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        issued_by: ctx.adminId,
      });
    } else if (n >= 3) {
      await ctx.supabase.from("user_suspensions").insert({
        user_id: input.userId,
        type: "full",
        reason: "Auto-suspension: 3 strikes in 90 days.",
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        issued_by: ctx.adminId,
      });
    } else if (n >= 2) {
      await ctx.supabase.from("user_suspensions").insert({
        user_id: input.userId,
        type: "posting_only",
        reason: "Auto-suspension: 2 strikes in 90 days.",
        ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        issued_by: ctx.adminId,
      });
    }
  }

  revalidatePath("/admin/moderation");
  return { ok: true };
}

/* ============================================================
   SUSPENSIONS
   ============================================================ */

export async function issueSuspension(input: {
  userId: string;
  type: "posting_only" | "full" | "permanent";
  reason: string;
  durationDays: number | null; // null = permanent
}): Promise<ModResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;

  const ends_at =
    input.type === "permanent" || !input.durationDays
      ? null
      : new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await ctx.supabase.from("user_suspensions").insert({
    user_id: input.userId,
    type: input.type,
    reason: input.reason,
    ends_at,
    issued_by: ctx.adminId,
  });
  if (error) return { ok: false, message: error.message };

  await notify({
    userId: input.userId,
    type: "suspension",
    body: `Your account is suspended. Reason: ${input.reason}`,
    link: "/appeal",
  });

  revalidatePath("/admin/moderation");
  return { ok: true };
}

export async function liftSuspension(suspensionId: string): Promise<ModResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase
    .from("user_suspensions")
    .update({ lifted_at: new Date().toISOString() })
    .eq("id", suspensionId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/moderation");
  return { ok: true };
}

export async function setShadowBan(userId: string, value: boolean): Promise<ModResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ shadow_banned: value })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/users");
  revalidatePath("/admin/moderation");
  return { ok: true };
}

export async function setVerificationStatus(
  userId: string,
  status: "unverified" | "verified" | "official",
): Promise<ModResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;
  const { error } = await ctx.supabase
    .from("profiles")
    .update({ verification_status: status })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

/* ============================================================
   APPEALS
   ============================================================ */

export async function submitAppeal(input: {
  suspensionId: string;
  reasonText: string;
}): Promise<ModResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in." };
    if (input.reasonText.length < 20)
      return { ok: false, message: "Please write at least 20 characters." };

    // Make sure the suspension belongs to the user.
    const { data: s } = await supabase
      .from("user_suspensions")
      .select("user_id, lifted_at")
      .eq("id", input.suspensionId)
      .maybeSingle();
    if (!s || s.user_id !== user.id) return { ok: false, message: "Suspension not found." };
    if (s.lifted_at) return { ok: false, message: "This suspension has already been lifted." };

    const { error } = await supabase.from("ban_appeals").insert({
      user_id: user.id,
      suspension_id: input.suspensionId,
      reason_text: input.reasonText.trim(),
    });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/appeal");
    return {
      ok: true,
      message:
        "Appeal submitted. ASF moderators will review within 7 days. You will get a notification with the outcome.",
    };
  } catch (e) {
    console.error("[appeal/submit]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function resolveAppeal(input: {
  appealId: string;
  decision: "approved" | "denied";
  note?: string;
}): Promise<ModResult> {
  const ctx = await requireAdmin();
  if (!ctx.ok) return ctx;

  const { data: appeal } = await ctx.supabase
    .from("ban_appeals")
    .select("user_id, suspension_id")
    .eq("id", input.appealId)
    .maybeSingle();
  if (!appeal) return { ok: false, message: "Appeal not found." };

  const { error: aerr } = await ctx.supabase
    .from("ban_appeals")
    .update({
      status: input.decision,
      reviewed_by: ctx.adminId,
      reviewed_at: new Date().toISOString(),
      decision_note: input.note ?? null,
    })
    .eq("id", input.appealId);
  if (aerr) return { ok: false, message: aerr.message };

  if (input.decision === "approved" && appeal.suspension_id) {
    await ctx.supabase
      .from("user_suspensions")
      .update({ lifted_at: new Date().toISOString() })
      .eq("id", appeal.suspension_id);
  }

  await notify({
    userId: appeal.user_id,
    type: "suspension",
    body:
      input.decision === "approved"
        ? "Your appeal was approved. Your suspension is lifted."
        : `Your appeal was denied. ${input.note ?? ""}`.trim(),
    link: "/dashboard",
  });

  revalidatePath("/admin/appeals");
  return { ok: true };
}
