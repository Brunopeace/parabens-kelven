const CACHE_NAME = 'salgados-delicia-cliente-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/cliente.css', // Verifique se o nome do seu CSS está correto
    './css/adm.css',
    './firebase-messaging-sw.js',
    './js/cliente.js',   // Verifique se o nome do seu JS está correto
    './img/icone-512.png',
    './img/icone-192.png',
    './img/logo.png'
];

// Instalação: Salva arquivos essenciais no cache
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Estratégia de Fetch: Tenta o Cache primeiro, se não tiver, vai na rede
self.addEventListener('fetch', (event) => {
    // Não cacheia chamadas para o Firebase (banco de dados)
    if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
