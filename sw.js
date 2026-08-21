// Nom de cache dynamique pour forcer le renouvellement à chaque modification de sw.js
const CACHE_NAME = 'fcis-v3-' + Date.now();

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './fc_is.png'
];

// 1. Installation du Service Worker et mise en cache initiale
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  // Forcer l'activation immédiate du nouveau Service Worker sans attendre la fermeture de l'onglet
  self.skipWaiting();
});

// 2. Activation et suppression automatique des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l'ancien cache :', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Prendre immédiatement le contrôle de tous les onglets/raccourcis ouverts
  self.clients.claim();
});

// 3. Interception des requêtes : Réseau en priorité (Network-First), Fallback sur le cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET (comme les requêtes API/GitHub Admin)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si le réseau répond avec succès, on met à jour la copie en cache
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si pas de réseau (hors-ligne), on retourne le fichier présent en cache
        return caches.match(event.request);
      })
  );
});
