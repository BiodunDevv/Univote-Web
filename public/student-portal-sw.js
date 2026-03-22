const CACHE_NAME = "univote-student-portal-v2";
const CORE_ASSETS = [
  "/student-portal.webmanifest",
  "/Darklogo.png",
  "/Whitelogo.png",
  "/students/login",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || !url.pathname.startsWith("/students")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const cacheable =
          request.mode === "navigate" ||
          url.pathname === "/students/login" ||
          CORE_ASSETS.includes(url.pathname);

        if (cacheable) {
          const clone = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }

        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        const cachedLogin = await caches.match("/students/login");
        if (cachedLogin) {
          return cachedLogin;
        }

        return new Response(
          "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Offline</title></head><body style=\"font-family:system-ui,sans-serif;padding:24px;background:#f8fafc;color:#0f172a;\"><h1 style=\"font-size:20px;margin-bottom:8px;\">You're offline</h1><p style=\"margin:0;line-height:1.5;\">Reconnect to continue using the student portal.</p></body></html>",
          {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
            },
          },
        );
      }),
  );
});
