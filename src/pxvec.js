/* Datavix: gráficos de canvas → formas vetoriais do PowerPoint.
 * Os gráficos próprios (raios, leque, cordilheira, rio, funil, bolhas agrupadas, mapas) se desenham com comandos de canvas. Para o PPTX,
 * esses mesmos comandos são gravados por um "contexto falso" (PxRec) em vez de pintar pixels, e cada traço vira uma forma do PowerPoint:
 * círculos viram elipses, caminhos viram formas livres (retas e curvas de Bézier), textos viram caixas de texto reais (com rotação) e
 * degradês viram preenchimentos em degradê. Assim o desenho é o mesmo do gráfico vivo (mesmo layout, mesmas cores) e tudo se edita no
 * PowerPoint; não existe "Editar dados" nas formas. Nada de bibliotecas externas. */

const PXV_TAU = Math.PI * 2;

/* ---------- caminhos: comandos ['M',x,y] ['L',x,y] ['C',x1,y1,x2,y2,x,y] ['Z'] ---------- */
class PxVPath {
  constructor(tr, user) { this.tr = tr; this.user = !!user; this.sub = []; this.cur = null; this.circ = null; this.lastU = null; this.id = ++PxVPath._n; }
  _p(x, y) { const t = this.tr && this.tr(); return t ? [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]] : [x, y]; }
  moveTo(x, y) { this.circ = null; const p = this._p(x, y); this.cur = [['M', p[0], p[1]]]; this.cur.userStart = [x, y]; this.sub.push(this.cur); this.lastU = [x, y]; }
  lineTo(x, y) { if (!this.cur) { if (this.lastU) this.moveTo(this.lastU[0], this.lastU[1]); else return this.moveTo(x, y); } this.circ = null; const p = this._p(x, y); this.cur.push(['L', p[0], p[1]]); this.lastU = [x, y]; }
  _c(a, b, c, d, e, f) { const p = this._p(a, b), q = this._p(c, d), r = this._p(e, f); this.cur.push(['C', p[0], p[1], q[0], q[1], r[0], r[1]]); this.lastU = [e, f]; }
  bezierCurveTo(a, b, c, d, e, f) { if (!this.cur) this.moveTo(a, b); this.circ = null; this._c(a, b, c, d, e, f); }
  quadraticCurveTo(cx, cy, x, y) { if (!this.cur) this.moveTo(cx, cy); this.circ = null; const [x0, y0] = this.lastU; this._c(x0 + 2 / 3 * (cx - x0), y0 + 2 / 3 * (cy - y0), x + 2 / 3 * (cx - x), y + 2 / 3 * (cy - y), x, y); }
  closePath() { if (!this.cur) return; this.cur.push(['Z']); this.lastU = this.cur.userStart || this.lastU; this.cur = null; }
  arc(x, y, r, a0, a1, ccw) {
    const first = !this.sub.length, full = Math.abs(a1 - a0) >= PXV_TAU - 1e-6;
    if (!ccw) { while (a1 < a0) a1 += PXV_TAU; if (a1 - a0 > PXV_TAU) a1 = a0 + PXV_TAU; } else { while (a1 > a0) a1 -= PXV_TAU; if (a0 - a1 > PXV_TAU) a1 = a0 - PXV_TAU; }
    const sx = x + r * Math.cos(a0), sy = y + r * Math.sin(a0); if (this.cur) this.lineTo(sx, sy); else this.moveTo(sx, sy);
    const sw = a1 - a0, n = Math.max(1, Math.ceil(Math.abs(sw) / (Math.PI / 2) - 1e-9)), d = sw / n, k = 4 / 3 * Math.tan(d / 4);
    for (let i = 0; i < n; i++) {
      const t0 = a0 + i * d, t1 = t0 + d, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
      this._c(x + r * (c0 - k * s0), y + r * (s0 + k * c0), x + r * (c1 + k * s1), y + r * (s1 - k * c1), x + r * c1, y + r * s1);
    }
    if (first && full && !this.user) { const t = this.tr && this.tr(); const c = this._p(x, y), sc = t ? Math.sqrt(Math.abs(t[0] * t[3] - t[1] * t[2])) : 1; this.circ = { cx: c[0], cy: c[1], r: r * sc }; }
  }
  rect(x, y, w, h) { this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath(); this.lastU = [x, y]; }
  roundRect(x, y, w, h, rr) {
    let r = Array.isArray(rr) ? rr[0] : rr; r = Math.max(0, Math.min(+r || 0, w / 2, h / 2)); if (!r) return this.rect(x, y, w, h);
    const k = r * 0.5523; this.moveTo(x + r, y); this.lineTo(x + w - r, y); this.bezierCurveTo(x + w - r + k, y, x + w, y + r - k, x + w, y + r); this.lineTo(x + w, y + h - r);
    this.bezierCurveTo(x + w, y + h - r + k, x + w - r + k, y + h, x + w - r, y + h); this.lineTo(x + r, y + h); this.bezierCurveTo(x + r - k, y + h, x, y + h - r + k, x, y + h - r);
    this.lineTo(x, y + r); this.bezierCurveTo(x, y + r - k, x + r - k, y, x + r, y); this.closePath();
  }
}
PxVPath._n = 0;
// substituto de Path2D enquanto o gráfico é gravado: guarda em coordenadas do usuário; a matriz vale na hora de desenhar
class PxPath2D extends PxVPath {
  constructor() { super(null, true); }
  addPath(o) { for (const s of o.sub) { const c = s.slice(); this.sub.push(c); } }
}

/* ---------- contexto gravador ---------- */
const pxvMul = (m, t) => [m[0] * t[0] + m[2] * t[1], m[1] * t[0] + m[3] * t[1], m[0] * t[2] + m[2] * t[3], m[1] * t[2] + m[3] * t[3], m[0] * t[4] + m[2] * t[5] + m[4], m[1] * t[4] + m[3] * t[5] + m[5]];
const PXV_STYLE = ['clipPoly', 'fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'font', 'textAlign', 'textBaseline', 'lineCap', 'lineJoin'];
class PxRec {
  constructor(mc) {
    this.mc = mc; this.out = []; this.m = [1, 0, 0, 1, 0, 0]; this.stack = []; this.dash = []; this.clipPoly = null; this.colorCache = new Map();
    Object.assign(this, { fillStyle: '#000000', strokeStyle: '#000000', lineWidth: 1, globalAlpha: 1, font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic', lineCap: 'butt', lineJoin: 'miter', imageSmoothingEnabled: true, globalCompositeOperation: 'source-over' });
    this.path = new PxVPath(() => this.m);
    ['moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'closePath', 'arc', 'rect', 'roundRect'].forEach(k => { this[k] = (...a) => this.path[k](...a); });
  }
  get canvas() { return { width: 1e4, height: 1e4 }; }
  save() { const s = { m: this.m.slice(), dash: this.dash.slice() }; PXV_STYLE.forEach(k => { s[k] = this[k]; }); this.stack.push(s); }
  restore() { const s = this.stack.pop(); if (!s) return; this.m = s.m; this.dash = s.dash; PXV_STYLE.forEach(k => { this[k] = s[k]; }); }
  translate(x, y) { this.m = pxvMul(this.m, [1, 0, 0, 1, x, y]); }
  rotate(a) { const c = Math.cos(a), s = Math.sin(a); this.m = pxvMul(this.m, [c, s, -s, c, 0, 0]); }
  scale(x, y) { this.m = pxvMul(this.m, [x, 0, 0, y, 0, 0]); }
  transform(a, b, c, d, e, f) { this.m = pxvMul(this.m, [a, b, c, d, e, f]); }
  setTransform(a, b, c, d, e, f) { this.m = [a, b, c, d, e, f]; }
  resetTransform() { this.m = [1, 0, 0, 1, 0, 0]; }
  beginPath() { this.path = new PxVPath(() => this.m); }
  clip(p) { // só recortes por caminho (Path2D) importam aqui, e só para imagens; o recorte retangular do quadro é ignorado
    if (!(p instanceof PxVPath)) return; const g = this.geom(p); if (!g || g.k !== 'path') return;
    this.clipPoly = g.sub.map(sp => { const q = []; sp.forEach(op => { if (op.length > 2) q.push([op[op.length - 2], op[op.length - 1]]); }); return q; });
  }
  clearRect() {} strokeText() {} setLineDash(a) { this.dash = (a || []).slice(); } getLineDash() { return this.dash.slice(); }
  measureText(t) { this.mc.font = this.font; return this.mc.measureText(t); }
  createLinearGradient(x0, y0, x1, y1) { return { kind: 'lin', p: [x0, y0, x1, y1], stops: [], addColorStop(o, c) { this.stops.push([o, c]); } }; }
  createRadialGradient(x0, y0, r0, x1, y1, r1) { return { kind: 'rad', p: [x0, y0, r0, x1, y1, r1], stops: [], addColorStop(o, c) { this.stops.push([o, c]); } }; }
  get sc() { const m = this.m; return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1; }
  // cor do canvas ('#rrggbb', 'rgba(...)', nome) → { c: '#RRGGBB', a: 0..1 }
  color(s) {
    let v = this.colorCache.get(s); if (v) return v;
    this.mc.fillStyle = '#000000'; this.mc.fillStyle = s; const n = String(this.mc.fillStyle); let m;
    if (n[0] === '#') v = { c: n.toUpperCase(), a: 1 };
    else if ((m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(n))) v = { c: '#' + [m[1], m[2], m[3]].map(x => Math.round(+x).toString(16).padStart(2, '0')).join('').toUpperCase(), a: m[4] === undefined ? 1 : +m[4] };
    else v = { c: '#000000', a: 1 };
    this.colorCache.set(s, v); return v;
  }
  paint(style) { // fillStyle/strokeStyle → { c, a } ou { grad } (já em coordenadas do slide)
    const al = this.globalAlpha;
    if (style && typeof style === 'object' && style.stops) {
      const t = this.m, P = (x, y) => [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]], sc = this.sc, q = style.p, a = P(q[0], q[1]);
      const stops = style.stops.map(([o, c]) => { const k = this.color(c); return { o, c: k.c, a: k.a * al }; }).sort((x, y) => x.o - y.o);
      if (style.kind === 'lin') { const b = P(q[2], q[3]); return { grad: { kind: 'lin', x0: a[0], y0: a[1], x1: b[0], y1: b[1], stops } }; }
      const b = P(q[3], q[4]); return { grad: { kind: 'rad', x0: a[0], y0: a[1], r0: q[2] * sc, x1: b[0], y1: b[1], r1: q[5] * sc, stops } };
    }
    const k = this.color(style); return { c: k.c, a: k.a * al };
  }
  geom(path) {
    if (!path || !path.sub.length) return null;
    if (path.circ) return { k: 'ell', cx: path.circ.cx, cy: path.circ.cy, r: path.circ.r };
    const m = this.m, T = path.user ? (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]] : null;
    const sub = T ? path.sub.map(s => s.map(op => { const o = [op[0]]; for (let i = 1; i < op.length; i += 2) { const p = T(op[i], op[i + 1]); o.push(p[0], p[1]); } return o; })) : path.sub;
    return { k: 'path', sub };
  }
  push(g, fill, line, id) {
    if (!g) return;
    if (fill && !fill.grad && fill.a < 0.004) fill = null; if (line && !line.grad && line.a < 0.004) line = null;
    if (!fill && !line) return;
    this.out.push({ t: 'shape', g, fill, line, id });
  }
  fill(p) { const path = p instanceof PxVPath ? p : this.path; this.push(this.geom(path), this.paint(this.fillStyle), null, path.id); }
  stroke(p) {
    const path = p instanceof PxVPath ? p : this.path, g = this.geom(path), ln = { ...this.paint(this.strokeStyle), w: Math.max(0.25, this.lineWidth * this.sc), dash: this.dash.map(d => d * this.sc), cap: this.lineCap };
    const last = this.out[this.out.length - 1];
    if (g && last && last.t === 'shape' && last.id === path.id && last.fill && !last.line && last.g.k === g.k) { if (ln.grad || ln.a >= 0.004) last.line = ln; return; } // preencher e contornar o mesmo caminho = uma forma só
    this.push(g, null, ln, path.id);
  }
  _rect(x, y, w, h) { const p = new PxVPath(() => this.m); p.rect(x, y, w, h); return p; }
  fillRect(x, y, w, h) { const p = this._rect(x, y, w, h); this.push(this.geom(p), this.paint(this.fillStyle), null, p.id); }
  strokeRect(x, y, w, h) { const p = this._rect(x, y, w, h); this.push(this.geom(p), null, { ...this.paint(this.strokeStyle), w: Math.max(0.25, this.lineWidth * this.sc), dash: this.dash.map(d => d * this.sc) }, p.id); }
  fillText(text, x, y) {
    const s = String(text); if (!s) return; const f = this.paint(this.fillStyle); if (f.grad || f.a < 0.02) return;
    const px = +((/(\d+(?:\.\d+)?)px/.exec(this.font) || [])[1] || 12), sc = this.sc, bold = /\bbold\b|\b[6-9]00\b/.test(this.font), w = this.measureText(s).width * sc, m = this.m;
    this.out.push({ t: 'text', text: s, x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5], ang: Math.atan2(m[1], m[0]), size: px * sc, bold, w, align: this.textAlign, base: this.textBaseline, c: f.c, a: f.a });
  }
  // imagem pequena (uma célula por pixel, como o campo do mapa de isolinhas): cores arredondadas, células fora do recorte descartadas e
  // trechos iguais unidos em retângulos maiores (linha a linha e depois para baixo)
  drawImage(img, x, y, w, h) {
    if (!img || !img.getContext) return; const W = img.width, H = img.height, d = img.getContext('2d').getImageData(0, 0, W, H).data, cw = w / W, ch = h / H, al = this.globalAlpha, m = this.m, poly = this.clipPoly;
    const inside = (px, py) => { if (!poly) return true; let c = false; for (const r of poly) for (let a = 0, b = r.length - 1; a < r.length; b = a++) if ((r[a][1] > py) !== (r[b][1] > py) && px < (r[b][0] - r[a][0]) * (py - r[a][1]) / (r[b][1] - r[a][1]) + r[a][0]) c = !c; return c; };
    const key = (i, j) => { const q = (j * W + i) * 4, a = d[q + 3]; if (!a) return ''; const cx = x + (i + 0.5) * cw, cy = y + (j + 0.5) * ch; if (!inside(m[0] * cx + m[2] * cy + m[4], m[1] * cx + m[3] * cy + m[5])) return ''; return [d[q], d[q + 1], d[q + 2]].map(v => Math.min(255, Math.round(v / 12) * 12)).join(',') + ',' + Math.round(a / 12); };
    let open = new Map();
    const flush = (r) => { const [rr, gg, bb, aq] = r.k.split(',').map(Number), pth = this._rect(x + r.i * cw, y + r.j * ch, (r.e - r.i) * cw, (r.rows) * ch); this.push(this.geom(pth), { c: '#' + [rr, gg, bb].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase(), a: Math.min(1, aq * 12 / 255) * al }, null, pth.id); };
    for (let j = 0; j <= H; j++) {
      const now = new Map();
      if (j < H) { let i = 0; while (i < W) { const k = key(i, j); if (!k) { i++; continue; } let e = i + 1; while (e < W && key(e, j) === k) e++; const id = i + '-' + e + '-' + k, prev = open.get(id); if (prev) { prev.rows++; now.set(id, prev); open.delete(id); } else now.set(id, { i, e, j, k, rows: 1 }); i = e; } }
      for (const r of open.values()) flush(r); open = now;
    }
  }}

/* ---------- XML de preenchimento e contorno ---------- */
const pxvClr = (c, a) => `<a:srgbClr val="${pxHex(c)}">${a != null && a < 0.996 ? `<a:alpha val="${Math.max(0, Math.round(a * 100000))}"/>` : ''}</a:srgbClr>`;
function pxvBBox(g) {
  if (g.k === 'ell') return { x0: g.cx - g.r, y0: g.cy - g.r, x1: g.cx + g.r, y1: g.cy + g.r };
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of g.sub) for (const op of s) for (let i = 1; i < op.length; i += 2) { x0 = Math.min(x0, op[i]); x1 = Math.max(x1, op[i]); y0 = Math.min(y0, op[i + 1]); y1 = Math.max(y1, op[i + 1]); }
  return { x0, y0, x1, y1 };
}
function pxvGradXml(gr, bb) {
  const at = o => { const S = gr.stops; if (o <= S[0].o) return S[0]; for (let i = 1; i < S.length; i++) if (o <= S[i].o) { const a = S[i - 1], b = S[i], k = (o - a.o) / ((b.o - a.o) || 1), mix = (u, v) => Math.round(u + (v - u) * k); const ca = hexToRgb(a.c), cb = hexToRgb(b.c); return { c: '#' + [0, 1, 2].map(j => mix(ca[j], cb[j]).toString(16).padStart(2, '0')).join(''), a: a.a + (b.a - a.a) * k }; } return S[S.length - 1]; };
  const gs = list => `<a:gsLst>${list.map(([p, s]) => `<a:gs pos="${Math.round(Math.max(0, Math.min(1, p)) * 100000)}">${pxvClr(s.c, s.a)}</a:gs>`).join('')}</a:gsLst>`;
  if (gr.kind === 'lin') {
    const dx = gr.x1 - gr.x0, dy = gr.y1 - gr.y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, ts = [[bb.x0, bb.y0], [bb.x1, bb.y0], [bb.x0, bb.y1], [bb.x1, bb.y1]].map(p => ((p[0] - gr.x0) * ux + (p[1] - gr.y0) * uy) / L), t0 = Math.min(...ts), t1 = Math.max(...ts);
    if (t1 - t0 < 1e-6) { const s = at(t0); return `<a:solidFill>${pxvClr(s.c, s.a)}</a:solidFill>`; }
    const list = [[0, at(t0)], ...gr.stops.filter(s => s.o > t0 && s.o < t1).map(s => [(s.o - t0) / (t1 - t0), s]), [1, at(t1)]];
    return `<a:gradFill rotWithShape="1">${gs(list)}<a:lin ang="${Math.round((((Math.atan2(dy, dx) * 180 / Math.PI) % 360) + 360) % 360 * 60000)}" scaled="0"/></a:gradFill>`;
  }
  const w = Math.max(1e-6, bb.x1 - bb.x0), h = Math.max(1e-6, bb.y1 - bb.y0), px = Math.max(0, Math.min(1, (gr.x0 - bb.x0) / w)), py = Math.max(0, Math.min(1, (gr.y0 - bb.y0) / h)), r = n => Math.round(n * 100000);
  return `<a:gradFill rotWithShape="1">${gs(gr.stops.map(s => [s.o, s]))}<a:path path="circle"><a:fillToRect l="${r(px)}" t="${r(py)}" r="${r(1 - px)}" b="${r(1 - py)}"/></a:path></a:gradFill>`;
}
const pxvFillXml = (f, bb) => (!f ? '<a:noFill/>' : f.grad ? pxvGradXml(f.grad, bb) : `<a:solidFill>${pxvClr(f.c, f.a)}</a:solidFill>`);
function pxvLineXml(l, bb) {
  if (!l) return '<a:ln><a:noFill/></a:ln>';
  const w = Math.max(0.25, l.w), dash = l.dash && l.dash.length && l.dash.some(d => d > 0) ? `<a:custDash><a:ds d="${Math.max(1000, Math.round(l.dash[0] / w * 100000))}" sp="${Math.max(1000, Math.round((l.dash[1] != null ? l.dash[1] : l.dash[0]) / w * 100000))}"/></a:custDash>` : '';
  return `<a:ln w="${pxe(w)}" cap="${l.cap === 'round' ? 'rnd' : l.cap === 'square' ? 'sq' : 'flat'}">${l.grad ? pxvGradXml(l.grad, bb) : `<a:solidFill>${pxvClr(l.c, l.a)}</a:solidFill>`}${dash}<a:round/></a:ln>`;
}

/* ---------- formas livres no slide ---------- */
PxSlide.prototype.vpath = function (subs, o = {}) {
  const g = { k: 'path', sub: subs }, bb = pxvBBox(g); if (!isFinite(bb.x0)) return;
  const w = Math.max(0.1, bb.x1 - bb.x0), h = Math.max(0.1, bb.y1 - bb.y0), id = this.id(), pt = (x, y) => `<a:pt x="${pxe(x - bb.x0)}" y="${pxe(y - bb.y0)}"/>`;
  const path = subs.map(s => s.map(op => (op[0] === 'M' ? `<a:moveTo>${pt(op[1], op[2])}</a:moveTo>` : op[0] === 'L' ? `<a:lnTo>${pt(op[1], op[2])}</a:lnTo>` : op[0] === 'C' ? `<a:cubicBezTo>${pt(op[1], op[2])}${pt(op[3], op[4])}${pt(op[5], op[6])}</a:cubicBezTo>` : '<a:close/>')).join('')).join('');
  this.sh.push(`<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${pxEsc(o.name || 'Forma ' + id)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${pxe(bb.x0)}" y="${pxe(bb.y0)}"/><a:ext cx="${pxe(w)}" cy="${pxe(h)}"/></a:xfrm><a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/><a:pathLst><a:path w="${pxe(w)}" h="${pxe(h)}"${o.fill ? '' : ' fill="none"'}>${path}</a:path></a:pathLst></a:custGeom>${pxvFillXml(o.fill, bb)}${pxvLineXml(o.line, bb)}</p:spPr></p:sp>`);
};
PxSlide.prototype.vshape = function (cx, cy, r, o = {}) { // elipse com preenchimento (cor ou degradê) e contorno
  const id = this.id(), bb = { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r };
  this.sh.push(`<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${pxEsc(o.name || 'Círculo ' + id)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${pxe(bb.x0)}" y="${pxe(bb.y0)}"/><a:ext cx="${pxe(2 * r)}" cy="${pxe(2 * r)}"/></a:xfrm><a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>${pxvFillXml(o.fill, bb)}${pxvLineXml(o.line, bb)}</p:spPr><p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="${LANG === 'pt' ? 'pt-BR' : 'en-US'}"/></a:p></p:txBody></p:sp>`);
};

/* ---------- gravação → slide ---------- */
const pxvStyleKey = l => (l.grad ? JSON.stringify(l.grad) : l.c + '|' + l.a.toFixed(3)) + '|' + l.w.toFixed(2) + '|' + (l.dash || []).join(',') + '|' + l.cap;
function pxvEmit(s, rec, th) {
  const o = rec.out; let i = 0;
  while (i < o.length) {
    const p = o[i];
    if (p.t === 'text') {
      i++; const sz = Math.max(8, p.size * 0.8), bw = p.w * 1.12 + 8, bh = sz * 1.9, ax = p.align === 'center' ? 0 : p.align === 'right' || p.align === 'end' ? -bw / 2 : bw / 2, ay = p.base === 'middle' ? 0 : p.base === 'top' || p.base === 'hanging' ? bh / 2 : p.base === 'bottom' ? -bh / 2 : -bh * 0.22;
      const c = Math.cos(p.ang), sn = Math.sin(p.ang), cx = p.x + ax * c - ay * sn, cy = p.y + ax * sn + ay * c, deg = p.ang * 180 / Math.PI;
      s.text(cx - bw / 2, cy - bh / 2, bw, bh, s.para(p.text, { sz, b: p.bold, col: p.c, alpha: p.a < 0.99 ? p.a * 100 : 0, font: th.fontBody, algn: p.align === 'center' ? 'ctr' : p.align === 'right' || p.align === 'end' ? 'r' : 'l' }), { name: p.text.slice(0, 40), rot: Math.abs(deg) > 0.05 ? deg : 0, anchor: 'ctr', nowrap: true });
      continue;
    }
    const g = p.g;
    if (g.k === 'ell') { i++; if (g.r < 1.7 && p.fill && !p.line && !p.fill.grad && p.fill.a < 0.5) continue; /* poeira decorativa de fundo, não é dado */ const hasF = !!p.fill; s.vshape(g.cx, g.cy, Math.max(0.3, g.r), { fill: p.fill, line: p.line, name: hasF ? 'Círculo' : 'Anel' }); continue; }
    if (p.line && !p.fill) { // traços seguidos com o mesmo estilo viram uma forma só (várias linhas)
      const key = pxvStyleKey(p.line), subs = [...g.sub]; let j = i + 1;
      while (j < o.length && o[j].t === 'shape' && o[j].g.k === 'path' && !o[j].fill && o[j].line && pxvStyleKey(o[j].line) === key) { subs.push(...o[j].g.sub); j++; }
      i = j; s.vpath(subs, { line: p.line, name: 'Linha' }); continue;
    }
    i++; s.vpath(g.sub, { fill: p.fill, line: p.line, name: 'Forma' });
  }
}

/* gráfico de canvas → especificação de desenho vetorial para o slide (pxSpec) */
function pxVecCanvas(P, state, name) {
  const note = (() => { try { const f = CHART_REG[P.type] && CHART_REG[P.type].note; return f ? String(f(P) || '') : ''; } catch (e) { return ''; } })();
  const draw = (s, X, Y, W, H) => {
    const rec = new PxRec(csMeasureCtx()), old = window.Path2D; window.Path2D = PxPath2D;
    try { s.group(name, X, Y, W, H, () => { drawCsStatic(P, rec, X, Y, W, H, state && state.cs ? state.cs : null); pxvEmit(s, rec, P.__pxth); }); }
    finally { window.Path2D = old; }
  };
  return { vec: draw, note };
}
