// 1. IMPORTAÇÃO DO FIREBASE (Versão compatível com Service Worker)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js');

const CACHE_NAME = 'salgados-delicia-v13';

// Configuração do Firebase
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

// --- LÓGICA DE CACHE (Seu código original mantido) ---
self.addEventListener('install', (event) => {
  self.skipWaiting();
  const urlsToCache = [
      './',
      './index.html',
      './css/cliente.css',
      './css/adm.css',
      './img/icone-512.png',
      './img/icone-192.png'
  ];
  event.waitUntil(
      caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
      caches.keys().then((cacheNames) => {
          return Promise.all(
              cacheNames.map((cache) => {
                  if (cache !== CACHE_NAME) return caches.delete(cache);
              })
          );
      })
  );
  clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
      caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// --- LÓGICA DE NOTIFICAÇÃO EM SEGUNDO PLANO ---
let totalPedidosAntigo = -1;

db.ref('pedidos').on('value', (snapshot) => {
    const pedidos = snapshot.val();
    const ids = pedidos ? Object.keys(pedidos) : [];
    const totalAtual = ids.length;

    // Só dispara se o número de pedidos aumentar e não for a carga inicial
    if (totalPedidosAntigo !== -1 && totalAtual > totalPedidosAntigo) {
        const ultimoId = ids[ids.length - 1];
        const novoPedido = pedidos[ultimoId];
        
        self.registration.showNotification('🥟 Novo Pedido Chegou!', {
            body: `Cliente: ${novoPedido.cliente || 'Salgados'} - Total: R$ ${novoPedido.total?.toFixed(2)}`,
            icon: './img/icone-512.png',
            badge: './img/icone-512.png',
            vibrate: [200, 100, 200],
            tag: 'novo-pedido', // Evita notificações duplicadas
            data: { url: './paineladm.html' }
        });
    }
    totalPedidosAntigo = totalAtual;
});

// Ao clicar na notificação, abre o Painel ADM
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Se o painel já estiver aberto em alguma aba, foca nela
            for (const client of clientList) {
                if (client.url.includes('paineladm.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Se não, abre uma nova janela
            if (clients.openWindow) return clients.openWindow('./paineladm.html');
        })
    );
});