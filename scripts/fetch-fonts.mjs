// Baixa as fontes da biblioteca do editor (Google Fonts, licença OFL), só o subconjunto latino em woff2, para vendor/fonts/lib.
// Uso: node scripts/fetch-fonts.mjs   (o resultado fica versionado; o build não depende de rede)
import fs from 'node:fs';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
// [família, eixo css2, rótulo de licença]
const FAMILIES = [
  ['Inter', 'wght@400..700'], ['Manrope', 'wght@400..800'], ['DM Sans', 'wght@400..700'], ['IBM Plex Sans', 'wght@400;600'], ['Plus Jakarta Sans', 'wght@400..700'],
  ['Playfair Display', 'wght@400..800'], ['Source Serif 4', 'wght@400..700'], ['Source Sans 3', 'wght@400..700'], ['DM Serif Display', null], ['Instrument Serif', null], ['Libre Baskerville', 'wght@400..700'],
  ['Space Grotesk', 'wght@400..700'], ['JetBrains Mono', 'wght@400..700'], ['IBM Plex Mono', 'wght@400;500;600'], ['Space Mono', 'wght@400;700'],
  ['Sora', 'wght@400..700'], ['Outfit', 'wght@400..700'], ['Syne', 'wght@400..800'], ['Bebas Neue', null],
];
const slug = f => f.toLowerCase().replace(/\s+/g, '-');
const index = {}; let total = 0;
for (const [fam, axis] of FAMILIES) {
  const url = `https://fonts.googleapis.com/css2?family=${fam.replace(/ /g, '+')}${axis ? ':' + axis : ''}&display=swap`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  const faces = [];
  for (const m of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
    if (m[1] !== 'latin') continue;
    const body = m[2], w = (body.match(/font-weight:\s*([^;]+);/) || [])[1].trim(), st = (body.match(/font-style:\s*([^;]+);/) || [])[1].trim(), src = (body.match(/url\(([^)]+)\)/) || [])[1];
    if (st !== 'normal') continue;
    const buf = Buffer.from(await (await fetch(src)).arrayBuffer());
    const file = `${slug(fam)}-${w.replace(/\s+/g, '_')}.woff2`;
    fs.writeFileSync(new URL(`../vendor/fonts/lib/${file}`, import.meta.url), buf); total += buf.length;
    faces.push({ weight: w, file, bytes: buf.length });
  }
  if (!faces.length) console.error('SEM FACES:', fam);
  index[fam] = faces; console.log(fam.padEnd(20), faces.map(f => `${f.weight}:${(f.bytes / 1024).toFixed(0)}K`).join(' '));
}
fs.writeFileSync(new URL('../vendor/fonts/lib/index.json', import.meta.url), JSON.stringify(index, null, 1));
console.log('total', (total / 1024).toFixed(0) + ' KB');
