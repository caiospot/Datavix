/* Datavix: motor de dados (agregação, mapeamento, escolha de gráfico, insights).
 * Tudo roda no navegador. Nenhum insight existe sem o cálculo que o gerou. */

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const GRAINS = ['day', 'week', 'month', 'quarter', 'year'];
const MAX_POINTS_TIME = 120;     // buckets de tempo
const MAX_CATS = 30;             // acima disso: top N + "Outros"
const MAX_SERIES = 8;            // séries (cores) por gráfico
const MAX_SCATTER = 2000;        // acima disso: agrega em grade
const DAY = 86400000;

/* ---------- formatação ---------- */
function fmtNum(n, unit, lang) {
  if (n === null || n === undefined || Number.isNaN(n)) return '–';
  const loc = lang === 'en' ? 'en-US' : 'pt-BR';
  const abs = Math.abs(n);
  const s = abs >= 1000
    ? new Intl.NumberFormat(loc, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
    : new Intl.NumberFormat(loc, { maximumFractionDigits: abs < 10 ? 2 : 1 }).format(n);
  if (unit === 'R$') return (lang === 'en' ? 'R$ ' : 'R$ ') + s;
  if (unit === '%') return s + '%';
  return s;
}
const fmtInt = (n, lang) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'pt-BR').format(n);
const fmtPct = (n, lang) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'pt-BR', { maximumFractionDigits: 0, signDisplay: 'exceptZero' }).format(n) + '%';

/* ---------- tempo ---------- */
function bucketStart(ms, grain) {
  const d = new Date(ms);
  const y = d.getUTCFullYear(), m = d.getUTCMonth();
  switch (grain) {
    case 'day': return Date.UTC(y, m, d.getUTCDate());
    case 'week': { const wd = (d.getUTCDay() + 6) % 7; return Date.UTC(y, m, d.getUTCDate() - wd); }
    case 'month': return Date.UTC(y, m, 1);
    case 'quarter': return Date.UTC(y, m - (m % 3), 1);
    default: return Date.UTC(y, 0, 1);
  }
}
function bucketCount(minMs, maxMs, grain) {
  const a = new Date(minMs), b = new Date(maxMs);
  const months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth() + 1;
  switch (grain) {
    case 'day': return (maxMs - minMs) / DAY + 1;
    case 'week': return (maxMs - minMs) / (7 * DAY) + 1;
    case 'month': return months;
    case 'quarter': return Math.ceil(months / 3) + 1;
    default: return b.getUTCFullYear() - a.getUTCFullYear() + 1;
  }
}
// prefere o período que um executivo espera: mês quando há de 12 a 120 meses
function pickGrain(minMs, maxMs) {
  const months = bucketCount(minMs, maxMs, 'month');
  if (months >= 12 && months <= MAX_POINTS_TIME) return 'month';
  if (months > MAX_POINTS_TIME) return months / 3 <= MAX_POINTS_TIME ? 'quarter' : 'year';
  return bucketCount(minMs, maxMs, 'week') >= 10 ? 'week' : 'day';
}
function bucketLabel(ms, grain, lang) {
  const d = new Date(ms);
  const y = d.getUTCFullYear(), m = d.getUTCMonth();
  const P = n => String(n).padStart(2, '0');
  const mn = (lang === 'en' ? MONTHS_EN : MONTHS_PT)[m];
  switch (grain) {
    case 'day': case 'week': return lang === 'en' ? `${y}-${P(m + 1)}-${P(d.getUTCDate())}` : `${P(d.getUTCDate())}/${P(m + 1)}/${y}`;
    case 'month': return `${mn}/${String(y).slice(2)}`;
    case 'quarter': return `T${Math.floor(m / 3) + 1}/${String(y).slice(2)}`.replace('T', lang === 'en' ? 'Q' : 'T');
    default: return String(y);
  }
}
const grainName = (g, lang) => ({ day: ['dia', 'day'], week: ['semana', 'week'], month: ['mês', 'month'], quarter: ['trimestre', 'quarter'], year: ['ano', 'year'] }[g][lang === 'en' ? 1 : 0]);

/* ---------- utilidades de coluna ---------- */
const isDim = c => c.kind === 'category' || c.kind === 'geo';
const isMeasure = c => c.kind === 'number';
const MONEY_HINT = /receita|valor|venda|faturamento|revenue|total|amount|sales|realizado|custo|cost|lucro|profit/i;
const COUNTISH = /qtd|quant|^id$|codigo|código|qty|count/i;

function distinctOf(c) { return c.dict ? c.dict.length : c.distinct || 0; }
function bestMeasure(cols, exclude = []) {
  const nums = cols.map((c, i) => [c, i]).filter(([c, i]) => isMeasure(c) && !exclude.includes(i));
  return (nums.find(([c]) => MONEY_HINT.test(c.name)) || nums.find(([c]) => !COUNTISH.test(c.name)) || nums[0] || [null, -1])[1];
}
function smallestDim(cols, lo, hi, exclude = []) {
  const ds = cols.map((c, i) => [c, i]).filter(([c, i]) => isDim(c) && !exclude.includes(i) && distinctOf(c) >= lo && distinctOf(c) <= hi);
  ds.sort((a, b) => distinctOf(a[0]) - distinctOf(b[0]));
  return ds.length ? ds[0][1] : -1;
}

// o tipo de análise sai dos dados: com data e medida é evolução no tempo; senão, comparação (a pessoa muda no mapeamento)
function inferStory(cols) { return cols.some(c => c.kind === 'date') && bestMeasure(cols) >= 0 ? 'time' : 'compare'; }

/* ---------- sugestão de mapeamento a partir do onboarding ---------- */
function suggestMapping(story, cols, opt = {}) {
  const r = suggestMappingBase(story, cols, opt);
  r.org = suggestOrg(cols);
  r.cs = {}; for (const id in CHART_REG) { try { r.cs[id] = CHART_REG[id].suggest(cols); } catch (e) { r.cs[id] = null; console.error(e); } }
  return r;
}
function suggestMappingBase(story, cols, opt = {}) {
  const m = { story, kind: 'category', x: -1, y: -1, series: -1, size: -1, entity: -1, agg: 'sum', grain: 'auto' };
  const firstDate = cols.findIndex(c => c.kind === 'date');
  const y = bestMeasure(cols);
  if ((story === 'time') && firstDate >= 0 && y >= 0) {
    return { ...m, kind: 'time', x: firstDate, y, series: smallestDim(cols, 2, MAX_SERIES) };
  }
  if (story === 'relation') {
    const nums = cols.map((c, i) => i).filter(i => isMeasure(cols[i]));
    if (nums.length >= 2) {
      const xi = bestMeasure(cols), yi = nums.find(i => i !== xi && !COUNTISH.test(cols[i].name)) ?? nums.find(i => i !== xi);
      const sz = nums.find(i => i !== xi && i !== yi);
      const ent = cols.map((c, i) => i).filter(i => isDim(cols[i]) && distinctOf(cols[i]) >= 5 && distinctOf(cols[i]) <= 300).sort((a, b) => distinctOf(cols[b]) - distinctOf(cols[a]))[0];
      return { ...m, kind: 'relation', x: xi, y: yi, size: sz ?? -1, entity: ent ?? -1, series: -1, agg: 'sum' };
    }
  }
  if (story === 'distribution') {
    if (!opt.hist && firstDate >= 0 && y >= 0) return { ...m, kind: 'time', x: firstDate, y, series: -1, calendar: true };
    const xi = bestMeasure(cols);
    if (xi >= 0) return { ...m, kind: 'hist', x: xi, y: -1, agg: 'count' };
  }
  // comparação, composição, geografia, fluxo (sankey/mapa chegam na fase 1b), ou fallback de tempo sem data
  const dimIdx = story === 'geo' ? cols.findIndex(c => c.kind === 'geo') : -1;
  const dims = cols.map((c, i) => i).filter(i => isDim(cols[i]));
  const fit = dims.filter(i => distinctOf(cols[i]) >= 2 && distinctOf(cols[i]) <= MAX_CATS).sort((a, b) => distinctOf(cols[b]) - distinctOf(cols[a]));
  const x = dimIdx >= 0 ? dimIdx : (fit[0] ?? dims[0] ?? -1);
  const series = story === 'composition' && x >= 0 ? smallestDim(cols, 2, MAX_SERIES, [x]) : -1;
  if (x < 0 && firstDate >= 0 && y >= 0) return { ...m, kind: 'time', x: firstDate, y, series: -1 };
  return { ...m, kind: 'category', x, y, series };
}

/* ---------- organismo radial: período > entidade > registro ---------- */
const ORG_MAX_ENT = 48, ORG_MAX_COL = 16, ORG_MAX_HUB = 24, ORG_ROW_LEAVES = 3000;
function suggestOrg(cols) {
  // categorias com frases longas (descrições) não servem de entidade nem de cor
  const avgLen = c => { const d = c.dict || []; if (!d.length) return 0; let t = 0; const k = Math.min(d.length, 60); for (let i = 0; i < k; i++) t += d[i].length; return t / k; };
  const dims = cols.map((c, i) => i).filter(i => isDim(cols[i]) && avgLen(cols[i]) <= 45);
  const dateIdx = cols.findIndex(c => c.kind === 'date');
  let hub = dateIdx;
  if (hub < 0) { const h = dims.filter(i => distinctOf(cols[i]) >= 3 && distinctOf(cols[i]) <= ORG_MAX_HUB).sort((a, b) => distinctOf(cols[a]) - distinctOf(cols[b]))[0]; hub = h === undefined ? -1 : h; }
  const ents = dims.filter(i => i !== hub && distinctOf(cols[i]) >= 4 && distinctOf(cols[i]) <= 80).sort((a, b) => distinctOf(cols[b]) - distinctOf(cols[a]));
  const entity = ents.length ? ents[0] : -1;
  // cor: de 3 a 16 categorias, perto de 12; só com 2 se não houver outra
  const cand = dims.filter(i => i !== hub && i !== entity && distinctOf(cols[i]) >= 2 && distinctOf(cols[i]) <= ORG_MAX_COL);
  const score = i => { const d = distinctOf(cols[i]); return (d < 3 ? 100 : 0) + Math.abs(d - 12); };
  const color = cand.sort((a, b) => score(a) - score(b))[0];
  const size = bestMeasure(cols);
  return hub >= 0 && entity >= 0 ? { hub, entity, color: color === undefined ? -1 : color, size, grain: 'auto' } : null;
}
// escolhe o período que dá de 3 a 24 ramos: ano, trimestre, mês, semana, dia
function orgGrain(minMs, maxMs) {
  for (const g of ['year', 'quarter', 'month', 'week', 'day']) { const n = bucketCount(minMs, maxMs, g); if (n >= 3 && n <= ORG_MAX_HUB) return g; }
  return bucketCount(minMs, maxMs, 'year') > ORG_MAX_HUB ? 'year' : 'day';
}
function buildOrganism(ds, m, opts) {
  const o = m.org; if (!o || o.hub < 0 || o.entity < 0) return null;
  const lang = opts.lang || 'pt', cols = ds.columns, n = ds.rowCount, policy = opts.nullPolicy || 'ignore';
  const hc = cols[o.hub], ec = cols[o.entity], cc = o.color >= 0 ? cols[o.color] : null, sc = o.size >= 0 ? cols[o.size] : null;
  if (!isDim(ec)) return null;
  const isDate = hc.kind === 'date';
  const grain = isDate ? (o.grain && o.grain !== 'auto' ? o.grain : orgGrain(hc.min, hc.max)) : null;
  // 1) totais por entidade e cor, para limitar a "top N + Outros"
  const entTot = new Map(), colTot = new Map(), hubKeys = new Map();
  const val = i => (sc ? (Number.isNaN(sc.data[i]) ? (policy === 'zero' ? 0 : null) : sc.data[i]) : 1);
  const hubKey = i => { if (isDate) { const t = hc.data[i]; return Number.isNaN(t) ? null : bucketStart(t, grain); } const c = hc.codes[i]; return c < 0 ? null : c; };
  for (let i = 0; i < n; i++) {
    const hk = hubKey(i), e = ec.codes[i]; if (hk === null || e < 0) continue;
    const v = val(i); if (v === null) continue;
    entTot.set(e, (entTot.get(e) || 0) + Math.abs(v)); if (cc && cc.codes[i] >= 0) colTot.set(cc.codes[i], (colTot.get(cc.codes[i]) || 0) + Math.abs(v));
    hubKeys.set(hk, true);
  }
  if (!hubKeys.size) return null;
  const OTH = lang === 'en' ? 'Others' : 'Outros', NOC = lang === 'en' ? 'No category' : 'Sem categoria';
  const entOrder = [...entTot].sort((a, b) => b[1] - a[1]).map(x => x[0]), entKeep = new Map(entOrder.slice(0, ORG_MAX_ENT).map((k, i) => [k, i]));
  const colOrder = [...colTot].sort((a, b) => b[1] - a[1]).map(x => x[0]), colKeep = new Map(colOrder.slice(0, ORG_MAX_COL).map((k, i) => [k, i]));
  const hubList = [...hubKeys.keys()].sort((a, b) => a - b), hubIdx = new Map(hubList.map((k, i) => [k, i]));
  const ents = entOrder.slice(0, ORG_MAX_ENT).map(k => ({ label: ec.dict[k], v: 0, n: 0 })), entOth = entOrder.length > ORG_MAX_ENT ? ents.push({ label: OTH, v: 0, n: 0 }) - 1 : -1;
  const cl = colOrder.slice(0, ORG_MAX_COL).map(k => ({ label: cc.dict[k], v: 0, n: 0 })); let colOth = colOrder.length > ORG_MAX_COL ? cl.push({ label: OTH, v: 0, n: 0 }) - 1 : -1, colNone = -1;
  const hubs = hubList.map(k => ({ label: isDate ? bucketLabel(k, grain, lang) : hc.dict[k], v: 0, n: 0 }));
  // 2) folhas: uma por linha (até 3 mil) ou uma por (período, entidade, categoria)
  const perRow = n <= ORG_ROW_LEAVES, leaves = [], agg = new Map();
  const dayLabel = t => { const d = new Date(t), P2 = x => String(x).padStart(2, '0'); return lang === 'en' ? `${d.getUTCFullYear()}-${P2(d.getUTCMonth() + 1)}-${P2(d.getUTCDate())}` : `${P2(d.getUTCDate())}/${P2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`; };
  let used = 0;
  const det = orgDetailFields(cols, o, n);
  const detRow = i => det.idx.map((ci, k) => orgCell(cols[ci], i, det.fields[k].long ? det.cap.long : det.cap.short, lang));
  for (let i = 0; i < n; i++) {
    const hk = hubKey(i), e0 = ec.codes[i]; if (hk === null || e0 < 0) continue;
    const v = val(i); if (v === null) continue;
    const h = hubIdx.get(hk), e = entKeep.has(e0) ? entKeep.get(e0) : entOth;
    let c = -1; if (cc) { const c0 = cc.codes[i]; if (c0 < 0) { if (colNone < 0) colNone = cl.push({ label: NOC, v: 0, n: 0 }) - 1; c = colNone; } else c = colKeep.has(c0) ? colKeep.get(c0) : colOth; }
    hubs[h].v += v; hubs[h].n++; ents[e].v += v; ents[e].n++; if (c >= 0) { cl[c].v += v; cl[c].n++; }
    used++;
    if (perRow) leaves.push([h, e, c, v, 1, isDate && grain !== 'day' ? dayLabel(hc.data[i]) : '', det.idx.length ? detRow(i) : null]);
    else {
      const k = h + '|' + e + '|' + c; let a = agg.get(k); if (!a) { a = [h, e, c, 0, 0, '', []]; agg.set(k, a); } a[3] += v; a[4]++;
      // guarda as 3 linhas de maior valor como amostra da bolha
      if (det.idx.length) { const s = a[6], r = [Math.abs(v), i]; if (s.length < 3) s.push(r); else { let mi = 0; for (let q = 1; q < 3; q++) if (s[q][0] < s[mi][0]) mi = q; if (r[0] > s[mi][0]) s[mi] = r; } }
    }
  }
  if (!perRow) agg.forEach(a => { a[6] = a[6].sort((x, y) => y[0] - x[0]).map(r => detRow(r[1])); leaves.push(a); });
  if (!leaves.length) return null;
  return {
    hubName: hc.name + (isDate ? ` (${grainName(grain, lang)})` : ''), entName: ec.name, colName: cc ? cc.name : null, sizeName: sc ? sc.name : (lang === 'en' ? 'Rows' : 'Linhas'),
    unit: sc ? sc.unit : null, grain, perRow, rowsUsed: used, rowsTotal: n, hubs, ents, cols: cl, leaves,
    fields: det.fields,
  };
}
/* colunas que aparecem no cartão de detalhes: curtas à esquerda, textos longos à direita */
const ORG_MAX_FIELDS = 24;
function orgDetailFields(cols, o, n) {
  const skip = new Set([o.hub, o.entity, o.color, o.size].filter(i => i >= 0));
  let idx = Array.isArray(o.details) ? o.details.filter(i => cols[i] && !skip.has(i)) : orgAutoDetails(cols, skip);
  idx = idx.slice(0, ORG_MAX_FIELDS);
  const fields = idx.map(i => { const c = cols[i]; return { name: c.name, long: orgIsLong(c), kind: c.kind }; });
  // teto de tamanho: o cartão leva os textos para o HTML exportado
  let cap = { short: 140, long: 520 }, per = Math.min(n, ORG_ROW_LEAVES), nLong = fields.filter(f => f.long).length;
  while (per * (nLong * cap.long + (fields.length - nLong) * 26) > 3.2e6 && cap.long > 120) cap = { short: cap.short, long: Math.round(cap.long * 0.7) };
  return { idx, fields, cap };
}
function orgIsLong(c) {
  if (c.kind === 'category') { const d = c.dict || []; let t = 0, mx = 0; const k = Math.min(d.length, 60); for (let i = 0; i < k; i++) { t += d[i].length; mx = Math.max(mx, d[i].length); } return k > 0 && (t / k >= 60 || mx >= 140); }
  if (c.kind !== 'text') return false;
  let tot = 0, k = 0, mx = 0; const t = c.texts;
  for (let i = 0; i < t.length && k < 300; i += Math.max(1, Math.floor(t.length / 300))) { if (t[i]) { tot += t[i].length; mx = Math.max(mx, t[i].length); k++; } }
  return k > 0 && (tot / k >= 60 || mx >= 140);
}
function orgAutoDetails(cols, skip) {
  const idx = cols.map((c, i) => i).filter(i => !skip.has(i));
  const ok = idx.filter(i => { const c = cols[i]; const nul = c.nulls !== undefined ? c.nulls : 0; return !(c.n && nul >= c.n); });
  // curtas primeiro (categorias, números, datas), textos longos por último
  return ok.filter(i => !orgIsLong(cols[i])).concat(ok.filter(i => orgIsLong(cols[i])));
}
function orgCell(c, i, cap, lang) {
  if (c.kind === 'number') { const v = c.data[i]; return Number.isNaN(v) ? '' : fmtNum(v, c.unit, lang); }
  if (c.kind === 'date') { const t = c.data[i]; if (Number.isNaN(t)) return ''; const d = new Date(t), P2 = x => String(x).padStart(2, '0'); return lang === 'en' ? `${d.getUTCFullYear()}-${P2(d.getUTCMonth() + 1)}-${P2(d.getUTCDate())}` : `${P2(d.getUTCDate())}/${P2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`; }
  let t;
  if (c.kind === 'category' || c.kind === 'geo') { const k = c.codes[i]; t = k < 0 ? '' : String(c.dict[k]); } else t = c.texts && c.texts[i];
  if (!t) return '';
  const s = String(t).replace(/\s+/g, ' ').trim(); return s.length > cap ? s.slice(0, cap - 1).trimEnd() + '…' : s;
}

/* ---------- agregação ---------- */
class Agg {
  constructor() { this.sum = 0; this.n = 0; this.rows = 0; }
  add(v, policy) {
    this.rows++;
    if (Number.isNaN(v)) { if (policy === 'zero') this.n++; return; }
    this.sum += v; this.n++;
  }
  value(kind) { return kind === 'mean' ? (this.n ? this.sum / this.n : null) : kind === 'count' ? this.rows : this.sum; }
}

// agrupa linhas por (x,s); devolve estrutura comum aos kinds time/category
function groupBy(ds, m, policy, opts) {
  const cols = ds.columns, n = ds.rowCount;
  const xc = cols[m.x], sc = m.series >= 0 ? cols[m.series] : null, yc = m.y >= 0 ? cols[m.y] : null;
  const isTime = m.kind === 'time';
  const grain = isTime ? (m.grain === 'auto' ? pickGrain(xc.min, xc.max) : m.grain) : null;
  const cells = new Map();     // key -> Agg
  const xKeys = new Map();     // x key -> {label, order}
  const sKeys = new Map();     // s key -> label
  let used = 0;
  for (let i = 0; i < n; i++) {
    let xk;
    if (isTime) { const t = xc.data[i]; if (Number.isNaN(t)) continue; xk = bucketStart(t, grain); }
    else { const c = xc.codes[i]; if (c < 0) continue; xk = c; }
    let sk = -1;
    if (sc) { sk = sc.codes[i]; if (sk < 0) continue; }
    const key = xk + '|' + sk;
    let a = cells.get(key);
    if (!a) { a = new Agg(); cells.set(key, a); }
    a.add(yc ? yc.data[i] : 0, policy);
    if (!xKeys.has(xk)) xKeys.set(xk, true);
    if (sc && !sKeys.has(sk)) sKeys.set(sk, true);
    used++;
  }
  return { cells, xKeys: [...xKeys.keys()], sKeys: [...sKeys.keys()], grain, used, xc, sc, yc };
}

function buildSeries(ds, m, opts) {
  const b = buildSeriesBase(ds, m, opts);
  try { b.org = buildOrganism(ds, m, opts); } catch (e) { b.org = null; console.error(e); }
  b.cs = {}; for (const id in CHART_REG) { try { b.cs[id] = CHART_REG[id].build(ds, m.cs ? m.cs[id] : null, opts, m); } catch (e) { b.cs[id] = null; console.error(e); } }
  return b;
}
function buildSeriesBase(ds, m, opts) {
  const lang = opts.lang || 'pt', policy = opts.nullPolicy || 'ignore';
  const cols = ds.columns;
  if (m.kind === 'relation') return buildRelation(ds, m, opts);
  if (m.kind === 'hist') return buildHist(ds, m, opts);
  const g = groupBy(ds, m, policy, opts);
  const { cells, grain, xc, sc, yc } = g;
  const aggKind = m.agg;
  const isTime = m.kind === 'time';
  if (!g.xKeys.length) throw new Error('no-data');

  // ordem do eixo X
  let xKeys = g.xKeys;
  const totalOfX = new Map();
  for (const [key, a] of cells) { const xk = +key.split('|')[0]; const t = totalOfX.get(xk) || new Agg(); t.sum += a.sum; t.n += a.n; t.rows += a.rows; totalOfX.set(xk, t); }
  let othersX = null;
  if (isTime) xKeys = xKeys.slice().sort((a, b) => a - b);
  else {
    xKeys = xKeys.slice().sort((a, b) => (totalOfX.get(b).value(aggKind) ?? -Infinity) - (totalOfX.get(a).value(aggKind) ?? -Infinity));
    if (xKeys.length > MAX_CATS) { othersX = new Set(xKeys.slice(MAX_CATS - 10)); xKeys = xKeys.slice(0, MAX_CATS - 10); }
  }
  // séries (cores)
  let sKeys = g.sKeys, othersS = null;
  if (sc) {
    const totS = new Map();
    for (const [key, a] of cells) { const sk = +key.split('|')[1]; const t = totS.get(sk) || new Agg(); t.sum += a.sum; t.n += a.n; t.rows += a.rows; totS.set(sk, t); }
    sKeys = sKeys.slice().sort((a, b) => (totS.get(b).value(aggKind) ?? -Infinity) - (totS.get(a).value(aggKind) ?? -Infinity));
    if (sKeys.length > MAX_SERIES) { othersS = new Set(sKeys.slice(MAX_SERIES - 1)); sKeys = sKeys.slice(0, MAX_SERIES - 1); }
  }
  const OTH = lang === 'en' ? 'Others' : 'Outros';
  const xLabel = k => isTime ? bucketLabel(k, grain, lang) : xc.dict[k];
  const sLabel = k => sc.dict[k];

  // reagrupa "Outros" e preenche a grade completa
  const xs = xKeys.map(k => ({ k, label: xLabel(k), set: null }));
  if (othersX) xs.push({ k: 'oth', label: OTH, set: othersX });
  const ss = sc ? sKeys.map(k => ({ k, label: sLabel(k), set: null })) : [{ k: -1, label: null, set: null }];
  if (sc && othersS) ss.push({ k: 'oth', label: OTH, set: othersS });
  const grid = new Map();
  const cellAgg = (x, s) => {
    const a = new Agg();
    for (const [key, v] of cells) {
      const [xk, sk] = key.split('|').map(Number);
      const xm = x.set ? x.set.has(xk) : xk === x.k;
      if (!xm) continue;
      const sm = s.k === -1 ? true : s.set ? s.set.has(sk) : sk === s.k;
      if (!sm) continue;
      a.sum += v.sum; a.n += v.n; a.rows += v.rows;
    }
    return a;
  };
  // índice rápido: quando não há "Outros" evita o varrer todas as células
  const fast = !othersX && !othersS;
  const xRec = [], sRec = [], yRec = [], rowsRec = [];
  for (const x of xs) for (const s of ss) {
    const a = fast ? (cells.get(x.k + '|' + s.k) || new Agg()) : cellAgg(x, s);
    xRec.push(x.label); if (sc) sRec.push(s.label);
    let v = a.value(aggKind);
    if (v === null && aggKind !== 'mean') v = 0;
    yRec.push(v); rowsRec.push(a.rows);
  }
  const unit = aggKind === 'count' ? null : (yc && yc.unit) || null;
  const yBase = aggKind === 'count' ? (lang === 'en' ? 'Rows' : 'Linhas') : yc.name;
  const names = {
    x: isTime ? `${xc.name} (${grainName(grain, lang)})` : xc.name,
    s: sc ? sc.name : null,
    y: aggKind === 'mean' ? `${yBase} (${lang === 'en' ? 'avg' : 'média'})` : yBase,
  };
  if (names.s === names.x) names.s += ' ';
  const series = [{ name: names.x, type: 'dimension', values: xRec }];
  if (sc) series.push({ name: names.s, type: 'dimension', values: sRec });
  series.push({ name: names.y, type: 'measure', values: yRec });
  // acumulado por série: alimenta a corrida de barras (só faz sentido para soma e contagem)
  if (isTime && sc && aggKind !== 'mean') {
    names.yc = `${names.y} (${lang === 'en' ? 'cumulative' : 'acum.'})`;
    const run = new Array(ss.length).fill(0), yc = new Array(yRec.length);
    for (let ix = 0; ix < xs.length; ix++) for (let j = 0; j < ss.length; j++) { const k = ix * ss.length + j; run[j] += yRec[k] || 0; yc[k] = run[j]; }
    series.push({ name: names.yc, type: 'measure', values: yc });
    names.ycl = names.yc + ' ·';
    series.push({ name: names.ycl, type: 'dimension', values: yc.map(v => fmtNum(v, unit, lang)) });
  }
  // rótulos de valor já formatados no idioma da peça (o Vizzu formata só em en-US)
  { names.yl = names.y + ' ·'; series.push({ name: names.yl, type: 'dimension', values: yRec.map(v => fmtNum(v, unit, lang)) }); }

  // totais por X e por série, para insights
  const totX = xs.map((x, ix) => {
    let sum = 0, rows = 0, n = 0, any = false;
    for (let j = 0; j < ss.length; j++) { const idx = ix * ss.length + j; const v = yRec[idx]; if (v !== null) { sum += v; any = true; } rows += rowsRec[idx]; n++; }
    return { label: x.label, value: any ? (aggKind === 'mean' && sc ? sum / n : sum) : null, rows, key: x.k };
  });
  const totS = sc ? ss.map((s, j) => { let sum = 0, rows = 0; for (let ix = 0; ix < xs.length; ix++) { const idx = ix * ss.length + j; sum += yRec[idx] || 0; rows += rowsRec[idx]; } return { label: s.label, value: sum, rows }; }) : null;

  const period = isTime ? `${bucketLabel(xc.min, grain, lang)} – ${bucketLabel(xc.max, grain, lang)}` : null;
  const cal = isTime ? buildCalendar(ds, m, policy, aggKind) : null;
  return {
    kind: m.kind, vz: { series }, names, unit, aggKind, grain, period, cal,
    stats: { rowsUsed: g.used, rowsTotal: ds.rowCount, points: yRec.length, xCount: xs.length, sCount: sc ? ss.length : 0, topN: !!othersX, topNs: !!othersS },
    totX, totS, xIsTime: isTime,
  };
}

// valor por dia (últimos 4 anos), para o heatmap de calendário
function buildCalendar(ds, m, policy, aggKind) {
  const xc = ds.columns[m.x], yc = m.y >= 0 ? ds.columns[m.y] : null;
  if (!(xc.max - xc.min >= 27 * DAY)) return null;
  const y1 = new Date(xc.max).getUTCFullYear(), floor = Date.UTC(y1 - 3, 0, 1);
  const days = new Map();
  for (let i = 0; i < ds.rowCount; i++) {
    const t = xc.data[i]; if (Number.isNaN(t) || t < floor) continue;
    const d = bucketStart(t, 'day');
    let a = days.get(d); if (!a) { a = new Agg(); days.set(d, a); }
    a.add(yc ? yc.data[i] : 0, policy);
  }
  const out = [];
  let mn = Infinity, mx = -Infinity;
  for (const [t, a] of [...days].sort((p, q) => p[0] - q[0])) {
    const v = a.value(aggKind); if (v === null) continue;
    out.push([t, v, a.rows]); if (v < mn) mn = v; if (v > mx) mx = v;
  }
  return out.length >= 14 ? { days: out, min: mn, max: mx, t0: out[0][0], t1: out[out.length - 1][0] } : null;
}

function buildHist(ds, m, opts) {
  const lang = opts.lang || 'pt', xc = ds.columns[m.x];
  const bins = 12, lo = xc.min, hi = xc.max, w = (hi - lo) / bins || 1;
  const cnt = new Array(bins).fill(0);
  let used = 0;
  for (let i = 0; i < ds.rowCount; i++) { const v = xc.data[i]; if (Number.isNaN(v)) continue; cnt[Math.min(bins - 1, Math.floor((v - lo) / w))]++; used++; }
  const labels = cnt.map((_, i) => `${fmtNum(lo + i * w, xc.unit, lang)}–${fmtNum(lo + (i + 1) * w, xc.unit, lang)}`);
  const names = { x: xc.name, s: null, y: lang === 'en' ? 'Rows' : 'Linhas' };
  names.yl = names.y + ' ·';
  return {
    kind: 'hist', vz: { series: [{ name: names.x, type: 'dimension', values: labels }, { name: names.y, type: 'measure', values: cnt }, { name: names.yl, type: 'dimension', values: cnt.map(c => fmtInt(c, lang)) }] }, names, unit: null, aggKind: 'count', grain: null, period: null,
    stats: { rowsUsed: used, rowsTotal: ds.rowCount, points: bins, xCount: bins, sCount: 0, bins },
    totX: labels.map((l, i) => ({ label: l, value: cnt[i], rows: cnt[i] })), totS: null, xIsTime: false,
  };
}

function buildRelation(ds, m, opts) {
  const lang = opts.lang || 'pt', policy = opts.nullPolicy || 'ignore';
  const cols = ds.columns, n = ds.rowCount;
  const xc = cols[m.x], yc = cols[m.y], zc = m.size >= 0 ? cols[m.size] : null, ec = m.entity >= 0 ? cols[m.entity] : null, sc = m.series >= 0 ? cols[m.series] : null;
  const meanOf = c => c.unit === '%' || m.agg === 'mean';
  const labelM = c => meanOf(c) ? `${c.name} (${lang === 'en' ? 'avg' : 'média'})` : c.name;
  let pts = [], how, used = 0;
  if (ec) {
    const map = new Map();
    for (let i = 0; i < n; i++) {
      const e = ec.codes[i]; if (e < 0) continue;
      const s = sc ? sc.codes[i] : -1; if (sc && s < 0) continue;
      const key = e + '|' + s;
      let r = map.get(key);
      if (!r) { r = { e, s, x: new Agg(), y: new Agg(), z: new Agg() }; map.set(key, r); }
      r.x.add(xc.data[i], policy); r.y.add(yc.data[i], policy); if (zc) r.z.add(zc.data[i], policy); else r.z.rows++;
      used++;
    }
    pts = [...map.values()].map(r => ({
      e: ec.dict[r.e], s: sc ? sc.dict[r.s] : null,
      x: r.x.value(meanOf(xc) ? 'mean' : 'sum'), y: r.y.value(meanOf(yc) ? 'mean' : 'sum'),
      z: zc ? r.z.value(meanOf(zc) ? 'mean' : 'sum') : r.z.rows, rows: r.x.rows,
    })).filter(p => p.x !== null && p.y !== null);
    how = 'entity';
  } else if (n <= MAX_SCATTER) {
    for (let i = 0; i < n; i++) {
      const x = xc.data[i], y = yc.data[i]; if (Number.isNaN(x) || Number.isNaN(y)) continue;
      const s = sc ? sc.codes[i] : -1; if (sc && s < 0) continue;
      pts.push({ e: String(i + 1), s: sc ? sc.dict[s] : null, x, y, z: zc ? zc.data[i] : 1, rows: 1 }); used++;
    }
    how = 'raw';
  } else {
    const B = 30, x0 = xc.min, y0 = yc.min, xw = (xc.max - x0) / B || 1, yw = (yc.max - y0) / B || 1;
    const grid = new Map();
    for (let i = 0; i < n; i++) {
      const x = xc.data[i], y = yc.data[i]; if (Number.isNaN(x) || Number.isNaN(y)) continue;
      const bx = Math.min(B - 1, Math.floor((x - x0) / xw)), by = Math.min(B - 1, Math.floor((y - y0) / yw));
      const k = bx * B + by; grid.set(k, (grid.get(k) || 0) + 1); used++;
    }
    pts = [...grid].map(([k, c]) => ({ e: 'c' + k, s: null, x: x0 + (Math.floor(k / B) + 0.5) * xw, y: y0 + ((k % B) + 0.5) * yw, z: c, rows: c }));
    how = 'grid';
  }
  if (!pts.length) throw new Error('no-data');
  const names = { x: labelM(xc), y: labelM(yc), size: how === 'grid' ? (lang === 'en' ? 'Rows' : 'Linhas') : zc ? labelM(zc) : (lang === 'en' ? 'Rows' : 'Linhas'), e: ec ? ec.name : (lang === 'en' ? 'Point' : 'Ponto'), s: sc && how !== 'grid' ? sc.name : null };
  if (names.e === names.s) names.s += ' ';
  const colorByEntity = !!ec && !sc && pts.length <= MAX_SERIES;
  const series = [{ name: names.e, type: 'dimension', values: pts.map(p => p.e) }];
  if (names.s) series.push({ name: names.s, type: 'dimension', values: pts.map(p => p.s) });
  series.push({ name: names.x, type: 'measure', values: pts.map(p => p.x) }, { name: names.y, type: 'measure', values: pts.map(p => p.y) }, { name: names.size, type: 'measure', values: pts.map(p => p.z) });
  return {
    kind: 'relation', vz: { series }, names, unit: null, aggKind: m.agg, grain: null, period: null, relHow: how, units: { x: xc.unit, y: yc.unit, z: zc ? zc.unit : null },
    stats: { rowsUsed: used, rowsTotal: n, points: pts.length, xCount: pts.length, sCount: 0, how },
    pts, colorByEntity, totX: null, totS: null, xIsTime: false, hasSize: !!zc || how === 'grid',
  };
}

/* ---------- escolha do gráfico: história x colunas x volume ---------- */
const CHART_TYPES = {
  time: ['organism', 'line', 'area', 'bars', 'stacked100', 'treemap', 'race', 'calendar', 'kpi'],
  category: ['organism', 'bars', 'hbars', 'stacked100', 'treemap', 'kpi'],
  hist: ['organism', 'bars', 'hbars', 'kpi'],
  relation: ['organism', 'bubble', 'scatter', 'kpi'],
};
// todos os gráficos que o Datavix oferece, na ordem em que aparecem quando não são recomendados
const ALL_CHARTS = ['organism', 'rays', 'river', 'fan', 'ridge', 'flow', 'bars', 'hbars', 'stacked100', 'treemap', 'race', 'line', 'area', 'calendar', 'scatter', 'bubble', 'kpi'];
function availableCharts(built) {
  const hasS = built.stats.sCount > 0;
  return CHART_TYPES[built.kind].concat(Object.keys(CHART_REG)).filter(t => {
    if (CHART_REG[t]) return !!(built.cs && built.cs[t]);
    if (t === 'organism') return !!built.org;
    if (t === 'stacked100') return hasS;
    if (t === 'treemap') return built.kind === 'category' || (built.kind === 'time' && hasS);
    if (t === 'race') return built.kind === 'time' && built.stats.sCount >= 3 && built.stats.xCount >= 4 && !!built.names.yc;
    if (t === 'calendar') return !!built.cal;
    if (t === 'bubble') return built.hasSize;
    return true;
  });
}
function chooseChart(briefing, m, built) {
  const avail = availableCharts(built);
  const nS = built.stats.sCount, nX = built.stats.xCount;
  let order;
  if (built.kind === 'time') {
    if (briefing.story === 'distribution' && built.cal) order = ['calendar', 'line', 'area'];
    else if (nS === 0 || nS <= 3) order = ['line', 'area', 'bars'];
    else order = ['area', 'line', 'stacked100'];
  } else if (built.kind === 'category') {
    if (briefing.story === 'composition') order = nS ? ['stacked100', 'treemap', 'bars'] : ['treemap', 'hbars', 'bars'];
    else if (nX <= 7 && !briefing.narrow) order = ['bars', 'hbars', 'kpi'];
    else order = ['hbars', 'bars', 'treemap'];
  } else if (built.kind === 'hist') order = ['bars', 'hbars', 'kpi'];
  else order = built.hasSize ? ['bubble', 'scatter', 'kpi'] : ['scatter', 'bubble', 'kpi'];
  // a árvore radial é a primeira sugestão para histórias de período/entidade; em relação e distribuição, o gráfico nativo vem primeiro e ela é a alternativa
  if (avail.includes('organism')) order = ['relation', 'distribution'].includes(briefing.story) ? [order[0], 'organism'].concat(order.slice(1)) : ['organism'].concat(order);
  // gráficos de canvas cujo formato de dados combina muito (ex.: uma linha por entidade) vão na frente; os demais ficam depois das opções nativas
  const fits = csFits(built, briefing), lead = fits.filter(f => f.s >= 0.9).map(f => f.t);
  order = lead.concat(order, fits.filter(f => f.s < 0.9).map(f => f.t));
  const ranked = order.filter((t, i) => avail.includes(t) && order.indexOf(t) === i);
  const rest = avail.filter(t => !ranked.includes(t));
  const all = ranked.concat(rest);
  return { primary: all[0], alts: all.slice(1, 3), all };
}

/* ---------- insights: cada um carrega o cálculo que o gerou ---------- */
const INSIGHT_LIMIT = { board: 1, clevel: 1, director: 2, team: 3, client: 2 };
const INSIGHT_ORDER = {
  invest: ['trend_up', 'jump_up', 'dominant', 'peak', 'outlier'],
  cut: ['drop', 'low', 'trend_down', 'outlier', 'dominant'],
  prioritize: ['dominant', 'peak', 'jump_up', 'outlier', 'trend_up'],
  alert: ['drop', 'outlier', 'trend_down', 'low', 'dominant'],
  celebrate: ['peak', 'trend_up', 'jump_up', 'dominant', 'outlier'],
};

function quantile(sorted, p) { return sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))]; }

function computeInsights(built, briefing, lang, T) {
  const out = {};
  const unit = built.unit, name = built.names.y;
  const f = v => fmtNum(v, unit, lang);
  const tot = (built.totX || []).filter(t => t.value !== null);
  const how = built.aggKind === 'mean' ? T('aggMean') : built.aggKind === 'count' ? T('aggCount') : T('aggSum');
  const base = lbl => `${how} · ${name}${lbl ? ' · ' + lbl : ''}`;
  if (built.kind === 'relation' || tot.length < 2) return [];
  const isTime = built.xIsTime;
  const vals = tot.map(t => t.value);
  const sum = vals.reduce((a, b) => a + b, 0), mean = sum / vals.length;

  // pico
  const iMax = vals.indexOf(Math.max(...vals));
  if (tot[iMax].value > 0 && mean > 0) {
    const d = (tot[iMax].value / mean - 1) * 100;
    out.peak = { text: T('ins_peak', tot[iMax].label, f(tot[iMax].value), fmtPct(d, lang)), calc: { title: T('calc_peak'), formula: T('f_peak'), rows: [{ k: tot[iMax].label, v: f(tot[iMax].value), n: tot[iMax].rows }, { k: T('mean'), v: f(mean) }], base: base(isTime ? built.names.x : '') } };
  }
  // vale
  const iMin = vals.indexOf(Math.min(...vals));
  if (iMin !== iMax && mean > 0) {
    const d = (tot[iMin].value / mean - 1) * 100;
    out.low = { text: T('ins_low', tot[iMin].label, f(tot[iMin].value), fmtPct(d, lang)), calc: { title: T('calc_low'), formula: T('f_peak'), rows: [{ k: tot[iMin].label, v: f(tot[iMin].value), n: tot[iMin].rows }, { k: T('mean'), v: f(mean) }], base: base() } };
  }
  // variações período a período (só faz sentido no tempo)
  if (isTime) {
    let best = null, worst = null;
    for (let i = 1; i < tot.length; i++) {
      const p = tot[i - 1].value, c = tot[i].value;
      if (p <= 0) continue;
      const ch = (c / p - 1) * 100;
      if (!best || ch > best.ch) best = { ch, i };
      if (!worst || ch < worst.ch) worst = { ch, i };
    }
    const mk = (b, key, ttl) => ({ text: T(key, tot[b.i].label, fmtPct(b.ch, lang), tot[b.i - 1].label), calc: { title: T(ttl), formula: T('f_var'), rows: [{ k: tot[b.i - 1].label, v: f(tot[b.i - 1].value), n: tot[b.i - 1].rows }, { k: tot[b.i].label, v: f(tot[b.i].value), n: tot[b.i].rows }, { k: T('variation'), v: fmtPct(b.ch, lang) }], base: base(built.names.x) } });
    if (best && best.ch > 5) out.jump_up = mk(best, 'ins_jump', 'calc_jump');
    if (worst && worst.ch < -5) out.drop = mk(worst, 'ins_drop', 'calc_drop');
    // tendência: janela inicial x janela final (até 12 períodos), para não confundir sazonalidade com crescimento
    const w = Math.min(12, Math.floor(tot.length / 2));
    const head = tot.slice(0, w), tail = tot.slice(-w);
    const sh = head.reduce((a, t) => a + t.value, 0), st = tail.reduce((a, t) => a + t.value, 0);
    if (w >= 2 && sh > 0) {
      const ch = (st / sh - 1) * 100;
      const l1 = `${head[0].label} → ${head[w - 1].label}`, l2 = `${tail[0].label} → ${tail[w - 1].label}`;
      const calc = { formula: T('f_trend', w), rows: [{ k: l1, v: f(sh), n: head.reduce((a, t) => a + t.rows, 0) }, { k: l2, v: f(st), n: tail.reduce((a, t) => a + t.rows, 0) }, { k: T('variation'), v: fmtPct(ch, lang) }], base: base(built.names.x) };
      if (ch >= 5) out.trend_up = { text: T('ins_trend_up', fmtPct(ch, lang), l1, l2), calc: { title: T('calc_trend'), ...calc } };
      if (ch <= -5) out.trend_down = { text: T('ins_trend_down', fmtPct(ch, lang), l1, l2), calc: { title: T('calc_trend'), ...calc } };
    }
  }
  // participação dominante: por série (cores) ou por categoria do eixo
  const shareSrc = built.totS && built.totS.length > 1 ? built.totS : !isTime ? tot : null;
  if (shareSrc && sum > 0) {
    const ts = shareSrc.reduce((a, b) => a + (b.value || 0), 0);
    const top = shareSrc.reduce((a, b) => ((b.value || 0) > (a.value || 0) ? b : a));
    const share = ts > 0 ? top.value / ts * 100 : 0;
    if (share >= 40 && top.label) out.dominant = { text: T('ins_dominant', top.label, fmtPct(share, lang).replace('+', '')), calc: { title: T('calc_dominant'), formula: T('f_share'), rows: [{ k: top.label, v: f(top.value), n: top.rows }, { k: T('total'), v: f(ts) }, { k: T('share'), v: fmtPct(share, lang).replace('+', '') }], base: base() } };
  }
  // outlier (IQR 1,5x)
  if (vals.length >= 8) {
    const s = vals.slice().sort((a, b) => a - b);
    const q1 = quantile(s, 0.25), q3 = quantile(s, 0.75), iqr = q3 - q1;
    if (iqr > 0) {
      const hi = q3 + 1.5 * iqr, lo = q1 - 1.5 * iqr;
      const idx = vals.map((v, i) => [v, i]).filter(([v]) => v > hi || v < lo).sort((a, b) => Math.abs(b[0] - mean) - Math.abs(a[0] - mean))[0];
      if (idx) out.outlier = { text: T('ins_outlier', tot[idx[1]].label, f(idx[0])), calc: { title: T('calc_outlier'), formula: T('f_iqr'), rows: [{ k: tot[idx[1]].label, v: f(idx[0]), n: tot[idx[1]].rows }, { k: 'Q1 / Q3', v: `${f(q1)} / ${f(q3)}` }, { k: T('limits'), v: `${f(lo)} – ${f(hi)}` }], base: base() } };
    }
  }
  // faixas de histograma: só participação e pico fazem sentido (outlier sobre contagem de faixas confunde)
  if (built.kind === 'hist') { delete out.outlier; delete out.low; }
  const order = INSIGHT_ORDER[briefing.decision] || INSIGHT_ORDER.prioritize;
  const limit = briefing.limit || INSIGHT_LIMIT[briefing.audience] || 2;
  // briefing.all (construtor de história): todos os candidatos, os da decisão primeiro
  const keys = briefing.all ? [...order.filter(k => out[k]), ...Object.keys(out).filter(k => !order.includes(k))] : order.filter(k => out[k]);
  return keys.slice(0, limit).map((k, i) => ({ id: k, ...out[k] }));
}

/* ---------- contraste (WCAG) ---------- */
function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function lum(hex) { const [r, g, b] = hexToRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function contrast(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
const readableOn = bg => (contrast('#0b0d0a', bg) >= contrast('#f4f5f0', bg) ? '#0b0d0a' : '#f4f5f0');


/* ---------- indicadores (KPI): cada número é um cálculo sobre os dados ---------- */
function pearson(pts) {
  const n = pts.length; if (n < 3) return null;
  let sx = 0, sy = 0; for (const p of pts) { sx += p.x; sy += p.y; }
  const mx = sx / n, my = sy / n; let a = 0, b = 0, c = 0;
  for (const p of pts) { const dx = p.x - mx, dy = p.y - my; a += dx * dy; b += dx * dx; c += dy * dy; }
  return b > 0 && c > 0 ? a / Math.sqrt(b * c) : null;
}
function kpiCards(built, lang, T) {
  const u = built.unit, s = built.stats, f = v => fmtNum(v, u, lang), cards = [];
  const how = T(built.aggKind === 'mean' ? 'aggMean' : built.aggKind === 'count' ? 'aggCount' : 'aggSum').toLowerCase();
  const sub = T('kpi_sub_rows', s.rowsUsed, how, built.names.y);
  const tot = (built.totX || []).filter(t => t.value !== null);
  if (built.kind === 'relation') {
    const pts = built.pts, mean = k => pts.reduce((a, p) => a + p[k], 0) / pts.length, r = pearson(pts);
    cards.push({ id: 'points', label: T('kpi_points'), value: pts.length, sub: T('kpi_sub_rows', s.rowsUsed, how, built.names.e) });
    cards.push({ id: 'mx', label: T('kpi_meanx', built.names.x), value: mean('x'), unit: built.units && built.units.x, sub: T('kpi_periods', pts.length).replace(/períodos|periods/, lang === 'en' ? 'points' : 'pontos') });
    cards.push({ id: 'my', label: T('kpi_meanx', built.names.y), value: mean('y'), unit: built.units && built.units.y, sub: T('kpi_periods', pts.length).replace(/períodos|periods/, lang === 'en' ? 'points' : 'pontos') });
    if (r !== null) cards.push({ id: 'r', label: T('kpi_corr'), value: r, raw: 2, sub: T('kpi_corr_sub', pts.length) });
    return cards;
  }
  if (built.kind === 'hist') {
    const top = tot.reduce((a, b) => (b.value > a.value ? b : a), tot[0]);
    cards.push({ id: 'rows', label: T('kpi_rows'), value: s.rowsUsed, sub: built.names.x });
    cards.push({ id: 'common', label: T('kpi_common'), value: top.value, sub: top.label });
    return cards;
  }
  const total = tot.reduce((a, t) => a + t.value, 0);
  if (built.xIsTime) {
    const last = tot[tot.length - 1], prev = tot[tot.length - 2], iM = tot.reduce((a, t, i) => (t.value > tot[a].value ? i : a), 0), iL = tot.reduce((a, t, i) => (t.value < tot[a].value ? i : a), 0);
    if (built.aggKind === 'mean') cards.push({ id: 'avg', label: T('kpi_avgs'), value: total / tot.length, unit: u, sub });
    else { cards.push({ id: 'total', label: T('kpi_total'), value: total, unit: u, sub }); cards.push({ id: 'avgp', label: T('kpi_avgp'), value: total / tot.length, unit: u, sub: T('kpi_periods', tot.length) }); }
    cards.push({ id: 'last', label: T('kpi_last'), value: last.value, unit: u, sub: prev ? T('kpi_vs', prev.label) : last.label, delta: prev && prev.value > 0 ? (last.value / prev.value - 1) * 100 : null, tag: last.label });
    cards.push({ id: 'peak', label: T('kpi_peak'), value: tot[iM].value, unit: u, sub: tot[iM].label });
    if (cards.length < 4) cards.push({ id: 'low', label: T('kpi_low'), value: tot[iL].value, unit: u, sub: tot[iL].label });
  } else {
    const top = tot.reduce((a, b) => (b.value > a.value ? b : a)), low = tot.reduce((a, b) => (b.value < a.value ? b : a));
    if (built.aggKind !== 'mean') cards.push({ id: 'total', label: T('kpi_total'), value: total, unit: u, sub });
    cards.push({ id: 'top', label: T('kpi_top'), value: top.value, unit: u, sub: built.aggKind !== 'mean' && total > 0 ? `${top.label} · ${T('kpi_share', fmtPct(top.value / total * 100, lang).replace('+', ''))}` : top.label });
    cards.push({ id: 'bottom', label: T('kpi_bottom'), value: low.value, unit: u, sub: low.label });
    cards.push({ id: 'cats', label: T('kpi_cats'), value: tot.length, sub: built.names.x });
  }
  if (built.totS && built.totS.length > 1 && built.aggKind !== 'mean') {
    const sTot = built.totS.reduce((a, t) => a + (t.value || 0), 0);
    built.totS.slice(0, 4).forEach(t => cards.push({ id: 's:' + t.label, label: t.label, value: t.value, unit: u, sub: sTot > 0 ? T('kpi_share', fmtPct(t.value / sTot * 100, lang).replace('+', '')) : '', series: true }));
  }
  return cards;
}
