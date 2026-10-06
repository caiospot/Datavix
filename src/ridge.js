/* Datavix: Cordilheira isométrica. Uma cadeia em relevo por entidade, em projeção isométrica sobre uma grade:
 * o tempo corre ao longo da cadeia, a altura é o valor. Uma dimensão de dois valores vira duas cadeias lado a lado, em duas cores.
 * Desenho próprio em canvas (ordem do fundo para a frente, preenchimento que oculta o que está atrás). */
const RIDGE_MAX_E = 24, RIDGE_GROW_S = 2.6, RIDGE_TUT_KEY = 'dv-ridge-tutorial', RIDGE_V = 0.62, ISO_C = Math.cos(Math.PI / 6);

/* ---------------- dados ---------------- */
function ridgeSuggest(cols) {
  const value = bestMeasure(cols); if (value < 0) return null;
  const time = cols.findIndex(c => c.kind === 'date' && riverGrain(c.min, c.max)); if (time < 0) return null;
  const dims = cols.map((c, i) => i).filter(i => (cols[i].kind === 'category' || cols[i].kind === 'geo') && cols[i].codes && csAvgLen(cols[i]) <= 45);
  const comp = dims.find(i => distinctOf(cols[i]) === 2);
  const ents = dims.filter(i => i !== comp && distinctOf(cols[i]) >= 3 && distinctOf(cols[i]) <= 60).sort((a, b) => Math.abs(distinctOf(cols[a]) - 10) - Math.abs(distinctOf(cols[b]) - 10));
  if (!ents.length) return null;
  const vc = cols[value];
  return { time, ent: ents[0], value, comp: comp === undefined ? -1 : comp, agg: vc.unit === '%' || RAYS_AVG_HINT.test(vc.name) ? 'mean' : 'sum' };
}
function ridgeBuild(ds, m, opts) {
  if (!m || m.ent < 0 || m.time < 0 || m.value < 0) return null;
  const cols = ds.columns, n = ds.rowCount, lang = opts.lang || 'pt', policy = opts.nullPolicy || 'ignore';
  const tc = cols[m.time], ec = cols[m.ent], vc = cols[m.value], cc = m.comp >= 0 && cols[m.comp] && cols[m.comp].codes ? cols[m.comp] : null;
  if (!tc || tc.kind !== 'date' || !ec || !ec.codes || !vc || !isMeasure(vc)) return null;
  const grain = riverGrain(tc.min, tc.max); if (!grain) return null;
  const agg = m.agg === 'mean' || m.agg === 'count' ? m.agg : 'sum', acc = new Map(), entTot = new Map(), compTot = new Map(), times = new Set(); let used = 0;
  for (let i = 0; i < n; i++) {
    const t0 = tc.data[i]; if (Number.isNaN(t0)) continue; const e = ec.codes[i]; if (e < 0) continue;
    let v = vc.data[i]; if (Number.isNaN(v)) { if (policy === 'zero') v = 0; else continue; }
    const c = cc ? cc.codes[i] : 0; if (c < 0) continue; const t = bucketStart(t0, grain);
    const key = e + '|' + c + '|' + t; let a = acc.get(key); if (!a) { a = { s: 0, n: 0 }; acc.set(key, a); }
    a.s += v; a.n++; entTot.set(e, (entTot.get(e) || 0) + Math.abs(v)); compTot.set(c, (compTot.get(c) || 0) + Math.abs(v)); times.add(t); used++;
  }
  if (times.size < 4 || entTot.size < 2) return null;
  const compKeep = cc ? [...compTot].sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]) : [0], cIdx = new Map(compKeep.map((c, i) => [c, i]));
  const entKeep = [...entTot].sort((a, b) => b[1] - a[1]).slice(0, RIDGE_MAX_E).map(x => x[0]), eIdx = new Map(entKeep.map((e, i) => [e, i]));
  const tl = [...times].sort((a, b) => a - b), tIdx = new Map(tl.map((t, i) => [t, i])), nT = tl.length, nC = compKeep.length;
  const mat = entKeep.map(() => compKeep.map(() => new Array(nT).fill(0))), cn = entKeep.map(() => compKeep.map(() => new Array(nT).fill(0))); let neg = false;
  for (const [key, a] of acc) {
    const [e, c, t] = key.split('|').map(Number); if (!eIdx.has(e) || !cIdx.has(c)) continue;
    const ei = eIdx.get(e), ci = cIdx.get(c), ti = tIdx.get(t);
    mat[ei][ci][ti] = agg === 'mean' ? a.s / a.n : agg === 'count' ? a.n : a.s; cn[ei][ci][ti] = a.n;
  }
  for (const r of mat) for (const row of r) for (let i = 0; i < nT; i++) if (row[i] < 0) { neg = true; row[i] = 0; }
  const ents = entKeep.map((e, k) => { let tot = 0, pk = 0, pkT = 0, rows = 0; mat[k].forEach((row, c) => row.forEach((v, t) => { tot += v; rows += cn[k][c][t]; })); for (let t = 0; t < nT; t++) { const s = mat[k].reduce((a, row) => a + row[t], 0); if (s > pk) { pk = s; pkT = t; } } return { label: ec.dict[e], v: tot, peak: pk, pkT, n: rows, ord: e }; });
  return { entName: ec.name, timeName: tc.name + ` (${grainName(grain, lang)})`, valName: vc.name, compName: cc ? cc.name : null, unit: vc.unit, agg, grain, ents, times: tl.map(t => ({ label: bucketLabel(t, grain, lang) })), comps: compKeep.map(c => ({ label: cc ? cc.dict[c] : null, v: 0 })), m: mat, cn,
    rowsTotal: n, rowsUsed: used, entTotal: entTot.size, neg };
}
function ridgeFit(built, briefing) {
  const D = csBuilt({ built }, 'ridge'); if (!D || D.times.length < 6) return 0;
  return D.comps.length === 2 && D.ents.length >= 3 && ['time', 'compare'].includes(briefing && briefing.story) ? 0.94 : D.comps.length === 2 ? 0.7 : 0.5;
}
function ridgeNote(P) {
  const D = csBuilt(P, 'ridge'); if (!D) return '';
  return T('ridge_note', D.entTotal > D.ents.length ? T('ridge_cut', D.ents.length) : T('ridge_all'), D.times.length, T('cs_aggs')[D.agg].toLowerCase(), D.valName, D.entName) + (D.neg ? ' ' + T('ridge_neg') : '');
}
function ridgeInsights(D, briefing, lang, T) {
  const nT = D.times.length, sumT = t => D.m.reduce((a, r) => a + r.reduce((b, row) => b + row[t], 0), 0), rowsT = t => D.cn.reduce((a, r) => a + r.reduce((b, row) => b + row[t], 0), 0);
  const tot = D.times.map((p, t) => ({ label: p.label, value: sumT(t), rows: rowsT(t) })), gs = D.ents.map(e => ({ label: e.label, value: e.v, rows: e.n }));
  const out = computeInsights({ kind: 'time', names: { x: D.timeName, y: D.valName, s: D.entName }, unit: D.unit, aggKind: D.agg, totX: tot, totS: gs, xIsTime: true, stats: {} }, briefing, lang, T);
  if (D.comps.length === 2 && D.agg !== 'mean') { // comparação dos dois lados: soma de cada um e diferença percentual
    const a = D.m.reduce((s, r) => s + r[0].reduce((x, y) => x + y, 0), 0), b = D.m.reduce((s, r) => s + r[1].reduce((x, y) => x + y, 0), 0), f = v => fmtNum(v, D.unit, lang);
    if (b > 0) { const d = fmtPct((a / b - 1) * 100, lang); out.push({ id: 'ridge_cmp', text: T('ridge_ins', D.comps[0].label, D.comps[1].label, d, f(a), f(b)), calc: { title: T('ridge_ins_t'), formula: T('ridge_ins_f'), rows: [{ k: D.comps[0].label, v: f(a) }, { k: D.comps[1].label, v: f(b) }, { k: T('variation'), v: d }], base: `${T('cs_aggs')[D.agg]} · ${D.valName}` } }); }
  }
  return out.slice(0, Math.max(1, (INSIGHT_LIMIT[briefing.audience] || 2) + (D.comps.length === 2 ? 1 : 0)));
}

/* ---------------- motor ---------------- */
class RidgeEngine {
  constructor(D, th, opt = {}) {
    this.D = D; this.th = th; this.rm = !!opt.rm; const nT = D.times.length; this.nT = nT; this.nC = D.comps.length;
    this.st = { comps: null, range: [0, nT - 1], sort: 'value', top: null };
    this.hoverId = null; this.hoverP = null; this.pHit = null; this.hovComp = -1; this.spot = null;
    this.w = 800; this.h = 600; this.dpr = 1; this.grow = 0; this.moving = true; this.dirty = true; this._lt = 0;
    const rnd = orgRand(41);
    this.R = D.ents.map((e, i) => ({ i, e, v: 0, tv: 0, al: 0, tal: 0, hold: 0, rt: 0.8 + rnd() * 0.5, dm: 1, jit: rnd(), vis: false, pos: 0, gd: 0, gdSet: false }));
    this.ca = D.comps.map(() => 1); this.tca = this.ca.slice(); this.ra = 0; this.rb = nT - 1; this.tra = 0; this.trb = nT - 1;
    this.g = { s: 300, ox: 400, oy: 200, hm: 0.2, vm: 1, V: RIDGE_V }; this.tg = { ...this.g };
    const sr = orgRand(31); this.stars = Array.from({ length: 70 }, () => [sr(), sr(), 0.5 + sr() * 1.1, 0.12 + sr() * 0.35]);
    this.layout(); this.snapPos();
  }
  setState(p) { const q = p || {}; this.patch({ comps: q.comps !== undefined ? q.comps : null, range: q.range || [0, this.nT - 1], sort: q.sort || 'value', top: q.top !== undefined ? q.top : null, spot: q.spot !== undefined ? q.spot : null }); }
  patch(p) {
    if (p.comps !== undefined) this.st.comps = p.comps ? new Set(p.comps) : null;
    if (p.range) this.st.range = p.range.slice(); if (p.sort) this.st.sort = p.sort; if (p.top !== undefined) this.st.top = p.top; if (p.spot !== undefined) this.spot = p.spot;
    this.layout(); this.kick();
  }
  getState() { return { comps: this.st.comps ? [...this.st.comps] : null, range: this.st.range.slice(), sort: this.st.sort, top: this.st.top, spot: this.spot }; }
  setHover(id) { const np = typeof id === 'number' ? this.pHit : null, ch = id !== this.hoverId || np !== this.hoverP; this.pHit = null; this.hoverId = id; this.hoverP = np; if (ch) this.kick(); }
  resize(w, h, dpr) { this.w = w; this.h = h; this.dpr = dpr || 1; this.layout(); this.snapPos(); this.kick(); }
  snapPos() { for (const r of this.R) { r.v = r.tv; r.al = r.tal; r.hold = 0; } this.ca = this.tca.slice(); this.ra = this.tra; this.rb = this.trb; this.g = { ...this.tg }; }
  snap() { this.snapPos(); this.updateDim(0, true); this.grow = 1; this.moving = false; this.dirty = true; }
  rangeTotals(c) { const D = this.D, [a, b] = this.st.range; return this.R.map(r => { let s = 0; for (let t = a; t <= b; t++) s += D.m[r.i][c][t]; return s; }); }
  layout() {
    const { D, st, R } = this, W = this.w, H = this.h, [a, b] = st.range, nC = this.nC;
    this.tca = D.comps.map((_, c) => (!st.comps || st.comps.has(c) ? 1 : 0)); if (!this.tca.some(x => x)) this.tca = D.comps.map(() => 1);
    const tot = R.map(r => { let s = 0; for (let c = 0; c < nC; c++) if (this.tca[c]) for (let t = a; t <= b; t++) s += D.m[r.i][c][t]; return s; });
    const pk = R.map(r => { let m = 0; for (let t = a; t <= b; t++) { let s = 0; for (let c = 0; c < nC; c++) if (this.tca[c]) s += D.m[r.i][c][t]; m = Math.max(m, s); } return m; });
    let vis = R.slice(); if (st.top && st.top < vis.length) vis = vis.sort((x, y) => tot[y.i] - tot[x.i]).slice(0, st.top);
    const set = new Set(vis); for (const r of R) r.vis = set.has(r); this.nVis = vis.length;
    const loc = LANG === 'pt' ? 'pt-BR' : 'en', cmp = st.sort === 'name' ? (x, y) => x.e.label.localeCompare(y.e.label, loc, { numeric: true }) : st.sort === 'orig' ? (x, y) => x.e.ord - y.e.ord : st.sort === 'peak' ? (x, y) => pk[y.i] - pk[x.i] : (x, y) => tot[y.i] - tot[x.i];
    const seq = vis.slice().sort(cmp), nV = Math.max(1, seq.length), dv = RIDGE_V / nV, hm = orgClamp(3.2 * dv, 0.07, 0.26);
    this.dv = dv; this.seq = seq; this.tot = tot;
    let vmax = 1e-9; for (const r of seq) for (let t = Math.max(0, a - 1); t <= Math.min(this.nT - 1, b + 1); t++) { let s = 0; for (let c = 0; c < nC; c++) if (this.tca[c]) s = Math.max(s, D.m[r.i][c][t]); vmax = Math.max(vmax, s); }
    const ml = 130, mr = 96, mt = 40, mb = 46, V = RIDGE_V, aw = W - ml - mr, ah = H - mt - mb, bw = (1 + V) * ISO_C, bh = (1 + V) * 0.5 + hm, s = Math.max(60, Math.min(aw / bw, ah / bh));
    this.tg = { s, ox: ml + V * ISO_C * s + (aw - bw * s) / 2, oy: mt + hm * s + (ah - bh * s) / 2, hm, vm: vmax, V };
    this.tra = a; this.trb = Math.max(a + 1, b);
    const prev = new Map(); for (const r of R) prev.set(r, [r.tv, r.tal]);
    seq.forEach((r, j) => { r.tv = (j + 0.5) * dv; r.tal = 1; r.pos = j; if (!r.gdSet) r.gd = j / nV; });
    for (const r of R) { if (!r.vis) { r.tal = 0; if (!r.gdSet) r.gd = r.i / R.length; } r.gdSet = true; }
    const now = performance.now(), burst = now - this._lt < 200; this._lt = now;
    if (!this.rm && !burst) for (const r of R) { const pv = prev.get(r); if ((Math.abs(r.tv - pv[0]) > 0.01 || Math.abs(r.tal - pv[1]) > 0.5) && r.hold <= 0) r.hold = (r.pos / nV) * 0.28 + r.jit * 0.06; }
    this.kick();
  }
  updateDim(dt, snap) {
    const focus = this.hoverId !== null ? this.hoverId : this.spot !== null ? this.spot : -1, kd = snap || this.rm ? 1 : 1 - Math.exp(-dt * 11); let mv = false;
    for (const r of this.R) { const t = focus >= 0 ? (r.i === focus ? 1 : 0.2) : 1, d = t - r.dm; if (Math.abs(d) > 0.004) { r.dm += d * kd; mv = true; } else r.dm = t; }
    return mv;
  }
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
    if (this.rm) this.grow = 1; else this.grow = Math.min(1, this.grow + dt / RIDGE_GROW_S);
    let mv = this.grow < 1; const k = this.rm ? 1 : 1 - Math.exp(-dt * 5.5), ease = (c, t, e) => { const d = t - c; if (Math.abs(d) > e) { mv = true; return c + d * k; } return t; };
    for (const r of this.R) { if (r.hold > 0) { r.hold -= dt; mv = true; continue; } const kr = this.rm ? 1 : Math.min(1, (1 - Math.exp(-dt * 5.2)) * r.rt); let d = r.tv - r.v; if (Math.abs(d) > 1e-4) { r.v += d * kr; mv = true; } else r.v = r.tv; d = r.tal - r.al; if (Math.abs(d) > 0.004) { r.al += d * kr; mv = true; } else r.al = r.tal; }
    this.ca = this.ca.map((c, i) => ease(c, this.tca[i], 0.004)); this.ra = ease(this.ra, this.tra, 0.005); this.rb = ease(this.rb, this.trb, 0.005);
    for (const key of ['s', 'ox', 'oy', 'hm', 'vm', 'V']) this.g[key] = ease(this.g[key], this.tg[key], key === 's' || key === 'ox' || key === 'oy' ? 0.05 : 1e-5);
    if (this.updateDim(dt, false)) mv = true;
    this.moving = mv;
  }
  /* ---------- geometria ---------- */
  P(u, v, h) { const g = this.g; return [g.ox + (u - v) * ISO_C * g.s, g.oy + (u + v) * 0.5 * g.s - h * g.s]; }
  uOf(t) { return (t - this.ra) / Math.max(1e-6, this.rb - this.ra); }
  col(c, i) { const th = this.th; return this.nC === 1 ? th.colors[0] : th.colors[c % th.colors.length]; }
  hs(r) { return orgEase(orgClamp((this.grow - 0.05 - r.gd * 0.35) / 0.5)); }
  // polígono (e topo) de uma cadeia: baseline reta, topo pela série; recorta ao intervalo visível
  ridge(r, c, hsc) {
    const D = this.D, g = this.g, nT = this.nT, v = r.v + (c - (this.nC - 1) / 2) * this.dv * 0.2, t0 = Math.max(0, Math.floor(this.ra) - 1), t1 = Math.min(nT - 1, Math.ceil(this.rb) + 1), zs = g.hm / g.vm * hsc * this.ca[c];
    const top = [], base = [];
    for (let t = t0; t <= t1; t++) { const u = this.uOf(t), h = D.m[r.i][c][t] * zs; top.push(this.P(u, v, h)); base.push(this.P(u, v, 0)); }
    return { top, base, v, t0 };
  }
  tipXY(i) { const r = this.R[i], t = Math.max(0, Math.min(this.nT - 1, Math.round(this.ra + (this.rb - this.ra) * 0.5))), v = r.v, D = this.D, h = D.m[i].reduce((a, row) => Math.max(a, row[t]), 0) * this.g.hm / this.g.vm * this.hs(r) * Math.max(...this.ca); return this.P(this.uOf(t), v, h); }
  render() { if (this.ctx) { const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.draw(c); } }
  draw(ctx, opt) {
    const { th, D, g, R } = this, fg = th.fg, base = th.base, W = this.w, H = this.h, fr = orgStage(this.grow, 0, 0.3), fmt = v => fmtNum(v, D.unit, LANG), nC = this.nC;
    if (!opt || opt.clear !== false) ctx.clearRect(0, 0, W, H);
    const [br, bg2, bb] = hexToRgb(base);
    if (br + bg2 + bb < 330) { ctx.fillStyle = rgba(fg, 1); for (const s of this.stars) { ctx.globalAlpha = s[3] * fr; ctx.beginPath(); ctx.arc(s[0] * W, s[1] * H, s[2], 0, ORG_TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    // piso isométrico: contorno, grade nos períodos e uma linha por cadeia
    const Vm = g.V, pts = [this.P(0, 0, 0), this.P(1, 0, 0), this.P(1, Vm, 0), this.P(0, Vm, 0)];
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fillStyle = rgba(fg, 0.035 * fr); ctx.fill(); ctx.strokeStyle = rgba(fg, 0.2 * fr); ctx.lineWidth = 1; ctx.stroke();
    const [a, b] = this.st.range, nV = b - a + 1, every = Math.max(1, Math.ceil(nV / 8));
    ctx.save(); ctx.setLineDash([2, 5]); ctx.strokeStyle = rgba(fg, 0.12 * fr);
    for (let t = a; t <= b; t++) { if ((t - a) % every) continue; const u = this.uOf(t), p0 = this.P(u, 0, 0), p1 = this.P(u, Vm, 0); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
    ctx.restore();
    ctx.font = `500 10.5px ${th.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let t = a; t <= b; t++) { if ((t - a) % every) continue; const p = this.P(this.uOf(t), Vm, 0); ctx.fillStyle = rgba(fg, 0.6 * fr); ctx.fillText(D.times[t].label, p[0] + 4, p[1] + 8); }
    // cadeias, do fundo para a frente; o fundo da cadeia é opaco para ocultar o que está atrás
    const order = R.filter(r => r.al > 0.02).sort((x, y) => x.v - y.v), hv = this.hoverId, hp = this.hoverP;
    for (const r of order) {
      const hsc = this.hs(r), dm = r.dm, al = r.al; if (hsc < 0.01) continue;
      const x0 = this.P(0, r.v, 0)[0] - 2, x1 = this.P(1, r.v, 0)[0] + 2;
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - 1, 0, x1 - x0 + 2 + (nC - 1) * this.dv * ISO_C * g.s, H); ctx.clip();
      for (let c = 0; c < nC; c++) {
        if (this.ca[c] < 0.02) continue;
        const { top, base: bs } = this.ridge(r, c, hsc), col = this.col(c, r.i), tint = al * dm, fillC = mixHex(base, col, 0.3 + 0.7 * dm), edge = mixHex(col, fg, 0.18);
        ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); for (let i = bs.length - 1; i >= 0; i--) ctx.lineTo(bs[i][0], bs[i][1]); ctx.closePath();
        const gr = ctx.createLinearGradient(0, g.oy - g.hm * g.s, 0, g.oy + g.s); gr.addColorStop(0, rgba(fillC, 0.96 * Math.min(1, al * 1.4))); gr.addColorStop(1, rgba(mixHex(base, fillC, 0.72), 0.96 * Math.min(1, al * 1.4))); ctx.fillStyle = gr; ctx.fill();
        ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.strokeStyle = rgba(edge, (r.i === hv ? 1 : 0.9) * tint * this.ca[c]); ctx.lineWidth = r.i === hv ? 2 : 1.2; ctx.lineJoin = 'round'; ctx.stroke();
      }
      ctx.restore();
      if (r.i === hv && hp !== null && hp >= a && hp <= b) { // marca vertical no período sob o mouse
        const u = this.uOf(hp), zs = g.hm / g.vm * hsc; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.strokeStyle = rgba(fg, 0.7);
        for (let c = 0; c < nC; c++) { if (this.ca[c] < 0.5) continue; const v = r.v + (c - (nC - 1) / 2) * this.dv * 0.2, p0 = this.P(u, v, 0), p1 = this.P(u, v, D.m[r.i][c][hp] * zs); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
        ctx.setLineDash([]);
        for (let c = 0; c < nC; c++) {
          if (this.ca[c] < 0.5) continue; const v = r.v + (c - (nC - 1) / 2) * this.dv * 0.2, p1 = this.P(u, v, D.m[r.i][c][hp] * zs), s = fmt(D.m[r.i][c][hp]);
          ctx.fillStyle = rgba(this.col(c, r.i), 1); ctx.beginPath(); ctx.arc(p1[0], p1[1], 4, 0, ORG_TAU); ctx.fill(); ctx.strokeStyle = rgba(fg, 0.95); ctx.lineWidth = 1.2; ctx.stroke();
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.font = `700 11.5px ${th.font}`; ctx.lineWidth = 4; ctx.strokeStyle = rgba(base, 0.92); ctx.strokeText(s, p1[0], p1[1] - 8 - c * 14); ctx.fillStyle = rgba(fg, 1); ctx.fillText(s, p1[0], p1[1] - 8 - c * 14);
        }
        const pl = this.P(u, Vm, 0); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = `700 11px ${th.font}`; ctx.fillStyle = rgba(fg, 1); ctx.fillText(D.times[hp].label, pl[0] + 4, pl[1] + 22);
      }
    }
    // nomes das cadeias à esquerda do começo, por cima de tudo (com contorno para ler sobre o relevo)
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (const r of order) {
      const lp = this.P(0, r.v, 0), on = r.i === hv; ctx.font = `${on ? 700 : 500} 11px ${th.font}`; const txt = raysTrunc(r.e.label, 20), al = r.al * Math.max(0.4, r.dm) * fr;
      ctx.lineWidth = 3.5; ctx.strokeStyle = rgba(base, 0.85 * al); ctx.strokeText(txt, lp[0] - 10, lp[1] - 2); ctx.fillStyle = rgba(fg, (on ? 1 : 0.78) * al); ctx.fillText(txt, lp[0] - 10, lp[1] - 2);
    }
  }
  /* ---------- seleção com o mouse ---------- */
  pick(mx, my) {
    const mc = csMeasureCtx(), order = this.R.filter(r => r.al > 0.4).sort((x, y) => y.v - x.v);
    for (const r of order) {
      const hsc = Math.max(0.2, this.hs(r));
      for (let c = this.nC - 1; c >= 0; c--) {
        if (this.ca[c] < 0.4) continue; const { top, base } = this.ridge(r, c, hsc), p = new Path2D(); top.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); for (let i = base.length - 1; i >= 0; i--) p.lineTo(base[i][0], base[i][1]); p.closePath();
        if (mc.isPointInPath(p, mx, my)) { const v = r.v + (c - (this.nC - 1) / 2) * this.dv * 0.2, u = (mx - this.g.ox) / (ISO_C * this.g.s) + v, t = Math.round(this.ra + u * (this.rb - this.ra)); this.pHit = Math.max(this.st.range[0], Math.min(this.st.range[1], t)); return r.i; }
      }
      const lp = this.P(0, r.v, 0); if (mx <= lp[0] - 2 && mx >= lp[0] - 130 && Math.abs(my - lp[1]) < Math.max(8, this.dv * this.g.s * 0.45)) return r.i; // o nome da cadeia
    }
    return null;
  }
  stats() {
    const D = this.D, [a, b] = this.st.range, nC = this.nC, vis = this.R.filter(r => r.vis), mean = D.agg === 'mean', act = D.comps.map((_, c) => (this.tca[c] ? 1 : 0)), nAct = Math.max(1, act.reduce((x, y) => x + y, 0)), np = b - a + 1;
    // soma/contagem: total é a soma; média: o "total" é a média dos períodos (e dos lados ativos)
    const cTot = this.R.map(r => D.m[r.i].map(row => { let s = 0; for (let t = a; t <= b; t++) s += row[t]; return mean ? s / np : s; }));
    const at = (i, t) => { let s = 0; for (let c = 0; c < nC; c++) if (act[c]) s += D.m[i][c][t]; return mean ? s / nAct : s; };
    const tot = this.R.map((r, i) => cTot[i].reduce((s, v, c) => s + (act[c] ? v : 0), 0) / (mean ? nAct : 1)), ids = vis.map(r => r.i).sort((x, y) => tot[y] - tot[x]), rank = new Map(ids.map((id, k) => [id, k + 1]));
    const per = []; for (let t = 0; t < this.nT; t++) { const s = vis.reduce((x, r) => x + at(r.i, t), 0); per.push(mean ? s / Math.max(1, vis.length) : s); }
    const grand = mean ? ids.reduce((s, i) => s + tot[i], 0) / Math.max(1, ids.length) : ids.reduce((s, i) => s + tot[i], 0);
    return { cTot, tot, ids, rank, per, grand, nC, at, mean };
  }
}

/* ---------------- interface ---------------- */
function renderRidge(P, el) {
  if (el._org) el._org.destroy();
  const D = csBuilt(P, 'ridge'), lang = LANG;
  if (!D) { el.innerHTML = `<div class="noins">${T('ridge_none')}</div>`; return null; }
  const totL = D.agg === 'mean' ? T('rg_avgint') : T('rg_total');
  const fmt = v => fmtNum(v, D.unit, lang), nE = D.ents.length, nT = D.times.length, nC = D.comps.length, aggL = `${T('cs_aggs')[D.agg]} · ${D.valName}`, timeBase = D.timeName.replace(/ \(.*\)$/, '');
  const sorts = [['value', 'rg_s_value'], ['peak', 'rg_s_peak'], ['name', 'rg_s_name'], ['orig', 'rg_s_orig']];
  const sideHtml = `<div class="orgblk"><div class="orgcap">${T('rg_range')}</div><div class="orgrange"><span id="orl0"></span><span id="orl1"></span></div><div class="orgsl"><input type="range" id="orA" min="0" max="${nT - 1}" value="0" aria-label="${T('zoom_from')}"><input type="range" id="orB" min="0" max="${nT - 1}" value="${nT - 1}" aria-label="${T('zoom_to')}"></div></div>
    ${nC === 2 ? `<div class="orgblk"><div class="orgcap">${esc(D.compName || T('rg_cmp'))}</div><div class="orgleg" id="orgleg"></div><button class="orgall" id="orgall">${T('org_all')}</button></div>` : ''}
    <div class="orgblk"><div class="orgcap">${T('rg_sort')}</div><select class="rsel" id="rgsort" aria-label="${T('rg_sort')}">${sorts.map(([v, k]) => `<option value="${v}">${T(k)}</option>`).join('')}</select></div>
    ${nE > 6 ? `<div class="orgblk"><div class="orgcap" id="rgtopl"></div><input type="range" class="rsl" id="rgtop" min="3" max="${nE}" value="${nE}" aria-label="${T('rays_top', '')}"></div>` : ''}
    <div class="orgblk"><div class="orgcap">${T('rg_rank')}</div><div class="orgrank" id="orgrank"></div></div><p class="orgfoot">${D.entTotal > nE ? T('ridge_cut', nE) : T('ridge_all')}</p>`;
  let eng = null, S = null; const stats = () => S || (S = eng.stats());
  const cl = c => (D.comps[c].label || '');
  const model = id => {
    const E = D.ents[id], s = stats(), [a, b] = eng.st.range, left = [], rk = s.rank.get(id), hp = eng.hoverP;
    if (hp !== null && hp >= a && hp <= b) {
      left.push([timeBase, D.times[hp].label]);
      for (let c = 0; c < nC; c++) left.push([nC > 1 ? cl(c) : D.valName, fmt(D.m[id][c][hp])]);
      if (nC === 2 && D.m[id][1][hp] > 0) left.push([T('rg_vs'), fmtPct((D.m[id][0][hp] / D.m[id][1][hp] - 1) * 100, lang)]);
    }
    if (nC > 1) for (let c = 0; c < nC; c++) left.push([cl(c) + ' · ' + totL.toLowerCase(), fmt(s.cTot[id][c])]);
    if (rk) left.push([T('rg_pos'), T('rays_of', rk, s.ids.length)]);
    let pk = a, pv = -1; for (let t = a; t <= b; t++) { const v = s.at(id, t); if (v > pv) { pv = v; pk = t; } }
    left.push([T('rg_peak'), `${D.times[pk].label} · ${fmt(pv)}`]);
    const f = s.at(id, a), l = s.at(id, b); if (b > a && f > 0) left.push([T('rg_change'), fmtPct((l / f - 1) * 100, lang)]);
    if (!s.mean) left.push([T('rg_avg'), fmt(s.tot[id] / Math.max(1, b - a + 1))]);
    return { key: 'g' + id + 'p' + (hp === null ? '' : hp), kick: D.entName, title: E.label, value: fmt(s.tot[id]), vlabel: aggL + ' · ' + totL.toLowerCase(), left, texts: [] };
  };
  const overview = () => {
    const s = stats(), [a, b] = eng.st.range, left = [[T('rg_ov_n'), fmtInt(s.ids.length, lang)]];
    if (nC > 1) for (let c = 0; c < nC; c++) left.push([cl(c), fmt(s.ids.reduce((x, i) => x + s.cTot[i][c], 0) / (s.mean ? Math.max(1, s.ids.length) : 1))]);
    let hi = a; for (let t = a; t <= b; t++) if (s.per[t] > s.per[hi]) hi = t; left.push([T('rays_ov_max'), `${D.times[hi].label} · ${fmt(s.per[hi])}`]);
    const top = s.ids[0]; if (top !== undefined) left.push([T('rg_ov_peak'), `${D.ents[top].label} · ${fmt(D.ents[top].peak)}`]);
    return { key: 'ov', kick: T('card_overview'), title: `${D.times[a].label} – ${D.times[b].label}`, value: fmt(s.grand), vlabel: aggL, left, texts: [], hint: T('rg_ov_hint') };
  };
  const h = {
    model, overview,
    listItems() {
      const st = eng.st, s = stats(), sig = JSON.stringify([st.range, st.top, st.comps ? [...st.comps] : null]);
      const items = s.ids.map(i => ({ id: i, title: D.ents[i].label, sub: nC > 1 ? D.comps.map((c, k) => `${c.label} ${fmt(s.cTot[i][k])}`).join(' · ') : `${T('rg_peak')} ${D.times[D.ents[i].pkT].label}`, color: eng.th.colors[0], val: fmt(s.tot[i]), v: s.tot[i], ord: D.ents[i].ord }));
      return { sig, items, sorts: ['v', 'n', 'o'], sort: 'v' };
    },
    visible: id => eng.R[id].vis,
    side(side0) {
      S = null; const s = stats(), st = eng.st, $ = q => side0.querySelector(q);
      $('#orl0').textContent = D.times[st.range[0]].label; $('#orl1').textContent = D.times[st.range[1]].label;
      const leg = $('#orgleg'); if (leg) leg.innerHTML = D.comps.map((c, i) => `<button class="orgc" data-c="${i}" data-n="${esc(c.label)}" aria-pressed="${!st.comps || st.comps.has(i)}" style="--c:${eng.th.colors[i % eng.th.colors.length]}"><i></i><span>${esc(c.label)}</span></button>`).join('');
      const tl = $('#rgtopl'); if (tl) tl.textContent = st.top && st.top < nE ? T('rays_top', st.top) : T('rays_topall', nE);
      const top = s.ids.slice(0, 10), mx = Math.max(1e-9, ...top.map(i => s.tot[i]));
      $('#orgrank').innerHTML = top.map(i => { const segs = D.comps.map((c, k) => (eng.tca[k] ? `<i style="flex:${Math.max(0, s.cTot[i][k])};background:${eng.th.colors[k % eng.th.colors.length]}"></i>` : '')).join(''); return `<div class="orgr" data-e="${i}"><div class="orgrb"><div class="orgrs" style="width:${Math.max(3, s.tot[i] / mx * 100)}%">${segs}</div></div><span>${esc(D.ents[i].label)}</span><b>${esc(fmt(s.tot[i]))}</b></div>`; }).join('');
    },
    syncSide(side0, e) { const q = x => side0.querySelector(x); q('#orA').value = e.st.range[0]; q('#orB').value = e.st.range[1]; q('#rgsort').value = e.st.sort; const t = q('#rgtop'); if (t) t.value = e.st.top || nE; },
    bindSide(side0, c) {
      const { eng: e, refresh, ctip } = c, q = x => side0.querySelector(x);
      side0.addEventListener('click', ev => {
        const b = ev.target.closest('.orgc'), a = ev.target.closest('#orgall');
        if (b) { const i = +b.dataset.c, cur = e.st.comps ? new Set(e.st.comps) : new Set(D.comps.map((_, k) => k)); if (!e.st.comps) { cur.clear(); cur.add(i); } else cur.has(i) ? cur.delete(i) : cur.add(i); e.patch({ comps: !cur.size || cur.size === nC ? null : [...cur] }); refresh(); }
        else if (a) { e.patch({ comps: null }); refresh(); }
      });
      const onRange = () => { let a = +q('#orA').value, b = +q('#orB').value; if (a > b) { if (document.activeElement === q('#orA')) { b = a; q('#orB').value = b; } else { a = b; q('#orA').value = a; } } e.patch({ range: [a, b] }); refresh(); };
      q('#orA').addEventListener('input', onRange); q('#orB').addEventListener('input', onRange);
      side0.addEventListener('input', ev => { if (ev.target.id === 'rgtop') { const v = +ev.target.value; e.patch({ top: v >= nE ? null : v }); refresh(); } });
      side0.addEventListener('change', ev => { if (ev.target.id === 'rgsort') { e.patch({ sort: ev.target.value }); refresh(); } });
      side0.addEventListener('mouseover', ev => { const r = ev.target.closest('.orgr[data-e]'); if (r) c.hover(+r.dataset.e); });
      side0.addEventListener('mouseout', ev => { if (ev.target.closest('.orgr[data-e]')) c.hover(null); });
    },
    tour({ stage, side0, piece, tools }) {
      const sr = csBox(stage.getBoundingClientRect()), c2 = piece && piece.querySelector('#pc2'), cardBox = c2 ? csPad(csBox(c2.getBoundingClientRect()), 6) : sr;
      const blks = [...side0.querySelectorAll('.orgblk')].slice(0, nC === 2 ? 2 : 1).map(b => csBox(b.getBoundingClientRect()));
      const u = blks.reduce((a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), x2: Math.max(a.x2, b.x + b.w), y2: Math.max(a.y2, b.y + b.h) }), { x: 1e9, y: 1e9, x2: 0, y2: 0 });
      return [{ k: 1, t: csPad(sr, -6) }, { k: 2, t: cardBox, demo: stats().ids[0] }, { k: 3, t: csPad({ x: u.x, y: u.y, w: u.x2 - u.x, h: u.y2 - u.y }, 8) }, { k: 4, t: csPad(csBox(tools.getBoundingClientRect()), 8) }];
    },
  };
  eng = new RidgeEngine(D, orgTheme(P), { rm: RM });
  return csMount(P, el, { id: 'ridge', sideHtml, tutPrefix: 'tut_ridge_', tutKey: RIDGE_TUT_KEY }, () => eng, h);
}
function ridgeSteps(P) {
  const D = csBuilt(P, 'ridge'), out = []; if (!D) return out;
  const tot = D.ents.map(e => e.v), nT = D.times.length, fmt = v => fmtNum(v, D.unit, LANG);
  tot.map((v, i) => i).slice(0, 6).forEach(i => out.push({ id: 'e' + i, caption: `${D.ents[i].label} · ${fmt(D.ents[i].v)}`, state: { cs: { spot: i } } }));
  if (D.comps.length === 2) D.comps.forEach((c, k) => out.push({ id: 'c' + k, caption: c.label, state: { cs: { comps: [k] } } }));
  if (nT >= 8) { const mid = Math.floor(nT / 2); out.push({ id: 'h1', caption: `${D.times[0].label} – ${D.times[mid - 1].label}`, state: { cs: { range: [0, mid - 1] } } }, { id: 'h2', caption: `${D.times[mid].label} – ${D.times[nT - 1].label}`, state: { cs: { range: [mid, nT - 1] } } }); }
  return out;
}
function ridgeDrawStatic(P, ctx, x, y, w, h, state) {
  const D = csBuilt(P, 'ridge'); if (!D) return;
  const eng = new RidgeEngine(D, orgTheme(P), { rm: true }); eng.resize(w, h, 1); eng.setState(state); eng.snap();
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); eng.draw(ctx, { clear: false }); ctx.restore(); eng.stop();
}
regChart({
  id: 'ridge', suggest: ridgeSuggest, build: ridgeBuild, fit: ridgeFit, insights: ridgeInsights, render: renderRidge, steps: ridgeSteps, drawStatic: ridgeDrawStatic, note: ridgeNote,
  fields: [{ k: 'time', label: 'ridge_time', role: 'date' }, { k: 'ent', label: 'ridge_ent', role: 'dim' }, { k: 'value', label: 'ridge_val', role: 'measure' }, { k: 'comp', label: 'ridge_cmp', role: 'dim', none: 'mp_none' }, { k: 'agg', role: 'agg' }],
  names: b => ({ time: b.timeName.replace(/ \(.*\)$/, ''), ent: b.entName, value: b.valName, comp: b.compName }),
  summary: b => T('ridge_sum', fmtInt(b.ents.length, LANG), fmtInt(b.times.length, LANG), b.comps.length === 2 ? `${b.comps[0].label} × ${b.comps[1].label}` : ''),
});
