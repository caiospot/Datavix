(() => {
  'use strict';

  const SAMPLE = `mes,regiao,produto,receita,pedidos
Jan,Sul,Alpha,12400,120
Jan,Norte,Alpha,9800,95
Jan,Sudeste,Beta,21300,210
Fev,Sul,Alpha,13100,128
Fev,Norte,Beta,10250,101
Fev,Sudeste,Beta,22800,222
Mar,Sul,Gamma,15600,150
Mar,Norte,Alpha,11050,108
Mar,Sudeste,Gamma,25400,244
Abr,Sul,Gamma,16200,158
Abr,Norte,Beta,11900,117
Abr,Sudeste,Alpha,24100,231
Mai,Sul,Beta,17050,166
Mai,Norte,Gamma,12700,124
Mai,Sudeste,Gamma,27300,259
Jun,Sul,Alpha,18400,176
Jun,Norte,Gamma,13500,131
Jun,Sudeste,Beta,28900,276`;

  const $ = (id) => document.getElementById(id);
  const COLORS = Array.from({ length: 8 }, (_, i) => `var(--c${i + 1})`);
  const NS = 'http://www.w3.org/2000/svg';
  const state = { headers: [], rows: [], numeric: [] };

  // ---------- CSV ----------
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const first = text.split(/\r?\n/, 1)[0];
    const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
    const out = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.some((v) => v !== '')) out.push(row);
        row = [];
      } else cell += c;
    }
    row.push(cell);
    if (row.some((v) => v !== '')) out.push(row);
    return out;
  }

  const toNum = (v) => {
    if (v == null || v === '') return NaN;
    const s = String(v).trim().replace(/\s/g, '');
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    if (/^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(s) || /^-?\d+,\d+$/.test(s)) return Number(s.replace(/\./g, '').replace(',', '.'));
    return NaN;
  };

  function load(text) {
    const grid = parseCSV(text);
    if (grid.length < 2) return alert('CSV vazio ou sem linhas de dados.');
    const headers = grid[0].map((h, i) => h.trim() || `coluna_${i + 1}`);
    const rows = grid.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
    const numeric = headers.filter((h) => {
      const vals = rows.map((r) => r[h]).filter((v) => v !== '');
      return vals.length && vals.every((v) => !isNaN(toNum(v)));
    });
    Object.assign(state, { headers, rows, numeric });
    fillSelect($('xcol'), headers, headers.find((h) => !numeric.includes(h)) || headers[0]);
    fillSelect($('ycol'), numeric.length ? numeric : headers, (numeric[0] || headers[0]));
    $('agg').value = numeric.length ? 'sum' : 'count';
    renderAll();
  }

  function fillSelect(sel, opts, value) {
    sel.replaceChildren(...opts.map((o) => new Option(o, o)));
    sel.value = value;
  }

  // ---------- aggregation ----------
  function aggregate() {
    const x = $('xcol').value, y = $('ycol').value, agg = $('agg').value;
    const groups = new Map();
    for (const r of state.rows) {
      const k = r[x] === '' ? '(vazio)' : r[x];
      if (!groups.has(k)) groups.set(k, []);
      const n = toNum(r[y]);
      groups.get(k).push(n);
    }
    const fn = {
      sum: (a) => a.filter((n) => !isNaN(n)).reduce((s, n) => s + n, 0),
      avg: (a) => { const b = a.filter((n) => !isNaN(n)); return b.length ? b.reduce((s, n) => s + n, 0) / b.length : 0; },
      count: (a) => a.length,
      max: (a) => Math.max(...a.filter((n) => !isNaN(n))),
      min: (a) => Math.min(...a.filter((n) => !isNaN(n))),
    }[agg];
    let data = [...groups].map(([label, vals]) => ({ label, value: fn(vals) })).filter((d) => isFinite(d.value));
    if (!state.rows.every((r) => !isNaN(toNum(r[x])))) return data;
    return data.sort((a, b) => toNum(a.label) - toNum(b.label)); // numeric X: order naturally
  }

  const fmt = (n) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n);
  const short = (n) => new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

  // ---------- svg helpers ----------
  function el(name, attrs = {}, text) {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text != null) e.textContent = text;
    return e;
  }

  const tip = () => $('tip');
  function bindTip(node, html) {
    node.addEventListener('mousemove', (e) => {
      const t = tip(); t.hidden = false; t.textContent = html;
      t.style.left = e.clientX + 12 + 'px'; t.style.top = e.clientY + 12 + 'px';
    });
    node.addEventListener('mouseleave', () => (tip().hidden = true));
  }

  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const f = v / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }

  // ---------- charts ----------
  function drawAxes(svg, W, H, m, max, ticks = 5) {
    for (let i = 0; i <= ticks; i++) {
      const v = (max / ticks) * i, y = H - m.b - ((H - m.t - m.b) * i) / ticks;
      svg.append(el('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: 'grid' }));
      svg.append(el('text', { x: m.l - 6, y: y + 4, 'text-anchor': 'end' }, short(v)));
    }
  }

  function bar(svg, data, W, H, label) {
    const m = { l: 52, r: 12, t: 12, b: 56 };
    const max = niceMax(Math.max(...data.map((d) => d.value), 0));
    drawAxes(svg, W, H, m, max);
    const bw = (W - m.l - m.r) / data.length;
    data.forEach((d, i) => {
      const h = ((H - m.t - m.b) * Math.max(d.value, 0)) / max;
      const x = m.l + i * bw + bw * 0.12, w = bw * 0.76;
      const r = el('rect', { x, y: H - m.b - h, width: w, height: h, rx: 3, fill: COLORS[0], class: 'hit' });
      bindTip(r, `${d.label}: ${fmt(d.value)}`);
      svg.append(r);
      const t = el('text', { x: x + w / 2, y: H - m.b + 16, 'text-anchor': data.length > 8 ? 'end' : 'middle',
        transform: data.length > 8 ? `rotate(-35 ${x + w / 2} ${H - m.b + 16})` : '' }, d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label);
      svg.append(t);
    });
  }

  function line(svg, data, W, H) {
    const m = { l: 52, r: 16, t: 12, b: 56 };
    const max = niceMax(Math.max(...data.map((d) => d.value), 0));
    drawAxes(svg, W, H, m, max);
    const step = data.length > 1 ? (W - m.l - m.r) / (data.length - 1) : 0;
    const pts = data.map((d, i) => [data.length > 1 ? m.l + i * step : (m.l + W - m.r) / 2, H - m.b - ((H - m.t - m.b) * Math.max(d.value, 0)) / max]);
    svg.append(el('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: COLORS[0], 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    pts.forEach(([x, y], i) => {
      const c = el('circle', { cx: x, cy: y, r: 5, fill: COLORS[0], class: 'hit' });
      bindTip(c, `${data[i].label}: ${fmt(data[i].value)}`);
      svg.append(c);
      svg.append(el('text', { x, y: H - m.b + 16, 'text-anchor': data.length > 8 ? 'end' : 'middle',
        transform: data.length > 8 ? `rotate(-35 ${x} ${H - m.b + 16})` : '' }, data[i].label.length > 14 ? data[i].label.slice(0, 13) + '…' : data[i].label));
    });
  }

  function donut(svg, data, W, H, host) {
    const pos = data.filter((d) => d.value > 0);
    const total = pos.reduce((s, d) => s + d.value, 0);
    if (!total) return;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 16, r = R * 0.58;
    let a0 = -Math.PI / 2;
    pos.forEach((d, i) => {
      const a1 = a0 + (d.value / total) * Math.PI * 2 - (pos.length > 1 ? 0.01 : 0);
      const big = a1 - a0 > Math.PI ? 1 : 0;
      const P = (rad, a) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
      const [x0, y0] = P(R, a0), [x1, y1] = P(R, a1), [x2, y2] = P(r, a1), [x3, y3] = P(r, a0);
      const path = el('path', { d: `M${x0} ${y0}A${R} ${R} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r} ${r} 0 ${big} 0 ${x3} ${y3}Z`, fill: COLORS[i % COLORS.length], class: 'hit' });
      bindTip(path, `${d.label}: ${fmt(d.value)} (${((d.value / total) * 100).toFixed(1)}%)`);
      svg.append(path);
      a0 += (d.value / total) * Math.PI * 2;
    });
    svg.append(el('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', style: 'font-size:18px;font-weight:700;fill:var(--ink)' }, short(total)));
    const lg = document.createElement('div');
    lg.className = 'legend';
    pos.forEach((d, i) => {
      const s = document.createElement('span');
      const sw = document.createElement('i'); sw.style.background = COLORS[i % COLORS.length];
      s.append(sw, d.label);
      lg.append(s);
    });
    host.append(lg);
  }

  // ---------- render ----------
  function renderChart() {
    const host = $('chart');
    host.replaceChildren();
    const data = aggregate();
    if (!data.length) { host.innerHTML = '<div class="empty">Sem dados para exibir com essa seleção.</div>'; return; }
    const W = 860, H = $('type').value === 'donut' ? 340 : 360;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}` });
    host.append(svg);
    ({ bar, line, donut }[$('type').value])(svg, data, W, H, host);
  }

  function renderKPIs() {
    const k = $('kpis');
    k.replaceChildren();
    const items = [['Linhas', fmt(state.rows.length)], ['Colunas', fmt(state.headers.length)]];
    for (const h of state.numeric.slice(0, 2)) {
      const sum = state.rows.reduce((s, r) => s + (toNum(r[h]) || 0), 0);
      items.push([`Σ ${h}`, fmt(sum)]);
    }
    for (const [label, value] of items) {
      const d = document.createElement('div'); d.className = 'kpi';
      const s = document.createElement('small'); s.textContent = label;
      const b = document.createElement('b'); b.textContent = value;
      d.append(s, b); k.append(d);
    }
  }

  function renderTable() {
    const t = $('table'), rows = state.rows.slice(0, 200);
    t.replaceChildren();
    const head = t.createTHead().insertRow();
    state.headers.forEach((h) => { const th = document.createElement('th'); th.textContent = h; head.append(th); });
    const body = t.createTBody();
    rows.forEach((r) => { const tr = body.insertRow(); state.headers.forEach((h) => (tr.insertCell().textContent = r[h])); });
    $('meta').textContent = state.rows.length > 200 ? `(primeiras 200 de ${state.rows.length} linhas)` : `(${state.rows.length} linhas)`;
  }

  function renderAll() { renderKPIs(); renderChart(); renderTable(); }

  // ---------- events ----------
  ['type', 'xcol', 'ycol', 'agg'].forEach((id) => $(id).addEventListener('change', renderChart));
  $('sample').addEventListener('click', () => load(SAMPLE));
  $('file').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => load(String(rd.result));
    rd.readAsText(f);
    e.target.value = '';
  });
  $('theme').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
  });

  load(SAMPLE);
})();
