/* Datavix: visões que não passam pelo Vizzu: heatmap de calendário e cartões de indicadores (KPI).
 * Compartilhado entre o editor, o HTML exportado e o PNG. */

const DOM_TYPES = new Set(['organism', 'rays', 'river', 'fan', 'ridge', 'flow', 'pie', 'donut', 'pies', 'donuts', 'packed', 'cols', 'lines', 'radial', 'radar', 'box', 'words', 'bubmap', 'isomap', 'calendar', 'kpi']);

/* ---------- calendário: o desenho é uma lista de formas, usada em SVG (tela) e canvas (PNG) ---------- */
function calLayout(P, W, o = {}) {
  const cal = P.built.cal;
  if (!cal) return null;
  const base = bgBase(P.bg), fg = readableOn(base), accent = P.colors[0], muted = mixHex(fg, base, 0.4);
  const faint = mixHex(base, fg, 0.1), MS = LANG === 'en' ? MONTHS_EN : MONTHS_PT, wd = T('wd').split(' ');
  const years = [...new Set(cal.days.map(d => new Date(d[0]).getUTCFullYear()))].sort();
  const left = 30, gap = 2, cell = Math.max(7, Math.min(o.maxCell || 22, Math.floor((W - left - 6) / 54) - gap)), step = cell + gap;
  const range = cal.max - cal.min || 1, byDay = new Map(cal.days.map(d => [d[0], d])), shapes = [];
  let y = 0;
  for (const yr of years) {
    shapes.push({ k: 'text', x: 0, y, t: String(yr), size: 15, fill: fg, w: 600 });
    const top = y + 34, jan1 = Date.UTC(yr, 0, 1), off = (new Date(jan1).getUTCDay() + 6) % 7, nDays = (Date.UTC(yr + 1, 0, 1) - jan1) / DAY;
    [0, 2, 4].forEach(r => shapes.push({ k: 'text', x: 0, y: top + r * step + cell * 0.82, t: wd[r], size: 11, fill: muted }));
    let lastMonth = -1;
    for (let d = 0; d < nDays; d++) {
      const t = jan1 + d * DAY, wk = Math.floor((d + off) / 7), r = (d + off) % 7, dt = new Date(t), mo = dt.getUTCMonth();
      if (mo !== lastMonth) { lastMonth = mo; shapes.push({ k: 'text', x: left + wk * step, y: top - 14, t: MS[mo], size: 12, fill: muted }); }
      if (t < cal.t0 || t > cal.t1) continue;
      const rec = byDay.get(t);
      const fill = rec ? mixHex(mixHex(base, fg, 0.1), accent, 0.22 + 0.78 * Math.pow((rec[1] - cal.min) / range, 0.6)) : faint;
      shapes.push({ k: 'rect', x: left + wk * step, y: top + r * step, w: cell, h: cell, fill, rx: 2, wk, rec: rec || null });
    }
    y = top + 7 * step + 26;
  }
  // legenda
  const lx = left, ly = y + 2;
  shapes.push({ k: 'text', x: lx, y: ly, t: T('cal_less'), size: 11, fill: muted });
  const lw = (LANG === 'en' ? 28 : 40);
  for (let i = 0; i < 5; i++) shapes.push({ k: 'rect', x: lx + lw + i * (cell + gap), y: ly - 1, w: cell, h: cell, fill: mixHex(mixHex(base, fg, 0.1), accent, 0.22 + 0.78 * Math.pow(i / 4, 0.6)), rx: 2, wk: 0, rec: null });
  shapes.push({ k: 'text', x: lx + lw + 5 * (cell + gap) + 6, y: ly, t: T('cal_more'), size: 11, fill: muted });
  return { shapes, height: ly + 22, width: left + 54 * step };
}
function calSvg(P, W) {
  const lay = calLayout(P, W); if (!lay) return `<div class="noins">${T('cal_none')}</div>`;
  const f = fontsOf(P).body.replace(/"/g, "'");
  const body = lay.shapes.map(sh => sh.k === 'rect'
    ? `<rect class="calcell" x="${sh.x}" y="${sh.y}" width="${sh.w}" height="${sh.h}" rx="${sh.rx}" fill="${sh.fill}" style="animation-delay:${sh.wk * 16}ms"${sh.rec ? ` data-d="${sh.rec[0]}|${sh.rec[1]}|${sh.rec[2]}"` : ''}/>`
    : `<text x="${sh.x}" y="${sh.y}" font-size="${sh.size}" fill="${sh.fill}" font-weight="${sh.w || 400}" font-family="${f}" dominant-baseline="hanging">${esc(sh.t)}</text>`).join('');
  return `<svg class="calsvg" viewBox="0 0 ${lay.width} ${lay.height}" width="${lay.width}" height="${lay.height}" role="img" aria-label="${esc(titleOf(P))}">${body}</svg>`;
}
function renderCalendar(P, el) {
  el.innerHTML = calSvg(P, el.clientWidth || 800);
  const svg = el.querySelector('svg'), card = (el.closest('.piece') || {})._card;
  if (!svg) return;
  const fmtDay = t => { const d = new Date(+t), P2 = n => String(n).padStart(2, '0'); return LANG === 'en' ? `${d.getUTCFullYear()}-${P2(d.getUTCMonth() + 1)}-${P2(d.getUTCDate())}` : `${P2(d.getUTCDate())}/${P2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`; };
  const mk = (t, v, n) => ({ key: t, kick: T('chart').calendar, title: fmtDay(t), value: fmtNum(+v, P.built.unit, LANG), vlabel: P.built.names.y || '', left: [[T('org_rows'), fmtInt(+n, LANG)]], texts: [] });
  const model = c => { const [t, v, n] = c.dataset.d.split('|'); return mk(t, v, n); };
  const list = (el.closest('.piece') || {})._list, days = new Map(P.built.cal.days.map(d => [String(d[0]), d]));
  const mark = t => { svg.querySelectorAll('.calcell.hot').forEach(x => x.classList.remove('hot')); if (t) { const c = svg.querySelector(`[data-d^="${t}|"]`); if (c) c.classList.add('hot'); } };
  if (list && card) {
    list.reset(); card.onUnpin = () => { list.sel(null, false); mark(null); };
    list.setItems(P.built.cal.days.map(d => ({ id: String(d[0]), title: fmtDay(d[0]), sub: `${fmtInt(d[2], LANG)} ${T('org_rows')}`, val: fmtNum(d[1], P.built.unit, LANG), v: d[1], ord: d[0] })), { sorts: ['v', 'o'], sort: 'v' });
    list.onHover = id => { const d = days.get(id); if (d) { card.over(mk(d[0], d[1], d[2])); mark(id); } }; list.onLeave = () => { card.out(); mark(null); };
    list.onPick = id => { const d = days.get(id); if (d) { card.pin(mk(d[0], d[1], d[2])); list.sel(id, false); mark(id); } };
  }
  svg.addEventListener('mousemove', e => { const c = e.target.closest('[data-d]'); if (!card) return; if (c) { card.over(model(c)); if (list && !card.isPinned()) list.hot(c.dataset.d.split('|')[0]); } else { card.out(); if (list && !card.isPinned()) list.hot(null, false); } });
  svg.addEventListener('mouseleave', () => { if (card) card.out(); if (list && card && !card.isPinned()) list.hot(null, false); });
  svg.addEventListener('click', e => { const c = e.target.closest('[data-d]'); if (!card) return; if (c) { card.pin(model(c)); if (list) list.sel(c.dataset.d.split('|')[0], true); mark(c.dataset.d.split('|')[0]); } else { card.unpin(); mark(null); } });
}
function fillRound(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); ctx.fill(); }
function drawShapes(ctx, lay, ox, oy, s, font) {
  ctx.textBaseline = 'top';
  for (const sh of lay.shapes) {
    if (sh.k === 'rect') { ctx.fillStyle = sh.fill; fillRound(ctx, ox + sh.x * s, oy + sh.y * s, sh.w * s, sh.h * s, sh.rx * s); }
    else { ctx.fillStyle = sh.fill; ctx.font = `${sh.w || 400} ${sh.size * s}px ${font}`; ctx.fillText(sh.t, ox + sh.x * s, oy + sh.y * s); }
  }
}

/* ---------- indicadores (KPI) ---------- */
function kpiFmt(c) { return c.raw !== undefined ? c.value.toFixed(c.raw).replace('.', LANG === 'pt' ? ',' : '.') : fmtNum(c.value, c.unit, LANG); }
function countUp(el, c) {
  const end = c.value, t0 = performance.now(), ms = RM ? 0 : 1300;
  const fmt = v => (c.raw !== undefined ? kpiFmt({ ...c, value: v }) : fmtNum(v, c.unit, LANG));
  if (!ms) { el.textContent = kpiFmt(c); return; }
  el.textContent = fmt(0);
  (function tick(now) {
    const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3);
    el.textContent = p < 1 ? fmt(end * e) : kpiFmt(c);
    if (p < 1) requestAnimationFrame(tick);
  })(performance.now());
  setTimeout(() => { el.textContent = kpiFmt(c); }, ms + 150); // aba em segundo plano pausa a animação: garante o valor final
}
function renderKpi(P, el) {
  const cards = kpiCards(P.built, LANG, T);
  el.innerHTML = `<div class="kpis">${cards.map((c, i) => `<div class="kpi${c.series ? ' ser' : ''}" style="--i:${i}"><div class="kl">${esc(c.label)}</div><div class="kv" data-i="${i}">${esc(kpiFmt(c))}</div>${c.delta != null ? `<div class="kd ${c.delta >= 0 ? 'up' : 'dn'}">${c.delta >= 0 ? '▲' : '▼'} ${esc(fmtPct(c.delta, LANG))}</div>` : ''}<div class="ks">${esc(c.sub || '')}</div></div>`).join('')}</div>`;
  const card = (el.closest('.piece') || {})._card, kmodel = i => { const c = cards[i]; return { key: 'k' + i, kick: T('chart').kpi, title: c.label, value: kpiFmt(c), vlabel: '', left: [...(c.delta != null ? [[T('card_change'), (c.delta >= 0 ? '▲ ' : '▼ ') + fmtPct(c.delta, LANG)]] : []), ...(c.sub ? [[T('card_note'), String(c.sub)]] : [])], texts: [] }; };
  const klist = (el.closest('.piece') || {})._list, kEls = () => [...el.querySelectorAll('.kpi')], kmark = i => kEls().forEach((k, j) => k.classList.toggle('hot', j === i));
  if (klist && card) {
    klist.reset(); card.onUnpin = () => { klist.sel(null, false); kmark(-1); };
    klist.setItems(cards.map((c, i) => ({ id: i, title: c.label, sub: c.sub ? String(c.sub) : '', val: kpiFmt(c), v: Math.abs(c.value) || 0, ord: i })), { sorts: ['o'], sort: 'o' });
    klist.onHover = i => { card.over(kmodel(i)); kmark(i); }; klist.onLeave = () => { card.out(); kmark(-1); }; klist.onPick = i => { card.pin(kmodel(i)); klist.sel(i, false); kmark(i); };
  }
  if (card) { el.addEventListener('mouseover', e => { const k = e.target.closest('.kpi'); if (k) card.over(kmodel([...el.querySelectorAll('.kpi')].indexOf(k))); }); el.addEventListener('mouseleave', () => card.out()); el.addEventListener('click', e => { const k = e.target.closest('.kpi'); if (k) card.pin(kmodel([...el.querySelectorAll('.kpi')].indexOf(k))); else card.unpin(); }); }
  el.querySelectorAll('.kv').forEach(k => {
    let fs = parseFloat(getComputedStyle(k).fontSize);
    while (k.scrollWidth > k.parentElement.clientWidth - 40 && fs > 16) { fs *= 0.93; k.style.fontSize = fs + 'px'; }
    countUp(k, cards[+k.dataset.i]);
  });
}
function drawKpi(ctx, P, x, y, w, h, s, font) {
  const cards = kpiCards(P.built, LANG, T), base = bgBase(P.bg), fg = readableOn(base), muted = mixHex(fg, base, 0.45), line = mixHex(fg, base, 0.82);
  const n = cards.length, cols = n <= 4 ? n : 4, rows = Math.ceil(n / cols), gap = 22 * s, cw = (w - gap * (cols - 1)) / cols, ch = Math.min(h / rows - gap, 260 * s);
  cards.forEach((c, i) => {
    const cx = x + (i % cols) * (cw + gap), cy = y + Math.floor(i / cols) * (ch + gap);
    ctx.strokeStyle = line; ctx.lineWidth = 2 * s; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(cx, cy, cw, ch, 8 * s); else ctx.rect(cx, cy, cw, ch); ctx.stroke();
    ctx.textBaseline = 'top'; ctx.fillStyle = muted; ctx.font = `500 ${15 * s}px ${font}`; ctx.fillText(c.label.toUpperCase(), cx + 22 * s, cy + 20 * s);
    const txt = kpiFmt(c); let fs = 76 * s;
    ctx.font = `700 ${fs}px Doto, 'Geist Mono', monospace`;
    while (ctx.measureText(txt).width > cw - 44 * s && fs > 18 * s) { fs *= 0.94; ctx.font = `700 ${fs}px Doto, 'Geist Mono', monospace`; }
    ctx.fillStyle = fg; ctx.fillText(txt, cx + 22 * s, cy + 52 * s);
    if (c.delta != null) { ctx.fillStyle = c.delta >= 0 ? '#2e9d5b' : '#d9534f'; ctx.font = `600 ${20 * s}px ${font}`; ctx.fillText(`${c.delta >= 0 ? '▲' : '▼'} ${fmtPct(c.delta, LANG)}`, cx + 22 * s, cy + 140 * s); }
    ctx.fillStyle = muted; ctx.font = `400 ${17 * s}px ${font}`; ctx.fillText(String(c.sub || ''), cx + 22 * s, cy + ch - 38 * s);
  });
}

function renderAlt(P, el) {
  if (el._org) { el._org.destroy(); el._org = null; }
  if (P.type === 'organism') renderOrganism(P, el);
  else if (CHART_REG[P.type]) CHART_REG[P.type].render(P, el);
  else if (P.type === 'calendar') renderCalendar(P, el); else renderKpi(P, el);
}
