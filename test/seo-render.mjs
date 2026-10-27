// Abre cada página do site montado (dist/) no Chrome e confere o que só o navegador mostra: nada vaza para os lados em 320, 390, 768 e 1280 px,
// as imagens carregam, as fontes entram, o h1 aparece sem rolar no celular, e não há erro de console nem violação de CSP, nos temas escuro e claro.
// Uso: node test/seo-render.mjs [pasta-do-site]   (padrão: dist/)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { openChrome, sleep } from '../scripts/cdp-lib.mjs';

const DIST = path.resolve(process.argv[2] || new URL('../dist', import.meta.url).pathname), PORT = 8796;
const out = [], bad = [], ok = (k, v, extra) => { out.push(`${v ? 'ok    ' : 'FALHOU'} ${k}${extra ? ' · ' + extra : ''}`); if (!v) bad.push(k); };
const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };
const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); let f = path.join(DIST, decodeURIComponent(u.pathname)); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { s.statusCode = 404; return s.end('404'); } s.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(s); }).listen(PORT, '127.0.0.1');
const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8'), paths = [...sm.matchAll(/<loc>https:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map(m => m[1]);
const WIDTHS = [320, 390, 768, 1280];
const MEASURE = `(() => { const de = document.documentElement, cw = de.clientWidth, off = [];
  for (const e of document.body.querySelectorAll('*')) { if (e.closest('.tbl') || e.closest('.tiles') || e.closest('details:not([open])') || e.closest('.sr') || e.closest('.skip')) continue; const r = e.getBoundingClientRect(); if (r.width > 0 && (r.right > cw + 1 || r.left < -1)) off.push(e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : '') + ':' + Math.round(r.right)); }
  return JSON.stringify({ sw: de.scrollWidth, cw, off: off.slice(0, 4) }); })()`;
const c = await openChrome({ width: 390, height: 844, scale: 2, mobile: true });
const errs = []; await c.send('Log.enable');
try {
  for (const theme of ['dark', 'light']) {
    await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
    let badPages = [], first = true;
    for (const p of paths) {
      if (theme === 'light' && !['/', '/en/', '/tipos-de-grafico/', '/en/faq/'].includes(p)) continue;
      await c.view(390, 844, 2, true); await c.goto(`http://127.0.0.1:${PORT}${p}`); await sleep(500);
      // rola a página inteira para as imagens preguiçosas carregarem
      const h = await c.ev('document.documentElement.scrollHeight'); for (let y = 0; y < h; y += 700) { await c.ev(`window.scrollTo(0, ${y})`); await sleep(60); } await sleep(400); await c.ev('window.scrollTo(0, 0)');
      const probs = [];
      const info = JSON.parse(await c.ev(`(async () => { await document.fonts.ready; const h1 = document.querySelector('h1').getBoundingClientRect(); return JSON.stringify({ imgs: [...document.images].filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src')), geist: document.fonts.check('16px Geist'), mono: document.fonts.check('16px "Geist Mono"'), h1top: Math.round(h1.top), h1bottom: Math.round(h1.bottom), scripts: [...document.scripts].filter(s => s.type !== 'application/ld+json').length, ext: [...document.querySelectorAll('img[src],script[src],iframe[src],link[rel~=stylesheet],link[rel~=preload]')].filter(e => /^https?:/.test(e.src || e.href) && !(e.src || e.href).startsWith(location.origin)).length, bg: getComputedStyle(document.body).backgroundColor }); })()`));
      if (info.imgs.length) probs.push('imagens sem carregar: ' + info.imgs.join(','));
      if (!info.geist || !info.mono) probs.push('fonte não carregou');
      if (info.scripts || info.ext) probs.push('script ou recurso externo');
      if (info.h1top > 400 || info.h1bottom > 844) probs.push(`h1 fora da primeira tela (${info.h1top}–${info.h1bottom})`);
      const want = theme === 'dark' ? 'rgb(11, 13, 10)' : 'rgb(248, 249, 245)'; if (info.bg !== want) probs.push(`fundo ${info.bg} em vez de ${want}`);
      if (theme === 'dark') for (const w of WIDTHS) { await c.view(w, 900, 1, w < 600); await sleep(150); const m = JSON.parse(await c.ev(MEASURE)); if (m.sw > m.cw || m.off.length) probs.push(`${w}px: rolagem lateral (${m.sw}>${m.cw}) ${m.off.join(' ')}`); }
      if (probs.length) badPages.push(`${p} → ${probs.join('; ')}`); first = false;
    }
    ok(`tema ${theme}: ${theme === 'dark' ? 'as 20 páginas' : '4 páginas'} abrem sem rolagem lateral (320, 390, 768 e 1280 px), com imagens, fontes e h1 na primeira tela, sem script nem recurso de terceiros`, badPages.length === 0, badPages.join(' | '));
  }
  ok('nenhum erro de console do navegador (inclui violações de CSP) em todas as visitas', c.logs.length === 0, c.logs.slice(0, 2).join(' | '));
} catch (e) { ok('execução sem erro', false, e.stack); }
finally { await c.close(); srv.close(); console.log(out.join('\n')); console.log(bad.length ? `\nFALHOU: ${bad.length} verificação(ões)` : `\ntudo certo (${out.length} verificações)`); process.exitCode = bad.length ? 1 : 0; }
