// 1. IMPORTAÇÃO DO FIREBASE
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js');

const CACHE_NAME = 'salgados-delicia-v15';

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
const db = firebase.database();

// --- LÓGICA DE CACHE ---
self.addEventListener('install', (event) => {
  self.skipWaiting();
  const urlsToCache = ['./', './index.html', './css/cliente.css', './css/adm.css', './img/icone-512.png'];
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
      caches.keys().then((cacheNames) => {
          return Promise.all(cacheNames.map((cache) => {
              if (cache !== CACHE_NAME) return caches.delete(cache);
          }));
      })
  );
  clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});

// --- LÓGICA DE NOTIFICAÇÃO ---
let totalPedidosAntigo = -1;

db.ref('pedidos').on('value', (snapshot) => {
    const pedidos = snapshot.val();
    const ids = pedidos ? Object.keys(pedidos) : [];
    const totalAtual = ids.length;

    if (totalPedidosAntigo !== -1 && totalAtual > totalPedidosAntigo) {
        const ultimoId = ids[ids.length - 1];
        const novoPedido = pedidos[ultimoId];
        
        // Criamos uma tag baseada no nome do cliente para agrupar apenas os pedidos DELE
        const clienteTag = novoPedido.cliente ? novoPedido.cliente.toLowerCase().trim() : 'geral';

        self.registration.showNotification('🥟 Novo Pedido Chegou!', {
            body: `Cliente: ${novoPedido.cliente || 'Salgados'} - Total: R$ ${novoPedido.total?.toFixed(2)}`,
            icon: './img/icone-512.png',
            badge: './img/icone-512.png',
            // Removido o array de vibração para usar apenas o som padrão do sistema
            tag: clienteTag, 
            renotify: true, // Faz soar o alerta mesmo se o cliente já tiver uma notificação aberta
            data: { url: './paineladm.html' }
        });
    }
    totalPedidosAntigo = totalAtual;
});

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