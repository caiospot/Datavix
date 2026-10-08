/* Datavix: casca dos gráficos de canvas (árvore radial e os 5 da Fase B).
 * Cada gráfico se registra com regChart({id, suggest, build, fit, fields, render, steps, drawStatic, note}) e entrega um motor
 * (OrgEngine, RaysEngine…) que implementa: ctx, resize(w,h,dpr), snap(), draw(ctx,{clear}), pick(x,y)->id|null, setHover(id|null),
 * setState(p), getState(), kick(), stop(). A casca cuida do que é igual em todos: palco, cartão e lista (coluna 2), mouse,
 * painel da coluna 1, tutorial, apresentação e a atualização depois de cada mudança de estado. */
const CHART_REG = {};
const regChart = def => { CHART_REG[def.id] = def; };
const isCsType = t => t === 'organism' || !!CHART_REG[t];
const csBuilt = (P, id) => (P.built.cs && P.built.cs[id]) || null;
// quadro estático (PNG): mesmo layout e cores do gráfico vivo
function drawCsStatic(P, ctx, x, y, w, h, state) {
  if (P.type === 'organism') drawOrganismStatic(P, ctx, x, y, w, h, state);
  else if (CHART_REG[P.type]) CHART_REG[P.type].drawStatic(P, ctx, x, y, w, h, state);
}
// o texto dos gráficos de canvas acompanha P.textK (apresentação usa fonte maior); só a propriedade `font` do contexto é interceptada
function csScaleFont(ctx, P) {
  const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font'); if (!d || !d.set) return ctx;
  Object.defineProperty(ctx, 'font', { configurable: true, enumerable: true, get() { return d.get.call(this); }, set(v) { const k = P.textK || 1; d.set.call(this, k === 1 ? v : String(v).replace(/(\d+(?:\.\d+)?)px/, (m, x) => +(x * k).toFixed(2) + 'px')); } });
  return ctx;
}
const csMeasureCtx = () => (csMeasureCtx._c || (csMeasureCtx._c = document.createElement('canvas').getContext('2d')));
const csFmtDay = t => { const d = new Date(t), P2 = n => String(n).padStart(2, '0'); return LANG === 'en' ? `${d.getUTCFullYear()}-${P2(d.getUTCMonth() + 1)}-${P2(d.getUTCDate())}` : `${P2(d.getUTCDate())}/${P2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`; };
// intervalo "agradável" para anéis e eixos
function csNiceTicks(max, n = 3) {
  if (!(max > 0)) return [];
  const raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p, s = (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p, out = [];
  for (let v = s; v <= max * 1.001; v += s) out.push(v);
  return out;
}
// percentual com uma casa quando é pequeno (900 itens dão parcelas abaixo de 1%)
const csPct = (x, lang) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'pt-BR', { maximumFractionDigits: Math.abs(x) < 10 ? 1 : 0 }).format(x) + '%';
// mediana de uma lista de números
const csMedian = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/* ---------------- adequação: o formato dos dados escolhe o gráfico ---------------- */
function csFits(built, briefing) {
  if (!built.cs) return [];
  return Object.values(CHART_REG).filter(r => built.cs[r.id]).map(r => ({ t: r.id, s: r.fit ? r.fit(built, briefing) : 0.4 })).sort((a, b) => b.s - a.s);
}

/* ---------------- tutorial de abertura: até 4 etapas, só na primeira vez ---------------- */
// o: { el, piece, prefix ('tut_' ou 'tut_rays_'), key (localStorage), steps() -> [{k, t:{x,y,w,h,round}, demo}], demo(id|null), isPinned() }
function createTour(o) {
  let tut = null, timer = 0;
  const seen = () => { try { return localStorage.getItem(o.key) === '1'; } catch (e) { return false; } };
  const markSeen = () => { try { localStorage.setItem(o.key, '1'); } catch (e) { /* sem armazenamento */ } };
  function start(force) {
    if (tut || !o.el.isConnected) return;
    if (!force && (seen() || /[?&]notut\b/.test(location.search) || (o.piece && o.piece.classList.contains('presenting')))) return;
    markSeen();
    const root = document.createElement('div'); root.className = 'orgtut'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', T('tut_help'));
    root.innerHTML = `<div class="tspot"></div><div class="tcard"><div class="tstep"></div><h3></h3><p></p><div class="tbtns"><button type="button" class="tskip" data-t="skip">${T('tut_skip')}</button><span class="tdots"></span><button type="button" class="tprev" data-t="prev">${T('tut_prev')}</button><button type="button" class="tnext" data-t="next"></button></div></div>`;
    document.body.appendChild(root); tut = { root, i: 0, steps: o.steps() };
    root.addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; if (b.dataset.t === 'skip') close(); else if (b.dataset.t === 'prev') go(tut.i - 1); else go(tut.i + 1); });
    window.addEventListener('resize', onResize); document.addEventListener('keydown', onKey, true);
    go(0, true);
  }
  const onResize = () => { if (tut) { tut.steps = o.steps(); go(tut.i, true); } };
  const onKey = e => { if (!tut) return; if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); go(tut.i + 1); } else if (e.key === 'ArrowLeft') go(tut.i - 1); };
  function place(cd, st) {
    const vw = innerWidth, vh = innerHeight, cw = Math.min(340, vw - 24), ch = cd.offsetHeight || 190, t = st.t, cxm = t.x + t.w / 2;
    let x, y; // ao lado do alvo, onde houver espaço
    if (t.x + t.w + 20 + cw < vw) { x = t.x + t.w + 20; y = t.y + t.h / 2 - ch / 2; }
    else if (t.x - 20 - cw > 0) { x = t.x - 20 - cw; y = t.y + t.h / 2 - ch / 2; }
    else { x = cxm - cw / 2; y = t.y + t.h + 16 < vh - ch ? t.y + t.h + 16 : t.y - ch - 16; }
    if (st.k === 1 || (x < t.x + t.w && x + cw > t.x && y < t.y + t.h && y + ch > t.y)) { x = Math.max(12, Math.min(vw - cw - 12, t.x + t.w / 2 - cw / 2)); y = Math.max(12, Math.min(vh - ch - 12, t.y + t.h / 2 - ch / 2)); }
    cd.style.width = cw + 'px'; cd.style.transform = `translate(${Math.round(Math.max(12, Math.min(x, vw - cw - 12)))}px,${Math.round(Math.max(12, Math.min(y, vh - ch - 12)))}px)`;
  }
  function go(i, instant) {
    if (!tut) return; if (i < 0) i = 0; if (i >= tut.steps.length) return close();
    tut.i = i; const st = tut.steps[i], r = tut.root, sp = r.querySelector('.tspot'), cd = r.querySelector('.tcard');
    r.classList.toggle('inst', !!instant);
    // etapa do cartão: mostra o cartão de verdade, na coluna 2, num item grande
    if (st.demo !== undefined && st.demo !== null && st.demo !== -1) o.demo(st.demo); else o.demo(null);
    if (st.k === 2 && o.piece) { const c2 = o.piece.querySelector('#pc2'), b = c2 && c2.getBoundingClientRect(); if (b) st.t = { x: b.left - 6, y: b.top - 6, w: b.width + 12, h: b.height + 12 }; } // o cartão cresce com o conteúdo
    sp.style.cssText = `left:${Math.round(st.t.x)}px;top:${Math.round(st.t.y)}px;width:${Math.round(st.t.w)}px;height:${Math.round(st.t.h)}px;border-radius:${st.t.round ? '50%' : '10px'}`;
    cd.querySelector('.tstep').textContent = T('tut_step', i + 1, tut.steps.length);
    cd.querySelector('h3').textContent = T(o.prefix + st.k + '_t'); cd.querySelector('p').textContent = T(o.prefix + st.k + '_p');
    cd.querySelector('.tdots').innerHTML = tut.steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    cd.querySelector('.tnext').textContent = i === tut.steps.length - 1 ? T('tut_done') : T('tut_next');
    cd.querySelector('.tprev').style.visibility = i ? 'visible' : 'hidden';
    place(cd, st);
    cd.querySelector('.tnext').focus({ preventScroll: true });
  }
  function close(silent) {
    if (!tut) return; window.removeEventListener('resize', onResize); document.removeEventListener('keydown', onKey, true);
    tut.root.remove(); tut = null; if (!silent) o.demo(null);
  }
  return { start, close, auto: () => { timer = setTimeout(() => start(false), RM ? 300 : 2300); }, destroy: () => { clearTimeout(timer); close(true); }, isOpen: () => !!tut };
}
// caixa (x, y, w, h) de um retângulo da tela, para o foco do tutorial
const csBox = r => ({ x: r.left, y: r.top, w: r.width, h: r.height });
const csPad = (b, p) => ({ x: b.x - p, y: b.y - p, w: b.w + 2 * p, h: b.h + 2 * p, round: b.round });

/* ---------------- montagem: palco + painel da coluna 1 + cartão e lista da coluna 2 ----------------
 * o: { id, sideHtml, tutPrefix, tutKey }.  h: ver o final do arquivo. Devolve o controle do gráfico (el._org). */
function csMount(P, el, o, makeEngine, h) {
  const piece = el.closest('.piece'), c1x = piece && piece.querySelector('#pc1x');
  el.innerHTML = `<div class="org"><div class="orgstage"><canvas class="orgcv" id="orgcv" role="img" aria-label="${esc(titleOf(P))}"></canvas>
    <div class="orgtools"><button type="button" id="orgpres">▶ ${T('present')}</button><button type="button" id="orgtut">? ${T('tut_help')}</button></div></div></div>`;
  const side0 = document.createElement('aside'); side0.className = 'orgside'; side0.style.fontFamily = fontsOf(P).body;
  side0.innerHTML = o.sideHtml + '<div class="orgctip" id="orgctip" hidden></div>';
  if (c1x) { c1x.innerHTML = ''; c1x.appendChild(side0); }
  if (piece) piece.classList.add('org-mode');
  const cv = el.querySelector('#orgcv'), stage = el.querySelector('.orgstage');
  const eng = makeEngine(orgTheme(P)); eng.ctx = csScaleFont(cv.getContext('2d'), P);
  const fit = () => { const w = Math.max(200, stage.clientWidth), hh = Math.max(260, stage.clientHeight), dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); eng.resize(w, hh, dpr); };
  const ro = new ResizeObserver(() => fit()); ro.observe(stage); fit();
  if (RM) eng.snap();

  let pinned = null;
  const list = piece ? createListCol(piece) : null; if (list) list.reset();
  const card = piece ? createCardCol(piece, { onUnpin: () => { pinned = null; eng.setHover(null); if (list) list.sel(null, false); } }) : null;
  let listSig = null;
  function refreshList() {
    if (!list || !h.listItems) return; const li = h.listItems(), sig = li.sig;
    if (sig === listSig) return; listSig = sig;
    list.setItems(li.items, { sorts: li.sorts || ['v', 'n', 'o'], sort: li.sort || 'v' }); list.sel(pinned !== null ? pinned : null, false);
  }
  const refresh = () => {
    if (h.side) h.side(side0);
    if (pinned !== null && h.visible && !h.visible(pinned) && card) card.unpin();
    if (card) card.setOverview(h.overview()); refreshList();
  };
  function pickItem(id) {
    if (pinned === id) { card && card.unpin(); return; }
    pinned = id; eng.setHover(id); if (card) card.pin(h.model(id)); if (list) list.sel(id, false);
    if (h.onPick) h.onPick(id);
  }
  if (list) {
    list.onHover = id => { if (pinned === null) { eng.setHover(id); if (card) card.over(h.model(id)); } };
    list.onLeave = () => { if (pinned === null) eng.setHover(null); if (card) card.out(); };
    list.onPick = id => pickItem(id);
  }
  const demo = id => {
    if (id !== null) { eng.setHover(id); if (card) card.over(h.model(id)); if (list) list.hot(id, true); }
    else if (pinned === null) { eng.setHover(null); if (card) card.out(); if (list) list.hot(null, false); }
  };
  const tour = createTour({ el, piece, prefix: o.tutPrefix, key: o.tutKey, demo, steps: () => h.tour({ stage, side0, eng, piece, tools: el.querySelector('.orgtools') }) });

  cv.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect(), id = eng.pick(e.clientX - r.left, e.clientY - r.top);
    if (pinned === null) eng.setHover(id);
    cv.style.cursor = id !== null ? 'pointer' : 'default';
    if (list && pinned === null) list.hot(id !== null ? id : null);
    if (!card) return;
    if (id === null) card.out(); else card.over(h.model(id));
  });
  cv.addEventListener('mouseleave', () => { if (pinned === null) { eng.setHover(null); if (list) list.hot(null, false); } if (card) card.out(); });
  cv.addEventListener('click', e => {
    const r = cv.getBoundingClientRect(), id = eng.pick(e.clientX - r.left, e.clientY - r.top);
    if (id !== null) { if (h.onClick && h.onClick(id, pickItem)) return; pickItem(id); }
    else if (pinned !== null) card && card.unpin();
    else if (h.onEmpty) h.onEmpty();
  });
  if (el._csClick) el.removeEventListener('click', el._csClick); // o contêiner é reaproveitado a cada troca de gráfico: um ouvinte só
  el._csClick = e => {
    if (e.target.closest('#orgpres')) { const bt = (piece && piece.querySelector('#pctrls [data-present]')) || document.querySelector('[data-a=present]'); if (bt) bt.click(); }
    else if (e.target.closest('#orgtut')) tour.start(true);
  };
  el.addEventListener('click', el._csClick);
  const ctip = side0.querySelector('#orgctip');
  const hoverItem = id => { if (pinned !== null) return; eng.setHover(id); if (card) { if (id === null) card.out(); else card.over(h.model(id)); } if (list) list.hot(id, id !== null); };
  if (h.bindSide) h.bindSide(side0, { eng, refresh, ctip, hover: hoverItem, pick: pickItem });

  const ctl = {
    engine: eng, card, list, refresh, side0, stage, tour,
    getState: () => eng.getState(),
    setState: p => { eng.setState(p); if (h.syncSide) h.syncSide(side0, eng); refresh(); },
    restyle: Q => { eng.th = orgTheme(Q); side0.style.fontFamily = fontsOf(Q).body; listSig = null; refresh(); eng.kick(); },
    tutorial: () => tour.start(true),
    pinned: () => pinned,
    destroy: () => {
      eng.stop(); ro.disconnect(); tour.destroy();
      if (card) card.reset(); if (list) list.reset();
      side0.remove(); if (piece) piece.classList.remove('org-mode');
    },
  };
  el._org = ctl; refresh(); tour.auto();
  return ctl;
}
/* h (entregue por cada gráfico):
 *   model(id) -> modelo do cartão       overview() -> modelo da visão geral
 *   listItems() -> {sig, items, sorts?, sort?}   visible(id) -> bool (se não, o cartão fixo fecha)
 *   side(side0) -> repinta o painel      syncSide(side0, eng) -> alinha controles ao estado (setState de fora)
 *   bindSide(side0, {eng, refresh, ctip}) -> eventos do painel
 *   tour({stage, side0, eng, piece, tools}) -> [{k, t, demo}]
 *   onClick(id, pickItem) -> true se tratou o clique    onEmpty() -> clique no vazio */
