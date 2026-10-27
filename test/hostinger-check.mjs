// Hospedagem (Hostinger, Apache/LiteSpeed): confere o build antes de subir. Uso: node test/hostinger-check.mjs [--dist=PASTA] [--csp-all] [--url=https://datavix.app]
// --dist=PASTA confere um site já montado (por exemplo, a branch hostinger clonada) em vez de fazer o build.
// --url=https://datavix.app confere o site NO AR (só leitura: cabeçalhos, redirecionamentos, arquivos que não podem sobrar e a primeira visita no Chrome; não envia cadastro nem NPS).
// 1) copia as fontes para uma pasta temporária e faz o build como o GitHub Actions faz (DATAVIX_HOST=hostinger, DATAVIX_SITE=datavix.app, sem .env.local);
// 2) sobe um Apache 2.4 local (o do macOS) lendo o .htaccess gerado e confere cabeçalhos, cache, compressão e redirecionamentos;
// 3) abre a landing (/) e o app (/app/) no Chrome headless atrás de um proxy que simula o HTTPS da Hostinger e confere: sem violação de CSP, fontes carregadas, sem service worker na landing,
//    service worker ativo com escopo /app/, cache do app, política de privacidade falando da Hostinger. O LiteSpeed da Hostinger é compatível com o Apache, mas a conferência final é no site no ar (--url=).
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-host-')), SRC = path.join(TMP, 'src'), DIST = path.join(SRC, 'dist'), AP = path.join(TMP, 'apache');
const APORT = 8771, PPORT = 8772, out = [], bad = [];
const ok = (k, v, extra) => { out.push(`${v ? 'ok    ' : 'FALHOU'} ${k}${extra ? ' · ' + extra : ''}`); if (!v) bad.push(k); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let apache = false, proxy = null;
const sh = (cmd, args, opt = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opt });

function req(p, headers = {}, port = APORT) {
  return new Promise((res, rej) => {
    const r = http.request({ host: '127.0.0.1', port, path: p, method: 'GET', headers: { 'accept-encoding': 'identity', ...headers } }, resp => { const ch = []; resp.on('data', c => ch.push(c)); resp.on('end', () => res({ status: resp.statusCode, h: resp.headers, body: Buffer.concat(ch) })); });
    r.on('error', rej); r.end();
  });
}

const PROBE = `(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)), d = {}; const step = async (n, f) => { try { d[n] = await f(); } catch (e) { d[n] = 'ERRO ' + String(e && (e.stack || e.message || e)); } };
  if (!navigator.serviceWorker) return JSON.stringify({ title: document.title, nosw: true, url: location.href, secure: window.isSecureContext, body: document.body ? document.body.innerText.slice(0, 120) : '' });
  let reg = null; await step('ready', async () => { reg = await Promise.race([navigator.serviceWorker.ready, sl(30000).then(() => null)]); return !!reg; });
  await step('cache', async () => { const keys = await caches.keys(), ck = keys.find(k => /^datavix-/.test(k)); return { ck: ck || null, items: ck ? (await (await caches.open(ck)).keys()).length : 0 }; });
  await step('priv', async () => { LANG = 'pt'; const pt = privBody(); LANG = 'en'; const en = privBody(); LANG = 'pt'; return { ptHostinger: /servido pela Hostinger/.test(pt), ptGithub: /GitHub Pages/.test(pt), enHostinger: /served by Hostinger/.test(en), enGithub: /GitHub Pages/.test(en) }; });
  const c = d.cache && d.cache.ck !== undefined ? d.cache : { ck: null, items: 0 };
  return JSON.stringify({ title: document.title, landing: document.body.innerText.length > 200, sw: !!(reg && reg.active), swState: reg && reg.active && reg.active.state, cache: c.ck, items: c.items, scope: reg && reg.scope, priv: d.priv, err: Object.fromEntries(Object.entries(d).filter(([k, v]) => typeof v === 'string' && v.startsWith('ERRO'))) }); })()`;
const LANDPROBE = `(async () => { await document.fonts.ready; return JSON.stringify({ title: document.title, h1: (document.querySelector('h1') || {}).textContent, lang: document.documentElement.lang, sw: !!(navigator.serviceWorker && navigator.serviceWorker.controller), regs: navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : 0, geist: document.fonts.check('16px Geist'), mono: document.fonts.check('16px "Geist Mono"'), imgs: [...document.images].every(i => !i.complete || i.naturalWidth > 0), noScroll: document.documentElement.scrollWidth <= document.documentElement.clientWidth, links: document.querySelectorAll('a[href]').length, ext: [...document.querySelectorAll('img[src],script[src],iframe[src],link[rel~=stylesheet],link[rel~=preload],link[rel~=icon],link[rel~=manifest]')].filter(e => /^https?:/.test(e.src || e.href || '') && !(e.src || e.href).startsWith(location.origin)).length }); })()`;
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// abre a página num Chrome headless de perfil novo (primeira visita), espera o service worker assumir e a página assentar, e roda a sonda uma vez
async function chromeProbe(url, expr, { sw = true } = {}) {
  const dport = 9400 + Math.floor(Math.random() * 300), proc = spawn(CH, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${dport}`, `--user-data-dir=${path.join(TMP, 'chrome-' + dport)}`, 'about:blank'], { stdio: 'ignore' });
  let ws; const viol = [], res = { pg: null, viol, navs: 0, err: '' };
  try {
    let targets; for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${dport}/json`)).json(); if (targets.length) break; } catch (e) { /* subindo */ } await sleep(250); }
    ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
    let id = 0; const pend = new Map(), CSP_RE = /Content Security Policy|Refused to|violates the following/i;
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); return; }
      if (d.method === 'Page.frameNavigated' && !d.params.frame.parentId) res.navs++;
      else if (d.method === 'Log.entryAdded' && CSP_RE.test(d.params.entry.text || '')) viol.push(d.params.entry.text.slice(0, 200));
      else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') { const t = d.params.args.map(a => a.value ?? a.description ?? '').join(' '); if (CSP_RE.test(t)) viol.push(t.slice(0, 200)); } };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async e => { for (let k = 0; k < 8; k++) { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result && r.result.result && !r.result.exceptionDetails && r.result.result.value !== undefined) return r.result.result.value; await sleep(600); } return undefined; }; // tenta de novo se a página estiver trocando
    await send('Page.enable'); await send('Log.enable'); await send('Runtime.enable'); await send('Page.navigate', { url });
    const t0 = Date.now(); while (sw && Date.now() - t0 < 30000) { if (await ev('!!navigator.serviceWorker && !!navigator.serviceWorker.controller')) break; await sleep(400); }
    await sleep(sw ? 4000 : 2500); // a página assenta (sites montados antes da correção recarregam uma vez ao assumir o service worker)
    const v = await ev(expr); res.pg = v ? JSON.parse(v) : null; if (!res.pg) res.err = 'a sonda não respondeu';
  } catch (e) { res.err = String(e && e.stack || e); }
  finally { try { ws && ws.close(); } catch (e) { /* segue */ } proc.kill('SIGKILL'); }
  return res;
}


// ---------------------------------------------------------------- site no ar (--url=): só leitura
async function live(base) {
  const u = new URL(base), apex = u.hostname.replace(/^www\./, '');
  const get = (host, p, { proto = 'https:', headers = {} } = {}) => new Promise((res, rej) => {
    const m = proto === 'https:' ? https : http, r = m.request({ host, port: proto === 'https:' ? 443 : 80, path: p, method: 'GET', headers: { host, 'accept-encoding': 'identity', ...headers }, timeout: 30000 }, resp => { const ch = []; resp.on('data', c => ch.push(c)); resp.on('end', () => res({ status: resp.statusCode, h: resp.headers, body: Buffer.concat(ch) })); });
    r.on('timeout', () => r.destroy(new Error('tempo esgotado'))); r.on('error', rej); r.end(); });
  const safe = async (...a) => { try { return await get(...a); } catch (e) { return { status: 0, h: {}, body: Buffer.alloc(0), err: String(e.message || e) }; } };
  const CDN = /^upgrade-insecure-requests;?$/, loc = r => r.h.location || r.err || '';   // a CDN da Hostinger soma "upgrade-insecure-requests" à CSP, o que é inofensivo
  const metaCsp = h => (/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(h) || [])[1] || '';
  const noApp = r => !(r.h['content-security-policy'] || '').trim() || CDN.test((r.h['content-security-policy'] || '').trim());
  let r = await safe(apex, '/'), html = r.body.toString('utf8');
  ok('GET / responde 200 em HTML (hoje: ' + r.status + ')', r.status === 200 && /^text\/html/.test(r.h['content-type'] || ''), r.err || `${r.status} ${r.h['content-type'] || ''}`);
  ok('GET / é a landing (h1 e canonical em ' + apex + '), e não mais o app', /<h1>/.test(html) && html.includes(`<link rel="canonical" href="https://${apex}/">`) && !/window\.__DV=/.test(html), `${(r.body.length / 1024).toFixed(1)} KB`);
  ok('GET /: nosniff, no-referrer, permissions-policy', r.h['x-content-type-options'] === 'nosniff' && r.h['referrer-policy'] === 'no-referrer' && r.h['permissions-policy'] === 'camera=(), microphone=(), geolocation=()');
  ok('GET /: no-cache (o conteúdo novo chega na próxima visita)', /(^|,\s*)no-cache/.test(r.h['cache-control'] || ''), r.h['cache-control'] || '');
  ok('GET /: a CSP da landing vem na meta tag (sem scripts); o cabeçalho só pode ter a da CDN', /default-src 'none'/.test(metaCsp(html)) && !/script-src/.test(metaCsp(html)) && noApp(r), r.h['content-security-policy'] || 'sem cabeçalho de CSP');
  const gz = await safe(apex, '/', { headers: { 'accept-encoding': 'gzip, br' } }); ok('o HTML sai comprimido (gzip ou br)', /^(gzip|br|zstd)$/.test(gz.h['content-encoding'] || ''), gz.h['content-encoding'] || 'sem compressão');
  r = await safe(apex, '/en/'); ok('GET /en/ responde 200 e é a landing em inglês', r.status === 200 && /<html lang="en">/.test(r.body.toString('utf8')), String(r.status));
  r = await safe(apex, '/app/'); { const a = r.body.toString('utf8'); ok('GET /app/ responde 200 e é o app (HTML único, noindex, CSP igual à da meta tag)', r.status === 200 && /window\.__DV=/.test(a) && /<meta name="robots" content="noindex">/.test(a) && r.h['content-security-policy'] === metaCsp(a) || (CDN.test(r.h['content-security-policy'] || '') === false && (r.h['content-security-policy'] || '').includes(metaCsp(a))), `${r.status} ${(r.body.length / 1048576).toFixed(1)} MB`); }
  ok('GET /app/: X-Robots-Tag noindex e no-cache', /noindex/.test(r.h['x-robots-tag'] || '') && /no-cache/.test(r.h['cache-control'] || ''), `${r.h['x-robots-tag'] || 'sem X-Robots-Tag'} · ${r.h['cache-control'] || ''}`);
  const rApp = r; r = await safe(apex, '/app/index.html'); ok('GET /app/index.html responde 200 (sem redirecionar: o service worker guarda esse endereço)', r.status === 200, String(r.status));
  r = await safe(apex, '/index.html'); ok('/index.html leva para / (301): uma URL por página', [301, 308].includes(r.status) && /\/$/.test(loc(r)), `${r.status} ${loc(r)}`);
  r = await safe(apex, '/en/index.html'); ok('/en/index.html leva para /en/ (301)', [301, 308].includes(r.status) && /\/en\/$/.test(loc(r)), `${r.status} ${loc(r)}`);
  r = await safe(apex, '/tipos-de-grafico'); ok('endereço sem a barra final leva para o com barra (301)', [301, 308].includes(r.status) && /\/tipos-de-grafico\/$/.test(loc(r)), `${r.status} ${loc(r)}`);
  r = await safe(apex, '/robots.txt'); ok('GET /robots.txt: 200, texto, aponta o sitemap', r.status === 200 && /^text\/plain/.test(r.h['content-type'] || '') && new RegExp(`Sitemap: https://${apex.replace(/\./g, '\\.')}/sitemap\\.xml`).test(r.body.toString('utf8')), `${r.status} ${r.h['content-type'] || ''}`);
  r = await safe(apex, '/sitemap.xml'); ok('GET /sitemap.xml: 200, XML, 20 páginas', r.status === 200 && /xml/.test(r.h['content-type'] || '') && (r.body.toString('utf8').match(/<url>/g) || []).length === 20, `${r.status} ${r.h['content-type'] || ''}`);
  r = await safe(apex, '/llms.txt'); ok('GET /llms.txt: 200, texto', r.status === 200 && /^text\/plain/.test(r.h['content-type'] || '') && /^# Datavix/.test(r.body.toString('utf8')), `${r.status} ${r.h['content-type'] || ''}`);
  r = await safe(apex, '/favicon.ico'); ok('GET /favicon.ico: 200, imagem', r.status === 200 && /^image\//.test(r.h['content-type'] || ''), `${r.status} ${r.h['content-type'] || ''}`);
  r = await safe(apex, '/og/home-pt.png'); ok('GET /og/home-pt.png: PNG com cache de 1 dia', r.status === 200 && r.h['content-type'] === 'image/png' && /max-age=86400/.test(r.h['cache-control'] || ''), `${r.status} ${r.h['cache-control'] || ''}`);
  { const font = (/\/assets\/geist\.[0-9a-f]+\.woff2/.exec(html) || [])[0]; r = await safe(apex, font || '/assets/x'); ok('uma fonte do site: font/woff2 com cache de 1 ano, immutable', !!font && r.status === 200 && /font\/woff2/.test(r.h['content-type'] || '') && /max-age=31536000/.test(r.h['cache-control'] || '') && /immutable/.test(r.h['cache-control'] || ''), `${font} ${r.status} ${r.h['cache-control'] || ''}`); }
  r = await safe(apex, '/sw.js'); { const csp = (r.h['content-security-policy'] || '').trim(); ok('GET /sw.js (de limpeza): 200, JavaScript, no-cache e sem CSP restritiva', r.status === 200 && /javascript/.test(r.h['content-type'] || '') && /no-cache/.test(r.h['cache-control'] || '') && /unregister\(\)/.test(r.body.toString('utf8')) && (!csp || CDN.test(csp)), `${r.status} ${r.h['content-type'] || ''}`); }
  r = await safe(apex, '/manifest.webmanifest'); { let m = null; try { m = JSON.parse(r.body.toString('utf8')); } catch (e) { /* segue */ } ok('GET /manifest.webmanifest (antigo): leva quem instalou o app para /app/', r.status === 200 && /^application\/manifest\+json/.test(r.h['content-type'] || '') && !!m && m.start_url === '/app/?source=pwa' && m.scope === '/', `${r.status} ${r.h['content-type'] || ''}`); }
  r = await safe(apex, '/app/sw.js'); { const csp = (r.h['content-security-policy'] || '').trim(); ok('GET /app/sw.js: 200, JavaScript, no-cache e sem CSP restritiva', r.status === 200 && /javascript/.test(r.h['content-type'] || '') && /no-cache/.test(r.h['cache-control'] || '') && /const BUILD = '[0-9a-f]{10}'/.test(r.body.toString('utf8')) && (!csp || CDN.test(csp)), `${r.status} ${r.h['content-type'] || ''} ${r.h['cache-control'] || ''}${csp ? ' · CSP: ' + csp.slice(0, 40) : ''}`); }
  r = await safe(apex, '/app/manifest.webmanifest'); { let m = null; try { m = JSON.parse(r.body.toString('utf8')); } catch (e) { /* segue */ } ok('GET /app/manifest.webmanifest: application/manifest+json, start_url e scope relativos', r.status === 200 && /^application\/manifest\+json/.test(r.h['content-type'] || '') && !!m && m.start_url === './?source=pwa' && m.scope === './', `${r.status} ${r.h['content-type'] || ''}`); }
  for (const ic of ['/app/icons/icon-192.png', '/icons/icon-192.png']) { r = await safe(apex, ic); ok(`GET ${ic}: cache de 1 ano, immutable`, r.status === 200 && /max-age=31536000/.test(r.h['cache-control'] || '') && /immutable/.test(r.h['cache-control'] || ''), `${r.status} ${r.h['cache-control'] || ''}`); }
  r = await safe(apex, '/nao-existe-123/'); ok('caminho inexistente: 404 com a página 404 (noindex), e não 200', r.status === 404 && /noindex/.test(r.body.toString('utf8')) && /Page not found/.test(r.body.toString('utf8')), String(r.status));
  r = await safe(apex, '/', { proto: 'http:' }); ok('http:// redireciona para https:// (301/302/307/308)', [301, 302, 307, 308].includes(r.status) && /^https:\/\//.test(loc(r)), `${r.status} ${loc(r)}`);
  r = await safe('www.' + apex, '/'); ok('www.' + apex + ' leva para ' + apex + ' (301)', [301, 308].includes(r.status) && new RegExp('^https://' + apex.replace(/\./g, '\\.') + '/?$').test(loc(r)), `${r.status} ${loc(r)}`);
  r = await safe(apex, '/.htaccess'); ok('/.htaccess não é servido', r.status === 403 || r.status === 404, String(r.status));
  for (const d of ['/icons/', '/assets/', '/og/']) { r = await safe(apex, d); ok(`listagem de pasta desligada (${d})`, r.status === 403 || r.status === 404, String(r.status)); }
  const stray = []; for (const p of ['/README.md', '/build.mjs', '/src/app.js', '/site/site.css', '/docs/migracao-hostinger.md', '/Product/index.html', '/Product/', '/.github/workflows/deploy.yml', '/.github/workflows/pages.yml', '/test/dev.html', '/dados-teste/lojas.csv', '/.git/config', '/index.html.bak']) { const x = await safe(apex, p); if (x.status === 200) stray.push(p); }
  ok('nenhum arquivo do repositório sobrou no servidor (README, código, docs, protótipo antigo, .github, .git)', stray.length === 0, stray.join(' '));
  // Chrome: a landing e o app
  const cl = await chromeProbe(`https://${apex}/`, LANDPROBE, { sw: false }), pl = cl.pg;
  ok('Chrome abriu a landing (título, h1, fontes Geist carregadas, nada de terceiros, sem rolagem horizontal)', !!pl && /^Datavix: /.test(pl.title) && !!pl.h1 && pl.geist && pl.mono && pl.ext === 0 && pl.imgs && pl.noScroll, pl ? JSON.stringify(pl).slice(0, 400) : cl.err);
  ok('a landing não tem service worker', !!pl && !pl.sw);
  ok('nenhuma violação de CSP no console da landing', cl.viol.length === 0, cl.viol[0] || '');
  const cr = await chromeProbe(`https://${apex}/app/`, PROBE), pg = cr.pg;
  ok('Chrome abriu o app em /app/ (título e landing do produto)', !!pg && pg.title === 'Datavix' && pg.landing, pg ? (pg.nosw ? JSON.stringify(pg) : '') : cr.err);
  ok('nenhuma violação de CSP no console do app', cr.viol.length === 0, cr.viol[0] || '');
  ok('service worker ativo, com escopo /app/', !!pg && pg.sw && pg.swState === 'activated' && /\/app\/$/.test(pg.scope || ''), pg ? `${pg.swState} ${pg.scope}` : '');
  ok('cache do app com os 7 arquivos', !!pg && /^datavix-/.test(pg.cache || '') && pg.items === 7, pg ? `${pg.cache} · ${pg.items}` : '');
  ok('política de privacidade do app diz Hostinger (PT e EN)', !!pg && !!pg.priv && pg.priv.ptHostinger && pg.priv.enHostinger && !pg.priv.ptGithub && !pg.priv.enGithub, pg ? JSON.stringify(pg.priv) : '');
  ok('primeira visita (informativo: a 2ª navegação é a tela "Checking your browser" que a CDN da Hostinger mostra a Chrome automatizado; um navegador comum abre direto)', cl.navs <= 2 && cr.navs <= 2, `landing ${cl.navs}, app ${cr.navs} navegação(ões)`);
  void rApp;
}

try {
  // ---- 1) build como no GitHub Actions
  const urlArg = (process.argv.find(a => a.startsWith('--url=')) || '').slice(6);
  if (urlArg) { await live(urlArg); throw new Error('__fim__'); }
  for (const port of [APORT, PPORT]) { const l = sh('lsof', ['-ti', `tcp:${port}`]); (l.stdout || '').split('\n').filter(Boolean).forEach(pid => { try { process.kill(+pid, 'SIGKILL'); } catch (e) { /* já saiu */ } }); } // sobra de uma execução interrompida
  fs.mkdirSync(SRC, { recursive: true });
  const distArg = (process.argv.find(a => a.startsWith('--dist=')) || '').slice(7);
  if (distArg) { fs.mkdirSync(DIST, { recursive: true }); sh('rsync', ['-a', '--exclude=.git', `${path.resolve(distArg)}/`, `${DIST}/`]); ok('site já montado em ' + distArg, fs.existsSync(path.join(DIST, 'index.html'))); }
  else {
    sh('rsync', ['-a', '--exclude=.git', '--exclude=test', '--exclude=dados-teste', '--exclude=dist', '--exclude=index.html', '--exclude=.env.local', '--exclude=node_modules', `${ROOT}/`, `${SRC}/`]);
    const b = sh('node', ['build.mjs'], { cwd: SRC, env: { ...process.env, DATAVIX_HOST: 'hostinger', DATAVIX_SITE: 'datavix.app', DATAVIX_CLARITY_HOST: 'datavix.app', DATAVIX_NPS_URL: '', DATAVIX_NPS_TOKEN: '' } });
    ok('build para a Hostinger', b.status === 0 && fs.existsSync(path.join(DIST, 'index.html')) && fs.existsSync(path.join(DIST, 'app/index.html')), (b.stdout || b.stderr || '').trim().split('\n').pop());
  }
  const files = fs.readdirSync(DIST, { withFileTypes: true }).map(d => d.name).sort().join(' ');
  ok('dist tem .htaccess, a landing (index.html e en/), 404.html, robots.txt, sitemap.xml, llms.txt, sw.js de limpeza, manifesto antigo, app/ e as pastas de ícones, assets e og', ['.htaccess', 'index.html', 'en', '404.html', 'robots.txt', 'sitemap.xml', 'llms.txt', 'sw.js', 'manifest.webmanifest', 'app', 'icons', 'assets', 'og'].every(f => files.split(' ').includes(f)), files);
  ok('app/ tem index.html, sw.js, manifesto, ícones e .htaccess próprios', ['index.html', 'sw.js', 'manifest.webmanifest', 'icons', '.htaccess'].every(f => fs.existsSync(path.join(DIST, 'app', f))));
  ok('assets/.htaccess, icons/.htaccess e app/icons/.htaccess existem (cache longo só onde o nome tem hash ou o arquivo não muda)', ['assets/.htaccess', 'icons/.htaccess', 'app/icons/.htaccess', 'og/.htaccess'].every(f => fs.existsSync(path.join(DIST, f))));
  if (process.argv.includes('--csp-all')) { // experimento: CSP em todos os arquivos do app, como o _headers antigo fazia (mostra por que o .htaccess limita a CSP ao HTML)
    const f = path.join(DIST, 'app/.htaccess'); fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/<FilesMatch "\^index\\\.html\$">\n(Header set Content-Security-Policy [^\n]*)\n(Header set X-Robots-Tag "noindex")\n<\/FilesMatch>/, '$1\n$2')); }
  const html = fs.readFileSync(path.join(DIST, 'app/index.html'), 'utf8'), ht = fs.readFileSync(path.join(DIST, '.htaccess'), 'utf8'), hta = fs.readFileSync(path.join(DIST, 'app/.htaccess'), 'utf8');
  const meta = (/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html) || [])[1] || '', hdr = (/Header set Content-Security-Policy "([^"]*)"/.exec(hta) || [])[1] || '';
  ok('a CSP de app/.htaccess é idêntica à da meta tag do app', !!meta && meta === hdr);
  ok('a raiz (.htaccess) não define CSP: as páginas do site levam a delas na meta tag e o app tem a dele em app/.htaccess', !/Content-Security-Policy/.test(ht) && /FilesMatch "\^index\\\.html\$"/.test(hta));
  const hs = fs.readFileSync(path.join(DIST, '_headers'), 'utf8');
  ok('o .htaccess tem os mesmos cabeçalhos do _headers (nosniff, no-referrer, permissions-policy)', ['X-Content-Type-Options: nosniff', 'Referrer-Policy: no-referrer', 'Permissions-Policy: camera=(), microphone=(), geolocation=()'].every(l => hs.includes(l)) && ht.includes('X-Content-Type-Options "nosniff"') && ht.includes('Referrer-Policy "no-referrer"') && ht.includes('Permissions-Policy "camera=(), microphone=(), geolocation=()"'));
  { const blocks = hs.split(/\n(?=\/)/).map(b => b.split('\n')[0].trim() + ' => ' + b); const withCsp = blocks.filter(b => /Content-Security-Policy/.test(b)).map(b => b.split(' => ')[0]).sort().join(' ');
    ok('_headers (Netlify/Cloudflare): a CSP vale só para /app/ e /app/index.html, não para o sw.js nem para o site', withCsp === '/app/ /app/index.html', withCsp); }
  const cfg = JSON.parse((/window\.__DV=(\{.*?\});?<\/script>/s.exec(html) || /window\.__DV=(\{[^<]*\})/.exec(html) || [])[1] || 'null');
  ok('a CSP só libera o Google (script.google.com) quando o NPS está ligado', !!cfg && !!cfg.nps === /script\.google\.com/.test(meta), cfg && cfg.nps ? 'NPS ligado' : 'NPS desligado');
  ok('config do app: host hostinger, site datavix.app, Clarity só em datavix.app', !!cfg && cfg.host === 'hostinger' && cfg.site === 'datavix.app' && cfg.clarity && cfg.clarity.host === 'datavix.app'); const www = /RewriteCond %\{HTTP_HOST\} \^www\\\.datavix\\\.app\$ \[NC\]/.test(ht);
  ok('redirecionamento de www para datavix.app', www);
  ok('a landing diz Hostinger na política de privacidade estática (PT e EN)', /servido pela Hostinger/.test(fs.readFileSync(path.join(DIST, 'privacidade/index.html'), 'utf8')) && /served by Hostinger/.test(fs.readFileSync(path.join(DIST, 'en/privacy/index.html'), 'utf8')));

  // ---- 2) Apache local com os .htaccess
  fs.mkdirSync(AP, { recursive: true });
  const mods = ['mpm_prefork', 'unixd', 'authz_core', 'authz_host', 'mime', 'log_config', 'dir', 'filter', 'headers', 'rewrite', 'deflate', 'env', 'setenvif'];
  fs.writeFileSync(path.join(AP, 'httpd.conf'), [`ServerRoot "/usr"`, `Listen 127.0.0.1:${APORT}`, `PidFile "${AP}/httpd.pid"`, `ErrorLog "${AP}/error.log"`, 'LogLevel warn', 'LogFormat "%>s %r" dv', `CustomLog "${AP}/access.log" dv`, ...mods.map(m => `LoadModule ${m}_module libexec/apache2/mod_${m}.so`), 'ServerName 127.0.0.1', `DocumentRoot "${DIST}"`, 'TypesConfig "/private/etc/apache2/mime.types"',
    `<Directory "${DIST}">`, '  AllowOverride All', '  Require all granted', '</Directory>', '<Files ".ht*">', '  Require all denied', '</Files>'].join('\n') + '\n');
  const syn = sh('/usr/sbin/httpd', ['-f', path.join(AP, 'httpd.conf'), '-t']); ok('o Apache aceita a configuração', syn.status === 0, (syn.stderr || '').trim().split('\n').pop());
  const st = sh('/usr/sbin/httpd', ['-f', path.join(AP, 'httpd.conf'), '-k', 'start']); apache = st.status === 0; await sleep(1200);
  const https = { 'x-forwarded-proto': 'https' };
  let r = await req('/', https);
  ok('GET / responde 200 em HTML UTF-8 (a landing)', r.status === 200 && /^text\/html/.test(r.h['content-type'] || '') && /utf-8/i.test(r.h['content-type'] || '') && /<h1>/.test(r.body.toString('utf8')), `${r.status} ${r.h['content-type']}`);
  ok('GET /: nosniff, no-referrer, permissions-policy, no-cache', r.h['x-content-type-options'] === 'nosniff' && r.h['referrer-policy'] === 'no-referrer' && r.h['permissions-policy'] === 'camera=(), microphone=(), geolocation=()' && r.h['cache-control'] === 'no-cache');
  ok('GET /: sem CSP no cabeçalho (a da landing vai na meta tag) e sem X-Robots-Tag', !r.h['content-security-policy'] && !r.h['x-robots-tag']);
  const gz = await req('/', { ...https, 'accept-encoding': 'gzip' }); ok('compressão gzip na landing', gz.h['content-encoding'] === 'gzip' && gz.body.length < r.body.length / 2, `${(r.body.length / 1024).toFixed(1)} KB → ${(gz.body.length / 1024).toFixed(1)} KB`);
  r = await req('/en/', https); ok('GET /en/ responde 200', r.status === 200 && /<html lang="en">/.test(r.body.toString('utf8')));
  r = await req('/app/', https); ok('GET /app/ responde 200 (o app), com a CSP do cabeçalho igual à da meta tag, noindex e no-cache', r.status === 200 && r.h['content-security-policy'] === meta && /noindex/.test(r.h['x-robots-tag'] || '') && r.h['cache-control'] === 'no-cache' && r.h['x-content-type-options'] === 'nosniff', `${r.status} ${r.h['content-security-policy'] ? 'CSP ok' : 'sem CSP'} ${r.h['x-robots-tag'] || 'sem X-Robots-Tag'}`);
  const gzA = await req('/app/', { ...https, 'accept-encoding': 'gzip' }); ok('compressão gzip no app (6 MB viram uma fração)', gzA.h['content-encoding'] === 'gzip' && gzA.body.length < r.body.length / 2, `${(r.body.length / 1048576).toFixed(1)} MB → ${(gzA.body.length / 1048576).toFixed(1)} MB`);
  r = await req('/app/index.html', https); ok('GET /app/index.html: 200, sem redirecionar, mesmos cabeçalhos de /app/', r.status === 200 && r.h['content-security-policy'] === meta && r.h['cache-control'] === 'no-cache');
  r = await req('/index.html', https); ok('GET /index.html: 301 para /', r.status === 301 && /\/$/.test(r.h.location || '') && !/index\.html/.test(r.h.location || ''), `${r.status} ${r.h.location}`);
  r = await req('/en/index.html', https); ok('GET /en/index.html: 301 para /en/', r.status === 301 && /\/en\/$/.test(r.h.location || ''), `${r.status} ${r.h.location}`);
  r = await req('/tipos-de-grafico/index.html', https); ok('GET /tipos-de-grafico/index.html: 301 para /tipos-de-grafico/', r.status === 301 && /\/tipos-de-grafico\/$/.test(r.h.location || ''), `${r.status} ${r.h.location}`);
  r = await req('/tipos-de-grafico', https); ok('GET /tipos-de-grafico (sem a barra): 301 para a versão com barra', r.status === 301 && /\/tipos-de-grafico\/$/.test(r.h.location || ''), `${r.status} ${r.h.location}`);
  r = await req('/tipos-de-grafico/', https); ok('GET /tipos-de-grafico/: 200 em HTML', r.status === 200 && /<h1>/.test(r.body.toString('utf8')));
  r = await req('/app', https); ok('GET /app (sem a barra): 301 para /app/', r.status === 301 && /\/app\/$/.test(r.h.location || ''), `${r.status} ${r.h.location}`);
  r = await req('/robots.txt', https); ok('GET /robots.txt: texto UTF-8, no-cache', r.status === 200 && /^text\/plain/.test(r.h['content-type'] || '') && r.h['cache-control'] === 'no-cache');
  r = await req('/sitemap.xml', https); ok('GET /sitemap.xml: XML, no-cache', r.status === 200 && /xml/.test(r.h['content-type'] || '') && r.h['cache-control'] === 'no-cache', r.h['content-type']);
  r = await req('/llms.txt', https); ok('GET /llms.txt: texto UTF-8', r.status === 200 && /^text\/plain/.test(r.h['content-type'] || ''));
  r = await req('/favicon.ico', https); ok('GET /favicon.ico: imagem', r.status === 200 && /^image\//.test(r.h['content-type'] || ''), r.h['content-type']);
  r = await req('/og/home-pt.png', https); ok('GET /og/home-pt.png: PNG com cache de 1 dia', r.status === 200 && r.h['content-type'] === 'image/png' && /max-age=86400/.test(r.h['cache-control'] || ''), r.h['cache-control']);
  { const home = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8'), font = (/\/assets\/geist\.[0-9a-f]+\.woff2/.exec(home) || [])[0], img = (/\/assets\/img\/hero-1280\.[0-9a-f]+\.webp/.exec(home) || [])[0];
    r = await req(font, https); ok('GET fonte do site: font/woff2, cache de 1 ano, immutable', r.status === 200 && /font\/woff2/.test(r.h['content-type'] || '') && r.h['cache-control'] === 'public, max-age=31536000, immutable', `${r.h['content-type']} ${r.h['cache-control']}`);
    r = await req(img, https); ok('GET imagem WebP do site: image/webp, cache de 1 ano, immutable', r.status === 200 && r.h['content-type'] === 'image/webp' && r.h['cache-control'] === 'public, max-age=31536000, immutable', `${r.h['content-type']} ${r.h['cache-control']}`); }
  { const home = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8'), doc = (/\/assets\/clips\/[\w.-]+\.html/.exec(home) || [])[0], poster = (/\/assets\/clips\/[\w.-]+-poster\.[0-9a-f]+\.webp/.exec(home) || [])[0];
    r = await req(doc, https); const dbody = r.body.toString('utf8'), mp4 = '/assets/clips/' + ((/<video src="([^"]+)"/.exec(dbody) || [])[1] || 'x');
    ok('GET clipe (documento do iframe): HTML, cache de 1 ano, immutable e sem X-Frame-Options que o bloqueie', r.status === 200 && /^text\/html/.test(r.h['content-type'] || '') && r.h['cache-control'] === 'public, max-age=31536000, immutable' && !/deny/i.test(r.h['x-frame-options'] || ''), `${r.status} ${r.h['content-type']} ${r.h['cache-control']} ${r.h['x-frame-options'] || ''}`);
    r = await req(mp4, https); ok('GET clipe MP4: video/mp4, cache de 1 ano, immutable', r.status === 200 && r.h['content-type'] === 'video/mp4' && r.h['cache-control'] === 'public, max-age=31536000, immutable', `${r.status} ${r.h['content-type']} ${r.h['cache-control']}`);
    r = await req(mp4, { ...https, range: 'bytes=0-99' }); ok('GET clipe MP4 com Range: 206 e Content-Range (o Safari só toca vídeo assim)', r.status === 206 && /bytes/.test(r.h['accept-ranges'] || '') && /^bytes 0-99\//.test(r.h['content-range'] || ''), `${r.status} ${r.h['content-range'] || ''}`);
    r = await req(poster, https); ok('GET pôster do clipe: image/webp, cache de 1 ano, immutable', r.status === 200 && r.h['content-type'] === 'image/webp' && r.h['cache-control'] === 'public, max-age=31536000, immutable', `${r.status} ${r.h['content-type']}`); }
  r = await req('/sw.js', https); ok('GET /sw.js (de limpeza): no-cache, JavaScript e SEM CSP', r.status === 200 && r.h['cache-control'] === 'no-cache' && /javascript/.test(r.h['content-type'] || '') && !r.h['content-security-policy'] && /unregister\(\)/.test(r.body.toString('utf8')));
  r = await req('/app/sw.js', https); ok('GET /app/sw.js: no-cache, JavaScript e SEM CSP (a CSP bloquearia as buscas do service worker)', r.status === 200 && r.h['cache-control'] === 'no-cache' && /javascript/.test(r.h['content-type'] || '') && !r.h['content-security-policy'] && r.h['x-content-type-options'] === 'nosniff');
  r = await req('/app/manifest.webmanifest', https); ok('GET /app/manifest.webmanifest: application/manifest+json e no-cache', r.status === 200 && /^application\/manifest\+json/.test(r.h['content-type'] || '') && r.h['cache-control'] === 'no-cache');
  { let m = null; try { m = JSON.parse(r.body.toString('utf8')); } catch (e) { /* segue */ } ok('o manifesto do app abre em /app/ (start_url e scope relativos)', !!m && m.start_url === './?source=pwa' && m.scope === './' && m.id === './'); }
  r = await req('/manifest.webmanifest', https); { let m = null; try { m = JSON.parse(r.body.toString('utf8')); } catch (e) { /* segue */ } ok('o manifesto da raiz (antigo) leva para /app/', r.status === 200 && !!m && m.start_url === '/app/?source=pwa' && m.scope === '/'); }
  for (const ic of ['/app/icons/icon-192.png', '/icons/icon-192.png']) { r = await req(ic, https); ok(`GET ${ic}: cache de 1 ano, immutable, sem CSP`, r.status === 200 && r.h['cache-control'] === 'public, max-age=31536000, immutable' && !r.h['content-security-policy'] && r.h['content-type'] === 'image/png'); }
  r = await req('/', {}); ok('HTTP puro redireciona para HTTPS (301)', r.status === 301 && r.h.location === `https://127.0.0.1:${APORT}/`, `${r.status} ${r.h.location}`);
  r = await req('/app/sw.js', { 'x-forwarded-proto': 'http' }); ok('o redirecionamento mantém o caminho', r.status === 301 && /\/app\/sw\.js$/.test(r.h.location || ''));
  r = await req('/', { ...https, host: 'www.datavix.app' }); ok('www.datavix.app → https://datavix.app/ (301)', r.status === 301 && r.h.location === 'https://datavix.app/', `${r.status} ${r.h.location}`);
  r = await req('/', { ...https, host: 'datavix.app' }); ok('datavix.app (HTTPS) não redireciona', r.status === 200);
  r = await req('/.htaccess', https); ok('/.htaccess não é servido', r.status === 403 || r.status === 404, String(r.status));
  for (const d of ['/icons/', '/assets/', '/og/', '/app/icons/']) { r = await req(d, https); ok(`listagem de pasta desligada (${d})`, r.status === 403 || r.status === 404, String(r.status)); }
  r = await req('/nao-existe', https); ok('caminho inexistente dá 404, com a página 404 (noindex) e não a landing', r.status === 404 && /noindex/.test(r.body.toString('utf8')) && /Page not found/.test(r.body.toString('utf8')), String(r.status));

  // ---- 3) Chrome headless, atrás de um proxy que simula o HTTPS da Hostinger (X-Forwarded-Proto)
  proxy = http.createServer((q, s) => { const p = http.request({ host: '127.0.0.1', port: APORT, path: q.url, method: q.method, headers: { ...q.headers, 'x-forwarded-proto': 'https' } }, rr => { s.writeHead(rr.statusCode, rr.headers); rr.pipe(s); }); q.pipe(p); p.on('error', () => { s.statusCode = 502; s.end(); }); }).listen(PPORT, '127.0.0.1');
  const cl = await chromeProbe(`http://127.0.0.1:${PPORT}/`, LANDPROBE, { sw: false }), pl = cl.pg;
  ok('Chrome abriu a landing: título, h1, fontes Geist e Geist Mono carregadas, imagens, nada de terceiros, sem rolagem horizontal', !!pl && /^Datavix: /.test(pl.title) && !!pl.h1 && pl.geist && pl.mono && pl.ext === 0 && pl.imgs && pl.noScroll, pl ? JSON.stringify(pl).slice(0, 400) : cl.err);
  ok('nenhuma violação de CSP na landing (a CSP da meta tag vale sozinha)', cl.viol.length === 0, cl.viol[0] || '');
  ok('a landing não registra service worker', !!pl && !pl.sw && pl.regs === 0);
  const cr = await chromeProbe(`http://127.0.0.1:${PPORT}/app/`, PROBE), pg = cr.pg, viol = cr.viol;
  ok('Chrome abriu o app em /app/ (título e landing do produto)', !!pg && pg.title === 'Datavix' && pg.landing, pg ? (pg.nosw ? JSON.stringify(pg) : '') : cr.err);
  ok('nenhuma violação de CSP no app (cabeçalho + meta valendo juntos)', viol.length === 0, viol[0] || '');
  ok('service worker ativo com escopo /app/', !!pg && pg.sw && pg.swState === 'activated' && /\/app\/$/.test(pg.scope || ''), pg && pg.sw ? `${pg.swState} ${pg.scope}` : JSON.stringify(pg && pg.err) + ' · apache: ' + (fs.existsSync(path.join(AP, 'access.log')) ? fs.readFileSync(path.join(AP, 'access.log'), 'utf8').split('\n').filter(l => /sw\.js|manifest|icons/.test(l)).join(' | ') : 'sem log'));
  ok('cache do app com 7 arquivos (index, manifesto, 4 ícones e a raiz do app)', !!pg && /^datavix-/.test(pg.cache || '') && pg.items === 7, pg ? `${pg.cache} · ${pg.items}` : '');
  ok('política de privacidade do app diz Hostinger (PT e EN) e não diz GitHub Pages', !!pg && !!pg.priv && pg.priv.ptHostinger && pg.priv.enHostinger && !pg.priv.ptGithub && !pg.priv.enGithub, pg ? JSON.stringify(pg.priv) : '');
  ok(distArg ? 'primeira visita ao app (informativo: sites montados antes da correção recarregam uma vez)' : 'a primeira visita ao app não recarrega a página (1 navegação)', distArg ? cr.navs <= 2 : cr.navs === 1, `${cr.navs} navegação(ões)`);
} catch (e) {
  if (!/__fim__/.test(String(e && e.message))) ok('execução sem erro', false, e.stack);
} finally {
  if (proxy) proxy.close();
  if (apache) sh('/usr/sbin/httpd', ['-f', path.join(AP, 'httpd.conf'), '-k', 'stop']);
  await sleep(300); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* segue */ }
  console.log(out.join('\n')); console.log(bad.length ? `\nFALHOU: ${bad.length} verificação(ões)` : `\ntudo certo (${out.length} verificações)`);
  process.exitCode = bad.length ? 1 : 0;
}
