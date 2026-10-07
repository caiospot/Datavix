/* Datavix: a peça (o que o usuário apresenta). Compartilhado entre o editor e o HTML exportado. */

const RM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const dur = s => (RM ? 0 : s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- paletas e fundos ---------------- */
const PALETTES = {
  cosmos: ['#6a5cff', '#ffd400', '#ff5c8a', '#35d6a0', '#4cc9f0', '#ff8a3d', '#c77dff', '#9aa0b4'],
  corporate: ['#1f5fa8', '#e07b39', '#4a9d6f', '#8b6bb1', '#c0504d', '#6f7b86'],
  editorial: ['#b5391b', '#d9962b', '#3d7a57', '#2f5d8a', '#8a6d9e', '#7a6f5a'],
  tech: ['#d4ff00', '#18e0c0', '#7a8cff', '#ff7a59', '#ff4fd8', '#a3ad9a'],
  vibrant: ['#ff3d71', '#ffb800', '#00c2ff', '#8b5cf6', '#00e676', '#ff6e40'],
  cvd: ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7', '#56B4E9'],
  mono: ['#0a3a82', '#1f5fa8', '#3f7fcf', '#6c9fe0', '#94b8ea', '#b9d0f3'],
};
const TONE_DEFAULT = {
  corporate: { pal: 'corporate', bg: { mode: 'light', color: '#f7f8f4', base: '#f7f8f4' }, pair: 'modern' },
  editorial: { pal: 'editorial', bg: { mode: 'solid', color: '#f6f1e7', base: '#f6f1e7' }, pair: 'editorial' },
  tech: { pal: 'cosmos', bg: { mode: 'solid', color: '#06061a', base: '#06061a' }, pair: 'tech' },
  vibrant: { pal: 'vibrant', bg: { mode: 'gradient', color: '#14102b', base: '#14102b' }, pair: 'modern' },
};
// pares tipográficos: título + corpo/gráfico. Todas as fontes vão embutidas no arquivo.
// pares de fontes do editor: título + texto. cat: sober | editorial | tech | bold. tw: peso do título (fontes de peso único usam 400).
// fams: famílias que precisam estar carregadas (Geist, Geist Mono e Lora já vêm no CSS do app; as demais vêm de FONT_LIB).
const FB = { sans: 'system-ui, sans-serif', serif: 'Georgia, serif', mono: 'ui-monospace, Menlo, monospace' };
const fpair = (cat, tf, tk, bf, bk, tw) => ({ cat, tw: tw || 600, sample: tf === bf ? tf : tf + ' + ' + bf, title: `'${tf}', ${FB[tk]}`, body: `'${bf}', ${FB[bk]}`, fams: [...new Set([tf, bf])] });
const FONT_PAIRS = {
  modern: fpair('sober', 'Geist', 'sans', 'Geist', 'sans'),
  inter: fpair('sober', 'Inter', 'sans', 'Inter', 'sans'),
  manrope: fpair('sober', 'Manrope', 'sans', 'Manrope', 'sans'),
  dmsans: fpair('sober', 'DM Sans', 'sans', 'DM Sans', 'sans'),
  plex: fpair('sober', 'IBM Plex Sans', 'sans', 'IBM Plex Sans', 'sans'),
  jakarta: fpair('sober', 'Plus Jakarta Sans', 'sans', 'Plus Jakarta Sans', 'sans'),
  editorial: fpair('editorial', 'Lora', 'serif', 'Geist', 'sans'),
  playfair: fpair('editorial', 'Playfair Display', 'serif', 'Inter', 'sans'),
  sourceserif: fpair('editorial', 'Source Serif 4', 'serif', 'Source Sans 3', 'sans'),
  dmserif: fpair('editorial', 'DM Serif Display', 'serif', 'DM Sans', 'sans', 400),
  instrument: fpair('editorial', 'Instrument Serif', 'serif', 'Inter', 'sans', 400),
  baskerville: fpair('editorial', 'Libre Baskerville', 'serif', 'Source Sans 3', 'sans'),
  tech: fpair('tech', 'Geist Mono', 'mono', 'Geist', 'sans'),
  grotesk: fpair('tech', 'Space Grotesk', 'sans', 'Space Grotesk', 'sans'),
  jetbrains: fpair('tech', 'JetBrains Mono', 'mono', 'Inter', 'sans'),
  plexmono: fpair('tech', 'IBM Plex Mono', 'mono', 'IBM Plex Sans', 'sans'),
  spacemono: fpair('tech', 'Space Mono', 'mono', 'Space Grotesk', 'sans', 700),
  sora: fpair('bold', 'Sora', 'sans', 'Sora', 'sans'),
  outfit: fpair('bold', 'Outfit', 'sans', 'Outfit', 'sans'),
  syne: fpair('bold', 'Syne', 'sans', 'Inter', 'sans', 700),
  bebas: fpair('bold', 'Bebas Neue', 'sans', 'Inter', 'sans', 400),
};
const FONT_CATS = ['sober', 'editorial', 'tech', 'bold'];
const fontsOf = P => FONT_PAIRS[P.fontPair] || FONT_PAIRS.modern;
const DEFAULT_OPTS = { legend: true, grid: true, labels: false, annotations: true, notes: true };
// tudo que a peça precisa para ser reaberta (HTML exportado, projetos recentes)
const pieceData = P => ({ built: P.built, insights: P.insights, choice: P.choice, type: P.type, palId: P.palId, colors: P.colors, bg: P.bg, title: P.title, subtitle: P.subtitle || null, foot: P.foot || null, fontPair: P.fontPair, opts: P.opts, sort: P.sort, big: P.big, place: P.place, fileName: P.fileName, isSample: P.isSample, lang: P.lang || LANG, br: P.br || null, hadIns: !!P.hadIns });
const chartOpt = (P, extra) => ({ labels: !!P.opts.labels, legend: P.opts.legend !== false, ...extra });
const mixHex = (a, b, t) => { const A = hexToRgb(a), B = hexToRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const bgBase = bg => (bg.mode === 'light' ? '#f7f8f4' : bg.mode === 'dark' ? '#0b0d0a' : bg.mode === 'solid' ? bg.color : bg.base);
const bgCss = (bg, accent) => (bg.mode === 'gradient' ? `linear-gradient(135deg, ${bg.base}, ${mixHex(bg.base, accent, 0.18)})` : bgBase(bg));

/* ---------------- textos da peça ---------------- */
function periodLabel(P) { const b = P.built; return b.period || `${fmtInt(b.stats.rowsTotal, LANG)} ${T('rows_lbl')}`; }
function sourceText(P) { return `${T('src')}: ${P.fileName}${P.isSample ? ' · ' + (LANG === 'pt' ? 'dados de exemplo' : 'sample data') : ''} · ${periodLabel(P)}`; }
const subtitleOf = P => (P.subtitle != null ? P.subtitle : sourceText(P));
const footOf = P => (P.foot != null ? P.foot : noteFor(P));
function noteFor(P) {
  const b = P.built, s = b.stats;
  if (CHART_REG[P.type]) return CHART_REG[P.type].note(P);
  if (P.type === 'organism' && b.org) return b.org.perRow ? T('org_perrow', fmtInt(b.org.leaves.length, LANG)) : T('org_agg', fmtInt(b.org.rowsUsed, LANG), fmtInt(b.org.leaves.length, LANG));
  if (b.kind === 'hist') return T('hist_note');
  if (b.kind === 'relation') { if (b.relHow === 'raw') return T('raw_note', s.rowsUsed); if (b.relHow === 'grid') return T('grid_note'); return T('agg_note', s, T(b.aggKind === 'mean' ? 'aggMean' : 'aggSum').toLowerCase(), `${b.names.x} / ${b.names.y}`, b.names.e); }
  const how = T(b.aggKind === 'mean' ? 'aggMean' : b.aggKind === 'count' ? 'aggCount' : 'aggSum').toLowerCase();
  const by = [b.names.x, b.names.s].filter(Boolean).join(' · ');
  return T('agg_note', s, how, b.names.y, by) + (s.topN ? ' ' + T('topn_note') : '');
}
function insightsHtml(P, editable) {
  // sem insight: só dizemos "nenhum confiável" quando os dados não geraram nenhum; se a pessoa removeu, não há o que explicar
  if (!P.insights.length) return P.hadIns ? '' : `<div class="noins">${T('no_insight')}</div>`;
  return P.insights.map((i, k) => `<div class="ins"><span class="k">[ ${T('insight')} // ${String(k + 1).padStart(2, '0')} ]${i.edited ? ` <em>${T('edited')}</em>` : ''}${editable ? `<button class="idel" data-a="idel" data-i="${k}" aria-label="${T('remove')}" title="${T('remove')}">×</button>` : ''}</span><span class="itext" data-i="${k}" ${editable ? 'contenteditable="plaintext-only" spellcheck="false"' : ''}>${esc(i.text)}</span>
    <details><summary>${T('see_calc')}</summary><div class="calc"><div><b>${esc(i.calc.title)}</b></div><div style="display:block;opacity:.8">${esc(i.calc.formula)}</div>${i.calc.rows.map(r => `<div><span>${esc(r.k)}</span><span>${esc(r.v)}${r.n ? ` · ${fmtInt(r.n, LANG)} ${T('calc_rows')}` : ''}</span></div>`).join('')}<div style="opacity:.7"><span>${T('calc_base')}</span><span>${esc(i.calc.base)}</span></div></div></details></div>`).join('');
}
function pieceHtml(P, o = {}) {
  const ed = o.editable ? 'contenteditable="plaintext-only" spellcheck="false"' : '';
  const pt = LANG === 'pt';
  return `<div class="piece cols ${P.big ? 'big' : ''}" id="piece" data-lay="wide">
    <div class="plogo" aria-label="Datavix"><i></i>DATAVIX</div>
    <aside class="c1" id="pc1"><div class="phead"><h1 id="ptitle" ${ed} aria-label="${pt ? 'Título' : 'Title'}">${esc(P.title)}</h1><div class="psub" id="psub" ${ed}>${esc(subtitleOf(P))}</div></div>
      <div class="insights" id="pins">${insightsHtml(P, o.editable)}</div>
      <div class="ctrls" id="pctrls"></div><div class="c1x" id="pc1x"></div></aside>
    <section class="c2" id="pc2" aria-label="${pt ? 'Detalhes' : 'Details'}" aria-live="polite"><div class="pcard" id="pcard"></div><div class="plist" id="plist"></div></section>
    <div class="c3"><div class="vzbox" id="vz"></div><div class="caption" id="pcap" aria-live="polite"></div>
      <div class="foot" id="pfoot" ${ed}>${esc(footOf(P))}</div></div>
    <div class="pnav" id="pnav"><button data-p="prev" aria-label="${pt ? 'Anterior' : 'Previous'}">←</button><span id="pcount"></span><button data-p="next" aria-label="${pt ? 'Próximo' : 'Next'}">→</button><button data-p="exit" aria-label="${pt ? 'Sair' : 'Exit'}">✕</button></div></div>`;
}
// largura da peça decide o arranjo: 3 colunas (≥1180), cartão acima do gráfico (≥760) ou tudo empilhado
function watchLayout(el) {
  if (el._lw) return; el._lw = true;
  const set = () => { const w = el.clientWidth; el.dataset.lay = w >= 1180 ? 'wide' : w >= 760 ? 'mid' : 'narrow'; };
  set(); if (window.ResizeObserver) new ResizeObserver(set).observe(el);
}
function applyPieceCss(P, el) {
  el = el || document.getElementById('piece'); if (!el) return;
  const base = bgBase(P.bg), fg = readableOn(base);
  const f = fontsOf(P);
  el.style.background = bgCss(P.bg, P.colors[0]); el.style.color = fg; el.style.setProperty('--accent', P.colors[0]); el.style.setProperty('--pt-font', f.title); el.style.setProperty('--pt-w', f.tw); el.style.fontFamily = f.body;
  // cores do cartão e dos painéis laterais: seguem o fundo da peça
  el.style.setProperty('--o-card', mixHex(base, fg, 0.07)); el.style.setProperty('--o-fg', fg); el.style.setProperty('--o-muted', mixHex(fg, base, 0.5)); el.style.setProperty('--o-line', `rgba(${hexToRgb(fg).join(',')},.14)`); el.style.setProperty('--o-accent', P.colors[0]);
  el.classList.toggle('no-ann', P.opts.annotations === false); el.classList.toggle('no-notes', P.opts.notes === false);
  watchLayout(el);
}

/* ---------------- Vizzu: configuração e estilo ---------------- */
// Vizzu 0.18: sort/align/guides são propriedades dos canais x e y
function vzConfig(type, b, sortMode, opt = {}) {
  const n = b.names, hasS = !!n.s, ch = { x: null, y: null, color: null, size: null, noop: null, label: null };
  const ax = { x: { align: 'none', sort: 'none', reverse: false, split: false, markerGuides: false }, y: { align: 'none', sort: 'none', reverse: false, split: false, markerGuides: false } };
  let geometry = 'rectangle', legend = null;
  if (b.kind === 'relation') {
    ch.x = [n.x]; ch.y = [n.y]; ch.noop = [n.e]; geometry = 'circle';
    if (hasS) ch.color = [n.s]; else if (b.colorByEntity) ch.color = [n.e];
    if (type === 'bubble') ch.size = [n.size];
    legend = ch.color ? 'color' : null;
  } else {
    const X = n.x, S_ = n.s, Y = n.y;
    legend = hasS ? 'color' : null;
    const sortable = !b.xIsTime && b.kind !== 'hist';
    const sv = !sortable ? 'none' : sortMode === 'label' ? 'byLabel' : sortMode === 'none' ? 'none' : 'byValue';
    if (type === 'treemap') {
      // sem eixos: retângulos proporcionais ao valor (hierarquia: categoria > série)
      if (b.kind === 'category') { ch.size = hasS ? [Y, X, S_] : [Y, X]; ch.color = hasS ? [S_] : [X]; ch.label = hasS ? [S_] : [X]; }
      else { ch.size = [Y, S_]; ch.color = [S_]; ch.label = [S_]; }
      legend = null;
    }
    else if (type === 'race') {
      // um quadro por período: o período fica fora dos eixos e é escolhido por filtro
      const M = opt.cumul && n.yc ? n.yc : Y;
      const L = opt.cumul && n.ycl ? n.ycl : (n.yl || M);
      ch.x = [M]; ch.y = [S_]; ch.color = [S_]; ch.label = [L]; ax.y.sort = 'byValue'; legend = null;
    }
    else if (type === 'line') { ch.x = [X]; ch.y = [Y]; ch.color = hasS ? [S_] : null; geometry = 'line'; }
    else if (type === 'area') { ch.x = [X]; ch.y = hasS ? [Y, S_] : [Y]; ch.color = hasS ? [S_] : null; geometry = 'area'; }
    else if (type === 'hbars') { ch.x = hasS ? [Y, S_] : [Y]; ch.y = [X]; ch.color = hasS ? [S_] : null; ax.y.sort = sv; }
    else if (type === 'stacked100') { ch.x = [X]; ch.y = [Y, S_]; ch.color = [S_]; ax.y.align = 'stretch'; ax.x.sort = sv; }
    else { ch.x = [X]; ch.y = hasS ? [Y, S_] : [Y]; ch.color = hasS ? [S_] : null; ax.x.sort = sv; }
  }
  const set = v => ({ set: v });
  // rótulos de valor (pré-formatados no idioma) quando o gráfico comporta
  if (opt.labels && !ch.label) {
    if (b.kind === 'relation') ch.label = [n.e];
    else if (n.yl && ['bars', 'hbars', 'stacked100', 'line'].includes(type) && b.stats.points <= 60) ch.label = [n.yl];
  }
  if (opt.legend === false) legend = null;
  return { channels: { x: { set: ch.x, ...ax.x }, y: { set: ch.y, ...ax.y }, color: set(ch.color), size: set(ch.size), noop: set(ch.noop), label: set(ch.label) }, geometry, legend, title: null };
}
function vzStyle(P, o = {}) {
  const base = bgBase(P.bg), fg = readableOn(base), muted = mixHex(fg, base, 0.38), size = o.size || (P.big ? 17 : 13) * (P.textK || 1), f = fontsOf(P);
  // treemap: o rótulo fica dentro do retângulo colorido, então segue o contraste da paleta e não o do fundo
  const dark = P.colors.filter(c => readableOn(c) === '#0b0d0a').length >= P.colors.length / 2;
  const lab = P.type === 'treemap' ? (dark ? '#0b0d0a' : '#f4f5f0') : fg;
  const grid = P.opts.grid !== false, none = 'rgba(0,0,0,0)';
  const axis = { color: mixHex(fg, base, 0.7), title: { color: muted, fontSize: size }, label: { color: muted, fontSize: size, numberFormat: 'prefixed' }, ticks: { color: mixHex(fg, base, 0.7) }, interlacing: { color: grid ? mixHex(fg, base, 0.94) : none } };
  const guides = { color: grid ? mixHex(fg, base, 0.9) : none };
  return {
    backgroundColor: 'rgba(0,0,0,0)', fontFamily: f.body, fontSize: size, logo: { width: 0 }, title: { color: fg }, legend: { label: { color: muted, fontSize: size } },
    plot: { marker: { colorPalette: P.colors.join(' '), guides: { lineWidth: 0 }, label: { color: lab, fontSize: size, numberFormat: 'prefixed', ...(P.type === 'treemap' ? { filter: `color(${lab})` } : {}) } }, xAxis: { ...axis, guides }, yAxis: { ...axis, guides } },
    // o balão do tooltip acompanha o fundo e as fontes da peça
    tooltip: { fontFamily: f.body, fontSize: size, color: fg, backgroundColor: mixHex(base, fg, 0.1), borderColor: mixHex(base, fg, 0.25), borderWidth: 1, borderRadius: 6, shadowColor: 'rgba(0,0,0,.25)', dropShadow: 6, layout: 'multiLine' },
  };
}
