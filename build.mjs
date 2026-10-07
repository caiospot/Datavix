// Monta o protótipo em um único HTML (dist/ e index.html). Uso: node build.mjs
import fs from 'node:fs';
const r = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const b64 = s => Buffer.from(s, 'utf8').toString('base64');
const b64f = p => fs.readFileSync(new URL(p, import.meta.url)).toString('base64');
const worker = [r('vendor/papaparse.min.js'), r('vendor/xlsx.full.min.js'), r('src/parser.worker.js')].join('\n;\n');
const shared = [r('src/i18n.js'), r('src/i18n-charts.js'), r('src/data.js'), r('src/piece.js'), r('src/charts.js'), r('src/cardcol.js'), r('src/organism.js'), r('src/rays.js'), r('src/river.js'), r('src/fan.js'), r('src/ridge.js'), r('src/flow.js'), r('src/altviews.js'), r('src/story.js'), r('src/runtime.js')].join('\n');
// biblioteca de fontes do editor (vendor/fonts/lib, ver scripts/fetch-fonts.mjs): vira um objeto { família: [{ w, b: base64 }] }; só entra no app
const fontIndex = JSON.parse(r('vendor/fonts/lib/index.json'));
const fontLib = 'const FONT_LIB = ' + JSON.stringify(Object.fromEntries(Object.entries(fontIndex).map(([fam, faces]) => [fam, faces.map(f => ({ w: f.weight, b: b64f('vendor/fonts/lib/' + f.file) }))]))) + ';\n';
const js = [shared, r('src/store.js'), r('src/modal.js'), r('src/landing.js'), r('src/export.js'), r('src/mp4.js'), r('src/video.js'), r('src/builder.js'), r('src/pwa.js'), r('src/nps.js'), r('src/privacy.js'), fontLib + r('src/fontlib.js'), r('src/icons.js'), r('src/ui.js')].join('\n');
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
const NPS_URL = process.env.DATAVIX_NPS_URL || '', NPS_TOKEN = process.env.DATAVIX_NPS_TOKEN || '';
const npsHosts = NPS_URL ? ' https://script.google.com https://script.googleusercontent.com' : '';
const CSP = `default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval' blob:; worker-src 'self' blob:; connect-src blob: data:${npsHosts}; manifest-src 'self'; media-src blob:; style-src 'unsafe-inline'; font-src data:; img-src 'self' data: blob:`;
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
html = html.replace('__DVCFG__', () => JSON.stringify({ build: BUILD, nps: NPS_URL ? { url: NPS_URL, token: NPS_TOKEN } : null, contact: process.env.DATAVIX_CONTACT_EMAIL || '', site: process.env.DATAVIX_SITE || '' }));
fs.writeFileSync(new URL('index.html', import.meta.url), html);
fs.mkdirSync(new URL('test/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('test/dev.html', import.meta.url), html.replace("connect-src blob: data:", "connect-src blob: data: 'self'").replace('<script>window.__DV=', '<script>window.__DV_NPS={url:"/nps",token:"dev-token"};window.__DV_NOFIND=true;window.__DV='));
// pasta pronta para publicar (Netlify, Cloudflare Pages, GitHub Pages...): app + manifesto + service worker + ícones
const dist = new URL('dist/', import.meta.url); fs.mkdirSync(new URL('icons/', dist), { recursive: true });
fs.writeFileSync(new URL('index.html', dist), html);
fs.writeFileSync(new URL('sw.js', dist), r('pwa/sw.js').replace('__BUILD__', BUILD));
fs.copyFileSync(new URL('pwa/manifest.webmanifest', import.meta.url), new URL('manifest.webmanifest', dist));
for (const f of fs.readdirSync(new URL('pwa/icons/', import.meta.url))) fs.copyFileSync(new URL('pwa/icons/' + f, import.meta.url), new URL('icons/' + f, dist));
fs.writeFileSync(new URL('_headers', dist), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: ${CSP}\n/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/manifest.webmanifest\n  Cache-Control: no-cache\n/icons/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
fs.writeFileSync(new URL('.nojekyll', dist), '');
console.log('index.html', (html.length / 1024).toFixed(0), 'KB · build', BUILD, NPS_URL ? '· NPS ligado' : '· NPS desligado', '· dist/ pronto');
