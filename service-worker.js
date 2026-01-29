
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js');

const CACHE_NAME = 'salgados-delicia-v16'; // Versão atualizada para forçar refresh

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

// --- LÓGICA DE CACHE (Instalação e Ativação) ---
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
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});

// --- LÓGICA DE MONITORAMENTO E NOTIFICAÇÃO ---
let totalPedidosAntigo = null; // Iniciamos com null para capturar a carga inicial corretamente

db.ref('pedidos').on('value', (snapshot) => {
    const pedidos = snapshot.val();
    const ids = pedidos ? Object.keys(pedidos) : [];
    const totalAtual = ids.length;

    // Se for a primeira vez que o worker roda, ele apenas sincroniza o total e não notifica
    if (totalPedidosAntigo === null) {
        totalPedidosAntigo = totalAtual;
        return;
    }

    // Se houver novos pedidos (total atual maior que o antigo)
    if (totalAtual > totalPedidosAntigo) {
        const idsNovos = ids.slice(totalPedidosAntigo); // Pega apenas os novos IDs adicionados

        idsNovos.forEach(id => {
            const novoPedido = pedidos[id];
            const clienteTag = novoPedido.cliente ? novoPedido.cliente.toLowerCase().trim().replace(/\s+/g, '-') : 'geral';

            self.registration.showNotification('🥟 Novo Pedido Chegou!', {
                body: `Cliente: ${novoPedido.cliente || 'Salgados'}\nTotal: R$ ${novoPedido.total?.toFixed(2)}`,
                icon: './img/icone-512.png',
                badge: './img/icone-512.png',
                tag: clienteTag, // Agrupa se for o mesmo cliente
                renotify: true,  // Força o som padrão do sistema em cada atualização
                requireInteraction: true, // No Notebook, a notificação fica fixa até você clicar
                vibrate: [200, 100, 200], // Ajuda no Celular caso o som esteja baixo
                data: { url: './paineladm.html' }
            });
        });
    }
    
    // Atualiza o total antigo para a próxima mudança
    totalPedidosAntigo = totalAtual;
}, (error) => {
    console.error("Erro no Service Worker Firebase:", error);
});

// --- AÇÃO AO CLICAR NA NOTIFICAÇÃO ---
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Se o painel já estiver aberto, foca nele
            for (const client of clientList) {
                if (client.url.includes('paineladm.html') && 'focus' in client) return client.focus();
            }
            // Se estiver fechado, abre um novo
            if (clients.openWindow) return clients.openWindow('./paineladm.html');
        })
    );
});