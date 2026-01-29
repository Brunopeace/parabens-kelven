// 1. IMPORTAÇÕES compatíveis
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const CACHE_NAME = 'salgados-delicia-v25'; // Atualizei a versão do cache

const firebaseConfig = {
    apiKey: "AIzaSyDZII2LWg1D4usoWiWtwrvHsi--YxKSo3c",
    authDomain: "salgadosdelicia-b0032.firebaseapp.com",
    databaseURL: "https://salgadosdelicia-b0032-default-rtdb.firebaseio.com",
    projectId: "salgadosdelicia-b0032",
    storageBucket: "salgadosdelicia-b0032.firebasestorage.app",
    messagingSenderId: "273362591423",
    appId: "1:273362591423:web:1b179a8b9003df8d33300a"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// --- LÓGICA DE NOTIFICAÇÃO PUSH (Quando o navegador/celular recebe o aviso do Google) ---
messaging.onBackgroundMessage((payload) => {
    console.log('Push recebido em segundo plano:', payload);

    const notificationTitle = payload.notification.title || '🥟 Novo Pedido!';
    const notificationOptions = {
        body: payload.notification.body || 'Confira os detalhes no painel.',
        icon: './img/icone-512.png',
        badge: './img/icone-512.png',
        tag: 'novo-pedido-push', // Tag fixa evita que o celular fique "spamando" várias notificações
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { url: './paineladm.html' }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- LÓGICA DE CACHE (Para o PWA funcionar offline) ---
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(['./', './index.html', './css/adm.css', './img/icone-512.png', './paineladm.html']);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(cacheNames.map((cache) => {
                if (cache !== CACHE_NAME) return caches.delete(cache);
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Não cacheia chamadas do Firebase, apenas arquivos estáticos (CSS, Imagens)
    if (event.request.url.includes('firebase')) {
        return;
    }
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});

// --- AÇÃO AO CLICAR NA NOTIFICAÇÃO ---
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url.includes('paineladm.html') && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('./paineladm.html');
        })
    );
});
