const CACHE_NAME = "ps-entrena-v8";
const STATIC_CACHE = "ps-static-v8";

self.addEventListener("install", (event) => {
  // Activate immediately, don't wait
  self.skipWaiting();
  // Clear ALL old caches on install
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
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
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // ONLY cache static assets (JS/CSS chunks, icons). Never touch HTML navigation.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/sounds/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
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
  const url = event.notification.data?.url || "/dashboard/chat";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
