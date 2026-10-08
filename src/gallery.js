/* Datavix: galeria de gráficos de canvas (parte do todo). Pizza, rosca, várias pizzas, várias roscas e bolhas agrupadas.
 * Um motor só (GalEngine) cuida de animação, mouse, estados e quadro estático; cada gráfico entrega os dados e a geometria.
 * Os números vêm sempre da planilha (soma ou contagem; as bolhas aceitam média). Valores negativos ficam de fora das fatias e são avisados. */
const GAL_SLICES = 7, GAL_SLICES_MULTI = 6, GAL_PANELS = 12, GAL_BUBBLES = 80, GAL_GROW_S = 1.5;
const GAL_ID_HINT = /id|c[oó]digo|code|cod\b|n[uú]mero|num\b/i;
const GAL_XY = new Set(['cols', 'lines', 'radial', 'radar', 'box', 'words', 'bubmap', 'isomap']); // colunas, linhas, linha radial e radar: motor em gallery2.js

/* ---------------- dados ---------------- */
const galIsAvg = c => c && (c.unit === '%' || RAYS_AVG_HINT.test(c.name));
function galDimCols(cols, lo, hi, maxLen = 30) { return cols.map((c, i) => i).filter(i => isDim(cols[i]) && cols[i].codes && cols[i].role !== 'id' && distinctOf(cols[i]) >= lo && distinctOf(cols[i]) <= hi && csAvgLen(cols[i]) <= maxLen); }
function galValue(cols) { const v = bestMeasure(cols); if (v < 0 || galIsAvg(cols[v])) return { val: -1, agg: 'count' }; return { val: v, agg: 'sum' }; }
function galSuggestPie(cols) {
  const c = galDimCols(cols, 2, 8).filter(i => cols[i].role !== 'flag' || galDimCols(cols, 3, 8).length === 0).sort((a, b) => Math.abs(distinctOf(cols[a]) - 5) - Math.abs(distinctOf(cols[b]) - 5))[0];
  if (c === undefined) return null; const { val, agg } = galValue(cols); return { cat: c, val, agg };
}
function galSuggestPies(cols) {
  const cat = galDimCols(cols, 2, 8).filter(i => cols[i].role !== 'flag').sort((a, b) => Math.abs(distinctOf(cols[a]) - 4) - Math.abs(distinctOf(cols[b]) - 4)), pairs = [];
  for (const c of cat) for (const g of galDimCols(cols, 2, GAL_PANELS)) if (g !== c) pairs.push([c, g]);
  if (!pairs.length) return null; pairs.sort((a, b) => Math.abs(distinctOf(cols[a[1]]) - 6) - Math.abs(distinctOf(cols[b[1]]) - 6));
  const { val, agg } = galValue(cols); return { cat: pairs[0][0], grp: pairs[0][1], val, agg };
}
function galSuggestPacked(cols) {
  const r = raysSuggest(cols); if (!r) return null;
  const ec = cols[r.entity]; if (csDistinct(ec) < 10) return null;
  return { entity: r.entity, val: r.value, grp: r.group, agg: r.agg };
}
// acumula valor e linhas por chave
function galAcc(ds, keyFn, vc, policy) {
  const n = ds.rowCount, acc = new Map(); let used = 0, neg = 0;
  for (let i = 0; i < n; i++) {
    const k = keyFn(i); if (k === null || k === undefined || k === '') continue;
    let v = vc ? vc.data[i] : 1; if (Number.isNaN(v)) { if (policy === 'zero') v = 0; else continue; }
    let a = acc.get(k); if (!a) { a = { k, sum: 0, n: 0, best: -1, bv: -1 }; acc.set(k, a); }
    a.sum += v; a.n++; used++; if (Math.abs(v) > a.bv) { a.bv = Math.abs(v); a.best = i; }
  }
  return { acc, used };
}
function galBuild(ds, m, opts, mode) {
  if (!m) return null;
  const cols = ds.columns, lang = opts.lang || 'pt', policy = opts.nullPolicy || 'ignore', multi = mode === 'pies' || mode === 'donuts', packed = mode === 'packed';
  const ci = packed ? m.entity : m.cat, cc = ci >= 0 ? cols[ci] : null, vc = m.val >= 0 ? cols[m.val] : null, gc = m.grp >= 0 && cols[m.grp] && cols[m.grp].codes ? cols[m.grp] : null;
  if (!cc || (vc && !isMeasure(vc))) return null; if (multi && !gc) return null;
  if (packed ? !csIsEntCol(cc) : !(cc.codes && isDim(cc))) return null;
  const agg = vc ? (m.agg || 'sum') : 'count', lab = packed ? csLabeler(cc) : i => { const k = cc.codes[i]; return k < 0 ? '' : String(cc.dict[k]); };
  const OTH = lang === 'en' ? 'Others' : 'Outros', fin = a => (agg === 'mean' ? (a.n ? a.sum / a.n : 0) : agg === 'count' ? a.n : a.sum);
  const base = { mode, catName: cc.name, valName: vc ? vc.name : (lang === 'en' ? 'Rows' : 'Linhas'), grpName: gc ? gc.name : null, unit: vc ? vc.unit : null, agg, rowsTotal: ds.rowCount, rowsUsed: 0, dropped: 0, other: -1 };
  // 1) pizza e rosca: uma fatia por categoria
  if (!multi && !packed) {
    const { acc, used } = galAcc(ds, lab, vc, policy); let all = [...acc.values()].map(a => ({ label: a.k, v: fin(a), n: a.n }));
    base.dropped = all.filter(x => x.v <= 0).length; all = all.filter(x => x.v > 0).sort((a, b) => b.v - a.v); if (all.length < 2) return null;
    let kept = all.slice(0, GAL_SLICES); const rest = all.slice(GAL_SLICES);
    if (rest.length) { kept.push({ label: OTH, v: rest.reduce((s, x) => s + x.v, 0), n: rest.reduce((s, x) => s + x.n, 0), oth: true }); base.other = kept.length - 1; }
    const total = kept.reduce((s, x) => s + x.v, 0);
    base.items = kept.map((x, i) => ({ ...x, c: x.oth ? -1 : i, lg: i, g: -1, share: x.v / total * 100 })); base.legend = base.items.map(x => ({ label: x.label, c: x.c, n: x.n })); base.total = total; base.rowsUsed = used; base.catTotal = all.length;
    return base;
  }
  // 2) várias pizzas e roscas: categorias globais (as maiores) em cada painel de um grupo
  if (multi) {
    const { acc: ta, used } = galAcc(ds, lab, vc, policy); const gl = all => all.filter(x => x.v > 0).sort((a, b) => b.v - a.v);
    const cats = gl([...ta.values()].map(a => ({ label: a.k, v: fin(a), n: a.n }))); if (cats.length < 2) return null;
    const top = cats.slice(0, GAL_SLICES_MULTI).map(x => x.label), topIdx = new Map(top.map((l, i) => [l, i])), hasOth = cats.length > GAL_SLICES_MULTI;
    const key = i => { const c = lab(i), g = gc.codes[i]; return c && g >= 0 ? g + '\u0001' + c : null; };
    const { acc } = galAcc(ds, key, vc, policy);
    const per = new Map(); acc.forEach(a => { const [g, c] = a.k.split('\u0001'), gi = +g; let p = per.get(gi); if (!p) { p = { g: gi, cells: new Array(top.length + (hasOth ? 1 : 0)).fill(0), cn: new Array(top.length + (hasOth ? 1 : 0)).fill(0), n: 0 }; per.set(gi, p); }
      const k = topIdx.has(c) ? topIdx.get(c) : (hasOth ? top.length : -1); if (k < 0) return; const v = fin(a); if (v > 0) { p.cells[k] += agg === 'mean' ? v : v; p.cn[k] += a.n; p.n += a.n; } });
    const panels = [...per.values()].filter(p => p.cells.some(v => v > 0)).map(p => ({ ...p, v: p.cells.reduce((s, x) => s + x, 0) })).sort((a, b) => b.v - a.v);
    if (panels.length < 2) return null; base.groupTotal = panels.length; const shown = panels.slice(0, GAL_PANELS);
    const names = top.concat(hasOth ? [OTH] : []); base.legend = names.map((l, i) => ({ label: l, c: hasOth && i === top.length ? -1 : i, n: cats[i] ? cats[i].n : 0 }));
    base.items = []; base.panels = [];
    shown.forEach((p, pi) => { const idxs = []; names.forEach((l, k) => { if (!(p.cells[k] > 0)) return; idxs.push(base.items.length); base.items.push({ label: l, v: p.cells[k], n: p.cn[k], c: base.legend[k].c, lg: k, g: pi, share: p.cells[k] / p.v * 100, oth: hasOth && k === top.length }); }); base.panels.push({ label: gc.dict[p.g], v: p.v, n: p.n, items: idxs }); });
    base.total = shown.reduce((s, p) => s + p.v, 0); base.rowsUsed = used; base.other = hasOth ? top.length : -1; base.catTotal = cats.length;
    return base;
  }
  // 3) bolhas agrupadas: uma bolha por entidade (as maiores), cor pelo grupo dominante
  const { acc, used } = galAcc(ds, lab, vc, policy), ge = new Map();
  if (gc) for (let i = 0; i < ds.rowCount; i++) { const l = lab(i), g = gc.codes[i]; if (!l || g < 0) continue; let mm = ge.get(l); if (!mm) { mm = new Map(); ge.set(l, mm); } mm.set(g, (mm.get(g) || 0) + 1); }
  let all = [...acc.values()].map(a => ({ label: a.k, v: fin(a), n: a.n })); base.dropped = all.filter(x => !(x.v > 0)).length; all = all.filter(x => x.v > 0).sort((a, b) => b.v - a.v); if (all.length < 5) return null;
  const kept = all.slice(0, GAL_BUBBLES), tot = new Map();
  if (gc) kept.forEach(x => { let bg = -1, bc = 0; ge.get(x.label).forEach((c, g) => { if (c > bc) { bc = c; bg = g; } }); x.gc = bg; tot.set(bg, (tot.get(bg) || 0) + x.v); });
  const ord = [...tot].sort((a, b) => b[1] - a[1]).map(x => x[0]).filter(g => g >= 0), keepG = ord.slice(0, 11), gi = new Map(keepG.map((g, i) => [g, i])), hasOth = ord.length > 11;
  base.legend = gc ? keepG.map((g, i) => ({ label: gc.dict[g], c: i, n: 0 })).concat(hasOth ? [{ label: OTH, c: 11, n: 0 }] : []) : [];
  base.items = kept.map(x => { const k = !gc ? -1 : gi.has(x.gc) ? gi.get(x.gc) : (x.gc >= 0 && hasOth ? 11 : -1); if (k >= 0) base.legend[k].n++; return { label: x.label, v: x.v, n: x.n, c: k, lg: k, g: -1, share: 0 }; });
  const total = base.items.reduce((s, x) => s + x.v, 0); base.items.forEach(x => { x.share = x.v / total * 100; }); base.total = total; base.rowsUsed = used; base.catTotal = all.length;
  return base;
}
const galFit = (mode, built, briefing) => {
  const D = csBuilt({ built }, mode); if (!D) return 0; const comp = briefing && briefing.story === 'composition', n = D.items.length;
  if (mode === 'pie' || mode === 'donut') return comp && n >= 3 && n <= 6 ? (mode === 'donut' ? 0.93 : 0.91) : n >= 3 && n <= 6 ? 0.55 : 0.4;
  if (mode === 'pies' || mode === 'donuts') return comp && D.panels && D.panels.length >= 2 && D.panels.length <= 9 ? 0.45 : 0.4;
  return D.catTotal >= 15 ? 0.5 : 0.35;
};

/* ---------------- motor ---------------- */
const galKey = it => (it.nv !== undefined ? it.nv : it.v); // radar compara pelo índice normalizado
const galTrunc = (s, k = 22) => (s.length > k ? s.slice(0, k - 1).trimEnd() + '…' : s);
// espaço da peça em círculos tangentes: a ordem vai do maior para o menor (caminho simples, mais que suficiente para 80 bolhas)
function galPack(rs) {
  const P = [], g = 1.5;
  rs.forEach((r, i) => {
    if (i === 0) { P.push({ x: 0, y: 0 }); return; } if (i === 1) { P.push({ x: rs[0] + r + g, y: 0 }); return; }
    let best = null, bd = Infinity;
    for (let a = 0; a < i; a++) for (let b = a + 1; b < i; b++) {
      const A = P[a], B = P[b], ra = rs[a] + r + g, rb = rs[b] + r + g, dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
      if (!d || d > ra + rb || d < Math.abs(ra - rb)) continue;
      const k = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - k * k)), mx = A.x + k * dx / d, my = A.y + k * dy / d;
      for (const s of [1, -1]) {
        const x = mx - s * h * dy / d, y = my + s * h * dx / d; let ok = true;
        for (let c = 0; c < i; c++) if (Math.hypot(P[c].x - x, P[c].y - y) < rs[c] + r + g - 0.01) { ok = false; break; }
        if (ok) { const dist = Math.hypot(x, y); if (dist < bd) { bd = dist; best = { x, y }; } }
      }
    }
    P.push(best || { x: P[i - 1].x + rs[i - 1] + r + g, y: 0 });
  });
  return P;
}
class GalEngine {
  constructor(D, th, opt = {}) {
    this.D = D; this.th = th; this.rm = !!opt.rm; this.st = { hidden: new Set(), spot: null };
    this.hoverId = null; this.hovLg = -1; this.w = 800; this.h = 600; this.dpr = 1; this.grow = 0; this.moving = true; this.dirty = true;
    const rnd = orgRand(13); this.N = D.items.map((it, i) => ({ i, it, vis: false, g: { cx: 0, cy: 0, r0: 0, r1: 0, a0: -Math.PI / 2, a1: -Math.PI / 2, x: 0, y: 0, r: 0, w: 0, h: 0, m1: 0, m2: 0, m3: 0, m4: 0 }, t: null, al: 0, tal: 0, dm: 1, rt: 0.8 + rnd() * 0.5, gd: i / Math.max(1, D.items.length), lab: null }));
    this.titles = []; this.center = null; this.layout(); this.snapPos();
  }
  setState(p) { const q = p || {}; this.st.hidden = new Set(q.hidden || []); this.spot = q.spot !== undefined ? q.spot : null; this.layout(); this.kick(); }
  patch(p) { if (p.hidden !== undefined) this.st.hidden = new Set(p.hidden || []); if (p.spot !== undefined) this.spot = p.spot; this.layout(); this.kick(); }
  getState() { return { hidden: [...this.st.hidden], spot: this.spot === undefined ? null : this.spot }; }
  setHover(id) { if (this.hoverId === id) return; this.hoverId = id; this.kick(); }
  resize(w, h, dpr) { this.w = w; this.h = h; this.dpr = dpr || 1; this.layout(); this.snapPos(); this.kick(); }
  snapPos() { for (const n of this.N) { Object.assign(n.g, n.t); n.al = n.tal; } }
  snap() { this.snapPos(); this.grow = 1; this.updateDim(0, true); this.moving = false; this.dirty = true; }
  /* ---------- geometria ---------- */
  layout() {
    const { D, N } = this, W = this.w, H = this.h, mode = D.mode, hid = this.st.hidden; this.titles = []; this.center = null; this.R = 0;
    const vis = n => !hid.has(n.it.lg);
    N.forEach(n => { n.vis = vis(n); });
    if (GAL_XY.has(mode)) { this.layoutXY(); this.kick(); return; }
    if (mode === 'pie' || mode === 'donut') {
      const R = Math.max(50, Math.min(W * 0.5 - 120, H * 0.5 - 38)), cx = W / 2, cy = H / 2, r0 = mode === 'donut' ? R * 0.58 : 0, tot = N.filter(n => n.vis).reduce((s, n) => s + n.it.v, 0) || 1; let a = -Math.PI / 2;
      this.R = R; this.cx = cx; this.cy = cy;
      N.forEach(n => { const w = n.vis ? n.it.v / tot * Math.PI * 2 : 0; n.t = { cx, cy, r0, r1: R, a0: a, a1: a + w, x: 0, y: 0, r: 0 }; n.tal = n.vis ? 1 : 0; n.share = n.vis ? n.it.v / tot * 100 : 0; if (n.vis) a += w; });
      this.center = mode === 'donut' ? { v: tot } : null;
    } else if (mode === 'pies' || mode === 'donuts') {
      const P = D.panels, k = P.length; let best = { r: 0, cols: 1 };
      for (let cols = 1; cols <= k; cols++) { const rows = Math.ceil(k / cols), r = Math.min(W / cols / 2 - 10, (H / rows - 44) / 2 - 6); if (r > best.r) best = { r, cols }; }
      const cols = best.cols, rows = Math.ceil(k / cols), R = Math.max(24, best.r), cw = W / cols, ch = H / rows; this.R = R;
      P.forEach((p, pi) => {
        const c = pi % cols, rw = Math.floor(pi / cols), cx = cw * (c + 0.5), cy = ch * rw + 40 + (ch - 40) / 2, r0 = mode === 'donuts' ? R * 0.56 : 0, mem = p.items.map(i => N[i]), tot = mem.filter(n => n.vis).reduce((s, n) => s + n.it.v, 0) || 1; let a = -Math.PI / 2;
        mem.forEach(n => { const w = n.vis ? n.it.v / tot * Math.PI * 2 : 0; n.t = { cx, cy, r0, r1: R, a0: a, a1: a + w, x: 0, y: 0, r: 0 }; n.tal = n.vis ? 1 : 0; n.share = n.vis ? n.it.v / tot * 100 : 0; if (n.vis) a += w; });
        this.titles.push({ label: p.label, x: cx, y: cy - R - 14, total: tot, cx, cy, R, p });
      });
    } else { // bolhas agrupadas
      const list = N.filter(n => n.vis), rs = list.map(n => Math.sqrt(Math.max(n.it.v, 1e-12)));
      const pos = galPack(rs.map(r => r)), mgn = 18; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      pos.forEach((p, i) => { x0 = Math.min(x0, p.x - rs[i]); x1 = Math.max(x1, p.x + rs[i]); y0 = Math.min(y0, p.y - rs[i]); y1 = Math.max(y1, p.y + rs[i]); });
      const sc = list.length ? Math.min((W - 2 * mgn) / (x1 - x0), (H - 2 * mgn) / (y1 - y0)) : 1, ox = W / 2 - (x0 + x1) / 2 * sc, oy = H / 2 - (y0 + y1) / 2 * sc;
      N.forEach(n => { n.t = { cx: 0, cy: 0, r0: 0, r1: 0, a0: 0, a1: 0, x: n.t ? n.t.x : W / 2, y: n.t ? n.t.y : H / 2, r: 0 }; n.tal = 0; });
      list.forEach((n, k) => { n.t = { cx: 0, cy: 0, r0: 0, r1: 0, a0: 0, a1: 0, x: ox + pos[k].x * sc, y: oy + pos[k].y * sc, r: rs[k] * sc }; n.tal = 1; });
      N.filter(n => !n.vis).forEach(n => { n.t.r = 0; });
    }
    this.kick();
  }
  updateDim(dt, snap) {
    const hv = this.hoverId !== null ? this.N[this.hoverId] : null, kd = snap || this.rm ? 1 : 1 - Math.exp(-dt * 11), sp = this.spot !== null && this.spot !== undefined ? this.N[this.spot] : null; let mv = false;
    for (const n of this.N) {
      let t = 1;
      if (hv && GAL_XY.has(this.D.mode)) t = this.D.mode === 'cols' ? (n === hv ? 1 : n.it.lg === hv.it.lg ? 0.85 : 0.35) : (n.it.g === hv.it.g ? 1 : 0.2);
      else if (hv) t = n === hv ? 1 : (n.it.lg === hv.it.lg && this.D.mode !== 'packed' ? 0.7 : 0.28);
      else if (this.hovLg >= 0) t = n.it.lg === this.hovLg ? 1 : 0.2;
      else if (sp) t = n === sp ? 1 : 0.25;
      const d = t - n.dm; if (Math.abs(d) > 0.004) { n.dm += d * kd; mv = true; } else n.dm = t;
    }
    return mv;
  }
  /* ---------- animação ---------- */
  kick() { this.dirty = true; this.start(); }
  start() {
    if (this._run) return; this._run = true; let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
      this.step_(dt); this.render(); if (this.onFrame) this.onFrame();
      if (this.moving || this.dirty) { this.dirty = false; this._h = document.hidden ? setTimeout(() => loop(performance.now()), 60) : requestAnimationFrame(loop); } else this._run = false;
    };
    this._h = document.hidden ? setTimeout(() => loop(performance.now()), 60) : requestAnimationFrame(loop);
  }
  stop() { this._run = false; cancelAnimationFrame(this._h); clearTimeout(this._h); }
  step_(dt) {
    this.grow = this.rm ? 1 : Math.min(1, this.grow + dt / GAL_GROW_S); let mv = this.grow < 1; const e1 = 1 - Math.exp(-dt * 6);
    for (const n of this.N) {
      const k = this.rm ? 1 : Math.min(1, e1 * n.rt), g = n.g, t = n.t;
      for (const key of ['cx', 'cy', 'r0', 'r1', 'a0', 'a1', 'x', 'y', 'r', 'w', 'h', 'm1', 'm2', 'm3', 'm4']) { const d = t[key] - g[key], eps = key[0] === 'a' ? 2e-4 : 0.05; if (Math.abs(d) > eps) { g[key] += d * k; mv = true; } else g[key] = t[key]; }
      const d = n.tal - n.al; if (Math.abs(d) > 0.004) { n.al += d * k; mv = true; } else n.al = n.tal;
    }
    if (this.updateDim(dt, false)) mv = true; this.moving = mv;
  }
  /* ---------- desenho ---------- */
  col(c) { return c < 0 ? mixHex(this.th.fg, this.th.base, 0.4) : orgCatColor(this.th, c); }
  prog(n) { return orgEase(orgClamp((this.grow - n.gd * 0.45) / 0.55)); }
  render() { if (this.ctx) { const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.draw(c); } }
  draw(ctx, opt) {
    if (GAL_XY.has(this.D.mode)) return this.drawXY(ctx, opt);
    const { th, N, D } = this, fg = th.fg, base = th.base; if (!opt || opt.clear !== false) ctx.clearRect(0, 0, this.w, this.h);
    const [br, bg2, bb] = hexToRgb(base); this.light = br + bg2 + bb > 450; const fr = orgStage(this.grow, 0, 0.25), hv = this.hoverId !== null ? N[this.hoverId] : null;
    if (br + bg2 + bb < 330) { if (!this.stars) { const sr = orgRand(31); this.stars = Array.from({ length: 60 }, () => [sr(), sr(), 0.5 + sr() * 1.1, 0.12 + sr() * 0.35]); } ctx.fillStyle = rgba(fg, 1); for (const s of this.stars) { ctx.globalAlpha = s[3] * fr; ctx.beginPath(); ctx.arc(s[0] * this.w, s[1] * this.h, s[2], 0, ORG_TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    const order = N.slice().sort((a, b) => (a === hv) - (b === hv));
    if (D.mode === 'packed') { for (const n of order) if (n.al > 0.02 && n.g.r > 0.5) this.drawBubble(ctx, n, n === hv); this.drawBubbleLabels(ctx, hv); return; }
    ctx.lineJoin = 'round';
    for (const n of order) {
      if (n.al < 0.02) continue; const p = this.prog(n), g = n.g, a1 = g.a0 + (g.a1 - g.a0) * p; if (a1 - g.a0 < 1e-4) continue;
      const on = n === hv || (this.spot !== null && this.spot !== undefined && n.i === this.spot), al = n.al * n.dm, col = this.col(n.it.c), rr = on ? g.r1 + 5 : g.r1;
      ctx.beginPath(); if (g.r0 > 0) { ctx.arc(g.cx, g.cy, rr, g.a0, a1); ctx.arc(g.cx, g.cy, g.r0, a1, g.a0, true); } else { ctx.moveTo(g.cx, g.cy); ctx.arc(g.cx, g.cy, rr, g.a0, a1); } ctx.closePath();
      ctx.fillStyle = rgba(col, (this.light ? 0.9 : 0.86) * al); ctx.fill(); ctx.strokeStyle = rgba(base, 0.95 * al); ctx.lineWidth = 2; ctx.stroke();
      if (on) { ctx.strokeStyle = rgba(fg, 0.9 * al); ctx.lineWidth = 1.6; ctx.stroke(); }
    }
    this.drawLabels(ctx, hv, fr);
  }
  drawBubble(ctx, n, on) {
    const g = n.g, p = this.prog(n), r = g.r * p, al = n.al * n.dm, col = this.col(n.it.c); if (r < 0.4) return;
    ctx.beginPath(); ctx.arc(g.x, g.y, r, 0, ORG_TAU); const gr = ctx.createRadialGradient(g.x - r * 0.3, g.y - r * 0.35, r * 0.1, g.x, g.y, r); gr.addColorStop(0, rgba(mixHex(col, '#ffffff', this.light ? 0.1 : 0.28), 0.95 * al)); gr.addColorStop(1, rgba(col, 0.82 * al));
    ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = on ? rgba(this.th.fg, 0.95 * al) : rgba(this.th.base, 0.7 * al); ctx.lineWidth = on ? 2 : 1; ctx.stroke();
  }
  drawBubbleLabels(ctx, hv) {
    const th = this.th, fr = orgStage(this.grow, 0.5, 1); if (fr <= 0) return; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const n of this.N) {
      const r = n.g.r * this.prog(n), on = n === hv; if (n.al < 0.4 || (r < 20 && !on)) continue; const al = n.al * n.dm * fr, fs = orgClamp(r / 3.6, 9, 15), col = this.col(n.it.c), ink = readableOn(col);
      ctx.font = `${on ? 700 : 600} ${fs}px ${th.font}`; const lbl = galTrunc(n.it.label, Math.max(5, Math.floor(r * 2 / (fs * 0.56)))); ctx.fillStyle = rgba(ink, al); ctx.fillText(lbl, n.g.x, n.g.y - (r > 34 ? fs * 0.55 : 0));
      if (r > 34 || on) { ctx.font = `500 ${Math.max(9, fs - 1)}px ${th.font}`; ctx.fillStyle = rgba(ink, 0.85 * al); ctx.fillText(fmtNum(n.it.v, this.D.unit, LANG), n.g.x, n.g.y + (r > 34 ? fs * 0.65 : fs * 1.1)); }
    }
  }
  // rótulos fora da pizza (uma só), centro da rosca, títulos dos painéis e percentuais dentro das fatias grandes
  drawLabels(ctx, hv, fr) {
    const { th, D } = this, fg = th.fg; ctx.textBaseline = 'middle';
    if (D.mode === 'pie' || D.mode === 'donut') {
      const f = orgClamp(this.R / 14, 10.5, 14), items = this.N.filter(n => n.vis && n.al > 0.5 && n.share >= 2.5).map(n => { const g = n.g, m = (g.a0 + g.a1) / 2; return { n, m, side: Math.cos(m) >= 0 ? 1 : -1, y: this.cy + Math.sin(m) * (this.R + 16) }; });
      for (const side of [1, -1]) { const L = items.filter(o => o.side === side).sort((a, b) => a.y - b.y); for (let i = 1; i < L.length; i++) if (L[i].y - L[i - 1].y < f * 2.7) L[i].y = L[i - 1].y + f * 2.7; const over = L.length ? L[L.length - 1].y - (this.h - 16) : 0; if (over > 0) L.forEach(o => { o.y -= over; }); }
      ctx.font = `600 ${f}px ${th.font}`;
      items.forEach(o => {
        const n = o.n, g = n.g, al = n.al * n.dm * orgStage(this.grow, 0.55, 1), a = o.m, x0 = this.cx + Math.cos(a) * this.R, y0 = this.cy + Math.sin(a) * this.R, x1 = this.cx + Math.cos(a) * (this.R + 10), x2 = this.cx + o.side * (this.R + 18);
        ctx.strokeStyle = rgba(this.col(n.it.c), 0.7 * al); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, this.cy + Math.sin(a) * (this.R + 10)); ctx.lineTo(x2, o.y); ctx.stroke();
        ctx.textAlign = o.side > 0 ? 'left' : 'right'; const tx = x2 + o.side * 5, on = n === hv; ctx.font = `${on ? 700 : 600} ${f}px ${th.font}`; ctx.fillStyle = rgba(fg, (on ? 1 : 0.92) * al); ctx.fillText(galTrunc(n.it.label, 20), tx, o.y - f * 0.55);
        ctx.font = `500 ${f - 1}px ${th.font}`; ctx.fillStyle = rgba(fg, 0.7 * al); ctx.fillText(`${csPct(n.share, LANG)} · ${fmtNum(n.it.v, D.unit, LANG)}`, tx, o.y + f * 0.7);
      });
      if (this.center && this.R > 60) { const al = orgStage(this.grow, 0.5, 1); ctx.textAlign = 'center'; ctx.fillStyle = rgba(fg, al); ctx.font = `700 ${orgClamp(this.R * 0.17, 14, 30)}px Doto, 'Geist Mono', monospace`; ctx.fillText(fmtNum(this.center.v, D.unit, LANG), this.cx, this.cy - 4); ctx.font = `500 ${orgClamp(this.R * 0.07, 9, 12)}px ${th.font}`; ctx.fillStyle = rgba(fg, 0.6 * al); ctx.fillText(galTrunc(`${T('cs_aggs')[D.agg]} · ${D.valName}`, 30), this.cx, this.cy + orgClamp(this.R * 0.13, 12, 22)); }
      return;
    }
    // vários painéis
    ctx.textAlign = 'center'; const al0 = orgStage(this.grow, 0.3, 0.9), f = orgClamp(this.R / 5, 10, 14);
    for (const t of this.titles) {
      ctx.font = `600 ${f}px ${th.font}`; ctx.fillStyle = rgba(fg, 0.92 * al0); ctx.fillText(galTrunc(t.label, 24), t.x, t.y - f * 0.9); ctx.font = `500 ${f - 2}px ${th.font}`; ctx.fillStyle = rgba(fg, 0.55 * al0); ctx.fillText(fmtNum(t.total, D.unit, LANG), t.x, t.y + 1);
      if (D.mode === 'donuts' && this.R > 40) { /* o total fica no título; o miolo respira */ }
    }
    if (this.R >= 44) for (const n of this.N) { if (!n.vis || n.al < 0.5 || n.share < 12) continue; const g = n.g, m = (g.a0 + g.a1) / 2, rr = g.r0 > 0 ? (g.r0 + g.r1) / 2 : g.r1 * 0.62, al = n.al * n.dm * orgStage(this.grow, 0.6, 1); const col = this.col(n.it.c); ctx.font = `700 ${orgClamp(this.R / 5.5, 9, 13)}px ${th.font}`; ctx.fillStyle = rgba(readableOn(col), al); ctx.fillText(csPct(n.share, LANG), g.cx + Math.cos(m) * rr, g.cy + Math.sin(m) * rr); }
  }
  /* ---------- seleção com o mouse ---------- */
  pick(mx, my) {
    if (GAL_XY.has(this.D.mode)) return this.pickXY(mx, my);
    let best = null;
    for (const n of this.N) {
      if (n.al < 0.4) continue; const g = n.g;
      if (this.D.mode === 'packed') { if (Math.hypot(mx - g.x, my - g.y) <= g.r) { if (best === null || g.r < this.N[best].g.r) best = n.i; } continue; }
      const dx = mx - g.cx, dy = my - g.cy, r = Math.hypot(dx, dy); if (r > g.r1 + 5 || r < g.r0) continue; if (g.a1 - g.a0 < 1e-3) continue;
      let a = Math.atan2(dy, dx); while (a < g.a0) a += Math.PI * 2; while (a > g.a0 + Math.PI * 2) a -= Math.PI * 2; if (a >= g.a0 && a <= g.a1) return n.i;
    }
    return best;
  }
  stats() {
    const vis = this.N.filter(n => n.vis), ids = vis.map(n => n.i).sort((a, b) => galKey(this.N[b].it) - galKey(this.N[a].it)), rank = new Map(ids.map((id, k) => [id, k + 1])), total = vis.reduce((s, n) => s + n.it.v, 0);
    return { ids, rank, total, n: vis.length, mean: vis.length ? total / vis.length : 0, median: csMedian(vis.map(n => n.it.v)) };
  }
}

/* ---------------- interface ---------------- */
function galRender(mode, P, el) {
  if (el._org) el._org.destroy();
  const D = csBuilt(P, mode), lang = LANG; if (!D) { el.innerHTML = `<div class="noins">${T('gal_none')}</div>`; return null; }
  const fmt = v => fmtNum(v, D.unit, lang), aggL = `${T('cs_aggs')[D.agg]} · ${D.valName}`, multi = !!D.panels, packed = mode === 'packed';
  const sideHtml = `${D.legend.length ? `<div class="orgblk"><div class="orgcap">${esc(packed ? (D.grpName || T('gal_legend')) : D.catName)}</div><div class="orgleg" id="orgleg"></div><button class="orgall" id="orgall">${T('org_all')}</button></div>` : ''}
    <div class="orgblk"><div class="orgcap">${T(packed ? 'gal_rank_b' : 'gal_rank')}</div><div class="orgrank" id="orgrank"></div></div>
    <p class="orgfoot">${T(packed ? 'gal_base_b' : 'gal_base')}</p>`;
  let eng = null, S = null; const stats = () => S || (S = eng.stats());
  const model = id => {
    const it = D.items[id], n = eng.N[id], s = stats(), rk = s.rank.get(id), left = [];
    if (multi) left.push([D.grpName, D.panels[it.g].label]);
    if (packed && D.grpName && it.c >= 0) left.push([D.grpName, D.legend[it.c].label]);
    if (rk) left.push([T('gal_pos'), T('gal_of', rk, fmtInt(s.n, lang))]);
    if (!packed || D.agg !== 'mean') { if (D.agg !== 'mean') left.push([T(multi ? 'gal_share_p' : 'gal_share'), csPct(multi ? n.share : (s.total ? it.v / s.total * 100 : 0), lang)]); }
    if (s.mean && rk && D.agg !== 'mean') left.push([T('gal_vsavg'), fmtPct((it.v / s.mean - 1) * 100, lang)]);
    if (it.n > 1) left.push([T('rays_rows'), fmtInt(it.n, lang)]);
    return { key: 'g' + id, kick: multi ? D.panels[it.g].label : packed && it.c >= 0 ? D.legend[it.c].label : D.catName, kickColor: it.c >= 0 || !packed ? orgCatColor(eng.th, it.c) : null, title: it.label, value: fmt(it.v), vlabel: aggL, left, texts: [], note: '' };
  };
  const overview = () => {
    const s = stats(), byV = s.ids.map(i => D.items[i]), top = byV[0], low = byV[byV.length - 1], val = D.agg === 'mean' ? s.mean : s.total, left = [[packed ? D.catName : D.catName, fmtInt(s.n, lang)]];
    if (multi) left.push([D.grpName, fmtInt(D.panels.length, lang)]);
    if (top) left.push([T('rays_ov_max'), `${top.label} · ${fmt(top.v)}`]); if (low && low !== top) left.push([T('rays_ov_min'), `${low.label} · ${fmt(low.v)}`]);
    if (top && s.total && D.agg !== 'mean') left.push([T('gal_top_share'), csPct(top.v / s.total * 100, lang)]);
    return { key: 'ov', kick: T('card_overview'), title: D.catName, value: fmt(val), vlabel: aggL, left, texts: [], hint: T('rays_ov_hint') };
  };
  const h = {
    model, overview,
    listItems() {
      const sig = JSON.stringify([...eng.st.hidden].sort()), items = eng.N.filter(n => n.vis).map(n => ({ id: n.i, title: n.it.label, sub: [multi ? D.panels[n.it.g].label : '', packed && n.it.c >= 0 ? D.legend[n.it.c].label : '', n.it.n > 1 ? `${fmtInt(n.it.n, lang)} ${T('org_rows')}` : ''].filter(Boolean).join(' · '), color: n.it.c >= 0 || !packed ? orgCatColor(eng.th, n.it.c) : null, val: fmt(n.it.v), v: n.it.v, ord: n.i, s: () => n.it.label + ' ' + (multi ? D.panels[n.it.g].label : '') }));
      return { sig, items, sorts: ['v', 'n', 'o'], sort: 'v' };
    },
    visible: id => eng.N[id].vis,
    side(side0) {
      S = null; const s = stats(), st = eng.st, $ = q => side0.querySelector(q), leg = $('#orgleg');
      if (leg) leg.innerHTML = D.legend.map((g, i) => `<button class="orgc" data-c="${i}" data-n="${g.n}" aria-pressed="${!st.hidden.has(i)}" style="--c:${orgCatColor(eng.th, g.c)}"><i></i><span>${esc(g.label)}</span></button>`).join('');
      const top = s.ids.slice(0, 10).map(i => ({ id: i, v: D.items[i].v, label: multi ? `${D.items[i].label} · ${D.panels[D.items[i].g].label}` : D.items[i].label, txt: fmt(D.items[i].v), c: orgCatColor(eng.th, D.items[i].c) })), mx = Math.max(1e-9, ...top.map(x => Math.abs(x.v)));
      $('#orgrank').innerHTML = top.map(x => `<div class="orgr" data-e="${x.id}"><div class="orgrb"><div class="orgrs" style="width:${Math.max(3, Math.abs(x.v) / mx * 100)}%"><i style="flex:1;background:${x.c}"></i></div></div><span>${esc(x.label)}</span><b>${esc(x.txt)}</b></div>`).join('');
    },
    syncSide() {},
    bindSide(side0, c) {
      const { eng: e, refresh, ctip } = c, nL = D.legend.length;
      side0.addEventListener('click', ev => {
        const b = ev.target.closest('.orgc'), a = ev.target.closest('#orgall');
        if (b) { const i = +b.dataset.c, hid = new Set(e.st.hidden), only = nL - hid.size === nL ? null : null; if (hid.size === 0) { for (let k = 0; k < nL; k++) if (k !== i) hid.add(k); } else if (hid.has(i)) hid.delete(i); else hid.add(i); if (hid.size >= nL) hid.clear(); e.patch({ hidden: [...hid] }); refresh(); }
        else if (a) { e.patch({ hidden: [] }); refresh(); }
      });
      side0.addEventListener('mouseover', ev => {
        const b = ev.target.closest('.orgc'), r = ev.target.closest('.orgr[data-e]'); e.hovLg = b ? +b.dataset.c : -1; e.kick();
        if (r && /^\d+$/.test(r.dataset.e)) c.hover(+r.dataset.e);
        if (b) { const rc = b.getBoundingClientRect(); ctip.textContent = `${fmtInt(+b.dataset.n, lang)} ${T('org_rows')}`; ctip.hidden = false; ctip.style.left = Math.round(rc.left + 6) + 'px'; ctip.style.top = Math.round(rc.top - 26) + 'px'; }
      });
      side0.addEventListener('mouseout', ev => { if (ev.target.closest('.orgc')) { e.hovLg = -1; e.kick(); ctip.hidden = true; } if (ev.target.closest('.orgr[data-e]')) c.hover(null); });
    },
    tour({ stage, piece, eng: e }) {
      const sr = stage.getBoundingClientRect(), box = { x: sr.left + 12, y: sr.top + 12, w: Math.max(80, sr.width - 24), h: Math.max(80, sr.height - 24) }, c2 = piece && piece.querySelector('#pc2'), cardBox = c2 ? csPad(csBox(c2.getBoundingClientRect()), 6) : box;
      return [{ k: 1, t: box }, { k: 2, t: cardBox, demo: stats().ids[0] }];
    },
  };
  eng = new GalEngine(D, orgTheme(P), { rm: RM });
  return csMount(P, el, { id: mode, sideHtml, tutPrefix: 'tut_gal_', tutKey: 'dv-gal-tutorial' }, () => eng, h);
}
function galSteps(mode, P) {
  const D = csBuilt(P, mode), out = []; if (!D) return out;
  const lead = D.items.map((it, i) => [it, i]).filter(([it]) => !it.oth).sort((a, b) => b[0].v - a[0].v).slice(0, 3);
  if (mode === 'packed' || D.panels) { const top = D.items.map((it, i) => [it, i]).sort((a, b) => b[0].v - a[0].v)[0]; if (top) out.push({ id: 'spot', caption: `${top[0].label} · ${fmtNum(top[0].v, D.unit, LANG)}`, state: { cs: { spot: top[1] } } }); }
  else lead.forEach(([it, i]) => out.push({ id: 's' + i, caption: `${it.label} · ${csPct(it.share, LANG)} · ${fmtNum(it.v, D.unit, LANG)}`, state: { cs: { spot: i } } }));
  return out;
}
function galDrawStatic(mode, P, ctx, x, y, w, h, state) {
  const D = csBuilt(P, mode); if (!D) return; const eng = new GalEngine(D, orgTheme(P), { rm: true }); eng.resize(w, h, 1); eng.setState(state); eng.snap();
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); eng.draw(ctx, { clear: false }); ctx.restore(); eng.stop();
}
function galInsights(D, briefing, lang, T) {
  const tot = D.items.filter(x => !x.oth).map(x => ({ label: x.label, value: x.v, rows: x.n })); const seen = new Map(); tot.forEach(t => { seen.set(t.label, (seen.get(t.label) || 0) + t.value); });
  const merged = [...seen].map(([label, value]) => ({ label, value, rows: 0 })).sort((a, b) => b.value - a.value);
  const pseudo = { kind: 'category', names: { x: D.catName, y: D.valName }, unit: D.unit, aggKind: D.agg, totX: merged, totS: null, xIsTime: false, stats: {} };
  return merged.length >= 2 ? computeInsights(pseudo, briefing, lang, T) : [];
}
function galNote(mode, P) {
  const D = csBuilt(P, mode); if (!D) return ''; const how = T('cs_aggs')[D.agg].toLowerCase();
  const base = mode === 'packed' ? T('gal_note_b', D.items.length, D.catTotal, how, D.valName, D.catName) : D.panels ? T('gal_note_m', how, D.valName, D.catName, D.grpName, D.panels.length) : T('gal_note', how, D.valName, D.catName);
  return base + (D.dropped ? ' ' + T('gal_dropped', D.dropped) : '');
}
// registro dos cinco gráficos: só mudam o modo, os campos do mapeamento e a adequação
const GAL_DEFS = [
  { id: 'pie', suggest: galSuggestPie, fields: 'single' }, { id: 'donut', suggest: galSuggestPie, fields: 'single' },
  { id: 'pies', suggest: galSuggestPies, fields: 'multi' }, { id: 'donuts', suggest: galSuggestPies, fields: 'multi' }, { id: 'packed', suggest: galSuggestPacked, fields: 'packed' },
];
GAL_DEFS.forEach(d => {
  const fields = { single: [{ k: 'cat', label: 'gal_cat', role: 'dim' }, { k: 'val', label: 'gal_val', role: 'measure', none: 'org_rowsopt' }, { k: 'agg', role: 'agg', aggs: ['sum', 'count'] }],
    multi: [{ k: 'cat', label: 'gal_cat', role: 'dim' }, { k: 'grp', label: 'gal_pan', role: 'dim' }, { k: 'val', label: 'gal_val', role: 'measure', none: 'org_rowsopt' }, { k: 'agg', role: 'agg', aggs: ['sum', 'count'] }],
    packed: [{ k: 'entity', label: 'gal_ent', role: 'ent' }, { k: 'val', label: 'gal_val_b', role: 'measure', none: 'org_rowsopt' }, { k: 'grp', label: 'gal_grpc', role: 'dim', none: 'mp_none' }, { k: 'agg', role: 'agg' }] }[d.fields];
  regChart({
    id: d.id, suggest: d.suggest, build: (ds, m, opts) => galBuild(ds, m, opts, d.id), fit: (b, br) => galFit(d.id, b, br), render: (P, el) => galRender(d.id, P, el), steps: P => galSteps(d.id, P), drawStatic: (P, ctx, x, y, w, h, st) => galDrawStatic(d.id, P, ctx, x, y, w, h, st),
    insights: galInsights, note: P => galNote(d.id, P), fields,
    names: b => ({ cat: b.catName, entity: b.catName, val: ['Linhas', 'Rows'].includes(b.valName) ? null : b.valName, grp: b.grpName }),
    summary: b => T('gal_sum', fmtInt(b.items.length, LANG), b.panels ? b.panels.length : 0),
  });
});
