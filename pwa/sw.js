/* Datavix: service worker. Guarda o app (um HTML só, com tudo embutido) para abrir offline.
 * Não toca em nada que não seja do mesmo domínio: o envio do NPS e qualquer outro pedido externo passam direto. */
const BUILD = '__BUILD__', CACHE = 'datavix-' + BUILD;
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); }); // não ativa sozinho: o app avisa e a pessoa escolhe quando atualizar
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('datavix-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') { // abre na hora do cache; se houver rede, a próxima visita já traz a versão nova
    e.respondWith(caches.match('./index.html').then(hit => hit || fetch(req)).catch(() => fetch(req)));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
});
