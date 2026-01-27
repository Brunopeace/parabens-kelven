const CACHE_NAME = 'salgados-delicia-v7';

self.addEventListener('install', (event) => {
  self.skipWaiting();

  const urlsToCache = [
      './',
      './index.html',
      './css/cliente.css',
      './css/adm.css',
      './img/icone-512.png',
      './img/icone-192.png',
      './js/cliente.js',
      './js/adm.js'
  ];

  event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => {
            console.log('Service Worker: Cache atualizado para subpasta');
            return cache.addAll(urlsToCache);
        })
  );
});

// No Activate, corrija o nome do cache para bater com o CACHE_NAME acima
self.addEventListener('activate', (event) => {
  event.waitUntil(
      caches.keys().then((cacheNames) => {
          return Promise.all(
              cacheNames.map((cache) => {
                  if (cache !== CACHE_NAME) { // Use a variável CACHE_NAME aqui
                      console.log('Service Worker: limpando cache antigo');
                      return caches.delete(cache);
                  }
              })
          );
      })
  );
  clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes("fcm.googleapis.com")) {
      return fetch(event.request);
  }

  event.respondWith(
      caches.match(event.request)
          .then((response) => {
              return response || fetch(event.request);
          })
          .catch(() => {
              // Ajuste o fallback para a URL correta da subpasta
              return caches.match('./index.html');
          })
  );
});