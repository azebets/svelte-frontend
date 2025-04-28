const CACHE_NAME = 'crash-game-cache-v1';
const ASSETS_TO_CACHE = [
  '/images/',
  '/styles/',
  '/api/user/crash-game/history/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});