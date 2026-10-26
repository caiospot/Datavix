// Gera site/assets/favicon.ico (16, 32 e 48 px, PNG dentro do ICO) a partir de site/assets/favicon.svg, com o Chrome. Uso: node scripts/make-favicon.mjs
import fs from 'node:fs';
import { openChrome } from './cdp-lib.mjs';
const svg = fs.readFileSync(new URL('../site/assets/favicon.svg', import.meta.url), 'utf8').trim();
const sizes = [16, 32, 48], pngs = [];
const c = await openChrome({ width: 64, height: 64, scale: 1 });
try {
  await c.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  for (const n of sizes) {
    await c.goto('data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html><meta charset=utf-8><style>html,body{margin:0;background:transparent}svg{display:block;width:${n}px;height:${n}px}</style>${svg}`));
    pngs.push(await c.shot({ format: 'png', clip: { x: 0, y: 0, width: n, height: n } }));
  }
} finally { await c.close(); }
// ICO: cabeçalho (6) + uma entrada de 16 bytes por imagem + os PNGs
const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let off = 6 + 16 * sizes.length; const dir = pngs.map((p, i) => { const e = Buffer.alloc(16); e[0] = sizes[i]; e[1] = sizes[i]; e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(p.length, 8); e.writeUInt32LE(off, 12); off += p.length; return e; });
fs.writeFileSync(new URL('../site/assets/favicon.ico', import.meta.url), Buffer.concat([head, ...dir, ...pngs]));
console.log('favicon.ico gravado:', sizes.join(', '), 'px,', off, 'bytes');
