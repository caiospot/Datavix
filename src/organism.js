/* Datavix: árvore radial ("organismo"). Todos os dados da planilha em um só gráfico animado:
 * raiz no centro > períodos (ramos) > entidades (nós) > registros (bolhas no anel externo),
 * cor por categoria, tamanho por valor. Desenho próprio em canvas; nada vem de bibliotecas externas. */

const ORG_TAU = Math.PI * 2, ORG_GROW_S = 2.8;
const orgClamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const orgEase = t => 1 - Math.pow(1 - orgClamp(t), 3);
const orgStage = (g, a, b) => orgEase((g - a) / (b - a));
const rgba = (hex, a) => { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
function orgTheme(P) {
  const base = bgBase(P.bg), fg = readableOn(base);
  return { base, fg, colors: P.colors.slice(), font: fontsOf(P).body };
}
// cor de cada categoria: a paleta da peça; passando do tamanho dela, variações mais claras
function orgCatColor(th, i) {
  if (i < 0) return mixHex(th.fg, th.base, 0.5);
  const c = th.colors[i % th.colors.length];
  return i >= th.colors.length ? mixHex(c, th.fg, 0.38) : c;
}

const orgRand = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

class OrgEngine {
  constructor(D, th, opt = {}) {
    this.D = D; this.th = th; this.rm = !!opt.rm;
    this.st = { colors: null, range: [0, D.hubs.length - 1], focus: null };
    this.hov = { leaf: -1, hub: -1, ent: -1, col: -1 };
    this.w = 800; this.h = 600; this.dpr = 1; this.grow = 0; this.moving = true; this.dirty = true; this._lt = 0;
    const rnd = orgRand(7), node = o => Object.assign(o, { a: 0, r: 0, ta: 0, tr: 0, al: 0, tal: 0, hold: 0, rt: 0.7 + rnd() * 0.65, dm: 1, jit: rnd() });
    this.hubN = D.hubs.map((h, i) => node({ i, label: h.label, vis: false, v: h.v, ents: [] }));
    this.entN = []; const em = new Map();
    this.leafN = D.leaves.map((l, i) => {
      const key = l[0] + '|' + l[1]; let en = em.get(key);
      if (!en) { en = node({ h: l[0], e: l[1], leaves: [], vis: [], v: 0, dom: -1 }); em.set(key, en); this.entN.push(en); this.hubN[l[0]].ents.push(en); }
      en.leaves.push(i); en.v += Math.abs(l[3]);
      return node({ i, h: l[0], e: l[1], c: l[2], v: l[3], n: l[4], t: l[5], d: l[6] || null, en, rad: 0, trad: 0, vis: false });
    });
    for (const en of this.entN) { const m = new Map(); for (const i of en.leaves) { const L = this.leafN[i]; m.set(L.c, (m.get(L.c) || 0) + Math.abs(L.v)); } en.dom = [...m].sort((a, b) => b[1] - a[1])[0][0]; }
    const av = this.leafN.map(l => Math.abs(l.v)).sort((a, b) => a - b), q = p => av[Math.min(av.length - 1, Math.floor(av.length * p))] || av[av.length - 1];
    this.vmax = Math.max(1e-9, q(0.97)); this.vmed = Math.max(1e-9, q(0.5));
    this.order = this.leafN.map(l => l.i).sort((a, b) => Math.abs(this.leafN[b].v) - Math.abs(this.leafN[a].v)); // grandes primeiro: as pequenas ficam por cima
    const sr = orgRand(31); this.stars = Array.from({ length: 70 }, () => [sr(), sr(), 0.5 + sr() * 1.1, 0.12 + sr() * 0.35]);
    this.layout();
  }
  /* ---------- estado e layout ---------- */
  setState(p) {
    if (p.colors !== undefined) this.st.colors = p.colors ? new Set(p.colors) : null;
    if (p.range) this.st.range = p.range.slice();
    if (p.focus !== undefined) this.st.focus = p.focus;
    this.layout(); this.kick();
  }
  getState() { return { colors: this.st.colors ? [...this.st.colors] : null, range: this.st.range.slice(), focus: this.st.focus }; }
  isVisible(L) { const [a, b] = this.st.range; return L.h >= a && L.h <= b && (L.c < 0 || !this.st.colors || this.st.colors.has(L.c)); }
  resize(w, h, dpr) { this.w = w; this.h = h; this.dpr = dpr || 1; this.layout(); this.snapPos(); this.kick(); }
  snapPos() {
    for (const n of [...this.hubN, ...this.entN]) { n.a = n.ta; n.r = n.tr; n.al = n.tal; n.hold = 0; }
    for (const L of this.leafN) { L.a = L.ta; L.r = L.tr; L.al = L.tal; L.rad = L.trad; L.hold = 0; }
  }
  layout() {
    const D = this.D, W = this.w, H = this.h, R = Math.min(W, H) / 2 * 0.86;
    this.cx = W / 2; this.cy = H / 2; this.R = R; this.r0 = R * 0.045; const r1 = R * 0.3, r2 = R * 0.65;
    const st = this.st, hubW = D.hubs.map(() => 0);
    let nVis = 0;
    for (const L of this.leafN) { L.vis = this.isVisible(L); if (L.vis) { hubW[L.h]++; nVis++; } }
    this.nVis = nVis;
    // proporção das bolhas: poucas gigantes e muitas pequenas. Se todos os valores são parecidos, o tamanho é limitado pelo espaço no anel
    const disp = orgClamp(Math.log10(this.vmax / this.vmed) / 0.9), pitch = ORG_TAU * R / Math.max(nVis, 1);
    const rminB = Math.max(1.8, R * 0.006), big = R * 0.13 * orgClamp(Math.sqrt(400 / Math.max(nVis, 1)), 0.45, 1), uni = Math.max(rminB * 1.4, pitch * 0.8);
    const rmax = Math.max(rminB * 1.5, Math.min(big, uni + (big - uni) * disp));
    this.maxRad = rmax;
    const hubs = hubW.map((w, i) => (w > 0 ? i : -1)).filter(i => i >= 0);
    const wt = i => (Math.pow(hubW[i], 0.85) + 1.5) * (st.focus !== null && i === st.focus ? 5 : 1);
    const total = hubs.reduce((a, i) => a + wt(i), 0) || 1, gap = hubs.length > 1 ? 0.04 : 0, avail = ORG_TAU - gap * hubs.length;
    let ang = -Math.PI / 2 + gap / 2;
    const prev = new Map(); // alvo anterior: só anima com atraso o que muda de verdade
    for (const n of [...this.hubN, ...this.entN]) prev.set(n, [n.ta, n.tr, n.tal]);
    for (const L of this.leafN) prev.set(L, [L.ta, L.tr, L.tal, L.trad]);
    for (const hn of this.hubN) {
      hn.vis = hubW[hn.i] > 0;
      if (!hn.vis) { hn.tal = 0; hn.tr = this.r0 * 1.2; for (const en of hn.ents) { en.vis = []; en.tal = 0; en.tr = this.r0 * 1.2; en.ta = hn.ta; } continue; }
      const span = avail * wt(hn.i) / total;
      const ents = hn.ents.map(en => { en.vis = en.leaves.filter(i => this.leafN[i].vis); return en; }).filter(en => en.vis.length).sort((a, b) => a.dom - b.dom || b.v - a.v);
      const sumE = ents.reduce((a, en) => a + en.vis.length, 0);
      let a0 = ang;
      for (const en of ents) {
        const esp = span * en.vis.length / sumE;
        en.ta = a0 + esp / 2; en.tr = r2; en.tal = 1;
        const ls = en.vis.map(i => this.leafN[i]).sort((x, y) => x.c - y.c || Math.abs(y.v) - Math.abs(x.v));
        ls.forEach((L, k) => { L.ta = a0 + (k + 0.5) / ls.length * esp; L.tr = R; L.tal = 1; L.trad = rminB + (rmax - rminB) * Math.pow(Math.min(1.15, Math.abs(L.v) / this.vmax), 0.8); });
        a0 += esp;
      }
      for (const en of hn.ents) if (!en.vis.length) { en.tal = 0; en.tr = r1; en.ta = hn.ta; }
      hn.ta = ang + span / 2; hn.tr = r1; hn.tal = 1;
      ang += span + gap;
    }
    for (const L of this.leafN) if (!L.vis) { L.tal = 0; L.trad = 0; L.ta = L.en.ta; L.tr = L.en.tr; }
    // movimento em onda: quem muda de lugar começa um pouco depois, seguindo o ângulo; arrastar um controle não gera espera
    const now = performance.now(), burst = now - this._lt < 200; this._lt = now;
    const wave = (n, ang0, k) => ((((ang0 + Math.PI / 2) % ORG_TAU) + ORG_TAU) % ORG_TAU) / ORG_TAU * 0.3 * k + n.jit * 0.07;
    const moved = (n, pv) => Math.abs(n.ta - pv[0]) * Math.max(n.tr, pv[1], 1) > 14 || Math.abs(n.tr - pv[1]) > 14 || Math.abs(n.tal - pv[2]) > 0.5;
    if (!this.rm && !burst) {
      for (const n of [...this.hubN, ...this.entN]) if (n.hold <= 0 && moved(n, prev.get(n))) n.hold = wave(n, n.ta, 0.8);
      for (const L of this.leafN) if (L.hold <= 0 && moved(L, prev.get(L))) L.hold = wave(L, L.ta, 1) + (L.tal > prev.get(L)[2] ? 0.12 : 0);
    }
    this.kick();
  }
  snap() {
    for (const n of [...this.hubN, ...this.entN]) { n.a = n.ta; n.r = n.tr; n.al = n.tal; n.hold = 0; }
    for (const L of this.leafN) { L.a = L.ta; L.r = L.tr; L.al = L.tal; L.rad = L.trad; L.hold = 0; }
    this.updateDim(0, true);
    this.grow = 1; this.moving = false; this.dirty = true;
  }
  /* ---------- opacidade por foco do período e destaque do mouse (suavizada) ---------- */
  hubFocusDim(h) { return this.st.focus !== null && h !== this.st.focus ? 0.2 : 1; }
  updateDim(dt, snap) {
    const { st, hov } = this, hl = hov.leaf >= 0 ? this.leafN[hov.leaf] : null, kd = snap || this.rm ? 1 : 1 - Math.exp(-dt * 11);
    let mv = false;
    const ease = (o, t) => { const d = t - o.dm; if (Math.abs(d) > 0.004) { o.dm += d * kd; mv = true; } else o.dm = t; };
    for (const hn of this.hubN) ease(hn, this.hubFocusDim(hn.i) * (hov.hub >= 0 ? (hn.i === hov.hub ? 1 : 0.22) : hl ? (hl.h === hn.i ? 1 : 0.25) : 1));
    for (const en of this.entN) ease(en, this.hubFocusDim(en.h) * (hov.hub >= 0 ? (en.h === hov.hub ? 1 : 0.25) : hl ? (hl.en === en ? 1 : 0.5) : hov.ent >= 0 ? (en.e === hov.ent ? 1 : 0.4) : 1));
    for (const L of this.leafN) {
      let d = this.hubFocusDim(L.h);
      if (hl) d *= (L === hl ? 1 : (L.en === hl.en ? 0.8 : 0.22));
      else if (hov.hub >= 0) d *= (L.h === hov.hub ? 1 : 0.2);
      else if (hov.ent >= 0) d *= (L.e === hov.ent ? 1 : 0.16);
      else if (hov.col >= 0) d *= (L.c === hov.col ? 1 : 0.14);
      ease(L, d);
    }
    return mv;
  }
  /* ---------- animação ---------- */
  kick() { this.dirty = true; this.start(); }
  start() {
    if (this._run) return; this._run = true; let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
      this.step(dt); this.render(); if (this.onFrame) this.onFrame();
      if (this.moving || this.dirty) { this.dirty = false; this._h = document.hidden ? setTimeout(() => loop(performance.now()), 60) : requestAnimationFrame(loop); } else this._run = false;
    };
    this._h = document.hidden ? setTimeout(() => loop(performance.now()), 60) : requestAnimationFrame(loop);
  }
  stop() { this._run = false; cancelAnimationFrame(this._h); clearTimeout(this._h); }
  step(dt) {
    if (this.rm) this.grow = 1; else this.grow = Math.min(1, this.grow + dt / ORG_GROW_S);
    let mv = this.grow < 1;
    const rm = this.rm, e1 = 1 - Math.exp(-dt * 5.2);
    const adv = (o, withRad) => {
      if (o.hold > 0) { o.hold -= dt; mv = true; return; }
      const k = rm ? 1 : Math.min(1, e1 * o.rt);
      let d = o.ta - o.a; if (Math.abs(d) > 2e-4) { o.a += d * k; mv = true; } else o.a = o.ta;
      d = o.tr - o.r; if (Math.abs(d) > 0.02) { o.r += d * k; mv = true; } else o.r = o.tr;
      d = o.tal - o.al; if (Math.abs(d) > 0.004) { o.al += d * k; mv = true; } else o.al = o.tal;
      if (withRad) { d = o.trad - o.rad; if (Math.abs(d) > 0.02) { o.rad += d * k; mv = true; } else o.rad = o.trad; }
    };
    for (const n of this.hubN) adv(n); for (const n of this.entN) adv(n); for (const L of this.leafN) adv(L, true);
    if (this.updateDim(dt, false)) mv = true;
    this.moving = mv;
  }
  /* ---------- desenho ---------- */
  pos(a, r, f) { return [this.cx + Math.cos(a) * r * f, this.cy + Math.sin(a) * r * f]; }
  leafXY(i) { const L = this.leafN[i], f = orgStage(this.grow, 0.36, 0.86), p = this.pos(L.a, L.r, f); return [p[0], p[1], L.rad * (0.35 + 0.65 * orgStage(this.grow, 0.58, 1))]; }
  render() { if (this.ctx) { const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); this.draw(c); } }
  draw(ctx, opt) {
    const { th, st, hov, grow } = this, fg = th.fg;
    if (!opt || opt.clear !== false) ctx.clearRect(0, 0, this.w, this.h); // no PNG o fundo já foi pintado
    const fh = orgStage(grow, 0, 0.38), fe = orgStage(grow, 0.18, 0.62), fl = orgStage(grow, 0.36, 0.86), fb = orgStage(grow, 0.58, 1);
    const anyHover = hov.leaf >= 0 || hov.hub >= 0 || hov.ent >= 0 || hov.col >= 0, hl = hov.leaf >= 0 ? this.leafN[hov.leaf] : null;
    // poeira de fundo, só em fundos escuros
    const [br, bg2, bb] = hexToRgb(th.base);
    if (br + bg2 + bb < 330) { ctx.fillStyle = rgba(fg, 1); for (const s of this.stars) { ctx.globalAlpha = s[3] * fh; ctx.beginPath(); ctx.arc(s[0] * this.w, s[1] * this.h, s[2], 0, ORG_TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    const root = [this.cx, this.cy];
    // 1) arestas: raiz > período > entidade > registro, em lotes por intensidade
    const batches = new Map();
    const edge = (key, alpha, w, a1, r1, f1, a2, r2, f2, p1, p2) => {
      let b = batches.get(key); if (!b) { b = { path: new Path2D(), alpha, w }; batches.set(key, b); }
      const rm = (r1 * f1 + r2 * f2) / 2, A = p1 || this.pos(a1, r1, f1), B = p2 || this.pos(a2, r2, f2), c1 = this.pos(a1, rm, 1), c2 = this.pos(a2, rm, 1);
      b.path.moveTo(A[0], A[1]); b.path.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], B[0], B[1]);
    };
    const dens = orgClamp(Math.sqrt(260 / Math.max(1, this.nVis || this.leafN.length)), 0.22, 1);
    const bucket = d => (d >= 0.95 ? 3 : d >= 0.5 ? 2 : d >= 0.17 ? 1 : 0), baseA = [0.03, 0.07, 0.15, 0.2].map(a => a * dens);
    for (const hn of this.hubN) {
      if (hn.al < 0.02) continue;
      const d = hn.dm;
      edge('r' + bucket(d), 0.5 * hn.al * (d >= 0.95 ? 1 : 0.4), 1.3, 0, 0, 0, hn.a, hn.r, fh, root);
      for (const en of hn.ents) {
        if (en.al < 0.02) continue;
        const de = en.dm;
        edge('h' + bucket(de), 0.32 * Math.min(hn.al, en.al) * (de >= 0.95 ? 1 : 0.5), 1.1, hn.a, hn.r, fh, en.a, en.r, fe);
      }
    }
    for (const L of this.leafN) {
      if (L.al < 0.02) continue;
      const d = L.dm, en = L.en;
      edge('l' + bucket(d), baseA[bucket(d)] * Math.min(L.al, fl), d >= 0.95 && anyHover ? 1.3 : 0.8, en.a, en.r, fe, L.a, L.r, fl);
    }
    ctx.lineCap = 'round';
    for (const [key, b] of batches) {
      ctx.strokeStyle = (hl || hov.hub >= 0 || hov.ent >= 0) && /3$/.test(key) ? rgba(th.colors[0], Math.min(1, b.alpha * 2.2)) : rgba(fg, Math.min(1, b.alpha));
      ctx.lineWidth = b.w; ctx.stroke(b.path);
    }
    // 2) bolhas (grandes primeiro)
    for (const i of this.order) {
      const L = this.leafN[i]; if (L.al < 0.02 || L.rad < 0.3) continue;
      const [x, y] = this.pos(L.a, L.r, fl), al = L.al * fb * L.dm, col = orgCatColor(th, L.c), rad = L.rad * (0.35 + 0.65 * fb);
      ctx.fillStyle = rgba(col, 0.3 * al); ctx.beginPath(); ctx.arc(x, y, rad, 0, ORG_TAU); ctx.fill();
      ctx.strokeStyle = rgba(hl === L ? fg : col, (hl === L ? 0.95 : 0.7) * al); ctx.lineWidth = hl === L ? 1.8 : 1; ctx.stroke();
      ctx.fillStyle = rgba(col, Math.min(1, al)); ctx.beginPath(); ctx.arc(x, y, Math.max(1.3, rad * 0.14), 0, ORG_TAU); ctx.fill();
    }
    // 3) nós de entidade, períodos e raiz
    for (const en of this.entN) {
      if (en.al < 0.05) continue;
      const [x, y] = this.pos(en.a, en.r, fe);
      ctx.fillStyle = rgba(fg, 0.9 * en.al * en.dm * fe); ctx.beginPath(); ctx.arc(x, y, hov.ent === en.e || (hl && hl.en === en) ? 3.6 : 2.4, 0, ORG_TAU); ctx.fill();
    }
    ctx.strokeStyle = rgba(fg, 0.45 * fh); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(this.cx, this.cy, this.r0 * fh, 0, ORG_TAU); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // com pouco espaço entre os ramos, mostra só alguns rótulos (o do foco ou do mouse aparece sempre)
    const visH = this.hubN.filter(x => x.vis).length || 1, every = Math.max(1, Math.ceil(34 / ((ORG_TAU * this.R * 0.3) / visH)));
    for (const hn of this.hubN) {
      if (hn.al < 0.05) continue;
      const [x, y] = this.pos(hn.a, hn.r, fh), d = 0.35 + 0.65 * hn.dm, on = hn.i === hov.hub || hn.i === st.focus;
      ctx.fillStyle = rgba(fg, hn.al * d * fh); ctx.beginPath(); ctx.arc(x, y, on ? 5 : 3.6, 0, ORG_TAU); ctx.fill();
      // rótulo ao longo do ramo, de cabeça para cima
      const ang = hn.a, flip = Math.cos(ang) < 0, lr = Math.max(this.r0 * 1.8, hn.r * fh - 20);
      const [lx, ly] = this.pos(ang, lr, 1);
      if (!on && hn.i % every !== 0) continue;
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(flip ? ang + Math.PI : ang);
      ctx.font = `${on ? 700 : 600} ${Math.max(10, Math.min(15, this.R * 0.034))}px ${th.font}`; ctx.fillStyle = rgba(fg, hn.al * d * fh * (on ? 1 : 0.9)); ctx.fillText(hn.label, 0, 0); ctx.restore();
    }
  }
  /* ---------- seleção com o mouse ---------- */
  pick(mx, my) {
    const fl = orgStage(this.grow, 0.36, 0.86), fh = orgStage(this.grow, 0, 0.38);
    let best = -1, bd = 1e9;
    for (const L of this.leafN) {
      if (L.al < 0.4 || L.rad < 0.5) continue;
      const [x, y] = this.pos(L.a, L.r, fl), d = Math.hypot(mx - x, my - y);
      if (d <= L.rad + 3 && L.rad < bd) { best = L.i; bd = L.rad; }
    }
    if (best >= 0) return { type: 'leaf', i: best };
    for (const hn of this.hubN) { if (hn.al < 0.4) continue; const [x, y] = this.pos(hn.a, hn.r, fh); if (Math.hypot(mx - x, my - y) < 14) return { type: 'hub', i: hn.i }; }
    return null;
  }
  // totais do que está visível (alimentam o mini-gráfico e o ranking)
  stats() {
    const hv = this.D.hubs.map(() => ({ v: 0, n: 0 })), ev = this.D.ents.map(() => ({ v: 0, n: 0, cv: new Map() })), cv = this.D.cols.map(() => ({ n: 0 }));
    for (const L of this.leafN) if (L.vis) { hv[L.h].v += L.v; hv[L.h].n += L.n; const e = ev[L.e]; e.v += L.v; e.n += L.n; e.cv.set(L.c, (e.cv.get(L.c) || 0) + Math.abs(L.v)); if (L.c >= 0) cv[L.c].n += L.n; }
    return { hubs: hv, ents: ev, cols: cv };
  }
}

/* ---------------- interface: painel lateral + gráfico ---------------- */
const ORG_TUT_KEY = 'dv-org-tutorial';
function renderOrganism(P, el) {
  if (el._org) el._org.destroy();
  const D = P.built.org, lang = LANG;
  if (!D) { el.innerHTML = `<div class="noins">${T('org_none')}</div>`; return null; }
  const n = D.hubs.length, piece = el.closest('.piece'), c1x = piece && piece.querySelector('#pc1x');
  const th0 = orgTheme(P), eng = new OrgEngine(D, th0, { rm: RM });
  const fmt = v => fmtNum(v, D.unit, lang), hubBase = D.hubName.replace(/ \(.*\)$/, '');
  el.innerHTML = `<div class="org"><div class="orgstage"><canvas class="orgcv" id="orgcv" role="img" aria-label="${esc(titleOf(P))}"></canvas>
    <div class="orgtools"><button type="button" id="orgpres">▶ ${T('present')}</button><button type="button" id="orgtut">? ${T('tut_help')}</button></div></div></div>`;
  // coluna 1: controles e leituras do gráfico (intervalo, legenda, mini-gráfico, ranking)
  const side0 = document.createElement('aside'); side0.className = 'orgside'; side0.style.fontFamily = fontsOf(P).body;
  side0.innerHTML = `<div class="orgblk"><div class="orgrange"><span id="orl0"></span><span id="orl1"></span></div><div class="orgsl"><input type="range" id="orA" min="0" max="${n - 1}" value="0" aria-label="${T('zoom_from')}"><input type="range" id="orB" min="0" max="${n - 1}" value="${n - 1}" aria-label="${T('zoom_to')}"></div></div>
    ${D.cols.length ? `<div class="orgblk"><div class="orgcap">${esc(D.colName || '')}</div><div class="orgleg" id="orgleg"></div><button class="orgall" id="orgall">${T('org_all')}</button></div>` : ''}
    <div class="orgblk"><div class="orgcap" id="orgcap1"></div><canvas class="orgmini" id="orgmini"></canvas><div class="orgnote" id="orgnote"></div></div>
    <div class="orgblk"><div class="orgcap">${esc(D.entName)}</div><div class="orgrank" id="orgrank"></div></div>
    <p class="orgfoot">${D.perRow ? T('org_perrow', fmtInt(D.leaves.length, lang)) : T('org_agg', fmtInt(D.rowsUsed, lang), fmtInt(D.leaves.length, lang))}</p>
    <div class="orgctip" id="orgctip" hidden></div>`;
  if (c1x) { c1x.innerHTML = ''; c1x.appendChild(side0); }
  if (piece) piece.classList.add('org-mode');
  const $o = s => el.querySelector(s), $s = s => side0.querySelector(s), cv = $o('#orgcv'), stage = $o('.orgstage'), ctip = $s('#orgctip');
  eng.ctx = csScaleFont(cv.getContext('2d'), P);
  const fit = () => { const w = Math.max(200, stage.clientWidth), h = Math.max(260, stage.clientHeight), dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); eng.resize(w, h, dpr); };
  const ro = new ResizeObserver(() => fit()); ro.observe(stage); fit();
  if (RM) eng.snap();

  /* ---------- cartão de detalhes (coluna 2) ---------- */
  let pinned = -1;
  const list = piece ? createListCol(piece) : null; if (list) list.reset();
  const card = piece ? createCardCol(piece, { onUnpin: () => { pinned = -1; eng.hov.leaf = -1; eng.kick(); if (list) list.sel(null, false); } }) : null;
  const leafModel = L => {
    const rows = D.perRow ? (L.d ? [L.d] : []) : (L.d || []), first = rows[0], left = [], texts = [];
    left.push([hubBase, D.hubs[L.h].label + (L.t ? ' · ' + L.t : '')]);
    if (L.c >= 0) left.push([D.colName, D.cols[L.c].label]);
    if (!D.perRow) left.push([T('org_rows'), fmtInt(L.n, lang)]);
    if (first) D.fields.forEach((f, k) => { const v = first[k]; if (v) (f.long ? texts : left).push([f.name, v]); });
    return { key: 'l' + L.i, kick: L.c >= 0 ? D.cols[L.c].label : hubBase, kickColor: L.c >= 0 ? orgCatColor(eng.th, L.c) : null, title: D.ents[L.e].label, value: fmt(L.v), vlabel: D.sizeName, left, texts, note: !D.perRow && first ? T('org_card_sample') : '' };
  };
  const hubModel = i => {
    const all = eng.stats().hubs, S = all[i], pv = i > 0 ? all[i - 1] : null, left = [[T('org_rows'), fmtInt(S.n, lang)]];
    if (pv && pv.v > 0) left.push([T('org_vs', D.hubs[i - 1].label), fmtPct((S.v / pv.v - 1) * 100, lang)]);
    return { key: 'h' + i, kick: hubBase, title: D.hubs[i].label, value: fmt(S.v), vlabel: D.sizeName, left, texts: [] };
  };
  const overviewModel = () => {
    const S = eng.stats(), st = eng.st, tot = S.hubs.reduce((a, h) => a + h.v, 0), rows = S.hubs.reduce((a, h) => a + h.n, 0), nEnt = S.ents.filter(e => e.n).length;
    const left = [[T('org_rows'), fmtInt(rows, lang)], [D.entName, fmtInt(nEnt, lang)]];
    if (D.cols.length) left.push([D.colName, fmtInt(D.cols.filter((_, i) => S.cols[i].n).length, lang)]);
    const top = S.ents.map((e, i) => ({ e, i })).sort((a, b) => Math.abs(b.e.v) - Math.abs(a.e.v))[0];
    if (top && top.e.n) left.push([T('card_top'), `${D.ents[top.i].label} · ${fmt(top.e.v)}`]);
    return { key: 'ov', kick: T('card_overview'), title: `${D.hubs[st.range[0]].label} – ${D.hubs[st.range[1]].label}`, value: fmt(tot), vlabel: D.sizeName, left, texts: [], hint: T('org_card_hint') };
  };
  const refreshOv = () => { if (card) card.setOverview(overviewModel()); };

  // lista completa: todas as bolhas visíveis (muda com filtro de categoria e intervalo), com busca nos textos da linha
  let listSig = null;
  function refreshList() {
    if (!list) return; const st = eng.st, sig = JSON.stringify([st.colors ? [...st.colors].sort() : null, st.range]);
    if (sig === listSig) return; listSig = sig;
    const items = eng.leafN.filter(L => L.vis).map(L => ({ id: L.i, title: D.ents[L.e].label, sub: [L.c >= 0 ? D.cols[L.c].label : '', D.hubs[L.h].label + (L.t ? ' · ' + L.t : '')].filter(Boolean).join(' · '), color: L.c >= 0 ? orgCatColor(eng.th, L.c) : null, val: fmt(L.v), v: Math.abs(L.v), ord: L.i,
      s: () => { const rows = D.perRow ? (L.d ? [L.d] : []) : (L.d || []); return D.ents[L.e].label + ' ' + (L.c >= 0 ? D.cols[L.c].label : '') + ' ' + D.hubs[L.h].label + ' ' + (L.t || '') + ' ' + rows.map(r => r.join(' ')).join(' '); } }));
    list.setItems(items, { sorts: ['v', 'n', 'o'], sort: 'v' }); list.sel(pinned >= 0 ? pinned : null, false);
  }
  function pickLeaf(i) {
    if (pinned === i) { card && card.unpin(); return; }
    const L = eng.leafN[i]; pinned = i; eng.hov.leaf = i; if (card) card.pin(leafModel(L)); if (list) list.sel(i, false);
    if (eng.st.focus !== L.h) { eng.setState({ focus: L.h }); side(); }
  }
  if (list) {
    list.onHover = id => { if (pinned < 0) { eng.hov.leaf = id; eng.kick(); if (card) card.over(leafModel(eng.leafN[id])); } };
    list.onLeave = () => { if (pinned < 0) { eng.hov.leaf = -1; eng.kick(); } if (card) card.out(); };
    list.onPick = id => pickLeaf(id);
  }

  /* painel: legenda, ranking, mini-gráfico, intervalo */
  function side() {
    const S = eng.stats(), st = eng.st;
    $s('#orl0').textContent = D.hubs[st.range[0]].label; $s('#orl1').textContent = D.hubs[st.range[1]].label;
    $s('#orgcap1').textContent = T('org_series', D.sizeName, hubBase);
    const leg = $s('#orgleg');
    if (leg) leg.innerHTML = D.cols.map((c, i) => `<button class="orgc" data-c="${i}" data-n="${S.cols[i].n}" aria-pressed="${!st.colors || st.colors.has(i)}" style="--c:${orgCatColor(eng.th, i)}"><i></i><span>${esc(c.label)}</span></button>`).join('');
    const top = S.ents.map((e, i) => ({ e, i })).filter(x => x.e.v !== 0 || x.e.n).sort((a, b) => Math.abs(b.e.v) - Math.abs(a.e.v)).slice(0, 10), mx = Math.max(1e-9, ...top.map(x => Math.abs(x.e.v)));
    $s('#orgrank').innerHTML = top.map(x => { const segs = [...x.e.cv].sort((a, b) => a[0] - b[0]).map(([c, v]) => `<i style="flex:${v};background:${orgCatColor(eng.th, c)}"></i>`).join(''); return `<div class="orgr" data-e="${x.i}"><div class="orgrb"><div class="orgrs" style="width:${Math.max(3, Math.abs(x.e.v) / mx * 100)}%">${segs}</div></div><span>${esc(D.ents[x.i].label)}</span><b>${esc(fmt(x.e.v))}</b></div>`; }).join('');
    // mini-gráfico: valor por período, dentro do intervalo
    const idx = []; for (let i = st.range[0]; i <= st.range[1]; i++) idx.push(i);
    const vals = idx.map(i => S.hubs[i].v), mc = $s('#orgmini'), dpr = Math.min(2, devicePixelRatio || 1), W = mc.clientWidth || 260, H = 84;
    mc.width = W * dpr; mc.height = H * dpr; const c = mc.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const fg = eng.th.fg, vmin = Math.min(0, ...vals), vmax = Math.max(...vals, 1e-9), X = k => 6 + (idx.length < 2 ? 0.5 : k / (idx.length - 1)) * (W - 12), Y = v => 62 - (v - vmin) / ((vmax - vmin) || 1) * 54;
    c.strokeStyle = rgba(fg, 0.12); c.lineWidth = 1; for (let g = 0; g < 3; g++) { c.beginPath(); c.moveTo(6, 8 + g * 27); c.lineTo(W - 6, 8 + g * 27); c.stroke(); }
    if (idx.length > 1) { c.beginPath(); vals.forEach((v, k) => (k ? c.lineTo(X(k), Y(v)) : c.moveTo(X(k), Y(v)))); c.strokeStyle = rgba(fg, 0.85); c.lineWidth = 1.4; c.stroke(); c.lineTo(X(idx.length - 1), 62); c.lineTo(X(0), 62); c.fillStyle = rgba(fg, 0.08); c.fill(); }
    idx.forEach((hi, k) => { c.fillStyle = rgba(hi === st.focus ? eng.th.colors[0] : fg, 0.95); c.beginPath(); c.arc(X(k), Y(vals[k]), hi === st.focus ? 4 : 2.4, 0, ORG_TAU); c.fill(); });
    c.fillStyle = rgba(fg, 0.55); c.font = `10px ${eng.th.font}`; c.textAlign = 'center';
    const every = Math.max(1, Math.ceil(idx.length / Math.max(2, Math.floor(W / 46)))); idx.forEach((hi, k) => { if (k % every === 0 || k === idx.length - 1) c.fillText(D.hubs[hi].label, Math.min(W - 14, Math.max(14, X(k))), 78); });
    const last = vals.length > 1 ? vals[vals.length - 1] : null, prev = vals.length > 1 ? vals[vals.length - 2] : null;
    $s('#orgnote').textContent = last !== null && prev > 0 ? T('org_growth', fmtPct((last / prev - 1) * 100, lang), D.hubs[idx[idx.length - 2]].label) : '';
    if (pinned >= 0 && !eng.leafN[pinned].vis && card) card.unpin();
    refreshOv(); refreshList();
  }
  const ctl = {
    engine: eng, card,
    getState: () => eng.getState(),
    setState: p => { const q = { colors: p && p.colors !== undefined ? p.colors : null, range: (p && p.range) || [0, n - 1], focus: p && p.focus !== undefined ? p.focus : null }; eng.setState(q); $s('#orA').value = q.range[0]; $s('#orB').value = q.range[1]; side(); },
    restyle: Q => { eng.th = orgTheme(Q); side0.style.fontFamily = fontsOf(Q).body; listSig = null; side(); eng.kick(); },
    tutorial: null,
    destroy: () => {
      eng.stop(); ro.disconnect(); tour.destroy();
      if (card) card.reset(); if (list) list.reset();
      side0.remove(); if (piece) piece.classList.remove('org-mode');
    },
  };
  el._org = ctl; side();

  /* interações no gráfico */
  cv.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect(), hit = eng.pick(e.clientX - r.left, e.clientY - r.top);
    if (pinned < 0) eng.hov.leaf = hit && hit.type === 'leaf' ? hit.i : -1;
    eng.hov.hub = hit && hit.type === 'hub' ? hit.i : -1; eng.kick();
    cv.style.cursor = hit ? 'pointer' : 'default';
    if (list && pinned < 0) list.hot(hit && hit.type === 'leaf' ? hit.i : null);
    if (!card) return;
    if (!hit) card.out(); else card.over(hit.type === 'leaf' ? leafModel(eng.leafN[hit.i]) : hubModel(hit.i));
  });
  cv.addEventListener('mouseleave', () => { if (pinned < 0) { eng.hov.leaf = -1; if (list) list.hot(null, false); } eng.hov.hub = -1; eng.kick(); if (card) card.out(); });
  cv.addEventListener('click', e => {
    const r = cv.getBoundingClientRect(), hit = eng.pick(e.clientX - r.left, e.clientY - r.top);
    if (hit && hit.type === 'leaf') {
      pickLeaf(hit.i);
    } else if (hit) { const h = hit.i; eng.setState({ focus: h === eng.st.focus ? null : h }); side(); }
    else if (pinned >= 0) card && card.unpin();
    else if (eng.st.focus !== null) { eng.setState({ focus: null }); side(); }
  });
  side0.addEventListener('click', e => {
    const b = e.target.closest('.orgc'), a = e.target.closest('#orgall');
    if (b) { const i = +b.dataset.c, cur = eng.st.colors ? new Set(eng.st.colors) : new Set(D.cols.map((_, k) => k)); if (!eng.st.colors) { cur.clear(); cur.add(i); } else { cur.has(i) ? cur.delete(i) : cur.add(i); } eng.setState({ colors: !cur.size || cur.size === D.cols.length ? null : [...cur] }); side(); }
    else if (a) { eng.setState({ colors: null }); side(); }
  });
  if (el._csClick) el.removeEventListener('click', el._csClick); // o contêiner é reaproveitado a cada troca de gráfico: um ouvinte só
  el._csClick = e => {
    if (e.target.closest('#orgpres')) { const bt = (piece && piece.querySelector('#pctrls [data-present]')) || document.querySelector('[data-a=present]'); if (bt) bt.click(); }
    else if (e.target.closest('#orgtut')) tour.start(true);
  };
  el.addEventListener('click', el._csClick);
  side0.addEventListener('mouseover', e => {
    const b = e.target.closest('.orgc'), r = e.target.closest('.orgr');
    eng.hov.col = b ? +b.dataset.c : -1; eng.hov.ent = r ? +r.dataset.e : -1; eng.kick();
    if (b) { const rc = b.getBoundingClientRect(); ctip.textContent = `${fmtInt(+b.dataset.n, lang)} ${T('org_rows')}`; ctip.hidden = false; ctip.style.left = Math.round(rc.left + 6) + 'px'; ctip.style.top = Math.round(rc.top - 26) + 'px'; }
  });
  side0.addEventListener('mouseout', e => { if (e.target.closest('.orgc') || e.target.closest('.orgr')) { eng.hov.col = -1; eng.hov.ent = -1; eng.kick(); } if (e.target.closest('.orgc')) ctip.hidden = true; });
  const onRange = () => { let a = +$s('#orA').value, b = +$s('#orB').value; if (a > b) { if (document.activeElement === $s('#orA')) { b = a; $s('#orB').value = b; } else { a = b; $s('#orA').value = a; } } eng.setState({ range: [a, b], focus: eng.st.focus !== null && (eng.st.focus < a || eng.st.focus > b) ? null : eng.st.focus }); side(); };
  $s('#orA').addEventListener('input', onRange); $s('#orB').addEventListener('input', onRange);

  /* ---------- tutorial de abertura: 4 etapas, só na primeira vez (casca compartilhada em charts.js) ---------- */
  const tour = createTour({
    el, piece, prefix: 'tut_', key: ORG_TUT_KEY,
    demo: id => {
      if (id !== null) { eng.hov.leaf = id; eng.kick(); if (card) card.over(leafModel(eng.leafN[id])); if (list) list.hot(id, true); }
      else if (pinned < 0) { eng.hov.leaf = -1; eng.kick(); if (card) card.out(); if (list) list.hot(null, false); }
    },
    steps: () => {
      const sr = stage.getBoundingClientRect(), R = eng.R, ring = { x: sr.left + eng.cx - R, y: sr.top + eng.cy - R, w: 2 * R, h: 2 * R, round: true };
      let big = null; for (const L of eng.leafN) if (L.vis && L.al > 0.5 && (!big || L.rad > big.rad)) big = L;
      const c2 = piece && piece.querySelector('#pc2'), cardBox = c2 ? csPad(csBox(c2.getBoundingClientRect()), 6) : ring;
      const blks = [...side0.querySelectorAll('.orgblk')].slice(0, D.cols.length ? 2 : 1).map(b => csBox(b.getBoundingClientRect()));
      const u = blks.reduce((a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), x2: Math.max(a.x2, b.x + b.w), y2: Math.max(a.y2, b.y + b.h) }), { x: 1e9, y: 1e9, x2: 0, y2: 0 });
      const flt = blks.length ? csPad({ x: u.x, y: u.y, w: u.x2 - u.x, h: u.y2 - u.y }, 8) : ring;
      return [{ k: 1, t: csPad(ring, 34) }, { k: 2, t: cardBox, demo: big && big.i }, { k: 3, t: flt }, { k: 4, t: csPad(csBox($o('.orgtools').getBoundingClientRect()), 8) }];
    },
  });
  ctl.tutorial = () => tour.start(true); ctl.tour = tour;
  tour.auto();
  return ctl;
}
// quadro estático do organismo, para PNG: mesmo layout e mesmas cores, sem mouse
function drawOrganismStatic(P, ctx, x, y, w, h, state) {
  const D = P.built.org; if (!D) return;
  const eng = new OrgEngine(D, orgTheme(P), { rm: true });
  eng.resize(w, h, 1); if (state) eng.setState(state); eng.snap();
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); eng.draw(ctx, { clear: false }); ctx.restore(); eng.stop();
}
