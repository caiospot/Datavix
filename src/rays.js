/* Datavix: Raios radiais. Um raio por entidade: comprimento = valor (a partir do círculo central), cor = grupo,
 * degradê que some no centro, rótulo na ponta. Desenho próprio em canvas; os números vêm da planilha (soma, média ou contagem). */
const RAYS_MAX = 150, RAYS_GROW_S = 2.4, RAYS_TUT_KEY = 'dv-rays-tutorial';
const RAYS_AVG_HINT = /m[eé]dia|mean|avg|average|idade|age|taxa|rate|nota|score|nps|[ií]ndice|index|ratio|prazo|tempo|%|percent/i;

/* ---------------- dados ---------------- */
// rótulo de uma célula de entidade (categoria, geo ou texto curto)
function csLabeler(c) {
  if (c.codes) return i => { const k = c.codes[i]; return k < 0 ? '' : String(c.dict[k]); };
  return i => { const t = c.texts && c.texts[i]; return t ? String(t).replace(/\s+/g, ' ').trim() : ''; };
}
const csColRows = c => (c.codes ? c.codes.length : c.data ? c.data.length : c.texts ? c.texts.length : 0);
function csAvgLen(c) {
  if (c.dict) { const d = c.dict, k = Math.min(d.length, 60); if (!k) return 0; let t = 0; for (let i = 0; i < k; i++) t += d[i].length; return t / k; }
  const t = c.texts || []; let tot = 0, k = 0; for (let i = 0; i < t.length && k < 200; i += Math.max(1, Math.floor(t.length / 200))) if (t[i]) { tot += t[i].length; k++; }
  return k ? tot / k : 0;
}
function csDistinct(c) { if (c.dict) return c.dict.length; const s = new Set(), t = c.texts || [], n = Math.min(t.length, 6000); for (let i = 0; i < n; i++) if (t[i]) s.add(t[i]); return s.size; }
const csIsEntCol = c => colUsable(c) && (c.kind === 'category' || c.kind === 'geo' || c.kind === 'text') && csAvgLen(c) <= 40;
// quão "aninhado" é o grupo na entidade: parcela das entidades que pertencem a um único grupo
function csPurity(ec, gc) {
  const le = csLabeler(ec), n = Math.min(csColRows(ec), 6000), m = new Map();
  for (let i = 0; i < n; i++) { const e = le(i), g = gc.codes[i]; if (!e || g < 0) continue; const s = m.get(e); if (s === undefined) m.set(e, g); else if (s !== g && s !== -2) m.set(e, -2); }
  let ok = 0; m.forEach(v => { if (v !== -2) ok++; }); return m.size ? ok / m.size : 0;
}
function raysSuggest(cols) {
  const value = bestMeasure(cols);
  if (value < 0) return null;
  const n = Math.max(0, ...cols.map(csColRows));
  const ents = cols.map((c, i) => i).filter(i => csIsEntCol(cols[i]) && csDistinct(cols[i]) >= 6 && csDistinct(cols[i]) <= 400);
  if (!ents.length) return null;
  // prefere a coluna em que quase toda linha é uma entidade; depois a de mais itens
  const uni = i => (n ? csDistinct(cols[i]) / n : 0), ok = i => csDistinct(cols[i]) <= RAYS_MAX * 2;
  ents.sort((a, b) => (uni(b) >= 0.9) - (uni(a) >= 0.9) || ok(b) - ok(a) || csDistinct(cols[b]) - csDistinct(cols[a]));
  const entity = ents[0], ec = cols[entity];
  const gc = cols.map((c, i) => i).filter(i => i !== entity && isGroupDim(cols[i]) && cols[i].codes && distinctOf(cols[i]) >= 2 && distinctOf(cols[i]) <= 12)
    .map(i => ({ i, p: csPurity(ec, cols[i]), d: distinctOf(cols[i]) })).filter(x => x.p >= 0.85).sort((a, b) => Math.abs(a.d - 6) - Math.abs(b.d - 6))[0];
  const vc = cols[value], agg = vc.unit === '%' || RAYS_AVG_HINT.test(vc.name) ? 'mean' : 'sum';
  return { entity, value, group: gc ? gc.i : -1, agg };
}
function raysBuild(ds, m, opts) {
  if (!m || m.entity < 0) return null;
  const cols = ds.columns, n = ds.rowCount, lang = opts.lang || 'pt', policy = opts.nullPolicy || 'ignore';
  const ec = cols[m.entity], vc = m.value >= 0 ? cols[m.value] : null, gc = m.group >= 0 && cols[m.group] && cols[m.group].codes ? cols[m.group] : null;
  if (!ec || !csIsEntCol(ec) || (vc && !isMeasure(vc))) return null;
  const agg = vc ? (m.agg || 'sum') : 'count', lab = csLabeler(ec), acc = new Map();
  let used = 0;
  for (let i = 0; i < n; i++) {
    const l = lab(i); if (!l) continue;
    let v = vc ? vc.data[i] : 1; if (Number.isNaN(v)) { if (policy === 'zero') v = 0; else continue; }
    let a = acc.get(l); if (!a) { a = { l, sum: 0, n: 0, rows: 0, g: new Map(), best: -1, bv: -1, ord: acc.size }; acc.set(l, a); }
    a.sum += v; a.n++; a.rows++; used++;
    if (gc) { const g = gc.codes[i]; a.g.set(g, (a.g.get(g) || 0) + 1); }
    if (Math.abs(v) > a.bv) { a.bv = Math.abs(v); a.best = i; }
  }
  const all = [...acc.values()].map(a => ({ ...a, v: agg === 'mean' ? (a.n ? a.sum / a.n : 0) : agg === 'count' ? a.rows : a.sum })).sort((x, y) => Math.abs(y.v) - Math.abs(x.v));
  if (all.length < 3) return null;
  const kept = all.slice(0, RAYS_MAX);
  // grupos: o dominante de cada entidade; até 12, o resto vira "Outros"
  let groups = [], gIdx = new Map();
  const OTH = lang === 'en' ? 'Others' : 'Outros', NOG = lang === 'en' ? 'No group' : 'Sem grupo';
  if (gc) {
    const tot = new Map();
    for (const a of kept) { let bg = -1, bc = 0; a.g.forEach((c, g) => { if (c > bc || (c === bc && g < bg)) { bc = c; bg = g; } }); a.gc = bg; tot.set(bg, (tot.get(bg) || 0) + Math.abs(a.v)); }
    const ord = [...tot].sort((x, y) => y[1] - x[1]).map(x => x[0]);
    const named = ord.filter(g => g >= 0), keepG = named.slice(0, 11), hasOth = named.length > 11, hasNone = ord.includes(-1);
    keepG.forEach((g, i) => { gIdx.set(g, i); groups.push({ label: gc.dict[g], v: 0, n: 0 }); });
    const oth = hasOth ? groups.push({ label: OTH, v: 0, n: 0 }) - 1 : -1, none = hasNone ? groups.push({ label: NOG, v: 0, n: 0 }) - 1 : -1;
    for (const a of kept) a.gi = a.gc < 0 ? none : gIdx.has(a.gc) ? gIdx.get(a.gc) : oth;
  } else for (const a of kept) a.gi = -1;
  const det = orgDetailFields(cols, { hub: -1, entity: m.entity, color: m.group, size: m.value, details: m.details }, n);
  const ents = kept.map(a => {
    if (a.gi >= 0) { groups[a.gi].v += a.v; groups[a.gi].n++; }
    return { label: a.l, v: a.v, g: a.gi, n: a.rows, ord: a.ord, d: det.idx.length && a.best >= 0 ? det.idx.map((ci, k) => orgCell(cols[ci], a.best, det.fields[k].long ? det.cap.long : det.cap.short, lang)) : null };
  });
  return { entName: ec.name, valName: vc ? vc.name : (lang === 'en' ? 'Rows' : 'Linhas'), grpName: gc ? gc.name : null, unit: vc ? vc.unit : null, agg, ents, groups, fields: det.fields,
    rowsTotal: n, rowsUsed: used, entTotal: all.length, neg: ents.some(e => e.v < 0) };
}
function raysFit(built) {
  const D = csBuilt({ built }, 'rays'); if (!D || D.ents.length < 5) return 0;
  if (D.entTotal > RAYS_MAX) return 0.5; // muitos itens: o leque de barras comporta mais
  const r = D.rowsUsed / Math.max(1, D.entTotal);
  return r <= 1.25 ? 0.95 : r <= 3 ? 0.6 : 0.45;
}
function raysNote(P) {
  const D = csBuilt(P, 'rays'); if (!D) return '';
  return T('rays_note', D.ents.length, D.entTotal, T('cs_aggs')[D.agg].toLowerCase(), D.valName, D.entName) + (D.neg ? ' ' + T('rays_neg') + '.' : '');
}

/* ---------------- motor ---------------- */
const raysTrunc = (s, k = 26) => (s.length > k ? s.slice(0, k - 1).trimEnd() + '…' : s);
class RaysEngine {
  constructor(D, th, opt = {}) {
    this.D = D; this.th = th; this.rm = !!opt.rm;
    this.st = { groups: null, top: null, sort: 'value' };
    this.hoverId = null; this.hovGrp = -1; this.spot = null;
    this.w = 800; this.h = 600; this.dpr = 1; this.grow = 0; this.moving = true; this.dirty = true; this._lt = 0; this.half = 300; this.cx = 400; this.cy = 300; this.R = 200; this.r0 = 20; this.labelW = 60; this.font = 11; this.step = 0.05; this.vmax = 1; this.every = 1;
    const rnd = orgRand(11);
    this.N = D.ents.map((e, i) => ({ i, e, g: e.g, a: -Math.PI / 2, ta: -Math.PI / 2, len: 0, tlen: 0, al: 0, tal: 0, hold: 0, rt: 0.75 + rnd() * 0.6, dm: 1, jit: rnd(), vis: false, gd: 0, gdSet: false, pos: 0 }));
    const sr = orgRand(31); this.stars = Array.from({ length: 70 }, () => [sr(), sr(), 0.5 + sr() * 1.1, 0.12 + sr() * 0.35]);
    this.layout();
  }
  /* ---------- estado ---------- */
  // setState: estado completo (apresentação, PNG); patch: mudança parcial (controles do painel)
  setState(p) { const q = p || {}; this.patch({ groups: q.groups !== undefined ? q.groups : null, top: q.top !== undefined ? q.top : null, sort: q.sort || 'value', spot: q.spot !== undefined ? q.spot : null }); }
  patch(p) {
    if (p.groups !== undefined) this.st.groups = p.groups ? new Set(p.groups) : null;
    if (p.top !== undefined) this.st.top = p.top;
    if (p.sort) this.st.sort = p.sort;
    if (p.spot !== undefined) this.spot = p.spot;
    this.layout(); this.kick();
  }
  getState() { return { groups: this.st.groups ? [...this.st.groups] : null, top: this.st.top, sort: this.st.sort, spot: this.spot }; }
  setHover(id) { if (this.hoverId === id) return; this.hoverId = id; this.kick(); }
  resize(w, h, dpr) { this.w = w; this.h = h; this.dpr = dpr || 1; this.layout(); this.snapPos(); this.kick(); }
  snapPos() { for (const n of this.N) { n.a = n.ta; n.len = n.tlen; n.al = n.tal; n.hold = 0; } }
  snap() { this.snapPos(); this.updateDim(0, true); this.grow = 1; this.moving = false; this.dirty = true; }
  /* ---------- layout ---------- */
  layout() {
    const { D, st, N } = this, W = this.w, H = this.h, half = Math.min(W, H) / 2, mc = csMeasureCtx();
    this.half = half; this.cx = W / 2; this.cy = H / 2;
    let vis = N.filter(n => !st.groups || st.groups.has(n.g));
    if (st.top && st.top < vis.length) vis = vis.slice(0, st.top); // N já vem do maior para o menor valor
    const visSet = new Set(vis);
    for (const n of N) n.vis = visSet.has(n);
    this.nVis = vis.length;
    const gOrder = []; vis.forEach(n => { if (!gOrder.includes(n.g)) gOrder.push(n.g); }); gOrder.sort((a, b) => a - b);
    const cmp = st.sort === 'name' ? (a, b) => a.e.label.localeCompare(b.e.label, LANG === 'pt' ? 'pt-BR' : 'en', { numeric: true }) : st.sort === 'orig' ? (a, b) => a.e.ord - b.e.ord : (a, b) => a.i - b.i;
    const seq = []; gOrder.forEach(g => seq.push(...vis.filter(n => n.g === g).sort(cmp)));
    const nG = gOrder.length, gapG = nG > 1 ? 0.05 : 0, topGap = 0.17, total = Math.PI * 2 - topGap - gapG * Math.max(0, nG - 1), nV = Math.max(1, seq.length), step = total / nV;
    // tamanho da fonte e margem de rótulo: dois passes, porque um depende do outro
    let R = Math.max(40, half * 0.62), f = 11, lw = 60;
    for (let pass = 0; pass < 2; pass++) {
      f = orgClamp(step * R * 0.8, 8.5, 13); mc.font = `500 ${f}px ${this.th.font}`;
      lw = 0; for (const n of seq) lw = Math.max(lw, mc.measureText(raysTrunc(n.e.label)).width);
      lw = Math.min(lw, half * 0.3); R = Math.max(40, half - lw - 54);
    }
    this.R = R; this.r0 = R * 0.11; this.font = f; this.labelW = lw; this.step = step; this.every = Math.max(1, Math.ceil(11 / Math.max(1, step * R)));
    let vmax = 1e-9; for (const n of seq) vmax = Math.max(vmax, Math.abs(n.e.v)); this.vmax = vmax;
    const prev = new Map(); for (const n of N) prev.set(n, [n.ta, n.tlen, n.tal]);
    let ang = -Math.PI / 2 + topGap / 2 + step / 2, lastG = null;
    seq.forEach((n, k) => {
      if (lastG !== null && n.g !== lastG) ang += gapG; lastG = n.g;
      n.ta = ang; ang += step; n.tlen = this.r0 + (R - this.r0) * Math.abs(n.e.v) / vmax; n.tal = 1; n.pos = k;
      if (!n.gdSet) { n.gd = k / nV; }
    });
    for (const n of N) if (!n.vis) { n.tal = 0; n.tlen = this.r0; if (!n.gdSet) n.gd = n.i / Math.max(1, N.length); }
    for (const n of N) n.gdSet = true;
    this.gOrder = gOrder;
    // movimento em onda: quem muda de lugar começa um pouco depois, seguindo o ângulo; arrastar um controle não gera espera
    const now = performance.now(), burst = now - this._lt < 200; this._lt = now;
    if (!this.rm && !burst) {
      for (const n of N) { const pv = prev.get(n), mv = Math.abs(n.ta - pv[0]) * this.R > 8 || Math.abs(n.tlen - pv[1]) > 8 || Math.abs(n.tal - pv[2]) > 0.5;
        if (mv && n.hold <= 0) n.hold = ((((n.ta + Math.PI / 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * 0.26 + n.jit * 0.07 + (n.tal > pv[2] ? 0.1 : 0); }
    }
    this.kick();
  }
  /* ---------- opacidade pelo mouse (suavizada) ---------- */
  updateDim(dt, snap) {
    const hv = this.hoverId !== null ? this.N[this.hoverId] : null, kd = snap || this.rm ? 1 : 1 - Math.exp(-dt * 11), sp = this.spot !== null ? this.N[this.spot] : null;
    let mv = false;
    for (const n of this.N) {
      let t = 1;
      if (hv) t = n === hv ? 1 : (n.g === hv.g && n.g >= 0 ? 0.45 : this.light ? 0.2 : 0.15);
      else if (this.hovGrp >= 0) t = n.g === this.hovGrp ? 1 : 0.13;
      else if (sp) t = n === sp ? 1 : 0.2;
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
    if (this.rm) this.grow = 1; else this.grow = Math.min(1, this.grow + dt / RAYS_GROW_S);
    let mv = this.grow < 1; const e1 = 1 - Math.exp(-dt * 5.2);
    for (const o of this.N) {
      if (o.hold > 0) { o.hold -= dt; mv = true; continue; }
      const k = this.rm ? 1 : Math.min(1, e1 * o.rt);
      let d = o.ta - o.a; if (Math.abs(d) > 2e-4) { o.a += d * k; mv = true; } else o.a = o.ta;
      d = o.tlen - o.len; if (Math.abs(d) > 0.05) { o.len += d * k; mv = true; } else o.len = o.tlen;
      d = o.tal - o.al; if (Math.abs(d) > 0.004) { o.al += d * k; mv = true; } else o.al = o.tal;
    }
    if (this.updateDim(dt, false)) mv = true;
    this.moving = mv;
  }
  /* ---------- desenho ---------- */
  gcol(g) { return g < 0 ? mixHex(this.th.fg, this.th.base, 0.35) : orgCatColor(this.th, g); }
  prog(n) { return orgEase(orgClamp((this.grow - n.gd * 0.5) / 0.5)); }
  tipXY(i) { const n = this.N[i], L = this.r0 + (n.len - this.r0) * this.prog(n); return [this.cx + Math.cos(n.a) * L, this.cy + Math.sin(n.a) * L]; }
  render() { if (this.ctx) { const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.draw(c); } }
  draw(ctx, opt) {
    const { th, N, cx, cy, r0, R, grow } = this, fg = th.fg, D = this.D;
    if (!opt || opt.clear !== false) ctx.clearRect(0, 0, this.w, this.h);
    const [lr_, lg_, lb_] = hexToRgb(th.base); this.light = lr_ + lg_ + lb_ > 450;
    const fr = orgStage(grow, 0, 0.3), hv = this.hoverId !== null ? N[this.hoverId] : null;
    const [br, bg2, bb] = hexToRgb(th.base);
    if (br + bg2 + bb < 330) { ctx.fillStyle = rgba(fg, 1); for (const s of this.stars) { ctx.globalAlpha = s[3] * fr; ctx.beginPath(); ctx.arc(s[0] * this.w, s[1] * this.h, s[2], 0, ORG_TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    // anéis de escala (valores reais) e círculo central
    const ticks = csNiceTicks(this.vmax, 3);
    ctx.save(); ctx.setLineDash([2, 6]); ctx.lineWidth = 1; ctx.strokeStyle = rgba(fg, 0.16 * fr);
    for (const t of ticks) { ctx.beginPath(); ctx.arc(cx, cy, (r0 + (R - r0) * t / this.vmax) * fr, 0, ORG_TAU); ctx.stroke(); }
    ctx.restore();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `500 10px ${th.font}`;
    for (const t of ticks) { const rr = (r0 + (R - r0) * t / this.vmax) * fr, y = cy - rr, s = fmtNum(t, D.unit, LANG); ctx.lineWidth = 4; ctx.strokeStyle = rgba(th.base, 0.9 * fr); ctx.strokeText(s, cx, y); ctx.fillStyle = rgba(fg, 0.5 * fr); ctx.fillText(s, cx, y); }
    ctx.strokeStyle = rgba(fg, 0.4 * fr); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, r0 * fr, 0, ORG_TAU); ctx.stroke();
    // raios: o destacado por último
    ctx.lineCap = 'round';
    const lw = orgClamp(this.step * R * 0.42, 1.2, 7), drawn = N.filter(n => n.al >= 0.02 && n !== hv);
    if (hv && hv.al >= 0.02) drawn.push(hv);
    for (const n of drawn) {
      const p = this.prog(n), L = r0 + (n.len - r0) * p, a = n.a, al = n.al * n.dm, col = this.gcol(n.g), on = n === hv || n.i === this.spot;
      const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0, x1 = cx + Math.cos(a) * L, y1 = cy + Math.sin(a) * L;
      const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.4, rgba(col, (this.light ? 0.55 : 0.38) * al)); g.addColorStop(1, rgba(col, 0.97 * al));
      ctx.strokeStyle = g; ctx.lineWidth = on ? lw * 1.7 : lw; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.fillStyle = rgba(col, Math.min(1, al * p)); ctx.beginPath(); ctx.arc(x1, y1, (on ? lw * 1.3 : lw * 0.8) + 0.4, 0, ORG_TAU); ctx.fill();
      if (on) { ctx.strokeStyle = rgba(fg, 0.9 * al); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x1, y1, lw * 1.3 + 3.5, 0, ORG_TAU); ctx.stroke(); }
      // rótulo girado ao longo do raio: na ponta quando há espaço entre vizinhos; senão alinhado no anel externo, com guia pontilhada
      if (p > 0.55 && (n.pos % this.every === 0 || on)) {
        const flip = Math.cos(a) < 0, fa = al * orgClamp((p - 0.55) / 0.45), tipOk = this.step * n.len >= this.font * 1.15, lr = tipOk ? L + 9 : Math.max(L + 9, R + 9);
        if (lr > L + 12) { ctx.strokeStyle = rgba(col, (on ? 0.5 : 0.16) * fa); ctx.lineWidth = 1; ctx.setLineDash([1.5, 3]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(cx + Math.cos(a) * (lr - 3), cy + Math.sin(a) * (lr - 3)); ctx.stroke(); ctx.setLineDash([]); }
        ctx.save(); ctx.translate(cx + Math.cos(a) * lr, cy + Math.sin(a) * lr); ctx.rotate(flip ? a + Math.PI : a);
        ctx.textAlign = flip ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.font = `${on ? 700 : 500} ${this.font}px ${th.font}`; ctx.fillStyle = rgba(fg, (on ? 1 : 0.86) * fa);
        ctx.fillText(raysTrunc(n.e.label, on ? 40 : 26), 0, 0); ctx.restore();
        if (on) { // o valor aparece sobre o raio, junto da ponta
          ctx.save(); ctx.translate(cx + Math.cos(a) * (L - 10), cy + Math.sin(a) * (L - 10)); ctx.rotate(flip ? a + Math.PI : a); ctx.textAlign = flip ? 'left' : 'right'; ctx.textBaseline = 'middle'; ctx.font = `700 ${this.font}px ${th.font}`;
          const vs = fmtNum(n.e.v, D.unit, LANG); ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(th.base, 0.92); ctx.strokeText(vs, 0, 0); ctx.fillStyle = rgba(fg, 1); ctx.fillText(vs, 0, 0); ctx.restore();
        }
      }
    }
    // grupos: arco colorido na borda e o nome curvo, quando cabe
    if (D.groups.length > 1) {
      const Rt = this.half - 26, Ra = this.half - 11, half = this.step / 2, mc = ctx;
      for (const g of this.gOrder) {
        if (g < 0) continue;
        const mem = N.filter(n => n.g === g && n.al > 0.05); if (!mem.length) continue;
        let a0 = 1e9, a1 = -1e9, dm = 0; for (const n of mem) { a0 = Math.min(a0, n.a); a1 = Math.max(a1, n.a); dm += n.dm; } dm /= mem.length; a0 -= half; a1 += half;
        const col = this.gcol(g), al = fr * dm;
        ctx.strokeStyle = rgba(col, 0.9 * al); ctx.lineWidth = 3; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.arc(cx, cy, Ra, a0, a1); ctx.stroke();
        this.arcText(mc, D.groups[g].label.toUpperCase(), Rt, (a0 + a1) / 2, a1 - a0, rgba(fg, 0.75 * al));
      }
    }
  }
  // texto curvo, sempre de pé: na metade de baixo percorre o arco ao contrário
  arcText(ctx, s, r, mid, span, color) {
    ctx.font = `600 10px ${this.th.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    const sp = 1.4, ws = [...s].map(ch => ctx.measureText(ch).width + sp), tot = ws.reduce((a, b) => a + b, 0);
    if (tot / r > span * 0.97) return;
    const bottom = Math.sin(mid) > 0, dir = bottom ? -1 : 1; let acc = 0;
    [...s].forEach((ch, i) => {
      const a = mid + dir * (-tot / 2 + acc + ws[i] / 2) / r; acc += ws[i];
      ctx.save(); ctx.translate(this.cx + Math.cos(a) * r, this.cy + Math.sin(a) * r); ctx.rotate(a + (bottom ? -Math.PI / 2 : Math.PI / 2)); ctx.fillText(ch, 0, 0); ctx.restore();
    });
  }
  /* ---------- seleção com o mouse: o raio inteiro e o rótulo respondem ---------- */
  pick(mx, my) {
    const dx = mx - this.cx, dy = my - this.cy, r = Math.hypot(dx, dy); if (r < this.r0 * 0.6 || r > this.half) return null;
    const a = Math.atan2(dy, dx); let best = null, bd = 1e9;
    for (const n of this.N) {
      if (n.al < 0.4) continue;
      let d = Math.abs(((a - n.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI); // distância angular em [0, π]
      d = Math.abs(d); if (d > this.step * 0.62 + 0.002) continue;
      if (r > n.len + 14 + this.labelW) continue;
      if (d < bd) { bd = d; best = n.i; }
    }
    return best;
  }
  // totais do que está visível (painel, ranking e cartão)
  stats() {
    const vis = this.N.filter(n => n.vis), ids = vis.map(n => n.i).sort((a, b) => Math.abs(this.N[b].e.v) - Math.abs(this.N[a].e.v)), rank = new Map(ids.map((id, k) => [id, k + 1]));
    const vals = vis.map(n => n.e.v), total = vals.reduce((a, b) => a + b, 0), gt = this.D.groups.map(() => ({ v: 0, n: 0 }));
    for (const n of vis) if (n.g >= 0) { gt[n.g].v += n.e.v; gt[n.g].n++; }
    return { ids, rank, total, n: vis.length, mean: vis.length ? total / vis.length : 0, median: csMedian(vals), gt };
  }
}

/* ---------------- interface ---------------- */
function renderRays(P, el) {
  if (el._org) el._org.destroy();
  const D = csBuilt(P, 'rays'), lang = LANG;
  if (!D) { el.innerHTML = `<div class="noins">${T('rays_none')}</div>`; return null; }
  const fmt = v => fmtNum(v, D.unit, lang), nE = D.ents.length, aggL = `${T('cs_aggs')[D.agg]} · ${D.valName}`;
  const sortOpts = [['value', 'rays_s_value'], ['name', 'rays_s_name'], ['orig', 'rays_s_orig']];
  const sideHtml = `${D.groups.length > 1 ? `<div class="orgblk"><div class="orgcap">${esc(D.grpName || T('rays_groups'))}</div><div class="orgleg" id="orgleg"></div><button class="orgall" id="orgall">${T('org_all')}</button></div>` : ''}
    <div class="orgblk"><div class="orgcap">${T('rays_sort')}</div><select class="rsel" id="rsort" aria-label="${T('rays_sort')}">${sortOpts.map(([v, k]) => `<option value="${v}">${T(k)}</option>`).join('')}</select></div>
    ${nE > 12 ? `<div class="orgblk"><div class="orgcap" id="rtopl"></div><input type="range" class="rsl" id="rtop" min="5" max="${nE}" value="${nE}" aria-label="${T('rays_top', '')}"></div>` : ''}
    ${D.groups.length > 1 ? `<div class="orgblk"><div class="orgcap">${T('rays_gshare')}</div><div class="orgrank" id="rgrp"></div></div>` : ''}
    <div class="orgblk"><div class="orgcap">${T('rays_rank')}</div><div class="orgrank" id="orgrank"></div></div>
    <p class="orgfoot">${T('rays_base')}</p>`;
  let eng = null, S = null;
  const stats = () => S || (S = eng.stats());
  const model = id => {
    const E = D.ents[id], s = stats(), rk = s.rank.get(id), left = [];
    if (D.grpName && E.g >= 0) left.push([D.grpName, D.groups[E.g].label]);
    if (rk) left.push([T('rays_pos'), T('rays_of', rk, fmtInt(s.n, lang))]);
    if (D.agg !== 'mean' && s.total !== 0 && rk) left.push([T('rays_pct'), csPct(E.v / s.total * 100, lang)]);
    if (s.mean && rk) left.push([T('rays_vsavg'), fmtPct((E.v / s.mean - 1) * 100, lang)]);
    if (E.n > 1) left.push([T('rays_rows'), fmtInt(E.n, lang)]);
    const texts = []; if (E.d) D.fields.forEach((f, k) => { const v = E.d[k]; if (v) (f.long ? texts : left).push([f.name, v]); });
    return { key: 'r' + id, kick: E.g >= 0 ? D.groups[E.g].label : D.entName, kickColor: E.g >= 0 ? orgCatColor(eng.th, E.g) : null, title: E.label, value: fmt(E.v), vlabel: aggL, left, texts, note: E.n > 1 && E.d ? T('rays_largest') : '' };
  };
  const overview = () => {
    const s = stats(), val = D.agg === 'mean' ? s.mean : s.total, byV = s.ids.map(i => D.ents[i]), top = byV[0], low = byV[byV.length - 1];
    const left = [[D.entName, fmtInt(s.n, lang)]]; if (D.groups.length > 1) left.push([D.grpName, fmtInt(s.gt.filter(g => g.n).length, lang)]);
    if (top) left.push([T('rays_ov_max'), `${top.label} · ${fmt(top.v)}`]); if (low && low !== top) left.push([T('rays_ov_min'), `${low.label} · ${fmt(low.v)}`]);
    left.push([T('rays_ov_avg'), fmt(s.mean)], [T('rays_ov_med'), fmt(s.median)]);
    return { key: 'ov', kick: T('card_overview'), title: D.entName, value: fmt(val), vlabel: aggL, left, texts: [], hint: T('rays_ov_hint') };
  };
  const h = {
    model, overview,
    listItems() {
      const st = eng.st, sig = JSON.stringify([st.groups ? [...st.groups].sort() : null, st.top]);
      const items = eng.N.filter(n => n.vis).map(n => ({ id: n.i, title: n.e.label, sub: [n.e.g >= 0 ? D.groups[n.e.g].label : '', n.e.n > 1 ? `${fmtInt(n.e.n, lang)} ${T('org_rows')}` : ''].filter(Boolean).join(' · '), color: n.e.g >= 0 ? orgCatColor(eng.th, n.e.g) : null, val: fmt(n.e.v), v: Math.abs(n.e.v), ord: n.e.ord,
        s: () => n.e.label + ' ' + (n.e.g >= 0 ? D.groups[n.e.g].label : '') + ' ' + (n.e.d ? n.e.d.join(' ') : '') }));
      return { sig, items, sorts: ['v', 'n', 'o'], sort: 'v' };
    },
    visible: id => eng.N[id].vis,
    side(side0) {
      S = null; const s = stats(), st = eng.st, $ = q => side0.querySelector(q);
      const leg = $('#orgleg');
      if (leg) leg.innerHTML = D.groups.map((g, i) => `<button class="orgc" data-c="${i}" data-n="${g.n}" aria-pressed="${!st.groups || st.groups.has(i)}" style="--c:${orgCatColor(eng.th, i)}"><i></i><span>${esc(g.label)}</span></button>`).join('');
      const tl = $('#rtopl'); if (tl) tl.textContent = st.top && st.top < nE ? T('rays_top', st.top) : T('rays_topall', nE);
      const bars = (items, mx) => items.map(x => `<div class="orgr" data-e="${x.id}"><div class="orgrb"><div class="orgrs" style="width:${Math.max(3, Math.abs(x.v) / mx * 100)}%"><i style="flex:1;background:${x.c}"></i></div></div><span>${esc(x.label)}</span><b>${esc(x.txt)}</b></div>`).join('');
      const top = s.ids.slice(0, 10).map(i => ({ id: i, v: D.ents[i].v, label: D.ents[i].label, txt: fmt(D.ents[i].v), c: D.ents[i].g >= 0 ? orgCatColor(eng.th, D.ents[i].g) : eng.gcol(-1) })), mx = Math.max(1e-9, ...top.map(x => Math.abs(x.v)));
      $('#orgrank').innerHTML = bars(top, mx);
      const gr = $('#rgrp');
      if (gr) { const gs = D.groups.map((g, i) => ({ id: 'g' + i, v: s.gt[i].v, label: g.label, txt: fmt(s.gt[i].v), c: orgCatColor(eng.th, i), n: s.gt[i].n })).filter(x => x.n).sort((a, b) => Math.abs(b.v) - Math.abs(a.v)), gm = Math.max(1e-9, ...gs.map(x => Math.abs(x.v))); gr.innerHTML = bars(gs, gm); }
    },
    syncSide(side0, e) { const sel = side0.querySelector('#rsort'), tp = side0.querySelector('#rtop'); if (sel) sel.value = e.st.sort; if (tp) tp.value = e.st.top || nE; },
    bindSide(side0, c) {
      const { eng: e, refresh, ctip } = c;
      side0.addEventListener('click', ev => {
        const b = ev.target.closest('.orgc'), a = ev.target.closest('#orgall');
        if (b) { const i = +b.dataset.c, cur = e.st.groups ? new Set(e.st.groups) : new Set(D.groups.map((_, k) => k)); if (!e.st.groups) { cur.clear(); cur.add(i); } else { cur.has(i) ? cur.delete(i) : cur.add(i); } e.patch({ groups: !cur.size || cur.size === D.groups.length ? null : [...cur] }); refresh(); }
        else if (a) { e.patch({ groups: null }); refresh(); }
      });
      side0.addEventListener('input', ev => { if (ev.target.id === 'rtop') { const v = +ev.target.value; e.patch({ top: v >= nE ? null : v }); refresh(); } });
      side0.addEventListener('change', ev => { if (ev.target.id === 'rsort') { e.patch({ sort: ev.target.value }); refresh(); } });
      side0.addEventListener('mouseover', ev => {
        const b = ev.target.closest('.orgc'), r = ev.target.closest('.orgr[data-e]');
        e.hovGrp = b ? +b.dataset.c : -1; e.kick();
        if (r && /^\d+$/.test(r.dataset.e)) c.hover(+r.dataset.e);
        if (b) { const rc = b.getBoundingClientRect(); ctip.textContent = `${fmtInt(+b.dataset.n, lang)} ${D.entName}`; ctip.hidden = false; ctip.style.left = Math.round(rc.left + 6) + 'px'; ctip.style.top = Math.round(rc.top - 26) + 'px'; }
      });
      side0.addEventListener('mouseout', ev => {
        if (ev.target.closest('.orgc')) { e.hovGrp = -1; e.kick(); ctip.hidden = true; }
        if (ev.target.closest('.orgr[data-e]')) c.hover(null);
      });
    },
    tour({ stage, side0, eng: e, piece, tools }) {
      const sr = stage.getBoundingClientRect(), half = e.half, ring = { x: sr.left + e.cx - half, y: sr.top + e.cy - half, w: 2 * half, h: 2 * half, round: true };
      const c2 = piece && piece.querySelector('#pc2'), cardBox = c2 ? csPad(csBox(c2.getBoundingClientRect()), 6) : ring;
      const blks = [...side0.querySelectorAll('.orgblk')].slice(0, D.groups.length > 1 ? 3 : 2).map(b => csBox(b.getBoundingClientRect()));
      const u = blks.reduce((a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), x2: Math.max(a.x2, b.x + b.w), y2: Math.max(a.y2, b.y + b.h) }), { x: 1e9, y: 1e9, x2: 0, y2: 0 });
      const flt = blks.length ? csPad({ x: u.x, y: u.y, w: u.x2 - u.x, h: u.y2 - u.y }, 8) : ring, big = stats().ids[0];
      return [{ k: 1, t: csPad(ring, 8) }, { k: 2, t: cardBox, demo: big }, { k: 3, t: flt }, { k: 4, t: csPad(csBox(tools.getBoundingClientRect()), 8) }];
    },
  };
  eng = new RaysEngine(D, orgTheme(P), { rm: RM });
  return csMount(P, el, { id: 'rays', sideHtml, tutPrefix: 'tut_rays_', tutKey: RAYS_TUT_KEY }, () => eng, h);
}
function raysSteps(P) {
  const D = csBuilt(P, 'rays'), out = []; if (!D) return out;
  if (D.groups.length > 1 && D.groups.length <= 9) D.groups.forEach((g, i) => out.push({ id: 'g' + i, caption: `${g.label} · ${fmtInt(g.n, LANG)} ${T('rays_items')} · ${fmtNum(g.v, D.unit, LANG)}`, state: { cs: { groups: [i] } } }));
  if (D.ents.length > 14) out.push({ id: 'top10', caption: T('top_n', 10), state: { cs: { top: 10 } } });
  out.push({ id: 'spot', caption: `${D.ents[0].label} · ${fmtNum(D.ents[0].v, D.unit, LANG)}`, state: { cs: { spot: 0 } } });
  return out;
}
function raysDrawStatic(P, ctx, x, y, w, h, state) {
  const D = csBuilt(P, 'rays'); if (!D) return;
  const eng = new RaysEngine(D, orgTheme(P), { rm: true });
  eng.resize(w, h, 1); eng.setState(state); eng.snap();
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); eng.draw(ctx, { clear: false }); ctx.restore(); eng.stop();
}
// insights do gráfico: mesmos cálculos verificáveis, aplicados às entidades e grupos que o gráfico mostra
function raysInsights(D, briefing, lang, T) {
  const tot = D.ents.map(e => ({ label: e.label, value: e.v, rows: e.n })), gs = D.groups.map(g => ({ label: g.label, value: g.v, rows: g.n }));
  const pseudo = { kind: 'category', names: { x: D.entName, y: D.valName, s: D.grpName }, unit: D.unit, aggKind: D.agg, totX: tot, totS: gs.length > 1 ? gs : null, xIsTime: false, stats: {} };
  return computeInsights(pseudo, briefing, lang, T);
}
regChart({
  id: 'rays', insights: raysInsights, suggest: raysSuggest, build: raysBuild, fit: raysFit, render: renderRays, steps: raysSteps, drawStatic: raysDrawStatic, note: raysNote,
  fields: [{ k: 'entity', label: 'rays_ent', role: 'ent' }, { k: 'value', label: 'rays_val', role: 'measure', none: 'org_rowsopt' }, { k: 'group', label: 'rays_grp', role: 'dim', none: 'mp_none' }, { k: 'agg', role: 'agg' }],
  names: b => ({ entity: b.entName, value: ['Linhas', 'Rows'].includes(b.valName) ? null : b.valName, group: b.grpName }),
  summary: b => T('rays_sum', fmtInt(b.ents.length, LANG), b.groups.length > 1 ? b.groups.length : 0),
});
