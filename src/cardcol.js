/* Datavix: coluna 2, o cartão de detalhes. Compartilhado por todos os gráficos (editor, apresentação e HTML exportado).
 * Modelo: { key, kick, kickColor, title, value, vlabel, left:[[campo, valor]], texts:[[campo, texto longo]], hint }
 * Estados: visão geral (vazio) > hover (prévia, textos cortados) > fixo (clique; texto completo; × ou Esc fecha). */
function cardHtml(m, mode) {
  const left = m.left || [], texts = m.texts || [], one = !texts.length;
  const x = mode === 'pin' ? `<button type="button" class="cardx" data-x="1" aria-label="${T('org_card_close')}">×</button>` : '';
  const foot = mode === 'hov' ? T('org_card_pin') : mode === 'ov' && m.hint ? m.hint : '';
  return `<div class="cardh"><div class="cardt0"><div class="kick">${m.kickColor ? `<i style="--c:${m.kickColor}"></i>` : ''}${esc(m.kick || '')}</div><h4>${esc(m.title || '')}</h4></div>${m.value ? `<div class="cardv"><div class="val">${esc(m.value)}</div><small>${esc(m.vlabel || '')}</small></div>` : ''}${x}</div>
    <div class="cardb${one ? ' one' : ''}"><div class="cardl"><div class="cardt">${T('org_card_data')}</div>${left.map(([k, v]) => `<div class="cf"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
    ${one ? '' : `<div class="cardr"><div class="cardt">${T('org_card_text')}</div>${m.note ? `<div class="cardnote">${esc(m.note)}</div>` : ''}${texts.map(([k, v]) => `<div class="ct"><span>${esc(k)}</span><p>${esc(v)}</p></div>`).join('')}</div>`}</div>
    ${foot ? `<div class="cardhint">${esc(foot)}</div>` : ''}`;
}
function createCardCol(root, o = {}) {
  if (root._card) { root._card.onUnpin = o.onUnpin || null; return root._card; } // um cartão por peça: o gráfico ativo assume o controle
  const slot = root.querySelector('#pcard'); if (!slot) return null;
  let pinned = null, hover = null, overview = null, last = '', ver = 0;
  const paint = () => {
    const m = pinned || hover || overview, mode = pinned ? 'pin' : hover ? 'hov' : 'ov';
    if (!m) { slot.innerHTML = ''; slot.className = 'pcard'; last = ''; return; }
    const key = mode + '|' + m.key + '|' + ver; if (key === last) return; last = key;
    slot.className = 'pcard ' + mode + ((m.texts || []).length ? '' : ' one'); slot.innerHTML = cardHtml(m, mode);
    if (!RM) { slot.classList.remove('in'); void slot.offsetWidth; slot.classList.add('in'); }
    if (mode === 'pin') slot.scrollTop = 0;
  };
  const api = {
    over(m) { if (!pinned) { hover = m; paint(); } },
    out() { if (hover) { hover = null; paint(); } },
    pin(m) { pinned = m; hover = null; paint(); const c2 = root.querySelector('#pc2'); if (c2 && root.dataset.lay === 'narrow' && !(window.innerWidth <= 900) && c2.scrollIntoView) c2.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' }); },
    unpin() { if (!pinned) return; pinned = null; paint(); if (api.onUnpin) api.onUnpin(); },
    reset() { pinned = null; hover = null; overview = null; api.onUnpin = null; last = ''; paint(); },
    setOverview(m) { overview = m; ver++; paint(); },
    isPinned: () => !!pinned, onUnpin: o.onUnpin || null,
    destroy() { root._card = null; document.removeEventListener('keydown', onKey); slot.removeEventListener('click', onClick); slot.innerHTML = ''; slot.className = 'pcard'; },
  };
  const onClick = e => { if (e.target.closest('[data-x]')) api.unpin(); };
  const onKey = e => { if (e.key === 'Escape' && pinned && !document.querySelector('.orgtut')) api.unpin(); };
  slot.addEventListener('click', onClick); document.addEventListener('keydown', onKey);
  root._card = api; return api;
}

/* visão geral e cartões dos gráficos que não são o organismo */
function genOverview(P) {
  let cards = []; try { cards = kpiCards(P.built, LANG, T); } catch (e) { /* sem indicadores */ }
  const b = P.built, c0 = cards[0];
  return { key: 'ov-' + P.type, kick: T('card_overview'), title: T('chart')[P.type] || '', value: c0 ? kpiFmt(c0) : '', vlabel: c0 ? c0.label : '',
    left: [[T('org_rows'), fmtInt(b.stats.rowsTotal, LANG)], ...cards.slice(1, 4).map(c => [c.label, kpiFmt(c) + (c.sub ? ' · ' + c.sub : '')])], texts: [], hint: T('card_hint_gen') };
}
// alvo de ponteiro do Vizzu (marcador) vira cartão
function vzModel(P, tg) {
  const b = P.built, n = b.names || {}, skip = new Set([n.yl, n.ycl].filter(Boolean)), cats = Object.entries(tg.categories || {}).filter(([k]) => !skip.has(k)), vals = Object.entries(tg.values || {});
  const fmtV = v => (typeof v === 'number' ? fmtNum(v, b.unit, LANG) : String(v));
  const left = cats.slice(1).map(([k, v]) => [k, String(v)]).concat(vals.slice(1).map(([k, v]) => [k, fmtV(v)]));
  return { key: tg.index || JSON.stringify([cats, vals]), kick: cats.length > 1 ? cats[cats.length - 1][1] : (T('chart')[P.type] || ''), title: cats.length ? cats.slice(0, cats.length > 1 ? -1 : 1).map(c => c[1]).join(' · ') : T('card_overview'),
    value: vals.length ? fmtV(vals[0][1]) : '', vlabel: vals.length ? vals[0][0] : '', left: left.length ? left : [[n.x || '', cats.length ? String(cats[0][1]) : '']], texts: [] };
}

/* ---------- lista completa (coluna 2, abaixo do cartão): sempre visível, virtualizada, com busca e ordenação ---------- */
// item: { id, title, sub, color, val (texto), v (número, p/ ordenar), ord, s: () => texto de busca }
function createListCol(root) {
  if (root._list) return root._list;
  const slot = root.querySelector('#plist'); if (!slot) return null;
  const ROW = 50;
  let all = [], view = [], q = '', sortK = 'v', hotId = null, selId = null, kb = -1, lastHover = null, raf = 0;
  slot.innerHTML = `<div class="plh"><span class="lbl plc"></span><input type="search" class="pls" placeholder="${esc(T('list_search'))}" aria-label="${esc(T('list_search'))}"><select class="plo" aria-label="${esc(T('list_sort'))}"></select></div>
    <div class="plb" tabindex="0" role="listbox" aria-label="${esc(T('list_h'))}"><div class="plsp"><div class="plrows"></div></div></div>`;
  const body = slot.querySelector('.plb'), sp = slot.querySelector('.plsp'), rows = slot.querySelector('.plrows'), cnt = slot.querySelector('.plc'), inp = slot.querySelector('.pls'), sel = slot.querySelector('.plo');
  const api = { onHover: null, onLeave: null, onPick: null };
  const render = () => {
    raf = 0; const st = body.scrollTop, h = body.clientHeight || 300, a = Math.max(0, Math.floor(st / ROW) - 3), b = Math.min(view.length, Math.ceil((st + h) / ROW) + 3);
    let out = ''; for (let i = a; i < b; i++) { const it = view[i]; out += `<div class="plr${it.id === hotId ? ' hot' : ''}${it.id === selId ? ' sel' : ''}${i === kb ? ' kb' : ''}" role="option" aria-selected="${it.id === selId}" data-id="${esc(it.id)}" style="top:${i * ROW}px;height:${ROW}px">${it.color ? `<i style="--c:${it.color}"></i>` : '<i class="nc"></i>'}<div class="pt"><b>${esc(it.title)}</b><span>${esc(it.sub || '')}</span></div><em>${esc(it.val || '')}</em></div>`; }
    rows.innerHTML = out;
  };
  const sched = () => { if (!raf) raf = requestAnimationFrame(render); };
  const cmp = { v: (x, y) => y.v - x.v, n: (x, y) => String(x.title).localeCompare(String(y.title), LANG === 'pt' ? 'pt-BR' : 'en', { numeric: true }), o: (x, y) => x.ord - y.ord };
  const compute = () => {
    const s = q.trim().toLowerCase();
    view = (s ? all.filter(it => { if (it._s === undefined) it._s = String(it.s ? it.s() : it.title + ' ' + (it.sub || '')).toLowerCase(); return it._s.includes(s); }) : all.slice()).sort(cmp[sortK] || cmp.v);
    cnt.textContent = `[ ${T('list_h')} · ${fmtInt(view.length, LANG)}${s ? ' / ' + fmtInt(all.length, LANG) : ''} ]`;
    sp.style.height = Math.max(view.length * ROW, 0) + 'px';
    rows.innerHTML = view.length ? '' : `<div class="pln">${T('list_none')}</div>`; if (view.length) render();
  };
  api.setItems = (items, o = {}) => {
    all = items; const sorts = o.sorts || ['v', 'n', 'o'];
    sortK = o.sort && sorts.includes(o.sort) ? o.sort : (sorts.includes(sortK) ? sortK : sorts[0]);
    sel.innerHTML = sorts.map(k => `<option value="${k}" ${k === sortK ? 'selected' : ''}>${T('list_sort_' + k)}</option>`).join(''); sel.style.display = sorts.length > 1 ? '' : 'none';
    kb = -1; compute();
  };
  api.hot = (id, reveal = true) => {
    if (id === hotId) return; hotId = id;
    if (reveal && id !== null && id !== -1) { const i = view.findIndex(it => it.id === id); if (i >= 0) { const top = i * ROW, st = body.scrollTop, h = body.clientHeight; if (top < st || top + ROW > st + h) body.scrollTop = Math.max(0, top - h / 2 + ROW / 2); } }
    sched();
  };
  api.sel = (id, reveal = true) => { selId = id; if (reveal && id !== null && id !== -1) api.hot(id, true); sched(); };
  api.reset = () => { all = []; view = []; q = ''; inp.value = ''; hotId = null; selId = null; kb = -1; lastHover = null; api.onHover = api.onLeave = api.onPick = null; compute(); };
  api.destroy = () => { root._list = null; slot.innerHTML = ''; };
  body.addEventListener('scroll', sched, { passive: true });
  inp.addEventListener('input', () => { q = inp.value; body.scrollTop = 0; compute(); });
  sel.addEventListener('change', () => { sortK = sel.value; body.scrollTop = 0; compute(); });
  const idOf = e => { const r = e.target.closest('.plr'); if (!r) return null; const it = view.find(x => String(x.id) === r.dataset.id); return it ? it.id : null; };
  body.addEventListener('mouseover', e => { const id = idOf(e); if (id === null || id === lastHover) return; lastHover = id; hotId = id; sched(); if (api.onHover) api.onHover(id); });
  body.addEventListener('mouseleave', () => { lastHover = null; hotId = null; sched(); if (api.onLeave) api.onLeave(); });
  body.addEventListener('click', e => { const id = idOf(e); if (id !== null && api.onPick) api.onPick(id); });
  body.addEventListener('keydown', e => {
    if (!['ArrowDown', 'ArrowUp', 'Enter', 'Home', 'End'].includes(e.key) || !view.length) return; e.preventDefault();
    if (e.key === 'Enter') { if (kb >= 0 && api.onPick) api.onPick(view[kb].id); return; }
    kb = e.key === 'Home' ? 0 : e.key === 'End' ? view.length - 1 : Math.max(0, Math.min(view.length - 1, (kb < 0 ? (e.key === 'ArrowDown' ? 0 : view.length - 1) : kb + (e.key === 'ArrowDown' ? 1 : -1))));
    const top = kb * ROW, st = body.scrollTop, h = body.clientHeight; if (top < st) body.scrollTop = top; else if (top + ROW > st + h) body.scrollTop = top + ROW - h;
    hotId = view[kb].id; sched(); if (api.onHover) api.onHover(hotId);
  });
  root._list = api; compute();
  return api;
}
