// firebase-messaging-sw.js

// 1. IMPORTAÇÕES (Apenas o necessário para Push)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const CACHE_NAME = 'salgados-push-v2';

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
const messaging = firebase.messaging();

// --- LÓGICA DE NOTIFICAÇÃO PUSH (Segundo Plano) ---
// Esta função é chamada quando o "robô" (Cloud Function) envia uma mensagem
messaging.onBackgroundMessage((payload) => {
    console.log('Push recebido em segundo plano:', payload);

    const notificationTitle = payload.notification.title || '🥟 Novo Pedido!';
    const notificationOptions = {
        body: payload.notification.body || 'Confira os detalhes no painel.',
        icon: './img/icone-512.png',
        badge: './img/icone-512.png',
        tag: 'novo-pedido-push', // A tag impede que o celular empilhe várias notificações iguais
        renotify: true,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { url: './paineladm.html' }
    };

    // Só mostra se o payload não for vazio
    if (payload.notification) {
        self.registration.showNotification(notificationTitle, notificationOptions);
    }
});

// --- LÓGICA DE INSTALAÇÃO ---
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// --- AÇÃO AO CLICAR NA NOTIFICAÇÃO ---
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Se o painel já estiver aberto, foca nele
            for (const client of clientList) {
                if (client.url.includes('paineladm.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Se não, abre o painel
            if (clients.openWindow) {
                return clients.openWindow('./paineladm.html');
            }
        })
    );
});