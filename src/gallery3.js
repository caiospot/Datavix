/* Datavix: galeria de gráficos (3): distribuição e texto. Box & whisker (quartis, bigodes e pontos fora, por categoria) e nuvem de palavras
 * (as palavras que mais se repetem no texto livre, contadas em quantas linhas aparecem). Mesmo motor (GalEngine) e mesma casca dos demais. */
const GAL3_BOXES = 12, GAL3_WORDS = 60, GAL3_MIN_BOX = 5;
const GAL_STOP = new Set(('para com uma uns umas como mais mas pela pelo pelas pelos sobre entre quando onde porque que foi foram esta este isso essa esse ainda tambem apos cada seus suas dele dela eles elas muito sido sendo tinha tinham dos das nos nas num numa ser estar fazer feito fez havia nao sim seu sua pois tem tendo ter nessa nesse nesta neste esses essas depois antes sem ate aos pode podem deve devem eram estao estava estavam desde aqui ali alem outro outra outros outras mesmo mesma ja so quanto qual quais estou estamos tenho temos tive fiz fica ficou ficam quer quero disse falou porem entao assim vai vou fosse ' +
  'with that this have from were been they their there which would about will your what when more also than then into only some such other after before while them these those over under because between during being does done make made very just like each both without within').split(' '));
const galNorm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ---------------- dados ---------------- */
function gal3Quant(a, p) { const k = (a.length - 1) * p, f = Math.floor(k), c = Math.min(a.length - 1, f + 1); return a[f] + (a[c] - a[f]) * (k - f); }
function gal3SuggestBox(cols) {
  const v = bestMeasure(cols); if (v < 0) return null; const n = Math.max(0, ...cols.map(csColRows));
  const c = galDimCols(cols, 2, GAL3_BOXES, 26).filter(i => cols[i].role !== 'flag' && distinctOf(cols[i]) * GAL3_MIN_BOX <= n).sort((a, b) => Math.abs(distinctOf(cols[a]) - 6) - Math.abs(distinctOf(cols[b]) - 6))[0];
  return c === undefined ? null : { cat: c, val: v };
}
function gal3SuggestWords(cols, area) {
  const rx = AREAS[area] && AREAS[area].text, hint = /voz|coment|comment|feedback|relato|descri|detalh|observa|queixa|sugest|mensagem|texto|text|nota\b|notes?/i;
  const cand = cols.map((c, i) => i).filter(i => wcTextCol(cols[i]) && csFilled(cols[i]) >= 20);
  if (!cand.length) return null; const score = i => (hint.test(cols[i].name) || (rx && rx.test(cols[i].name)) ? 1e6 : 0) + csAvgLen(cols[i]) * Math.min(1, csFilled(cols[i]) / 100);
  cand.sort((a, b) => score(b) - score(a)); return { text: cand[0] };
}
const wcTextCol = c => c.use !== false && c.role !== 'pii' && c.role !== 'id' && (c.kind === 'text' || (c.dict && csAvgLen(c) > 24)) && (c.texts || c.dict);
const csFilled = c => { const n = csColRows(c); let k = 0; if (c.texts) { for (let i = 0; i < n; i++) if (c.texts[i]) k++; } else if (c.codes) { for (let i = 0; i < n; i++) if (c.codes[i] >= 0) k++; } return k; };
function gal3BuildBox(ds, m, opts) {
  const cols = ds.columns, lang = opts.lang || 'pt', cc = m && m.cat >= 0 ? cols[m.cat] : null, vc = m && m.val >= 0 ? cols[m.val] : null; if (!cc || !vc || !cc.codes || !isDim(cc) || !isMeasure(vc)) return null;
  const by = new Map(); let used = 0; for (let i = 0; i < ds.rowCount; i++) { const k = cc.codes[i], v = vc.data[i]; if (k < 0 || Number.isNaN(v)) continue; let a = by.get(k); if (!a) { a = []; by.set(k, a); } if (a.length < 20000) a.push(v); used++; }
  const boxes = [...by].filter(([, a]) => a.length >= GAL3_MIN_BOX).map(([k, a]) => { a.sort((x, y) => x - y); const q1 = gal3Quant(a, 0.25), med = gal3Quant(a, 0.5), q3 = gal3Quant(a, 0.75), iqr = q3 - q1, fl = q1 - 1.5 * iqr, fh = q3 + 1.5 * iqr, inl = a.filter(x => x >= fl && x <= fh), mean = a.reduce((s, x) => s + x, 0) / a.length, out = a.filter(x => x < fl || x > fh);
    return { label: String(cc.dict[k]), n: a.length, st: { min: a[0], max: a[a.length - 1], q1, med, q3, iqr, mean, lo: inl[0], hi: inl[inl.length - 1], out: out.length > 40 ? out.filter((_, j) => j % Math.ceil(out.length / 40) === 0) : out, nout: out.length } }; });
  if (boxes.length < 2) return null; boxes.sort((a, b) => b.st.med - a.st.med); const kept = boxes.slice(0, GAL3_BOXES);
  let lo = Infinity, hi = -Infinity; kept.forEach(b => { lo = Math.min(lo, b.st.min); hi = Math.max(hi, b.st.max); });
  const items = kept.map((b, i) => ({ label: b.label, v: b.st.med, n: b.n, st: b.st, c: i, lg: i, g: i, x: i, share: 0 }));
  return { mode: 'box', catName: cc.name, xName: cc.name, grpName: null, valName: vc.name, unit: vc.unit, agg: 'median', items, legend: items.map(x => ({ label: x.label, c: x.c, n: x.n })), yMin: lo, yMax: hi, xs: items.map(x => x.label), rowsTotal: ds.rowCount, rowsUsed: used, dropped: 0, catTotal: boxes.length };
}
function gal3BuildWords(ds, m, opts) {
  const cols = ds.columns, lang = opts.lang || 'pt', c = m && m.text >= 0 ? cols[m.text] : null; if (!c || !(c.texts || c.dict)) return null;
  const n = ds.rowCount, get = i => (c.texts ? c.texts[i] : c.codes[i] >= 0 ? c.dict[c.codes[i]] : null), cnt = new Map(), shown = new Map(); let filled = 0;
  for (let i = 0; i < n; i++) { const t = get(i); if (!t) continue; filled++; const seen = new Set(); String(t).toLowerCase().split(/[^\p{L}\p{N}]+/u).forEach(w => { if (w.length < 4 || /^\d+$/.test(w)) return; const k = galNorm(w); if (GAL_STOP.has(k) || seen.has(k)) return; seen.add(k); if (!shown.has(k)) shown.set(k, w); }); seen.forEach(k => cnt.set(k, (cnt.get(k) || 0) + 1)); }
  if (filled < 10) return null;
  const top = [...cnt].filter(([, v]) => v >= 2 && v <= filled * 0.6).sort((a, b) => b[1] - a[1]).slice(0, GAL3_WORDS); if (top.length < 6) return null;
  const items = top.map(([k, v], i) => ({ label: shown.get(k), v, n: v, c: i % 8, lg: i, g: i, x: i, share: v / filled * 100 }));
  return { mode: 'words', catName: c.name, xName: c.name, grpName: null, valName: lang === 'en' ? 'Rows' : 'Linhas', unit: null, agg: 'count', items, legend: [], xs: [], rowsTotal: n, rowsUsed: filled, dropped: 0, filled, wordTotal: cnt.size };
}
function gal3Fit(mode, built, briefing) {
  const D = csBuilt({ built }, mode); if (!D) return 0;
  if (mode === 'box') return briefing && briefing.story === 'distribution' && D.items.length >= 3 ? 0.93 : 0.5;
  return D.items.length >= 15 ? 0.5 : 0.4;
}

/* ---------------- geometria e desenho ---------------- */
function gal3Ticks(lo, hi, n = 5) {
  const span = hi - lo || 1, raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p, st = (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p, out = [];
  for (let v = Math.ceil(lo / st) * st; v <= hi + st * 1e-6; v += st) out.push(+v.toPrecision(12)); return { ticks: out, step: st };
}
const galFillRound = (ctx, x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, Math.max(0.5, h), r); else ctx.rect(x, y, w, Math.max(0.5, h)); ctx.fill(); };
Object.assign(GalEngine.prototype, {
  layoutBox() {
    const { D, N } = this, W = this.w, H = this.h, vis = N.filter(n => n.vis), mc = csMeasureCtx(); this.titles = [];
    let maxLab = 0; mc.font = `500 11px ${this.th.font}`; for (const n of N) maxLab = Math.max(maxLab, mc.measureText(galTrunc(n.it.label, 18)).width);
    const horiz = N.length > 7 || maxLab > 74 || W < 520; this.horiz = horiz;
    const L = horiz ? Math.min(150, maxLab + 16) : 62, R = 24, Tp = 40, B = horiz ? 34 : 44, x0 = L, x1 = W - R, y0 = Tp, y1 = H - B;
    let wl = Infinity, wh = -Infinity; D.items.forEach(b => { wl = Math.min(wl, b.st.lo); wh = Math.max(wh, b.st.hi); }); const wsp = wh - wl || 1, cap = wh + wsp * 1.4, flo = wl - wsp * 1.4; // outliers muito longe não esmagam as caixas: o eixo para perto dos bigodes e os pontos de fora viram um contador na borda
    const yHi = Math.min(D.yMax, cap), yLo = Math.max(D.yMin, flo), span = yHi - yLo || 1, lo = yLo - span * 0.04, hi = yHi + span * 0.04, sv = v => (horiz ? x0 + (v - lo) / (hi - lo) * (x1 - x0) : y1 - (v - lo) / (hi - lo) * (y1 - y0));
    this.geo = { sv, x0, x1, y0, y1, lo, hi, yHi, yLo, ticks: gal3Ticks(lo, hi, horiz ? 5 : 6).ticks, horiz };
    const k = Math.max(1, vis.length), slot = (horiz ? y1 - y0 : x1 - x0) / k, bw = galClamp(slot * 0.56, 8, 64);
    N.forEach(n => { n.tal = n.vis ? 1 : 0; n.gd = n.i / Math.max(1, N.length); n.t = Object.assign({ cx: 0, cy: 0, r0: 0, r1: 0, a0: 0, a1: 0, x: n.t ? n.t.x : W / 2, y: n.t ? n.t.y : H / 2, r: 0, w: 0, h: 0, m1: 0, m2: 0, m3: 0, m4: 0 }, n.t && n.t.m3 ? { m1: n.t.m1, m2: n.t.m2, m3: n.t.m3, m4: n.t.m4 } : {}); });
    vis.forEach((n, j) => {
      const s = n.it.st, c = (horiz ? y0 : x0) + slot * (j + 0.5);
      if (horiz) Object.assign(n.t, { x: sv(s.q1), w: sv(s.q3) - sv(s.q1), y: c - bw / 2, h: bw, m1: sv(s.lo), m2: sv(s.hi), m3: sv(s.med), m4: sv(s.mean) });
      else Object.assign(n.t, { x: c - bw / 2, w: bw, y: sv(s.q3), h: sv(s.q1) - sv(s.q3), m1: sv(s.lo), m2: sv(s.hi), m3: sv(s.med), m4: sv(s.mean) });
    });
  },
  drawBox(ctx, hv, fr) {
    const { th, N, D, geo } = this, fg = th.fg, base = th.base, horiz = geo.horiz, f = 11; ctx.textBaseline = 'middle';
    // grade e eixo de valores
    ctx.lineWidth = 1; ctx.setLineDash([2, 5]); ctx.font = `500 ${f}px ${th.font}`;
    for (const t of geo.ticks) { const p = geo.sv(t); ctx.strokeStyle = rgba(fg, 0.12 * fr); ctx.beginPath(); if (horiz) { ctx.moveTo(p, geo.y0); ctx.lineTo(p, geo.y1); } else { ctx.moveTo(geo.x0, p); ctx.lineTo(geo.x1, p); } ctx.stroke(); ctx.fillStyle = rgba(fg, 0.55 * fr); ctx.textAlign = horiz ? 'center' : 'right'; const s = fmtNum(t, D.unit, LANG); if (horiz) ctx.fillText(s, p, geo.y1 + 14); else ctx.fillText(s, geo.x0 - 7, p); }
    ctx.setLineDash([]);
    for (const n of N.slice().sort((a, b) => (a === hv) - (b === hv))) {
      if (n.al < 0.02) continue; const g = n.g, s = n.it.st, p = this.prog(n), al = n.al * n.dm, col = this.col(n.it.c), on = n === hv, med = g.m3, P = v => med + (v - med) * p;
      const lo = P(g.m1), hi = P(g.m2), mean = P(g.m4); ctx.strokeStyle = rgba(col, al); ctx.lineWidth = on ? 2.4 : 1.6; ctx.lineCap = 'round';
      const cx = g.x + g.w / 2, cy = g.y + g.h / 2, cap = g.w * 0.28;
      ctx.beginPath();
      if (horiz) { ctx.moveTo(lo, cy); ctx.lineTo(P(g.x), cy); ctx.moveTo(P(g.x + g.w), cy); ctx.lineTo(hi, cy); ctx.moveTo(lo, cy - cap); ctx.lineTo(lo, cy + cap); ctx.moveTo(hi, cy - cap); ctx.lineTo(hi, cy + cap); }
      else { ctx.moveTo(cx, lo); ctx.lineTo(cx, P(g.y + g.h)); ctx.moveTo(cx, P(g.y)); ctx.lineTo(cx, hi); ctx.moveTo(cx - cap, lo); ctx.lineTo(cx + cap, lo); ctx.moveTo(cx - cap, hi); ctx.lineTo(cx + cap, hi); }
      ctx.stroke();
      ctx.fillStyle = rgba(col, (on ? 0.5 : 0.3) * al); ctx.strokeStyle = rgba(col, al); ctx.lineWidth = on ? 2.4 : 1.8;
      const bx = horiz ? P(g.x) : g.x, by = horiz ? g.y : P(g.y), bw = horiz ? P(g.x + g.w) - P(g.x) : g.w, bh = horiz ? g.h : P(g.y + g.h) - P(g.y);
      galFillRound(ctx, bx, by, bw, bh, 3); ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, bw, Math.max(0.5, bh), 3); else ctx.rect(bx, by, bw, bh); ctx.stroke();
      ctx.lineWidth = on ? 3.6 : 2.8; ctx.strokeStyle = rgba(fg, 0.95 * al); ctx.beginPath(); if (horiz) { ctx.moveTo(med, g.y); ctx.lineTo(med, g.y + g.h); } else { ctx.moveTo(g.x, med); ctx.lineTo(g.x + g.w, med); } ctx.stroke();
      // média: losango
      const mx = horiz ? mean : cx, my = horiz ? cy : mean, d = on ? 5.5 : 4.2; ctx.fillStyle = rgba(base, al); ctx.strokeStyle = rgba(fg, al); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(mx, my - d); ctx.lineTo(mx + d, my); ctx.lineTo(mx, my + d); ctx.lineTo(mx - d, my); ctx.closePath(); ctx.fill(); ctx.stroke();
      // pontos fora dos bigodes
      ctx.fillStyle = rgba(col, 0.75 * al * orgStage(this.grow, 0.5, 1)); let clipHi = 0, clipLo = 0; s.out.forEach((v, j) => { if (v > geo.yHi) { clipHi++; return; } if (v < geo.yLo) { clipLo++; return; } const q = geo.sv(v), jit = ((j * 37) % 11 - 5) / 5 * g.w * 0.16; ctx.beginPath(); ctx.arc(horiz ? q : cx + jit, horiz ? cy + jit : q, 2.6, 0, ORG_TAU); ctx.fill(); });
      if (clipHi || clipLo) { ctx.font = `700 ${f - 1}px ${th.font}`; ctx.fillStyle = rgba(col, al); ctx.textAlign = 'center'; const nHi = s.out.filter(v => v > geo.yHi).length, nLo = s.out.filter(v => v < geo.yLo).length; if (nHi) ctx.fillText(horiz ? `▶ ${nHi}` : `▲ ${nHi}`, horiz ? geo.x1 - 10 : cx, horiz ? cy : geo.y0 + 2); if (nLo) ctx.fillText(horiz ? `◀ ${nLo}` : `▼ ${nLo}`, horiz ? geo.x0 + 10 : cx, horiz ? cy : geo.y1 - 2); }
      // rótulo da categoria
      ctx.fillStyle = rgba(fg, (on ? 1 : 0.85) * al); ctx.font = `${on ? 700 : 600} ${f}px ${th.font}`;
      if (horiz) { ctx.textAlign = 'right'; ctx.fillText(galTrunc(n.it.label, 18), geo.x0 - 8, cy); } else { ctx.textAlign = 'center'; ctx.fillText(galTrunc(n.it.label, 12), cx, geo.y1 + 14); ctx.font = `500 ${f - 1}px ${th.font}`; ctx.fillStyle = rgba(fg, 0.5 * al); ctx.fillText(`n=${fmtInt(n.it.n, LANG)}`, cx, geo.y1 + 28); }
      if (on) { ctx.font = `700 ${f}px ${th.font}`; ctx.fillStyle = rgba(fg, 1); ctx.lineWidth = 4; ctx.strokeStyle = rgba(base, 0.92); const s2 = fmtNum(s.med, D.unit, LANG); if (horiz) { ctx.textAlign = 'center'; ctx.strokeText(s2, med, g.y - 9); ctx.fillText(s2, med, g.y - 9); } else { ctx.textAlign = 'left'; ctx.strokeText(s2, g.x + g.w + 8, med); ctx.fillText(s2, g.x + g.w + 8, med); } }
    }
  },
  layoutWords() {
    const { D, N } = this, W = this.w, H = this.h, mc = csMeasureCtx(), cx = W / 2, cy = H / 2 + 8, vmax = D.items[0].v, vmin = D.items[D.items.length - 1].v, fmax = galClamp(Math.min(W / 7, H / 6), 26, 70), fmin = W < 520 ? 11 : 12; this.titles = [];
    const placed = [], pad = 4; let order = N.filter(n => n.vis);
    const fits = (x, y, w, h) => x - w / 2 >= 8 && x + w / 2 <= W - 8 && y - h / 2 >= 34 && y + h / 2 <= H - 8 && !placed.some(b => Math.abs(x - b.x) < (w + b.w) / 2 + pad && Math.abs(y - b.y) < (h + b.h) / 2 + pad);
    N.forEach(n => { n.tal = 0; n.gd = n.i / Math.max(1, N.length); n.t = Object.assign({ cx: 0, cy: 0, r0: 0, r1: 0, a0: 0, a1: 0, x: n.t ? n.t.x : cx, y: n.t ? n.t.y : cy, r: n.t ? n.t.r : 0, w: 0, h: 0, m1: 0, m2: 0, m3: 0, m4: 0 }); n.placed = false; });
    for (const n of order) {
      let fs = fmin + (fmax - fmin) * Math.sqrt(vmax > vmin ? (n.it.v - vmin) / (vmax - vmin) : 1), ok = false;
      for (let tries = 0; tries < 4 && !ok; tries++, fs *= 0.86) {
        if (fs < 9) break; mc.font = `700 ${fs}px ${this.th.font}`; const w = mc.measureText(n.it.label).width + 2, h = fs * 1.12;
        for (let k = 0; k < 900; k++) { const a = k * 0.35, rad = 2.2 * Math.sqrt(k) * 4, x = cx + Math.cos(a) * rad * 1.5, y = cy + Math.sin(a) * rad * 0.95; if (fits(x, y, w, h)) { placed.push({ x, y, w, h }); Object.assign(n.t, { x, y, r: fs }); n.mw = w; n.mh = h; n.tal = 1; n.placed = true; ok = true; break; } }
      }
    }
  },
  drawWords(ctx, hv, fr) {
    const { th, N } = this, fg = th.fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const n of N.slice().sort((a, b) => (a === hv) - (b === hv))) {
      if (n.al < 0.02 || !n.placed) continue; const p = this.prog(n), g = n.g, al = n.al * n.dm * p, col = this.col(n.it.c), on = n === hv, fs = Math.max(6, g.r * (0.6 + 0.4 * p)); ctx.font = `700 ${fs}px ${th.font}`;
      if (on) { ctx.fillStyle = rgba(col, 0.2); galFillRound(ctx, g.x - n.mw / 2 - 4, g.y - n.mh / 2, n.mw + 8, n.mh, 6); }
      ctx.fillStyle = rgba(this.light ? mixHex(col, fg, 0.4) : col, (on ? 1 : 0.92) * al); ctx.fillText(n.it.label, g.x, g.y);
    }
  },
  pickBoxWords(mx, my) {
    for (const n of this.N) {
      if (n.al < 0.4) continue; const g = n.g;
      if (this.D.mode === 'words') { if (n.placed && Math.abs(mx - g.x) <= n.mw / 2 + 4 && Math.abs(my - g.y) <= n.mh / 2 + 2) return n.i; continue; }
      const cx = g.x + g.w / 2, cy = g.y + g.h / 2, a = this.geo.horiz ? [Math.min(g.m1, g.m2), Math.max(g.m1, g.m2), g.y - 4, g.y + g.h + 4] : [g.x - 4, g.x + g.w + 4, Math.min(g.m1, g.m2), Math.max(g.m1, g.m2)];
      if (mx >= a[0] && mx <= a[1] && my >= a[2] && my <= a[3]) return n.i;
    }
    return null;
  },
});

/* ---------------- interface ---------------- */
function gal3Render(mode, P, el) {
  if (el._org) el._org.destroy();
  const D = csBuilt(P, mode), lang = LANG; if (!D) { el.innerHTML = `<div class="noins">${T('gal_none')}</div>`; return null; }
  const box = mode === 'box', fmt = v => fmtNum(v, D.unit, lang);
  const sideHtml = `${box ? `<div class="orgblk"><div class="orgcap">${esc(D.catName)}</div><div class="orgleg" id="orgleg"></div><button class="orgall" id="orgall">${T('org_all')}</button></div>` : ''}
    <div class="orgblk"><div class="orgcap">${T(box ? 'gal3_rank_b' : 'gal3_rank_w')}</div><div class="orgrank" id="orgrank"></div></div><p class="orgfoot">${T(box ? 'gal3_base_b' : 'gal3_base_w')}</p>`;
  let eng = null, S = null; const stats = () => S || (S = eng.stats());
  const model = id => {
    const it = D.items[id], s = stats(), rk = s.rank.get(id), left = [];
    if (box) { const st = it.st; left.push([T('gal3_n'), fmtInt(it.n, lang)], [T('gal3_min'), fmt(st.min)], [T('gal3_q1'), fmt(st.q1)], [T('gal3_q3'), fmt(st.q3)], [T('gal3_max'), fmt(st.max)], [T('gal3_mean'), fmt(st.mean)], [T('gal3_iqr'), fmt(st.iqr)], [T('gal3_out'), fmtInt(st.nout, lang)]); if (rk) left.unshift([T('gal_pos'), T('gal_of', rk, fmtInt(s.n, lang))]); }
    else { if (rk) left.push([T('gal_pos'), T('gal_of', rk, fmtInt(s.n, lang))]); left.push([T('gal3_rows'), fmtInt(it.n, lang)], [T('gal3_of_filled'), csPct(it.share, lang)]); }
    return { key: 'g' + id, kick: box ? D.catName : D.catName, kickColor: orgCatColor(eng.th, it.c), title: it.label, value: box ? fmt(it.v) : fmtInt(it.v, lang), vlabel: box ? `${T('gal3_median')} · ${D.valName}` : T('gal3_rows_l'), left, texts: [], note: '' };
  };
  const overview = () => {
    const s = stats(), byV = s.ids.map(i => D.items[i]), top = byV[0], low = byV[byV.length - 1], left = [[box ? D.catName : T('gal3_words'), fmtInt(s.n, lang)]];
    if (box) { if (top) left.push([T('rays_ov_max'), `${top.label} · ${fmt(top.v)}`]); if (low && low !== top) left.push([T('rays_ov_min'), `${low.label} · ${fmt(low.v)}`]); left.push([T('gal3_values'), fmtInt(D.rowsUsed, lang)]); }
    else { if (top) left.push([T('gal3_top_w'), `${top.label} · ${fmtInt(top.v, lang)}`]); left.push([T('gal3_filled'), fmtInt(D.filled, lang)], [T('gal3_distinct'), fmtInt(D.wordTotal, lang)]); }
    return { key: 'ov', kick: T('card_overview'), title: D.catName, value: box ? fmt(top ? top.v : 0) : fmtInt(D.filled, lang), vlabel: box ? `${T('gal3_median')} · ${T('gal3_top')}` : T('gal3_filled'), left, texts: [], hint: T('rays_ov_hint') };
  };
  const h = {
    model, overview,
    listItems() { const sig = JSON.stringify([...eng.st.hidden].sort()), items = eng.N.filter(n => n.vis).map(n => ({ id: n.i, title: n.it.label, sub: box ? `n=${fmtInt(n.it.n, lang)}` : csPct(n.it.share, lang), color: orgCatColor(eng.th, n.it.c), val: box ? fmt(n.it.v) : fmtInt(n.it.v, lang), v: n.it.v, ord: n.i, s: () => n.it.label })); return { sig, items, sorts: ['v', 'n', 'o'], sort: 'v' }; },
    visible: id => eng.N[id].vis,
    side(side0) {
      S = null; const s = stats(), st = eng.st, $ = q => side0.querySelector(q), leg = $('#orgleg');
      if (leg) leg.innerHTML = D.legend.map((g, i) => `<button class="orgc" data-c="${i}" data-n="${g.n}" aria-pressed="${!st.hidden.has(i)}" style="--c:${orgCatColor(eng.th, g.c)}"><i></i><span>${esc(g.label)}</span></button>`).join('');
      const top = s.ids.slice(0, 10).map(i => ({ id: i, v: D.items[i].v, label: D.items[i].label, txt: box ? fmt(D.items[i].v) : fmtInt(D.items[i].v, lang), c: orgCatColor(eng.th, D.items[i].c) })), mx = Math.max(1e-9, ...top.map(x => Math.abs(x.v)));
      $('#orgrank').innerHTML = top.map(x => `<div class="orgr" data-e="${x.id}"><div class="orgrb"><div class="orgrs" style="width:${Math.max(3, Math.abs(x.v) / mx * 100)}%"><i style="flex:1;background:${x.c}"></i></div></div><span>${esc(x.label)}</span><b>${esc(x.txt)}</b></div>`).join('');
    },
    syncSide() {},
    bindSide(side0, c) {
      const { eng: e, refresh, ctip } = c, nL = D.legend.length;
      side0.addEventListener('click', ev => { const b = ev.target.closest('.orgc'), a = ev.target.closest('#orgall'); if (b) { const i = +b.dataset.c, hid = new Set(e.st.hidden); if (hid.size === 0) { for (let k = 0; k < nL; k++) if (k !== i) hid.add(k); } else if (hid.has(i)) hid.delete(i); else hid.add(i); if (hid.size >= nL) hid.clear(); e.patch({ hidden: [...hid] }); refresh(); } else if (a) { e.patch({ hidden: [] }); refresh(); } });
      side0.addEventListener('mouseover', ev => { const b = ev.target.closest('.orgc'), r = ev.target.closest('.orgr[data-e]'); e.hovLg = b ? +b.dataset.c : -1; e.kick(); if (r && /^\d+$/.test(r.dataset.e)) c.hover(+r.dataset.e); if (b) { const rc = b.getBoundingClientRect(); ctip.textContent = `${fmtInt(+b.dataset.n, lang)} ${T('gal3_values')}`; ctip.hidden = false; ctip.style.left = Math.round(rc.left + 6) + 'px'; ctip.style.top = Math.round(rc.top - 26) + 'px'; } });
      side0.addEventListener('mouseout', ev => { if (ev.target.closest('.orgc')) { e.hovLg = -1; e.kick(); ctip.hidden = true; } if (ev.target.closest('.orgr[data-e]')) c.hover(null); });
    },
    tour({ stage, piece }) { const sr = stage.getBoundingClientRect(), bx = { x: sr.left + 12, y: sr.top + 12, w: Math.max(80, sr.width - 24), h: Math.max(80, sr.height - 24) }, c2 = piece && piece.querySelector('#pc2'), cardBox = c2 ? csPad(csBox(c2.getBoundingClientRect()), 6) : bx; return [{ k: 1, t: bx }, { k: 2, t: cardBox, demo: stats().ids[0] }]; },
  };
  eng = new GalEngine(D, orgTheme(P), { rm: RM });
  return csMount(P, el, { id: mode, sideHtml, tutPrefix: 'tut_gal_', tutKey: 'dv-gal-tutorial' }, () => eng, h);
}
function gal3Steps(mode, P) {
  const D = csBuilt(P, mode), out = []; if (!D) return out;
  const f = it => (mode === 'box' ? fmtNum(it.v, D.unit, LANG) : fmtInt(it.v, LANG));
  D.items.map((it, i) => [it, i]).slice(0, 3).forEach(([it, i]) => out.push({ id: 's' + i, caption: `${it.label} · ${mode === 'box' ? T('gal3_median') + ' ' : ''}${f(it)}`, state: { cs: { spot: i } } }));
  if (mode === 'box') { const w = D.items.map((it, i) => [it, i]).sort((a, b) => b[0].st.iqr - a[0].st.iqr)[0]; if (w && !out.some(o => o.id === 's' + w[1])) out.push({ id: 'wide', caption: `${w[0].label} · ${T('gal3_iqr')} ${fmtNum(w[0].st.iqr, D.unit, LANG)}`, state: { cs: { spot: w[1] } } }); }
  return out;
}
function gal3Note(mode, P) {
  const D = csBuilt(P, mode); if (!D) return '';
  return mode === 'box' ? T('gal3_note_b', D.valName, D.catName, D.items.length, D.catTotal) : T('gal3_note_w', D.catName, D.items.length, D.wordTotal, D.filled);
}
[
  { id: 'box', suggest: gal3SuggestBox, build: (ds, m, o) => gal3BuildBox(ds, m, o), fields: [{ k: 'cat', label: 'gal3_cat', role: 'dim' }, { k: 'val', label: 'gal3_val', role: 'measure' }] },
  { id: 'words', suggest: cols => gal3SuggestWords(cols, cols.area), build: (ds, m, o) => gal3BuildWords(ds, m, o), fields: [{ k: 'text', label: 'gal3_text', role: 'txt' }] },
].forEach(d => regChart({
  id: d.id, suggest: d.suggest, build: d.build, fit: (b, br) => gal3Fit(d.id, b, br), render: (P, el) => gal3Render(d.id, P, el), steps: P => gal3Steps(d.id, P), drawStatic: (P, ctx, x, y, w, h, st) => galDrawStatic(d.id, P, ctx, x, y, w, h, st),
  insights: () => [], note: P => gal3Note(d.id, P), fields: d.fields, names: b => (d.id === 'box' ? { cat: b.catName, val: b.valName } : { text: b.catName }), summary: b => T('gal3_sum', fmtInt(b.items.length, LANG)),
}));
