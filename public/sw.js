const CACHE_NAME = "ps-entrena-v14";
const STATIC_CACHE = "ps-static-v14";

self.addEventListener("install", (event) => {
  // Activate immediately, don't wait
  self.skipWaiting();
  // Clear ALL old caches on install
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    ).catch(() => {}).then(() => self.clients.claim())
  );
});

// Cache-first, pero si Cache Storage falla por CUALQUIER motivo (storage
// corrupto, cuota llena, modo incógnito restringido) cae a red directa.
// Sin esto, un caches.open() roto devuelve 503 para todos los assets y
// la app queda en blanco.
function cacheFirst(request, cacheName) {
  return caches
    .open(cacheName)
    .then((cache) =>
      cache.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        });
      })
    )
    .catch(() => fetch(request));
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // ONLY cache static assets (JS/CSS chunks, icons). Never touch HTML navigation.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/sounds/")) {
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }

  // Everything else (HTML pages, API calls, etc) goes straight to network.
  // No caching, no interception. This prevents PWA loading issues.
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const tag = "gym-bro-" + Date.now();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const hasVisibleClient = windowClients.some((c) => c.visibilityState === "visible");

      // If app is open, tell the client to play sound
      if (hasVisibleClient) {
        windowClients.forEach((client) => {
          client.postMessage({ type: "PUSH_RECEIVED", data: data });
        });
      }

      return self.registration.showNotification(data.title || "Nuevo mensaje", {
        body: data.body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        vibrate: [200, 100, 200, 100, 200],
        tag: tag,
        renotify: true,
        silent: false,
        requireInteraction: !hasVisibleClient,
        data: { url: data.url || "/dashboard/chat" },
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.url || "/dashboard/chat";
  const fullUrl = self.location.origin + path;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If app already open, navigate existing window
      for (const client of windowClients) {
        if ("navigate" in client && "focus" in client) {
          return client.navigate(fullUrl).then(() => client.focus());
        }
      }
      // Otherwise open new window
      return clients.openWindow(fullUrl);
    })
  );
});
