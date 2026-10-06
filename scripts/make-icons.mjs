// Gera os ícones do PWA (PNG) sem dependências: uma árvore radial mínima em lima sobre fundo escuro. Uso: node scripts/make-icons.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const png = (w, h, rgba) => {
  const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
};
// marca: raiz, 7 ramos, 3 folhas por ramo (coordenadas em [-1, 1])
const prim = (() => {
  const P = [], T2 = Math.PI * 2; let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  P.push({ k: 'ring', x: 0, y: 0, r: 0.1, w: 0.032 });
  for (let h = 0; h < 7; h++) {
    const a = -Math.PI / 2 + (h + 0.5) / 7 * T2, hx = Math.cos(a) * 0.36, hy = Math.sin(a) * 0.36;
    P.push({ k: 'seg', x1: Math.cos(a) * 0.1, y1: Math.sin(a) * 0.1, x2: hx, y2: hy, w: 0.026 }, { k: 'dot', x: hx, y: hy, r: 0.045 });
    for (let e = -1; e <= 1; e++) { const ae = a + e * 0.2, lx = Math.cos(ae) * 0.78, ly = Math.sin(ae) * 0.78, r = 0.035 + Math.pow(rnd(), 2) * 0.1; P.push({ k: 'seg', x1: hx, y1: hy, x2: lx, y2: ly, w: 0.012 }, { k: 'dot', x: lx, y: ly, r }); }
  }
  return P;
})();
const dist = (p, x, y) => {
  if (p.k === 'dot') return Math.hypot(x - p.x, y - p.y) - p.r;
  if (p.k === 'ring') return Math.abs(Math.hypot(x - p.x, y - p.y) - p.r) - p.w / 2;
  const dx = p.x2 - p.x1, dy = p.y2 - p.y1, t = Math.max(0, Math.min(1, ((x - p.x1) * dx + (y - p.y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (p.x1 + t * dx), y - (p.y1 + t * dy)) - p.w / 2;
};
function render(size, { scale = 0.82, rounded = true } = {}) {
  const out = Buffer.alloc(size * size * 4), bg = [11, 13, 10], lime = [212, 255, 0], px = 1 / size * 2;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const x = ((i + 0.5) / size * 2 - 1) / scale, y = ((j + 0.5) / size * 2 - 1) / scale; let cov = 0;
    for (const p of prim) { const d = dist(p, x, y) * scale / px / 2; const c = Math.max(0, Math.min(1, 0.5 - d)); if (c > cov) cov = c; }
    let a = 1; if (rounded) { const q = 0.22, ux = Math.abs((i + 0.5) / size * 2 - 1), uy = Math.abs((j + 0.5) / size * 2 - 1), cx = Math.max(0, ux - (1 - q * 2)), cy = Math.max(0, uy - (1 - q * 2)), d = (Math.hypot(cx, cy) - q * 2) / px / 2; a = Math.max(0, Math.min(1, 0.5 - d)); }
    const o = (j * size + i) * 4; for (let c = 0; c < 3; c++) out[o + c] = Math.round(bg[c] + (lime[c] - bg[c]) * cov); out[o + 3] = Math.round(a * 255);
  }
  return png(size, size, out);
}
const dir = new URL('../pwa/icons/', import.meta.url);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(new URL('icon-192.png', dir), render(192));
fs.writeFileSync(new URL('icon-512.png', dir), render(512));
fs.writeFileSync(new URL('maskable-512.png', dir), render(512, { scale: 0.62, rounded: false })); // área segura de 80%
fs.writeFileSync(new URL('apple-touch-icon.png', dir), render(180, { scale: 0.8, rounded: false }));
console.log('ícones gerados em pwa/icons');
