/* Datavix: galeria de gráficos (4): mapas. Mapa de bolhas (uma bolha por estado do Brasil, área pelo valor) e mapa de isolinhas
 * (curvas de mesmo valor a partir de latitude e longitude). Os contornos dos estados vêm das malhas do IBGE (CC BY 4.0), simplificados e embutidos
 * (GEO_BR, ver scripts/make-brasil.py): nada é baixado na hora. Mesmo motor (GalEngine) e mesma casca dos demais gráficos. */
const GAL4_BBOX = { lonMin: -74, lonMax: -34, latMin: -34, latMax: 5.6 }, GAL4_GRID = 64, GAL4_LEVELS = 6, GAL4_PTS = 6000;
const GAL4_REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const gal4Norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
let GAL4_NAMES = null;
function gal4Uf(s) {
  if (!GAL4_NAMES) { GAL4_NAMES = new Map(); for (const k in GEO_BR) { GAL4_NAMES.set(k.toLowerCase(), k); GAL4_NAMES.set(gal4Norm(GEO_BR[k].n), k); } }
  return GAL4_NAMES.get(gal4Norm(s)) || null;
}
// projeção: graus -> pixels, com a escala de longitude corrigida pela latitude média
function gal4Proj(W, H, bb, top = 38, side = 18, bottom = 18) {
  const lat0 = (bb.latMin + bb.latMax) / 2, k = Math.cos(lat0 * Math.PI / 180), dx = (bb.lonMax - bb.lonMin) * k, dy = bb.latMax - bb.latMin, sc = Math.min((W - 2 * side) / dx, (H - top - bottom) / dy);
  const ox = (W - dx * sc) / 2 - bb.lonMin * k * sc, oy = top + (H - top - bottom - dy * sc) / 2 + bb.latMax * sc;
  return { sc, X: lon => ox + lon * k * sc, Y: lat => oy - lat * sc, inv: (x, y) => [(x - ox) / (k * sc), (oy - y) / sc] };
}

/* ---------------- dados ---------------- */
function gal4SuggestBubble(cols) {
  const g = cols.map((c, i) => i).filter(i => cols[i].kind === 'geo' && cols[i].codes && cols[i].use !== false && cols[i].dict.filter(v => gal4Uf(v)).length >= 3)[0];
  if (g === undefined) return null; const vi = bestMeasure(cols), avg = vi >= 0 && galIsAvg(cols[vi]);
  return { geo: g, val: vi, agg: vi < 0 ? 'count' : avg ? 'mean' : 'sum' };
}
const gal4Latlon = (cols, re, lo, hi) => cols.map((c, i) => i).filter(i => isMeasure(cols[i]) && re.test(cols[i].name) && cols[i].min >= lo && cols[i].max <= hi);
function gal4SuggestIso(cols) {
  const la = gal4Latlon(cols, /(^|[^a-z])(lat|latitude)([^a-z]|$)/i, -90, 90)[0], lo = gal4Latlon(cols, /(^|[^a-z])(lon|lng|long|longitude)([^a-z]|$)/i, -180, 180)[0];
  if (la === undefined || lo === undefined) return null;
  const vi = cols.map((c, i) => i).filter(i => isMeasure(cols[i]) && i !== la && i !== lo && cols[i].role !== 'id'), v = vi.find(i => MONEY_HINT.test(cols[i].name)) ?? vi[0];
  return v === undefined ? null : { lat: la, lon: lo, val: v, agg: 'mean' };
}
function gal4BuildBubble(ds, m, opts) {
  const cols = ds.columns, lang = opts.lang || 'pt', policy = opts.nullPolicy || 'ignore', gc = m && m.geo >= 0 ? cols[m.geo] : null, vc = m && m.val >= 0 ? cols[m.val] : null; if (!gc || !gc.codes || (vc && !isMeasure(vc))) return null;
  const agg = vc ? (m.agg || 'sum') : 'count', ufOf = gc.dict.map(v => gal4Uf(v)), acc = new Map(); let used = 0, unknown = 0;
  for (let i = 0; i < ds.rowCount; i++) { const k = gc.codes[i]; if (k < 0) continue; const uf = ufOf[k]; if (!uf) { unknown++; continue; } let v = vc ? vc.data[i] : 1; if (Number.isNaN(v)) { if (policy === 'zero') v = 0; else continue; } let a = acc.get(uf); if (!a) { a = { uf, sum: 0, n: 0 }; acc.set(uf, a); } a.sum += v; a.n++; used++; }
  let list = [...acc.values()].map(a => ({ uf: a.uf, v: agg === 'mean' ? (a.n ? a.sum / a.n : 0) : agg === 'count' ? a.n : a.sum, n: a.n })); const dropped = list.filter(x => !(x.v > 0)).length; list = list.filter(x => x.v > 0).sort((a, b) => b.v - a.v); if (list.length < 3) return null;
  const regs = GAL4_REGIONS.filter(r => list.some(x => GEO_BR[x.uf].r === r)), total = list.reduce((s, x) => s + x.v, 0);
  const items = list.map((x, i) => ({ label: GEO_BR[x.uf].n, uf: x.uf, v: x.v, n: x.n, g: i, x: i, c: regs.indexOf(GEO_BR[x.uf].r), lg: regs.indexOf(GEO_BR[x.uf].r), share: x.v / total * 100 }));
  return { mode: 'bubmap', catName: gc.name, xName: gc.name, grpName: lang === 'en' ? 'Region' : 'Região', valName: vc ? vc.name : (lang === 'en' ? 'Rows' : 'Linhas'), unit: vc ? vc.unit : null, agg, items, legend: regs.map((r, i) => ({ label: r, c: i, n: items.filter(it => it.c === i).length })), xs: [], total, rowsTotal: ds.rowCount, rowsUsed: used, dropped, unknown, catTotal: list.length };
}
function gal4BuildIso(ds, m, opts) {
  const cols = ds.columns, lang = opts.lang || 'pt', la = m && m.lat >= 0 ? cols[m.lat] : null, lo = m && m.lon >= 0 ? cols[m.lon] : null, vc = m && m.val >= 0 ? cols[m.val] : null; if (!la || !lo || !vc || !isMeasure(la) || !isMeasure(lo) || !isMeasure(vc)) return null;
  const pts = []; let step = Math.max(1, Math.ceil(ds.rowCount / GAL4_PTS));
  for (let i = 0; i < ds.rowCount; i += step) { const y = la.data[i], x = lo.data[i], v = vc.data[i]; if (Number.isNaN(y) || Number.isNaN(x) || Number.isNaN(v) || Math.abs(y) > 90 || Math.abs(x) > 180) continue; pts.push([x, y, v]); }
  if (pts.length < 12) return null;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; pts.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
  const px = Math.max((x1 - x0) * 0.08, 0.5), py = Math.max((y1 - y0) * 0.08, 0.5), bb = { lonMin: x0 - px, lonMax: x1 + px, latMin: y0 - py, latMax: y1 + py };
  // IDW (potência 2) nos 12 pontos mais próximos; células longe demais de qualquer ponto ficam vazias
  const nx = GAL4_GRID, ny = GAL4_GRID, diag = Math.hypot(bb.lonMax - bb.lonMin, bb.latMax - bb.latMin), maxD = diag * 0.1, grid = new Array(nx * ny).fill(null), vs = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const gx = bb.lonMin + (bb.lonMax - bb.lonMin) * i / (nx - 1), gy = bb.latMax - (bb.latMax - bb.latMin) * j / (ny - 1); let best = [];
    for (const p of pts) { const d = Math.hypot(p[0] - gx, p[1] - gy); if (d <= maxD * 1.6) best.push([d, p[2]]); }
    if (!best.length) continue; best.sort((a, b) => a[0] - b[0]); best = best.slice(0, 12); if (best[0][0] > maxD) continue;
    let sw = 0, sv = 0; for (const [d, v] of best) { const w = 1 / Math.max(d * d, 1e-9); sw += w; sv += w * v; } const v = sv / sw; grid[j * nx + i] = v; vs.push(v);
  }
  if (vs.length < 40) return null; vs.sort((a, b) => a - b); const q = p => vs[Math.min(vs.length - 1, Math.floor(p * (vs.length - 1)))], l0 = q(0.1), l1 = q(0.9);
  if (!(l1 > l0)) return null; const levels = Array.from({ length: GAL4_LEVELS }, (_, k) => l0 + (l1 - l0) * k / (GAL4_LEVELS - 1));
  const items = levels.map((lv, k) => { const above = vs.filter(v => v >= lv).length; return { label: fmtNum(lv, vc.unit, lang), v: lv, n: pts.filter(p => p[2] >= lv).length, g: k, x: k, c: k, lg: k, share: above / vs.length * 100 }; });
  return { mode: 'isomap', catName: vc.name, xName: vc.name, grpName: null, valName: vc.name, unit: vc.unit, agg: 'mean', items, legend: [], xs: [], bb, nx, ny, grid, levels, pts: pts.length > 1500 ? pts.filter((_, i) => i % Math.ceil(pts.length / 1500) === 0) : pts, rowsTotal: ds.rowCount, rowsUsed: pts.length, dropped: 0, latName: la.name, lonName: lo.name, catTotal: pts.length };
}
const gal4Fit = (mode, built, br) => { const D = csBuilt({ built }, mode); if (!D) return 0; return mode === 'bubmap' ? (br && br.story === 'geo' ? 0.95 : 0.7) : (br && br.story === 'geo' ? 0.85 : 0.6); };

/* ---------------- geometria e desenho (somados ao GalEngine) ---------------- */
function gal4Segments(D) { // marching squares em graus: lista de segmentos por nível
  const { nx, ny, grid, bb, levels } = D, X = i => bb.lonMin + (bb.lonMax - bb.lonMin) * i / (nx - 1), Y = j => bb.latMax - (bb.latMax - bb.latMin) * j / (ny - 1), out = levels.map(() => []);
  const V = (i, j) => grid[j * nx + i], lerp = (a, b, va, vb, lv) => (a + (b - a) * ((lv - va) / (vb - va || 1e-12)));
  for (let k = 0; k < levels.length; k++) { const lv = levels[k];
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = V(i, j), b = V(i + 1, j), c = V(i + 1, j + 1), d = V(i, j + 1); if (a === null || b === null || c === null || d === null) continue;
      const idx = (a >= lv ? 8 : 0) | (b >= lv ? 4 : 0) | (c >= lv ? 2 : 0) | (d >= lv ? 1 : 0); if (idx === 0 || idx === 15) continue;
      const T = [lerp(X(i), X(i + 1), a, b, lv), Y(j)], R = [X(i + 1), lerp(Y(j), Y(j + 1), b, c, lv)], B = [lerp(X(i), X(i + 1), d, c, lv), Y(j + 1)], Lf = [X(i), lerp(Y(j), Y(j + 1), a, d, lv)], push = (p, q) => out[k].push([p[0], p[1], q[0], q[1]]);
      switch (idx) { case 1: case 14: push(Lf, B); break; case 2: case 13: push(B, R); break; case 3: case 12: push(Lf, R); break; case 4: case 11: push(T, R); break; case 6: case 9: push(T, B); break; case 7: case 8: push(Lf, T); break; case 5: push(Lf, T); push(B, R); break; case 10: push(T, R); push(Lf, B); break; }
    } }
  return out;
}
Object.assign(GalEngine.prototype, {
  layoutMap() {
    const { D, N } = this, W = this.w, H = this.h; this.titles = []; const pr = gal4Proj(W, H, GAL4_BBOX); this.pr = pr; this.paths = {};
    for (const uf in GEO_BR) { const p = new Path2D(); for (const ring of GEO_BR[uf].p) { ring.forEach((v, i) => { if (i % 2) return; const x = pr.X(v / 100), y = pr.Y(ring[i + 1] / 100); i ? p.lineTo(x, y) : p.moveTo(x, y); }); p.closePath(); } this.paths[uf] = p; }
    const vmax = Math.max(...D.items.map(it => it.v)), rmax = galClamp(Math.min(W, H) / 8.5, 16, 56);
    N.forEach(n => { const c = GEO_BR[n.it.uf].c, x = pr.X(c[0] / 100), y = pr.Y(c[1] / 100); n.tal = n.vis ? 1 : 0; n.gd = n.i / Math.max(1, N.length); n.t = { cx: 0, cy: 0, r0: 0, r1: 0, a0: 0, a1: 0, x, y, r: n.vis ? rmax * Math.sqrt(n.it.v / vmax) : 0, w: 0, h: 0, m1: 0, m2: 0, m3: 0, m4: 0 }; });
  },
  drawMap(ctx, hv, fr) {
    const { th, N, D } = this, fg = th.fg, base = th.base; ctx.lineJoin = 'round'; const have = new Set(N.filter(n => n.vis).map(n => n.it.uf)), hov = hv ? hv.it.uf : null;
    for (const uf in this.paths) { const on = uf === hov, has = have.has(uf); ctx.fillStyle = rgba(fg, (has ? 0.1 : 0.04) * fr + (on ? 0.1 : 0)); ctx.fill(this.paths[uf]); ctx.strokeStyle = rgba(fg, (on ? 0.7 : 0.24) * fr); ctx.lineWidth = on ? 1.6 : 0.8; ctx.stroke(this.paths[uf]); }
    for (const n of N.slice().sort((a, b) => b.it.v - a.it.v).sort((a, b) => (a === hv) - (b === hv))) {
      if (n.al < 0.02) continue; const g = n.g, r = g.r * this.prog(n), al = n.al * n.dm, col = this.col(n.it.c), on = n === hv; if (r < 1) continue;
      ctx.beginPath(); ctx.arc(g.x, g.y, r, 0, ORG_TAU); ctx.fillStyle = rgba(col, (this.light ? 0.72 : 0.6) * al); ctx.fill(); ctx.strokeStyle = rgba(on ? fg : col, (on ? 1 : 0.95) * al); ctx.lineWidth = on ? 2.2 : 1.2; ctx.stroke();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const n of N) { if (n.al < 0.4) continue; const r = n.g.r * this.prog(n), on = n === hv; if (r < 11 && !on) continue; const col = this.col(n.it.c), fs = galClamp(r * 0.62, 9, 14); ctx.font = `700 ${fs}px ${th.font}`; ctx.fillStyle = rgba(this.light ? fg : readableOn(mixHex(col, base, 0.5)), n.al * n.dm * orgStage(this.grow, 0.5, 1)); ctx.fillText(n.it.uf, n.g.x, n.g.y - (on ? fs * 0.55 : 0)); if (on) { ctx.font = `600 ${fs - 1}px ${th.font}`; ctx.fillText(fmtNum(n.it.v, D.unit, LANG), n.g.x, n.g.y + fs * 0.65); } }
  },
  layoutIso() {
    const { D, N } = this, W = this.w, H = this.h; this.titles = []; const pr = gal4Proj(W, H, D.bb, 40, 22, 22); this.pr = pr; this.paths = {};
    for (const uf in GEO_BR) { const p = new Path2D(); for (const ring of GEO_BR[uf].p) { ring.forEach((v, i) => { if (i % 2) return; const x = pr.X(v / 100), y = pr.Y(ring[i + 1] / 100); i ? p.lineTo(x, y) : p.moveTo(x, y); }); p.closePath(); } this.paths[uf] = p; }
    if (!this.segs) this.segs = gal4Segments(D);
    this.px = this.segs.map(L => L.map(s => [pr.X(s[0]), pr.Y(s[1]), pr.X(s[2]), pr.Y(s[3])]));
    N.forEach(n => { n.tal = n.vis ? 1 : 0; n.gd = n.i / Math.max(1, N.length); n.t = { cx: 0, cy: 0, r0: 0, r1: 0, a0: 0, a1: 0, x: 0, y: 0, r: 0, w: 0, h: 0, m1: 0, m2: 0, m3: 0, m4: 0 }; });
  },
  drawIso(ctx, hv, fr) {
    const { th, N, D, pr } = this, fg = th.fg, base = th.base, { nx, ny, grid, bb, levels } = D, L = levels.length, accent = th.colors[0];
    const r0 = mixHex(base, accent, 0.35), r1 = mixHex(accent, '#ffffff', this.light ? 0 : 0.4), ramp = k => mixHex(r0, r1, galClamp(k / Math.max(1, L - 1), 0, 1)), cellW = (pr.X(bb.lonMax) - pr.X(bb.lonMin)) / (nx - 1), cellH = (pr.Y(bb.latMin) - pr.Y(bb.latMax)) / (ny - 1);
    // faixas (cada célula na cor do seu intervalo), contornos dos estados, isolinhas e os pontos da planilha
    ctx.save(); const fall = new Path2D(); for (const uf in this.paths) fall.addPath(this.paths[uf]); ctx.clip(fall);
    const key = base + accent + this.light; // o campo estimado vira uma imagem pequena (uma célula por pixel), ampliada com suavização
    if (!this._hm || this._hm.key !== key) { const cv = document.createElement('canvas'); cv.width = nx; cv.height = ny; const c2 = cv.getContext('2d'), img = c2.createImageData(nx, ny), a0 = levels[0], a1 = levels[L - 1];
      for (let q = 0; q < nx * ny; q++) { const v = grid[q]; if (v === null) continue; const t = galClamp((v - a0) / (a1 - a0 || 1), 0, 1), rgb = hexToRgb(mixHex(r0, r1, t)); img.data[q * 4] = rgb[0]; img.data[q * 4 + 1] = rgb[1]; img.data[q * 4 + 2] = rgb[2]; img.data[q * 4 + 3] = Math.round(255 * (0.22 + 0.55 * t)); }
      c2.putImageData(img, 0, 0); this._hm = { key, cv }; }
    ctx.imageSmoothingEnabled = true; ctx.globalAlpha = fr; ctx.drawImage(this._hm.cv, pr.X(bb.lonMin) - cellW / 2, pr.Y(bb.latMax) - cellH / 2, cellW * nx, cellH * ny); ctx.globalAlpha = 1;
    ctx.restore();
    ctx.lineJoin = 'round'; for (const uf in this.paths) { ctx.strokeStyle = rgba(fg, 0.26 * fr); ctx.lineWidth = 0.8; ctx.stroke(this.paths[uf]); }
    ctx.lineCap = 'round'; const hiLv = hv ? hv.i : -1;
    for (let k = 0; k < L; k++) { const n = N[k], on = k === hiLv; if (n.al < 0.02) continue; const rev = orgEase(orgClamp((this.grow - k * 0.07) / 0.6)), segs = this.px[k], upto = Math.floor(segs.length * rev); ctx.strokeStyle = rgba(on ? fg : ramp(k), (on ? 1 : 0.95) * n.al * n.dm); ctx.lineWidth = on ? 3 : 1.6; ctx.beginPath(); for (let s = 0; s < upto; s++) { const q = segs[s]; ctx.moveTo(q[0], q[1]); ctx.lineTo(q[2], q[3]); } ctx.stroke(); }
    ctx.fillStyle = rgba(fg, 0.38 * fr); for (const p of D.pts) { ctx.beginPath(); ctx.arc(pr.X(p[0]), pr.Y(p[1]), 1.5, 0, ORG_TAU); ctx.fill(); }
    // legenda de níveis no canto
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; const lx = 18, ly = this.h - 20 - L * 18; ctx.font = `600 11px ${th.font}`;
    levels.forEach((lv, k) => { const y = ly + k * 18; ctx.fillStyle = rgba(ramp(k), (k === hiLv ? 1 : 0.9) * fr); ctx.fillRect(lx, y - 5, 22, 10); ctx.fillStyle = rgba(fg, (k === hiLv ? 1 : 0.8) * fr); ctx.fillText('≥ ' + fmtNum(lv, D.unit, LANG), lx + 30, y); });
  },
  pickMap(mx, my) {
    const D = this.D;
    if (D.mode === 'bubmap') { let best = null, bd = 1e9; for (const n of this.N) { if (n.al < 0.4) continue; const d = Math.hypot(mx - n.g.x, my - n.g.y); if (d <= n.g.r + 3 && d < bd) { bd = d; best = n.i; } }
      if (best !== null) return best; const ctx = gal4Pick(); for (const n of this.N) if (n.vis && n.al > 0.4 && this.paths[n.it.uf] && ctx.isPointInPath(this.paths[n.it.uf], mx, my)) return n.i; return null; }
    let best = null, bd = 9; this.px.forEach((segs, k) => { if (this.N[k].al < 0.4) return; for (const s of segs) { const dx = s[2] - s[0], dy = s[3] - s[1], L2 = dx * dx + dy * dy || 1, t = galClamp(((mx - s[0]) * dx + (my - s[1]) * dy) / L2, 0, 1), d = Math.hypot(mx - (s[0] + t * dx), my - (s[1] + t * dy)); if (d < bd) { bd = d; best = k; } } }); return best;
  },
});
const gal4Pick = () => (gal4Pick._c || (gal4Pick._c = document.createElement('canvas').getContext('2d')));

/* ---------------- interface ---------------- */
function gal4Render(mode, P, el) {
  if (el._org) el._org.destroy();
  const D = csBuilt(P, mode), lang = LANG; if (!D) { el.innerHTML = `<div class="noins">${T('gal_none')}</div>`; return null; }
  const iso = mode === 'isomap', fmt = v => fmtNum(v, D.unit, lang), aggL = `${T('cs_aggs')[D.agg]} · ${D.valName}`;
  const sideHtml = `${!iso && D.legend.length ? `<div class="orgblk"><div class="orgcap">${esc(D.grpName)}</div><div class="orgleg" id="orgleg"></div><button class="orgall" id="orgall">${T('org_all')}</button></div>` : ''}
    <div class="orgblk"><div class="orgcap">${T(iso ? 'gal4_rank_i' : 'gal4_rank_b')}</div><div class="orgrank" id="orgrank"></div></div><p class="orgfoot">${T(iso ? 'gal4_base_i' : 'gal4_base_b')}</p>`;
  let eng = null, S = null; const stats = () => S || (S = eng.stats());
  const model = id => {
    const it = D.items[id], s = stats(), rk = s.rank.get(id), left = [];
    if (iso) { left.push([T('gal4_area'), csPct(it.share, lang)], [T('gal4_pts'), `${fmtInt(it.n, lang)} ${T('gal4_of')} ${fmtInt(D.rowsUsed, lang)}`]); return { key: 'g' + id, kick: D.valName, kickColor: orgCatColor(eng.th, 0), title: `≥ ${it.label}`, value: it.label, vlabel: aggL, left, texts: [], note: T('gal4_iso_note') }; }
    left.push([D.grpName, GEO_BR[it.uf].r]); if (rk) left.push([T('gal_pos'), T('gal_of', rk, fmtInt(s.n, lang))]); if (D.agg !== 'mean') left.push([T('gal_share'), csPct(s.total ? it.v / s.total * 100 : 0, lang)]); if (it.n > 1) left.push([T('rays_rows'), fmtInt(it.n, lang)]);
    return { key: 'g' + id, kick: GEO_BR[it.uf].r, kickColor: orgCatColor(eng.th, it.c), title: `${it.label} (${it.uf})`, value: fmt(it.v), vlabel: aggL, left, texts: [], note: '' };
  };
  const overview = () => {
    const s = stats(), byV = s.ids.map(i => D.items[i]), top = byV[0], low = byV[byV.length - 1];
    if (iso) return { key: 'ov', kick: T('card_overview'), title: D.valName, value: fmtInt(D.rowsUsed, lang), vlabel: T('gal4_pts'), left: [[T('gal4_lat'), D.latName], [T('gal4_lon'), D.lonName], [T('gal4_levels'), fmtInt(D.levels.length, lang)], [T('rays_ov_min'), fmt(D.levels[0])], [T('rays_ov_max'), fmt(D.levels[D.levels.length - 1])]], texts: [], hint: T('rays_ov_hint') };
    const left = [[T('gal4_states'), fmtInt(s.n, lang)]]; if (top) left.push([T('rays_ov_max'), `${top.label} · ${fmt(top.v)}`]); if (low && low !== top) left.push([T('rays_ov_min'), `${low.label} · ${fmt(low.v)}`]); if (top && s.total && D.agg !== 'mean') left.push([T('gal_top_share'), csPct(top.v / s.total * 100, lang)]);
    return { key: 'ov', kick: T('card_overview'), title: D.catName, value: fmt(D.agg === 'mean' ? s.mean : s.total), vlabel: aggL, left, texts: [], hint: T('rays_ov_hint') };
  };
  const h = {
    model, overview,
    listItems() { const sig = JSON.stringify([...eng.st.hidden].sort()), items = eng.N.filter(n => n.vis).map(n => ({ id: n.i, title: iso ? `≥ ${n.it.label}` : `${n.it.label} (${n.it.uf})`, sub: iso ? `${csPct(n.it.share, lang)} · ${fmtInt(n.it.n, lang)} ${T('gal4_pts')}` : GEO_BR[n.it.uf].r, color: orgCatColor(eng.th, n.it.c), val: iso ? '' : fmt(n.it.v), v: n.it.v, ord: n.i, s: () => n.it.label + (n.it.uf || '') })); return { sig, items, sorts: iso ? ['o'] : ['v', 'n', 'o'], sort: iso ? 'o' : 'v' }; },
    visible: id => eng.N[id].vis,
    side(side0) {
      S = null; const s = stats(), st = eng.st, $ = q => side0.querySelector(q), leg = $('#orgleg');
      if (leg) leg.innerHTML = D.legend.map((g, i) => `<button class="orgc" data-c="${i}" data-n="${g.n}" aria-pressed="${!st.hidden.has(i)}" style="--c:${orgCatColor(eng.th, g.c)}"><i></i><span>${esc(g.label)}</span></button>`).join('');
      const top = iso ? D.items.map((it, i) => ({ id: i, v: it.share, label: `≥ ${it.label}`, txt: csPct(it.share, lang), c: orgCatColor(eng.th, 0) })) : s.ids.slice(0, 10).map(i => ({ id: i, v: D.items[i].v, label: `${D.items[i].label} (${D.items[i].uf})`, txt: fmt(D.items[i].v), c: orgCatColor(eng.th, D.items[i].c) })), mx = Math.max(1e-9, ...top.map(x => Math.abs(x.v)));
      $('#orgrank').innerHTML = top.map(x => `<div class="orgr" data-e="${x.id}"><div class="orgrb"><div class="orgrs" style="width:${Math.max(3, Math.abs(x.v) / mx * 100)}%"><i style="flex:1;background:${x.c}"></i></div></div><span>${esc(x.label)}</span><b>${esc(x.txt)}</b></div>`).join('');
    },
    syncSide() {},
    bindSide(side0, c) {
      const { eng: e, refresh, ctip } = c, nL = D.legend.length;
      side0.addEventListener('click', ev => { const b = ev.target.closest('.orgc'), a = ev.target.closest('#orgall'); if (b) { const i = +b.dataset.c, hid = new Set(e.st.hidden); if (hid.size === 0) { for (let k = 0; k < nL; k++) if (k !== i) hid.add(k); } else if (hid.has(i)) hid.delete(i); else hid.add(i); if (hid.size >= nL) hid.clear(); e.patch({ hidden: [...hid] }); refresh(); } else if (a) { e.patch({ hidden: [] }); refresh(); } });
      side0.addEventListener('mouseover', ev => { const b = ev.target.closest('.orgc'), r = ev.target.closest('.orgr[data-e]'); e.hovLg = b ? +b.dataset.c : -1; e.kick(); if (r && /^\d+$/.test(r.dataset.e)) c.hover(+r.dataset.e); if (b) { const rc = b.getBoundingClientRect(); ctip.textContent = `${fmtInt(+b.dataset.n, lang)} ${T('gal4_states')}`; ctip.hidden = false; ctip.style.left = Math.round(rc.left + 6) + 'px'; ctip.style.top = Math.round(rc.top - 26) + 'px'; } });
      side0.addEventListener('mouseout', ev => { if (ev.target.closest('.orgc')) { e.hovLg = -1; e.kick(); ctip.hidden = true; } if (ev.target.closest('.orgr[data-e]')) c.hover(null); });
    },
    tour({ stage, piece }) { const sr = stage.getBoundingClientRect(), bx = { x: sr.left + 12, y: sr.top + 12, w: Math.max(80, sr.width - 24), h: Math.max(80, sr.height - 24) }, c2 = piece && piece.querySelector('#pc2'), cardBox = c2 ? csPad(csBox(c2.getBoundingClientRect()), 6) : bx; return [{ k: 1, t: bx }, { k: 2, t: cardBox, demo: iso ? 0 : stats().ids[0] }]; },
  };
  eng = new GalEngine(D, orgTheme(P), { rm: RM });
  return csMount(P, el, { id: mode, sideHtml, tutPrefix: 'tut_gal_', tutKey: 'dv-gal-tutorial' }, () => eng, h);
}
function gal4Steps(mode, P) {
  const D = csBuilt(P, mode), out = []; if (!D) return out;
  if (mode === 'isomap') { [1, 3, 5].forEach(k => { if (D.items[k]) out.push({ id: 'l' + k, caption: `≥ ${D.items[k].label} · ${csPct(D.items[k].share, LANG)} ${T('gal4_ofmap')}`, state: { cs: { spot: k } } }); }); return out; }
  D.items.map((it, i) => [it, i]).slice(0, 3).forEach(([it, i]) => out.push({ id: 's' + i, caption: `${it.label} · ${fmtNum(it.v, D.unit, LANG)} · ${csPct(it.share, LANG)}`, state: { cs: { spot: i } } }));
  return out;
}
function gal4Insights(D, briefing, lang, T) { if (D.mode !== 'bubmap') return []; const tot = D.items.map(it => ({ label: it.label, value: it.v, rows: it.n })); const pseudo = { kind: 'category', names: { x: D.catName, y: D.valName }, unit: D.unit, aggKind: D.agg, totX: tot, totS: null, xIsTime: false, stats: {} }; return tot.length >= 3 ? computeInsights(pseudo, briefing, lang, T) : []; }
function gal4Note(mode, P) { const D = csBuilt(P, mode); if (!D) return ''; return mode === 'isomap' ? T('gal4_note_i', D.valName, D.levels.length, D.rowsUsed) : T('gal4_note_b', T('cs_aggs')[D.agg].toLowerCase(), D.valName, D.catName, D.catTotal) + (D.unknown ? ' ' + T('gal4_unknown', D.unknown) : '') + (D.dropped ? ' ' + T('gal_dropped', D.dropped) : ''); }
[
  { id: 'bubmap', suggest: gal4SuggestBubble, build: gal4BuildBubble, fields: [{ k: 'geo', label: 'gal4_geo', role: 'geo' }, { k: 'val', label: 'gal_val_b', role: 'measure', none: 'org_rowsopt' }, { k: 'agg', role: 'agg' }] },
  { id: 'isomap', suggest: gal4SuggestIso, build: gal4BuildIso, fields: [{ k: 'lat', label: 'gal4_lat', role: 'lat' }, { k: 'lon', label: 'gal4_lon', role: 'lon' }, { k: 'val', label: 'gal4_val', role: 'measure' }] },
].forEach(d => regChart({
  id: d.id, suggest: d.suggest, build: d.build, fit: (b, br) => gal4Fit(d.id, b, br), render: (P, el) => gal4Render(d.id, P, el), steps: P => gal4Steps(d.id, P), drawStatic: (P, ctx, x, y, w, h, st) => galDrawStatic(d.id, P, ctx, x, y, w, h, st),
  insights: gal4Insights, note: P => gal4Note(d.id, P), fields: d.fields, names: b => (d.id === 'isomap' ? { lat: b.latName, lon: b.lonName, val: b.valName } : { geo: b.catName, val: ['Linhas', 'Rows'].includes(b.valName) ? null : b.valName }), summary: b => T('gal4_sum', fmtInt(b.items.length, LANG)),
}));
