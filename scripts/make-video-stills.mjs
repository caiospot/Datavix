// Quadros do vídeo vertical (9:16) que o próprio app gera, para a página inicial do site: roda o gravador de vídeo do app (recordVideo) com a planilha fictícia
// e guarda alguns quadros em WebP (540×960). Precisa do build de teste (node build.mjs) e do servidor de teste (porta 8768). Uso: node scripts/make-video-stills.mjs [--lang=pt|en]
import fs from 'node:fs';
import { openChrome, sleep } from './cdp-lib.mjs';

const OUT = new URL('../site/assets/img/', import.meta.url), MAN = new URL('manifest.json', OUT);
const manifest = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : {};
const langArg = (process.argv.find(a => a.startsWith('--lang=')) || '').slice(7), FR = [0.17, 0.33, 0.62, 0.95];
const src = fs.readFileSync(new URL('./make-shots.mjs', import.meta.url), 'utf8'), PRE = (/const PRE = `([\s\S]*?)`;\n/.exec(src) || [])[1];
const REC = `window.__stills = async fr => { const S = window.__datavix.S, out = []; let k = 0;
  await recordVideo(S.piece, 'vertical', { cancel: false }, { onFrame: (cv, t, tot) => { while (k < fr.length && t >= fr[k] * tot) { const tmp = document.createElement('canvas'); tmp.width = 540; tmp.height = 960; tmp.getContext('2d').drawImage(cv, 0, 0, 540, 960); out.push(tmp.toDataURL('image/webp', 0.82)); k++; } } });
  return JSON.stringify(out); };`;
for (const L of ['pt', 'en']) {
  if (langArg && langArg !== L) continue;
  const c = await openChrome({ width: 1440, height: 900, scale: 1 });
  try {
    await c.goto('http://localhost:8768/test/dev.html'); await sleep(2500); await c.ev(PRE); await c.ev(`__h.lang('${L.toUpperCase()}')`); await sleep(300);
    await c.ev(`__h.up(${JSON.stringify(L === 'pt' ? 'exemplo-vendas.csv' : 'sales-example.csv')})`); await c.ev(`__h.gen()`); await sleep(1200); await c.ev(`__h.type('river')`); await sleep(3000);
    await c.ev(REC); const frames = JSON.parse(await c.ev(`__stills(${JSON.stringify(FR)})`));
    frames.forEach((d, i) => { const f = `${L === 'pt' ? 'video' : 'video-en'}-${i + 1}.webp`, buf = Buffer.from(d.split(',')[1], 'base64'); fs.writeFileSync(new URL(f, OUT), buf); manifest[f.replace('.webp', '')] = { variants: [{ w: 540, h: 960, file: f }] }; console.log(f, (buf.length / 1024).toFixed(0), 'KB'); });
  } finally { await c.close(); }
}
fs.writeFileSync(MAN, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');
console.log('manifest.json atualizado');
