"use server";

import { createClient } from "@/lib/supabase/server";

export type PushResult = { ok: true } | { ok: false; message: string };

/**
 * Save a Web Push subscription. The browser registers the endpoint; we store
 * it server-side so the cron / notify pipeline can deliver pushes via the
 * Web Push protocol once VAPID keys are configured.
 */
export async function savePushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}): Promise<PushResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Sign in." };

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          user_agent: input.userAgent ?? null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (e) {
    console.error("[push/save]", e);
    return { ok: false, message: "Something went wrong." };
  }
}

export async function deletePushSubscription(endpoint: string): Promise<PushResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in." };
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
