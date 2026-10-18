// PWA em Chrome headless, com perfil novo do Chrome: (1) a primeira visita NÃO recarrega a página quando o service worker assume o controle;
// (2) uma versão nova do app aparece como aviso "Há uma versão nova", e só ao clicar em Atualizar a página recarrega e troca o cache.
// Uso: node test/pwa-update.mjs [pasta-do-site]   (padrão: dist/)
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname), SRC = path.resolve(process.argv[2] || path.join(ROOT, 'dist'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-pwa-')), SITE = path.join(TMP, 'site'), PORT = 8793, CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = [], bad = [], sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (k, v, extra) => { out.push(`${v ? 'ok    ' : 'FALHOU'} ${k}${extra ? ' · ' + extra : ''}`); if (!v) bad.push(k); };
const mime = { html: 'text/html; charset=utf-8', js: 'text/javascript', webmanifest: 'application/manifest+json', png: 'image/png' };
fs.cpSync(SRC, SITE, { recursive: true });
const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); const f = path.join(SITE, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.statusCode = 404; return s.end('404'); } s.setHeader('Content-Type', mime[f.split('.').pop()] || 'application/octet-stream'); s.setHeader('Cache-Control', 'no-cache'); fs.createReadStream(f).pipe(s); }).listen(PORT);
const dport = 9400 + Math.floor(Math.random() * 300), proc = spawn(CH, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${dport}`, `--user-data-dir=${TMP}/chrome`, 'about:blank'], { stdio: 'ignore' });
let ws;
try {
  let targets; for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${dport}/json`)).json(); if (targets.length) break; } catch (e) { /* subindo */ } await sleep(250); }
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
  let id = 0, navs = 0; const pend = new Map();
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Page.frameNavigated' && !d.params.frame.parentId) navs++; };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { for (let k = 0; k < 6; k++) { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result && r.result.result && !r.result.exceptionDetails && r.result.result.value !== undefined) return r.result.result.value; if (r.error || (r.result && r.result.exceptionDetails)) await sleep(500); else return undefined; } return undefined; }; // tenta de novo se a página estiver trocando
  const until = async (expr, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await ev(expr); if (v) return v; await sleep(300); } return null; };
  await send('Page.enable'); await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });

  // ---- 1) primeira visita
  const ctrl = await until('!!navigator.serviceWorker && !!navigator.serviceWorker.controller', 30000); await sleep(4000);
  ok('o service worker assume o controle da página na primeira visita', !!ctrl);
  ok('a primeira visita não recarrega a página (1 navegação)', navs === 1, `${navs} navegação(ões)`);
  const c1 = await ev(`(async () => { const k = (await caches.keys()).filter(x => /^datavix-/.test(x)); return JSON.stringify({ k, n: k.length ? (await (await caches.open(k[0])).keys()).length : 0 }); })()`), c1o = c1 ? JSON.parse(c1) : { k: [], n: 0 };
  ok('cache do app com 7 arquivos', c1o.k.length === 1 && c1o.n === 7, c1o.k.join());
  const oldName = c1o.k[0];

  // ---- 2) versão nova: aviso, e só recarrega quando a pessoa clica em Atualizar
  const swFile = path.join(SITE, 'sw.js'), sw = fs.readFileSync(swFile, 'utf8'), m = /const BUILD = '([^']*)'/.exec(sw);
  ok('sw.js traz o id do build', !!m, m ? m[1] : '');
  fs.writeFileSync(swFile, sw.replace(/const BUILD = '[^']*'/, "const BUILD = 'versaonova'"));
  await ev('navigator.serviceWorker.getRegistration().then(r => r.update()).then(() => 1)');
  const waiting = await until('navigator.serviceWorker.getRegistration().then(r => !!(r && r.waiting))', 20000);
  ok('a versão nova fica esperando (não ativa sozinha)', !!waiting);
  const navsBefore = navs;
  const toast = await until(`(() => { const t = document.getElementById('toast'); return t && t.querySelector('button') ? t.textContent : ''; })()`, 8000);
  ok('aparece o aviso "Há uma versão nova" com o botão Atualizar', !!toast && /versão nova|new version/i.test(toast), toast || '');
  await sleep(1500); ok('a página não recarrega enquanto a pessoa não clica', navs === navsBefore);
  await ev(`(() => { const b = document.querySelector('#toast button'); if (b) b.click(); return 1; })()`);
  const t0 = Date.now(); while (navs === navsBefore && Date.now() - t0 < 20000) await sleep(300);
  ok('ao clicar em Atualizar a página recarrega (2ª navegação)', navs === navsBefore + 1, `${navs} no total`);
  await until('!!navigator.serviceWorker.controller', 20000); await sleep(1500);
  const c2 = await ev(`caches.keys().then(k => JSON.stringify(k.filter(x => /^datavix-/.test(x))))`), k2 = c2 ? JSON.parse(c2) : [];
  ok('cache novo ativo e o antigo apagado', k2.join() === 'datavix-versaonova' && !k2.includes(oldName), k2.join());
} catch (e) { ok('execução sem erro', false, e.stack); }
finally { try { ws && ws.close(); } catch (e) { /* segue */ } proc.kill('SIGKILL'); srv.close(); await sleep(200); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* segue */ }
  console.log(out.join('\n')); console.log(bad.length ? `\nFALHOU: ${bad.length} verificação(ões)` : `\ntudo certo (${out.length} verificações)`); process.exit(bad.length ? 1 : 0); }
