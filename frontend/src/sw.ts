/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, NetworkOnly } from "workbox-strategies";

precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
self.addEventListener("activate", () => self.clients.claim());

// TMDB posters/backdrops/logos: rarely change, cache aggressively.
registerRoute(
  ({ url }) => url.hostname === "image.tmdb.org",
  new CacheFirst({
    cacheName: "tmdb-images",
    plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true })],
  }),
);

// Read endpoints: serve fresh when online, fall back to last-seen data offline.
registerRoute(
  ({ url, request }) =>
    request.method === "GET" && (url.pathname.startsWith("/api/browse") || url.pathname.startsWith("/api/titles")),
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 4,
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 })],
  }),
);

// Everything that mutates state must always hit the network, never the cache.
registerRoute(({ request }) => request.method !== "GET", new NetworkOnly());

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

self.addEventListener("push", (event) => {
  let payload: PushPayload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title ?? "Marquee";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body ?? "You have a new update.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url ?? "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
