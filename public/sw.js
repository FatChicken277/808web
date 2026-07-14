/* 808 Fest Check-in PWA — cachea /scan y assets para uso sin red */
const CACHE_VERSION = '808-scan-v2';
const PRECACHE = [
  '/scan',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const res = await fetch(url, { credentials: 'same-origin', cache: 'no-cache' });
            if (res.ok) await cache.put(url, res.clone());
          } catch {
            // Primera visita sin red: se cacheará en runtime después.
          }
        }),
      );
    }).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_astro/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/favicon.svg'
  );
}

function isScanNavigation(request, url) {
  if (request.mode !== 'navigate') return false;
  return url.pathname === '/scan' || url.pathname.startsWith('/scan/');
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    // Fallback explícito a /scan cacheada
    const shell = await cache.match('/scan');
    if (shell) return shell;
    return new Response('Sin conexión. Abre /scan una vez con internet para prepararlo.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  if (cached) {
    networkPromise.catch(() => {});
    return cached;
  }

  const fresh = await networkPromise;
  if (fresh) return fresh;
  return new Response('Asset no disponible offline', { status: 503 });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // APIs siempre a red (la app hace cola offline en localStorage)
  if (url.pathname.startsWith('/api/')) return;

  if (isScanNavigation(request, url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Background Sync: la página escucha y reintenta la cola
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-checkins') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'SYNC_CHECKINS' });
        }
      }),
    );
  }
});
