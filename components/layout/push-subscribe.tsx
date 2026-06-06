"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { savePushSubscription, deletePushSubscription } from "@/lib/push/actions";

/**
 * <PushSubscribe /> — small button to opt in / out of browser push
 * notifications. Renders nothing if the browser doesn't support Push or if
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY isn't set in env (the server can't sign pushes
 * without it, so subscribing would be useless).
 *
 * Drop into /notifications/preferences or /profile/edit > Account.
 */
export function PushSubscribe() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidPublicKey) {
      setSupported(false);
      return;
    }
    setSupported(true);
    setPermission(Notification.permission);
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setEndpoint(sub?.endpoint ?? null);
      });
    });
  }, [vapidPublicKey]);

  if (supported === null) return null;
  if (!supported) {
    return (
      <p className="text-xs text-asf-muted">
        Push notifications are not supported in this browser, or the platform admin has not configured a VAPID key yet.
      </p>
    );
  }

  async function subscribe() {
    setErr(null);
    setPending(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      const json = sub.toJSON();
      const r = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });
      if (!r.ok) {
        setErr(r.message);
        await sub.unsubscribe();
        return;
      }
      setEndpoint(sub.endpoint);
      setPermission(Notification.permission);
    } catch (e) {
      console.warn("[push] subscribe failed", e);
      setErr("Could not enable push. Check that notifications are not blocked in your browser settings.");
    } finally {
      setPending(false);
    }
  }

  async function unsubscribe() {
    setPending(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setEndpoint(null);
    } finally {
      setPending(false);
    }
  }

  const enabled = !!endpoint && permission === "granted";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={enabled ? unsubscribe : subscribe}
        disabled={pending}
        className={
          enabled
            ? "inline-flex items-center gap-2 h-9 px-3 rounded-md bg-asf-navy text-white text-xs font-condensed font-bold tracking-[0.18em] uppercase hover:bg-asf-navy-light"
            : "inline-flex items-center gap-2 h-9 px-3 rounded-md bg-white border border-asf-border text-asf-text text-xs font-condensed font-bold tracking-[0.18em] uppercase hover:bg-asf-off-2"
        }
      >
        {enabled ? <BellOff className="w-3.5 h-3.5" aria-hidden /> : <Bell className="w-3.5 h-3.5" aria-hidden />}
        {pending ? "Working" : enabled ? "Disable browser push" : "Enable browser push"}
      </button>
      {err ? <p className="text-xs text-asf-red">{err}</p> : null}
      {permission === "denied" ? (
        <p className="text-xs text-asf-muted">
          Notifications are blocked at the browser level. Update site permissions to enable.
        </p>
      ) : null}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}
