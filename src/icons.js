/* Datavix: ícones dos gráficos (SVG 48×32, traço fino, herdam a cor do texto). Um por tipo de gráfico de ALL_CHARTS. */
const ICO_F = n => (Math.round(n * 10) / 10).toString();
function icoRadial(branches, leaves, hubR, leafR) {
  let d = '', dots = '';
  for (let i = 0; i < branches; i++) {
    const a = (i / branches) * Math.PI * 2 - Math.PI / 2, hx = 24 + Math.cos(a) * hubR, hy = 16 + Math.sin(a) * hubR;
    d += `M24 16L${ICO_F(hx)} ${ICO_F(hy)}`; dots += `<circle cx="${ICO_F(hx)}" cy="${ICO_F(hy)}" r="1.4" fill="currentColor" stroke="none"/>`;
    for (let k = 0; k < leaves; k++) {
      const b = a + (k - (leaves - 1) / 2) * 0.42, lx = 24 + Math.cos(b) * leafR, ly = 16 + Math.sin(b) * leafR;
      d += `M${ICO_F(hx)} ${ICO_F(hy)}L${ICO_F(lx)} ${ICO_F(ly)}`; dots += `<circle cx="${ICO_F(lx)}" cy="${ICO_F(ly)}" r="1.1" fill="currentColor" stroke="none" opacity=".7"/>`;
    }
  }
  return `<path d="${d}" opacity=".7"/>${dots}<circle cx="24" cy="16" r="2.2" fill="currentColor" stroke="none"/>`;
}
function icoRays() {
  const len = [12, 8, 13, 6, 10, 14, 7, 11, 9, 13, 6, 12, 8, 10];
  let d = '', dots = '';
  len.forEach((l, i) => { const a = (i / len.length) * Math.PI * 2 - Math.PI / 2, x0 = 24 + Math.cos(a) * 4, y0 = 16 + Math.sin(a) * 4, x1 = 24 + Math.cos(a) * (4 + l * 0.9), y1 = 16 + Math.sin(a) * (4 + l * 0.9); d += `M${ICO_F(x0)} ${ICO_F(y0)}L${ICO_F(x1)} ${ICO_F(y1)}`; dots += `<circle cx="${ICO_F(x1)}" cy="${ICO_F(y1)}" r="1.1" fill="currentColor" stroke="none"/>`; });
  return `<path d="${d}" opacity=".7"/>${dots}<circle cx="24" cy="16" r="2" fill="currentColor" stroke="none"/>`;
}
function icoCalendar() {
  let r = '';
  for (let c = 0; c < 8; c++) for (let w = 0; w < 4; w++) r += `<rect x="${5 + c * 5.2}" y="${4.5 + w * 6.6}" width="4" height="4.6" rx="1" fill="currentColor" stroke="none" opacity="${ICO_F(0.14 + ((c * 7 + w * 13) % 6) / 7)}"/>`;
  return r;
}
const CHART_ICONS = {
  organism: () => icoRadial(6, 3, 6.4, 13),
  rays: icoRays,
  river: () => '<path d="M10 4C6 11 14 14 10 20S12 26 10 28" stroke-width="4" opacity=".5"/><path d="M24 4C28 10 20 15 24 21S22 26 24 28" stroke-width="6" opacity=".85"/><path d="M38 4C34 11 41 14 38 20S40 26 38 28" stroke-width="3" opacity=".6"/>',
  fan: () => '<path d="M30 3V29" opacity=".8"/><path d="M30 7H16M30 11H21M30 15H12M30 19H24M30 23H17" stroke-width="2.4" opacity=".85"/><path d="M30 7L43 3M30 11L43 9M30 15L43 15M30 19L43 21M30 23L43 27" stroke-width="1.1" opacity=".55"/>',
  ridge: () => [3, 2, 1, 0].map(k => { const y = 12 + k * 5.4, sx = k * 2.4; return `<path d="M${3 + sx} ${y}L${9 + sx} ${y - 5}L${14 + sx} ${y - 1}L${20 + sx} ${y - 8}L${26 + sx} ${y - 2}L${32 + sx} ${y - 5}L${38 + sx} ${y}Z" fill="var(--card, transparent)" opacity="${ICO_F(0.5 + (3 - k) * 0.17)}"/>`; }).join(''),
  flow: () => '<path d="M8 6C15 6 15 9 22 9V23C15 23 15 26 8 26Z" fill="currentColor" stroke="none" opacity=".3"/><path d="M26 9C33 9 33 12 40 12V20C33 20 33 23 26 23Z" fill="currentColor" stroke="none" opacity=".45"/><rect x="4" y="6" width="4" height="20" rx="1" fill="currentColor" stroke="none"/><rect x="22" y="9" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="40" y="12" width="4" height="8" rx="1" fill="currentColor" stroke="none"/>',
  bars: () => '<path d="M3 28.5H45" opacity=".6"/>' + [[5, 12], [13, 20], [21, 15], [29, 24], [37, 9]].map(([x, h]) => `<rect x="${x}" y="${28 - h}" width="6" height="${h}" rx="1" fill="currentColor" stroke="none" opacity=".85"/>`).join(''),
  hbars: () => '<path d="M3.5 3V29" opacity=".6"/>' + [[4, 36], [10, 28], [16, 22], [22, 14]].map(([y, w]) => `<rect x="5" y="${y}" width="${w}" height="4.4" rx="1" fill="currentColor" stroke="none" opacity=".85"/>`).join(''),
  stacked100: () => [4, 14, 24, 34].map((x, i) => { const a = [10, 16, 7, 12][i], b = [10, 8, 12, 9][i]; return `<rect x="${x}" y="3" width="8" height="${a}" rx="1" fill="currentColor" stroke="none" opacity=".9"/><rect x="${x}" y="${3 + a}" width="8" height="${b}" fill="currentColor" stroke="none" opacity=".55"/><rect x="${x}" y="${3 + a + b}" width="8" height="${26 - a - b}" rx="1" fill="currentColor" stroke="none" opacity=".25"/>`; }).join(''),
  treemap: () => '<rect x="3" y="3" width="24" height="26" rx="1.5" fill="currentColor" stroke="none" opacity=".75"/><rect x="29.5" y="3" width="15.5" height="13" rx="1.5" fill="currentColor" stroke="none" opacity=".5"/><rect x="29.5" y="18.5" width="8.5" height="10.5" rx="1.5" fill="currentColor" stroke="none" opacity=".35"/><rect x="40" y="18.5" width="5" height="10.5" rx="1.5" fill="currentColor" stroke="none" opacity=".6"/>',
  race: () => [[5, 34], [12, 26], [19, 17]].map(([y, w]) => `<rect x="4" y="${y}" width="${w}" height="5" rx="1" fill="currentColor" stroke="none" opacity="${w > 30 ? 0.9 : w > 20 ? 0.6 : 0.35}"/>`).join('') + '<path d="M42 26V12M38.5 15.5L42 12L45.5 15.5"/>',
  line: () => '<path d="M4 4V28H45" opacity=".5"/><path d="M6 23L14 14L22 19L30 8L38 13L44 6" stroke-width="2"/>' + [[6, 23], [14, 14], [22, 19], [30, 8], [38, 13], [44, 6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="var(--card, #000)"/>`).join(''),
  area: () => '<path d="M4 28H45" opacity=".5"/><path d="M5 22L13 13L21 18L29 7L37 12L44 6V28H5Z" fill="currentColor" stroke="none" opacity=".28"/><path d="M5 22L13 13L21 18L29 7L37 12L44 6" stroke-width="2"/>',
  calendar: icoCalendar,
  scatter: () => '<path d="M4 4V28H45" opacity=".5"/>' + [[9, 23], [13, 17], [16, 25], [20, 13], [24, 19], [28, 9], [32, 16], [36, 8], [40, 14], [19, 21], [30, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="currentColor" stroke="none" opacity=".85"/>`).join(''),
  bubble: () => '<circle cx="14" cy="18" r="8" fill="currentColor" stroke="none" opacity=".3"/><circle cx="14" cy="18" r="8"/><circle cx="31" cy="11" r="5.5" fill="currentColor" stroke="none" opacity=".5"/><circle cx="37" cy="23" r="4" fill="currentColor" stroke="none" opacity=".8"/><circle cx="25" cy="25" r="2.4" fill="currentColor" stroke="none"/>',
  kpi: () => '<rect x="4" y="4" width="40" height="24" rx="3" opacity=".7"/><rect x="9" y="9" width="13" height="5" rx="1.2" fill="currentColor" stroke="none"/><path d="M9 24L16 20L22 22L30 16L39 12" opacity=".8"/>',
};
function chartIcon(id) {
  const f = CHART_ICONS[id]; if (!f) return '';
  return `<svg class="cico" viewBox="0 0 48 32" width="48" height="32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${f()}</svg>`;
}
