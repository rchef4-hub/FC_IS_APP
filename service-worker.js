// service-worker.js

const CACHE_NAME = 'fcis-cache-v18';

// 1. Installation : enregistrement des fichiers de base
self.addEventListener('install', (event) => {
  console.log('Service Worker : Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        'index.html',
        'app.js',
        'manifest.json',
        'style.css',
        'FC_IS.jpg',
        'icon-192.png',
        'icon-512.png',
        'players.json',
        'dirigeants.json',
        'arbitres.json',
        'annonces.json',
        'matchs.json'
      ]);
    })
  );
  // Force le nouveau service worker à devenir actif immédiatement
  self.skipWaiting();
});

// 2. Activation : nettoyage des anciens caches (v17, v16, etc.)
self.addEventListener('activate', (event) => {
  console.log('Service Worker : Activation et nettoyage des anciens caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache :', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Récupération des données (Fetch)
// Stratégie : Réseau d'abord pour les fichiers JSON (pour avoir toujours les vrais scores/stats)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('.json')) {
    // Fichiers JSON : On cherche sur le réseau en priorité
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Si le réseau répond, on met à jour la copie locale en cache
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          // Si pas de réseau (hors-ligne), on utilise la version en cache
          return caches.match(event.request);
        })
    );
  } else {
    // Fichiers statiques (Images, CSS, JS) : Cache d'abord pour la rapidité
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});
