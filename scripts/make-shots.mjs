// Capturas reais do produto para o site (dados fictícios de dados-teste/exemplo-vendas.csv e sales-example.csv), em WebP, PT e EN.
// Precisa do build de teste (node build.mjs) e do servidor de teste (node test/server.mjs, porta 8768). Uso: node scripts/make-shots.mjs [nome ...] [--lang=pt|en]
import fs from 'node:fs';
import { openChrome, sleep } from './cdp-lib.mjs';

const OUT = new URL('../site/assets/img/', import.meta.url), MAN = new URL('manifest.json', OUT);
// largura e altura reais de um WebP (VP8, VP8L ou VP8X)
function webpSize(b) {
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error('não é WebP');
  const t = b.toString('ascii', 12, 16);
  if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (t === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
  if (t === 'VP8X') return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
  throw new Error('WebP desconhecido');
}
const manifest = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : {};
const want = process.argv.slice(2).filter(a => !a.startsWith('--')), langArg = (process.argv.find(a => a.startsWith('--lang=')) || '').slice(7);
const BASE = 'http://localhost:8768/test/dev.html';
const PRE = `window.__h = { sl: ms => new Promise(r => setTimeout(r, ms)), q: s => document.querySelector(s), qa: s => [...document.querySelectorAll(s)] };
window.__h.lang = l => { const b = __h.qa('button').find(x => x.textContent.trim() === l); if (b) b.click(); };
window.__h.up = async (file, sheet) => { const D = window.__datavix, S = D.S, sl = __h.sl;
  for (const k of ['org','rays','river','fan','ridge','flow','gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry'); await sl(200); S.ds = null; S.piece = null;
  D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer(), sheet); for (let i = 0; i < 300 && S.step !== 'preview' && S.step !== 'sheet'; i++) await sl(100); await sl(400); return S.step; };
window.__h.gen = async () => { const D = window.__datavix, S = D.S, sl = __h.sl, q = __h.q; D.go('mapping'); await sl(300); q('[data-a=generate]').click(); for (let i = 0; i < 200 && S.step !== 'editor'; i++) await sl(150);
  for (let i = 0; i < 100 && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(800); return S.step; };
window.__h.type = async v => { const b = __h.q('#panel .type[data-v=' + v + ']'); if (!b) return 'sem ' + v; b.click(); await __h.sl(600); return window.__datavix.S.piece.type; };`;

// cada captura: { w, h } do navegador; run(c, L) leva o app até a tela; variantes de largura em out
const SHOTS = {
  hero: { w: 1280, h: 800, dpr: 2, variants: [0.3125, 0.5, 1], tell: false, run: async (c, L) => { await c.ev(`__h.gen()`); await c.ev(`__h.type('organism')`); await sleep(7000); } },
  // o gráfico do cartão "Veja a animação" da landing do app, capturado do próprio cartão (sem texto, vale para os dois idiomas)
  passo3: { app: { card: '.lph-card.c3', el: '.lph-card.c3 .v3', wait: 7000 }, w: 1440, h: 900, dpr: 2, variants: [0.5, 1], once: true },
  // slides reais da apresentação do app (Rio vertical, dados fictícios): o 3º traz a descoberta com o "ver cálculo"; o 2º, a visão geral
  'slide-calc': { w: 1920, h: 1080, dpr: 2, variants: [0.2083, 0.3333, 0.6667], tell: false, run: async (c, L) => { await c.ev(`__h.gen()`); await sleep(1200); await c.ev(`__h.type('river')`); await sleep(3000); await c.ev(`(async () => { __h.q('[data-a=present]').click(); await __h.sl(1500); const pi = __h.q('.pintro .pi-btns button'); if (pi) { pi.click(); await __h.sl(800); } await window.__datavix.S.piece.pres.show(2); await __h.sl(4200); })()`); } },
  'slide-over': { w: 1920, h: 1080, dpr: 2, variants: [0.2083, 0.3333, 0.6667], tell: false, run: async (c, L) => { await c.ev(`__h.gen()`); await sleep(1200); await c.ev(`__h.type('river')`); await sleep(3000); await c.ev(`(async () => { __h.q('[data-a=present]').click(); await __h.sl(1500); const pi = __h.q('.pintro .pi-btns button'); if (pi) { pi.click(); await __h.sl(800); } await window.__datavix.S.piece.pres.show(1); await __h.sl(4200); })()`); } },
  race: { w: 1440, h: 810, tell: false, file: { pt: 'exemplo-corrida.csv', en: 'race-example.csv' }, run: async (c, L) => { await c.ev(`__h.gen()`); console.log('  tipo:', await c.ev(`__h.type('race')`)); for (const t of [3, 6, 10, 16]) { await sleep(t === 3 ? 3000 : (t - (t === 6 ? 3 : t === 10 ? 6 : 10)) * 1000); if (process.env.RACE_DEBUG) fs.writeFileSync(`/tmp/race-${L}-${t}.png`, await c.shot()); } } },
  leitura: { w: 1280, h: 800, tell: false, up: true, run: async (c, L) => { await c.ev(`(async () => { window.__datavix.go('read'); await __h.sl(1500); })()`); await sleep(800); } },
  calculo: { w: 1440, h: 900, tell: false, run: async (c, L) => { await c.ev(`__h.gen()`); await sleep(5000); await c.ev(`(async () => { const s = __h.q('details summary'); if (s) s.click(); await __h.sl(600); })()`); await sleep(500); } },
  modelos: { w: 1440, h: 900, tell: true, run: async (c, L) => { await c.ev(`__h.gen()`); for (let i = 0; i < 40; i++) { if (await c.ev(`!!__h.q('.mdl .mg')`)) break; await sleep(300); } await sleep(1500); } },
  exportar: { w: 1440, h: 900, tell: false, run: async (c, L) => { await c.ev(`__h.gen()`); await sleep(5000); await c.ev(`(async () => { const b = __h.q('[data-a=ptab][data-v=share]'); if (b) b.click(); await __h.sl(800); })()`); await sleep(500); } },
  graficos: { w: 1440, h: 1240, tell: false, run: async (c, L) => { await c.ev(`__h.gen()`); await sleep(5000); } },
  // recortes do painel da direita (seletor de gráficos e exportação), em 1x e 2x, para as páginas de conteúdo
  'painel-graficos': { w: 1440, h: 1240, tell: false, clip: { x: 1120, y: 64, width: 320, height: 1000 }, variants: [[320, 1], [640, 2]], run: async (c, L) => { await c.ev(`__h.gen()`); await sleep(5000); } },
  'painel-exportar': { w: 1440, h: 900, tell: false, clip: { x: 1120, y: 64, width: 320, height: 760 }, variants: [[320, 1], [640, 2]], run: async (c, L) => { await c.ev(`__h.gen()`); await sleep(5000); await c.ev(`(async () => { const b = __h.q('[data-a=ptab][data-v=share]'); if (b) b.click(); await __h.sl(800); })()`); await sleep(500); } },
};

for (const L of ['pt', 'en']) {
  if (langArg && langArg !== L) continue;
  for (const [name, def] of Object.entries(SHOTS)) {
    if (want.length && !want.includes(name)) continue;
    if (def.once && L !== 'pt') continue;
    const file = def.file ? def.file[L] : (L === 'pt' ? 'exemplo-vendas.csv' : 'sales-example.csv');
    const key = L === 'pt' || def.once ? name : name + '-en'; process.stdout.write(`${key} ...\n`);
    const c = await openChrome({ width: def.w, height: def.h, scale: def.dpr || 1 });
    try {
      let clip = def.clip || { x: 0, y: 0, width: def.w, height: def.h }, beyond = false;
      if (def.app) { // elemento da landing do app (servida pelo site local em 8780): o carrossel fica sem encaixe para o cartão parar onde medimos
        await c.goto(`http://localhost:8780/app/?lang=${L}`); await sleep(2500);
        await c.ev(`(() => { document.querySelectorAll('.lph-track').forEach(t => { t.style.scrollSnapType = 'none'; t.style.scrollBehavior = 'auto'; }); document.querySelector(${JSON.stringify(def.app.card)}).scrollIntoView({ block: 'center', inline: 'center' }); })()`); await sleep(def.app.wait || 5000);
        const r = JSON.parse(await c.ev(`(() => { const r = document.querySelector(${JSON.stringify(def.app.el)}).getBoundingClientRect(); return JSON.stringify({ x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, vw: innerWidth }); })()`));
        console.log('  elemento:', JSON.stringify(r)); clip = { x: r.x, y: r.y, width: r.width, height: r.height };
      } else {
        await c.goto(BASE + (def.tell ? '?tell' : '')); await sleep(2500);
        await c.ev(PRE); await c.ev(`__h.lang('${L.toUpperCase()}')`); await sleep(400);
        await c.ev(`__h.up(${JSON.stringify(file)})`);
        await def.run(c, L);
      }
      const variants = [];
      for (const v of def.variants || [[Math.round(clip.width / 2), 0.5], [clip.width, 1]]) {
        const s = Array.isArray(v) ? v[1] : v;
        const buf = await c.shot({ format: 'webp', quality: 82, clip, scale: s, beyond });
        const d = webpSize(buf), f = `${key}-${d.w}.webp`; fs.writeFileSync(new URL(f, OUT), buf); variants.push({ w: d.w, h: d.h, file: f }); console.log(`  ${f} ${d.w}×${d.h} ${(buf.length / 1024).toFixed(0)} KB`);
      }
      manifest[key] = { variants: variants.sort((a, b) => a.w - b.w) };
      if (c.logs.length) console.log('  erros no console:', c.logs.slice(0, 3));
    } finally { await c.close(); }
  }
}
fs.writeFileSync(MAN, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');
console.log('manifest.json atualizado');
