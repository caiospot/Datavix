// Monta o app em um único HTML (index.html) e o site pronto para publicar em dist/: landing e páginas de conteúdo (PT e EN) na raiz, o app em /app/. Uso: node build.mjs
// DATAVIX_LEGACY=1 monta, em vez disso, só a página de aviso do endereço antigo (GitHub Pages).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildSite } from './site/generate.mjs';
const r = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const b64 = s => Buffer.from(s, 'utf8').toString('base64');
const b64f = p => fs.readFileSync(new URL(p, import.meta.url)).toString('base64');
const worker = [r('vendor/papaparse.min.js'), r('vendor/xlsx.full.min.js'), r('src/parser.worker.js')].join('\n;\n');
// contornos simplificados dos estados (IBGE, CC BY 4.0): vendor/geo/brasil-uf.json, gerado por scripts/make-brasil.py
const geoBr = 'const GEO_BR = ' + r('vendor/geo/brasil-uf.json') + ';\n';
const shared = [r('src/i18n.js'), r('src/i18n-charts.js'), r('src/areas.js'), r('src/data.js'), r('src/piece.js'), r('src/charts.js'), r('src/cardcol.js'), r('src/organism.js'), r('src/rays.js'), r('src/river.js'), r('src/fan.js'), r('src/ridge.js'), r('src/flow.js'), r('src/gallery.js'), r('src/gallery2.js'), r('src/gallery3.js'), geoBr + r('src/gallery4.js'), r('src/altviews.js'), r('src/narrative.js'), r('src/story.js'), r('src/storyplan.js'), r('src/stories.js'), r('src/versus.js'), r('src/versusplan.js'), r('src/versusphases.js'), r('src/wbrecon.js'), r('src/modelx.js'), r('src/ficha.js'), r('src/seasonplan.js'), r('src/wbslides.js'), r('src/runtime.js')].join('\n');
// biblioteca de fontes do editor (vendor/fonts/lib, ver scripts/fetch-fonts.mjs): vira um objeto { família: [{ w, b: base64 }] }; só entra no app
const fontIndex = JSON.parse(r('vendor/fonts/lib/index.json'));
const fontLib = 'const FONT_LIB = ' + JSON.stringify(Object.fromEntries(Object.entries(fontIndex).map(([fam, faces]) => [fam, faces.map(f => ({ w: f.weight, b: b64f('vendor/fonts/lib/' + f.file) }))]))) + ';\n';
// imagens da landing (seção "Como funciona"): entram no arquivo único como data URI
const lpImgs = 'const LP_IMGS = ' + JSON.stringify([['passo-1.png', 'png'], ['passo-2.png', 'png'], ['passo-3.png', 'png'], ['passo-4.png', 'png']].map(([f, t]) => `data:image/${t};base64,` + b64f('src/assets/landing/' + f))) + ';';
const js = [shared, r('src/store.js'), r('src/modal.js'), lpImgs + r('src/landing.js'), r('src/export.js'), r('src/pptx.js'), r('src/pxvec.js'), r('src/mp4.js'), r('src/video.js'), r('src/understand.js'), r('src/read.js'), r('src/cases.js'), r('src/builder.js'), r('src/modelgallery.js'), r('src/storyui.js'), r('src/workbook.js'), r('src/analytics.js'), r('src/pwa.js'), r('src/nps.js'), r('src/privacy.js'), fontLib + r('src/fontlib.js'), r('src/icons.js'), r('src/ui.js')].join('\n');
const fonts = r('vendor/fonts/fonts-embedded.css');
// tela de carregamento: SVG de uma árvore radial mínima, gerada aqui com números fixos (sem aleatório em tempo de execução)
function splashHtml() {
  let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, C = 110, T2 = Math.PI * 2, f = n => n.toFixed(1);
  const P = (a, r) => [C + Math.cos(a) * r, C + Math.sin(a) * r];
  let g1 = '', g2 = '', g3 = '';
  for (let h = 0; h < 7; h++) {
    const ah = -Math.PI / 2 + (h + 0.5) / 7 * T2, [hx, hy] = P(ah, 34);
    g1 += `<path class="ln" d="M${C} ${C}L${f(hx)} ${f(hy)}"/><circle class="dt" cx="${f(hx)}" cy="${f(hy)}" r="2.4"/>`;
    for (let e = -1; e <= 1; e++) {
      const ae = ah + e * 0.17, [ex, ey] = P(ae, 72), [mx, my] = P(ah + e * 0.08, 53);
      g2 += `<path class="ln" d="M${f(hx)} ${f(hy)}Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}"/><circle class="dt" cx="${f(ex)}" cy="${f(ey)}" r="1.5"/>`;
      for (let k = 0; k < 2; k++) {
        const al = ae + (k - 0.5) * 0.075, [lx, ly] = P(al, 100), rad = 1.8 + Math.pow(rnd(), 2.2) * 9;
        g3 += `<path class="ln" d="M${f(ex)} ${f(ey)}L${f(lx)} ${f(ly)}"/><circle class="lf" cx="${f(lx)}" cy="${f(ly)}" r="${f(rad)}"/>`;
      }
    }
  }
  return `<div id="dvs" role="status" aria-live="polite"><div class="in"><svg viewBox="0 0 220 220" aria-hidden="true"><g class="g g1">${g1}</g><g class="g g2">${g2}</g><g class="g g3">${g3}</g><circle class="rt" cx="110" cy="110" r="5"/></svg>
<div class="brand"><i></i>DATAVIX</div><div class="tag" id="dvs-tag">Tudo vira <b>dado</b>.</div><div class="bar"><i></i></div><div class="st" id="dvs-st">Carregando…</div></div></div>
<script>(function(){var pt=/^pt/i.test(navigator.language||'pt'),t=document.getElementById('dvs-tag'),s=document.getElementById('dvs-st');if(!pt){t.innerHTML='Everything becomes <b>data</b>.';s.textContent='Loading…';}
window.dvSplash={set:function(x){var e=document.getElementById('dvs-st');if(e)e.textContent=x;},done:function(){var e=document.getElementById('dvs');if(!e)return;e.classList.add('out');setTimeout(function(){if(e.parentNode)e.parentNode.removeChild(e);},600);}};
setTimeout(function(){if(window.dvSplash)window.dvSplash.set(pt?'Quase lá…':'Almost there…');},4000);
// se algo travar, a tela de carregamento mostra o motivo em vez de ficar parada para sempre
function fail(m){var e=document.getElementById('dvs-st'),b=document.getElementById('dvs');if(!e||!b)return;e.textContent=(pt?'Não foi possível iniciar: ':'Could not start: ')+m;e.style.color='#ff8a7a';e.style.maxWidth='440px';e.style.lineHeight='1.5';e.style.whiteSpace='normal';var bar=b.querySelector('.bar');if(bar)bar.style.display='none';}
window.addEventListener('error',function(ev){fail(String(ev.message||'erro')+(ev.lineno?' (linha '+ev.lineno+')':''));});
window.addEventListener('unhandledrejection',function(ev){fail(String((ev.reason&&ev.reason.message)||ev.reason||'erro'));});
setTimeout(function(){fail(pt?'o app demorou demais para carregar. Abra o console do navegador (Safari: Desenvolvedor > Console; Chrome: Cmd+Opt+J) e envie a mensagem de erro.':'the app took too long to load. Open the browser console and share the error message.');},15000);})();</script>`;
}
const splash = splashHtml();
// NPS: o endereço (Google Apps Script) e o token entram só na hora do build, por variável de ambiente; sem eles o NPS fica desligado
// .env.local (fora do git): linhas CHAVE=valor, para não digitar DATAVIX_NPS_URL/DATAVIX_NPS_TOKEN a cada build
try { for (const ln of fs.readFileSync(new URL('.env.local', import.meta.url), 'utf8').split('\n')) { const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(ln); if (m && !ln.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); } } catch (e) { /* sem .env.local */ }
const NPS_URL = process.env.DATAVIX_NPS_URL || '', NPS_TOKEN = process.env.DATAVIX_NPS_TOKEN || '';
// Microsoft Clarity (opcional, só no site publicado e só com aceite): o id é público; DATAVIX_CLARITY_ID='' desliga
const CLARITY_ID = process.env.DATAVIX_CLARITY_ID !== undefined ? process.env.DATAVIX_CLARITY_ID : 'yun6nstisc', CLARITY_HOST = process.env.DATAVIX_CLARITY_HOST || 'caiospot.github.io';
const clHosts = CLARITY_ID ? { script: ' https://www.clarity.ms https://scripts.clarity.ms', connect: ' https://*.clarity.ms https://c.bing.com', img: ' https://*.clarity.ms https://c.bing.com' } : { script: '', connect: '', img: '' };
const npsHosts = NPS_URL ? ' https://script.google.com https://script.googleusercontent.com' : '';
const CSP = `default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval' blob:${clHosts.script}; worker-src 'self' blob:; connect-src blob: data:${npsHosts}${clHosts.connect}; manifest-src 'self'; media-src blob:; style-src 'unsafe-inline'; font-src data:; img-src 'self' data: blob:${clHosts.img}`;
let html = r('src/index.template.html')
  .replace('__CSP__', () => CSP)
  .replace('__CSS__', () => fonts + '\n' + r('src/styles.css') + '\n' + r('src/piece.css'))
  .replace('__WORKER__', () => b64(worker))
  .replace('__VZJS__', () => b64f('vendor/vizzu.min.js'))
  .replace('__VZWASM__', () => b64f('vendor/cvizzu.wasm'))
  .replace('__EXPSRC__', () => b64(shared))
  .replace('__EXPBOOT__', () => b64(r('src/export-boot.js')))
  .replace('__SPLASHCSS__', () => r('src/splash.css'))
  .replace('__SPLASH__', () => splash)
  .replace('__EXPSPLASH__', () => b64(splash))
  .replace('__EXPSPLASHCSS__', () => b64(r('src/splash.css')))
  .replace('__EXPCSS__', () => b64(fonts + '\n' + r('src/piece.css') + '\n' + r('src/export.css')))
  .replace('__JS__', () => js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--'));
import crypto from 'node:crypto';
const BUILD = crypto.createHash('sha1').update(html.replace('__DVCFG__', '')).digest('hex').slice(0, 10);
html = html.replace('__DVCFG__', () => JSON.stringify({ build: BUILD, nps: NPS_URL ? { url: NPS_URL, token: NPS_TOKEN } : null, contact: process.env.DATAVIX_CONTACT_EMAIL || '', site: process.env.DATAVIX_SITE || '', host: process.env.DATAVIX_HOST === 'hostinger' ? 'hostinger' : 'github', clarity: CLARITY_ID ? { id: CLARITY_ID, host: CLARITY_HOST } : null }));
fs.writeFileSync(new URL('index.html', import.meta.url), html);
fs.mkdirSync(new URL('test/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('test/dev.html', import.meta.url), html.replace("connect-src blob: data:", "connect-src blob: data: 'self'").replace('<script>window.__DV=', '<script>window.__DV_NPS={url:"/nps",token:"dev-token"};window.__DV_NOFIND=true;window.__DV='));
// ---------------------------------------------------------------- dist/: o site pronto para publicar
// Layout: / (PT) e /en/ (EN) com as páginas de conteúdo, /app/ com o app (HTML único, service worker, manifesto e ícones próprios), robots.txt, sitemap.xml, llms.txt.
// A CSP do app vale só para /app/index.html (no sw.js ela bloquearia as buscas do service worker: ver test/hostinger-check.mjs --csp-all); as páginas do site levam a própria CSP (sem scripts) na meta tag.
const LEGACY = process.env.DATAVIX_LEGACY === '1';
const SITE_HOST = (process.env.DATAVIX_SITE || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const ORIGIN = 'https://' + (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(SITE_HOST) ? SITE_HOST.replace(/^www\./, '') : 'datavix.app');
const distUrl = new URL('dist/', import.meta.url), distDir = fileURLToPath(distUrl);
fs.rmSync(distDir, { recursive: true, force: true }); fs.mkdirSync(distDir, { recursive: true });
const put = (rel, data) => { const f = new URL(rel, distUrl); fs.mkdirSync(new URL('./', f), { recursive: true }); fs.writeFileSync(f, data); };
const TEXTS = 'text/html text/css text/javascript application/javascript application/json application/manifest+json image/svg+xml text/plain application/xml image/x-icon';
const wwwRule = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(SITE_HOST) && !SITE_HOST.startsWith('www.') ? [`# www vira ${SITE_HOST}`, `RewriteCond %{HTTP_HOST} ^www\\.${SITE_HOST.replace(/\./g, '\\.')}$ [NC]`, `RewriteRule ^ https://${SITE_HOST}%{REQUEST_URI} [L,R=301]`] : [];
const IMMUTABLE = '<IfModule mod_headers.c>\nHeader set Cache-Control "public, max-age=31536000, immutable"\n</IfModule>\n';
// os documentos HTML dos clipes (assets/clips/*.html) têm hash no nome, como o resto de assets/: a regra de "no-cache" para .html da raiz não vale para eles
const IMMUTABLE_ASSETS = '<IfModule mod_headers.c>\nHeader set Cache-Control "public, max-age=31536000, immutable"\n<FilesMatch "\\.html$">\nHeader set Cache-Control "public, max-age=31536000, immutable"\n</FilesMatch>\n</IfModule>\n';
let summary = '';
if (LEGACY) {
  // endereço antigo (GitHub Pages): só um aviso que leva para o endereço novo, mais o service worker de limpeza para quem tinha o app instalado aqui
  const css = fs.readFileSync(new URL('site/site.css', import.meta.url), 'utf8').replace(/@font-face\{[^}]*\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,>])\s*/g, '$1').replace(/:\s+/g, ':').replace(/;}/g, '}').trim();
  const cspL = `default-src 'none'; style-src 'sha256-${crypto.createHash('sha256').update(css).digest('base64')}'; base-uri 'none'; form-action 'none'`;
  const notice = `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>O Datavix mudou de endereço · Datavix has moved</title>\n<meta name="description" content="O Datavix agora está em ${SITE_HOST || 'datavix.app'}. Datavix is now at ${SITE_HOST || 'datavix.app'}.">\n<link rel="canonical" href="${ORIGIN}/">\n<meta http-equiv="refresh" content="8;url=${ORIGIN}/">\n<meta http-equiv="Content-Security-Policy" content="${cspL}">\n<meta name="color-scheme" content="dark light">\n<style>${css}</style>\n</head>\n<body>\n<main class="notice"><div class="box">\n<p class="brand"><i></i>DATAVIX</p>\n<h1 lang="pt-BR">O Datavix mudou de endereço</h1>\n<p lang="pt-BR">Agora o Datavix está em <a href="${ORIGIN}/">${ORIGIN.replace('https://', '')}</a>. Este endereço antigo não abre mais o app, e você será levado ao novo em alguns segundos.</p>\n<div class="cta"><a class="btn" href="${ORIGIN}/">Ir para ${ORIGIN.replace('https://', '')}</a><a class="btn ghost" href="${ORIGIN}/app/">Abrir o app</a></div>\n<p lang="pt-BR"><small>Projetos que você salvou neste endereço ficam guardados só neste navegador e não aparecem no endereço novo.</small></p>\n<hr>\n<h1 lang="en">Datavix has moved</h1>\n<p lang="en">Datavix is now at <a href="${ORIGIN}/en/">${ORIGIN.replace('https://', '')}</a>. This old address no longer opens the app, and you will be taken to the new one in a few seconds.</p>\n<div class="cta"><a class="btn" href="${ORIGIN}/en/">Go to ${ORIGIN.replace('https://', '')}</a><a class="btn ghost" href="${ORIGIN}/app/?lang=en">Open the app</a></div>\n<p lang="en"><small>Projects you saved at this address stay in this browser only and do not appear at the new address.</small></p>\n</div></main>\n</body>\n</html>\n`;
  put('index.html', notice); put('404.html', notice); put('sw.js', r('pwa/legacy-sw.js')); put('.nojekyll', '');
  summary = `· endereço antigo: página de aviso para ${ORIGIN}`;
} else {
  // ---- o app em /app/ (index.html, sw.js, manifesto e ícones dele, todos com caminho relativo: o escopo do service worker é /app/)
  put('app/index.html', html);
  put('app/sw.js', r('pwa/sw.js').replace('__BUILD__', BUILD));
  put('app/manifest.webmanifest', r('pwa/manifest.webmanifest'));
  for (const f of fs.readdirSync(new URL('pwa/icons/', import.meta.url))) { const b = fs.readFileSync(new URL('pwa/icons/' + f, import.meta.url)); put('app/icons/' + f, b); put('icons/' + f, b); }
  put('app/.htaccess', ['# Datavix: gerado por build.mjs (não edite aqui). O app: CSP própria só no HTML, fora dos buscadores, sempre revalidado.', '<IfModule mod_headers.c>', '<FilesMatch "^index\\.html$">', `Header set Content-Security-Policy "${CSP}"`, 'Header set X-Robots-Tag "noindex"', '</FilesMatch>', '<FilesMatch "^(index\\.html|sw\\.js|manifest\\.webmanifest)$">', 'Header set Cache-Control "no-cache"', '</FilesMatch>', '</IfModule>', ''].join('\n'));
  put('app/icons/.htaccess', IMMUTABLE);
  // ---- o site estático: landing e páginas de conteúdo em PT (/) e EN (/en/), robots.txt, sitemap.xml, llms.txt, 404, imagens e cartões de compartilhamento
  const site = buildSite({ root: new URL('./', import.meta.url), out: distDir, origin: ORIGIN, host: process.env.DATAVIX_HOST === 'hostinger' ? 'hostinger' : 'github', contactEmail: process.env.DATAVIX_CONTACT_EMAIL || '', gsc: process.env.DATAVIX_GSC_TOKEN || '', bing: process.env.DATAVIX_BING_TOKEN || '', sameAs: (process.env.DATAVIX_SAMEAS || '').split(',').map(x => x.trim()).filter(Boolean) });
  put('assets/.htaccess', IMMUTABLE_ASSETS); put('icons/.htaccess', IMMUTABLE); put('og/.htaccess', '<IfModule mod_headers.c>\nHeader set Cache-Control "public, max-age=86400"\n</IfModule>\n');
  // ---- raiz: service worker de limpeza e manifesto antigo (quem instalou o app quando ele morava na raiz passa a abrir /app/)
  put('sw.js', r('pwa/legacy-sw.js'));
  const man = JSON.parse(r('pwa/manifest.webmanifest')); man.start_url = '/app/?source=pwa'; man.scope = '/'; man.id = './';
  put('manifest.webmanifest', JSON.stringify(man, null, 2) + '\n');
  // ---- servidores: Apache/LiteSpeed (Hostinger) lê o .htaccess; Netlify e Cloudflare Pages leem o _headers
  put('.htaccess', [
    '# Datavix: gerado por build.mjs (não edite aqui). Servidor Apache/LiteSpeed, como a hospedagem da Hostinger.',
    'DirectoryIndex index.html', 'Options -Indexes', 'AddDefaultCharset UTF-8', 'AddType application/manifest+json .webmanifest', 'AddType image/webp .webp', 'AddType font/woff2 .woff2', 'ErrorDocument 404 /404.html', '',
    '<IfModule mod_rewrite.c>', 'RewriteEngine On', ...wwwRule,
    '# HTTPS sempre (atrás de proxy, vale o X-Forwarded-Proto)', 'RewriteCond %{HTTPS} !=on', 'RewriteCond %{HTTP:X-Forwarded-Proto} !=https', 'RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
    '# uma URL por página: /pasta/index.html vira /pasta/ (o app, em /app/, fica de fora: o service worker guarda ./index.html)', 'RewriteCond %{REQUEST_URI} !^/app/', 'RewriteCond %{THE_REQUEST} \\s/(.*/)?index\\.html[?\\s]', 'RewriteRule ^(.*/)?index\\.html$ /$1 [L,R=301]', '</IfModule>', '',
    '<IfModule mod_headers.c>',
    'Header set X-Content-Type-Options "nosniff"', 'Header set Referrer-Policy "no-referrer"', 'Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"', 'Header set Strict-Transport-Security "max-age=31536000" env=HTTPS',
    '<FilesMatch "\\.(html|txt|xml|webmanifest)$">', 'Header set Cache-Control "no-cache"', '</FilesMatch>', '<FilesMatch "^sw\\.js$">', 'Header set Cache-Control "no-cache"', '</FilesMatch>',
    '</IfModule>', '',
    '<IfModule mod_deflate.c>', `AddOutputFilterByType DEFLATE ${TEXTS}`, '</IfModule>',
    '<IfModule mod_brotli.c>', `AddOutputFilterByType BROTLI_COMPRESS ${TEXTS}`, '</IfModule>', ''].join('\n'));
  const appHdr = `  Content-Security-Policy: ${CSP}\n  Cache-Control: no-cache\n  X-Robots-Tag: noindex\n`;
  put('_headers', `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n/app/\n${appHdr}/app/index.html\n${appHdr}/app/sw.js\n  Cache-Control: no-cache\n/app/manifest.webmanifest\n  Cache-Control: no-cache\n/app/icons/*\n  Cache-Control: public, max-age=31536000, immutable\n/icons/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/og/*\n  Cache-Control: public, max-age=86400\n/sw.js\n  Cache-Control: no-cache\n`);
  const INDEXNOW = (process.env.DATAVIX_INDEXNOW_KEY || '').trim(); if (/^[a-zA-Z0-9-]{8,128}$/.test(INDEXNOW)) put(INDEXNOW + '.txt', INDEXNOW); // IndexNow (Bing e outros): o arquivo-chave na raiz; o aviso das mudanças é manual (scripts/indexnow.mjs)
  put('.nojekyll', '');
  summary = `· site: ${site.pages.length} páginas (${site.pages.filter(p => p.lang === 'pt-BR').length} PT + ${site.pages.filter(p => p.lang === 'en').length} EN), CSS ${(site.cssBytes / 1024).toFixed(1)} KB`;
}
console.log('index.html', (html.length / 1024).toFixed(0), 'KB · build', BUILD, NPS_URL ? '· NPS ligado' : '· NPS desligado', '· dist/ pronto', summary);
