/* Datavix: ícones dos gráficos (SVG 48×32, traço fino, herdam a cor do texto). Um por tipo de gráfico de ALL_CHARTS. */
const ICO_F = n => (Math.round(n * 10) / 10).toString();
const ICO_A = 'var(--ia, #d4ff00)'; // cor de destaque: o elemento principal de cada gráfico (lime no escuro, oliva no claro)
const icoPt = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
// fatia de pizza (ri = 0) ou de rosca, em graus a partir de 12 horas, com uma folga de 1,6° entre fatias
function icoSlice(cx, cy, r, a0, a1, ri = 0, fill = 'currentColor', op = 1, push = 0) {
  const m = (a0 + a1) / 2 - 90, ox = push * Math.cos(m * Math.PI / 180), oy = push * Math.sin(m * Math.PI / 180);
  a0 += 0.8; a1 -= 0.8; const P = (R, a) => icoPt(cx + ox, cy + oy, R, a - 90), big = a1 - a0 > 180 ? 1 : 0, o0 = P(r, a0), o1 = P(r, a1);
  let d = `M${ICO_F(o0[0])} ${ICO_F(o0[1])}A${r} ${r} 0 ${big} 1 ${ICO_F(o1[0])} ${ICO_F(o1[1])}`;
  if (ri) { const i1 = P(ri, a1), i0 = P(ri, a0); d += `L${ICO_F(i1[0])} ${ICO_F(i1[1])}A${ri} ${ri} 0 ${big} 0 ${ICO_F(i0[0])} ${ICO_F(i0[1])}Z`; } else d += `L${ICO_F(cx + ox)} ${ICO_F(cy + oy)}Z`;
  return `<path d="${d}" fill="${fill}" stroke="none" opacity="${op}"/>`;
}
const icoPie = (cx, cy, r, cuts, ri = 0, push = 1) => cuts.slice(0, -1).map((a, k) => icoSlice(cx, cy, r, a, cuts[k + 1], ri, k === 0 ? ICO_A : 'currentColor', k === 0 ? 1 : [0, 0.85, 0.5, 0.28][Math.min(k, 3)], k === 0 ? push : 0)).join('');
// corrente vertical suave: larguras (meia largura) ao longo de y
function icoStream(cx, ws, op, fill = 'currentColor') {
  const n = ws.length, y = k => 3 + 26 * k / (n - 1), L = ws.map((w, k) => [cx - w, y(k)]), R = ws.map((w, k) => [cx + w, y(k)]).reverse(), pts = L.concat(R);
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], N = pts.length; let d = `M${ICO_F(mid(pts[N - 1], pts[0])[0])} ${ICO_F(mid(pts[N - 1], pts[0])[1])}`;
  for (let i = 0; i < N; i++) { const c = pts[i], m = mid(c, pts[(i + 1) % N]); d += `Q${ICO_F(c[0])} ${ICO_F(c[1])} ${ICO_F(m[0])} ${ICO_F(m[1])}`; }
  return `<path d="${d}Z" fill="${fill}" stroke="none" opacity="${op}"/>`;
}
function icoRadialTree() {
  let d = '', dots = '', k = 0; const hubs = 5;
  for (let i = 0; i < hubs; i++) {
    const a = i / hubs * 360 - 90, h = icoPt(24, 16, 6.2, a); d += `M24 16L${ICO_F(h[0])} ${ICO_F(h[1])}`; dots += `<circle cx="${ICO_F(h[0])}" cy="${ICO_F(h[1])}" r="1.4" fill="currentColor" stroke="none"/>`;
    for (let q = -1; q <= 1; q++) { const b = a + q * 19, l = icoPt(24, 16, 13, b); d += `M${ICO_F(h[0])} ${ICO_F(h[1])}L${ICO_F(l[0])} ${ICO_F(l[1])}`; const hero = i === 1 && q === 1; dots += `<circle cx="${ICO_F(l[0])}" cy="${ICO_F(l[1])}" r="${hero ? 2.6 : 1.2 + (k % 3) * 0.3}" fill="${hero ? ICO_A : 'currentColor'}" stroke="none" opacity="${hero ? 1 : 0.5 + (k % 2) * 0.3}"/>`; k++; }
  }
  return `<circle cx="24" cy="16" r="13" opacity=".16" stroke-dasharray="1 2.4"/><path d="M${d.slice(1)}" opacity=".45"/>${dots}<circle cx="24" cy="16" r="2.6" fill="${ICO_A}" stroke="none"/>`;
}
function icoRays() {
  const len = [11, 7, 12, 6, 9, 14, 7, 11, 8, 12, 6, 10, 8, 10]; let d = '', dots = '', hero = '';
  len.forEach((l, i) => { const a = i / len.length * 360 - 90, p0 = icoPt(24, 16, 4.6, a), p1 = icoPt(24, 16, 4.6 + l * 0.85, a), top = i === 5; (top ? (hero = `<path d="M${ICO_F(p0[0])} ${ICO_F(p0[1])}L${ICO_F(p1[0])} ${ICO_F(p1[1])}" stroke="${ICO_A}" stroke-width="2"/><circle cx="${ICO_F(p1[0])}" cy="${ICO_F(p1[1])}" r="2.2" fill="${ICO_A}" stroke="none"/>`) : (d += `M${ICO_F(p0[0])} ${ICO_F(p0[1])}L${ICO_F(p1[0])} ${ICO_F(p1[1])}`, dots += `<circle cx="${ICO_F(p1[0])}" cy="${ICO_F(p1[1])}" r="1.2" fill="currentColor" stroke="none" opacity=".7"/>`)); });
  return `<circle cx="24" cy="16" r="3.2" opacity=".6"/><path d="${d}" opacity=".5"/>${dots}${hero}`;
}
function icoCalendar() {
  const hot = new Set(['2-1', '3-1', '3-2', '6-0', '5-3']); let r = '';
  for (let c = 0; c < 9; c++) for (let w = 0; w < 4; w++) { const k = c + '-' + w; r += `<rect x="${3.4 + c * 4.6}" y="${4.4 + w * 6.6}" width="3.8" height="5" rx="1.1" fill="${hot.has(k) ? ICO_A : 'currentColor'}" stroke="none" opacity="${hot.has(k) ? 1 : ICO_F(0.12 + ((c * 7 + w * 13) % 6) / 9)}"/>`; }
  return r;
}
const icoAxes = '<path d="M4 3.5V28.5H45" opacity=".35"/>';
const icoMap = '<path d="M13 4.5L23 3L32 6L40 10L42 18L36 25.5L28 29L20 27L13 22L8 14Z" fill="currentColor" fill-opacity=".07" opacity=".5"/>';
const CHART_ICONS = {
  organism: icoRadialTree,
  rays: icoRays,
  river: () => icoStream(9, [0.6, 3.2, 4.4, 2.4, 1.4, 3, 4, 2, 0.6], 0.32) + icoStream(24, [1, 5, 8, 5.4, 3.2, 5.6, 8.4, 6, 1], 0.95, ICO_A) + icoStream(39, [0.6, 2.4, 3.8, 5, 3, 2, 3.4, 2.6, 0.6], 0.55),
  fan: () => '<path d="M30 3.5V28.5" opacity=".5"/>' + [[5, 22], [10, 15], [15, 26], [20, 9], [25, 18]].map(([y, w], i) => `<rect x="${30 - w}" y="${y - 1.6}" width="${w - 1.2}" height="3.2" rx="1.2" fill="${i === 2 ? ICO_A : 'currentColor'}" stroke="none" opacity="${i === 2 ? 1 : 0.8 - i * 0.07}"/>`).join('') + '<path d="M31.5 5L44 3M31.5 10L44 8.5M31.5 15L44 15M31.5 20L44 22M31.5 25L44 28" stroke-width="1" opacity=".45"/>',
  ridge: () => [3, 2, 1, 0].map(k => { const y = 12 + k * 5.2, sx = k * 2.6, hero = k === 0, d = `M${3 + sx} ${y}L${8 + sx} ${y - 4}L${13 + sx} ${y - 1}L${19 + sx} ${y - 8}L${25 + sx} ${y - 2}L${31 + sx} ${y - 5}L${37 + sx} ${y}Z`; return `<path d="${d}" fill="var(--card, #101310)" stroke="${hero ? ICO_A : 'currentColor'}" stroke-width="${hero ? 1.9 : 1.3}" opacity="${hero ? 1 : ICO_F(0.35 + (3 - k) * 0.13)}"/>`; }).join(''),
  flow: () => { const rb = (x0, a0, a1, x1, b0, b1, f, o) => `<path d="M${x0} ${a0}C${x0 + 9} ${a0} ${x1 - 9} ${b0} ${x1} ${b0}V${b1}C${x1 - 9} ${b1} ${x0 + 9} ${a1} ${x0} ${a1}Z" fill="${f}" stroke="none" opacity="${o}"/>`, nd = (x, y0, y1, f, o) => `<rect x="${x}" y="${y0}" width="3.6" height="${y1 - y0}" rx="1.2" fill="${f}" stroke="none" opacity="${o}"/>`;
    return rb(7.6, 4, 12, 22, 5, 12, ICO_A, 0.55) + rb(7.6, 14, 21, 22, 18, 24, 'currentColor', 0.2) + rb(7.6, 23, 28, 22, 26, 28, 'currentColor', 0.14) + rb(25.6, 5, 11, 40, 8, 15, ICO_A, 0.55) + rb(25.6, 18, 24, 40, 18, 22, 'currentColor', 0.2)
      + nd(4, 4, 12, ICO_A, 1) + nd(4, 14, 21, 'currentColor', 0.85) + nd(4, 23, 28, 'currentColor', 0.6) + nd(22, 5, 12, 'currentColor', 0.9) + nd(22, 18, 28, 'currentColor', 0.6) + nd(40, 8, 15, ICO_A, 1) + nd(40, 18, 22, 'currentColor', 0.6); },
  pie: () => icoPie(24, 16, 12.5, [0, 120, 205, 285, 360]),
  donut: () => icoPie(24, 16, 12.5, [0, 120, 205, 285, 360], 6.2),
  pies: () => [[12, 9, 6.6, [0, 150, 260, 360]], [35, 9, 6.6, [0, 110, 250, 360]], [12, 24.5, 5, [0, 200, 360]], [35, 24.5, 5, [0, 90, 220, 360]]].map(([x, y, r, c]) => icoPie(x, y, r, c, 0, 0.6)).join(''),
  donuts: () => [[12, 9, 6.6, [0, 150, 260, 360]], [35, 9, 6.6, [0, 110, 250, 360]], [12, 24.5, 5, [0, 200, 360]], [35, 24.5, 5, [0, 90, 220, 360]]].map(([x, y, r, c]) => icoPie(x, y, r, c, r * 0.5, 0.5)).join(''),
  packed: () => [[17, 17, 10.5, 1], [35, 11, 7, 0.55], [34, 25, 5, 0.4], [8.5, 6.5, 3.6, 0.7], [43, 24.5, 2.4, 0.5], [26, 5, 2.6, 0.45]].map(([x, y, r, o], i) => i === 0 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${ICO_A}" fill-opacity=".9" stroke="none"/>` : `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" fill-opacity="${ICO_F(o * 0.4)}" stroke="currentColor" opacity="${o + 0.2}"/>`).join(''),
  cols: () => [[3, 3.5], [26, 3.5], [3, 18], [26, 18]].map(([x, y], p) => [0, 1, 2, 3].map(i => { const h = [5, 9, 6, 8][(i + p) % 4], hero = p === 0 && i === 1; return `<rect x="${x + i * 5.2}" y="${y + 10 - h}" width="3.8" height="${h}" rx="1" fill="${hero ? ICO_A : 'currentColor'}" stroke="none" opacity="${hero ? 1 : ICO_F(0.4 + ((i + p) % 3) * 0.18)}"/>`; }).join('')).join(''),
  lines: () => '<path d="M3 11C6 6 9 12 13 7S19 8 21 5" stroke="' + ICO_A + '" stroke-width="1.9"/><path d="M27 12C30 7 34 11 37 6S43 9 45 5" opacity=".7"/><path d="M3 27C6 22 10 28 13 23S19 24 21 21" opacity=".55"/><path d="M27 28C31 23 34 27 38 22S42 25 45 21" opacity=".8"/><path d="M24 2V30M2 16H46" opacity=".18" stroke-width="1"/>',
  radial: () => '<circle cx="24" cy="16" r="13" opacity=".2"/><circle cx="24" cy="16" r="8.5" opacity=".2"/><circle cx="24" cy="16" r="4" opacity=".2"/><path d="M24 4L33 8L36 15L31 25L24 27L16 24L12 16L15 8Z" fill="' + ICO_A + '" fill-opacity=".18" stroke="' + ICO_A + '" stroke-width="1.8"/><path d="M24 8.5L29 11L31 16L27 21L22 21.5L18.5 18L19 12Z" opacity=".6"/>',
  radar: () => '<path d="M24 3L42 12.5L38 27.5L10 27.5L6 12.5Z" opacity=".25"/><path d="M24 9L35 14.4L32.6 23L15.4 23L13 14.4Z" opacity=".25"/><path d="M24 24V3M24 24L42 12.5M24 24L38 27.5M24 24L10 27.5M24 24L6 12.5" opacity=".14" stroke-width="1"/><path d="M24 5L38 14L30 25L14 21L12 12Z" fill="' + ICO_A + '" fill-opacity=".2" stroke="' + ICO_A + '" stroke-width="1.8"/>' + [[24, 5], [38, 14], [30, 25], [14, 21], [12, 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="${ICO_A}" stroke="none"/>`).join(''),
  box: () => '<path d="M4 29H44" opacity=".35"/>' + [[8, 9, 21, 15], [20, 5, 18, 10], [32, 11, 24, 17]].map(([x, t, b, m], i) => `<path d="M${x + 4} ${t - 2.5}V${b + 5}M${x + 1.2} ${t - 2.5}H${x + 6.8}M${x + 1.2} ${b + 5}H${x + 6.8}" opacity=".5"/><rect x="${x}" y="${t + 2.5}" width="8" height="${b - t - 2.5}" rx="1.4" fill="currentColor" fill-opacity="${i === 1 ? 0.35 : 0.2}" stroke="currentColor" opacity=".85"/><path d="M${x} ${m}H${x + 8}" stroke="${ICO_A}" stroke-width="2"/>`).join(''),
  words: () => [[5, 5, 26, 9, 1, 1], [33, 6, 10, 5, 0, 0.7], [6, 17, 11, 5, 0, 0.5], [19, 16, 24, 7, 0, 0.8], [11, 25, 16, 4, 0, 0.45], [30, 25, 12, 4, 0, 0.35]].map(([x, y, w, h, hero, o]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${hero ? ICO_A : 'currentColor'}" stroke="none" opacity="${hero ? 1 : o}"/>`).join(''),
  bubmap: () => icoMap + '<circle cx="29" cy="19" r="6.4" fill="' + ICO_A + '" fill-opacity=".85" stroke="none"/><circle cx="19" cy="11" r="3.6" fill="currentColor" stroke="none" opacity=".6"/><circle cx="35" cy="10" r="2.6" fill="currentColor" stroke="none" opacity=".45"/><circle cx="17" cy="21" r="2.2" fill="currentColor" stroke="none" opacity=".7"/>',
  isomap: () => icoMap + '<path d="M16 15C18 8 28 7 32 12S36 22 28 24S14 22 16 15Z" opacity=".55"/><path d="M19.5 15C21 11 27 11 29.5 14S31 20 26.5 20.5S18.5 19 19.5 15Z" fill="' + ICO_A + '" fill-opacity=".18" stroke="' + ICO_A + '" stroke-width="1.6"/><circle cx="25" cy="16.5" r="1.5" fill="' + ICO_A + '" stroke="none"/>',
  bars: () => '<path d="M3 28.5H45" opacity=".4"/>' + [[5, 11], [13, 18], [21, 14], [29, 24], [37, 9]].map(([x, h], i) => `<rect x="${x}" y="${28 - h}" width="6" height="${h}" rx="1.4" fill="${i === 3 ? ICO_A : 'currentColor'}" stroke="none" opacity="${i === 3 ? 1 : ICO_F(0.8 - i * 0.1)}"/>`).join(''),
  hbars: () => '<path d="M3.5 3V29" opacity=".4"/>' + [[4.5, 33], [10.5, 40], [16.5, 25], [22.5, 14]].map(([y, w], i) => `<rect x="5.5" y="${y}" width="${w}" height="4.6" rx="1.4" fill="${i === 1 ? ICO_A : 'currentColor'}" stroke="none" opacity="${i === 1 ? 1 : ICO_F(0.8 - i * 0.12)}"/>`).join(''),
  stacked100: () => [4, 14, 24, 34].map((x, i) => { const a = [9, 14, 6, 11][i], b = [11, 8, 13, 9][i], c = 25 - a - b; return `<rect x="${x}" y="3.5" width="8.5" height="${a}" rx="1.4" fill="currentColor" stroke="none" opacity=".35"/><rect x="${x}" y="${3.5 + a + 0.8}" width="8.5" height="${b - 0.8}" rx="1" fill="${ICO_A}" stroke="none" opacity="${ICO_F(0.65 + i * 0.1)}"/><rect x="${x}" y="${3.5 + a + b + 0.8}" width="8.5" height="${c - 0.8}" rx="1.4" fill="currentColor" stroke="none" opacity=".75"/>`; }).join(''),
  treemap: () => '<rect x="3" y="3" width="24" height="26" rx="2" fill="' + ICO_A + '" fill-opacity=".85" stroke="none"/><rect x="29.5" y="3" width="15.5" height="13" rx="2" fill="currentColor" stroke="none" opacity=".6"/><rect x="29.5" y="18.5" width="8.5" height="10.5" rx="2" fill="currentColor" stroke="none" opacity=".38"/><rect x="40" y="18.5" width="5" height="10.5" rx="2" fill="currentColor" stroke="none" opacity=".22"/>',
  race: () => [[4, 36, 1], [11, 27, 0.6], [18, 17, 0.35]].map(([y, w, o], i) => `<rect x="4" y="${y}" width="${w}" height="5.4" rx="1.6" fill="${i === 0 ? ICO_A : 'currentColor'}" stroke="none" opacity="${i === 0 ? 1 : o}"/>`).join('') + '<path d="M42 27V15M38.5 18.5L42 15L45.5 18.5" opacity=".7"/>',
  line: () => icoAxes + '<path d="M6 23L14 14L22 19L30 8L38 13L44 5.5" stroke="' + ICO_A + '" stroke-width="2.1"/>' + [[6, 23], [14, 14], [22, 19], [30, 8], [38, 13], [44, 5.5]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 3 ? 2.6 : 1.8}" fill="var(--card, #101310)" stroke="${ICO_A}" stroke-width="1.5"/>`).join(''),
  area: () => '<path d="M4 28.5H45" opacity=".4"/><path d="M5 22L13 13L21 18L29 7L37 12L44 6V28.5H5Z" fill="' + ICO_A + '" fill-opacity=".22" stroke="none"/><path d="M5 22L13 13L21 18L29 7L37 12L44 6" stroke="' + ICO_A + '" stroke-width="2"/>',
  calendar: icoCalendar,
  scatter: () => icoAxes + [[9, 23], [13, 17], [16, 25], [20, 13], [24, 19], [28, 9], [32, 16], [36, 8], [40, 14], [19, 21], [30, 22]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${[20, 28, 32, 36, 30].includes(x) && y < 17 ? 2.3 : 1.7}" fill="${[28, 32, 36, 40].includes(x) && y < 17 ? ICO_A : 'currentColor'}" stroke="none" opacity="${[28, 32, 36, 40].includes(x) && y < 17 ? 1 : 0.65}"/>`).join(''),
  bubble: () => icoAxes + '<circle cx="15" cy="18" r="8" fill="' + ICO_A + '" fill-opacity=".25" stroke="' + ICO_A + '" stroke-width="1.6"/><circle cx="31" cy="11" r="5.4" fill="currentColor" fill-opacity=".4" stroke="currentColor" opacity=".9"/><circle cx="38" cy="22" r="3.8" fill="currentColor" fill-opacity=".6" stroke="none"/><circle cx="26" cy="24" r="2.2" fill="currentColor" stroke="none" opacity=".7"/>',
  kpi: () => '<rect x="4" y="4" width="40" height="24" rx="3.5" fill="currentColor" fill-opacity=".05" opacity=".8"/><rect x="9" y="9" width="14" height="5.4" rx="1.6" fill="currentColor" stroke="none" opacity=".9"/><rect x="9" y="16" width="8" height="2.6" rx="1.3" fill="currentColor" stroke="none" opacity=".4"/><path d="M22 24L28 20L33 22L38.5 15" stroke="' + ICO_A + '" stroke-width="1.9"/><circle cx="38.5" cy="15" r="2" fill="' + ICO_A + '" stroke="none"/>',
};
function chartIcon(id) {
  const f = CHART_ICONS[id]; if (!f) return '';
  return `<svg class="cico" viewBox="0 0 48 32" width="48" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${f()}</svg>`;
}
