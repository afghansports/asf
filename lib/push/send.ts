/**
 * Web push send-side. Looks up the user's push subscriptions, signs each
 * payload with the platform VAPID key, and POSTs to the browser endpoint.
 *
 * Activates only when VAPID_PRIVATE_KEY + NEXT_PUBLIC_VAPID_PUBLIC_KEY are set.
 * Without them, sendNotificationToUser returns { ok: false, message: "vapid not configured" }
 * and the caller should fall back to email or in-app only.
 *
 * On 410 / 404 from the push service the subscription is dead — we delete it
 * so we don't keep retrying. Other failures are logged and the row is left in
 * place; a sweeper job can prune later if needed.
 */

import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/server";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
};

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:safeguarding@afghansportsfederation.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export async function sendNotificationToUser(
  userId: string,
  notificationId: string,
  payload: PushPayload,
): Promise<{ ok: true; sent: number } | { ok: false; message: string }> {
  if (!configure()) return { ok: false, message: "vapid not configured" };
  const supabase = createServiceClient();

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.error("[push/send] lookup", error);
    return { ok: false, message: "lookup failed" };
  }

  if (!subs || subs.length === 0) {
    return { ok: true, sent: 0 };
  }

  const json = JSON.stringify(payload);
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      const sub = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      try {
        await webpush.sendNotification(sub, json, { TTL: 60 * 60 * 24 });
        sent += 1;
        await supabase.from("push_deliveries").upsert(
          {
            notification_id: notificationId,
            endpoint: s.endpoint,
            status: "sent",
          },
          { onConflict: "notification_id,endpoint" },
        );
      } catch (e: unknown) {
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          // Subscription is dead — drop it.
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", s.endpoint);
          await supabase.from("push_deliveries").upsert(
            {
              notification_id: notificationId,
              endpoint: s.endpoint,
              status: "expired",
            },
            { onConflict: "notification_id,endpoint" },
          );
        } else {
          console.warn("[push/send] failed", status, (e as Error)?.message);
          await supabase.from("push_deliveries").upsert(
            {
              notification_id: notificationId,
              endpoint: s.endpoint,
              status: "failed",
            },
            { onConflict: "notification_id,endpoint" },
          );
        }
      }
    }),
  );

  return { ok: true, sent };
}
