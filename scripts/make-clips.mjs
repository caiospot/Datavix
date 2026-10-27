// Clipes curtos (MP4 H.264, sem áudio) dos gráficos reais da landing do app, para os cartões do site, e a imagem de abertura (poster) de cada um.
// Grava o canvas de cada gráfico sobre fundo preto (o site soma o brilho do cartão por cima com mix-blend-mode: screen), usa o MediaRecorder do Chrome e o remuxador do app (mp4Remux).
// Precisa do site local em http://localhost:8780 (o app em /app/). Uso: node scripts/make-clips.mjs [id ...] [--lang=pt|en] [--secs=7]
import fs from 'node:fs';
import { openChrome, sleep } from './cdp-lib.mjs';

const OUT = new URL('../site/assets/clips/', import.meta.url), MAN = new URL('manifest.json', OUT);
const manifest = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, 'utf8')) : {};
const args = process.argv.slice(2), want = args.filter(a => !a.startsWith('--')), langArg = (args.find(a => a.startsWith('--lang=')) || '').slice(7), SECS = +((args.find(a => a.startsWith('--secs=')) || '').slice(7) || 7);
// cartão de cada clipe: seletor do cartão, da caixa (a que tem o brilho) e do canvas do gráfico
const CLIPS = [
  { id: 'organism', card: '.lpg-card:nth-child(1)', box: '.lpg-art', cv: '.lpg-cv' }, { id: 'rays', card: '.lpg-card:nth-child(2)', box: '.lpg-art', cv: '.lpg-cv' },
  { id: 'river', card: '.lpg-card:nth-child(3)', box: '.lpg-art', cv: '.lpg-cv' }, { id: 'fan', card: '.lpg-card:nth-child(4)', box: '.lpg-art', cv: '.lpg-cv' },
  { id: 'ridge', card: '.lpg-card:nth-child(5)', box: '.lpg-art', cv: '.lpg-cv' }, { id: 'flow', card: '.lpg-card:nth-child(6)', box: '.lpg-art', cv: '.lpg-cv' },
  { id: 'passo3', card: '.lph-card.c3', box: '.v3', cv: '#lphcv', once: true },
];
const REC = `window.__rec = async (card, box, cv, secs, bps, posterAt) => {
  const sl = ms => new Promise(r => setTimeout(r, ms));
  document.querySelectorAll('.lph-track').forEach(t => { t.style.scrollSnapType = 'none'; t.style.scrollBehavior = 'auto'; });
  const c = document.querySelector(card); c.scrollIntoView({ block: 'center', inline: 'center' }); await sl(150);
  const art = c.querySelector(box), ch = c.querySelector(cv), dpr = devicePixelRatio, ar = art.getBoundingClientRect();
  const W = Math.round(ar.width * dpr / 2) * 2, H = Math.round(ar.height * dpr / 2) * 2, comp = document.createElement('canvas'); comp.width = W; comp.height = H; const cx = comp.getContext('2d');
  const mime = ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4'].find(t => MediaRecorder.isTypeSupported(t)); if (!mime) throw new Error('sem MP4 no MediaRecorder');
  let live = true, poster = null, t0 = performance.now();
  const draw = () => { if (!live) return; const a = art.getBoundingClientRect(), r = ch.getBoundingClientRect(); cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H); cx.drawImage(ch, (r.left - a.left) * dpr, (r.top - a.top) * dpr, r.width * dpr, r.height * dpr); if (!poster && performance.now() - t0 >= posterAt * 1000) poster = comp.toDataURL('image/webp', 0.82); requestAnimationFrame(draw); };
  draw();
  const rec = new MediaRecorder(comp.captureStream(30), { mimeType: mime, videoBitsPerSecond: bps }), chunks = []; rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise(res => (rec.onstop = res)); rec.start(250); await sl(secs * 1000); rec.stop(); await done; live = false;
  let blob = new Blob(chunks, { type: 'video/mp4' }); const u8 = mp4Remux(await blob.arrayBuffer()); if (u8) blob = new Blob([u8], { type: 'video/mp4' });
  const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return JSON.stringify({ w: W, h: H, mp4: btoa(s), poster: poster || comp.toDataURL('image/webp', 0.82), remux: !!u8, mime });
};`;
for (const L of ['pt', 'en']) {
  if (langArg && langArg !== L) continue;
  const c = await openChrome({ width: 1440, height: 900, scale: 2 });
  try {
    await c.goto(`http://localhost:8780/app/?lang=${L}`); await sleep(3000); await c.ev(REC);
    for (const d of CLIPS) {
      if (want.length && !want.includes(d.id)) continue; if (d.once && L !== 'pt') continue;
      const key = d.once ? d.id : L === 'pt' ? d.id : d.id + '-en'; process.stdout.write(`${key} ... `);
      const r = JSON.parse(await c.ev(`__rec(${JSON.stringify(d.card)}, ${JSON.stringify(d.box)}, ${JSON.stringify(d.cv)}, ${SECS}, 800000, ${Math.min(SECS - 0.6, 3.8)})`));
      const mp4 = Buffer.from(r.mp4, 'base64'), poster = Buffer.from(r.poster.split(',')[1], 'base64');
      fs.writeFileSync(new URL(key + '.mp4', OUT), mp4); fs.writeFileSync(new URL(key + '-poster.webp', OUT), poster);
      manifest[key] = { w: r.w, h: r.h, secs: SECS, mp4: key + '.mp4', poster: key + '-poster.webp' };
      console.log(`${r.w}×${r.h} · mp4 ${(mp4.length / 1024).toFixed(0)} KB (remux ${r.remux}) · poster ${(poster.length / 1024).toFixed(0)} KB`);
    }
  } finally { await c.close(); }
}
fs.writeFileSync(MAN, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');
console.log('clips/manifest.json atualizado');
