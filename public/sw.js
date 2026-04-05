const CACHE_NAME = "ps-entrena-v6";
const STATIC_CACHE = "ps-static-v6";

// Dashboard pages to cache for offline use
const DASHBOARD_PAGES = [
  "/dashboard",
  "/dashboard/plan",
  "/dashboard/entrenamiento",
  "/dashboard/progreso",
  "/dashboard/perfil",
  "/dashboard/ejercicios",
  "/dashboard/chat",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache API calls
  if (url.pathname.startsWith("/api/")) return;

  // Cache Next.js static assets (JS/CSS chunks) - cache-first
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

  // Cache icons and manifest - cache-first
  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.json") {
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

  // Dashboard pages - network-first with cache fallback
  const isDashboardPage = event.request.headers.get("accept")?.includes("text/html") &&
    DASHBOARD_PAGES.some((p) => url.pathname === p || url.pathname === p + "/");

  if (isDashboardPage) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline - serve from cache
          return caches.open(CACHE_NAME).then((cache) =>
            cache.match(event.request).then((cached) => {
              if (cached) return cached;
              // No cache available - return offline page
              return new Response(
                '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexion</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;text-align:center}.c{max-width:300px}.i{font-size:48px;margin-bottom:16px}.t{font-size:20px;font-weight:800;margin-bottom:8px}.s{color:#888;font-size:14px;margin-bottom:24px}.b{background:linear-gradient(135deg,#00f593,#00d97e);color:#000;font-weight:700;border:none;padding:12px 24px;border-radius:12px;font-size:14px;cursor:pointer}</style></head><body><div class="c"><div class="i">&#128268;</div><div class="t">Sin conexion</div><div class="s">Conectate a Internet para ver tu plan. Si ya cargaste la app antes, tus datos estan guardados.</div><button class="b" onclick="location.reload()">Reintentar</button></div></body></html>',
                { headers: { "Content-Type": "text/html" } }
              );
            })
          );
        })
    );
    return;
  }

  // Next.js data requests (_next/data) - network-first with cache
  if (url.pathname.startsWith("/_next/data/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.open(CACHE_NAME).then((cache) => cache.match(event.request))
            .then((cached) => cached || new Response("{}", { headers: { "Content-Type": "application/json" } }))
        )
    );
    return;
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const tag = "gym-bro-" + Date.now();

  event.waitUntil(
    // Check if any app window is currently visible
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const hasVisibleClient = windowClients.some((c) => c.visibilityState === "visible");

      // If app is open, tell the client to play sound (JS Audio works better)
      if (hasVisibleClient) {
        windowClients.forEach((client) => {
          client.postMessage({ type: "PUSH_RECEIVED", data: data });
        });
      }

      // Always show the system notification (even if app is open)
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
      // Focus existing window if found
      for (const client of windowClients) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});
