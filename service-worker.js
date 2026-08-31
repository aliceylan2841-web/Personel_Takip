const CACHE_VERSION = 'mesai-takip-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './Icons/icon-48.png',
  './Icons/icon-72.png',
  './Icons/icon-96.png',
  './Icons/icon-128.png',
  './Icons/icon-144.png',
  './Icons/icon-152.png',
  './Icons/icon-192.png',
  './Icons/icon-384.png',
  './Icons/icon-512.png',
  './Icons/maskable-icon-192.png',
  './Icons/maskable-icon-512.png',
  './Icons/apple-touch-icon.png',
  './Icons/favicon-32.png',
  './Icons/favicon-16.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for app shell, network-first fallback for everything else, offline fallback to index.html
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
