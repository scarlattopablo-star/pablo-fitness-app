const CACHE_NAME = "ps-entrena-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Network-only for API calls and HTML pages
  // Only cache static assets (icons, fonts)
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache API calls or HTML pages - always go to network
  if (url.pathname.startsWith("/api/") ||
      event.request.headers.get("accept")?.includes("text/html") ||
      url.pathname.startsWith("/_next/")) {
    return;
  }

  // Only cache static assets like icons
  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.json") {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
  }
});
