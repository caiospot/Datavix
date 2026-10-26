// Migração da raiz para /app/: quem já tinha o app na raiz (com service worker e cache) passa para o site novo sem perder nada.
// Monta o site ANTIGO (o app na raiz, como estava no ar em 18/out/2026: commit c90b28a ou o que você passar em --old=) com git archive, abre num Chrome de perfil novo,
// troca a pasta servida pelo site NOVO (dist/) e confere: o service worker antigo oferece "Há uma versão nova" sem recarregar sozinho, ao aceitar
// o cache antigo some e o service worker se desliga, a raiz vira a landing, /app/ abre o app (service worker com escopo /app/) e os dados do navegador seguem lá.
// Uso: node test/migration-sw.mjs [--old=commit]   (precisa do dist/ novo: node build.mjs)
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname), NEW = path.join(ROOT, 'dist'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-mig-'));
const OLDREV = (process.argv.find(a => a.startsWith('--old=')) || '').slice(6) || 'c90b28a', PORT = 8795, CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = [], bad = [], sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (k, v, extra) => { out.push(`${v ? 'ok    ' : 'FALHOU'} ${k}${extra ? ' · ' + extra : ''}`); if (!v) bad.push(k); };
const sh = (cmd, args, opt = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opt });
const mime = { html: 'text/html; charset=utf-8', js: 'text/javascript', webmanifest: 'application/manifest+json', png: 'image/png', webp: 'image/webp', woff2: 'font/woff2', svg: 'image/svg+xml', txt: 'text/plain', xml: 'application/xml', ico: 'image/x-icon' };
let current = null, srv = null, proc = null, ws = null;
try {
  // 1) o site antigo: o commit publicado, montado como o GitHub Actions monta (sem NPS)
  const OLDSRC = path.join(TMP, 'old-src'); fs.mkdirSync(OLDSRC);
  const ar = sh('sh', ['-c', `git -C "${ROOT}" archive ${OLDREV} | tar -x -C "${OLDSRC}"`]); ok(`git archive do site antigo (${OLDREV})`, ar.status === 0 && fs.existsSync(path.join(OLDSRC, 'build.mjs')), (ar.stderr || '').trim());
  const bo = sh('node', ['build.mjs'], { cwd: OLDSRC, env: { ...process.env, DATAVIX_HOST: 'hostinger', DATAVIX_SITE: 'datavix.app', DATAVIX_NPS_URL: '', DATAVIX_NPS_TOKEN: '' } });
  const OLD = path.join(OLDSRC, 'dist'); ok('build do site antigo (app na raiz)', bo.status === 0 && fs.existsSync(path.join(OLD, 'index.html')) && !fs.existsSync(path.join(OLD, 'app')) && /const BUILD/.test(fs.readFileSync(path.join(OLD, 'sw.js'), 'utf8')), (bo.stderr || '').trim().split('\n').pop());
  ok('o site novo está montado (dist/ com a landing na raiz e o app em /app/)', fs.existsSync(path.join(NEW, 'app/index.html')) && fs.existsSync(path.join(NEW, 'index.html')) && /unregister\(\)/.test(fs.readFileSync(path.join(NEW, 'sw.js'), 'utf8')));
  current = OLD;
  srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); let f = path.join(current, decodeURIComponent(u.pathname)); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) { if (!u.pathname.endsWith('/')) { s.statusCode = 301; s.setHeader('Location', u.pathname + '/'); return s.end(); } f = path.join(f, 'index.html'); }
    if (!fs.existsSync(f)) { s.statusCode = 404; return s.end('404'); } s.setHeader('Content-Type', mime[f.split('.').pop()] || 'application/octet-stream'); s.setHeader('Cache-Control', 'no-cache'); fs.createReadStream(f).pipe(s); }).listen(PORT, '127.0.0.1');

  // 2) Chrome de perfil novo
  const dport = 9500 + Math.floor(Math.random() * 300); proc = spawn(CH, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${dport}`, `--user-data-dir=${TMP}/chrome`, 'about:blank'], { stdio: 'ignore' });
  let targets; for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${dport}/json`)).json(); if (targets.length) break; } catch (e) { /* subindo */ } await sleep(250); }
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
  let id = 0, navs = 0; const pend = new Map();
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Page.frameNavigated' && !d.params.frame.parentId) navs++; };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { for (let k = 0; k < 6; k++) { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result && r.result.result && !r.result.exceptionDetails && r.result.result.value !== undefined) return r.result.result.value; if (r.error || (r.result && r.result.exceptionDetails)) await sleep(500); else return undefined; } return undefined; };
  const until = async (expr, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await ev(expr); if (v) return v; await sleep(300); } return null; };
  const cacheInfo = `(async () => { const k = (await caches.keys()).filter(x => /^datavix-/.test(x)); const n = []; for (const x of k) n.push((await (await caches.open(x)).keys()).length); return JSON.stringify({ k, n }); })()`;
  await send('Page.enable'); await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });

  // 3) o app antigo na raiz: service worker, cache de 7 arquivos e dados do navegador
  ok('site antigo: o service worker assume a raiz', !!(await until('!!navigator.serviceWorker && !!navigator.serviceWorker.controller', 30000))); await sleep(2500);
  const c0 = JSON.parse(await ev(cacheInfo) || '{"k":[],"n":[]}'); ok('site antigo: cache datavix-… com 7 arquivos', c0.k.length === 1 && c0.n[0] === 7, c0.k.join());
  ok('site antigo: a raiz é o app (landing do produto com o formulário de e-mail)', !!(await ev(`document.title === 'Datavix' && document.body.innerText.length > 300 && !!document.querySelector('.lp')`)));
  await ev(`(async () => { localStorage.setItem('dv-signup', JSON.stringify({ email: 'teste@example.com', ts: 1 })); localStorage.setItem('dv-mig-marker', 'ficou'); await new Promise((res, rej) => { const r = indexedDB.open('dv-mig-test', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => { const t = r.result.transaction('s', 'readwrite'); t.objectStore('s').put('projeto salvo', 'p1'); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }; r.onerror = () => rej(r.error); }); return 1; })()`);
  const navs0 = navs;

  // 4) a hospedagem passa a servir o site novo; o navegador confere o service worker
  current = NEW;
  await ev('navigator.serviceWorker.getRegistration().then(r => r.update()).then(() => 1)');
  ok('site novo: o service worker de limpeza fica esperando (o antigo continua no comando)', !!(await until('navigator.serviceWorker.getRegistration().then(r => !!(r && r.waiting))', 20000)));
  const toast = await until(`(() => { const t = document.getElementById('toast'); return t && t.querySelector('button') ? t.textContent : ''; })()`, 8000);
  ok('o app antigo avisa "Há uma versão nova" com o botão Atualizar', !!toast && /versão nova|new version/i.test(toast), toast || '');
  await sleep(1500); ok('a página aberta não recarrega sozinha (ninguém perde o que está fazendo)', navs === navs0, `${navs - navs0} navegação(ões)`);
  const c1 = JSON.parse(await ev(cacheInfo) || '{"k":[],"n":[]}'); ok('até a pessoa aceitar, o cache antigo continua (abre offline como antes)', c1.k.length === 1 && c1.n[0] === 7);

  // 5) a pessoa clica em Atualizar: o cache antigo é apagado, o service worker se desliga e a página recarrega
  await ev(`(() => { const b = document.querySelector('#toast button'); if (b) b.click(); return 1; })()`);
  const t0 = Date.now(); while (navs === navs0 && Date.now() - t0 < 20000) await sleep(300);
  ok('ao clicar em Atualizar a página recarrega uma vez', navs === navs0 + 1, `${navs - navs0} navegação(ões)`);
  await sleep(2500);
  ok('a raiz agora é a landing estática (título novo, sem o app e sem formulário de e-mail)', !!(await until(`/planilha em gráficos animados/i.test(document.title) && !document.querySelector('.lp') && !!document.querySelector('main h1')`, 15000)), await ev('document.title'));
  const c2 = JSON.parse(await ev(cacheInfo) || '{"k":[1],"n":[]}'); ok('o cache antigo foi apagado', c2.k.length === 0, c2.k.join());
  ok('nenhum service worker sobrou na raiz (se desligou)', await until(`navigator.serviceWorker.getRegistrations().then(r => r.length === 0)`, 15000));
  ok('a landing só tem, no máximo, o service worker de limpeza como controlador (nunca o do app antigo)', await ev(`!navigator.serviceWorker.controller || /\\/sw\\.js$/.test(navigator.serviceWorker.controller.scriptURL)`));
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/en/` }); await sleep(2500);
  ok('numa nova visita à landing em inglês não há service worker nenhum', await ev(`document.title.startsWith('Datavix: turn spreadsheets') && !navigator.serviceWorker.controller`));
  ok('os dados do navegador continuam aí (localStorage e IndexedDB são do endereço, não da pasta)', await ev(`(async () => localStorage.getItem('dv-mig-marker') === 'ficou' && JSON.parse(localStorage.getItem('dv-signup')).email === 'teste@example.com' && await new Promise(res => { const r = indexedDB.open('dv-mig-test', 1); r.onsuccess = () => { const q = r.result.transaction('s').objectStore('s').get('p1'); q.onsuccess = () => res(q.result === 'projeto salvo'); }; r.onerror = () => res(false); }))()`));

  // 6) o link da landing leva a /app/: o app novo abre, instala o service worker com escopo /app/ e o cache novo
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` }); await sleep(1500);
  const href = await ev(`document.querySelector('.act .btn').getAttribute('href')`); ok('o botão do topo da landing aponta para /app/', href === '/app/', href);
  const n2 = navs; await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/app/` });
  ok('/app/ abre o app (título Datavix e a landing do produto)', !!(await until(`document.title === 'Datavix' && document.body.innerText.length > 300 && !!document.querySelector('.lp')`, 30000)));
  ok('/app/: o service worker novo assume o escopo /app/', !!(await until(`navigator.serviceWorker.getRegistration().then(r => !!(r && r.active && r.scope.endsWith('/app/') && navigator.serviceWorker.controller))`, 30000)), await ev(`navigator.serviceWorker.getRegistrations().then(r => r.map(x => x.scope).join())`));
  await sleep(3500); const c3 = JSON.parse(await ev(cacheInfo) || '{"k":[],"n":[]}'); ok('/app/: cache datavix-… com 7 arquivos e uma só versão', c3.k.length === 1 && c3.n[0] === 7 && c3.k[0] !== c0.k[0], c3.k.join());
  ok('/app/: a primeira visita não recarrega a página', navs - n2 === 1, `${navs - n2} navegação(ões)`);
  ok('/app/: o localStorage da raiz é o mesmo (o e-mail do cadastro continua lembrado)', await ev(`JSON.parse(localStorage.getItem('dv-signup')).email === 'teste@example.com'`));
  ok('/app/ não registra service worker na raiz', await ev(`navigator.serviceWorker.getRegistrations().then(r => r.every(x => x.scope.endsWith('/app/')))`));
} catch (e) { ok('execução sem erro', false, e.stack); }
finally { try { ws && ws.close(); } catch (e) { /* segue */ } if (proc) proc.kill('SIGKILL'); if (srv) srv.close(); await sleep(300); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* segue */ }
  console.log(out.join('\n')); console.log(bad.length ? `\nFALHOU: ${bad.length} verificação(ões)` : `\ntudo certo (${out.length} verificações)`); process.exitCode = bad.length ? 1 : 0; }
