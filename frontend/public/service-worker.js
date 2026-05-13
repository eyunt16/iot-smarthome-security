// Service Worker — v2 (safe passthrough, no stale-cache issues)
// Only caches navigation requests (index.html) for offline fallback.
// JS/CSS module requests are NEVER cached to prevent stale code.

const CACHE_NAME = 'iot-dashboard-cache-v2';
const PRECACHE = ['/index.html', '/manifest.json'];

self.addEventListener('install', event => {
  // Activate immediately, don't wait for old SW to die
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
});

self.addEventListener('activate', event => {
  // Delete all old caches (v1, etc.)
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // NEVER cache JS/TS/JSX module requests — let them hit the network
  if (
    url.pathname.includes('/src/') ||
    url.pathname.includes('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.css')
  ) {
    // Explicitly pass through to network — bare `return` causes TypeError.
    event.respondWith(fetch(event.request));
    return;
  }

  // Only cache navigation requests (HTML) for offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
  }
});

