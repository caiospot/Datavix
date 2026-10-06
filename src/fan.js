/* Datavix: Leque de barras. Cada item é uma barra que sai de um eixo estreito (à direita) e se abre em leque:
 * comprimento = valor, cor = categoria. Feito para centenas de itens (até 1500). Desenho próprio em canvas. */
const FAN_MAX = 1500, FAN_GROW_S = 2.6, FAN_TUT_KEY = 'dv-fan-tutorial';

/* ---------------- dados ---------------- */
function fanSuggest(cols) {
  const value = bestMeasure(cols); if (value < 0) return null;
  const n = Math.max(0, ...cols.map(csColRows)); if (n < 12) return null;
  const lab = cols.map((c, i) => i).filter(i => csIsEntCol(cols[i]) && csDistinct(cols[i]) >= 12 && csDistinct(cols[i]) / n >= 0.6).sort((a, b) => csDistinct(cols[b]) - csDistinct(cols[a]))[0];
  const cat = cols.map((c, i) => i).filter(i => i !== lab && (cols[i].kind === 'category' || cols[i].kind === 'geo') && cols[i].codes && csAvgLen(cols[i]) <= 45 && distinctOf(cols[i]) >= 2 && distinctOf(cols[i]) <= 12)
    .sort((a, b) => Math.abs(distinctOf(cols[a]) - 6) - Math.abs(distinctOf(cols[b]) - 6))[0];
  const vc = cols[value];
  return { label: lab === undefined ? -1 : lab, value, cat: cat === undefined ? -1 : cat, agg: vc.unit === '%' || RAYS_AVG_HINT.test(vc.name) ? 'mean' : 'sum' };
}
function fanBuild(ds, m, opts) {
  if (!m || m.value < 0) return null;
  const cols = ds.columns, n = ds.rowCount, lang = opts.lang || 'pt', policy = opts.nullPolicy || 'ignore';
  const vc = cols[m.value], lc = m.label >= 0 ? cols[m.label] : null, cc = m.cat >= 0 && cols[m.cat] && cols[m.cat].codes ? cols[m.cat] : null;
  if (!vc || !isMeasure(vc) || (lc && !csIsEntCol(lc))) return null;
  const agg = m.agg === 'mean' || m.agg === 'count' ? m.agg : 'sum', lab = lc ? csLabeler(lc) : null, acc = new Map(); let used = 0;
  const rowName = lang === 'en' ? 'Row' : 'Linha';
  for (let i = 0; i < n; i++) {
    let v = vc.data[i]; if (Number.isNaN(v)) { if (policy === 'zero') v = 0; else continue; }
    const l = lab ? lab(i) : `${rowName} ${i + 2}`; if (!l) continue;
    let a = acc.get(l); if (!a) { a = { l, sum: 0, n: 0, g: new Map(), best: -1, bv: -1, ord: acc.size }; acc.set(l, a); }
    a.sum += v; a.n++; used++;
    if (cc) { const g = cc.codes[i]; a.g.set(g, (a.g.get(g) || 0) + 1); }
    if (Math.abs(v) > a.bv) { a.bv = Math.abs(v); a.best = i; }
  }
  const all = [...acc.values()].map(a => ({ ...a, v: agg === 'mean' ? a.sum / a.n : agg === 'count' ? a.n : a.sum }));
  if (all.length < 8) return null;
  const kept = all.length > FAN_MAX ? all.slice().sort((x, y) => Math.abs(y.v) - Math.abs(x.v)).slice(0, FAN_MAX).sort((x, y) => x.ord - y.ord) : all;
  const cats = []; const OTH = lang === 'en' ? 'Others' : 'Outros', NOC = lang === 'en' ? 'No category' : 'Sem categoria';
  if (cc) {
    const tot = new Map();
    for (const a of kept) { let bg = -1, bc = 0; a.g.forEach((c, g) => { if (c > bc || (c === bc && g < bg)) { bc = c; bg = g; } }); a.gc = bg; tot.set(bg, (tot.get(bg) || 0) + Math.abs(a.v)); }
    const ord = [...tot].sort((x, y) => y[1] - x[1]).map(x => x[0]), named = ord.filter(g => g >= 0), keep = named.slice(0, 11), gi = new Map(keep.map((g, i) => [g, i]));
    keep.forEach(g => cats.push({ label: cc.dict[g], v: 0, n: 0 }));
    const oth = named.length > 11 ? cats.push({ label: OTH, v: 0, n: 0 }) - 1 : -1, none = ord.includes(-1) ? cats.push({ label: NOC, v: 0, n: 0 }) - 1 : -1;
    for (const a of kept) a.gi = a.gc < 0 ? none : gi.has(a.gc) ? gi.get(a.gc) : oth;
  } else for (const a of kept) a.gi = -1;
  const det = orgDetailFields(cols, { hub: -1, entity: m.label, color: m.cat, size: m.value, details: m.details }, n);
  const items = kept.map(a => { if (a.gi >= 0) { cats[a.gi].v += a.v; cats[a.gi].n++; } return { label: a.l, v: a.v, g: a.gi, n: a.n, ord: a.ord, d: det.idx.length && a.best >= 0 ? det.idx.map((ci, k) => orgCell(cols[ci], a.best, det.fields[k].long ? det.cap.long : det.cap.short, lang)) : null }; });
  return { labName: lc ? lc.name : (lang === 'en' ? 'Rows' : 'Linhas'), valName: vc.name, catName: cc ? cc.name : null, unit: vc.unit, agg, items, cats, fields: det.fields, rowsTotal: n, rowsUsed: used, itemsTotal: all.length, hasLabel: !!lc, neg: items.some(e => e.v < 0) };
}
function fanFit(built) {
  const D = csBuilt({ built }, 'fan'); if (!D) return 0;
  // só lidera quando os itens são identificados por uma coluna (um pedido, um produto); linhas anônimas ficam como opção
  return D.hasLabel && D.itemsTotal >= 150 ? 0.93 : D.itemsTotal >= 60 ? 0.5 : 0.3;
}
function fanNote(P) {
  const D = csBuilt(P, 'fan'); if (!D) return '';
  return T('fan_note', D.items.length, D.itemsTotal, T('cs_aggs')[D.agg].toLowerCase(), D.valName, D.labName) + (D.neg ? ' ' + T('fan_neg') + '.' : '');
}
function fanInsights(D, briefing, lang, T) {
  const tot = D.items.map(e => ({ label: e.label, value: e.v, rows: e.n })), gs = D.cats.map(g => ({ label: g.label, value: g.v, rows: g.n }));
  return computeInsights({ kind: 'category', names: { x: D.labName, y: D.valName, s: D.catName }, unit: D.unit, aggKind: D.agg, totX: tot, totS: gs.length > 1 ? gs : null, xIsTime: false, stats: {} }, briefing, lang, T);
}

/* ---------------- motor ---------------- */
class FanEngine {
  constructor(D, th, opt = {}) {
    this.D = D; this.th = th; this.rm = !!opt.rm; this.st = { cats: null, top: null, sort: 'orig' };
    this.hoverId = null; this.hovCat = -1; this.spot = null;
    this.w = 800; this.h = 600; this.dpr = 1; this.grow = 0; this.moving = true; this.dirty = true; this._lt = 0;
    this.cx = 0; this.axisX = 600; this.cy = 300; this.Ha = 100; this.A = 1; this.Lmax = 400; this.Dc = 200; this.xr = 400; this.kc = 0.3; this.top = 36; this.Hx = 500; this.vmax = 1; this.lw = 1; this.nVis = 0; this.mr = 150;
    const rnd = orgRand(23);
    this.N = D.items.map((e, i) => ({ i, e, g: e.g, y: 0, ty: 0, len: 0, tlen: 0, al: 0, tal: 0, hold: 0, rt: 0.8 + rnd() * 0.5, dm: 1, jit: rnd(), vis: false, pos: 0, gd: 0, gdSet: false }));
    const sr = orgRand(31); this.stars = Array.from({ length: 70 }, () => [sr(), sr(), 0.5 + sr() * 1.1, 0.12 + sr() * 0.35]);
    this.layout(); this.snapPos();
  }
  setState(p) { const q = p || {}; this.patch({ cats: q.cats !== undefined ? q.cats : null, top: q.top !== undefined ? q.top : null, sort: q.sort || 'orig', spot: q.spot !== undefined ? q.spot : null }); }
  patch(p) {
    if (p.cats !== undefined) this.st.cats = p.cats ? new Set(p.cats) : null;
    if (p.top !== undefined) this.st.top = p.top; if (p.sort) this.st.sort = p.sort; if (p.spot !== undefined) this.spot = p.spot;
    this.layout(); this.kick();
  }
  getState() { return { cats: this.st.cats ? [...this.st.cats] : null, top: this.st.top, sort: this.st.sort, spot: this.spot }; }
  setHover(id) { if (this.hoverId === id) return; this.hoverId = id; this.kick(); }
  resize(w, h, dpr) { this.w = w; this.h = h; this.dpr = dpr || 1; this.layout(); this.snapPos(); this.kick(); }
  snapPos() { for (const n of this.N) { n.y = n.ty; n.len = n.tlen; n.al = n.tal; n.hold = 0; } }
  snap() { this.snapPos(); this.updateDim(0, true); this.grow = 1; this.moving = false; this.dirty = true; }
  layout() {
    const { st, N, D } = this, W = this.w, H = this.h, ml = 24, mr = Math.min(170, Math.max(110, W * 0.16));
    let vis = N.filter(n => !st.cats || st.cats.has(n.g));
    if (st.top && st.top < vis.length) vis = vis.slice().sort((a, b) => Math.abs(b.e.v) - Math.abs(a.e.v)).slice(0, st.top);
    const set = new Set(vis); for (const n of N) n.vis = set.has(n); this.nVis = vis.length;
    const loc = LANG === 'pt' ? 'pt-BR' : 'en', cmp = st.sort === 'orig' ? (a, b) => a.e.ord - b.e.ord : st.sort === 'cat' ? (a, b) => a.g - b.g || Math.abs(b.e.v) - Math.abs(a.e.v) : st.sort === 'name' ? (a, b) => a.e.label.localeCompare(b.e.label, loc, { numeric: true }) : (a, b) => Math.abs(b.e.v) - Math.abs(a.e.v);
    const seq = vis.slice().sort(cmp), nV = Math.max(1, seq.length);
    // perspectiva (como no "56 dias de comida"): o eixo é uma coluna alta à direita; cada item sai dele numa diagonal que converge
    // para o centro (abertura de ~90°) e ali vira uma barra horizontal para a esquerda. A largura é dividida na razão áurea:
    // 38,2% de diagonais e 61,8% para o comprimento máximo das barras (todas com a mesma escala, então a proporção entre valores se mantém).
    const Lw = W - mr - ml, top = 36, Hx = Math.max(120, H - top - 22), Dc = Lw * 0.382, Lmax = Lw - Dc;
    const kc = orgClamp(1 - Dc * Math.tan(Math.PI / 4) / (Hx / 2), 0.12, 0.6);
    this.mr = mr; this.axisX = W - mr; this.top = top; this.Hx = Hx; this.cy = top + Hx / 2; this.Dc = Dc; this.xr = this.axisX - Dc; this.kc = kc; this.Lmax = Lmax; this.Ha = Hx; this.A = Math.atan(Hx / 2 * (1 - kc) / Dc);
    let vmax = 1e-9; for (const n of seq) vmax = Math.max(vmax, Math.abs(n.e.v)); this.vmax = vmax;
    this.lw = orgClamp(Hx * kc / nV * 0.9, 0.9, 4.5);
    const prev = new Map(); for (const n of N) prev.set(n, [n.ty, n.tlen, n.tal]);
    seq.forEach((n, j) => { n.ty = top + (j + 0.5) / nV * Hx; n.tlen = Lmax * Math.abs(n.e.v) / vmax; n.tal = 1; n.pos = j; if (!n.gdSet) n.gd = j / nV; });
    for (const n of N) if (!n.vis) { n.tal = 0; n.tlen = 0; if (!n.gdSet) n.gd = n.i / N.length; }
    for (const n of N) n.gdSet = true;
    this.seq = seq;
    const now = performance.now(), burst = now - this._lt < 200; this._lt = now;
    if (!this.rm && !burst) for (const n of N) { const pv = prev.get(n), mv = Math.abs(n.tlen - pv[1]) > 6 || Math.abs(n.ty - pv[0]) > 8 || Math.abs(n.tal - pv[2]) > 0.5; if (mv && n.hold <= 0) n.hold = (n.pos / nV) * 0.3 + n.jit * 0.06; }
    this.kick();
  }
  updateDim(dt, snap) {
    const hv = this.hoverId !== null ? this.N[this.hoverId] : null, sp = this.spot !== null ? this.N[this.spot] : null, kd = snap || this.rm ? 1 : 1 - Math.exp(-dt * 11);
    let mv = false;
    for (const n of this.N) {
      let t = 1;
      if (hv) t = n === hv ? 1 : (n.g === hv.g && n.g >= 0 ? 0.3 : 0.1); else if (this.hovCat >= 0) t = n.g === this.hovCat ? 1 : 0.1; else if (sp) t = n === sp ? 1 : 0.12;
      const d = t - n.dm; if (Math.abs(d) > 0.004) { n.dm += d * kd; mv = true; } else n.dm = t;
    }
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
    if (this.rm) this.grow = 1; else this.grow = Math.min(1, this.grow + dt / FAN_GROW_S);
    let mv = this.grow < 1; const e1 = 1 - Math.exp(-dt * 5.4);
    for (const o of this.N) {
      if (o.hold > 0) { o.hold -= dt; mv = true; continue; }
      const k = this.rm ? 1 : Math.min(1, e1 * o.rt);
      let d = o.ty - o.y; if (Math.abs(d) > 0.02) { o.y += d * k; mv = true; } else o.y = o.ty;
      d = o.tlen - o.len; if (Math.abs(d) > 0.05) { o.len += d * k; mv = true; } else o.len = o.tlen;
      d = o.tal - o.al; if (Math.abs(d) > 0.004) { o.al += d * k; mv = true; } else o.al = o.tal;
    }
    if (this.updateDim(dt, false)) mv = true;
    this.moving = mv;
  }
  col(g) { return g < 0 ? mixHex(this.th.fg, this.th.base, 0.35) : orgCatColor(this.th, g); }
  af() { return orgStage(this.grow, 0, 0.6); }
  prog(n) { return orgEase(orgClamp((this.grow - 0.1 - n.gd * 0.5) / 0.4)); }
  // raiz da barra: a diagonal sai do eixo (y do item) e converge para o centro; na abertura começa sem compressão
  rootY(y) { const ck = 1 - (1 - this.kc) * this.af(); return this.cy + (y - this.cy) * ck; }
  rootX() { return this.axisX - this.Dc * this.af(); }
  tipXY(i) { const n = this.N[i]; return [this.rootX() - n.len * this.prog(n), this.rootY(n.y)]; }
  render() { if (this.ctx) { const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.draw(c); } }
  draw(ctx, opt) {
    const { th, D, N, axisX } = this, fg = th.fg, base = th.base, W = this.w, H = this.h, fr = orgStage(this.grow, 0, 0.3), fmt = v => fmtNum(v, D.unit, LANG);
    if (!opt || opt.clear !== false) ctx.clearRect(0, 0, W, H);
    const [br, bg2, bb] = hexToRgb(base), light = br + bg2 + bb > 450, xr = this.rootX();
    if (br + bg2 + bb < 330) { ctx.fillStyle = rgba(fg, 1); for (const s of this.stars) { ctx.globalAlpha = s[3] * fr; ctx.beginPath(); ctx.arc(s[0] * W, s[1] * H, s[2], 0, ORG_TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    // escala: linhas verticais pontilhadas a partir da raiz (valores reais) e a base em zero
    const ticks = csNiceTicks(this.vmax, 3), band = this.Hx * this.kc, y0 = this.cy - band / 2 - 14, y1 = this.cy + band / 2 + 14;
    ctx.save(); ctx.setLineDash([2, 5]); ctx.lineWidth = 1; ctx.strokeStyle = rgba(fg, 0.2 * fr);
    for (const t of ticks) { const x = xr - this.Lmax * t / this.vmax; ctx.beginPath(); ctx.moveTo(x, y0 + 8); ctx.lineTo(x, y1); ctx.stroke(); }
    ctx.restore(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `500 10px ${th.font}`;
    for (const t of ticks) { const x = xr - this.Lmax * t / this.vmax, s = fmt(t); ctx.fillStyle = rgba(fg, 0.55 * fr); ctx.fillText(s, x, y0); }
    ctx.strokeStyle = rgba(fg, 0.3 * fr); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xr, y0 + 8); ctx.lineTo(xr, y1); ctx.stroke();
    // barras em lotes: uma passada por (categoria, faixa de opacidade); cada item é uma linha quebrada eixo > raiz > ponta
    const hv = this.hoverId !== null ? N[this.hoverId] : null, lw = this.lw, few = this.nVis <= 80, batches = new Map();
    for (const n of N) {
      if (n.al < 0.02 || n === hv) continue;
      const p = this.prog(n), L = n.len * p, yr = this.rootY(n.y), al = n.al * n.dm, q = Math.max(1, Math.round(al * 6)), key = n.g + '|' + q;
      let b = batches.get(key); if (!b) { b = { g: n.g, al: q / 6, path: new Path2D(), dots: [] }; batches.set(key, b); }
      b.path.moveTo(axisX, n.y); b.path.lineTo(xr, yr); if (L > 0.4) { b.path.lineTo(xr - L, yr); if (few) b.dots.push(xr - L, yr); }
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = lw;
    for (const b of batches.values()) {
      const col = this.col(b.g); ctx.strokeStyle = rgba(col, Math.min(1, b.al * (light ? 0.95 : 0.88))); ctx.stroke(b.path);
      if (b.dots.length) { ctx.fillStyle = rgba(col, b.al); for (let i = 0; i < b.dots.length; i += 2) { ctx.beginPath(); ctx.arc(b.dots[i], b.dots[i + 1], lw * 0.9 + 0.5, 0, ORG_TAU); ctx.fill(); } }
    }
    // eixo: coluna alta com nomes (alguns) à direita
    const top = this.top, bot = top + this.Hx;
    ctx.strokeStyle = rgba(fg, 0.5 * fr); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(axisX, top - 6); ctx.lineTo(axisX, bot + 6); ctx.stroke();
    const seq = this.seq || [], k = Math.max(1, Math.ceil(seq.length * 14 / Math.max(1, this.Hx))), maxLab = Math.floor((this.mr - 22) / 6.4);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `500 10.5px ${th.font}`;
    seq.forEach((n, j) => {
      if (j % k !== 0 && n !== hv) return; const y = top + (j + 0.5) / seq.length * this.Hx, on = n === hv;
      ctx.strokeStyle = rgba(fg, 0.45 * fr); ctx.beginPath(); ctx.moveTo(axisX, y); ctx.lineTo(axisX + 5, y); ctx.stroke();
      if (!on) { ctx.fillStyle = rgba(fg, 0.55 * fr * (hv ? 0.4 : 1)); ctx.fillText(raysTrunc(n.e.label, maxLab), axisX + 10, y); }
    });
    // item destacado, por cima: diagonal + barra grossas, nome no eixo, valor na ponta
    if (hv && hv.al > 0.02) {
      const p = this.prog(hv), L = hv.len * p, yr = this.rootY(hv.y), col = this.col(hv.g), x1 = xr - L;
      ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = Math.max(2.4, lw * 1.8); ctx.beginPath(); ctx.moveTo(axisX, hv.y); ctx.lineTo(xr, yr); ctx.lineTo(x1, yr); ctx.stroke();
      ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.arc(x1, yr, Math.max(4, lw * 1.4), 0, ORG_TAU); ctx.fill(); ctx.strokeStyle = rgba(fg, 0.95); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `700 11.5px ${th.font}`; ctx.lineWidth = 4; ctx.lineJoin = 'round';
      const s1 = raysTrunc(hv.e.label, maxLab + 6), s2 = fmt(hv.e.v);
      ctx.strokeStyle = rgba(base, 0.92); ctx.strokeText(s1, axisX + 10, hv.y - 7); ctx.fillStyle = rgba(fg, 1); ctx.fillText(s1, axisX + 10, hv.y - 7);
      ctx.font = `600 11px ${th.font}`; ctx.strokeText(s2, axisX + 10, hv.y + 8); ctx.fillStyle = rgba(col, 1); ctx.fillText(s2, axisX + 10, hv.y + 8);
      ctx.textAlign = 'right'; ctx.strokeStyle = rgba(base, 0.92); ctx.strokeText(s2, x1 - 8, yr); ctx.fillStyle = rgba(fg, 1); ctx.fillText(s2, x1 - 8, yr);
    }
  }
  pick(mx, my) {
    const { N, axisX } = this, xr = this.rootX(); let best = null, bd = 1e9;
    const thr = Math.max(3.5, this.lw * 1.4 + 2), seg = (ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy; let t = l2 ? ((mx - ax) * dx + (my - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(mx - (ax + t * dx), my - (ay + t * dy)); };
    if (mx < axisX - 4) for (const n of N) {
      if (n.al < 0.4) continue;
      const yr = this.rootY(n.y), L = n.len * this.prog(n), d = Math.min(seg(axisX, n.y, xr, yr), L > 0.4 ? seg(xr, yr, xr - L, yr) : 1e9);
      if (d < thr && d < bd) { bd = d; best = n.i; }
    }
    if (best === null && mx >= axisX - 4 && mx <= this.w && this.seq && this.seq.length && my >= this.top - 6 && my <= this.top + this.Hx + 6) { // o eixo e seus nomes
      const j = Math.max(0, Math.min(this.seq.length - 1, Math.floor((my - this.top) / this.Hx * this.seq.length))); best = this.seq[j].i;
    }
    return best;
  }
  stats() {
    const { D } = this, vis = this.N.filter(n => n.vis), ids = vis.map(n => n.i).sort((a, b) => Math.abs(this.N[b].e.v) - Math.abs(this.N[a].e.v)), rank = new Map(ids.map((id, k) => [id, k + 1]));
    const vals = vis.map(n => n.e.v), total = vals.reduce((a, b) => a + b, 0), gt = D.cats.map(() => ({ v: 0, n: 0 })), cr = new Map(), cnt = D.cats.map(() => 0);
    for (const id of ids) { const g = this.N[id].g; if (g >= 0) { cnt[g]++; cr.set(id, cnt[g]); gt[g].v += this.N[id].e.v; gt[g].n++; } }
    return { ids, rank, total, n: vis.length, mean: vis.length ? total / vis.length : 0, median: csMedian(vals), gt, cr };
  }
}

/* ---------------- interface ---------------- */
function renderFan(P, el) {
  if (el._org) el._org.destroy();
  const D = csBuilt(P, 'fan'), lang = LANG;
  if (!D) { el.innerHTML = `<div class="noins">${T('fan_none')}</div>`; return null; }
  const fmt = v => fmtNum(v, D.unit, lang), nE = D.items.length, aggL = `${T('cs_aggs')[D.agg]} · ${D.valName}`, hasCat = D.cats.length > 1;
  const sorts = [['orig', 'fan_s_orig'], ['value', 'fan_s_value'], ...(hasCat ? [['cat', 'fan_s_cat']] : []), ['name', 'fan_s_name']];
  const sideHtml = `${hasCat ? `<div class="orgblk"><div class="orgcap">${esc(D.catName || T('fan_cats'))}</div><div class="orgleg" id="orgleg"></div><button class="orgall" id="orgall">${T('org_all')}</button></div>` : ''}
    <div class="orgblk"><div class="orgcap">${T('fan_sort')}</div><select class="rsel" id="fsort" aria-label="${T('fan_sort')}">${sorts.map(([v, k]) => `<option value="${v}">${T(k)}</option>`).join('')}</select></div>
    ${nE > 12 ? `<div class="orgblk"><div class="orgcap" id="ftopl"></div><input type="range" class="rsl" id="ftop" min="10" max="${nE}" value="${nE}" aria-label="${T('rays_top', '')}"></div>` : ''}
    ${hasCat ? `<div class="orgblk"><div class="orgcap">${T('fan_share')}</div><div class="orgrank" id="rgrp"></div></div>` : ''}
    <div class="orgblk"><div class="orgcap">${T('fan_rank')}</div><div class="orgrank" id="orgrank"></div></div><p class="orgfoot">${T('rays_base')}</p>`;
  let eng = null, S = null; const stats = () => S || (S = eng.stats());
  const model = id => {
    const E = D.items[id], s = stats(), rk = s.rank.get(id), left = [];
    if (D.catName && E.g >= 0) left.push([D.catName, D.cats[E.g].label]);
    if (rk) left.push([T('rays_pos'), T('rays_of', rk, fmtInt(s.n, lang))]);
    if (E.g >= 0 && s.cr.get(id)) left.push([T('rays_pos') + ' · ' + D.cats[E.g].label, T('rays_of', s.cr.get(id), fmtInt(s.gt[E.g].n, lang))]);
    if (D.agg !== 'mean' && s.total !== 0 && rk) left.push([T('rays_pct'), csPct(E.v / s.total * 100, lang)]);
    if (s.mean && rk) left.push([T('rays_vsavg'), fmtPct((E.v / s.mean - 1) * 100, lang)]);
    if (E.n > 1) left.push([T('rays_rows'), fmtInt(E.n, lang)]);
    const texts = []; if (E.d) D.fields.forEach((f, k) => { const v = E.d[k]; if (v) (f.long ? texts : left).push([f.name, v]); });
    return { key: 'f' + id, kick: E.g >= 0 ? D.cats[E.g].label : D.labName, kickColor: E.g >= 0 ? orgCatColor(eng.th, E.g) : null, title: E.label, value: fmt(E.v), vlabel: aggL, left, texts, note: E.n > 1 && E.d ? T('rays_largest') : '' };
  };
  const overview = () => {
    const s = stats(), val = D.agg === 'mean' ? s.mean : s.total, byV = s.ids.map(i => D.items[i]), top = byV[0], low = byV[byV.length - 1], left = [[T('fan_ov_n'), fmtInt(s.n, lang)]];
    if (hasCat) left.push([D.catName, fmtInt(s.gt.filter(g => g.n).length, lang)]);
    if (top) left.push([T('rays_ov_max'), `${top.label} · ${fmt(top.v)}`]); if (low && low !== top) left.push([T('rays_ov_min'), `${low.label} · ${fmt(low.v)}`]);
    left.push([T('rays_ov_avg'), fmt(s.mean)], [T('rays_ov_med'), fmt(s.median)]);
    return { key: 'ov', kick: T('card_overview'), title: D.labName, value: fmt(val), vlabel: aggL, left, texts: [], hint: T('fan_ov_hint') };
  };
  const bars = (items, mx) => items.map(x => `<div class="orgr" data-e="${x.id}"><div class="orgrb"><div class="orgrs" style="width:${Math.max(3, Math.abs(x.v) / mx * 100)}%"><i style="flex:1;background:${x.c}"></i></div></div><span>${esc(x.label)}</span><b>${esc(x.txt)}</b></div>`).join('');
  const h = {
    model, overview,
    listItems() {
      const st = eng.st, sig = JSON.stringify([st.cats ? [...st.cats].sort() : null, st.top]);
      const items = eng.N.filter(n => n.vis).map(n => ({ id: n.i, title: n.e.label, sub: [n.e.g >= 0 ? D.cats[n.e.g].label : '', n.e.n > 1 ? `${fmtInt(n.e.n, lang)} ${T('org_rows')}` : ''].filter(Boolean).join(' · '), color: n.e.g >= 0 ? orgCatColor(eng.th, n.e.g) : null, val: fmt(n.e.v), v: Math.abs(n.e.v), ord: n.e.ord,
        s: () => n.e.label + ' ' + (n.e.g >= 0 ? D.cats[n.e.g].label : '') + ' ' + (n.e.d ? n.e.d.join(' ') : '') }));
      return { sig, items, sorts: ['v', 'n', 'o'], sort: 'v' };
    },
    visible: id => eng.N[id].vis,
    side(side0) {
      S = null; const s = stats(), st = eng.st, $ = q => side0.querySelector(q), leg = $('#orgleg');
      if (leg) leg.innerHTML = D.cats.map((g, i) => `<button class="orgc" data-c="${i}" data-n="${g.n}" aria-pressed="${!st.cats || st.cats.has(i)}" style="--c:${orgCatColor(eng.th, i)}"><i></i><span>${esc(g.label)}</span></button>`).join('');
      const tl = $('#ftopl'); if (tl) tl.textContent = st.top && st.top < nE ? T('rays_top', st.top) : T('rays_topall', nE);
      const top = s.ids.slice(0, 10).map(i => ({ id: i, v: D.items[i].v, label: D.items[i].label, txt: fmt(D.items[i].v), c: eng.col(D.items[i].g) })); $('#orgrank').innerHTML = bars(top, Math.max(1e-9, ...top.map(x => Math.abs(x.v))));
      const gr = $('#rgrp'); if (gr) { const gs = D.cats.map((g, i) => ({ id: 'g' + i, v: s.gt[i].v, label: g.label, txt: fmt(s.gt[i].v), c: orgCatColor(eng.th, i), n: s.gt[i].n })).filter(x => x.n).sort((a, b) => Math.abs(b.v) - Math.abs(a.v)); gr.innerHTML = bars(gs, Math.max(1e-9, ...gs.map(x => Math.abs(x.v)))); }
    },
    syncSide(side0, e) { const a = side0.querySelector('#fsort'), b = side0.querySelector('#ftop'); if (a) a.value = e.st.sort; if (b) b.value = e.st.top || nE; },
    bindSide(side0, c) {
      const { eng: e, refresh, ctip } = c;
      side0.addEventListener('click', ev => {
        const b = ev.target.closest('.orgc'), a = ev.target.closest('#orgall');
        if (b) { const i = +b.dataset.c, cur = e.st.cats ? new Set(e.st.cats) : new Set(D.cats.map((_, k) => k)); if (!e.st.cats) { cur.clear(); cur.add(i); } else cur.has(i) ? cur.delete(i) : cur.add(i); e.patch({ cats: !cur.size || cur.size === D.cats.length ? null : [...cur] }); refresh(); }
        else if (a) { e.patch({ cats: null }); refresh(); }
      });
      side0.addEventListener('input', ev => { if (ev.target.id === 'ftop') { const v = +ev.target.value; e.patch({ top: v >= nE ? null : v }); refresh(); } });
      side0.addEventListener('change', ev => { if (ev.target.id === 'fsort') { e.patch({ sort: ev.target.value }); refresh(); } });
      side0.addEventListener('mouseover', ev => {
        const b = ev.target.closest('.orgc'), r = ev.target.closest('.orgr[data-e]'); e.hovCat = b ? +b.dataset.c : -1; e.kick();
        if (r && /^\d+$/.test(r.dataset.e)) c.hover(+r.dataset.e);
        if (b) { const rc = b.getBoundingClientRect(); ctip.textContent = `${fmtInt(+b.dataset.n, lang)} ${T('rays_items')}`; ctip.hidden = false; ctip.style.left = Math.round(rc.left + 6) + 'px'; ctip.style.top = Math.round(rc.top - 26) + 'px'; }
      });
      side0.addEventListener('mouseout', ev => { if (ev.target.closest('.orgc')) { e.hovCat = -1; e.kick(); ctip.hidden = true; } if (ev.target.closest('.orgr[data-e]')) c.hover(null); });
    },
    tour({ stage, side0, piece, tools }) {
      const sr = csBox(stage.getBoundingClientRect()), c2 = piece && piece.querySelector('#pc2'), cardBox = c2 ? csPad(csBox(c2.getBoundingClientRect()), 6) : sr;
      const blks = [...side0.querySelectorAll('.orgblk')].slice(0, hasCat ? 3 : 2).map(b => csBox(b.getBoundingClientRect()));
      const u = blks.reduce((a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), x2: Math.max(a.x2, b.x + b.w), y2: Math.max(a.y2, b.y + b.h) }), { x: 1e9, y: 1e9, x2: 0, y2: 0 });
      return [{ k: 1, t: csPad(sr, -6) }, { k: 2, t: cardBox, demo: stats().ids[Math.min(8, stats().ids.length - 1)] }, { k: 3, t: csPad({ x: u.x, y: u.y, w: u.x2 - u.x, h: u.y2 - u.y }, 8) }, { k: 4, t: csPad(csBox(tools.getBoundingClientRect()), 8) }];
    },
  };
  eng = new FanEngine(D, orgTheme(P), { rm: RM });
  return csMount(P, el, { id: 'fan', sideHtml, tutPrefix: 'tut_fan_', tutKey: FAN_TUT_KEY }, () => eng, h);
}
function fanSteps(P) {
  const D = csBuilt(P, 'fan'), out = []; if (!D) return out;
  if (D.cats.length > 1 && D.cats.length <= 9) D.cats.forEach((g, i) => out.push({ id: 'g' + i, caption: `${g.label} · ${fmtInt(g.n, LANG)} ${T('rays_items')} · ${fmtNum(g.v, D.unit, LANG)}`, state: { cs: { cats: [i] } } }));
  if (D.items.length > 30) out.push({ id: 'top', caption: T('top_n', Math.max(10, Math.round(D.items.length * 0.1 / 10) * 10)), state: { cs: { top: Math.max(10, Math.round(D.items.length * 0.1 / 10) * 10) } } });
  const big = D.items.reduce((a, e, i) => (Math.abs(e.v) > Math.abs(D.items[a].v) ? i : a), 0);
  out.push({ id: 'spot', caption: `${D.items[big].label} · ${fmtNum(D.items[big].v, D.unit, LANG)}`, state: { cs: { spot: big } } });
  return out;
}
function fanDrawStatic(P, ctx, x, y, w, h, state) {
  const D = csBuilt(P, 'fan'); if (!D) return;
  const eng = new FanEngine(D, orgTheme(P), { rm: true }); eng.resize(w, h, 1); eng.setState(state); eng.snap();
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); eng.draw(ctx, { clear: false }); ctx.restore(); eng.stop();
}
regChart({
  id: 'fan', insights: fanInsights, suggest: fanSuggest, build: fanBuild, fit: fanFit, render: renderFan, steps: fanSteps, drawStatic: fanDrawStatic, note: fanNote,
  fields: [{ k: 'label', label: 'fan_lab', role: 'ent', none: 'fan_rowsopt' }, { k: 'value', label: 'fan_val', role: 'measure' }, { k: 'cat', label: 'fan_cat', role: 'dim', none: 'mp_none' }, { k: 'agg', role: 'agg' }],
  names: b => ({ label: ['Linhas', 'Rows'].includes(b.labName) ? null : b.labName, value: b.valName, cat: b.catName }),
  summary: b => T('fan_sum', fmtInt(b.items.length, LANG), b.cats.length > 1 ? b.cats.length : 0),
});
