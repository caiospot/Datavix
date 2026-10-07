/* Datavix: instalação como app (PWA). Só ativa em http(s) ou localhost; abrindo o arquivo direto (file://) o app segue normal, sem instalação. */
const DVCFG = window.__DV || {};
const pwaWeb = /^https?:$/.test(location.protocol);
let pwaPrompt = null;
const pwaStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const pwaCanInstall = () => !!pwaPrompt && !pwaStandalone();
function pwaRefreshBtn() { document.querySelectorAll('#pwa-btn,[data-pwa]').forEach(b => { b.hidden = !pwaCanInstall(); }); }
// iPhone/iPad não têm o aviso de instalação: a instalação é manual, pelo Safari (Compartilhar > Adicionar à Tela de Início)
const pwaIosCanAdd = () => pwaWeb && !window.__DV_NPS && /iPhone|iPad|iPod/.test(navigator.userAgent) && !pwaStandalone();
async function pwaInstall() {
  if (!pwaPrompt) return; const p = pwaPrompt; pwaPrompt = null; pwaRefreshBtn();
  try { p.prompt(); await p.userChoice; } catch (e) { /* o navegador recusou */ }
}
function pwaInit() {
  if (!pwaWeb || window.__DV_NPS) return; // em desenvolvimento (dev.html) não instala
  const add = (rel, href) => { const l = document.createElement('link'); l.rel = rel; l.href = href; document.head.appendChild(l); };
  add('manifest', 'manifest.webmanifest'); add('apple-touch-icon', 'icons/apple-touch-icon.png');
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pwaPrompt = e; pwaRefreshBtn(); });
  window.addEventListener('appinstalled', () => { pwaPrompt = null; pwaRefreshBtn(); toast(T('pwa_done')); });
  if (!('serviceWorker' in navigator)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; location.reload(); });
  navigator.serviceWorker.register('sw.js').then(reg => {
    const offer = w => toast(T('pwa_update'), { label: T('pwa_update_cta'), fn: async () => { if (!(await guard('new'))) return; w.postMessage('SKIP_WAITING'); } });
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); }); });
    setInterval(() => reg.update().catch(() => {}), 6 * 3600 * 1000); // quem deixa o app aberto também recebe a atualização
  }).catch(() => { /* sem service worker: o app funciona igual, só não abre offline */ });
}
