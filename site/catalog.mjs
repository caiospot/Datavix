// Catálogo do produto lido do próprio código (src/), para o site nunca divergir do app:
// os 30 gráficos (nome e "o que pede da planilha", em PT e EN) e os 13 modelos de história (nome, pergunta, gráfico principal e alternativas).
import fs from 'node:fs';
import vm from 'node:vm';

// textos e dados dos mini-visuais dos cartões (os mesmos da landing do app): LP (src/landing.js), I18N (src/i18n*.js) e PALETTES (src/piece.js)
export function loadLanding(root) {
  const rd = f => fs.readFileSync(new URL(f, root), 'utf8');
  const ctx = vm.createContext({ window: {}, console });
  vm.runInContext(`${rd('src/i18n.js')}\n${rd('src/i18n-charts.js')}\nthis.I18N = I18N;`.replace(/^const /gm, 'var ').replace(/^let /gm, 'var '), ctx);
  const cut = (src, from, to) => { const a = src.indexOf(from), b = src.indexOf(to, a); if (a < 0 || b < 0) throw new Error(`trecho "${from}" não encontrado`); return src.slice(a, b); };
  const lc = vm.createContext({});
  vm.runInContext(cut(rd('src/landing.js'), 'const LP = {', 'const LPT').replace(/^const /gm, 'var ') + '\nthis.LP = LP;', lc);
  const pc = vm.createContext({});
  vm.runInContext(cut(rd('src/piece.js'), 'const PALETTES = {', '};').replace(/^const /gm, 'var ') + '};\nthis.PALETTES = PALETTES;', pc);
  return { I18N: ctx.I18N, LP: lc.LP, PALETTES: pc.PALETTES };
}

// ícones dos 30 gráficos (src/icons.js): o style="stop-color:var(--x)" dos degradês vira classe (a CSP das páginas não aceita style inline) e os seis degradês
// de cada ícone viram um bloco único por página (defs()), em vez de seis por ícone: o HTML da home fica com 20 KB a menos
export function loadIcons(root) {
  const src = fs.readFileSync(new URL('src/icons.js', root), 'utf8'), ctx = vm.createContext({});
  vm.runInContext(src.replace(/^const /gm, 'var ').replace(/^let /gm, 'var ') + '\nthis.chartIcon = chartIcon;', ctx);
  let shared = null;
  const icon = id => {
    let svg = ctx.chartIcon(id).replace(/style="stop-color:var\(--([a-z0-9]+)\)"/g, 'class="sc-$1"');
    if (/style=/.test(svg)) throw new Error(`ícone "${id}" ainda tem style inline`);
    const m = /<defs>[\s\S]*?<\/defs>/.exec(svg); if (!m) throw new Error(`ícone "${id}" sem degradês`);
    if (!shared) shared = m[0].replace(/id="ig\d+([A-Z]{2})"/g, 'id="ig$1"');
    return svg.replace(m[0], '').replace(/url\(#ig\d+([A-Z]{2})\)/g, 'url(#ig$1)');
  };
  return { icon, defs: () => `<svg class="dfs" width="0" height="0" aria-hidden="true" focusable="false">${shared}</svg>` };
}

export function loadCatalog(root) {
  const rd = f => fs.readFileSync(new URL(f, root), 'utf8');
  // textos da interface: i18n.js e i18n-charts.js definem const I18N e o completam (Object.assign)
  const ctx = vm.createContext({ window: {}, console });
  vm.runInContext(`${rd('src/i18n.js')}\n${rd('src/i18n-charts.js')}\nthis.I18N = I18N;`.replace(/^const /gm, 'var ').replace(/^let /gm, 'var '), ctx);
  const I = ctx.I18N;
  const order = /const ALL_CHARTS = \[([^\]]+)\]/.exec(rd('src/data.js'));
  if (!order) throw new Error('ALL_CHARTS não encontrado em src/data.js');
  const ids = order[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  const charts = ids.map(id => {
    const nm = { pt: I.pt.chart[id], en: I.en.chart[id] }, need = { pt: I.pt['why_' + id], en: I.en['why_' + id] };
    if (!nm.pt || !nm.en || typeof need.pt !== 'string' || typeof need.en !== 'string') throw new Error(`gráfico "${id}" sem nome ou sem "precisa de" no i18n`);
    return { id, name: nm, needs: need };
  });
  // modelos de história: só os dados (NV_ST_ORDER e NV_STORIES), sem executar o resto de stories.js
  const src = rd('src/stories.js'), a = src.indexOf('const NV_ST_ORDER'), b = src.indexOf('/* ---- migração');
  if (a < 0 || b < 0) throw new Error('NV_STORIES não encontrado em src/stories.js');
  const sc = vm.createContext({});
  vm.runInContext(src.slice(a, b).replace(/^const /gm, 'var ') + '\nthis.NV_ST_ORDER = NV_ST_ORDER; this.NV_STORIES = NV_STORIES;', sc);
  const stories = sc.NV_ST_ORDER.map(id => { const s = sc.NV_STORIES[id]; return { id, name: s.name, ask: s.ask, primary: s.charts.primary, alts: s.charts.alts || [] }; });
  return { charts, stories, chartById: Object.fromEntries(charts.map(c => [c.id, c])) };
}
