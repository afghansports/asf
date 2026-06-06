"use server";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * subscribeNewsletter — server action used by the Footer NewsletterForm.
 * Inserts into `newsletter_signups` (RLS allows insert by anon, but service
 * client is used so we get a clean unique-violation code without policy noise).
 *
 * Per ASF_LAUNCH_PRD.md > STEP 5 > Newsletter signup section: success message
 * inline; if email exists, "You are already subscribed."
 */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscribeResult = { ok: true; message: string } | { ok: false; message: string };

export async function subscribeNewsletter(rawEmail: string): Promise<SubscribeResult> {
  const email = (rawEmail ?? "").trim().toLowerCase();
  if (!EMAIL_RX.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("newsletter_signups")
      .insert({ email });

    if (error) {
      // 23505 = unique_violation in Postgres
      if (error.code === "23505") {
        return { ok: true, message: "You are already subscribed." };
      }
      console.error("[newsletter] insert failed:", error);
      return { ok: false, message: "Could not subscribe right now. Please try again." };
    }
    return { ok: true, message: "Thanks. You are on the list." };
  } catch (err) {
    console.error("[newsletter] unexpected:", err);
    return { ok: false, message: "Could not subscribe right now. Please try again." };
  }
}
