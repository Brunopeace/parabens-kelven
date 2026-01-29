// service-worker.js

// 1. IMPORTAÇÕES (App, Database e agora Messaging para Push)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const CACHE_NAME = 'salgados-delicia-v8';

const firebaseConfig = {
    apiKey: "AIzaSyDZII2LWg1D4usoWiWtwrvHsi--YxKSo3c",
    authDomain: "salgadosdelicia-b0032.firebaseapp.com",
    databaseURL: "https://salgadosdelicia-b0032-default-rtdb.firebaseio.com",
    projectId: "salgadosdelicia-b0032",
    storageBucket: "salgadosdelicia-b0032.firebasestorage.app",
    messagingSenderId: "273362591423",
    appId: "1:273362591423:web:1b179a8b9003df8d33300a"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const messaging = firebase.messaging();

// --- LÓGICA DE NOTIFICAÇÃO PUSH (Quando o App está FECHADO) ---
messaging.onBackgroundMessage((payload) => {
    console.log('Push recebido em segundo plano:', payload);

    const notificationTitle = payload.notification.title || '🥟 Novo Pedido!';
    const notificationOptions = {
        body: payload.notification.body || 'Um novo pedido acabou de chegar.',
        icon: './img/icone-512.png',
        badge: './img/icone-512.png',
        tag: 'novo-pedido-push',
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { url: './paineladm.html' }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- LÓGICA DE MONITORAMENTO DB (Quando a aba está aberta/suspensa) ---
let totalPedidosAntigo = null;

db.ref('pedidos').on('value', (snapshot) => {
    const pedidos = snapshot.val();
    const ids = pedidos ? Object.keys(pedidos) : [];
    const totalAtual = ids.length;

    if (totalPedidosAntigo === null) {
        totalPedidosAntigo = totalAtual;
        return;
    }

    if (totalAtual > totalPedidosAntigo) {
        const idsNovos = ids.slice(totalPedidosAntigo);
        idsNovos.forEach(id => {
            const novoPedido = pedidos[id];
            const clienteTag = novoPedido.cliente ? novoPedido.cliente.toLowerCase().trim().replace(/\s+/g, '-') : 'geral';

            self.registration.showNotification('🥟 Pedido via Painel!', {
                body: `Cliente: ${novoPedido.cliente || 'Salgados'}\nTotal: R$ ${novoPedido.total?.toFixed(2)}`,
                icon: './img/icone-512.png',
                badge: './img/icone-512.png',
                tag: clienteTag,
                renotify: true,
                requireInteraction: true,
                data: { url: './paineladm.html' }
            });
        });
    }
    totalPedidosAntigo = totalAtual;
});

// --- LÓGICA DE CACHE (Instalação e Ativação) ---
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(['./', './index.html', './css/adm.css', './img/icone-512.png']);
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
    event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
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
