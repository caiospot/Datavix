/* Datavix: Fluxo em funil (Sankey vertical). De 2 a 5 colunas de categoria em sequência viram camadas de cima para baixo;
 * fitas curvas com degradê ligam cada nó ao da etapa seguinte, a largura é o valor; o que não segue sai do funil.
 * Números grandes em Doto por etapa e taxa de queda entre elas. Layout próprio, sem biblioteca. */
const FLOW_MAX_ST = 5, FLOW_MAX_PATHS = 6000, FLOW_GROW_S = 2.8, FLOW_TUT_KEY = 'dv-flow-tutorial', FLOW_NAME = /etapa|stage|fase|funil|status|origem|destino|source|target|passo|step|canal|resultado|proposta|qualifica/i;

/* ---------------- dados ---------------- */
function flowSuggest(cols) {
  const cand = cols.map((c, i) => i).filter(i => (cols[i].kind === 'category' || cols[i].kind === 'geo') && cols[i].codes && csAvgLen(cols[i]) <= 45 && distinctOf(cols[i]) >= 2 && distinctOf(cols[i]) <= 30).slice(0, FLOW_MAX_ST);
  if (cand.length < 2) return null;
  const vi = bestMeasure(cols), vc = vi >= 0 ? cols[vi] : null, o = { s1: cand[0], s2: cand[1], s3: cand[2] ?? -1, s4: cand[3] ?? -1, s5: cand[4] ?? -1 };
  return { ...o, value: vc && MONEY_HINT.test(vc.name) ? vi : -1, agg: 'sum' };
}
function flowBuild(ds, m, opts) {
  if (!m) return null;
  const cols = ds.columns, n = ds.rowCount, lang = opts.lang || 'pt', policy = opts.nullPolicy || 'ignore';
  const idx = [m.s1, m.s2, m.s3, m.s4, m.s5].filter((i, k, a) => i >= 0 && cols[i] && cols[i].codes && a.indexOf(i) === k);
  if (idx.length < 2) return null;
  const vc0 = m.value >= 0 && cols[m.value] && isMeasure(cols[m.value]) ? cols[m.value] : null, agg = vc0 && m.agg !== 'count' ? 'sum' : 'count', vc = agg === 'sum' ? vc0 : null, OTH = lang === 'en' ? 'Others' : 'Outros';
  const val = i => { if (!vc) return 1; const v = vc.data[i]; return Number.isNaN(v) ? (policy === 'zero' ? 0 : null) : v; };
  for (const cap of [10, 8, 6, 4]) {
    // por etapa: as categorias maiores ficam, o resto vira "Outros"
    const stages = idx.map(ci => {
      const c = cols[ci], tot = new Map(); for (let i = 0; i < n; i++) { const k = c.codes[i]; if (k < 0) continue; const v = val(i); if (v === null) continue; tot.set(k, (tot.get(k) || 0) + Math.abs(v)); }
      const ord = [...tot].sort((a, b) => b[1] - a[1]).map(x => x[0]), keep = ord.slice(0, ord.length > cap ? cap - 1 : ord.length), map = new Map(keep.map((k, j) => [k, j])), cats = keep.map(k => c.dict[k]);
      if (ord.length > keep.length) cats.push(OTH);
      return { name: c.name, cats, map, oth: ord.length > keep.length ? keep.length : -1, col: c };
    });
    const acc = new Map(); let used = 0;
    for (let i = 0; i < n; i++) {
      const v = val(i); if (v === null) continue; const path = [];
      for (const s of stages) { const k = s.col.codes[i]; if (k < 0) break; path.push(s.map.has(k) ? s.map.get(k) : s.oth); }
      if (!path.length) continue;
      const key = path.join(','); let a = acc.get(key); if (!a) { a = { path, v: 0, n: 0 }; acc.set(key, a); } a.v += v; a.n++; used++;
    }
    if (acc.size > FLOW_MAX_PATHS && cap > 4) continue;
    const paths = [...acc.values()].filter(a => a.v !== 0).sort((a, b) => Math.abs(b.v) - Math.abs(a.v)).map(a => [a.path, Math.max(0, a.v), a.n]);
    if (!paths.length || paths.every(p => p[0].length < 2)) return null;
    return { stages: stages.map(s => ({ name: s.name, cats: s.cats })), valName: vc0 ? vc0.name : (lang === 'en' ? 'Rows' : 'Linhas'), unit: vc ? vc.unit : null, agg, paths, rowsTotal: n, rowsUsed: used, oth: stages.some(s => s.oth >= 0) };
  }
  return null;
}
// totais de nós, fitas e camadas, só com os caminhos que passam pelos nós escolhidos (sel: Map etapa > Set de categorias)
function flowCompute(D, sel) {
  const nS = D.stages.length, nv = D.stages.map(s => s.cats.map(() => 0)), nn = D.stages.map(s => s.cats.map(() => 0)), lf = new Map(), T = new Array(nS).fill(0), np = new Array(nS).fill(0);
  D.paths.forEach(([path, v, n], pi) => {
    if (sel) for (const [s, set] of sel) if (path.length <= s || !set.has(path[s])) return;
    for (let s = 0; s < path.length; s++) { nv[s][path[s]] += v; nn[s][path[s]] += n; T[s] += v; if (s + 1 < path.length) { const k = s + '|' + path[s] + '|' + path[s + 1]; lf.set(k, (lf.get(k) || 0) + v); } }
  });
  return { nv, nn, lf, T };
}
function flowFit(built) {
  const D = csBuilt({ built }, 'flow'); if (!D) return 0;
  const hits = D.stages.filter(s => FLOW_NAME.test(s.name)).length;
  return D.stages.length >= 3 && hits >= 2 ? 0.95 : D.stages.length === 2 && hits === 2 ? 0.92 : 0.4;
}
function flowNote(P) {
  const D = csBuilt(P, 'flow'); if (!D) return '';
  return T('flow_note', T('cs_aggs')[D.agg].toLowerCase(), D.valName, D.stages.map(s => s.name).join(' → ')) + (D.oth ? ' ' + T('flow_oth') : '');
}
function flowInsights(D, briefing, lang, T) {
  const C = flowCompute(D, null), nS = D.stages.length, f = v => fmtNum(v, D.unit, lang), pct = x => fmtPct(x * 100, lang).replace('+', ''), out = [], base = `${T('cs_aggs')[D.agg]} · ${D.valName}`;
  const t0 = C.T[0], tl = C.T[nS - 1];
  if (t0 > 0 && nS >= 2) out.push({ id: 'flow_conv', text: T('flow_ins_conv', D.stages[0].name, D.stages[nS - 1].name, pct(tl / t0), f(t0), f(tl)), calc: { title: T('flow_ins_conv_t'), formula: T('flow_ins_conv_f'), rows: [{ k: D.stages[0].name, v: f(t0) }, { k: D.stages[nS - 1].name, v: f(tl) }, { k: T('share'), v: pct(tl / t0) }], base } });
  let worst = null; for (let s = 0; s + 1 < nS; s++) if (C.T[s] > 0) { const d = 1 - C.T[s + 1] / C.T[s]; if (!worst || d > worst.d) worst = { d, s }; }
  if (worst && worst.d > 0.05) out.push({ id: 'flow_drop', text: T('flow_ins_drop', D.stages[worst.s].name, D.stages[worst.s + 1].name, pct(worst.d)), calc: { title: T('flow_ins_drop_t'), formula: T('flow_ins_drop_f'), rows: [{ k: D.stages[worst.s].name, v: f(C.T[worst.s]) }, { k: D.stages[worst.s + 1].name, v: f(C.T[worst.s + 1]) }, { k: T('variation'), v: '-' + pct(worst.d) }], base } });
  const full = D.paths.filter(p => p[0].length === nS)[0] || D.paths[0];
  if (full && t0 > 0) out.push({ id: 'flow_path', text: T('flow_ins_path', full[0].map((c, s) => D.stages[s].cats[c]).join(' → '), pct(full[1] / t0)), calc: { title: T('flow_ins_path_t'), formula: T('flow_ins_path_f'), rows: [{ k: full[0].map((c, s) => D.stages[s].cats[c]).join(' → '), v: f(full[1]), n: full[2] }, { k: D.stages[0].name, v: f(t0) }, { k: T('share'), v: pct(full[1] / t0) }], base } });
  return out.slice(0, briefing.limit || (INSIGHT_LIMIT[briefing.audience] || 2) + 1);
}

/* ---------------- motor ---------------- */
class FlowEngine {
  constructor(D, th, opt = {}) {
    this.D = D; this.th = th; this.rm = !!opt.rm; this.nS = D.stages.length;
    this.st = { sel: [], order: 'flow', mode: 'abs' }; this.hoverId = null; this.hovPath = null; this.spotStage = null; this.spotPath = null; this.hovCat = -1;
    this.w = 800; this.h = 600; this.dpr = 1; this.grow = 0; this.moving = true; this.dirty = true;
    // nós: índice global = deslocamento da etapa + categoria
    this.off = []; let g = 0; this.nodes = []; D.stages.forEach((s, si) => { this.off.push(g); s.cats.forEach((label, c) => { this.nodes.push({ g: g++, s: si, c, label, v: 0, tv: 0, cx: 0, tcx: 0, al: 0, tal: 0, dm: 1, tdm: 1, n: 0 }); }); });
    // cores por rótulo (o mesmo rótulo em etapas diferentes tem a mesma cor)
    const lab = new Map(); D.stages.forEach(s => s.cats.forEach(l => { if (!lab.has(l)) lab.set(l, lab.size); })); this.labIdx = lab;
    const lk = new Map(); D.paths.forEach(([path]) => { for (let s = 0; s + 1 < path.length; s++) { const k = s + '|' + path[s] + '|' + path[s + 1]; if (!lk.has(k)) lk.set(k, { key: k, s, a: this.off[s] + path[s], b: this.off[s + 1] + path[s + 1], f: 0, tf: 0, dm: 1, tdm: 1, i: lk.size }); } });
    this.links = [...lk.values()]; this.kk = 1; this.tkk = 1; this.C = null; this.hl = null; this.T0 = flowCompute(D, null).T[0];
    const sr = orgRand(31); this.stars = Array.from({ length: 70 }, () => [sr(), sr(), 0.5 + sr() * 1.1, 0.12 + sr() * 0.35]);
    this.layout(); this.snapPos();
  }
  setState(p) { const q = p || {}; this.patch({ sel: q.sel || [], order: q.order || 'flow', mode: q.mode || 'abs', spotStage: q.spotStage !== undefined ? q.spotStage : null, spotPath: q.spotPath !== undefined ? q.spotPath : null }); }
  patch(p) { if (p.sel) this.st.sel = p.sel.slice(); if (p.order) this.st.order = p.order; if (p.mode) this.st.mode = p.mode; if (p.spotStage !== undefined) this.spotStage = p.spotStage; if (p.spotPath !== undefined) this.spotPath = p.spotPath; this.layout(); this.kick(); }
  getState() { return { sel: this.st.sel.slice(), order: this.st.order, mode: this.st.mode, spotStage: this.spotStage, spotPath: this.spotPath }; }
  setHover(id) { if (this.hoverId === id) return; this.hoverId = id; this.updateTargets(); this.kick(); }
  setPath(i) { if (this.hovPath === i) return; this.hovPath = i; this.updateTargets(); this.kick(); }
  resize(w, h, dpr) { this.w = w; this.h = h; this.dpr = dpr || 1; this.layout(); this.snapPos(); this.kick(); }
  snapPos() { for (const n of this.nodes) { n.v = n.tv; n.cx = n.tcx; n.al = n.tal; n.dm = n.tdm; } for (const l of this.links) { l.f = l.tf; l.dm = l.tdm; } this.kk = this.tkk; }
  snap() { this.snapPos(); this.grow = 1; this.moving = false; this.dirty = true; }
  selMap() { const m = new Map(); for (const g of this.st.sel) { const n = this.nodes[g]; if (!m.has(n.s)) m.set(n.s, new Set()); m.get(n.s).add(n.c); } return m.size ? m : null; }
  layout() {
    const { D, st, nodes, links } = this, W = this.w, H = this.h, nS = this.nS, C = flowCompute(D, this.selMap()); this.C = C;
    const ml = 168, mr = 36, top = 74, bot = H - 52, avail = Math.max(120, W - ml - mr), gapN = 12, thk = 20;
    this.geo = { ml, mr, top, bot, avail, thk, cx0: ml + avail / 2 }; this.yS = D.stages.map((_, s) => (nS === 1 ? top : top + s * (bot - top) / (nS - 1)));
    let k = 1e9; for (let s = 0; s < nS; s++) { const cnt = D.stages[s].cats.filter((_, c) => C.nv[s][c] > 0).length; if (C.T[s] > 0) k = Math.min(k, (avail - gapN * Math.max(0, cnt - 1)) / C.T[s]); } this.tkk = k === 1e9 ? 1 : Math.max(1e-6, k);
    for (const l of links) l.tf = C.lf.get(l.key) || 0;
    const loc = LANG === 'pt' ? 'pt-BR' : 'en';
    for (let s = 0; s < nS; s++) {
      const ids = nodes.filter(n => n.s === s && C.nv[s][n.c] > 0);
      if (st.order === 'name') ids.sort((a, b) => a.label.localeCompare(b.label, loc));
      else if (st.order === 'size' || s === 0) ids.sort((a, b) => C.nv[s][b.c] - C.nv[s][a.c]);
      else { // baricentro: perto dos nós de onde vem, para cruzar menos fitas
        const bc = n => { let sw = 0, sx = 0; for (const l of links) if (l.b === n.g && l.tf > 0) { sw += l.tf; sx += l.tf * nodes[l.a].tcx; } return sw ? sx / sw : 1e9; };
        const bcs = new Map(ids.map(n => [n, bc(n)])); ids.sort((a, b) => bcs.get(a) - bcs.get(b) || C.nv[s][b.c] - C.nv[s][a.c]);
      }
      const total = ids.reduce((a, n) => a + C.nv[s][n.c] * this.tkk, 0) + gapN * Math.max(0, ids.length - 1); let x = this.geo.cx0 - total / 2;
      for (const n of ids) { const w = C.nv[s][n.c] * this.tkk; n.tcx = x + w / 2; x += w + gapN; n.tv = C.nv[s][n.c]; n.tal = 1; n.n = C.nn[s][n.c]; }
      for (const n of nodes) if (n.s === s && !(C.nv[s][n.c] > 0)) { n.tv = 0; n.tal = 0; n.n = 0; }
    }
    this.updateTargets(); this.kick();
  }
  // destaque: a partir do nó, fita ou caminho sob o mouse, tudo que está antes e depois
  hlSets() {
    const id = this.hoverId, nodes = this.nodes, hn = new Set(), hl = new Set();
    const act = this.links.filter(l => l.tf > 0), up = g => { for (const l of act) if (l.b === g && !hl.has(l.i)) { hl.add(l.i); hn.add(l.a); up(l.a); } }, down = g => { for (const l of act) if (l.a === g && !hl.has(l.i)) { hl.add(l.i); hn.add(l.b); down(l.b); } };
    if (this.hovPath !== null || this.spotPath !== null) {
      const p = this.pathList()[this.hovPath !== null ? this.hovPath : this.spotPath]; if (!p) return null;
      p[0].forEach((c, s) => { hn.add(this.off[s] + c); if (s + 1 < p[0].length) { const l = this.links.find(q => q.key === s + '|' + c + '|' + p[0][s + 1]); if (l) hl.add(l.i); } }); return { hn, hl };
    }
    if (typeof id === 'string' && id[0] === 'n') { const g = +id.slice(1); hn.add(g); up(g); down(g); return { hn, hl }; }
    if (typeof id === 'string' && id[0] === 'l') { const l = this.links[+id.slice(1)]; if (!l) return null; hl.add(l.i); hn.add(l.a); hn.add(l.b); up(l.a); down(l.b); return { hn, hl }; }
    if (this.hovCat >= 0) { hn.add(this.hovCat); up(this.hovCat); down(this.hovCat); return { hn, hl }; }
    if (this.spotStage !== null) { for (const n of nodes) if (n.s === this.spotStage && n.tv > 0) { hn.add(n.g); up(n.g); down(n.g); } return { hn, hl }; }
    return null;
  }
  pathList() { const sel = this.selMap(); return this.D.paths.filter(([path]) => { if (sel) for (const [s, set] of sel) if (path.length <= s || !set.has(path[s])) return false; return true; }); }
  updateTargets() { const h = this.hlSets(); this.hl = h; for (const n of this.nodes) n.tdm = !h || h.hn.has(n.g) ? 1 : 0.16; for (const l of this.links) l.tdm = !h || h.hl.has(l.i) ? 1 : 0.1; }
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
    if (this.rm) this.grow = 1; else this.grow = Math.min(1, this.grow + dt / FLOW_GROW_S);
    let mv = this.grow < 1; const k = this.rm ? 1 : 1 - Math.exp(-dt * 5.5), kd = this.rm ? 1 : 1 - Math.exp(-dt * 11);
    const ease = (c, t, e, kk) => { const d = t - c; if (Math.abs(d) > e) { mv = true; return c + d * kk; } return t; };
    this.kk = ease(this.kk, this.tkk, 1e-6 * Math.max(1, this.tkk), k);
    for (const n of this.nodes) { n.v = ease(n.v, n.tv, 1e-4, k); n.cx = ease(n.cx, n.tcx, 0.05, k); n.al = ease(n.al, n.tal, 0.004, k); n.dm = ease(n.dm, n.tdm, 0.004, kd); }
    for (const l of this.links) { l.f = ease(l.f, l.tf, 1e-4, k); l.dm = ease(l.dm, l.tdm, 0.004, kd); }
    this.moving = mv;
  }
  col(n) { const th = this.th, l = n.label, i = this.labIdx.get(l); return l === (LANG === 'en' ? 'Others' : 'Outros') ? mixHex(th.fg, th.base, 0.5) : orgCatColor(th, i); }
  lp(s) { return orgEase(orgClamp((this.grow * (this.nS + 0.8) - s) / 1.3)); }
  // posição atual de cada nó (esquerda, largura) e de cada ponta de fita (empilhadas da esquerda para a direita, ordenadas pelo destino/origem)
  geom() {
    const { nodes, links, geo } = this, kk = this.kk, G = new Map(); for (const n of nodes) G.set(n.g, { n, left: n.cx - n.v * kk / 2, w: n.v * kk, y: this.yS[n.s], outX: 0, inX: 0 });
    const R = links.filter(l => l.f > 1e-9).map(l => ({ l, A: G.get(l.a), B: G.get(l.b), w: l.f * kk }));
    for (const g of G.values()) { const out = R.filter(r => r.A === g).sort((x, y) => x.B.n.cx - y.B.n.cx), inn = R.filter(r => r.B === g).sort((x, y) => x.A.n.cx - y.A.n.cx); let o = g.left, i = g.left; for (const r of out) { r.sx = o; o += r.w; } g.outEnd = o; for (const r of inn) { r.tx = i; i += r.w; } }
    return { G, R };
  }
  ribbon(r, y0, y1) { const ym = (y0 + y1) / 2, p = new Path2D(); p.moveTo(r.sx, y0); p.bezierCurveTo(r.sx, ym, r.tx, ym, r.tx, y1); p.lineTo(r.tx + r.w, y1); p.bezierCurveTo(r.tx + r.w, ym, r.sx + r.w, ym, r.sx + r.w, y0); p.closePath(); return p; }
  render() { if (this.ctx) { const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.draw(c); } }
  draw(ctx, opt) {
    const { th, D, geo, nS } = this, fg = th.fg, base = th.base, W = this.w, H = this.h, thk = geo.thk, fmt = v => fmtNum(v, D.unit, LANG), C = this.C, pct = this.st.mode === 'pct';
    if (!opt || opt.clear !== false) ctx.clearRect(0, 0, W, H);
    const [br, bg2, bb] = hexToRgb(base), fr = orgStage(this.grow, 0, 0.3);
    if (br + bg2 + bb < 330) { ctx.fillStyle = rgba(fg, 1); for (const s of this.stars) { ctx.globalAlpha = s[3] * fr; ctx.beginPath(); ctx.arc(s[0] * W, s[1] * H, s[2], 0, ORG_TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    const { G, R } = this.geom(), exitC = mixHex(fg, base, 0.55);
    // fitas (degradê do nó de origem ao de destino)
    for (const r of R) {
      const s = r.l.s, y0 = this.yS[s] + thk / 2, y1 = this.yS[s + 1] - thk / 2, p = this.ribbon(r, y0, y1), a = this.lp(s + 1) * r.l.dm * Math.min(1, r.A.n.al + 0.001) * Math.min(1, r.B.n.al + 0.001), hot = this.hl && this.hl.hl.has(r.l.i);
      const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, rgba(this.col(r.A.n), (hot ? 0.8 : 0.5) * a)); g.addColorStop(1, rgba(this.col(r.B.n), (hot ? 0.8 : 0.5) * a)); ctx.fillStyle = g; ctx.fill(p);
    }
    // saídas: o que não segue para a etapa seguinte afunila e some
    for (const g of G.values()) {
      const n = g.n; if (n.s >= nS - 1 || n.v <= 0) continue; const outSum = R.filter(r => r.A === g).reduce((a, r) => a + r.w, 0), ex = g.w - outSum; if (ex < 0.6) continue;
      const y0 = g.y + thk / 2, ln = 30, x = g.outEnd, a = this.lp(n.s + 1) * n.dm * 0.55, gr = ctx.createLinearGradient(0, y0, 0, y0 + ln); gr.addColorStop(0, rgba(exitC, a)); gr.addColorStop(1, rgba(exitC, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + ex, y0); ctx.lineTo(x + ex * 0.5 + ex * 0.1, y0 + ln); ctx.lineTo(x + ex * 0.4, y0 + ln); ctx.closePath(); ctx.fill();
    }
    // nós: barras com o rótulo dentro quando cabe
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const g of G.values()) {
      const n = g.n; if (n.al < 0.02 || g.w < 0.4) continue; const a = this.lp(n.s) * n.al * n.dm, col = this.col(n), hot = this.hoverId === 'n' + n.g || this.st.sel.includes(n.g);
      ctx.fillStyle = rgba(col, a); ctx.fillRect(g.left, g.y - thk / 2, Math.max(1.5, g.w), thk);
      if (hot) { ctx.strokeStyle = rgba(fg, 0.95 * a); ctx.lineWidth = 1.6; ctx.strokeRect(g.left - 1, g.y - thk / 2 - 1, g.w + 2, thk + 2); }
      ctx.font = `600 11px ${th.font}`; const lab = n.label, tw = ctx.measureText(lab).width;
      if (g.w >= tw + 10) { ctx.fillStyle = rgba(readableOn(col), a); ctx.fillText(lab, g.left + g.w / 2, g.y + 0.5); }
      else if (g.w >= 24) { const t = raysTrunc(lab, Math.max(2, Math.floor((g.w - 8) / 6.4))); ctx.fillStyle = rgba(readableOn(col), a); ctx.fillText(t, g.left + g.w / 2, g.y + 0.5); }
    }
    // coluna da esquerda: etapa, número grande em Doto e queda em relação à etapa anterior
    const first = this.T0 || C.T[0] || 1, doto = `700 34px Doto, 'Geist Mono', monospace`;
    for (let s = 0; s < nS; s++) {
      const y = this.yS[s], a = this.lp(s) * fr, t = C.T[s] * this.lp(s), txt = pct ? fmtPct(t / first * 100, LANG).replace('+', '') : fmt(t);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba(fg, 0.6 * a); ctx.font = `500 10.5px ${th.font}`; ctx.fillText(raysTrunc(D.stages[s].name.toUpperCase(), 22), 18, y - 24);
      let fs = 34; ctx.font = `700 ${fs}px Doto, 'Geist Mono', monospace`; while (ctx.measureText(txt).width > geo.ml - 40 && fs > 16) { fs -= 2; ctx.font = `700 ${fs}px Doto, 'Geist Mono', monospace`; }
      ctx.fillStyle = rgba(fg, a); ctx.fillText(txt, 18, y + 2);
      if (s > 0 && C.T[s - 1] > 0) { const d = 1 - C.T[s] / C.T[s - 1], ym = (this.yS[s - 1] + y) / 2, am = this.lp(s) * fr; ctx.font = `600 12px ${th.font}`; ctx.fillStyle = rgba(d > 0.0005 ? mixHex('#ff5c5c', fg, 0.15) : fg, 0.9 * am); ctx.fillText(d > 0.0005 ? `↓ −${fmtPct(d * 100, LANG).replace('+', '')}` : '→ 100%', 18, ym); }
    }
    // rótulo do nó sob o mouse (quando a barra é pequena)
    const hg = typeof this.hoverId === 'string' && this.hoverId[0] === 'n' ? G.get(+this.hoverId.slice(1)) : null;
    if (hg && hg.w < 90) { ctx.font = `700 11.5px ${th.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; const t = `${hg.n.label} · ${fmt(hg.n.v)}`; ctx.strokeStyle = rgba(base, 0.92); ctx.strokeText(t, hg.left + hg.w / 2, hg.y - thk / 2 - 6); ctx.fillStyle = rgba(fg, 1); ctx.fillText(t, hg.left + hg.w / 2, hg.y - thk / 2 - 6); }
  }
  /* ---------- seleção com o mouse ---------- */
  pick(mx, my) {
    const { G, R } = this.geom(), thk = this.geo.thk, mc = csMeasureCtx();
    for (const g of G.values()) { if (g.n.al < 0.4) continue; const w = Math.max(g.w, 10); if (mx >= g.left - 3 && mx <= g.left + w + 3 && Math.abs(my - g.y) <= thk / 2 + 5) return 'n' + g.n.g; }
    for (const r of R) { if (r.l.dm < 0.05 || r.l.tf <= 0) continue; if (mc.isPointInPath(this.ribbon(r, this.yS[r.l.s] + thk / 2, this.yS[r.l.s + 1] - thk / 2), mx, my)) return 'l' + r.l.i; }
    return null;
  }
}

/* ---------------- interface ---------------- */
function renderFlow(P, el) {
  if (el._org) el._org.destroy();
  const D = csBuilt(P, 'flow'), lang = LANG;
  if (!D) { el.innerHTML = `<div class="noins">${T('flow_none')}</div>`; return null; }
  const fmt = v => fmtNum(v, D.unit, lang), nS = D.stages.length, aggL = `${T('cs_aggs')[D.agg]} · ${D.valName}`, pc = (x, t) => fmtPct(t ? x / t * 100 : 0, lang).replace('+', '');
  const sideHtml = `<div class="orgblk"><div class="orgcap">${T('flow_sel')}</div><div class="orgleg" id="flsel" style="grid-template-columns:1fr"></div></div>
    <div class="orgblk"><div class="orgcap">${T('flow_conv')}</div><div class="orgrank" id="flconv"></div></div>
    <div class="orgblk"><div class="orgcap">${T('flow_order')}</div><select class="rsel" id="flord" aria-label="${T('flow_order')}">${[['flow', 'fo_flow'], ['size', 'fo_size'], ['name', 'fo_name']].map(([v, k]) => `<option value="${v}">${T(k)}</option>`).join('')}</select>
      <div class="orgcap" style="margin-top:6px">${T('flow_mode')}</div><select class="rsel" id="flmode" aria-label="${T('flow_mode')}">${[['abs', 'fm_abs'], ['pct', 'fm_pct']].map(([v, k]) => `<option value="${v}">${T(k)}</option>`).join('')}</select></div>
    <div class="orgblk"><div class="orgcap">${T('flow_paths')}</div><div class="orgrank" id="flpaths"></div></div><p class="orgfoot">${T('flow_help')}</p>`;
  let eng = null;
  const nodeName = g => eng.nodes[g].label, links = () => eng.links;
  const top3 = (arr, tot) => arr.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l, v]) => [l, `${fmt(v)} · ${pc(v, tot)}`]);
  const nodeModel = g => {
    const n = eng.nodes[g], C = eng.C, s = n.s, v = C.nv[s][n.c], T0 = C.T[0] || 1, left = [];
    left.push([T('fl_of'), pc(v, C.T[s])]); if (s > 0) left.push([T('fl_first'), pc(v, T0)]);
    const ins = eng.links.filter(l => l.b === g && l.tf > 0).map(l => [nodeName(l.a), l.tf]), outs = eng.links.filter(l => l.a === g && l.tf > 0).map(l => [nodeName(l.b), l.tf]), outSum = outs.reduce((a, o) => a + o[1], 0);
    if (ins.length) left.push([T('fl_in'), top3(ins, v).map(x => `${x[0]} ${x[1]}`).join(' / ')]);
    if (outs.length) left.push([T('fl_out'), top3(outs, v).map(x => `${x[0]} ${x[1]}`).join(' / ')]);
    if (s < nS - 1) { left.push([T('fl_keep'), pc(outSum, v)]); left.push([T('fl_exit'), `${fmt(v - outSum)} · ${pc(v - outSum, v)}`]); }
    left.push([T('fl_rows'), fmtInt(n.n, lang)]);
    return { key: 'n' + g + '|' + eng.st.sel.join(','), kick: D.stages[s].name, kickColor: eng.col(n), title: n.label, value: fmt(v), vlabel: aggL, left, texts: [] };
  };
  const linkModel = i => {
    const l = eng.links[i], C = eng.C, A = eng.nodes[l.a], B = eng.nodes[l.b], f = l.tf, left = [[T('fl_from'), `${A.label} · ${D.stages[A.s].name}`], [T('fl_to'), `${B.label} · ${D.stages[B.s].name}`], [T('fl_pct_src'), pc(f, C.nv[A.s][A.c])], [T('fl_pct_tgt'), pc(f, C.nv[B.s][B.c])]];
    if (A.s > 0) left.push([T('fl_first'), pc(f, C.T[0])]);
    return { key: 'l' + i + '|' + eng.st.sel.join(','), kick: `${D.stages[A.s].name} → ${D.stages[B.s].name}`, title: `${A.label} → ${B.label}`, value: fmt(f), vlabel: aggL, left, texts: [] };
  };
  const model = id => (id[0] === 'n' ? nodeModel(+id.slice(1)) : linkModel(+id.slice(1)));
  const overview = () => {
    const C = eng.C, left = [[T('flow_stage'), fmtInt(nS, lang)]], t0 = C.T[0], tl = C.T[nS - 1];
    left.push([T('fl_ov_in'), fmt(t0)], [T('fl_ov_out'), `${fmt(tl)} · ${pc(tl, t0)}`]);
    let w = null; for (let s = 0; s + 1 < nS; s++) if (C.T[s] > 0) { const d = 1 - C.T[s + 1] / C.T[s]; if (!w || d > w.d) w = { d, s }; } if (w && w.d > 0) left.push([T('fl_ov_drop'), `${D.stages[w.s].name} → ${D.stages[w.s + 1].name} · −${fmtPct(w.d * 100, lang).replace('+', '')}`]);
    if (eng.st.sel.length) left.push([T('fl_ov_filter'), eng.st.sel.map(g => eng.nodes[g].label).join(', ')]);
    return { key: 'ov|' + eng.st.sel.join(','), kick: T('card_overview'), title: D.stages.map(s => s.name).join(' → '), value: fmt(t0), vlabel: aggL, left, texts: [], hint: T('fl_ov_hint') };
  };
  const toggleNode = g => { const cur = new Set(eng.st.sel), n = eng.nodes[g]; if (cur.has(g)) cur.delete(g); else cur.add(g); eng.patch({ sel: [...cur] }); };
  let ctlRef = null;
  const h = {
    model, overview,
    listItems() {
      const C = eng.C, sig = JSON.stringify(eng.st.sel), items = [];
      eng.nodes.forEach(n => { if (C.nv[n.s][n.c] > 0) items.push({ id: 'n' + n.g, title: n.label, sub: D.stages[n.s].name, color: eng.col(n), val: fmt(C.nv[n.s][n.c]), v: C.nv[n.s][n.c], ord: n.g }); });
      eng.links.forEach(l => { if (l.tf > 0) items.push({ id: 'l' + l.i, title: `${nodeName(l.a)} → ${nodeName(l.b)}`, sub: `${D.stages[eng.nodes[l.a].s].name} → ${D.stages[eng.nodes[l.b].s].name}`, color: eng.col(eng.nodes[l.a]), val: fmt(l.tf), v: l.tf, ord: 1000 + l.i }); });
      return { sig, items, sorts: ['v', 'n', 'o'], sort: 'o' };
    },
    visible: id => (id[0] === 'n' ? eng.C.nv[eng.nodes[+id.slice(1)].s][eng.nodes[+id.slice(1)].c] > 0 : eng.links[+id.slice(1)].tf > 0),
    side(side0) {
      const C = eng.C, $ = q => side0.querySelector(q), st = eng.st;
      $('#flsel').innerHTML = st.sel.length ? st.sel.map(g => `<button class="orgc" data-g="${g}" aria-pressed="true" style="--c:${eng.col(eng.nodes[g])}"><i></i><span>${esc(D.stages[eng.nodes[g].s].name)}: ${esc(eng.nodes[g].label)}</span></button>`).join('') + `<button class="orgall" id="flclear">${T('flow_clear')}</button>` : `<p class="note" style="margin:0;font-size:11px">${T('flow_sel_none')}</p>`;
      let conv = ''; for (let s = 0; s + 1 < nS; s++) { const r = C.T[s] > 0 ? C.T[s + 1] / C.T[s] : 0; conv += `<div class="orgr"><div class="orgrb"><div class="orgrs" style="width:${Math.max(3, r * 100)}%"><i style="flex:1;background:${eng.th.colors[0]}"></i></div></div><span>${esc(D.stages[s].name)} → ${esc(D.stages[s + 1].name)}</span><b>${esc(pc(C.T[s + 1], C.T[s]))}</b></div>`; }
      $('#flconv').innerHTML = conv;
      const pl = eng.pathList().slice(0, 8), mx = Math.max(1e-9, ...pl.map(p => p[1]));
      $('#flpaths').innerHTML = pl.map((p, i) => `<div class="orgr" data-p="${i}"><div class="orgrb"><div class="orgrs" style="width:${Math.max(3, p[1] / mx * 100)}%"><i style="flex:1;background:${eng.col(eng.nodes[eng.off[0] + p[0][0]])}"></i></div></div><span>${esc(p[0].map((c, s) => D.stages[s].cats[c]).join(' → '))}</span><b>${esc(fmt(p[1]))}</b></div>`).join('');
    },
    syncSide(side0, e) { side0.querySelector('#flord').value = e.st.order; side0.querySelector('#flmode').value = e.st.mode; },
    bindSide(side0, c) {
      const { eng: e, refresh } = c;
      side0.addEventListener('click', ev => { const b = ev.target.closest('.orgc[data-g]'), a = ev.target.closest('#flclear'); if (b) { toggleNode(+b.dataset.g); refresh(); } else if (a) { e.patch({ sel: [] }); refresh(); } });
      side0.addEventListener('change', ev => { if (ev.target.id === 'flord') { e.patch({ order: ev.target.value }); refresh(); } else if (ev.target.id === 'flmode') { e.patch({ mode: ev.target.value }); refresh(); } });
      side0.addEventListener('mouseover', ev => { const r = ev.target.closest('.orgr[data-p]'); if (r) e.setPath(+r.dataset.p); });
      side0.addEventListener('mouseout', ev => { if (ev.target.closest('.orgr[data-p]')) e.setPath(null); });
    },
    onClick(id) { if (id[0] === 'n') { toggleNode(+id.slice(1)); ctlRef.refresh(); return true; } return false; },
    onEmpty() { if (eng.st.sel.length) { eng.patch({ sel: [] }); ctlRef.refresh(); } },
    tour({ stage, side0, piece, tools }) {
      const sr = csBox(stage.getBoundingClientRect()), c2 = piece && piece.querySelector('#pc2'), cardBox = c2 ? csPad(csBox(c2.getBoundingClientRect()), 6) : sr;
      const blks = [...side0.querySelectorAll('.orgblk')].slice(1, 2).concat([...side0.querySelectorAll('.orgblk')].slice(3, 4)).map(b => csBox(b.getBoundingClientRect()));
      const u = blks.reduce((a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), x2: Math.max(a.x2, b.x + b.w), y2: Math.max(a.y2, b.y + b.h) }), { x: 1e9, y: 1e9, x2: 0, y2: 0 });
      const big = eng.nodes.filter(n => n.tv > 0).sort((a, b) => b.tv - a.tv)[0];
      return [{ k: 1, t: csPad(sr, -6) }, { k: 2, t: cardBox, demo: big ? 'n' + big.g : null }, { k: 3, t: csPad({ x: u.x, y: u.y, w: u.x2 - u.x, h: u.y2 - u.y }, 8) }, { k: 4, t: csPad(csBox(tools.getBoundingClientRect()), 8) }];
    },
  };
  eng = new FlowEngine(D, orgTheme(P), { rm: RM });
  ctlRef = csMount(P, el, { id: 'flow', sideHtml, tutPrefix: 'tut_flow_', tutKey: FLOW_TUT_KEY }, () => eng, h);
  return ctlRef;
}
function flowSteps(P) {
  const D = csBuilt(P, 'flow'), out = []; if (!D) return out;
  const C = flowCompute(D, null), f = v => fmtNum(v, D.unit, LANG);
  D.stages.forEach((s, i) => out.push({ id: 's' + i, caption: `${s.name} · ${f(C.T[i])}${i > 0 && C.T[i - 1] > 0 && C.T[i] < C.T[i - 1] * 0.9995 ? ' · −' + fmtPct((1 - C.T[i] / C.T[i - 1]) * 100, LANG).replace('+', '') : ''}`, state: { cs: { spotStage: i } } }));
  D.paths.slice(0, 3).forEach((p, i) => out.push({ id: 'p' + i, caption: `${p[0].map((c, s) => D.stages[s].cats[c]).join(' → ')} · ${f(p[1])}`, state: { cs: { spotPath: i } } }));
  return out;
}
function flowDrawStatic(P, ctx, x, y, w, h, state) {
  const D = csBuilt(P, 'flow'); if (!D) return;
  const eng = new FlowEngine(D, orgTheme(P), { rm: true }); eng.resize(w, h, 1); eng.setState(state); eng.snap();
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); eng.draw(ctx, { clear: false }); ctx.restore(); eng.stop();
}
regChart({
  id: 'flow', suggest: flowSuggest, build: flowBuild, fit: flowFit, insights: flowInsights, render: renderFlow, steps: flowSteps, drawStatic: flowDrawStatic, note: flowNote,
  fields: [{ k: 's1', label: 'flow_s1', role: 'dim' }, { k: 's2', label: 'flow_s2', role: 'dim' }, { k: 's3', label: 'flow_s3', role: 'dim', none: 'mp_none' }, { k: 's4', label: 'flow_s4', role: 'dim', none: 'mp_none' }, { k: 's5', label: 'flow_s5', role: 'dim', none: 'mp_none' }, { k: 'value', label: 'flow_val', role: 'measure', none: 'flow_valopt' }, { k: 'agg', role: 'agg', aggs: ['sum', 'count'] }],
  names: b => { const o = { value: ['Linhas', 'Rows'].includes(b.valName) ? null : b.valName }; b.stages.forEach((s, i) => { o['s' + (i + 1)] = s.name; }); return o; },
  summary: b => T('flow_sum', b.stages.length, b.stages.reduce((a, s) => a + s.cats.length, 0)),
});
