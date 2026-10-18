// Migração para a Hostinger: confere o build para Apache/LiteSpeed antes de subir. Uso: node test/hostinger-check.mjs [--dist=PASTA] [--csp-all]
// --dist=PASTA confere um site já montado (por exemplo, a branch hostinger clonada) em vez de fazer o build.
// --url=https://datavix.app confere o site NO AR (só leitura: cabeçalhos, redirecionamentos, arquivos que não podem sobrar e a primeira visita no Chrome; não envia cadastro nem NPS).
// 1) copia as fontes para uma pasta temporária e faz o build como o GitHub Actions faz (DATAVIX_HOST=hostinger, DATAVIX_SITE=datavix.app, sem .env.local);
// 2) sobe um Apache 2.4 local (o do macOS) lendo o .htaccess gerado e confere cabeçalhos, cache, compressão e redirecionamentos;
// 3) abre o app no Chrome headless atrás de um proxy que simula o HTTPS da Hostinger e confere: sem violação de CSP, service worker ativo, cache do app,
//    manifesto, política de privacidade falando da Hostinger. O LiteSpeed da Hostinger é compatível com o Apache, mas a conferência final é no endereço temporário.
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
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// abre a página num Chrome headless de perfil novo (primeira visita), espera o service worker assumir e a página assentar, e roda a sonda uma vez
async function chromeProbe(url, expr) {
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
    const t0 = Date.now(); while (Date.now() - t0 < 30000) { if (await ev('!!navigator.serviceWorker && !!navigator.serviceWorker.controller')) break; await sleep(400); }
    await sleep(4000); // a página assenta (sites montados antes da correção recarregam uma vez ao assumir o service worker)
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
  let r = await safe(apex, '/'), html = r.body.toString('utf8');
  ok('GET / responde 200 em HTML (hoje: ' + r.status + ')', r.status === 200 && /^text\/html/.test(r.h['content-type'] || ''), r.err || `${r.status} ${r.h['content-type'] || ''}`);
  const meta = (/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html) || [])[1] || '';
  ok('GET /: nosniff, no-referrer, permissions-policy', r.h['x-content-type-options'] === 'nosniff' && r.h['referrer-policy'] === 'no-referrer' && r.h['permissions-policy'] === 'camera=(), microphone=(), geolocation=()');
  ok('GET /: a CSP do cabeçalho é a mesma da meta tag', !!meta && r.h['content-security-policy'] === meta, r.h['content-security-policy'] ? 'cabeçalho presente' : 'sem cabeçalho');
  ok('GET /: cache-control no-cache (a versão nova chega na próxima visita)', /(^|,\s*)no-cache/.test(r.h['cache-control'] || ''), r.h['cache-control'] || '');
  const gz = await safe(apex, '/', { headers: { 'accept-encoding': 'gzip, br' } }); ok('o HTML sai comprimido (gzip ou br)', /^(gzip|br|zstd)$/.test(gz.h['content-encoding'] || ''), gz.h['content-encoding'] || 'sem compressão');
  r = await safe(apex, '/sw.js'); ok('GET /sw.js: 200, JavaScript, no-cache e SEM CSP', r.status === 200 && /javascript/.test(r.h['content-type'] || '') && /no-cache/.test(r.h['cache-control'] || '') && !r.h['content-security-policy'], `${r.status} ${r.h['content-type'] || ''} ${r.h['cache-control'] || ''}`);
  r = await safe(apex, '/manifest.webmanifest'); { let m = null; try { m = JSON.parse(r.body.toString('utf8')); } catch (e) { /* segue */ } ok('GET /manifest.webmanifest: application/manifest+json, start_url e scope relativos', r.status === 200 && /^application\/manifest\+json/.test(r.h['content-type'] || '') && !!m && m.start_url === './?source=pwa' && m.scope === './', `${r.status} ${r.h['content-type'] || ''}`); }
  r = await safe(apex, '/icons/icon-192.png'); ok('GET /icons/icon-192.png: cache de 1 ano, immutable', r.status === 200 && /max-age=31536000/.test(r.h['cache-control'] || '') && /immutable/.test(r.h['cache-control'] || ''), `${r.status} ${r.h['cache-control'] || ''}`);
  r = await safe(apex, '/', { proto: 'http:' }); ok('http:// redireciona para https:// (301/302/307/308)', [301, 302, 307, 308].includes(r.status) && /^https:\/\//.test(r.h.location || ''), `${r.status} ${r.h.location || r.err || ''}`);
  r = await safe('www.' + apex, '/'); ok('www.' + apex + ' leva para ' + apex + ' (301)', [301, 308].includes(r.status) && new RegExp('^https://' + apex.replace(/\./g, '\\.') + '/?$').test(r.h.location || ''), `${r.status} ${r.h.location || r.err || ''}`);
  r = await safe(apex, '/.htaccess'); ok('/.htaccess não é servido', r.status === 403 || r.status === 404, String(r.status));
  r = await safe(apex, '/icons/'); ok('listagem de pasta desligada', r.status === 403 || r.status === 404, String(r.status));
  const stray = []; for (const p of ['/README.md', '/build.mjs', '/src/app.js', '/docs/migracao-hostinger.md', '/Product/index.html', '/Product/', '/.github/workflows/deploy.yml', '/.github/workflows/pages.yml', '/test/dev.html', '/dados-teste/lojas.csv', '/.git/config']) { const x = await safe(apex, p); if (x.status === 200) stray.push(p); }
  ok('nenhum arquivo do repositório sobrou no servidor (README, código, docs, protótipo antigo, .github, .git)', stray.length === 0, stray.join(' '));
  const cr = await chromeProbe(`https://${apex}/`, PROBE), pg = cr.pg;
  ok('Chrome abriu o app (título e landing)', !!pg && pg.title === 'Datavix' && pg.landing, pg ? (pg.nosw ? JSON.stringify(pg) : '') : cr.err);
  ok('nenhuma violação de CSP no console', cr.viol.length === 0, cr.viol[0] || '');
  ok('service worker ativo na raiz', !!pg && pg.sw && pg.swState === 'activated', pg ? `${pg.swState} ${pg.scope}` : '');
  ok('cache do app com os 7 arquivos', !!pg && /^datavix-/.test(pg.cache || '') && pg.items === 7, pg ? `${pg.cache} · ${pg.items}` : '');
  ok('política de privacidade diz Hostinger (PT e EN)', !!pg && !!pg.priv && pg.priv.ptHostinger && pg.priv.enHostinger && !pg.priv.ptGithub && !pg.priv.enGithub, pg ? JSON.stringify(pg.priv) : '');
  ok('primeira visita (informativo: antes da correção do PWA o app recarrega uma vez)', cr.navs <= 2, `${cr.navs} navegação(ões)`);
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
    ok('build para a Hostinger', b.status === 0 && fs.existsSync(path.join(DIST, 'index.html')), (b.stdout || b.stderr || '').trim().split('\n').pop());
  }
  const files = fs.readdirSync(DIST, { withFileTypes: true }).map(d => d.name).sort().join(' ');
  ok('dist tem .htaccess, index.html, sw.js, manifest e ícones', ['.htaccess', 'index.html', 'sw.js', 'manifest.webmanifest', 'icons'].every(f => files.includes(f)), files);
  ok('icons/.htaccess existe (cache longo só nos ícones)', fs.existsSync(path.join(DIST, 'icons/.htaccess')));
  if (process.argv.includes('--csp-all')) { // experimento: CSP em todos os arquivos, como o _headers faz (mostra por que o .htaccess limita a CSP ao HTML)
    const f = path.join(DIST, '.htaccess'); fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/<FilesMatch "\^index\\\.html\$">\n(Header set Content-Security-Policy [^\n]*)\n<\/FilesMatch>/, '$1')); }
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8'), ht = fs.readFileSync(path.join(DIST, '.htaccess'), 'utf8');
  const meta = (/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html) || [])[1] || '', hdr = (/Header set Content-Security-Policy "([^"]*)"/.exec(ht) || [])[1] || '';
  ok('a CSP do .htaccess é idêntica à da meta tag do HTML', !!meta && meta === hdr);
  const hs = fs.readFileSync(path.join(DIST, '_headers'), 'utf8');
  ok('o .htaccess tem os mesmos cabeçalhos do _headers (nosniff, no-referrer, permissions-policy)', ['X-Content-Type-Options: nosniff', 'Referrer-Policy: no-referrer', 'Permissions-Policy: camera=(), microphone=(), geolocation=()'].every(l => hs.includes(l)) && ht.includes('X-Content-Type-Options "nosniff"') && ht.includes('Referrer-Policy "no-referrer"') && ht.includes('Permissions-Policy "camera=(), microphone=(), geolocation=()"'));
  { const blocks = hs.split(/\n(?=\/)/).map(b => b.split('\n')[0].trim() + ' => ' + b); const withCsp = blocks.filter(b => /Content-Security-Policy/.test(b)).map(b => b.split(' => ')[0]).sort().join(' ');
    ok('_headers (Netlify/Cloudflare): a CSP vale só para / e /index.html, não para /sw.js', withCsp === '/ /index.html', withCsp); }
  const cfg = JSON.parse((/window\.__DV=(\{.*?\});?<\/script>/s.exec(html) || /window\.__DV=(\{[^<]*\})/.exec(html) || [])[1] || 'null');
  ok('a CSP só libera o Google (script.google.com) quando o NPS está ligado', !!cfg && !!cfg.nps === /script\.google\.com/.test(meta), cfg && cfg.nps ? 'NPS ligado' : 'NPS desligado');
  ok('config do app: host hostinger, site datavix.app, Clarity só em datavix.app', !!cfg && cfg.host === 'hostinger' && cfg.site === 'datavix.app' && cfg.clarity && cfg.clarity.host === 'datavix.app'); const www = /RewriteCond %\{HTTP_HOST\} \^www\\\.datavix\\\.app\$ \[NC\]/.test(ht);
  ok('redirecionamento de www para datavix.app', www);

  // ---- 2) Apache local com o .htaccess
  fs.mkdirSync(AP, { recursive: true });
  const mods = ['mpm_prefork', 'unixd', 'authz_core', 'authz_host', 'mime', 'log_config', 'dir', 'filter', 'headers', 'rewrite', 'deflate', 'env', 'setenvif'];
  fs.writeFileSync(path.join(AP, 'httpd.conf'), [`ServerRoot "/usr"`, `Listen 127.0.0.1:${APORT}`, `PidFile "${AP}/httpd.pid"`, `ErrorLog "${AP}/error.log"`, 'LogLevel warn', 'LogFormat "%>s %r" dv', `CustomLog "${AP}/access.log" dv`, ...mods.map(m => `LoadModule ${m}_module libexec/apache2/mod_${m}.so`), 'ServerName 127.0.0.1', `DocumentRoot "${DIST}"`, 'TypesConfig "/private/etc/apache2/mime.types"',
    `<Directory "${DIST}">`, '  AllowOverride All', '  Require all granted', '</Directory>', '<Files ".ht*">', '  Require all denied', '</Files>'].join('\n') + '\n');
  const syn = sh('/usr/sbin/httpd', ['-f', path.join(AP, 'httpd.conf'), '-t']); ok('o Apache aceita a configuração', syn.status === 0, (syn.stderr || '').trim().split('\n').pop());
  const st = sh('/usr/sbin/httpd', ['-f', path.join(AP, 'httpd.conf'), '-k', 'start']); apache = st.status === 0; await sleep(1200);
  const https = { 'x-forwarded-proto': 'https' };
  let r = await req('/', https);
  ok('GET / responde 200 em HTML UTF-8', r.status === 200 && /^text\/html/.test(r.h['content-type'] || '') && /utf-8/i.test(r.h['content-type'] || ''), `${r.status} ${r.h['content-type']}`);
  ok('GET /: nosniff, no-referrer, permissions-policy', r.h['x-content-type-options'] === 'nosniff' && r.h['referrer-policy'] === 'no-referrer' && r.h['permissions-policy'] === 'camera=(), microphone=(), geolocation=()');
  ok('GET /: a CSP do cabeçalho é a mesma da meta tag', r.h['content-security-policy'] === meta, r.h['content-security-policy'] ? 'presente' : 'ausente');
  ok('GET /: cache-control no-cache (sempre revalida a versão nova)', r.h['cache-control'] === 'no-cache');
  const gz = await req('/', { ...https, 'accept-encoding': 'gzip' }); ok('compressão gzip no HTML (6 MB viram uma fração)', gz.h['content-encoding'] === 'gzip' && gz.body.length < r.body.length / 2, `${(r.body.length / 1048576).toFixed(1)} MB → ${(gz.body.length / 1048576).toFixed(1)} MB`);
  r = await req('/index.html', https); ok('GET /index.html: mesmos cabeçalhos de /', r.status === 200 && r.h['content-security-policy'] === meta && r.h['cache-control'] === 'no-cache');
  r = await req('/sw.js', https); ok('GET /sw.js: no-cache, JavaScript e SEM CSP (a CSP bloquearia as buscas do service worker)', r.status === 200 && r.h['cache-control'] === 'no-cache' && /javascript/.test(r.h['content-type'] || '') && !r.h['content-security-policy'] && r.h['x-content-type-options'] === 'nosniff');
  r = await req('/manifest.webmanifest', https); ok('GET /manifest.webmanifest: application/manifest+json e no-cache', r.status === 200 && /^application\/manifest\+json/.test(r.h['content-type'] || '') && r.h['cache-control'] === 'no-cache');
  { let m = null; try { m = JSON.parse(r.body.toString('utf8')); } catch (e) { /* segue */ } ok('o manifesto abre na raiz do domínio (start_url e scope relativos)', !!m && m.start_url === './?source=pwa' && m.scope === './' && m.id === './'); }
  r = await req('/icons/icon-192.png', https); ok('GET /icons/icon-192.png: cache de 1 ano, immutable, sem CSP', r.status === 200 && r.h['cache-control'] === 'public, max-age=31536000, immutable' && !r.h['content-security-policy'] && r.h['content-type'] === 'image/png');
  r = await req('/', {}); ok('HTTP puro redireciona para HTTPS (301)', r.status === 301 && r.h.location === `https://127.0.0.1:${APORT}/`, `${r.status} ${r.h.location}`);
  r = await req('/sw.js', { 'x-forwarded-proto': 'http' }); ok('o redirecionamento mantém o caminho', r.status === 301 && /\/sw\.js$/.test(r.h.location || ''));
  r = await req('/', { ...https, host: 'www.datavix.app' }); ok('www.datavix.app → https://datavix.app/ (301)', r.status === 301 && r.h.location === 'https://datavix.app/', `${r.status} ${r.h.location}`);
  r = await req('/', { ...https, host: 'datavix.app' }); ok('datavix.app (HTTPS) não redireciona', r.status === 200);
  r = await req('/.htaccess', https); ok('/.htaccess não é servido', r.status === 403 || r.status === 404, String(r.status));
  r = await req('/icons/', https); ok('listagem de pasta desligada', r.status === 403 || r.status === 404, String(r.status));
  r = await req('/nao-existe', https); ok('caminho inexistente dá 404', r.status === 404);

  // ---- 3) Chrome headless, atrás de um proxy que simula o HTTPS da Hostinger (X-Forwarded-Proto)
  proxy = http.createServer((q, s) => { const p = http.request({ host: '127.0.0.1', port: APORT, path: q.url, method: q.method, headers: { ...q.headers, 'x-forwarded-proto': 'https' } }, rr => { s.writeHead(rr.statusCode, rr.headers); rr.pipe(s); }); q.pipe(p); p.on('error', () => { s.statusCode = 502; s.end(); }); }).listen(PPORT, '127.0.0.1');
  const probe = PROBE;
  const cr = await chromeProbe(`http://127.0.0.1:${PPORT}/`, probe), pg = cr.pg, viol = cr.viol;
  ok('Chrome abriu o app (título e landing)', !!pg && pg.title === 'Datavix' && pg.landing, pg ? (pg.nosw ? JSON.stringify(pg) : '') : cr.err);
  ok('nenhuma violação de CSP no console (cabeçalho + meta valendo juntos)', viol.length === 0, viol[0] || '');
  ok('service worker ativo no endereço raiz', !!pg && pg.sw && pg.swState === 'activated', pg && pg.sw ? `${pg.swState} ${pg.scope}` : JSON.stringify(pg && pg.err) + ' · apache: ' + (fs.existsSync(path.join(AP, 'access.log')) ? fs.readFileSync(path.join(AP, 'access.log'), 'utf8').split('\n').filter(l => /sw\.js|manifest|icons/.test(l)).join(' | ') : 'sem log'));
  ok('cache do app com os 7 arquivos (index, manifesto, 4 ícones e a raiz)', !!pg && /^datavix-/.test(pg.cache || '') && pg.items === 7, pg ? `${pg.cache} · ${pg.items}` : '');
  ok('política de privacidade diz Hostinger (PT e EN) e não diz GitHub Pages', !!pg && !!pg.priv && pg.priv.ptHostinger && pg.priv.enHostinger && !pg.priv.ptGithub && !pg.priv.enGithub, pg ? JSON.stringify(pg.priv) : '');
  ok(distArg ? 'primeira visita (informativo: sites montados antes da correção recarregam uma vez)' : 'a primeira visita não recarrega a página (1 navegação)', distArg ? cr.navs <= 2 : cr.navs === 1, `${cr.navs} navegação(ões)`);
} catch (e) {
  if (!/__fim__/.test(String(e && e.message))) ok('execução sem erro', false, e.stack);
} finally {
  if (proxy) proxy.close();
  if (apache) sh('/usr/sbin/httpd', ['-f', path.join(AP, 'httpd.conf'), '-k', 'stop']);
  await sleep(300); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* segue */ }
  console.log(out.join('\n')); console.log(bad.length ? `\nFALHOU: ${bad.length} verificação(ões)` : `\ntudo certo (${out.length} verificações)`);
  process.exit(bad.length ? 1 : 0);
}
