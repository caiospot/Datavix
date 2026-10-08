/* Datavix: galeria de gráficos (2): comparação e tendência. Várias colunas, várias linhas (um painel por grupo, mesma escala),
 * linha radial (o ciclo do ano ou das categorias em volta do centro) e radar (vários indicadores por grupo, cada eixo na sua escala).
 * Usa o mesmo motor (GalEngine) e a mesma casca dos demais gráficos de canvas; aqui ficam os dados e a geometria. */
const GAL2_COLS_X = 12, GAL2_LINES_X = 36, GAL2_PANELS = 12, GAL2_SERIES = 6, GAL2_AXES = 6;

/* ---------------- dados ---------------- */
const gal2Avg = c => !!c && (c.mtype === 'attr' || c.mtype === 'score' || c.mtype === 'duration' || c.unit === '%' || RAYS_AVG_HINT.test(c.name));
function gal2Agg(cols, vi) { return vi < 0 ? 'count' : gal2Avg(cols[vi]) ? 'mean' : 'sum'; }
function gal2Date(cols, minBuckets = 4) { return cols.findIndex(c => c.kind === 'date' && colUsable(c) && bucketCount(c.min, c.max, 'month') >= minBuckets); }
function gal2Suggest(mode, cols) {
  const vi = bestMeasure(cols), agg = gal2Agg(cols, vi), val = vi, d = gal2Date(cols, mode === 'radial' ? 15 : 6);
  if (mode === 'radar') {
    const g = galDimCols(cols, 2, 8).filter(i => cols[i].role !== 'flag').sort((a, b) => Math.abs(distinctOf(cols[a]) - 5) - Math.abs(distinctOf(cols[b]) - 5))[0];
    const ms = cols.map((c, i) => i).filter(i => isMeasure(cols[i]) && cols[i].role !== 'id').slice(0, GAL2_AXES);
    if (g === undefined || ms.length < 3) return null;
    const o = { grp: g, agg: 'auto' }; for (let k = 0; k < GAL2_AXES; k++) o['m' + (k + 1)] = k < ms.length ? ms[k] : -1; return o;
  }
  if (mode === 'radial') {
    if (d >= 0) return { x: d, grp: -1, val, agg };
    const x = galDimCols(cols, 5, 16, 20).filter(i => cols[i].role !== 'flag')[0]; if (x === undefined) return null;
    const g = galDimCols(cols, 2, 5).filter(i => i !== x && cols[i].role !== 'flag')[0]; return { x, grp: g === undefined ? -1 : g, val, agg };
  }
  // colunas e linhas em painéis: eixo = data (de preferência) ou categoria; painel = grupo
  const g = galDimCols(cols, 2, GAL_PANELS).filter(i => cols[i].role !== 'flag').sort((a, b) => Math.abs(distinctOf(cols[a]) - 6) - Math.abs(distinctOf(cols[b]) - 6));
  if (mode === 'lines') { if (d < 0) return null; return { x: d, grp: g.length ? g[0] : -1, val, agg }; }
  if (d >= 0) return { x: d, grp: g.length ? g[0] : -1, val, agg };
  const x = galDimCols(cols, 3, 12, 22).filter(i => cols[i].role !== 'flag').sort((a, b) => Math.abs(distinctOf(cols[a]) - 6) - Math.abs(distinctOf(cols[b]) - 6))[0]; if (x === undefined) return null;
  const g2 = g.filter(i => i !== x); return { x, grp: g2.length ? g2[0] : -1, val, agg };
}
// eixo x: data (agrupada no período que cabe) ou categoria (as maiores)
function gal2Axis(ds, ci, maxN, lang, vc, policy) {
  const c = ds.columns[ci], n = ds.rowCount;
  if (c.kind === 'date') {
    let grain = 'year'; for (const g of ['day', 'week', 'month', 'quarter', 'year']) if (bucketCount(c.min, c.max, g) <= maxN) { grain = g; break; }
    const set = new Set(); for (let i = 0; i < n; i++) { const t = c.data[i]; if (!Number.isNaN(t)) set.add(bucketStart(t, grain)); }
    const keys = [...set].sort((a, b) => a - b), idx = new Map(keys.map((k, i) => [k, i]));
    return { name: c.name, time: true, labels: keys.map(k => bucketLabel(k, grain, lang)), of: i => { const t = c.data[i]; return Number.isNaN(t) ? -1 : (idx.has(bucketStart(t, grain)) ? idx.get(bucketStart(t, grain)) : -1); } };
  }
  const tot = new Map(); for (let i = 0; i < n; i++) { const k = c.codes[i]; if (k < 0) continue; let v = vc ? vc.data[i] : 1; if (Number.isNaN(v)) v = 0; tot.set(k, (tot.get(k) || 0) + Math.abs(v)); }
  const keep = [...tot].sort((a, b) => b[1] - a[1]).slice(0, maxN).map(x => x[0]), idx = new Map(keep.map((k, i) => [k, i]));
  return { name: c.name, time: false, labels: keep.map(k => String(c.dict[k])), of: i => { const k = c.codes[i]; return k >= 0 && idx.has(k) ? idx.get(k) : -1; } };
}
function gal2Cells(ds, ax, gOf, vc, policy) {
  const cells = new Map(), n = ds.rowCount; let used = 0;
  for (let i = 0; i < n; i++) {
    const x = ax.of(i), g = gOf(i); if (x < 0 || g < 0) continue; let v = vc ? vc.data[i] : 1; if (Number.isNaN(v)) { if (policy === 'zero') v = 0; else continue; }
    const key = g * 100000 + x; let a = cells.get(key); if (!a) { a = { g, x, sum: 0, n: 0 }; cells.set(key, a); } a.sum += v; a.n++; used++;
  }
  return { cells, used };
}
function gal2Build(ds, m, opts, mode) {
  if (!m) return null;
  const cols = ds.columns, lang = opts.lang || 'pt', policy = opts.nullPolicy || 'ignore', OTH = lang === 'en' ? 'Others' : 'Outros';
  if (mode === 'radar') return gal2Radar(ds, m, opts);
  const xc = m.x >= 0 ? cols[m.x] : null, vc = m.val >= 0 ? cols[m.val] : null, gc = m.grp >= 0 && cols[m.grp] && cols[m.grp].codes ? cols[m.grp] : null;
  if (!xc || (vc && !isMeasure(vc)) || !(xc.kind === 'date' || (xc.codes && isDim(xc)))) return null;
  const agg = vc ? (m.agg || 'sum') : 'count', fin = a => (agg === 'mean' ? (a.n ? a.sum / a.n : 0) : agg === 'count' ? a.n : a.sum);
  const base = { mode, xName: xc.name, catName: xc.name, grpName: gc ? gc.name : null, valName: vc ? vc.name : (lang === 'en' ? 'Rows' : 'Linhas'), unit: vc ? vc.unit : null, agg, rowsTotal: ds.rowCount, rowsUsed: 0, dropped: 0 };
  // radial com data: o ciclo é o mês do ano e cada linha é um ano
  if (mode === 'radial' && xc.kind === 'date') {
    const yrs = new Set(); for (let i = 0; i < ds.rowCount; i++) { const t = xc.data[i]; if (!Number.isNaN(t)) yrs.add(new Date(t).getUTCFullYear()); }
    const years = [...yrs].sort((a, b) => b - a).slice(0, GAL2_SERIES).reverse(); if (years.length < 1) return null; const yi = new Map(years.map((y, i) => [y, i]));
    const ax = { name: lang === 'en' ? 'Month' : 'Mês', time: false, labels: (lang === 'en' ? MONTHS_EN : MONTHS_PT).slice(), of: i => { const t = xc.data[i]; return Number.isNaN(t) ? -1 : new Date(t).getUTCMonth(); } };
    const gOf = i => { const t = xc.data[i]; return Number.isNaN(t) ? -1 : (yi.has(new Date(t).getUTCFullYear()) ? yi.get(new Date(t).getUTCFullYear()) : -1); };
    const { cells, used } = gal2Cells(ds, ax, gOf, vc, policy); if (cells.size < 6) return null;
    return gal2Finish(base, ax, years.map(y => String(y)), cells, fin, used, lang, mode, lang === 'en' ? 'Year' : 'Ano', OTH);
  }
  const maxX = mode === 'cols' ? GAL2_COLS_X : mode === 'lines' ? GAL2_LINES_X : 16, ax = gal2Axis(ds, m.x, maxX, lang, vc, policy); if (ax.labels.length < (mode === 'radial' ? 4 : 3)) return null;
  let gOf = () => 0, names = [vc ? vc.name : (lang === 'en' ? 'Total' : 'Total')], gname = null;
  if (gc) {
    const tot = new Map(); for (let i = 0; i < ds.rowCount; i++) { const k = gc.codes[i]; if (k < 0 || ax.of(i) < 0) continue; let v = vc ? vc.data[i] : 1; if (Number.isNaN(v)) v = 0; tot.set(k, (tot.get(k) || 0) + Math.abs(v)); }
    const lim = mode === 'radial' ? GAL2_SERIES : GAL_PANELS, keep = [...tot].sort((a, b) => b[1] - a[1]).slice(0, lim).map(x => x[0]); if (keep.length < 1) return null;
    const gi = new Map(keep.map((k, i) => [k, i])); gOf = i => { const k = gc.codes[i]; return k >= 0 && gi.has(k) ? gi.get(k) : -1; }; names = keep.map(k => String(gc.dict[k])); gname = gc.name;
    base.groupTotal = tot.size;
  }
  const { cells, used } = gal2Cells(ds, ax, gOf, vc, policy); if (cells.size < 4) return null;
  return gal2Finish(base, ax, names, cells, fin, used, lang, mode, gname, OTH);
}
function gal2Finish(base, ax, names, cells, fin, used, lang, mode, gname, OTH) {
  const items = [], series = names.map((l, i) => ({ label: l, c: i, v: 0, n: 0 })); let yMin = 0, yMax = -Infinity;
  const arr = [...cells.values()].map(a => ({ ...a, v: fin(a) })).sort((a, b) => a.g - b.g || a.x - b.x);
  arr.forEach(a => { yMin = Math.min(yMin, a.v); yMax = Math.max(yMax, a.v); });
  if (!(yMax > yMin)) return null;
  const catX = !ax.time && mode === 'cols' && !(names.length === 1 && false);
  arr.forEach(a => { series[a.g].v += a.v; series[a.g].n += a.n; items.push({ label: ax.labels[a.x], x: a.x, v: a.v, n: a.n, g: a.g, c: catX ? a.x : a.g, lg: catX ? a.x : a.g, share: 0 }); });
  const legend = catX ? ax.labels.map((l, i) => ({ label: l, c: i, n: 0 })) : series.map((s, i) => ({ label: s.label, c: i, n: s.n }));
  if (catX) items.forEach(it => { legend[it.x].n += it.n; });
  Object.assign(base, { xs: ax.labels, time: ax.time, series, items, legend, yMin, yMax, grpName: gname || base.grpName, rowsUsed: used, catName: ax.name, xName: ax.name, total: series.reduce((s, x) => s + x.v, 0) });
  return base;
}
// radar: cada eixo é um indicador (soma ou média conforme a natureza), normalizado pelo maior grupo
function gal2Radar(ds, m, opts) {
  const cols = ds.columns, lang = opts.lang || 'pt', policy = opts.nullPolicy || 'ignore', gc = m.grp >= 0 && cols[m.grp] && cols[m.grp].codes ? cols[m.grp] : null; if (!gc) return null;
  const mi = []; for (let k = 1; k <= GAL2_AXES; k++) { const i = m['m' + k]; if (i >= 0 && cols[i] && isMeasure(cols[i]) && !mi.includes(i)) mi.push(i); } if (mi.length < 3) return null;
  const tot = new Map(); for (let i = 0; i < ds.rowCount; i++) { const k = gc.codes[i]; if (k >= 0) tot.set(k, (tot.get(k) || 0) + 1); }
  const keep = [...tot].sort((a, b) => b[1] - a[1]).slice(0, GAL2_SERIES).map(x => x[0]); if (keep.length < 2) return null; const gi = new Map(keep.map((k, i) => [k, i]));
  const axes = [], vals = []; let used = 0;
  mi.forEach(ci => {
    const c = cols[ci], mean = gal2Avg(c), sum = keep.map(() => 0), cnt = keep.map(() => 0);
    for (let i = 0; i < ds.rowCount; i++) { const g = gc.codes[i]; if (g < 0 || !gi.has(g)) continue; let v = c.data[i]; if (Number.isNaN(v)) { if (policy === 'zero') v = 0; else continue; } sum[gi.get(g)] += v; cnt[gi.get(g)]++; used++; }
    const v = sum.map((s, k) => (cnt[k] ? (mean ? s / cnt[k] : s) : null)), mx = Math.max(0, ...v.filter(x => x !== null).map(Math.abs)); if (mx > 0 && v.filter(x => x !== null).length >= 2) { axes.push({ label: c.name, unit: c.unit, mean, max: mx, ci }); vals.push(v); }
  });
  if (axes.length < 3) return null;
  const series = keep.map((k, i) => ({ label: String(gc.dict[k]), c: i, v: 0, n: tot.get(k) })), items = [];
  series.forEach((s, g) => axes.forEach((ax, a) => { const v = vals[a][g]; if (v === null) return; const nv = Math.abs(v) / ax.max * 100; s.v += nv; items.push({ label: ax.label, x: a, v, nv, n: 0, g, c: g, lg: g, txt: fmtNum(v, ax.unit, lang), how: ax.mean ? (lang === 'en' ? 'mean' : 'média') : (lang === 'en' ? 'sum' : 'soma') }); }));
  return { mode: 'radar', xName: lang === 'en' ? 'Indicator' : 'Indicador', catName: lang === 'en' ? 'Indicator' : 'Indicador', grpName: gc.name, valName: lang === 'en' ? 'Index (% of the highest group)' : 'Índice (% do maior grupo)', unit: null, agg: 'mean', axes, xs: axes.map(a => a.label), series, items, legend: series.map((s, i) => ({ label: s.label, c: i, n: s.n })), yMin: 0, yMax: 100, time: false, rowsTotal: ds.rowCount, rowsUsed: used, dropped: 0, total: 0 };
}
function gal2Fit(mode, built, briefing) {
  const D = csBuilt({ built }, mode); if (!D) return 0;
  if (mode === 'cols') return D.series.length >= 2 && D.series.length <= 9 ? 0.5 : 0.4;
  if (mode === 'lines') return D.series.length >= 3 && D.series.length <= 12 ? 0.62 : 0.4;
  if (mode === 'radial') return briefing && briefing.story === 'time' && D.series.length >= 2 ? 0.5 : 0.35;
  return D.axes.length >= 4 && D.series.length >= 2 && D.series.length <= 5 ? 0.6 : 0.4;
}

/* ---------------- geometria e desenho (somados ao GalEngine) ---------------- */
const galClamp = orgClamp;
Object.assign(GalEngine.prototype, {
  layoutXY() {
    if (this.D.mode === 'box') return this.layoutBox(); if (this.D.mode === 'words') return this.layoutWords(); if (this.D.mode === 'bubmap') return this.layoutMap(); if (this.D.mode === 'isomap') return this.layoutIso();
    const { D, N } = this, W = this.w, H = this.h, mode = D.mode, polar = mode === 'radial' || mode === 'radar';
    this.titles = []; this.geo = { panels: [] }; const T0 = () => ({ cx: 0, cy: 0, r0: 0, r1: 0, a0: 0, a1: 0, x: 0, y: 0, r: 0, w: 0, h: 0 });
    N.forEach(n => { n.tal = n.vis ? 1 : 0; n.t = Object.assign(T0(), n.t ? { x: n.t.x, y: n.t.y } : { x: W / 2, y: H / 2 }); n.gd = (n.it.x || 0) / Math.max(1, D.xs.length); });
    if (polar) {
      const cx = W / 2, cy = H / 2 + 12, narrow = W < 520, R = Math.max(narrow ? 80 : 60, Math.min(W / 2 - (mode === 'radar' ? (narrow ? 84 : 128) : 56), (H - 24) / 2 - 52)), nA = D.xs.length; this.geo.cx = cx; this.geo.cy = cy; this.geo.R = R;
      N.forEach(n => { const a = -Math.PI / 2 + Math.PI * 2 * n.it.x / nA, fr = mode === 'radar' ? n.it.nv / 100 : Math.max(0, n.it.v) / (D.yMax || 1), r = R * fr; n.t.x = cx + Math.cos(a) * r; n.t.y = cy + Math.sin(a) * r; n.t.r = 4; n.cx0 = cx; n.cy0 = cy; });
      return;
    }
    const pv = D.series.map((s, gi) => gi).filter(gi => N.some(n => n.it.g === gi && n.vis)), k = Math.max(1, pv.length); let best = { sc: -1, cols: 1 };
    for (let c = 1; c <= k; c++) { const rows = Math.ceil(k / c), pw = W / c, ph = (H - 30) / rows, sc = Math.min(pw / 1.55, ph); if (sc > best.sc) best = { sc, cols: c }; }
    const top0 = 30, cols = best.cols, rows = Math.ceil(k / cols), pw = W / cols, ph = (H - top0) / rows, titleH = 24, labH = 20, padL = 54, nx = D.xs.length;
    pv.forEach((gi, pi) => {
      const c = pi % cols, r = Math.floor(pi / cols), px = pw * c, py = top0 + ph * r, x0 = px + padL, x1 = px + pw - 12, y0 = py + titleH + 4, y1 = py + ph - labH - 6;
      const yv = v => y1 - (v - D.yMin) / ((D.yMax - D.yMin) || 1) * (y1 - y0), slot = (x1 - x0) / nx, bw = galClamp(slot * 0.68, 2, 46);
      this.geo.panels.push({ gi, px, py, pw, ph, x0, x1, y0, y1, yv, slot, bw, first: c === 0, last: r === rows - 1 });
      this.titles.push({ label: D.series[gi].label, x: px + padL, y: py + 14, total: D.series[gi].v, gi, pw });
      N.filter(n => n.it.g === gi).forEach(n => {
        if (mode === 'cols') { const xc = x0 + slot * (n.it.x + 0.5), yt = Math.min(yv(n.it.v), yv(0)), hh = Math.abs(yv(n.it.v) - yv(0)); Object.assign(n.t, { x: xc - bw / 2, y: yt, w: bw, h: Math.max(1, hh) }); }
        else { Object.assign(n.t, { x: nx > 1 ? x0 + (x1 - x0) * n.it.x / (nx - 1) : (x0 + x1) / 2, y: yv(n.it.v), r: 3 }); }
        n.pan = this.geo.panels[this.geo.panels.length - 1];
      });
    });
    this.geo.cols = cols;
  },
  drawXY(ctx, opt) {
    const { th, N, D } = this, fg = th.fg, base = th.base, mode = D.mode; if (!opt || opt.clear !== false) ctx.clearRect(0, 0, this.w, this.h);
    const [br, bg2, bb] = hexToRgb(base); this.light = br + bg2 + bb > 450; const fr = orgStage(this.grow, 0, 0.25), hv = this.hoverId !== null ? N[this.hoverId] : null;
    if (br + bg2 + bb < 330) { if (!this.stars) { const sr = orgRand(31); this.stars = Array.from({ length: 60 }, () => [sr(), sr(), 0.5 + sr() * 1.1, 0.12 + sr() * 0.35]); } ctx.fillStyle = rgba(fg, 1); for (const s of this.stars) { ctx.globalAlpha = s[3] * fr; ctx.beginPath(); ctx.arc(s[0] * this.w, s[1] * this.h, s[2], 0, ORG_TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    if (mode === 'box') return this.drawBox(ctx, hv, fr); if (mode === 'words') return this.drawWords(ctx, hv, fr); if (mode === 'bubmap') return this.drawMap(ctx, hv, fr); if (mode === 'isomap') return this.drawIso(ctx, hv, fr);
    if (mode === 'radial' || mode === 'radar') return this.drawPolar(ctx, hv, fr);
    const ticks = csNiceTicks(Math.max(D.yMax, 0), 3), f = galClamp(Math.min(this.geo.panels[0] ? this.geo.panels[0].pw / 24 : 10, 12), 9, 12);
    ctx.textBaseline = 'middle';
    for (const P of this.geo.panels) {
      const al = fr; ctx.strokeStyle = rgba(fg, 0.12 * al); ctx.lineWidth = 1; ctx.setLineDash([2, 5]); ctx.font = `500 ${f - 1}px ${th.font}`; ctx.textAlign = 'right';
      for (const t of ticks) { const y = P.yv(t); if (y < P.y0 - 1) continue; ctx.beginPath(); ctx.moveTo(P.x0, y); ctx.lineTo(P.x1, y); ctx.stroke(); if (P.first) { ctx.fillStyle = rgba(fg, 0.5 * al); ctx.fillText(fmtNum(t, D.unit, LANG), P.x0 - 5, y); } }
      ctx.setLineDash([]); ctx.strokeStyle = rgba(fg, 0.35 * al); ctx.beginPath(); ctx.moveTo(P.x0, P.yv(0)); ctx.lineTo(P.x1, P.yv(0)); ctx.stroke();
      // rótulos do eixo: o mais espaçado que cabe
      ctx.textAlign = 'center'; ctx.fillStyle = rgba(fg, 0.6 * al); ctx.font = `500 ${f - 1}px ${th.font}`; const nx = D.xs.length, step = Math.max(1, Math.ceil(nx / Math.max(1, Math.floor((P.x1 - P.x0) / 46))));
      for (let i = 0; i < nx; i += step) ctx.fillText(galTrunc(D.xs[i], mode === 'cols' ? 11 : 9), mode === 'cols' ? P.x0 + P.slot * (i + 0.5) : (nx > 1 ? P.x0 + (P.x1 - P.x0) * i / (nx - 1) : (P.x0 + P.x1) / 2), P.y1 + 12);
    }
    for (const t of this.titles) { const g = N.find(n => n.it.g === t.gi); const dm = g ? g.dm : 1; ctx.textAlign = 'left'; ctx.font = `700 ${f + 2}px ${th.font}`; ctx.fillStyle = rgba(fg, 0.95 * fr * dm); ctx.fillText(galTrunc(t.label, Math.max(8, Math.floor(t.pw / 9))), t.x, t.y); ctx.font = `500 ${f - 1}px ${th.font}`; ctx.fillStyle = rgba(fg, 0.5 * fr * dm); const w0 = ctx.measureText(galTrunc(t.label, Math.max(8, Math.floor(t.pw / 9)))).width; ctx.font = `700 ${f + 2}px ${th.font}`; const ww = ctx.measureText(galTrunc(t.label, Math.max(8, Math.floor(t.pw / 9)))).width; ctx.font = `500 ${f - 1}px ${th.font}`; if (D.agg !== 'mean') ctx.fillText(fmtNum(t.total, D.unit, LANG), t.x + ww + 8, t.y); }
    if (mode === 'cols') {
      for (const n of N.slice().sort((a, b) => (a === hv) - (b === hv))) {
        if (n.al < 0.02) continue; const g = n.g, p = this.prog(n), hh = g.h * p, al = n.al * n.dm, col = this.col(n.it.c), on = n === hv;
        if (hh < 0.3) continue; const bottom = n.it.v >= 0 ? g.y + g.h : g.y, y = n.it.v >= 0 ? bottom - hh : bottom;
        ctx.fillStyle = rgba(col, (this.light ? 0.92 : 0.88) * al); fillRound(ctx, g.x, y, g.w, hh, Math.min(3, g.w / 3)); if (on) { ctx.strokeStyle = rgba(fg, 0.95 * al); ctx.lineWidth = 1.6; ctx.strokeRect(g.x - 1, y - 1, g.w + 2, hh + 2); }
      }
      // valor da maior coluna de cada painel e o da coluna sob o mouse
      ctx.textAlign = 'center'; ctx.font = `700 ${f}px ${th.font}`;
      for (const P of this.geo.panels) { const col = N.filter(n => n.it.g === P.gi && n.vis).sort((a, b) => b.it.v - a.it.v)[0]; for (const n of [col, hv && hv.pan === P ? hv : null]) { if (!n || n.al < 0.5 || n.g.w < 4) continue; ctx.fillStyle = rgba(fg, 0.9 * n.al * orgStage(this.grow, 0.6, 1)); ctx.fillText(fmtNum(n.it.v, D.unit, LANG), n.g.x + n.g.w / 2, n.g.y - 8); } }
      return;
    }
    // linhas: uma série por painel; o traço aparece da esquerda para a direita
    for (const P of this.geo.panels) {
      const pts = N.filter(n => n.it.g === P.gi && n.al > 0.02).sort((a, b) => a.it.x - b.it.x); if (!pts.length) continue; const col = this.col(pts[0].it.c), dm = pts[0].dm, rev = orgEase(orgClamp(this.grow / 0.8)), al = pts[0].al * dm;
      ctx.save(); ctx.beginPath(); ctx.rect(P.px, P.py, (P.x1 - P.px) * rev + 8, P.ph); ctx.clip();
      const path = () => { ctx.beginPath(); pts.forEach((n, i) => (i ? ctx.lineTo(n.g.x, n.g.y) : ctx.moveTo(n.g.x, n.g.y))); };
      path(); ctx.lineTo(pts[pts.length - 1].g.x, P.yv(0)); ctx.lineTo(pts[0].g.x, P.yv(0)); ctx.closePath(); const gr = ctx.createLinearGradient(0, P.y0, 0, P.y1); gr.addColorStop(0, rgba(col, 0.32 * al)); gr.addColorStop(1, rgba(col, 0)); ctx.fillStyle = gr; ctx.fill();
      path(); ctx.strokeStyle = rgba(col, al); ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
      for (const n of pts) { const on = n === hv; if (!on && pts.length > 24 && n !== pts[pts.length - 1]) continue; ctx.fillStyle = rgba(on ? fg : col, al); ctx.beginPath(); ctx.arc(n.g.x, n.g.y, on ? 4.5 : 2.6, 0, ORG_TAU); ctx.fill(); }
      const last = hv && hv.it.g === P.gi ? hv : pts[pts.length - 1]; ctx.textAlign = last.g.x > P.x1 - 40 ? 'right' : 'left'; ctx.font = `700 ${f}px ${th.font}`; ctx.fillStyle = rgba(fg, 0.92 * al * rev); ctx.fillText(fmtNum(last.it.v, D.unit, LANG), last.g.x + (ctx.textAlign === 'right' ? -7 : 7), last.g.y - 9);
    }
  },
  drawPolar(ctx, hv, fr) {
    const { th, N, D } = this, fg = th.fg, base = th.base, { cx, cy, R } = this.geo, nA = D.xs.length, mode = D.mode, f = galClamp(R / 16, 10, 13);
    const ang = i => -Math.PI / 2 + Math.PI * 2 * i / nA;
    // anéis, eixos e rótulos
    ctx.lineWidth = 1; ctx.strokeStyle = rgba(fg, 0.14 * fr); ctx.setLineDash([2, 5]);
    const rings = mode === 'radar' ? [25, 50, 75, 100].map(p => ({ r: R * p / 100, t: p + '%' })) : csNiceTicks(D.yMax, 4).map(t => ({ r: R * t / D.yMax, t: fmtNum(t, D.unit, LANG) }));
    for (const rg of rings) { ctx.beginPath(); if (mode === 'radar') { for (let i = 0; i < nA; i++) { const a = ang(i), x = cx + Math.cos(a) * rg.r * fr, y = cy + Math.sin(a) * rg.r * fr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); } else ctx.arc(cx, cy, rg.r * fr, 0, ORG_TAU); ctx.stroke(); }
    ctx.setLineDash([]); ctx.strokeStyle = rgba(fg, 0.18 * fr); for (let i = 0; i < nA; i++) { const a = ang(i); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * fr, cy + Math.sin(a) * R * fr); ctx.stroke(); }
    ctx.textBaseline = 'middle'; ctx.font = `500 ${f - 2}px ${th.font}`; ctx.textAlign = 'center'; for (const rg of rings) { const y = cy - rg.r * fr; ctx.lineWidth = 4; ctx.strokeStyle = rgba(base, 0.85 * fr); ctx.strokeText(rg.t, cx + 2, y); ctx.fillStyle = rgba(fg, 0.5 * fr); ctx.fillText(rg.t, cx + 2, y); }
    ctx.font = `600 ${f}px ${th.font}`; for (let i = 0; i < nA; i++) { const a = ang(i), c = Math.cos(a), s = Math.sin(a); ctx.textAlign = Math.abs(c) < 0.2 ? 'center' : c > 0 ? 'left' : 'right'; ctx.fillStyle = rgba(fg, 0.85 * fr); ctx.fillText(galTrunc(D.xs[i], this.w < 520 ? 13 : 22), cx + c * (R + 12), cy + s * (R + 14)); }
    // séries: polígono fechado, preenchimento leve, vértices; o raio cresce do centro
    const bySeries = D.series.map((s, gi) => N.filter(n => n.it.g === gi && n.al > 0.02).sort((a, b) => a.it.x - b.it.x)).filter(a => a.length);
    for (const pts of bySeries.slice().sort((a, b) => (a.includes(hv) ? 1 : 0) - (b.includes(hv) ? 1 : 0))) {
      const col = this.col(pts[0].it.c), dm = pts[0].dm, al = pts[0].al * dm, p = orgEase(orgClamp((this.grow - 0.05) / 0.8)), P = n => [cx + (n.g.x - cx) * p, cy + (n.g.y - cy) * p], on = pts.includes(hv);
      ctx.beginPath(); pts.forEach((n, i) => { const [x, y] = P(n); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); if (pts.length === nA || mode === 'radar') ctx.closePath();
      if (pts.length >= 3) { ctx.fillStyle = rgba(col, (on ? 0.3 : 0.13) * al); ctx.fill(); } ctx.strokeStyle = rgba(col, al); ctx.lineWidth = on ? 3 : 2; ctx.lineJoin = 'round'; ctx.stroke();
      for (const n of pts) { const [x, y] = P(n), h = n === hv; ctx.fillStyle = rgba(h ? fg : col, al); ctx.beginPath(); ctx.arc(x, y, h ? 5.5 : 3.2, 0, ORG_TAU); ctx.fill(); if (h) { ctx.strokeStyle = rgba(col, al); ctx.lineWidth = 2; ctx.stroke(); } }
    }
    if (hv && hv.al > 0.4) { const p = orgEase(orgClamp((this.grow - 0.05) / 0.8)), x = cx + (hv.g.x - cx) * p, y = cy + (hv.g.y - cy) * p, s = mode === 'radar' ? hv.it.txt : fmtNum(hv.it.v, D.unit, LANG); ctx.font = `700 ${f}px ${th.font}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = rgba(base, 0.92); ctx.strokeText(s, x, y - 14); ctx.fillStyle = rgba(fg, 1); ctx.fillText(s, x, y - 14); }
  },
  pickXY(mx, my) {
    const D = this.D; if (D.mode === 'box' || D.mode === 'words') return this.pickBoxWords(mx, my); if (D.mode === 'bubmap' || D.mode === 'isomap') return this.pickMap(mx, my); let best = null, bd = 1e9;
    for (const n of this.N) {
      if (n.al < 0.4) continue; const g = n.g;
      if (D.mode === 'cols') { if (mx >= g.x - 2 && mx <= g.x + g.w + 2 && my >= g.y - 2 && my <= g.y + g.h + 2) return n.i; continue; }
      const p = (D.mode === 'radial' || D.mode === 'radar') ? orgEase(orgClamp((this.grow - 0.05) / 0.8)) : 1, x = (D.mode === 'lines' ? g.x : this.geo.cx + (g.x - this.geo.cx) * p), y = (D.mode === 'lines' ? g.y : this.geo.cy + (g.y - this.geo.cy) * p), d = Math.hypot(mx - x, my - y);
      if (d < 18 && d < bd) { bd = d; best = n.i; }
    }
    return best;
  },
});

/* ---------------- interface ---------------- */
function gal2Render(mode, P, el) {
  if (el._org) el._org.destroy();
  const D = csBuilt(P, mode), lang = LANG; if (!D) { el.innerHTML = `<div class="noins">${T('gal_none')}</div>`; return null; }
  const radar = mode === 'radar', fmt = v => fmtNum(v, D.unit, lang), aggL = radar ? D.valName : `${T('cs_aggs')[D.agg]} · ${D.valName}`, legCap = D.legend.length && D.legend[0] && D.items.length && D.items.some(it => it.lg !== it.g) ? D.xName : (D.grpName || T('gal_legend'));
  const sideHtml = `${D.legend.length > 1 ? `<div class="orgblk"><div class="orgcap">${esc(legCap)}</div><div class="orgleg" id="orgleg"></div><button class="orgall" id="orgall">${T('org_all')}</button></div>` : ''}
    <div class="orgblk"><div class="orgcap">${T(radar ? 'gal2_rank_r' : 'gal2_rank')}</div><div class="orgrank" id="orgrank"></div></div><p class="orgfoot">${T('gal2_base_' + mode)}</p>`;
  let eng = null, S = null; const stats = () => S || (S = eng.stats());
  const val = it => (radar ? it.txt : fmt(it.v));
  const model = id => {
    const it = D.items[id], s = stats(), rk = s.rank.get(id), left = [];
    if (D.grpName) left.push([D.grpName, D.series[it.g].label]); left.push([D.xName, it.label]);
    if (rk) left.push([T('gal_pos'), T('gal_of', rk, fmtInt(s.n, lang))]);
    if (radar) { left.push([T('gal2_index'), `${csPct(it.nv, lang)} ${T('gal2_of_max')}`], [T('gal2_how'), it.how]); }
    else { const ser = D.items.filter(o => o.g === it.g), prev = ser.find(o => o.x === it.x - 1); if (prev && prev.v) left.push([T('gal2_vsprev'), fmtPct((it.v / prev.v - 1) * 100, lang)]); const mean = ser.reduce((a, o) => a + o.v, 0) / ser.length; if (mean && D.agg !== 'count') left.push([T('gal_vsavg'), fmtPct((it.v / mean - 1) * 100, lang)]); }
    if (it.n > 1) left.push([T('rays_rows'), fmtInt(it.n, lang)]);
    return { key: 'g' + id, kick: D.grpName ? D.series[it.g].label : D.xName, kickColor: orgCatColor(eng.th, it.c), title: it.label, value: val(it), vlabel: radar ? D.xs[it.x] : aggL, left, texts: [], note: '' };
  };
  const overview = () => {
    const s = stats(), byV = s.ids.map(i => D.items[i]), top = byV[0], low = byV[byV.length - 1], left = [[D.xName, fmtInt(D.xs.length, lang)]];
    if (D.grpName) left.push([D.grpName, fmtInt(D.series.length, lang)]);
    if (top) left.push([T('rays_ov_max'), `${radar ? D.series[top.g].label + ' · ' : ''}${top.label} · ${val(top)}`]); if (low && low !== top) left.push([T('rays_ov_min'), `${radar ? D.series[low.g].label + ' · ' : ''}${low.label} · ${val(low)}`]);
    return { key: 'ov', kick: T('card_overview'), title: D.xName, value: radar ? fmtInt(D.series.length, lang) : fmt(D.agg === 'mean' ? s.mean : s.total), vlabel: radar ? D.grpName : aggL, left, texts: [], hint: T('rays_ov_hint') };
  };
  const h = {
    model, overview,
    listItems() { const sig = JSON.stringify([...eng.st.hidden].sort()), items = eng.N.filter(n => n.vis).map(n => ({ id: n.i, title: radar ? `${D.series[n.it.g].label} · ${n.it.label}` : n.it.label, sub: D.grpName && !radar ? D.series[n.it.g].label : '', color: orgCatColor(eng.th, n.it.c), val: val(n.it), v: galKey(n.it), ord: n.i, s: () => n.it.label + ' ' + D.series[n.it.g].label })); return { sig, items, sorts: ['v', 'n', 'o'], sort: 'v' }; },
    visible: id => eng.N[id].vis,
    side(side0) {
      S = null; const s = stats(), st = eng.st, $ = q => side0.querySelector(q), leg = $('#orgleg');
      if (leg) leg.innerHTML = D.legend.map((g, i) => `<button class="orgc" data-c="${i}" data-n="${g.n}" aria-pressed="${!st.hidden.has(i)}" style="--c:${orgCatColor(eng.th, g.c)}"><i></i><span>${esc(g.label)}</span></button>`).join('');
      const top = s.ids.slice(0, 10).map(i => { const it = D.items[i]; return { id: i, v: galKey(it), label: `${radar || D.grpName ? D.series[it.g].label + ' · ' : ''}${it.label}`, txt: radar ? `${it.txt}` : fmt(it.v), c: orgCatColor(eng.th, it.c) }; }), mx = Math.max(1e-9, ...top.map(x => Math.abs(x.v)));
      $('#orgrank').innerHTML = top.map(x => `<div class="orgr" data-e="${x.id}"><div class="orgrb"><div class="orgrs" style="width:${Math.max(3, Math.abs(x.v) / mx * 100)}%"><i style="flex:1;background:${x.c}"></i></div></div><span>${esc(x.label)}</span><b>${esc(x.txt)}</b></div>`).join('');
    },
    syncSide() {},
    bindSide(side0, c) {
      const { eng: e, refresh, ctip } = c, nL = D.legend.length;
      side0.addEventListener('click', ev => {
        const b = ev.target.closest('.orgc'), a = ev.target.closest('#orgall');
        if (b) { const i = +b.dataset.c, hid = new Set(e.st.hidden); if (hid.size === 0) { for (let k = 0; k < nL; k++) if (k !== i) hid.add(k); } else if (hid.has(i)) hid.delete(i); else hid.add(i); if (hid.size >= nL) hid.clear(); e.patch({ hidden: [...hid] }); refresh(); }
        else if (a) { e.patch({ hidden: [] }); refresh(); }
      });
      side0.addEventListener('mouseover', ev => { const b = ev.target.closest('.orgc'), r = ev.target.closest('.orgr[data-e]'); e.hovLg = b ? +b.dataset.c : -1; e.kick(); if (r && /^\d+$/.test(r.dataset.e)) c.hover(+r.dataset.e); if (b) { const rc = b.getBoundingClientRect(); ctip.textContent = `${fmtInt(+b.dataset.n, lang)} ${T('org_rows')}`; ctip.hidden = false; ctip.style.left = Math.round(rc.left + 6) + 'px'; ctip.style.top = Math.round(rc.top - 26) + 'px'; } });
      side0.addEventListener('mouseout', ev => { if (ev.target.closest('.orgc')) { e.hovLg = -1; e.kick(); ctip.hidden = true; } if (ev.target.closest('.orgr[data-e]')) c.hover(null); });
    },
    tour({ stage, piece }) { const sr = stage.getBoundingClientRect(), box = { x: sr.left + 12, y: sr.top + 12, w: Math.max(80, sr.width - 24), h: Math.max(80, sr.height - 24) }, c2 = piece && piece.querySelector('#pc2'), cardBox = c2 ? csPad(csBox(c2.getBoundingClientRect()), 6) : box; return [{ k: 1, t: box }, { k: 2, t: cardBox, demo: stats().ids[0] }]; },
  };
  eng = new GalEngine(D, orgTheme(P), { rm: RM });
  return csMount(P, el, { id: mode, sideHtml, tutPrefix: 'tut_gal_', tutKey: 'dv-gal-tutorial' }, () => eng, h);
}
function gal2Steps(mode, P) {
  const D = csBuilt(P, mode), out = []; if (!D) return out;
  if (mode === 'radar') { D.series.slice(0, 3).forEach((s, g) => out.push({ id: 'g' + g, caption: `${s.label} · ${D.axes.length} ${T('gal2_axes')}`, state: { cs: { hidden: D.series.map((_, k) => k).filter(k => k !== g) } } })); return out; }
  const top = D.items.map((it, i) => [it, i]).sort((a, b) => b[0].v - a[0].v)[0]; if (top) out.push({ id: 'spot', caption: `${D.grpName ? D.series[top[0].g].label + ' · ' : ''}${top[0].label} · ${fmtNum(top[0].v, D.unit, LANG)}`, state: { cs: { spot: top[1] } } });
  if (D.series.length > 1 && mode !== 'cols') D.series.slice(0, 3).forEach((s, g) => out.push({ id: 'g' + g, caption: `${s.label} · ${fmtNum(s.v, D.unit, LANG)}`, state: { cs: { hidden: D.series.map((_, k) => k).filter(k => k !== g) } } }));
  return out;
}
function gal2Insights(D, briefing, lang, T) {
  if (D.mode === 'radar') return [];
  const tot = D.series.map(s => ({ label: s.label, value: s.v, rows: s.n })).filter(t => t.value > 0).sort((a, b) => b.value - a.value);
  if (D.mode === 'lines' && D.series.length === 1 || D.mode === 'radial' && D.series.length === 1) return [];
  if (tot.length < 2) return [];
  const pseudo = { kind: 'category', names: { x: D.grpName || D.xName, y: D.valName }, unit: D.unit, aggKind: D.agg, totX: tot, totS: null, xIsTime: false, stats: {} };
  return computeInsights(pseudo, briefing, lang, T);
}
function gal2Note(mode, P) {
  const D = csBuilt(P, mode); if (!D) return ''; const how = T('cs_aggs')[D.agg].toLowerCase();
  if (mode === 'radar') return T('gal2_note_radar', D.series.length, D.grpName, D.axes.length);
  return T('gal2_note_' + mode, how, D.valName, D.xName, D.grpName || '', D.series.length) + (D.groupTotal > D.series.length ? ' ' + T('gal2_top', D.series.length, D.groupTotal) : '');
}
[
  { id: 'cols', fields: [{ k: 'x', label: 'gal2_x', role: 'period' }, { k: 'grp', label: 'gal2_pan', role: 'dim', none: 'mp_none' }, { k: 'val', label: 'gal_val_b', role: 'measure', none: 'org_rowsopt' }, { k: 'agg', role: 'agg' }] },
  { id: 'lines', fields: [{ k: 'x', label: 'gal2_xt', role: 'date' }, { k: 'grp', label: 'gal2_pan', role: 'dim', none: 'mp_none' }, { k: 'val', label: 'gal_val_b', role: 'measure', none: 'org_rowsopt' }, { k: 'agg', role: 'agg' }] },
  { id: 'radial', fields: [{ k: 'x', label: 'gal2_xr', role: 'period' }, { k: 'grp', label: 'gal2_ser', role: 'dim', none: 'mp_none' }, { k: 'val', label: 'gal_val_b', role: 'measure', none: 'org_rowsopt' }, { k: 'agg', role: 'agg' }] },
  { id: 'radar', fields: [{ k: 'grp', label: 'gal2_poly', role: 'dim' }, ...[1, 2, 3, 4, 5, 6].map(k => ({ k: 'm' + k, label: 'gal2_axis' + k, role: 'measure', none: 'mp_none' }))] },
].forEach(d => regChart({
  id: d.id, suggest: cols => gal2Suggest(d.id, cols), build: (ds, m, opts) => gal2Build(ds, m, opts, d.id), fit: (b, br) => gal2Fit(d.id, b, br), render: (P, el) => gal2Render(d.id, P, el), steps: P => gal2Steps(d.id, P),
  drawStatic: (P, ctx, x, y, w, h, st) => galDrawStatic(d.id, P, ctx, x, y, w, h, st), insights: gal2Insights, note: P => gal2Note(d.id, P), fields: d.fields,
  names: b => (d.id === 'radar' ? { grp: b.grpName } : { x: b.xName, grp: b.grpName, val: ['Linhas', 'Rows'].includes(b.valName) ? null : b.valName }),
  summary: b => T('gal2_sum', fmtInt(b.items.length, LANG), b.series.length),
}));
