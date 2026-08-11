const CACHE_NAME = 'fcis-app-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Laisse passer les requêtes normalement
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
