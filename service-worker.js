const CACHE_VERSION = 'mesai-takip-v2';
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

// App shell (index.html, manifest.json, navigasyon) her zaman ÖNCE İNTERNETTEN çekilir,
// böylece GitHub'a attığın güncellemeler bir sonraki açılışta hemen görünür.
// İnternet yoksa önbellekteki son kopya kullanılır (çevrimdışı çalışma için).
const NETWORK_FIRST_FILES = ['./index.html', './manifest.json', './'];

function isNetworkFirst(request) {
  if (request.mode === 'navigate') return true;
  return NETWORK_FIRST_FILES.some((f) => request.url.endsWith(f.replace('./', '/')) || request.url.endsWith(f));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (isNetworkFirst(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Statik dosyalar (ikonlar vb.) için önce önbellek, yoksa internetten çek ve önbelleğe ekle
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
