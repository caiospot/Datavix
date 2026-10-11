/* Datavix: ícones dos gráficos (SVG 48×32). Formas suaves com degradê em duas famílias de cor: lime (o destaque) e ardósia (o resto),
 * mais uma névoa clara para as camadas de fundo. As cores vêm de variáveis CSS (.cico: --il1/--il2 lime, --is1/--is2 ardósia, --im1/--im2 névoa),
 * então o mesmo desenho serve nos temas escuro e claro. Cada SVG leva os seus próprios degradês (ids únicos) e não depende de nada na página.
 * Um ícone por tipo de gráfico de ALL_CHARTS. */
const ICO_F = n => (Math.round(n * 10) / 10).toString();
let ICO_N = 0;
const icoPt = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
// degradês de um ícone: L lime, S ardósia, M névoa; sufixo V = vertical (claro em cima), D = diagonal
function icoGrads(n) {
  const mk = (name, a, b, dir) => `<linearGradient id="ig${n}${name}" ${dir === 'V' ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="1"'}><stop offset="0" style="stop-color:var(${a})"/><stop offset="1" style="stop-color:var(${b})"/></linearGradient>`;
  const defs = ['L', 'S', 'M'].map(k => ['V', 'D'].map(d => mk(k + d, `--i${k.toLowerCase()}1`, `--i${k.toLowerCase()}2`, d)).join('')).join('');
  const u = k => `url(#ig${n}${k})`;
  return { defs: `<defs>${defs}</defs>`, LV: u('LV'), LD: u('LD'), SV: u('SV'), SD: u('SD'), MV: u('MV'), MD: u('MD') };
}
// tons sólidos (linhas, contornos): variáveis CSS
const ICO_LIME = 'var(--il2)', ICO_SL = 'var(--is2)', ICO_MIST = 'var(--im2)';
// fatia de pizza (ri = 0) ou de rosca, em graus a partir de 12 horas, com uma folga entre fatias
function icoSlice(cx, cy, r, a0, a1, ri, fill, op, push) {
  const m = (a0 + a1) / 2 - 90, ox = push * Math.cos(m * Math.PI / 180), oy = push * Math.sin(m * Math.PI / 180);
  a0 += 1; a1 -= 1; const P = (R, a) => icoPt(cx + ox, cy + oy, R, a - 90), big = a1 - a0 > 180 ? 1 : 0, o0 = P(r, a0), o1 = P(r, a1);
  let d = `M${ICO_F(o0[0])} ${ICO_F(o0[1])}A${r} ${r} 0 ${big} 1 ${ICO_F(o1[0])} ${ICO_F(o1[1])}`;
  if (ri) { const i1 = P(ri, a1), i0 = P(ri, a0); d += `L${ICO_F(i1[0])} ${ICO_F(i1[1])}A${ri} ${ri} 0 ${big} 0 ${ICO_F(i0[0])} ${ICO_F(i0[1])}Z`; } else d += `L${ICO_F(cx + ox)} ${ICO_F(cy + oy)}Z`;
  return `<path d="${d}" fill="${fill}" stroke="none" opacity="${op}"/>`;
}
const icoPie = (g, cx, cy, r, cuts, ri = 0, push = 0.8) => cuts.slice(0, -1).map((a, k) => icoSlice(cx, cy, r, a, cuts[k + 1], ri, [g.LD, g.SD, g.MD, g.SV][Math.min(k, 3)], [1, 0.95, 0.9, 0.7][Math.min(k, 3)], k === 0 ? push : 0)).join('');
// corrente vertical suave: meias larguras ao longo de y
function icoStream(cx, ws, fill, op) {
  const n = ws.length, y = k => 3 + 26 * k / (n - 1), L = ws.map((w, k) => [cx - w, y(k)]), R = ws.map((w, k) => [cx + w, y(k)]).reverse(), pts = L.concat(R);
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], N = pts.length; let d = `M${ICO_F(mid(pts[N - 1], pts[0])[0])} ${ICO_F(mid(pts[N - 1], pts[0])[1])}`;
  for (let i = 0; i < N; i++) { const c = pts[i], m = mid(c, pts[(i + 1) % N]); d += `Q${ICO_F(c[0])} ${ICO_F(c[1])} ${ICO_F(m[0])} ${ICO_F(m[1])}`; }
  return `<path d="${d}Z" fill="${fill}" stroke="none" opacity="${op}"/>`;
}
const icoMapPath = 'M13 4.5L23 3L32 6L40 10L42 18L36 25.5L28 29L20 27L13 22L8 14Z';
const icoAx = '<path d="M4 3.5V28.5H45" opacity=".4"/>';
const CHART_ICONS = {
  organism: g => {
    const hubs = [[24, 16 - 6.4], [24 + 6.1, 16 - 2], [24 + 3.8, 16 + 5.2], [24 - 3.8, 16 + 5.2], [24 - 6.1, 16 - 2]]; let lines = '', dots = '';
    hubs.forEach(([x, y], i) => { lines += `M24 16L${ICO_F(x)} ${ICO_F(y)}`; dots += `<circle cx="${ICO_F(x)}" cy="${ICO_F(y)}" r="1.9" fill="${i % 2 ? g.SD : g.MD}" stroke="none"/>`; });
    const leaves = [[24, 4.4, 2.6, 'S'], [32, 7, 1.6, 'M'], [41, 11, 2, 'M'], [43.5, 18, 3.6, 'L'], [38, 25.5, 1.9, 'S'], [30, 28, 1.5, 'M'], [18, 28, 2.1, 'S'], [10, 25, 1.5, 'M'], [5.5, 17, 2.2, 'S'], [9, 9.5, 1.6, 'M'], [16, 5.5, 1.9, 'M']];
    leaves.forEach(([x, y, r, k]) => { lines += `M${ICO_F(x)} ${ICO_F(y)}L24 16`; dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="${k === 'L' ? g.LD : k === 'S' ? g.SD : g.MD}" stroke="none"/>`; });
    return `<path d="${lines}" stroke="${ICO_SL}" stroke-width="1" opacity=".35"/><path d="M24 16L43.5 18" stroke="${ICO_LIME}" stroke-width="1.6" opacity=".9"/>${dots}<circle cx="24" cy="16" r="2.7" fill="${g.LD}" stroke="none"/>`;
  },
  rays: g => {
    const len = [11, 7, 12, 6, 9, 14, 7, 11, 8, 12, 6, 10, 8, 10]; let d = '', dots = '', hero = '';
    len.forEach((l, i) => { const a = i / len.length * 360 - 90, p0 = icoPt(24, 16, 4.6, a), p1 = icoPt(24, 16, 4.6 + l * 0.85, a); if (i === 5) hero = `<path d="M${ICO_F(p0[0])} ${ICO_F(p0[1])}L${ICO_F(p1[0])} ${ICO_F(p1[1])}" stroke="${ICO_LIME}" stroke-width="2.6"/><circle cx="${ICO_F(p1[0])}" cy="${ICO_F(p1[1])}" r="2.6" fill="${g.LD}" stroke="none"/>`; else { d += `M${ICO_F(p0[0])} ${ICO_F(p0[1])}L${ICO_F(p1[0])} ${ICO_F(p1[1])}`; dots += `<circle cx="${ICO_F(p1[0])}" cy="${ICO_F(p1[1])}" r="${i % 3 ? 1.5 : 2}" fill="${i % 2 ? g.SD : g.MD}" stroke="none"/>`; } });
    return `<circle cx="24" cy="16" r="3.4" stroke="${ICO_SL}" opacity=".6"/><path d="${d}" stroke="${ICO_SL}" stroke-width="1.6" opacity=".5"/>${dots}${hero}`;
  },
  river: g => icoStream(9, [0.6, 3.2, 4.4, 2.4, 1.4, 3, 4, 2, 0.6], g.SV, 0.55) + icoStream(24, [1, 5, 8, 5.4, 3.2, 5.6, 8.4, 6, 1], g.LV, 1) + icoStream(39, [0.6, 2.4, 3.8, 5, 3, 2, 3.4, 2.6, 0.6], g.MV, 0.8),
  fan: g => '<path d="M30 3.5V28.5" stroke="' + ICO_SL + '" opacity=".4"/>' + [[5, 22, 'S'], [10, 15, 'M'], [15, 26, 'L'], [20, 9, 'M'], [25, 18, 'S']].map(([y, w, k]) => `<rect x="${30 - w}" y="${y - 1.7}" width="${w - 1.4}" height="3.4" rx="1.7" fill="${k === 'L' ? g.LD : k === 'S' ? g.SD : g.MD}" stroke="none"/>`).join('') + `<path d="M31.5 5L44 3M31.5 10L44 8.5M31.5 15L44 15M31.5 20L44 22M31.5 25L44 28" stroke="${ICO_SL}" stroke-width="1" opacity=".4"/>`,
  ridge: g => [[3, g.MV, 0.55, [0, 7, 3, 11, 4, 8, 0]], [2, g.SV, 0.7, [0, 4, 10, 3, 9, 5, 0]], [1, g.MV, 0.85, [0, 8, 3, 12, 5, 9, 0]], [0, g.LV, 1, [0, 5, 11, 4, 13, 6, 0]]].map(([k, f, o, h]) => {
    const yb = 18 + k * 3.6, sx = k * 2.4, pts = h.map((v, i) => [3 + sx + i * 6, yb - v]), N = pts.length, mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    let d = `M${pts[0][0]} ${yb + 4}L${pts[0][0]} ${ICO_F(pts[0][1])}`; for (let i = 1; i < N - 1; i++) { const m = mid(pts[i], pts[i + 1]); d += `Q${pts[i][0]} ${ICO_F(pts[i][1])} ${ICO_F(m[0])} ${ICO_F(m[1])}`; }
    d += `L${pts[N - 1][0]} ${ICO_F(pts[N - 1][1])}V${yb + 4}Z`; return `<path d="${d}" fill="${f}" stroke="none" opacity="${o}"/>`; }).join(''),
  flow: g => { const rb = (x0, a0, a1, x1, b0, b1, f, o) => `<path d="M${x0} ${a0}C${x0 + 9} ${a0} ${x1 - 9} ${b0} ${x1} ${b0}V${b1}C${x1 - 9} ${b1} ${x0 + 9} ${a1} ${x0} ${a1}Z" fill="${f}" stroke="none" opacity="${o}"/>`, nd = (x, y0, y1, f) => `<rect x="${x}" y="${y0}" width="3.8" height="${y1 - y0}" rx="1.4" fill="${f}" stroke="none"/>`;
    return rb(7.8, 4, 12, 22, 5, 12, g.LD, 0.6) + rb(7.8, 14, 21, 22, 18, 24, g.SD, 0.35) + rb(7.8, 23, 28, 22, 26, 28, g.MD, 0.6) + rb(25.8, 5, 11, 40, 8, 15, g.LD, 0.6) + rb(25.8, 18, 24, 40, 18, 22, g.SD, 0.3)
      + nd(4, 4, 12, g.LV) + nd(4, 14, 21, g.SV) + nd(4, 23, 28, g.MV) + nd(22, 5, 12, g.SV) + nd(22, 18, 28, g.MV) + nd(40, 8, 15, g.LV) + nd(40, 18, 22, g.SV); },
  pie: g => icoPie(g, 24, 16, 12.5, [0, 120, 205, 285, 360]),
  donut: g => icoPie(g, 24, 16, 12.5, [0, 120, 205, 285, 360], 6.4),
  pies: g => [[12, 9, 6.6, [0, 150, 260, 360]], [35, 9, 6.6, [0, 110, 250, 360]], [12, 24.5, 5, [0, 200, 360]], [35, 24.5, 5, [0, 90, 220, 360]]].map(([x, y, r, c]) => icoPie(g, x, y, r, c, 0, 0.5)).join(''),
  donuts: g => [[12, 9, 6.6, [0, 150, 260, 360]], [35, 9, 6.6, [0, 110, 250, 360]], [12, 24.5, 5, [0, 200, 360]], [35, 24.5, 5, [0, 90, 220, 360]]].map(([x, y, r, c]) => icoPie(g, x, y, r, c, r * 0.52, 0.4)).join(''),
  packed: g => [[17, 17, 10.5, g.LD, 1], [35, 11, 7, g.SD, 0.9], [34, 25, 5, g.MD, 0.95], [8.5, 6.5, 3.6, g.SD, 0.7], [43, 24.5, 2.4, g.MD, 0.9], [26, 5, 2.6, g.MD, 0.9]].map(([x, y, r, f, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="none" opacity="${o}"/>`).join(''),
  cols: g => [[3, 3.5], [26, 3.5], [3, 18], [26, 18]].map(([x, y], p) => [0, 1, 2, 3].map(i => { const h = [5, 9, 6, 8][(i + p) % 4], hero = p === 0 && i === 1; return `<rect x="${x + i * 5.2}" y="${y + 10 - h}" width="3.8" height="${h}" rx="1.4" fill="${hero ? g.LV : (i + p) % 2 ? g.SV : g.MV}" stroke="none"/>`; }).join('')).join(''),
  lines: g => `<path d="M3 11C6 6 9 12 13 7S19 8 21 5" stroke="${ICO_LIME}" stroke-width="2.2"/><path d="M27 12C30 7 34 11 37 6S43 9 45 5" stroke="${ICO_SL}" stroke-width="2"/><path d="M3 27C6 22 10 28 13 23S19 24 21 21" stroke="${ICO_MIST}" stroke-width="2"/><path d="M27 28C31 23 34 27 38 22S42 25 45 21" stroke="${ICO_SL}" stroke-width="2" opacity=".6"/>`,
  radial: g => `<circle cx="24" cy="16" r="13" stroke="${ICO_SL}" opacity=".25"/><circle cx="24" cy="16" r="8.5" stroke="${ICO_SL}" opacity=".25"/><circle cx="24" cy="16" r="4" stroke="${ICO_SL}" opacity=".25"/><path d="M24 4L33 8L36 15L31 25L24 27L16 24L12 16L15 8Z" fill="${g.LD}" fill-opacity=".55" stroke="${ICO_LIME}" stroke-width="1.6"/><path d="M24 8.5L29 11L31 16L27 21L22 21.5L18.5 18L19 12Z" fill="${g.LV}" stroke="none" opacity=".9"/>`,
  radar: g => `<path d="M24 3L42 12.5L38 27.5L10 27.5L6 12.5Z" stroke="${ICO_SL}" opacity=".35"/><path d="M24 9L35 14.4L32.6 23L15.4 23L13 14.4Z" stroke="${ICO_SL}" opacity=".3"/><path d="M24 24V3M24 24L42 12.5M24 24L38 27.5M24 24L10 27.5M24 24L6 12.5" stroke="${ICO_SL}" opacity=".18" stroke-width="1"/><path d="M24 5.5L38 14L30 25L14 21L12 12Z" fill="${g.LD}" fill-opacity=".85" stroke="${ICO_LIME}" stroke-width="1.4"/><path d="M24 11L31 15.2L27 21.5L18 19L17 14Z" fill="${g.LV}" stroke="none" opacity=".9"/>`,
  box: g => `<path d="M4 29H44" stroke="${ICO_SL}" opacity=".3"/>` + [[8, 9, 21, 15, 'S'], [20, 5, 18, 10, 'L'], [32, 11, 24, 17, 'M']].map(([x, t, b, m, k]) => `<path d="M${x + 4} ${t - 2.5}V${b + 5}M${x + 1.2} ${t - 2.5}H${x + 6.8}M${x + 1.2} ${b + 5}H${x + 6.8}" stroke="${k === 'L' ? ICO_LIME : ICO_SL}" opacity=".7"/><rect x="${x}" y="${t + 2.5}" width="8" height="${b - t - 2.5}" rx="2" fill="${k === 'L' ? g.LV : k === 'S' ? g.SV : g.MV}" stroke="none"/><path d="M${x + 1.6} ${m}H${x + 6.4}" stroke="#fff" stroke-width="1.6" opacity=".85"/>`).join(''),
  words: g => [[5, 5, 26, 9, g.LV], [33, 6, 10, 5, g.SV], [6, 17, 11, 5, g.MV], [19, 16, 24, 7, g.SV], [11, 25, 16, 4, g.MV], [30, 25, 12, 4, g.MV]].map(([x, y, w, h, f]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${f}" stroke="none"/>`).join(''),
  bubmap: g => `<path d="${icoMapPath}" fill="${g.MD}" fill-opacity=".5" stroke="${ICO_SL}" opacity=".5"/><circle cx="29" cy="19" r="6.4" fill="${g.LD}" stroke="none"/><circle cx="19" cy="11" r="3.6" fill="${g.SD}" stroke="none"/><circle cx="35" cy="10" r="2.6" fill="${g.MD}" stroke="none"/><circle cx="17" cy="21" r="2.2" fill="${g.SD}" stroke="none" opacity=".8"/>`,
  isomap: g => `<path d="${icoMapPath}" fill="${g.MD}" fill-opacity=".45" stroke="${ICO_SL}" opacity=".45"/><path d="M16 15C18 8 28 7 32 12S36 22 28 24S14 22 16 15Z" fill="${g.SD}" fill-opacity=".3" stroke="${ICO_SL}" opacity=".7"/><path d="M19.5 15C21 11 27 11 29.5 14S31 20 26.5 20.5S18.5 19 19.5 15Z" fill="${g.LD}" stroke="${ICO_LIME}" stroke-width="1.2"/><circle cx="25" cy="16.5" r="1.4" fill="#fff" stroke="none" opacity=".8"/>`,
  bars: g => `<path d="M3 28.5H45" stroke="${ICO_SL}" opacity=".35"/>` + [[5, 11, g.MV], [13, 18, g.SV], [21, 14, g.MV], [29, 24, g.LV], [37, 9, g.SV]].map(([x, h, f]) => `<rect x="${x}" y="${28 - h}" width="6.2" height="${h}" rx="1.8" fill="${f}" stroke="none"/>`).join(''),
  hbars: g => [[4.5, 33, g.SD], [10.5, 40, g.LD], [16.5, 25, g.SD], [22.5, 14, g.MD]].map(([y, w, f], i) => `<rect x="5.5" y="${y}" width="40" height="4.8" rx="2.4" fill="${g.MD}" opacity=".35" stroke="none"/><rect x="5.5" y="${y}" width="${w}" height="4.8" rx="2.4" fill="${f}" stroke="none"/>`).join(''),
  stacked100: g => [4, 14, 24, 34].map((x, i) => { const a = [9, 14, 6, 11][i], b = [11, 8, 13, 9][i], c = 25 - a - b; return `<rect x="${x}" y="3.5" width="8.5" height="${a}" rx="2" fill="${g.MV}" stroke="none"/><rect x="${x}" y="${3.5 + a + 0.9}" width="8.5" height="${b - 0.9}" rx="1.4" fill="${g.LV}" stroke="none"/><rect x="${x}" y="${3.5 + a + b + 0.9}" width="8.5" height="${c - 0.9}" rx="2" fill="${g.SV}" stroke="none"/>`; }).join(''),
  treemap: g => `<rect x="3" y="3" width="24" height="26" rx="3" fill="${g.LD}" stroke="none"/><rect x="29.5" y="3" width="15.5" height="13" rx="3" fill="${g.SD}" stroke="none"/><rect x="29.5" y="18.5" width="8.5" height="10.5" rx="3" fill="${g.MD}" stroke="none"/><rect x="40" y="18.5" width="5" height="10.5" rx="2.4" fill="${g.MD}" stroke="none" opacity=".6"/>`,
  race: g => [[4, 36, g.LD], [11, 27, g.SD], [18, 17, g.MD]].map(([y, w, f]) => `<rect x="4" y="${y}" width="${w}" height="5.6" rx="2.8" fill="${f}" stroke="none"/>`).join('') + `<path d="M42 27V15M38.5 18.5L42 15L45.5 18.5" stroke="${ICO_SL}" opacity=".7"/>`,
  line: g => icoAx.replace('<path', `<path stroke="${ICO_SL}"`) + `<path d="M6 23L14 14L22 19L30 8L38 13L44 5.5" stroke="${ICO_SL}" stroke-width="1.8" opacity=".75"/>` + [[6, 23, 'L'], [14, 14, 'S'], [22, 19, 'L'], [30, 8, 'S'], [38, 13, 'S'], [44, 5.5, 'L']].map(([x, y, k]) => `<circle cx="${x}" cy="${y}" r="${k === 'L' ? 2.6 : 2.2}" fill="${k === 'L' ? g.LD : g.SD}" stroke="none"/>`).join(''),
  area: g => `<path d="M4 28.5H45" stroke="${ICO_SL}" opacity=".3"/><path d="M5 22L13 13L21 18L29 7L37 12L44 6V28.5H5Z" fill="${g.SV}" stroke="none" opacity=".55"/><path d="M5 22L13 13L21 18L29 7L37 12L44 6" stroke="${ICO_LIME}" stroke-width="2.2"/>`,
  calendar: g => { const hot = new Set(['2-1', '3-1', '3-2', '6-0', '5-3']); let r = ''; for (let c = 0; c < 9; c++) for (let w = 0; w < 4; w++) { const k = c + '-' + w, v = (c * 7 + w * 13) % 6; r += `<rect x="${3.4 + c * 4.6}" y="${4.4 + w * 6.6}" width="3.8" height="5" rx="1.4" fill="${hot.has(k) ? g.LV : v > 3 ? g.SV : g.MV}" stroke="none" opacity="${hot.has(k) ? 1 : ICO_F(0.45 + v / 14)}"/>`; } return r; },
  scatter: g => icoAx.replace('<path', `<path stroke="${ICO_SL}"`) + [[9, 23, 'M'], [13, 17, 'S'], [16, 25, 'M'], [20, 13, 'S'], [24, 19, 'M'], [28, 9, 'L'], [32, 16, 'L'], [36, 8, 'L'], [40, 14, 'L'], [19, 21, 'S'], [30, 22, 'M']].map(([x, y, k]) => `<circle cx="${x}" cy="${y}" r="${k === 'L' ? 2.4 : 1.8}" fill="${k === 'L' ? g.LD : k === 'S' ? g.SD : g.MD}" stroke="none"/>`).join(''),
  bubble: g => icoAx.replace('<path', `<path stroke="${ICO_SL}"`) + `<circle cx="15" cy="18" r="8" fill="${g.LD}" stroke="none" opacity=".95"/><circle cx="31" cy="11" r="5.4" fill="${g.SD}" stroke="none"/><circle cx="38" cy="22" r="3.8" fill="${g.MD}" stroke="none"/><circle cx="26" cy="24" r="2.2" fill="${g.SD}" stroke="none" opacity=".7"/>`,
  kpi: g => `<rect x="4" y="4" width="40" height="24" rx="4" fill="${g.MD}" fill-opacity=".35" stroke="${ICO_SL}" opacity=".8"/><rect x="9" y="9" width="14" height="5.6" rx="2.8" fill="${g.SV}" stroke="none"/><rect x="9" y="16.5" width="8" height="2.8" rx="1.4" fill="${g.MV}" stroke="none"/><path d="M22 24L28 20L33 22L38.5 15" stroke="${ICO_LIME}" stroke-width="2"/><circle cx="38.5" cy="15" r="2.3" fill="${g.LD}" stroke="none"/>`,
};
function chartIcon(id) {
  const f = CHART_ICONS[id]; if (!f) return '';
  const n = ++ICO_N, g = icoGrads(n);
  return `<svg class="cico" viewBox="0 0 48 32" width="48" height="32" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${g.defs}${f(g)}</svg>`;
}
