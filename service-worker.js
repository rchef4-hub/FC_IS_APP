// service-worker.js

const CACHE_NAME = 'fcis-cache-v19';

// 1. Installation : enregistrement des fichiers de base
self.addEventListener('install', (event) => {
  console.log('Service Worker v19 : Installation...');
  // Force le nouveau Service Worker à prendre la main immédiatement
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        'index.html',
        'app.js',
        'manifest.json',
        'style.css',
        'fc_is.jpg',
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
});

// 2. Activation : suppression définitive de TOUS les anciens caches (v17, v18, etc.)
self.addEventListener('activate', (event) => {
  console.log('Service Worker v19 : Nettoyage des anciens caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Suppression du cache obsolète :', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Prend le contrôle de tous les onglets ouverts tout de suite
  self.clients.claim();
});

// 3. Récupération des données (Fetch)
// Stratégie Network First : On va toujours chercher les fichiers JSON sur le réseau
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Si le réseau répond, on met à jour la copie en cache
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          // Si hors-ligne uniquement, secours sur le cache
          return caches.match(event.request);
        })
    );
  } else {
    // Fichiers statiques (Images, CSS, JS) : Cache d'abord
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});

// --- 4. GESTION DES NOTIFICATIONS PUSH ---

// Réception d'une notification push
self.addEventListener('push', function(event) {
  let data = { title: 'F.C. IS', body: 'Nouvelle actualité du club !', icon: '/icon-192.png' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur la notification (ouvre l'application)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});
