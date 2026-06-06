"use server";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Public (unauthenticated) account-recovery submission for users who have lost
 * access to the email on their account. Writes via the service-role client so
 * the table needs no anon RLS policy. This NEVER changes an account on its own
 * — it only files a request an admin must verify and action.
 */

export type RecoveryResult = { ok: true } | { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitRecoveryRequest(input: {
  claimedUsername?: string;
  claimedEmail?: string;
  fullName?: string;
  newEmail: string;
  details?: string;
}): Promise<RecoveryResult> {
  const newEmail = (input.newEmail ?? "").trim().toLowerCase();
  const claimedUsername = (input.claimedUsername ?? "").trim();
  const claimedEmail = (input.claimedEmail ?? "").trim().toLowerCase();
  const fullName = (input.fullName ?? "").trim();
  const details = (input.details ?? "").trim();

  if (!EMAIL_RE.test(newEmail)) {
    return { ok: false, message: "Enter a valid email address that you can access." };
  }
  if (!claimedUsername && !claimedEmail) {
    return { ok: false, message: "Tell us your username or the old email that was on the account." };
  }
  if (details.length < 10) {
    return { ok: false, message: "Please add a few details so we can verify the account is yours." };
  }

  const supabase = createServiceClient();

  // Lightweight abuse guard: one pending request per destination email / hour.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("account_recovery_requests")
    .select("id", { count: "exact", head: true })
    .eq("new_email", newEmail)
    .eq("status", "pending")
    .gte("created_at", oneHourAgo);
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message: "A recovery request for this email is already pending. Our team will be in touch.",
    };
  }

  const { error } = await supabase.from("account_recovery_requests").insert({
    claimed_username: claimedUsername || null,
    claimed_email: claimedEmail || null,
    full_name: fullName || null,
    new_email: newEmail,
    details: details || null,
  });

  if (error) return { ok: false, message: "Something went wrong. Please try again later." };
  return { ok: true };
}
