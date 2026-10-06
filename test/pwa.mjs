// Testa o PWA em Chrome headless: manifesto, service worker, cache e abertura offline (servidor parado). Uso: node test/pwa.mjs
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
const mime = { html: 'text/html', js: 'text/javascript', webmanifest: 'application/manifest+json', png: 'image/png' };
const root = new URL('../dist/', import.meta.url).pathname;
let srv; const start = () => new Promise(r => { srv = http.createServer((q, s) => { const p = q.url.split('?')[0], f = root + (p === '/' ? 'index.html' : p.slice(1)); if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': mime[f.split('.').pop()] || 'text/plain' }); s.end(fs.readFileSync(f)); }).listen(8769, r); });
await start();
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', port = 9333 + Math.floor(Math.random() * 500);
const proc = spawn(CH, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/chr-pwa-${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch (e) {} await sleep(250); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(), logs = []; ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Runtime.consoleAPICalled') logs.push(d.params.type + ': ' + d.params.args.map(a => a.value ?? a.description).join(' ')); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.result.value;
await send('Runtime.enable'); await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });
const out = {};
await send('Page.navigate', { url: 'http://127.0.0.1:8769/' }); await sleep(6000);
out.manifest = await ev(`(async () => { const l = document.querySelector('link[rel=manifest]'); if (!l) return 'sem link'; const m = await (await fetch(l.href)).json(); return m.name + ' ' + m.display + ' ' + m.icons.length + ' icones'; })()`);
out.sw = await ev(`(async () => { const r = await navigator.serviceWorker.getRegistration(); return r ? (r.active ? 'ativo' : r.installing ? 'instalando' : 'registrado') : 'nenhum'; })()`);
out.cache = await ev(`(async () => { const ks = await caches.keys(); const c = ks.length ? await (await caches.open(ks[0])).keys() : []; return ks.join(',') + ' → ' + c.length + ' itens'; })()`);
out.title = await ev('document.title');
await send('Page.navigate', { url: 'http://127.0.0.1:8769/' }); await sleep(3500); // 2ª visita: já controlada pelo service worker
out.controlled = await ev('!!navigator.serviceWorker.controller');
srv.close(); srv.closeAllConnections && srv.closeAllConnections(); await sleep(500);
await send('Page.navigate', { url: 'http://127.0.0.1:8769/' }); await sleep(6000);
out.offlineBody = await ev(`document.body.innerText.slice(0, 60).replace(/\\n/g, ' ')`);
out.offlineApp = await ev(`!!window.__datavix || !!document.querySelector('.landing')`);
out.errs = logs.filter(l => /error/i.test(l)).slice(0, 5);
console.log(JSON.stringify(out, null, 1)); ws.close(); proc.kill('SIGKILL'); process.exit(0);
