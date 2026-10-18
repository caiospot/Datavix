// Migração para a Hostinger: confere o build para Apache/LiteSpeed antes de subir. Uso: node test/hostinger-check.mjs
// 1) copia as fontes para uma pasta temporária e faz o build como o GitHub Actions faz (DATAVIX_HOST=hostinger, DATAVIX_SITE=datavix.app, sem .env.local);
// 2) sobe um Apache 2.4 local (o do macOS) lendo o .htaccess gerado e confere cabeçalhos, cache, compressão e redirecionamentos;
// 3) abre o app no Chrome headless atrás de um proxy que simula o HTTPS da Hostinger e confere: sem violação de CSP, service worker ativo, cache do app,
//    manifesto, política de privacidade falando da Hostinger. O LiteSpeed da Hostinger é compatível com o Apache, mas a conferência final é no endereço temporário.
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-host-')), SRC = path.join(TMP, 'src'), DIST = path.join(SRC, 'dist'), AP = path.join(TMP, 'apache');
const APORT = 8771, PPORT = 8772, out = [], bad = [];
const ok = (k, v, extra) => { out.push(`${v ? 'ok    ' : 'FALHOU'} ${k}${extra ? ' · ' + extra : ''}`); if (!v) bad.push(k); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let apache = false, proxy = null;
const sh = (cmd, args, opt = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opt });
// assíncrono: o proxy roda neste mesmo processo e não pode ficar parado enquanto o Chrome carrega a página
const arun = (cmd, args, opt = {}) => new Promise(res => { const c = spawn(cmd, args, opt); let o = '', e = ''; c.stdout.on('data', d => (o += d)); c.stderr.on('data', d => (e += d)); const t = setTimeout(() => c.kill('SIGKILL'), opt.timeout || 90000); c.on('close', st => { clearTimeout(t); res({ status: st, stdout: o, stderr: e }); }); });

function req(p, headers = {}, port = APORT) {
  return new Promise((res, rej) => {
    const r = http.request({ host: '127.0.0.1', port, path: p, method: 'GET', headers: { 'accept-encoding': 'identity', ...headers } }, resp => { const ch = []; resp.on('data', c => ch.push(c)); resp.on('end', () => res({ status: resp.statusCode, h: resp.headers, body: Buffer.concat(ch) })); });
    r.on('error', rej); r.end();
  });
}

try {
  // ---- 1) build como no GitHub Actions
  fs.mkdirSync(SRC, { recursive: true });
  sh('rsync', ['-a', '--exclude=.git', '--exclude=test', '--exclude=dados-teste', '--exclude=dist', '--exclude=index.html', '--exclude=.env.local', '--exclude=node_modules', `${ROOT}/`, `${SRC}/`]);
  const b = sh('node', ['build.mjs'], { cwd: SRC, env: { ...process.env, DATAVIX_HOST: 'hostinger', DATAVIX_SITE: 'datavix.app', DATAVIX_CLARITY_HOST: 'datavix.app', DATAVIX_NPS_URL: '', DATAVIX_NPS_TOKEN: '' } });
  ok('build para a Hostinger', b.status === 0 && fs.existsSync(path.join(DIST, 'index.html')), (b.stdout || b.stderr || '').trim().split('\n').pop());
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
  ok('sem NPS no build de teste: nenhum host do Google na CSP', !/script\.google\.com/.test(meta));
  const cfg = JSON.parse((/window\.__DV=(\{.*?\});?<\/script>/s.exec(html) || /window\.__DV=(\{[^<]*\})/.exec(html) || [])[1] || 'null');
  ok('config do app: host hostinger, site datavix.app, Clarity só em datavix.app', !!cfg && cfg.host === 'hostinger' && cfg.site === 'datavix.app' && cfg.clarity && cfg.clarity.host === 'datavix.app'); const www = /RewriteCond %\{HTTP_HOST\} \^www\\\.datavix\\\.app\$ \[NC\]/.test(ht);
  ok('redirecionamento de www para datavix.app', www);

  // ---- 2) Apache local com o .htaccess
  fs.mkdirSync(AP, { recursive: true });
  const mods = ['mpm_prefork', 'unixd', 'authz_core', 'authz_host', 'mime', 'log_config', 'dir', 'filter', 'headers', 'rewrite', 'deflate', 'env', 'setenvif'];
  fs.writeFileSync(path.join(AP, 'httpd.conf'), [`ServerRoot "/usr"`, `Listen 127.0.0.1:${APORT}`, `PidFile "${AP}/httpd.pid"`, `ErrorLog "${AP}/error.log"`, 'LogLevel warn', ...mods.map(m => `LoadModule ${m}_module libexec/apache2/mod_${m}.so`), 'ServerName 127.0.0.1', `DocumentRoot "${DIST}"`, 'TypesConfig "/private/etc/apache2/mime.types"',
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
  const pageJs = path.join(TMP, 'page.js');
  fs.writeFileSync(pageJs, `(async () => { try { const sl = ms => new Promise(r => setTimeout(r, ms)); await sl(2500);
    if (!navigator.serviceWorker) return JSON.stringify({ title: document.title, nosw: true, url: location.href, secure: window.isSecureContext, body: document.body ? document.body.innerText.slice(0, 120) : '' });
    const reg = await Promise.race([navigator.serviceWorker.ready, sl(15000).then(() => null)]); const keys = await caches.keys(), ck = keys.find(k => /^datavix-/.test(k)), items = ck ? (await (await caches.open(ck)).keys()).length : 0;
    LANG = 'pt'; const pt = privBody(); LANG = 'en'; const en = privBody(); LANG = 'pt';
    return JSON.stringify({ title: document.title, landing: document.body.innerText.length > 200, sw: !!(reg && reg.active), swState: reg && reg.active && reg.active.state, cache: ck || null, items, scope: reg && reg.scope,
      priv: { ptHostinger: /servido pela Hostinger/.test(pt), ptGithub: /GitHub Pages/.test(pt), enHostinger: /served by Hostinger/.test(en), enGithub: /GitHub Pages/.test(en) }, scripts: document.scripts.length }); } catch (e) { return 'ERRO ' + e.stack; } })()`);
  const cdp = await arun('node', [path.join(ROOT, 'test/cdp.mjs'), `http://127.0.0.1:${PPORT}/`, '4', pageJs], { cwd: ROOT, timeout: 90000 });
  const txt = (cdp.stdout || '') + (cdp.stderr || ''), js = /\{"title".*\}/.exec(txt), pg = js ? JSON.parse(js[0]) : null;
  const viol = txt.split('\n').filter(l => /Content Security Policy|Refused to|violat/i.test(l));
  ok('Chrome abriu o app (título e landing)', !!pg && pg.title === 'Datavix' && pg.landing, pg ? (pg.nosw ? JSON.stringify(pg) : '') : txt.slice(0, 160));
  ok('nenhuma violação de CSP no console (cabeçalho + meta valendo juntos)', viol.length === 0, viol[0] || '');
  ok('service worker ativo no endereço raiz', !!pg && pg.sw && pg.swState === 'activated', pg ? `${pg.swState} ${pg.scope}` : '');
  ok('cache do app com os 7 arquivos (index, manifesto, 4 ícones e a raiz)', !!pg && /^datavix-/.test(pg.cache || '') && pg.items === 7, pg ? `${pg.cache} · ${pg.items}` : '');
  ok('política de privacidade diz Hostinger (PT e EN) e não diz GitHub Pages', !!pg && pg.priv.ptHostinger && pg.priv.enHostinger && !pg.priv.ptGithub && !pg.priv.enGithub, pg ? JSON.stringify(pg.priv) : '');
} catch (e) {
  ok('execução sem erro', false, e.stack);
} finally {
  if (proxy) proxy.close();
  if (apache) sh('/usr/sbin/httpd', ['-f', path.join(AP, 'httpd.conf'), '-k', 'stop']);
  await sleep(300); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* segue */ }
  console.log(out.join('\n')); console.log(bad.length ? `\nFALHOU: ${bad.length} verificação(ões)` : `\ntudo certo (${out.length} verificações)`);
  process.exit(bad.length ? 1 : 0);
}
