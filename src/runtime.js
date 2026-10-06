/* Datavix: runtime compartilhado entre o editor e o HTML exportado.
 * Vizzu embutido, filtros (série, categoria, zoom no tempo), ordenação e modo apresentação. */

const b64text = id => { const el = document.getElementById(id); return el ? el.textContent.trim() : ''; };
const b64bytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
let _vizzu = null;
async function loadVizzu() {
  if (_vizzu) return _vizzu;
  const jsUrl = URL.createObjectURL(new Blob([b64bytes(b64text('vz-js'))], { type: 'text/javascript' }));
  const wasmUrl = URL.createObjectURL(new Blob([b64bytes(b64text('vz-wasm'))], { type: 'application/wasm' }));
  const mod = await import(jsUrl);
  mod.default.options({ wasmUrl });
  try { await Promise.all(["400 14px 'Geist'", "600 20px 'Geist'", "600 20px 'Lora'", "400 14px 'Geist Mono'", "700 20px 'Doto'"].map(f => document.fonts.load(f))); } catch (e) { /* sem fonte: usa a do sistema */ }
  return (_vizzu = mod.default);
}

/* ---------------- metadados para filtros ---------------- */
const uniq = a => [...new Set(a)];
function makeMeta(P) {
  const b = P.built, n = b.names, ser = b.vz.series;
  const dim = name => { const s = ser.find(x => x.name === name); return s ? s.values : []; };
  const xLabels = uniq(dim(n.x));
  let filterDim = null, filterLabels = null;
  if (n.s) { filterDim = n.s; filterLabels = uniq(dim(n.s)); }
  else if (b.kind === 'category') { filterDim = n.x; filterLabels = xLabels; }
  else if (b.kind === 'relation' && b.colorByEntity) { filterDim = n.e; filterLabels = uniq(dim(n.e)); }
  return {
    xName: n.x, xIsTime: !!b.xIsTime, xLabels, filterDim, filterLabels, hasSeries: !!n.s,
    hasRange: !!b.xIsTime && xLabels.length >= 4, sortable: b.kind === 'category',
  };
}
// função de filtro do Vizzu a partir do estado {sel:Set|null, range:[i0,i1]|null}
function makeFilter(meta, st) {
  const sel = st && st.sel, range = st && st.range;
  if (!sel && !range) return null;
  const idx = range ? new Map(meta.xLabels.map((l, i) => [l, i])) : null;
  const fd = meta.filterDim, xn = meta.xName;
  return rec => {
    if (sel && !sel.has(rec[fd])) return false;
    if (range) { const i = idx.get(rec[xn]); if (i === undefined || i < range[0] || i > range[1]) return false; }
    return true;
  };
}

/* ---------------- interações: chips, zoom, ordenação ---------------- */
function createInteractions(o) {
  const { host } = o, { chart, P, root } = host, meta = makeMeta(P);
  let sel = null, range = null, busy = Promise.resolve();
  // corrida de barras: um quadro por período, filtrado
  const periods = meta.xLabels, canCumul = !!(P.built.names.yc && P.built.aggKind !== 'mean');
  let ri = 0, playing = false, cumul = false;
  const raceFilter = () => { const p = periods[ri]; return rec => rec[meta.xName] === p; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const isRace = () => P.type === 'race', isDom = () => DOM_TYPES.has(P.type);
  const ctrls = root.querySelector('#pctrls');
  const colorOf = l => { const i = meta.filterLabels.indexOf(l); return meta.hasSeries || P.built.colorByEntity ? P.colors[i % P.colors.length] : P.colors[0]; };

  function raceUi() {
    const lab = host.box.querySelector('.racebig'); if (lab) lab.textContent = isRace() ? periods[ri] : '';
    const sl = ctrls && ctrls.querySelector('#rs'); if (sl) sl.value = ri;
    const rl = ctrls && ctrls.querySelector('#rl'); if (rl) rl.textContent = periods[ri];
    if (isRace() && host.listRefresh) host.listRefresh();
  }
  async function raceTo(i, d) {
    ri = Math.max(0, Math.min(periods.length - 1, i)); raceUi();
    try { await chart.animate({ data: { filter: raceFilter() } }, { duration: d, easing: 'linear' }); } catch (e) { console.error(e); }
  }
  async function racePlay() {
    if (playing) { playing = false; render(); return; }
    playing = true;
    if (ri >= periods.length - 1) await raceTo(0, 0);
    render();
    while (playing && isRace() && ri < periods.length - 1) { await raceTo(ri + 1, RM ? 0.01 : 0.6); if (RM) await sleep(250); }
    playing = false; render();
  }
  function raceStart() { playing = false; raceTo(0, 0).then(() => { render(); if (!RM) setTimeout(() => { if (isRace() && !playing) racePlay(); }, 500); }); }

  function render() {
    if (!ctrls) return;
    const parts = [];
    if (o.types && o.types.length > 1) parts.push(`<div class="chips" role="group" aria-label="${T('tg_h')}">${o.types.map(t => `<button class="chipb" data-t="${t}" aria-pressed="${t === o.getType()}">${esc(T('chart')[t])}</button>`).join('')}</div>`);
    if (isRace()) {
      parts.push(`<div class="raceset"><button class="chipb present" data-race="play">${playing ? '❚❚ ' + T('race_pause') : '▶ ' + T('race_play')}</button><input type="range" id="rs" min="0" max="${periods.length - 1}" value="${ri}" aria-label="${T('race_period')}"><span class="zl" id="rl">${esc(periods[ri])}</span><label class="sortl"><input type="checkbox" id="rc" ${cumul && canCumul ? 'checked' : ''} ${canCumul ? '' : 'disabled'}> ${T('race_cumul')}</label></div>`);
      if (o.onPresent) parts.push(`<button class="chipb present" data-present="1">▶ ${T('present')}</button>`);
      ctrls.innerHTML = parts.join(''); return;
    }
    if (isDom()) {
      if (o.onPresent) parts.push(`<button class="chipb present" data-present="1">▶ ${T('present')}</button>`);
      ctrls.innerHTML = parts.join(''); return;
    }
    if (meta.filterDim && meta.filterLabels.length > 1 && meta.filterLabels.length <= 24) {
      parts.push(`<div class="chips" role="group" aria-label="${esc(meta.filterDim)}">${meta.filterLabels.map(l => `<button class="chipb" data-l="${esc(l)}" aria-pressed="${sel ? sel.has(l) : true}"><i style="background:${colorOf(l)}"></i>${esc(l)}</button>`).join('')}${sel || range ? `<button class="chipb reset" data-reset="1">${T('reset')}</button>` : ''}</div>`);
    }
    if (meta.hasRange) {
      const n = meta.xLabels.length, r = range || [0, n - 1];
      parts.push(`<div class="zoom"><span class="zl" id="zl">${esc(meta.xLabels[r[0]])} – ${esc(meta.xLabels[r[1]])}</span><input type="range" id="z0" min="0" max="${n - 1}" value="${r[0]}" aria-label="${T('zoom_from')}"><input type="range" id="z1" min="0" max="${n - 1}" value="${r[1]}" aria-label="${T('zoom_to')}"></div>`);
    }
    if (meta.sortable && o.onSort) parts.push(`<label class="sortl">${T('sort')} <select id="psort">${[['value', 'sort_value'], ['label', 'sort_label'], ['none', 'sort_none']].map(([v, k]) => `<option value="${v}" ${o.getSort() === v ? 'selected' : ''}>${T(k)}</option>`).join('')}</select></label>`);
    if (o.onPresent) parts.push(`<button class="chipb present" data-present="1">▶ ${T('present')}</button>`);
    ctrls.innerHTML = parts.join('');
  }
  function apply() {
    if (host.listRefresh) host.listRefresh();
    if (isRace() || isDom()) { render(); return busy; }
    busy = busy.then(async () => { try { await chart.animate({ data: { filter: makeFilter(meta, { sel, range }) } }, { duration: dur(0.9) }); } catch (e) { console.error(e); } });
    render(); return busy;
  }
  function toggle(l) {
    if (!meta.filterDim) return;
    if (sel === null) sel = new Set([l]);
    else { if (sel.has(l)) sel.delete(l); else sel.add(l); if (!sel.size || sel.size === meta.filterLabels.length) sel = null; }
    apply();
  }
  function setState(st) {
    if (isCsType(P.type)) { if (host.alt._org) host.alt._org.setState(st && st.cs ? st.cs : null); return Promise.resolve(); }
    sel = st && st.sel ? new Set(st.sel) : null; range = st && st.range ? st.range.slice() : null; return apply();
  }

  if (ctrls) {
    ctrls.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.l !== undefined) toggle(b.dataset.l);
      else if (b.dataset.t) o.onType && o.onType(b.dataset.t);
      else if (b.dataset.race) racePlay();
      else if (b.dataset.reset) setState(null);
      else if (b.dataset.present) o.onPresent && o.onPresent();
    });
    ctrls.addEventListener('input', e => {
      if (e.target.id === 'rs') { playing = false; raceTo(+e.target.value, 0.25); return; }
      if (e.target.id !== 'z0' && e.target.id !== 'z1') return;
      let a = +ctrls.querySelector('#z0').value, b = +ctrls.querySelector('#z1').value;
      if (e.target.id === 'z0' && a >= b) { a = Math.max(0, b - 1); e.target.value = a; }
      if (e.target.id === 'z1' && b <= a) { b = Math.min(meta.xLabels.length - 1, a + 1); e.target.value = b; }
      ctrls.querySelector('#zl').textContent = `${meta.xLabels[a]} – ${meta.xLabels[b]}`;
    });
    ctrls.addEventListener('change', e => {
      if (e.target.id === 'z0' || e.target.id === 'z1') {
        const a = +ctrls.querySelector('#z0').value, b = +ctrls.querySelector('#z1').value;
        range = a === 0 && b === meta.xLabels.length - 1 ? null : [a, b]; apply();
      } else if (e.target.id === 'rc') { cumul = e.target.checked; chart.animate({ config: host.cfg() }, { duration: dur(0.6) }); }
      else if (e.target.id === 'psort') o.onSort(e.target.value);
    });
  }
  chart.on('click', e => { if (isRace() || isDom()) return; const c = e.target && e.target.categories; if (c && meta.filterDim && c[meta.filterDim] !== undefined) toggle(c[meta.filterDim]); });
  render();
  return {
    meta, render, setState, toggle, raceStart, raceUi, getState: () => ({ sel, range }),
    filterFn: () => (isRace() ? raceFilter() : makeFilter(meta, { sel, range })),
    onType() { playing = false; ri = 0; render(); raceUi(); },
    get cumul() { return cumul && canCumul; },
  };
}

/* ---------------- modo apresentação ---------------- */
function buildSteps(P, meta) {
  const steps = [{ id: 'overview', caption: '', state: null }];
  const L = meta.filterLabels || [];
  if (P.type === 'organism' && P.built.org) { P.built.org.hubs.slice(0, 14).forEach((h, i) => steps.push({ id: 'o' + i, caption: h.label, state: { cs: { focus: i } } })); }
  else if (CHART_REG[P.type]) CHART_REG[P.type].steps(P).forEach(s => steps.push(s));
  else if (P.type === 'race' || DOM_TYPES.has(P.type)) { /* sem recortes: o próprio gráfico já conta a história */ }
  else if (meta.hasSeries && L.length >= 2 && L.length <= 8) L.forEach(l => steps.push({ id: 's:' + l, caption: l, state: { sel: [l] } }));
  else if (meta.hasRange) {
    const n = meta.xLabels.length, c1 = Math.ceil(n / 3) - 1, c2 = Math.ceil((2 * n) / 3) - 1;
    steps.push({ id: 'r1', caption: `${meta.xLabels[0]} – ${meta.xLabels[c1]}`, state: { range: [0, Math.max(1, c1)] } });
    steps.push({ id: 'r2', caption: `${meta.xLabels[0]} – ${meta.xLabels[c2]}`, state: { range: [0, Math.max(2, c2)] } });
  } else if (meta.sortable && L.length >= 6) {
    steps.push({ id: 't3', caption: T('top_n', 3), state: { sel: L.slice(0, 3) } });
    steps.push({ id: 't5', caption: T('top_n', 5), state: { sel: L.slice(0, 5) } });
  }
  P.insights.forEach((i, k) => steps.push({ id: 'i' + k, caption: i.text, state: null }));
  if (steps.length > 1 && !P.insights.length) steps.push({ id: 'end', caption: '', state: null });
  return steps;
}

function startPresentation(o) {
  const { root, ix, P } = o, steps = o.steps || buildSteps(P, ix.meta);
  const cap = root.querySelector('#pcap'), cnt = root.querySelector('#pcount');
  let i = 0, active = true, seen = 0;
  root.classList.add('presenting');
  if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
  async function show(n) {
    i = Math.max(0, Math.min(steps.length - 1, n)); seen = Math.max(seen, i);
    const s = steps[i];
    cap.textContent = s.caption || ''; cap.style.display = s.caption ? '' : 'none';
    cnt.textContent = `${String(i + 1).padStart(2, '0')}/${String(steps.length).padStart(2, '0')}`;
    await ix.setState(s.state);
  }
  function stop() {
    if (!active) return; active = false;
    root.classList.remove('presenting'); cap.textContent = '';
    document.removeEventListener('keydown', onKey, true); document.removeEventListener('fullscreenchange', onFs); root.removeEventListener('click', onClick);
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    ix.setState(null);
    if (o.onEnd) o.onEnd(seen + 1);
  }
  const onKey = e => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); show(i + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); show(i - 1); }
    else if (e.key === 'Escape') { e.preventDefault(); stop(); }
    else if (e.key === 'Home') show(0); else if (e.key === 'End') show(steps.length - 1);
  };
  const onFs = () => { if (!document.fullscreenElement) stop(); };
  const onClick = e => {
    const b = e.target.closest('[data-p]');
    if (b) { if (b.dataset.p === 'next') show(i + 1); else if (b.dataset.p === 'prev') show(i - 1); else stop(); }
  };
  document.addEventListener('keydown', onKey, true); document.addEventListener('fullscreenchange', onFs); root.addEventListener('click', onClick);
  show(0);
  return { stop, show, steps };
}

/* ---------------- host: decide entre Vizzu e visões próprias ---------------- */
async function createChartHost(o) {
  const { P, root } = o, Vizzu = await loadVizzu();
  const box = root.querySelector('#vz'); box.innerHTML = '';
  const cv = document.createElement('canvas'), alt = document.createElement('div'), big = document.createElement('div');
  alt.className = 'altview'; alt.style.display = 'none'; big.className = 'racebig'; big.setAttribute('aria-hidden', 'true');
  box.append(cv, alt, big);
  const chart = new Vizzu({ element: cv });
  await chart.initializing;
  chart.feature('tooltip', false); // o cartão da coluna 2 substitui o balão
  const host = { P, chart, root, box, alt, ix: null };
  // o Vizzu só refaz o desenho quando a janela muda; mudanças de coluna (painel, arranjo) pedem o mesmo aviso
  let lw = box.clientWidth, lh = box.clientHeight, rt = 0;
  const rob = window.ResizeObserver ? new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(box.clientWidth - lw) > 4 || Math.abs(box.clientHeight - lh) > 4) { lw = box.clientWidth; lh = box.clientHeight; window.dispatchEvent(new Event('resize')); } }, 120); }) : null;
  if (rob) rob.observe(box);
  const card = host.card = createCardCol(root), list = host.list = createListCol(root), rows = [];
  const skipN = new Set([P.built.names.yl, P.built.names.ycl].filter(Boolean));
  const rowModel = id => { const r = rows[id]; return vzModel(P, { categories: Object.fromEntries(r.cats), values: Object.fromEntries(r.vals), index: 'r' + id }); };
  // lista completa dos pontos do gráfico (respeita os filtros ativos)
  host.listRefresh = () => {
    if (!list || DOM_TYPES.has(P.type)) return;
    const b = P.built, ser = b.vz.series, f = host.ix ? host.ix.filterFn() : null, dims = ser.filter(x => x.type === 'dimension' && !skipN.has(x.name)), meas = ser.filter(x => x.type === 'measure'), N = ser.length ? ser[0].values.length : 0;
    const fv = v => (typeof v === 'number' ? fmtNum(v, b.unit, LANG) : String(v)), items = []; rows.length = 0;
    for (let i = 0; i < N; i++) {
      if (f) { const rec = {}; for (const x of ser) rec[x.name] = x.values[i]; if (!f(rec)) continue; }
      const cats = dims.map(d => [d.name, d.values[i]]), vals = meas.map(m => [m.name, m.values[i]]), id = rows.length; rows.push({ cats, vals });
      items.push({ id, title: cats.length ? String(cats[0][1]) : (vals[0] ? vals[0][0] : ''), sub: cats.slice(1).map(c => c[1]).concat(vals.slice(1).map(v => `${v[0]} ${fv(v[1])}`)).join(' · '), val: vals.length ? fv(vals[0][1]) : '', v: vals.length ? Math.abs(+vals[0][1] || 0) : 0, ord: i });
    }
    list.setItems(items, { sorts: ['v', 'n', 'o'], sort: b.xIsTime ? 'o' : 'v' });
  };
  let lastIdx = null, lastRow = null;
  const rowOf = tg => {
    if (tg.index === lastIdx) return lastRow; const cs = Object.entries(tg.categories || {}).filter(([k]) => !skipN.has(k)); let hit = null;
    for (let i = 0; i < rows.length && hit === null; i++) { const m = new Map(rows[i].cats); if (cs.every(([k, v]) => m.get(k) === v)) hit = i; }
    lastIdx = tg.index; lastRow = hit; return hit;
  };
  if (card) {
    chart.on('pointermove', e => { if (DOM_TYPES.has(P.type)) return; const t = e.target; if (t && t.tagName === 'plot-marker') { card.over(vzModel(P, t)); if (list && !card.isPinned()) list.hot(rowOf(t)); } else { card.out(); if (list && !card.isPinned()) list.hot(null, false); } });
    chart.on('click', e => { if (DOM_TYPES.has(P.type)) return; const t = e.target; if (t && t.tagName === 'plot-marker') { card.pin(vzModel(P, t)); if (list) list.sel(rowOf(t), true); } else card.unpin(); });
    cv.addEventListener('pointerleave', () => { if (!DOM_TYPES.has(P.type)) { card.out(); if (list && !card.isPinned()) list.hot(null, false); } });
  }
  host.cfg = () => vzConfig(host.baseType(), P.built, P.sort, chartOpt(P, { cumul: host.ix && host.ix.cumul }));
  // para tipos sem Vizzu, o canvas escondido guarda uma configuração neutra para a volta
  host.baseType = () => (DOM_TYPES.has(P.type) ? (P.choice.all.find(t => !DOM_TYPES.has(t)) || 'bars') : P.type);
  host.ix = createInteractions({ host, ...o.hooks });
  const show = () => {
    const dom = DOM_TYPES.has(P.type);
    if (alt._org) { alt._org.destroy(); alt._org = null; }
    if (card) { card.reset(); if (!isCsType(P.type)) card.setOverview(genOverview(P)); }
    if (list) list.reset(); lastIdx = null;
    if (!dom && card && list) {
      card.onUnpin = () => list.sel(null, false);
      list.onHover = id => card.over(rowModel(id)); list.onLeave = () => card.out(); list.onPick = id => { card.pin(rowModel(id)); list.sel(id, false); };
      host.listRefresh();
    }
    cv.style.visibility = dom ? 'hidden' : ''; alt.style.display = dom ? '' : 'none';
    if (dom) renderAlt(P, alt); else { if (alt._org) { alt._org.destroy(); alt._org = null; } alt.innerHTML = ''; }
    big.style.display = P.type === 'race' ? '' : 'none';
    const ft = root.querySelector('#pfoot'); if (ft && P.foot == null) ft.textContent = footOf(P); // a nota acompanha o tipo de gráfico, salvo se a pessoa editou
  };
  host.mount = async d => {
    show(); host.ix.onType();
    const filt = P.type === 'race' ? host.ix.filterFn() : host.ix.filterFn();
    await chart.animate({ data: { ...P.built.vz, filter: filt }, config: host.cfg(), style: vzStyle(P) }, { duration: DOM_TYPES.has(P.type) ? 0 : dur(d), easing: 'cubic-bezier(.25,.8,.25,1)' });
    if (P.type === 'race') host.ix.raceStart();
  };
  host.setType = async (t, d = 1.1) => {
    P.type = t; show(); host.ix.onType();
    if (DOM_TYPES.has(t)) { try { await chart.animate({ style: vzStyle(P) }, { duration: 0 }); } catch (e) { /* canvas escondido */ } return; }
    try { await chart.animate({ data: { filter: host.ix.filterFn() }, config: host.cfg(), style: vzStyle(P) }, { duration: dur(d), easing: 'cubic-bezier(.4,0,.2,1)' }); } catch (e) { console.error(e); }
    if (t === 'race') host.ix.raceStart();
  };
  host.restyle = async d => {
    if (isCsType(P.type) && alt._org) alt._org.restyle(P); else if (DOM_TYPES.has(P.type)) renderAlt(P, alt);
    try { await chart.animate({ style: vzStyle(P) }, { duration: dur(d === undefined ? 1.1 : d), easing: 'cubic-bezier(.4,0,.2,1)' }); } catch (e) { console.error(e); }
  };
  host.resort = async () => { try { await chart.animate({ config: host.cfg() }, { duration: dur(0.9) }); } catch (e) { console.error(e); } };
  host.destroy = () => { if (rob) rob.disconnect(); if (list) list.destroy(); if (alt._org) alt._org.destroy(); if (card) card.destroy(); try { chart.detach(); } catch (e) { /* já destruído */ } };
  return host;
}
