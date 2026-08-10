self.addEventListener('install', (event) => {
  console.log('Service worker installé');
  // Cache mis à jour à v5 pour forcer la réinstallation
  event.waitUntil(
    caches.open('fcis-cache-v6').then(cache => { 
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
        // NOUVEAU FICHIER AJOUTÉ
        'matchs.json' 
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
