/* Datavix: Rio vertical. O tempo desce pela página; cada categoria é uma faixa, a largura é o valor no período, as maiores ficam por fora.
 * Linha pontilhada por período; semicírculos no alto com o total de cada categoria (também filtram). Desenho próprio em canvas. */
const RIVER_MAX_CAT = 12, RIVER_MAX_P = 48, RIVER_GROW_S = 2.6, RIVER_TUT_KEY = 'dv-river-tutorial';

/* ---------------- dados ---------------- */
// período que dá de 8 a 48 pontos (do mais largo para o mais fino); aceita de 4 a 48 se não houver melhor
function riverGrain(min, max) {
  const gs = ['year', 'quarter', 'month', 'week', 'day'];
  for (const g of gs) { const n = bucketCount(min, max, g); if (n >= 8 && n <= RIVER_MAX_P) return g; }
  for (const g of gs) { const n = bucketCount(min, max, g); if (n >= 4 && n <= RIVER_MAX_P) return g; }
  return null;
}
function riverSuggest(cols) {
  const value = bestMeasure(cols); if (value < 0) return null;
  const period = cols.findIndex(c => c.kind === 'date' && riverGrain(c.min, c.max));
  if (period < 0) return null;
  const ok = cols.map((c, i) => i).filter(i => (cols[i].kind === 'category' || cols[i].kind === 'geo') && cols[i].codes && csAvgLen(cols[i]) <= 45 && distinctOf(cols[i]) >= 3 && distinctOf(cols[i]) <= 60);
  const few = ok.filter(i => distinctOf(cols[i]) <= RIVER_MAX_CAT).sort((a, b) => Math.abs(distinctOf(cols[a]) - 6) - Math.abs(distinctOf(cols[b]) - 6));
  const cat = few.length ? few[0] : ok.sort((a, b) => distinctOf(cols[a]) - distinctOf(cols[b]))[0];
  if (cat === undefined) return null;
  const vc = cols[value];
  return { period, cat, value, agg: vc.unit === '%' || RAYS_AVG_HINT.test(vc.name) ? 'count' : 'sum' };
}
function riverBuild(ds, m, opts, map) {
  if (!m || m.period < 0 || m.cat < 0) return null;
  const cols = ds.columns, n = ds.rowCount, lang = opts.lang || 'pt', policy = opts.nullPolicy || 'ignore';
  const pc = cols[m.period], cc = cols[m.cat], vc = m.value >= 0 ? cols[m.value] : null;
  if (!pc || !cc || !cc.codes || (vc && !isMeasure(vc))) return null;
  const isDate = pc.kind === 'date', grain = isDate ? riverGrain(pc.min, pc.max) : null;
  if (isDate ? !grain : !pc.codes) return null;
  const agg = vc ? (m.agg === 'count' ? 'count' : 'sum') : 'count';
  const acc = new Map(), catTot = new Map(), pers = new Set(); let used = 0;
  for (let i = 0; i < n; i++) {
    let p; if (isDate) { const t = pc.data[i]; if (Number.isNaN(t)) continue; p = bucketStart(t, grain); } else { p = pc.codes[i]; if (p < 0) continue; }
    const c = cc.codes[i]; if (c < 0) continue;
    let v = vc ? vc.data[i] : 1; if (Number.isNaN(v)) { if (policy === 'zero') v = 0; else continue; }
    const key = p + '|' + c; let a = acc.get(key); if (!a) { a = { s: 0, n: 0 }; acc.set(key, a); }
    a.s += v; a.n++; catTot.set(c, (catTot.get(c) || 0) + Math.abs(v)); pers.add(p); used++;
  }
  if (pers.size < 3 || catTot.size < 2) return null;
  const periods = [...pers].sort((a, b) => a - b), pIdx = new Map(periods.map((p, i) => [p, i]));
  const order = [...catTot].sort((a, b) => b[1] - a[1]).map(x => x[0]), keep = order.slice(0, order.length > RIVER_MAX_CAT ? RIVER_MAX_CAT - 1 : order.length), kIdx = new Map(keep.map((c, i) => [c, i]));
  const OTH = lang === 'en' ? 'Others' : 'Outros', hasOth = order.length > keep.length, K = keep.length + (hasOth ? 1 : 0), nP = periods.length;
  const mat = Array.from({ length: K }, () => new Array(nP).fill(0)), cn = Array.from({ length: K }, () => new Array(nP).fill(0)); let neg = false;
  for (const [key, a] of acc) {
    const [p, c] = key.split('|').map(Number), k = kIdx.has(c) ? kIdx.get(c) : K - 1, pi = pIdx.get(p);
    mat[k][pi] += agg === 'count' ? a.n : a.s; cn[k][pi] += a.n;
  }
  for (const row of mat) for (let i = 0; i < nP; i++) if (row[i] < 0) { neg = true; row[i] = 0; }
  const cats = mat.map((row, k) => ({ label: k < keep.length ? cc.dict[keep[k]] : OTH, v: row.reduce((a, b) => a + b, 0), n: cn[k].reduce((a, b) => a + b, 0) }));
  return { perName: pc.name + (isDate ? ` (${grainName(grain, lang)})` : ''), catName: cc.name, valName: vc ? vc.name : (lang === 'en' ? 'Rows' : 'Linhas'), unit: vc ? vc.unit : null, agg, grain, hasOth,
    periods: periods.map(p => ({ label: isDate ? bucketLabel(p, grain, lang) : pc.dict[p] })), cats, m: mat, cn, rowsUsed: used, rowsTotal: n, neg,
    // a árvore radial usa a mesma coluna de categoria? então os dados são "poucas categorias no tempo" e o rio é a melhor primeira opção
    clash: !map || !map.org || map.org.entity === m.cat };
}
function riverFit(built, briefing) {
  const D = csBuilt({ built }, 'river'); if (!D || D.periods.length < 6 || D.cats.length < 3) return 0;
  const base = D.clash ? 0.92 : 0.55;
  return base > 0.9 && !['time', 'composition'].includes(briefing && briefing.story) ? 0.7 : base;
}
function riverNote(P) {
  const D = csBuilt(P, 'river'); if (!D) return '';
  return T('river_note', D.periods.length, D.hasOth ? T('river_oth') : T('river_all'), T('cs_aggs')[D.agg].toLowerCase(), D.valName, D.catName) + (D.neg ? ' ' + T('river_neg') + '.' : '');
}
function riverInsights(D, briefing, lang, T) {
  const tot = D.periods.map((p, i) => ({ label: p.label, value: D.m.reduce((a, r) => a + r[i], 0), rows: D.cn.reduce((a, r) => a + r[i], 0) })), gs = D.cats.map(c => ({ label: c.label, value: c.v, rows: c.n }));
  const pseudo = { kind: 'time', names: { x: D.perName, y: D.valName, s: D.catName }, unit: D.unit, aggKind: D.agg, totX: tot, totS: gs, xIsTime: true, stats: {} };
  return computeInsights(pseudo, briefing, lang, T);
}

/* ---------------- motor ---------------- */
class RiverEngine {
  constructor(D, th, opt = {}) {
    this.D = D; this.th = th; this.rm = !!opt.rm; const K = D.cats.length, nP = D.periods.length; this.K = K; this.nP = nP;
    this.st = { cats: null, range: [0, nP - 1], order: 'edges', mode: 'abs' };
    this.hoverId = null; this.hoverP = null; this.pHit = null; this.hovCat = -1; this.spot = null;
    this.w = 800; this.h = 600; this.dpr = 1; this.grow = 0; this.moving = true; this.dirty = true;
    this.C = D.cats.map((c, k) => ({ k, vis: true, al: 0, tal: 1, dm: 1, sx: 0, tsx: 0, rr: 0, trr: 0 }));
    this.X0 = new Float32Array(K * nP); this.X1 = new Float32Array(K * nP); this.tX0 = new Float32Array(K * nP); this.tX1 = new Float32Array(K * nP); this.Y = new Float32Array(nP); this.tY = new Float32Array(nP);
    this.ord = []; this.allOrd = []; this.tot = new Float64Array(nP);
    const sr = orgRand(31); this.stars = Array.from({ length: 70 }, () => [sr(), sr(), 0.5 + sr() * 1.1, 0.12 + sr() * 0.35]);
    this.layout(); this.snapPos();
  }
  /* ---------- estado ---------- */
  setState(p) { const q = p || {}; this.patch({ cats: q.cats !== undefined ? q.cats : null, range: q.range || [0, this.nP - 1], order: q.order || 'edges', mode: q.mode || 'abs', spot: q.spot !== undefined ? q.spot : null }); }
  patch(p) {
    if (p.cats !== undefined) this.st.cats = p.cats ? new Set(p.cats) : null;
    if (p.range) this.st.range = p.range.slice();
    if (p.order) this.st.order = p.order; if (p.mode) this.st.mode = p.mode;
    if (p.spot !== undefined) this.spot = p.spot;
    this.layout(); this.kick();
  }
  getState() { return { cats: this.st.cats ? [...this.st.cats] : null, range: this.st.range.slice(), order: this.st.order, mode: this.st.mode, spot: this.spot }; }
  catOf(id) { return typeof id === 'number' ? id : typeof id === 'string' && id[0] === 's' ? +id.slice(1) : -1; }
  setHover(id) { const np = typeof id === 'number' ? this.pHit : null, ch = id !== this.hoverId || np !== this.hoverP; this.pHit = null; this.hoverId = id; this.hoverP = np; if (ch) this.kick(); }
  resize(w, h, dpr) { this.w = w; this.h = h; this.dpr = dpr || 1; this.layout(); this.snapPos(); this.kick(); }
  snapPos() { this.X0.set(this.tX0); this.X1.set(this.tX1); this.Y.set(this.tY); for (const c of this.C) { c.al = c.tal; c.sx = c.tsx; c.rr = c.trr; } }
  snap() { this.snapPos(); this.updateDim(0, true); this.grow = 1; this.moving = false; this.dirty = true; }
  /* ---------- layout ---------- */
  layout() {
    const { D, st, C, K, nP } = this, W = this.w, H = this.h, [a, b] = st.range, ml = 64, mr = 64;
    for (const c of C) { c.vis = !st.cats || st.cats.has(c.k); c.tal = c.vis ? 1 : 0; }
    const rangeTot = D.m.map(row => { let s = 0; for (let p = a; p <= b; p++) s += row[p]; return s; });
    // ordem das faixas: maiores por fora (alternando esquerda e direita), do maior ao menor, ou por nome
    const byTot = C.map(c => c.k).sort((x, y) => rangeTot[y] - rangeTot[x]);
    let ord;
    if (st.order === 'name') ord = C.map(c => c.k).sort((x, y) => D.cats[x].label.localeCompare(D.cats[y].label, LANG === 'pt' ? 'pt-BR' : 'en', { numeric: true }));
    else if (st.order === 'value') ord = byTot;
    else { const L = [], R = []; byTot.forEach((k, i) => (i % 2 ? R : L).push(k)); ord = L.concat(R.reverse()); }
    this.allOrd = ord; this.ord = ord.filter(k => C[k].vis);
    const rmax = orgClamp((W - ml - mr) / (K * 2.3), 11, 32), base = rmax + 16, hh = base + 34, top0 = hh + 24, bot = Math.max(top0 + 60, H - 26), maxRt = Math.max(1e-9, ...rangeTot);
    this.rmax = rmax; this.base = base; this.top0 = top0; this.bot = bot; this.ml = ml; this.mr = mr; this.cx = W / 2; this.slot = (W - ml - mr) / K;
    ord.forEach((k, i) => { C[k].tsx = ml + (i + 0.5) * this.slot; C[k].trr = rmax * Math.sqrt(rangeTot[k] / maxRt); });
    const nV = b - a + 1;
    for (let p = 0; p < nP; p++) this.tY[p] = p < a ? top0 : p > b ? bot : top0 + (p - a) * (bot - top0) / Math.max(1, nV - 1);
    // largura de cada faixa por período
    let maxTot = 1e-9; const abs = st.mode === 'abs';
    for (let p = 0; p < nP; p++) { let s = 0; for (const k of this.ord) s += D.m[k][p]; this.tot[p] = s; if (p >= a && p <= b) maxTot = Math.max(maxTot, s); }
    const maxW = W - ml - mr - 24, cx = W / 2;
    for (let p = 0; p < nP; p++) {
      const wd = k => (abs ? D.m[k][p] / maxTot * maxW : this.tot[p] > 0 ? D.m[k][p] / this.tot[p] * maxW * 0.96 : 0);
      let sum = 0; for (const k of this.ord) sum += wd(k);
      let x = cx - sum / 2;
      for (const k of this.ord) { const w = wd(k), i = k * nP + p; this.tX0[i] = x; this.tX1[i] = x + w; x += w; }
      for (const c of C) if (!c.vis) { const i = c.k * nP + p; this.tX0[i] = this.tX1[i] = cx; }
    }
    this.kick();
  }
  /* ---------- opacidade pelo mouse ---------- */
  updateDim(dt, snap) {
    const focus = this.hovCat >= 0 ? this.hovCat : this.catOf(this.hoverId) >= 0 ? this.catOf(this.hoverId) : this.spot !== null ? this.spot : -1, kd = snap || this.rm ? 1 : 1 - Math.exp(-dt * 11);
    let mv = false;
    for (const c of this.C) { const t = focus >= 0 ? (c.k === focus ? 1 : 0.14) : 1, d = t - c.dm; if (Math.abs(d) > 0.004) { c.dm += d * kd; mv = true; } else c.dm = t; }
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
    if (this.rm) this.grow = 1; else this.grow = Math.min(1, this.grow + dt / RIVER_GROW_S);
    let mv = this.grow < 1; const k = this.rm ? 1 : 1 - Math.exp(-dt * 6.5);
    const adv = (cur, tgt) => { for (let i = 0; i < cur.length; i++) { const d = tgt[i] - cur[i]; if (Math.abs(d) > 0.05) { cur[i] += d * k; mv = true; } else cur[i] = tgt[i]; } };
    adv(this.X0, this.tX0); adv(this.X1, this.tX1); adv(this.Y, this.tY);
    for (const c of this.C) {
      let d = c.tal - c.al; if (Math.abs(d) > 0.004) { c.al += d * k; mv = true; } else c.al = c.tal;
      d = c.tsx - c.sx; if (Math.abs(d) > 0.05) { c.sx += d * k; mv = true; } else c.sx = c.tsx;
      d = c.trr - c.rr; if (Math.abs(d) > 0.05) { c.rr += d * k; mv = true; } else c.rr = c.trr;
    }
    if (this.updateDim(dt, false)) mv = true;
    this.moving = mv;
  }
  /* ---------- desenho ---------- */
  col(k) { return orgCatColor(this.th, k); }
  render() { if (this.ctx) { const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.draw(c); } }
  draw(ctx, opt) {
    const { th, D, C, nP, cx } = this, fg = th.fg, base = th.base, W = this.w, H = this.h, [a, b] = this.st.range;
    if (!opt || opt.clear !== false) ctx.clearRect(0, 0, W, H);
    const [br, bg2, bb] = hexToRgb(base), gr = orgStage(this.grow, 0, 0.85), fr = orgStage(this.grow, 0, 0.3), wf = 0.2 + 0.8 * orgStage(this.grow, 0, 0.55);
    if (br + bg2 + bb < 330) { ctx.fillStyle = rgba(fg, 1); for (const s of this.stars) { ctx.globalAlpha = s[3] * fr; ctx.beginPath(); ctx.arc(s[0] * W, s[1] * H, s[2], 0, ORG_TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    const fx = x => cx + (x - cx) * wf, focus = this.hovCat >= 0 ? this.hovCat : this.catOf(this.hoverId) >= 0 ? this.catOf(this.hoverId) : this.spot !== null ? this.spot : -1;
    const hp = typeof this.hoverId === 'string' && this.hoverId[0] === 'p' ? +this.hoverId.slice(1) : this.hoverP;
    // linhas do tempo: pontilhadas, com o período à esquerda e o total à direita
    const nV = b - a + 1, every = Math.max(1, Math.ceil(nV / Math.max(2, Math.floor((this.bot - this.top0) / 17)))), fmt = v => fmtNum(v, D.unit, LANG);
    ctx.textBaseline = 'middle'; ctx.font = `500 10.5px ${th.font}`; ctx.lineWidth = 1;
    for (let p = a; p <= b; p++) {
      const y = this.Y[p], on = p === hp; if (!on && (p - a) % every !== 0 && p !== b) continue;
      ctx.setLineDash([2, 5]); ctx.strokeStyle = rgba(fg, (on ? 0.5 : 0.13) * gr); ctx.beginPath(); ctx.moveTo(this.ml - 4, y); ctx.lineTo(this.w - this.mr + 4, y); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = `${on ? 700 : 500} 10.5px ${th.font}`; ctx.textAlign = 'right'; ctx.fillStyle = rgba(fg, (on ? 1 : 0.6) * gr); ctx.fillText(D.periods[p].label, this.ml - 10, y);
      ctx.textAlign = 'left'; ctx.fillStyle = rgba(fg, (on ? 0.95 : 0.45) * gr); ctx.fillText(fmt(this.tot[p]), this.w - this.mr + 10, y);
    }
    // faixas: as apagadas primeiro, a destacada por último
    const order = this.allOrd.filter(k => C[k].al > 0.02 && k !== focus); if (focus >= 0 && C[focus].al > 0.02) order.push(focus);
    ctx.save(); ctx.beginPath(); ctx.rect(0, this.top0 - 6, W, (this.bot - this.top0 + 12) * gr + 1); ctx.clip();
    for (const k of order) {
      const c = C[k], col = this.col(k), al = c.al * c.dm, o = k * nP;
      ctx.beginPath();
      for (let p = 0; p < nP; p++) { const x = fx(this.X0[o + p]), y = this.Y[p]; if (!p) ctx.moveTo(x, y); else { const py = this.Y[p - 1], ym = (py + y) / 2; ctx.bezierCurveTo(fx(this.X0[o + p - 1]), ym, x, ym, x, y); } }
      for (let p = nP - 1; p >= 0; p--) { const x = fx(this.X1[o + p]), y = this.Y[p]; if (p === nP - 1) ctx.lineTo(x, y); else { const ny = this.Y[p + 1], ym = (ny + y) / 2; ctx.bezierCurveTo(fx(this.X1[o + p + 1]), ym, x, ym, x, y); } }
      ctx.closePath();
      ctx.fillStyle = rgba(col, 0.86 * al); ctx.fill(); ctx.strokeStyle = rgba(base, 0.55 * al); ctx.lineWidth = 1; ctx.stroke();
      if (k === focus) { ctx.strokeStyle = rgba(fg, 0.9); ctx.lineWidth = 1.4; ctx.stroke(); }
    }
    ctx.restore();
    // nome da faixa onde ela é mais larga (se couber)
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const k of this.ord) {
      const c = C[k], o = k * nP; let bp = a, bw = 0; for (let p = Math.min(b, a + 1); p <= Math.max(a, b - 1); p++) { const w = this.X1[o + p] - this.X0[o + p]; if (w > bw) { bw = w; bp = p; } }
      const lab = raysTrunc(D.cats[k].label, 22); ctx.font = `600 11px ${th.font}`;
      if (bw * wf < ctx.measureText(lab).width + 12) continue;
      ctx.fillStyle = rgba(readableOn(this.col(k)), orgClamp((gr - 0.6) / 0.4) * c.al * c.dm); ctx.fillText(lab, fx((this.X0[o + bp] + this.X1[o + bp]) / 2), this.Y[bp]);
    }
    // valor da faixa destacada no período sob o mouse
    if (focus >= 0 && hp !== null && hp >= a && hp <= b && C[focus].vis) {
      const o = focus * nP + hp, x1 = fx(this.X1[o]), y = this.Y[hp], v = fmt(D.m[focus][hp]);
      ctx.fillStyle = rgba(fg, 1); ctx.beginPath(); ctx.arc(fx((this.X0[o] + this.X1[o]) / 2), y, 3.4, 0, ORG_TAU); ctx.fill();
      ctx.textAlign = 'left'; ctx.font = `700 12px ${th.font}`; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(base, 0.92); ctx.strokeText(v, x1 + 8, y); ctx.fillStyle = rgba(fg, 1); ctx.fillText(v, x1 + 8, y);
    }
    // semicírculos: total de cada categoria no intervalo (área proporcional); as filtradas ficam só no contorno
    const by = this.base; ctx.strokeStyle = rgba(fg, 0.2 * fr); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(this.ml - 4, by); ctx.lineTo(this.w - this.mr + 4, by); ctx.stroke();
    for (const k of this.allOrd) {
      const c = C[k], col = this.col(k), on = c.vis, dm = focus >= 0 ? (k === focus ? 1 : 0.2) : 1, rr = Math.max(1.5, c.rr * fr);
      ctx.beginPath(); ctx.arc(c.sx, by, rr, Math.PI, 0); ctx.closePath();
      if (on) { ctx.fillStyle = rgba(col, 0.9 * dm * fr); ctx.fill(); } else { ctx.setLineDash([2, 3]); ctx.strokeStyle = rgba(col, 0.55 * fr); ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]); }
      if (k === focus) { ctx.strokeStyle = rgba(fg, 0.95); ctx.lineWidth = 1.4; ctx.stroke(); }
      const sw = this.slot - 8, lab = raysTrunc(D.cats[k].label, Math.max(4, Math.floor(sw / 6.2)));
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = `${k === focus ? 700 : 500} 10.5px ${th.font}`; ctx.fillStyle = rgba(fg, (on ? 0.85 : 0.4) * dm * fr); ctx.fillText(lab, c.sx, by + 7);
      ctx.font = `400 10px ${th.font}`; ctx.fillStyle = rgba(fg, (on ? 0.55 : 0.3) * dm * fr); ctx.fillText(fmt(this.rangeTotal(k)), c.sx, by + 21);
    }
    ctx.textBaseline = 'middle';
  }
  rangeTotal(k) { let s = 0; for (let p = this.st.range[0]; p <= this.st.range[1]; p++) s += this.D.m[k][p]; return s; }
  /* ---------- seleção com o mouse ---------- */
  pick(mx, my) {
    const { C, nP } = this, [a, b] = this.st.range;
    if (my < this.top0 - 8) {
      if (my > this.base + 30) return null;
      for (const k of this.allOrd) { const c = C[k], dx = mx - c.sx; if (Math.abs(dx) <= Math.max(this.slot / 2 - 2, 8) && my >= this.base - c.rr - 4) { if (my <= this.base + 32) return 's' + k; } }
      return null;
    }
    if (my > this.bot + 8) return null;
    let pi = a, bd = 1e9; for (let p = a; p <= b; p++) { const d = Math.abs(this.Y[p] - my); if (d < bd) { bd = d; pi = p; } }
    if (mx < this.ml - 2 || mx > this.w - this.mr + 2) return bd < 14 ? 'p' + pi : null;
    for (const k of this.ord) { if (C[k].al < 0.3) continue; const i = k * nP + pi; if (mx >= this.X0[i] && mx <= this.X1[i]) { this.pHit = pi; return k; } }
    return null;
  }
  // totais do que está visível (painel, cartão, lista)
  stats() {
    const { D, C } = this, [a, b] = this.st.range, tot = D.cats.map((_, k) => this.rangeTotal(k)), ptot = D.periods.map((_, p) => D.m.reduce((s, row, k) => s + (C[k].vis ? row[p] : 0), 0));
    const ids = C.filter(c => c.vis).map(c => c.k).sort((x, y) => tot[y] - tot[x]), grand = ids.reduce((s, k) => s + tot[k], 0);
    return { tot, ptot, ids, rank: new Map(ids.map((k, i) => [k, i + 1])), grand, a, b };
  }
}

/* ---------------- interface ---------------- */
function renderRiver(P, el) {
  if (el._org) el._org.destroy();
  const D = csBuilt(P, 'river'), lang = LANG;
  if (!D) { el.innerHTML = `<div class="noins">${T('river_none')}</div>`; return null; }
  const fmt = v => fmtNum(v, D.unit, lang), nP = D.periods.length, nK = D.cats.length, aggL = `${T('cs_aggs')[D.agg]} · ${D.valName}`, perBase = D.perName.replace(/ \(.*\)$/, '');
  const sideHtml = `<div class="orgblk"><div class="orgcap">${T('river_range')}</div><div class="orgrange"><span id="orl0"></span><span id="orl1"></span></div><div class="orgsl"><input type="range" id="orA" min="0" max="${nP - 1}" value="0" aria-label="${T('zoom_from')}"><input type="range" id="orB" min="0" max="${nP - 1}" value="${nP - 1}" aria-label="${T('zoom_to')}"></div></div>
    <div class="orgblk"><div class="orgcap">${esc(D.catName)}</div><div class="orgleg" id="orgleg"></div><button class="orgall" id="orgall">${T('org_all')}</button></div>
    <div class="orgblk"><div class="orgcap">${T('river_order')}</div><select class="rsel" id="rvord" aria-label="${T('river_order')}">${[['edges', 'ro_edges'], ['value', 'ro_value'], ['name', 'ro_name']].map(([v, k]) => `<option value="${v}">${T(k)}</option>`).join('')}</select>
      <div class="orgcap" style="margin-top:6px">${T('river_mode')}</div><select class="rsel" id="rvmode" aria-label="${T('river_mode')}">${[['abs', 'rm_abs'], ['share', 'rm_share']].map(([v, k]) => `<option value="${v}">${T(k)}</option>`).join('')}</select></div>
    <div class="orgblk"><div class="orgcap">${T('river_rank')}</div><div class="orgrank" id="orgrank"></div></div>
    <p class="orgfoot">${D.neg ? T('river_neg') + '.' : T('river_all')}</p>`;
  let eng = null, S = null; const stats = () => S || (S = eng.stats());
  const pct = (x, t) => fmtPct(t ? x / t * 100 : 0, lang).replace('+', '');
  const catModel = (k, pIdx) => {
    const s = stats(), c = D.cats[k], [a, b] = eng.st.range, left = [], tk = s.tot[k];
    if (pIdx !== null && pIdx >= a && pIdx <= b) {
      const v = D.m[k][pIdx]; left.push([perBase, D.periods[pIdx].label], [T('rv_in'), fmt(v)]);
      if (s.ptot[pIdx] > 0 && eng.C[k].vis) left.push([T('rv_inshare'), pct(v, s.ptot[pIdx])]);
      if (pIdx > a && D.m[k][pIdx - 1] > 0) left.push([T('rv_vsprev'), fmtPct((v / D.m[k][pIdx - 1] - 1) * 100, lang)]);
    }
    if (eng.C[k].vis && s.grand > 0) left.push([T('rv_share'), pct(tk, s.grand)]);
    if (s.rank.get(k)) left.push([T('rv_pos'), T('rays_of', s.rank.get(k), s.ids.length)]);
    let pk = a; for (let p = a; p <= b; p++) if (D.m[k][p] > D.m[k][pk]) pk = p;
    left.push([T('rv_peak'), `${D.periods[pk].label} · ${fmt(D.m[k][pk])}`]);
    const f = D.m[k][a], l = D.m[k][b]; if (b > a && f > 0) left.push([T('rv_change'), fmtPct((l / f - 1) * 100, lang)]);
    let rows = 0; for (let p = a; p <= b; p++) rows += D.cn[k][p]; left.push([T('rv_rows'), fmtInt(rows, lang)]);
    return { key: 'c' + k + 'p' + (pIdx === null ? '' : pIdx), kick: D.catName, kickColor: eng.col(k), title: c.label, value: fmt(tk), vlabel: aggL + ' · ' + T('rv_total').toLowerCase(), left, texts: [] };
  };
  const perModel = p => {
    const s = stats(), left = [], tp = s.ptot[p], top = s.ids.map(k => [k, D.m[k][p]]).sort((x, y) => y[1] - x[1]).slice(0, 6);
    if (p > 0 && s.ptot[p - 1] > 0) left.push([T('rv_vsprev'), fmtPct((tp / s.ptot[p - 1] - 1) * 100, lang)]);
    top.forEach(([k, v]) => left.push([D.cats[k].label, `${fmt(v)} · ${pct(v, tp)}`]));
    return { key: 'p' + p, kick: perBase, title: D.periods[p].label, value: fmt(tp), vlabel: aggL, left, texts: [] };
  };
  const model = id => (typeof id === 'string' && id[0] === 'p' ? perModel(+id.slice(1)) : catModel(eng.catOf(id), typeof id === 'number' ? eng.hoverP : null));
  const overview = () => {
    const s = stats(), [a, b] = eng.st.range, left = [[T('river_ov_n'), fmtInt(s.ids.length, lang)]];
    let hi = a, lo = a; for (let p = a; p <= b; p++) { if (s.ptot[p] > s.ptot[hi]) hi = p; if (s.ptot[p] < s.ptot[lo]) lo = p; }
    left.push([T('river_ov_peak'), `${D.periods[hi].label} · ${fmt(s.ptot[hi])}`], [T('river_ov_low'), `${D.periods[lo].label} · ${fmt(s.ptot[lo])}`]);
    if (s.ids.length) left.push([T('river_ov_lead'), `${D.cats[s.ids[0]].label} · ${pct(s.tot[s.ids[0]], s.grand)}`]);
    return { key: 'ov', kick: T('card_overview'), title: `${D.periods[a].label} – ${D.periods[b].label}`, value: fmt(s.grand), vlabel: aggL, left, texts: [], hint: T('river_ov_hint') };
  };
  const toggleCat = k => { const cur = eng.st.cats ? new Set(eng.st.cats) : new Set(D.cats.map((_, i) => i)); if (!eng.st.cats) { cur.clear(); cur.add(k); } else cur.has(k) ? cur.delete(k) : cur.add(k); eng.patch({ cats: !cur.size || cur.size === nK ? null : [...cur] }); };
  const h = {
    model, overview,
    listItems() {
      const st = eng.st, s = stats(), sig = JSON.stringify([st.cats ? [...st.cats].sort() : null, st.range, st.mode]);
      const items = s.ids.map(k => ({ id: k, title: D.cats[k].label, sub: `${pct(s.tot[k], s.grand)} · ${T('rv_peak')} ${(() => { let pk = st.range[0]; for (let p = st.range[0]; p <= st.range[1]; p++) if (D.m[k][p] > D.m[k][pk]) pk = p; return D.periods[pk].label; })()}`, color: eng.col(k), val: fmt(s.tot[k]), v: s.tot[k], ord: k }));
      return { sig, items, sorts: ['v', 'n', 'o'], sort: 'v' };
    },
    visible: id => (typeof id === 'string' && id[0] === 'p' ? +id.slice(1) >= eng.st.range[0] && +id.slice(1) <= eng.st.range[1] : eng.C[eng.catOf(id)].vis),
    side(side0) {
      S = null; const s = stats(), st = eng.st, $ = q => side0.querySelector(q);
      $('#orl0').textContent = D.periods[st.range[0]].label; $('#orl1').textContent = D.periods[st.range[1]].label;
      $('#orgleg').innerHTML = D.cats.map((c, i) => `<button class="orgc" data-c="${i}" data-n="${fmt(s.tot[i])}" aria-pressed="${!st.cats || st.cats.has(i)}" style="--c:${eng.col(i)}"><i></i><span>${esc(c.label)}</span></button>`).join('');
      const top = s.ids.slice(0, 10), mx = Math.max(1e-9, ...top.map(k => s.tot[k]));
      $('#orgrank').innerHTML = top.map(k => `<div class="orgr" data-e="${k}"><div class="orgrb"><div class="orgrs" style="width:${Math.max(3, s.tot[k] / mx * 100)}%"><i style="flex:1;background:${eng.col(k)}"></i></div></div><span>${esc(D.cats[k].label)}</span><b>${esc(fmt(s.tot[k]))}</b></div>`).join('');
    },
    syncSide(side0, e) { const q = x => side0.querySelector(x); q('#orA').value = e.st.range[0]; q('#orB').value = e.st.range[1]; q('#rvord').value = e.st.order; q('#rvmode').value = e.st.mode; },
    bindSide(side0, c) {
      const { eng: e, refresh, ctip } = c, q = x => side0.querySelector(x);
      side0.addEventListener('click', ev => { const b = ev.target.closest('.orgc'), a = ev.target.closest('#orgall'); if (b) { toggleCat(+b.dataset.c); refresh(); } else if (a) { e.patch({ cats: null }); refresh(); } });
      const onRange = () => { let a = +q('#orA').value, b = +q('#orB').value; if (a > b) { if (document.activeElement === q('#orA')) { b = a; q('#orB').value = b; } else { a = b; q('#orA').value = a; } } e.patch({ range: [a, b] }); refresh(); };
      q('#orA').addEventListener('input', onRange); q('#orB').addEventListener('input', onRange);
      side0.addEventListener('change', ev => { if (ev.target.id === 'rvord') { e.patch({ order: ev.target.value }); refresh(); } else if (ev.target.id === 'rvmode') { e.patch({ mode: ev.target.value }); refresh(); } });
      side0.addEventListener('mouseover', ev => {
        const b = ev.target.closest('.orgc'), r = ev.target.closest('.orgr[data-e]');
        e.hovGrp = -1; e.hovCat = b ? +b.dataset.c : -1; e.kick(); if (r) c.hover(+r.dataset.e);
        if (b) { const rc = b.getBoundingClientRect(); ctip.textContent = b.dataset.n; ctip.hidden = false; ctip.style.left = Math.round(rc.left + 6) + 'px'; ctip.style.top = Math.round(rc.top - 26) + 'px'; }
      });
      side0.addEventListener('mouseout', ev => { if (ev.target.closest('.orgc')) { e.hovCat = -1; e.kick(); ctip.hidden = true; } if (ev.target.closest('.orgr[data-e]')) c.hover(null); });
    },
    onClick(id, pickItem) { if (typeof id === 'string' && id[0] === 's') { toggleCat(+id.slice(1)); ctlRef.refresh(); return true; } return false; },
    tour({ stage, side0, eng: e, piece, tools }) {
      const sr = csBox(stage.getBoundingClientRect()), c2 = piece && piece.querySelector('#pc2'), cardBox = c2 ? csPad(csBox(c2.getBoundingClientRect()), 6) : sr;
      const blks = [...side0.querySelectorAll('.orgblk')].slice(0, 2).map(b => csBox(b.getBoundingClientRect()));
      const u = blks.reduce((a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), x2: Math.max(a.x2, b.x + b.w), y2: Math.max(a.y2, b.y + b.h) }), { x: 1e9, y: 1e9, x2: 0, y2: 0 });
      return [{ k: 1, t: csPad(sr, -6) }, { k: 2, t: cardBox, demo: 0 }, { k: 3, t: csPad({ x: u.x, y: u.y, w: u.x2 - u.x, h: u.y2 - u.y }, 8) }, { k: 4, t: csPad(csBox(tools.getBoundingClientRect()), 8) }];
    },
  };
  let ctlRef = null;
  eng = new RiverEngine(D, orgTheme(P), { rm: RM });
  ctlRef = csMount(P, el, { id: 'river', sideHtml, tutPrefix: 'tut_river_', tutKey: RIVER_TUT_KEY }, () => eng, h);
  return ctlRef;
}
function riverSteps(P) {
  const D = csBuilt(P, 'river'), out = []; if (!D) return out;
  const tot = D.cats.reduce((a, c) => a + c.v, 0), nP = D.periods.length, fmt = v => fmtNum(v, D.unit, LANG);
  D.cats.map((c, k) => k).slice(0, 6).forEach(k => out.push({ id: 'c' + k, caption: `${D.cats[k].label} · ${fmtPct(tot ? D.cats[k].v / tot * 100 : 0, LANG).replace('+', '')} · ${fmt(D.cats[k].v)}`, state: { cs: { spot: k } } }));
  if (nP >= 8) { const mid = Math.floor(nP / 2); out.push({ id: 'h1', caption: `${D.periods[0].label} – ${D.periods[mid - 1].label}`, state: { cs: { range: [0, mid - 1] } } }, { id: 'h2', caption: `${D.periods[mid].label} – ${D.periods[nP - 1].label}`, state: { cs: { range: [mid, nP - 1] } } }); }
  return out;
}
function riverDrawStatic(P, ctx, x, y, w, h, state) {
  const D = csBuilt(P, 'river'); if (!D) return;
  const eng = new RiverEngine(D, orgTheme(P), { rm: true });
  eng.resize(w, h, 1); eng.setState(state); eng.snap();
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); eng.draw(ctx, { clear: false }); ctx.restore(); eng.stop();
}
regChart({
  id: 'river', suggest: riverSuggest, build: riverBuild, fit: riverFit, insights: riverInsights, render: renderRiver, steps: riverSteps, drawStatic: riverDrawStatic, note: riverNote,
  fields: [{ k: 'period', label: 'river_per', role: 'period' }, { k: 'cat', label: 'river_cat', role: 'dim' }, { k: 'value', label: 'river_val', role: 'measure', none: 'org_rowsopt' }, { k: 'agg', role: 'agg', aggs: ['sum', 'count'] }],
  names: b => ({ period: b.perName.replace(/ \(.*\)$/, ''), cat: b.catName, value: ['Linhas', 'Rows'].includes(b.valName) ? null : b.valName }),
  summary: b => T('river_sum', fmtInt(b.periods.length, LANG), b.cats.length),
});
