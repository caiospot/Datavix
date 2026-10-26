// Gera os cartões de compartilhamento (Open Graph / Twitter, 1200×630 PNG) de cada página, em PT e EN, com o Chrome.
// Usa as capturas reais de site/assets/img (scripts/make-shots.mjs) e as fontes do site. Uso: node scripts/make-og.mjs [id-lang ...]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openChrome } from './cdp-lib.mjs';

const R = f => new URL('../' + f, import.meta.url), b64 = f => fs.readFileSync(R(f)).toString('base64');
const man = JSON.parse(fs.readFileSync(R('site/assets/img/manifest.json'), 'utf8'));
const shotUri = name => { const v = man[name].variants; const big = v[v.length - 1]; return { uri: `data:image/webp;base64,${b64('site/assets/img/' + big.file)}`, w: big.w, h: big.h }; };
const fonts = `@font-face{font-family:Geist;src:url(data:font/woff2;base64,${b64('site/assets/fonts/geist.woff2')}) format("woff2");font-weight:400 700}@font-face{font-family:"Geist Mono";src:url(data:font/woff2;base64,${b64('site/assets/fonts/geist-mono.woff2')}) format("woff2");font-weight:400 500}`;

// árvore radial mínima (mesma geometria da tela de carregamento do app), para as páginas sem captura
function tree() {
  let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, C = 110, T2 = Math.PI * 2, f = n => n.toFixed(1), P = (a, r) => [C + Math.cos(a) * r, C + Math.sin(a) * r];
  let g = ''; for (let h = 0; h < 7; h++) { const ah = -Math.PI / 2 + (h + 0.5) / 7 * T2, [hx, hy] = P(ah, 34); g += `<path d="M${C} ${C}L${f(hx)} ${f(hy)}" stroke="#9aa293" stroke-opacity=".5" fill="none"/><circle cx="${f(hx)}" cy="${f(hy)}" r="2.4" fill="#eef0eb"/>`;
    for (let e = -1; e <= 1; e++) { const ae = ah + e * 0.17, [ex, ey] = P(ae, 72), [mx, my] = P(ah + e * 0.08, 53); g += `<path d="M${f(hx)} ${f(hy)}Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}" stroke="#9aa293" stroke-opacity=".4" fill="none"/><circle cx="${f(ex)}" cy="${f(ey)}" r="1.5" fill="#eef0eb"/>`;
      for (let k = 0; k < 2; k++) { const al = ae + (k - 0.5) * 0.075, [lx, ly] = P(al, 100), rad = 1.8 + Math.pow(rnd(), 2.2) * 9; g += `<path d="M${f(ex)} ${f(ey)}L${f(lx)} ${f(ly)}" stroke="#9aa293" stroke-opacity=".3" fill="none"/><circle cx="${f(lx)}" cy="${f(ly)}" r="${f(rad)}" fill="#d4ff00" fill-opacity=".85"/>`; } } }
  return `<svg viewBox="0 0 220 220" width="520" height="520" xmlns="http://www.w3.org/2000/svg">${g}<circle cx="110" cy="110" r="5" fill="#d4ff00"/></svg>`;
}

// texto de cada cartão: kicker, título (*destaque*), subtítulo e captura usada
const CARDS = {
  pt: {
    home: ['TUDO VIRA DADO.', 'Transforme planilhas em *gráficos animados*', 'Excel e CSV viram gráficos, apresentações e vídeos, no navegador.', 'hero'],
    planilha: ['EXCEL E CSV', 'Planilha em *gráfico animado*', 'O passo a passo, sem enviar o arquivo a nenhum servidor.', 'leitura'],
    race: ['GRÁFICO ANIMADO', 'Corrida de barras a partir de uma *planilha*', 'Datas, itens e valores viram um ranking que se mexe.', 'race'],
    story: ['GUIA', 'Storytelling com *dados*', 'Da pergunta à conclusão, com a conta à vista.', 'calculo'],
    models: ['13 MODELOS', 'Modelos de história para *apresentar dados*', 'Roteiros de 2, 5 ou 10 slides, calculados da sua planilha.', 'modelos'],
    pptx: ['POWERPOINT', 'Da planilha ao *PowerPoint editável*', 'Gráficos nativos com “Editar dados” e textos editáveis.', 'exportar'],
    video: ['VÍDEO', 'Gráfico animado em *vídeo para redes*', 'MP4 vertical ou quadrado, gravado no seu navegador.', 'exportar'],
    charts: ['30 GRÁFICOS', 'Tipos de gráfico e o que cada um *pede da planilha*', 'Barras, linhas, árvore radial, treemap, radar e mapas.', 'graficos'],
    faq: ['PERGUNTAS FREQUENTES', 'Dúvidas sobre o *Datavix*', 'Privacidade, formatos, gráficos e exportações.', null],
    privacy: ['PRIVACIDADE', 'A planilha fica no *seu navegador*', 'O que sai, o que não sai e os seus direitos.', null],
  },
  en: {
    home: ['EVERYTHING BECOMES DATA.', 'Turn spreadsheets into *animated charts*', 'Excel and CSV become charts, presentations and videos, in the browser.', 'hero-en'],
    planilha: ['EXCEL AND CSV', 'Spreadsheet to *animated chart*', 'The step by step, without uploading the file to any server.', 'leitura-en'],
    race: ['ANIMATED CHART', 'Bar chart race from a *spreadsheet*', 'Dates, items and values become a ranking that moves.', 'race-en'],
    story: ['GUIDE', 'Data *storytelling*', 'From the question to the conclusion, with the math in plain sight.', 'calculo-en'],
    models: ['13 TEMPLATES', 'Story templates for *presenting data*', 'Scripts of 2, 5 or 10 slides, calculated from your spreadsheet.', 'modelos-en'],
    pptx: ['POWERPOINT', 'From spreadsheet to *editable PowerPoint*', 'Native charts with “Edit Data” and editable text.', 'exportar-en'],
    video: ['VIDEO', 'Animated chart as *social video*', 'Vertical or square MP4, recorded in your browser.', 'exportar-en'],
    charts: ['30 CHARTS', 'Chart types and what each one *needs from your data*', 'Bars, lines, radial tree, treemap, radar and maps.', 'graficos-en'],
    faq: ['FAQ', 'Questions about *Datavix*', 'Privacy, formats, charts and exports.', null],
    privacy: ['PRIVACY', 'Your spreadsheet stays in *your browser*', 'What leaves, what does not, and your rights.', null],
  },
};
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function html(card) {
  const [k, h, sub, shot] = card, size = h.length <= 30 ? 60 : h.length <= 42 ? 52 : 46;
  const title = esc(h).replace(/\*([^*]+)\*/g, '<b>$1</b>');
  const art = shot ? (() => { const s = shotUri(shot), W = 700, H = Math.min(Math.round(W * s.h / s.w), 400); return `<img class="shot" src="${s.uri}" style="width:${W}px;height:${H}px;object-fit:cover;object-position:top left">`; })() : `<div class="art">${tree()}</div>`;
  return `<!doctype html><meta charset="utf-8"><style>${fonts}
html,body{margin:0;width:1200px;height:630px;background:#0b0d0a;overflow:hidden;font-family:Geist,sans-serif;color:#eef0eb}
.bg{position:absolute;inset:0;background:radial-gradient(60% 75% at 88% 110%,rgba(106,92,255,.34),transparent 70%),radial-gradient(40% 50% at 0% 0%,rgba(212,255,0,.06),transparent 70%)}
.brand{position:absolute;left:64px;top:54px;font:500 21px "Geist Mono";letter-spacing:.22em;display:flex;gap:14px;align-items:center}.brand i{width:17px;height:17px;border-radius:4px;background:#d4ff00;display:block}
.k{position:absolute;left:64px;top:148px;font:500 17px "Geist Mono";letter-spacing:.24em;color:#9aa293}
h1{position:absolute;left:64px;top:186px;width:470px;margin:0;font:300 ${size}px/1.07 Geist;letter-spacing:-.028em}h1 b{font-weight:700;color:#d4ff00}
p{position:absolute;left:64px;bottom:54px;width:440px;margin:0;font:400 22px/1.4 Geist;color:#9aa293}
.shot{position:absolute;left:572px;top:176px;border-radius:16px;border:1px solid #272c23;box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 90px rgba(106,92,255,.28);background:#11140f}
.art{position:absolute;left:660px;top:60px}</style><div class="bg"></div><div class="brand"><i></i>DATAVIX</div><div class="k">${esc(k)}</div><h1>${title}</h1><p>${esc(sub)}</p>${art}`;
}
const want = process.argv.slice(2), c = await openChrome({ width: 1200, height: 630, scale: 1 });
fs.mkdirSync(R('site/assets/og/'), { recursive: true });
try {
  for (const L of ['pt', 'en']) for (const [id, card] of Object.entries(CARDS[L])) {
    const key = `${id}-${L}`; if (want.length && !want.includes(key)) continue;
    const f = path.join(os.tmpdir(), `dv-og-${key}.html`); fs.writeFileSync(f, html(card)); await c.goto('file://' + f); await new Promise(r => setTimeout(r, 700));
    const png = await c.shot({ format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } }); fs.unlinkSync(f);
    fs.writeFileSync(R(`site/assets/og/${key}.png`), png); console.log(key + '.png', (png.length / 1024).toFixed(0), 'KB');
  }
} finally { await c.close(); }
