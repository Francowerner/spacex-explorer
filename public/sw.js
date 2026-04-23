// SpaceX Explorer service worker.
// Strategy:
//   - Precache minimal app shell on install.
//   - Runtime: network-first for SpaceX API (GET + POST /launches/query), cache as fallback
//     when offline. Stale-while-revalidate was causing stale list data after filter changes
//     because the client only sees the first (cached) response.
//   - Navigation: network-first with cache fallback so pages work offline after first visit.
//   - Favorites are already persisted in localStorage; this SW makes the *list/detail data* also
//     available offline so the Favorites page can render cards even with no network.

// Bump when changing caching rules so clients drop old Cache Storage entries.
const VERSION = "spacex-explorer-v2";
const APP_SHELL_CACHE = `${VERSION}-shell`;
const API_CACHE = `${VERSION}-api`;
const PAGE_CACHE = `${VERSION}-pages`;

const SHELL_URLS = ["/", "/favorites", "/stats", "/compare"];
const API_ORIGIN = "https://api.spacexdata.com";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

async function hashBody(body) {
  if (!body) return "empty";
  try {
    const buf = new TextEncoder().encode(body);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "nohash";
  }
}

async function postCacheKey(request) {
  const clone = request.clone();
  const body = await clone.text();
  const hash = await hashBody(body);
  return new Request(`${request.url}#body=${hash}`, { method: "GET" });
}

async function networkFirstApi(event) {
  const { request } = event;
  const cache = await caches.open(API_CACHE);
  const keyRequest =
    request.method === "POST" ? await postCacheKey(request) : request;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      try {
        await cache.put(keyRequest, response.clone());
      } catch {
        // Quota exceeded or opaque — ignore.
      }
    }
    return response;
  } catch {
    const cached = await cache.match(keyRequest);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function networkFirstPage(event) {
  const { request } = event;
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      try {
        await cache.put(request, response.clone());
      } catch {
        /* ignore */
      }
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await caches.open(APP_SHELL_CACHE);
    const fallback = await shell.match("/");
    if (fallback) return fallback;
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === API_ORIGIN) {
    // Only cache GET and the /launches/query POST that drives the list.
    const isQueryPost =
      request.method === "POST" && url.pathname.endsWith("/query");
    if (request.method === "GET" || isQueryPost) {
      event.respondWith(networkFirstApi(event));
      return;
    }
    return; // other methods: passthrough
  }

  if (request.method !== "GET") return;

  // Cross-origin images (Flickr, imgur, patches) — cache-first.
  if (request.destination === "image" && url.origin !== self.location.origin) {
    event.respondWith(
      caches.open(`${VERSION}-img`).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && (response.ok || response.type === "opaque")) {
            try {
              await cache.put(request, response.clone());
            } catch {
              /* ignore quota */
            }
          }
          return response;
        } catch {
          return cached ?? Response.error();
        }
      }),
    );
    return;
  }

  // Same-origin navigations and pages.
  if (request.mode === "navigate" || (url.origin === self.location.origin && request.destination === "document")) {
    event.respondWith(networkFirstPage(event));
    return;
  }

  // Only immutable hashed build assets are safe for cache-first. Caching every
  // same-origin GET breaks Next.js App Router (RSC/flight fetches) and causes
  // stale UI, filters that "don't work", and mismatched client state in prod.
  const isHashedStatic =
    url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");
  if (isHashedStatic) {
    event.respondWith(
      caches.open(`${VERSION}-static`).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            try {
              await cache.put(request, response.clone());
            } catch {
              /* ignore */
            }
          }
          return response;
        } catch {
          return cached ?? Response.error();
        }
      }),
    );
  }
});
