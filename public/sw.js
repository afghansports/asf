/* ASF service worker — minimal install / fetch / cache strategy.
 *
 * Goals:
 *   1. Make the site installable (PWA criterion: a registered active SW).
 *   2. Serve a basic offline fallback for the homepage when the network fails.
 *   3. Never cache HTML aggressively — we're a server-rendered app, stale
 *      content would confuse users.
 *
 * This file lives in /public/sw.js because Next.js App Router doesn't ship
 * built-in SW tooling. Registered from <PwaRegister/> on the client.
 */

const CACHE_VERSION = "asf-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll([OFFLINE_URL, "/asf-logo-round.png"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Push notifications. Payload is JSON:
//   { title: string, body: string, url?: string, icon?: string, tag?: string }
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { title: "ASF", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "ASF";
  const opts = {
    body: data.body || "",
    icon: data.icon || "/asf-logo-round.png",
    badge: "/asf-logo-round.png",
    tag: data.tag || "asf-notification",
    data: { url: data.url || "/notifications" },
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  // Network-first for navigations with an offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL).then((r) => r || new Response("Offline", { status: 503 })))
    );
    return;
  }
  // Same-origin static assets: cache-first with network fallback.
  const url = new URL(req.url);
  if (url.origin === self.location.origin && /\.(?:png|jpe?g|gif|webp|svg|woff2?|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, clone)).catch(() => {});
        return res;
      }))
    );
  }
});
