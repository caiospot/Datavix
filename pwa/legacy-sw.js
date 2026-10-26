/* Datavix: service worker de limpeza. O app antigo morava na raiz deste endereço e guardava uma cópia dele para abrir offline.
 * Agora o app está em /app/ (e a raiz é o site). Este arquivo só apaga o que o antigo guardou e se desliga, sem guardar nada.
 * Não ativa sozinho: o app antigo avisa "Há uma versão nova" e a pessoa escolhe quando trocar (assim ninguém perde o que estava fazendo). */
self.addEventListener('install', () => {});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('datavix-')) await caches.delete(k);
    await self.registration.unregister();
  })());
});
