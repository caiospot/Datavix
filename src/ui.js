/* Datavix: interface e fluxo. Estado só em memória. Nenhum dado sai do navegador. */

const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const OB = [
  { key: 'audience', q: 'q_audience', opts: ['board', 'clevel', 'director', 'team', 'client'] },
  { key: 'decision', q: 'q_decision', opts: ['invest', 'cut', 'prioritize', 'alert', 'celebrate'] },
  { key: 'message', q: 'q_message', text: true },
  { key: 'story', q: 'q_story', opts: ['time', 'compare', 'composition', 'distribution', 'relation', 'flow', 'geo'] },
  { key: 'tone', q: 'q_tone', opts: ['corporate', 'editorial', 'tech', 'vibrant'], noOther: true },
  { key: 'place', q: 'q_place', opts: ['screen', 'projector', 'mobile', 'slide'], noOther: true },
];

const S = {
  lang: 'pt', ui: 'dark', step: 'entry', user: null, ob: 0,
  br: { audience: null, decision: null, message: '', story: null, tone: null, place: null },
  ds: null, mapping: null, nullPolicy: 'ignore', loading: null, error: null, sheets: null, fileName: null, isSample: false,
  menu: false, sheet: false, piece: null, panelOpen: lsGet('dv-panel') !== '0',
};

/* ---------------- worker embutido ---------------- */
let _worker = null;
function getWorker() {
  if (_worker) return _worker;
  const url = URL.createObjectURL(new Blob([b64bytes(b64text('worker-src'))], { type: 'text/javascript' }));
  _worker = new Worker(url);
  _worker.onmessage = onWorker;
  _worker.onerror = e => { S.loading = null; S.error = T('up_fail', e.message || 'worker'); render(); };
  _worker.onmessageerror = () => { S.loading = null; S.error = T('up_fail', 'mensagem'); render(); };
  return _worker;
}
/* ---------------- fluxo ---------------- */
// go(tela, erro): o erro, se houver, aparece na tela nova (antes era apagado e a pessoa ficava sem explicação)
// troca de tela com profundidade: a tela antiga recua e desfoca, a nova avança (View Transitions; sem suporte ou com movimento reduzido, troca direta)
function go(step, err) {
  const from = S.step; S.step = step; S.error = err || null;
  const run = () => { render(); window.scrollTo(0, 0); };
  if (from !== step && !RM && document.startViewTransition) { try { const vt = document.startViewTransition(run); [vt.ready, vt.finished, vt.updateCallbackDone].forEach(p => p && p.catch(() => {})); return; } catch (e) { /* cai para a troca direta */ } }
  run();
}
function setLang(l) { S.lang = l; LANG = l; document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en'; }

function onWorker(e) {
  const m = e.data;
  if (S.loading) S.loading.got = true;
  if (m.type === 'progress') {
    if (S.loading) { S.loading.stage = m.stage; S.loading.pct = m.pct; const i = $('.meter i'); if (i) i.style.width = Math.round(m.pct * 100) + '%'; const st = $('#stage'); if (st) st.textContent = T(m.stage === 'types' ? 'stage_types' : 'stage_read'); }
  } else if (m.type === 'sheets') {
    S.loading = null; S.sheets = m.names; S.fileName = m.fileName; go('sheet');
  } else if (m.type === 'dataset') {
    if (S.replace) return finishReplace(m);
    S.loading = null; S.ds = m; S.fileName = m.fileName;
    if (!m.rowCount || !m.columns.length) return go('upload', T('up_empty'));
    S.mapping = defaultMapping();
    go('preview');
  } else if (m.type === 'retyped') {
    S.ds.columns[m.col] = m.column; if (S.mapModal) { refreshMapModal(); return; } S.mapping = defaultMapping(); render();
  } else if (m.type === 'error') {
    if (S.replace) { S.replace = null; S.loading = null; go('editor'); toast(T('up_fail', m.message)); return; }
    S.loading = null; go('upload', m.message === 'empty' ? T('up_empty') : /password|encrypt|ZIP|CFB|Bad compressed/i.test(m.message) ? T('up_locked') : T('up_fail', m.message));
  }
}
const KIND_OF_STORY = { time: 'time', compare: 'category', composition: 'category', geo: 'category', flow: 'category', relation: 'relation', distribution: 'hist' };
const STORY_OF_KIND = { time: 'time', category: 'compare', relation: 'relation', hist: 'distribution' };
function defaultMapping() { return suggestMapping(S.br.story || 'compare', S.ds.columns); }

function loadBuffer(name, buffer, sheet) {
  S.error = null; S.loading = { stage: 'read', pct: 0.02, t0: Date.now(), size: buffer.byteLength, got: false }; S.fileName = name; render();
  try { getWorker().postMessage({ type: 'load', name, buffer, sheet }, [buffer]); }
  catch (e) { S.loading = null; S.error = T('up_noworker', (e && e.message) || e); render(); return; }
  startLoadTicker();
}
// tempo decorrido, aviso de demora e de leitor sem resposta; nunca deixa a pessoa olhando para uma tela parada
let _tick = null;
function startLoadTicker() {
  clearInterval(_tick);
  _tick = setInterval(() => {
    const L = S.loading;
    if (!L || S.step !== 'upload') { clearInterval(_tick); return; }
    const sec = Math.round((Date.now() - L.t0) / 1000), el = $('#elapsed'), hint = $('#slowhint');
    if (el) el.textContent = T('up_elapsed', sec, L.size > 1048576 ? (L.size / 1048576).toFixed(1) : '');
    if (hint) hint.textContent = !L.got && sec >= 4 ? T('up_noreply') : sec >= 8 ? T('up_slow') : '';
  }, 500);
}
function cancelLoad() {
  if (_worker) { _worker.terminate(); _worker = null; }
  if (S.replace) { S.ds = S.replace.prevDs; S.replace = null; S.loading = null; go('editor'); return; }
  S.loading = null; S.ds = null; S.error = T('up_cancel'); render();
}
async function loadFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!['xlsx', 'xls', 'xlsm', 'csv', 'tsv', 'txt'].includes(ext)) { S.error = T('up_bad'); return render(); }
  S.isSample = false;
  loadBuffer(file.name, await file.arrayBuffer());
}
function sampleCsv() {
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const regs = { Sudeste: 4.2, Sul: 2.4, Nordeste: 2.0, 'Centro-Oeste': 1.2, Norte: 0.8 };
  const cats = ['Eletrônicos', 'Casa', 'Moda', 'Mercado'];
  const P = n => String(n).padStart(2, '0');
  const rows = ['Data;Região;Categoria;Quantidade;Receita;Margem'];
  const t0 = Date.UTC(2023, 0, 1);
  for (let i = 0; i < 2600; i++) {
    const day = Math.floor(rnd() * 731), d = new Date(t0 + day * 86400000), mo = d.getUTCMonth(), t = day / 731;
    const regKeys = Object.keys(regs), tot = Object.values(regs).reduce((a, b) => a + b, 0);
    let r = rnd() * tot, reg = regKeys[0]; for (const k of regKeys) { r -= regs[k]; if (r <= 0) { reg = k; break; } }
    const cat = cats[Math.floor(rnd() * cats.length)], q = 1 + Math.floor(rnd() * 5);
    const season = mo === 10 ? 1.5 : mo === 11 ? 1.9 : mo === 0 ? 0.8 : 1;
    const growth = 1 + t * (reg === 'Nordeste' ? 0.6 : 0.2);
    const rec = (60 + rnd() * 340) * q * season * growth * (cat === 'Eletrônicos' ? 2.4 : cat === 'Mercado' ? 0.4 : 1);
    rows.push(`${P(d.getUTCDate())}/${P(mo + 1)}/${d.getUTCFullYear()};${reg};${cat};${q};${rec.toFixed(2).replace('.', ',')};${(5 + rnd() * 24).toFixed(1).replace('.', ',')}%`);
  }
  return new TextEncoder().encode(rows.join('\r\n')).buffer;
}

/* ---------------- renderização ---------------- */
function header() {
  const inEditor = S.step === 'editor', mine = (S.recents || []).length, dark = S.ui === 'dark';
  const ctl = inEditor ? `<button class="ico" data-a="panel" title="${T('panel_toggle')}" aria-label="${T('panel_toggle')}" aria-pressed="${S.panelOpen}">◨</button><button class="ico" data-a="undo" title="${T('undo')}" aria-label="${T('undo')}" ${canUndo() ? '' : 'disabled'}>↶</button><button class="ico" data-a="redo" title="${T('redo')}" aria-label="${T('redo')}" ${canRedo() ? '' : 'disabled'}>↷</button><span class="savechip" id="savechip" role="status"></span><button class="btn sm" data-a="save">${T('mdl_save')}</button>` : '';
  const seg = `<div class="seg" role="group" aria-label="Idioma / Language"><button data-a="lang" data-v="pt" aria-pressed="${S.lang === 'pt'}">PT</button><button data-a="lang" data-v="en" aria-pressed="${S.lang === 'en'}">EN</button></div>`;
  // celular e tablet vertical: só a ação principal e o menu "burger"; o resto vai para a gaveta
  const prim = S.step === 'entry' ? `<button class="btn sm" data-a="start">${LPT().start}</button>` : inEditor ? `<button class="btn sm" data-a="save">${T('mdl_save')}</button>` : '';
  const row = (a, label) => `<button class="dr-row" data-a="${a}"><span>${label}</span><i aria-hidden="true">→</i></button>`;
  const drawer = `<div class="drawer${S.menu ? ' open' : ''}" id="drawer" aria-hidden="${!S.menu}"><div class="dr-ov" data-a="menu-close"></div>
    <div class="dr-box" role="dialog" aria-modal="true" aria-label="${T('menu_h')}">
      <div class="dr-h"><span class="lbl">[ ${T('menu_h')} ]</span><button class="ico" data-a="menu-close" aria-label="${T('menu_close')}">✕</button></div>
      <div class="dr-list">${S.step === 'entry' ? LPT().nav.map(([id, l]) => `<a class="dr-row" href="#${id}" data-a="anchor"><span>${esc(l)}</span><i aria-hidden="true">→</i></a>`).join('') : ''}
        ${inEditor ? row('save', T('mdl_save')) : ''}${mine ? row('projects', `${LPT().mine} · ${mine}`) : ''}${S.piece || S.user ? row('new', T('restart')) : ''}
        <button class="dr-row" data-a="pwa-install" data-pwa="1" ${pwaCanInstall() ? '' : 'hidden'}><span>⤓ ${T('pwa_install')}</span><i aria-hidden="true">→</i></button>${pwaIosCanAdd() ? row('pwa-ios', T('m_ios_item')) : ''}
      </div>
      <div class="dr-opts"><div class="dr-opt"><span class="lbl">${T('m_lang')}</span>${seg}</div>
        <div class="dr-opt"><span class="lbl">${T('m_theme')}</span><button class="btn ghost sm" data-a="ui" aria-label="Tema / Theme">${dark ? '☀ ' + T('m_light') : '☾ ' + T('m_dark')}</button></div></div>
      <div class="dr-foot">${npsOn() ? `<button class="dr-link" data-a="feedback">${T('nps_fb')}</button>` : ''}<button class="dr-link" data-a="privacy">${esc(privT().link)}</button>${S.user ? `<button class="dr-link" data-a="logout">${T('logout')}</button>` : ''}</div>
    </div></div>`;
  return `<header class="top${S.step === 'entry' ? ' lp at-top' : ''}">
    <button class="brand" data-a="home" title="${T('home')}" aria-label="Datavix, ${T('home')}"><i></i>DATAVIX</button>
    ${S.step === 'entry' ? `<nav class="lp-nav" aria-label="Menu">${LPT().nav.map(([id, l]) => `<a href="#${id}" data-a="anchor">${esc(l)}</a>`).join('')}</nav>` : ''}
    <div class="top-r">
      <button class="btn ghost sm hide-s" id="pwa-btn" data-a="pwa-install" ${pwaCanInstall() ? '' : 'hidden'}>⤓ ${T('pwa_install')}</button>${ctl}${mine ? `<button class="btn ghost sm" data-a="projects">${LPT().mine} · ${mine}</button>` : ''}${S.piece || S.user ? `<button class="btn ghost sm" data-a="new">${T('restart')}</button>` : ''}
      ${seg}
      <button class="ico" data-a="ui" title="Tema / Theme" aria-label="Tema / Theme">${dark ? '☀' : '☾'}</button>
      ${S.user ? `<button class="btn ghost sm" data-a="logout">${T('logout')}</button>` : S.step === 'entry' ? `<button class="btn sm" data-a="start">${LPT().start}</button>` : ''}
    </div>
    <div class="top-m">${prim}<button class="ico burger" data-a="menu" aria-label="${T('menu_open')}" aria-expanded="${!!S.menu}" aria-controls="drawer"><i></i><i></i><i></i></button></div></header>${drawer}`;
}

function render() {
  document.documentElement.dataset.ui = S.ui;
  if (S.step !== 'editor') S.sheet = false;
  document.body.classList.toggle('menu-open', !!S.menu); document.body.classList.toggle('sheet-open', !!S.sheet);
  const tc = document.querySelector('meta[name=theme-color]'); if (tc) tc.content = S.ui === 'dark' ? '#0b0d0a' : '#f8f9f5';
  const root = $('#root');
  const screens = { entry, ob: onboarding, upload, sheet: sheetPick, preview, mapping: mappingScreen, gen: generating, editor };
  if (S.step !== 'editor') teardownChart();
  landingUnmount();
  root.innerHTML = header() + (S.step === 'editor' ? editor() : S.step === 'entry' ? `<main class="landing">${landingHtml()}</main>` : `<main><div class="screen">${screens[S.step]()}</div></main>`);
  after(S.step);
}
function after(step) {
  if (step === 'entry') landingMount();
  if (step === 'gen') runGeneration();
  if (step === 'editor') { mountChart(); refreshSaveChip(); }
  if (step === 'ob' && OB[S.ob].text) { const t = $('#msg'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }
  if (step === 'upload') { const z = $('.drop'); if (z) wireDrop(z); }
}
const title2 = ([a, b]) => `${esc(a)} <b>${esc(b)}</b>`;

/* ---- entrada ---- */
function entry() { return landingHtml(); }

function recentsHtml() {
  const r = S.recents || [];
  if (!r.length) return '';
  const fmt = t => new Date(t).toLocaleString(LANG === 'pt' ? 'pt-BR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' });
  return `<div class="recents"><div class="row" style="justify-content:space-between"><span class="lbl">[ ${T('rec_h')} ]</span><button class="btn ghost sm" data-a="clear-rec">${T('rec_clear')}</button></div>
    ${r.slice(0, 6).map(p => `<div class="rec"><div><strong>${esc(p.title || p.fileName)}</strong><span class="note">${esc(fmt(p.updated))} · ${esc(p.fileName)} · ${esc(I18N[LANG].chart[p.type] || p.type)}</span></div><div class="row"><button class="btn sm" data-a="open-rec" data-id="${esc(p.id)}">${T('rec_open')}</button><button class="ico" data-a="del-rec" data-id="${esc(p.id)}" title="${T('rec_del')}" aria-label="${T('rec_del')}">×</button></div></div>`).join('')}
    <p class="note" style="margin:6px 0 0">${T('rec_note')}</p></div>`;
}
async function openRecent(id) {
  const rec = await getProject(id); if (!rec) return;
  const d = rec.data;
  d.opts = { ...DEFAULT_OPTS, ...(d.opts || {}) }; d.fontPair = d.fontPair || 'modern';
  const P = { ...d, id: rec.id, host: null, hist: [], hi: -1 };
  P.hist.push(snap(P)); P.hi = 0;
  P.saveName = rec.name || rec.title; S.piece = P; S.ds = null; S.dirty = false; S.fileName = P.fileName; S.isSample = P.isSample; if (P.br) S.br = { ...P.br };
  go('editor');
}

/* ---- onboarding ---- */
function onboarding() {
  const q = OB[S.ob], n = S.ob + 1, val = S.br[q.key];
  const head = `<div class="prog"><span class="lbl">[ ${T('step')} // ${String(n).padStart(2, '0')} ]</span><div class="bar" role="progressbar" aria-valuemin="1" aria-valuemax="6" aria-valuenow="${n}"><i style="width:${(n / 6) * 100}%"></i></div><span class="num">${String(n).padStart(2, '0')}/06</span></div>`;
  let body;
  if (q.text) {
    const len = [...S.br.message].length;
    body = `<textarea class="field" id="msg" maxlength="200" placeholder="${esc(T('q_message_ph'))}" aria-label="${esc(T(q.q).join(' '))}">${esc(S.br.message)}</textarea>
      <div class="row" style="justify-content:space-between;margin-top:8px"><span class="note" id="msg-hint">${len > 90 ? T('chars_long') : T('q_message_hint')}</span><span class="note num" style="font-size:18px" id="msg-n">${T('chars', len)}</span></div>
      <div class="row" style="margin-top:26px"><button class="btn ghost" data-a="ob-back">← ${T('back')}</button><button class="btn" data-a="ob-next" ${S.br.message.trim() ? '' : 'disabled'}>${T('next')} →</button></div>
      <div class="err" id="msg-err" role="alert"></div>`;
  } else {
    const ot = (S.br.other || {})[q.key], isOther = !!(ot && ot.on);
    body = `<div class="opts" role="group">${(q.noOther ? q.opts : [...q.opts, 'other']).map(o => { const [l, d] = I18N[LANG].o[q.key][o]; return `<button class="opt${o === 'other' ? ' other' : ''}" data-a="pick" data-v="${o}" aria-pressed="${o === 'other' ? isOther : !isOther && val === o}"><strong>${esc(l)}</strong><span>${esc(d)}</span></button>`; }).join('')}</div>
      ${isOther ? `<label class="ob-other"><span class="lbl">${T('ob_other_l')}</span><input class="field" id="ob-other" type="text" maxlength="80" value="${esc(ot.text || '')}" placeholder="${esc(T('ob_other_ph')[q.key])}"></label><p class="note" style="margin:6px 0 0">${T('ob_other_note')}</p>` : ''}
      <div class="row"><button class="btn ghost" data-a="ob-back">← ${T('back')}</button>${val ? `<button class="btn" data-a="ob-next">${T('next')} →</button>` : ''}</div>`;
  }
  return `<div class="wrap-narrow">${head}<h2>${title2(T(q.q))}</h2>${body}</div>`;
}

/* ---- upload ---- */
function upload() {
  const loading = S.loading;
  return `<div class="wrap-narrow">
    <div class="lbl">[ ${T('step')} // 07 ]</div><h2 style="margin-top:12px">${title2(T('up_h'))}</h2>
    ${loading ? `<div class="drop"><div class="num" style="font-size:40px">${esc(S.fileName || '')}</div><p id="stage">${T('stage_read')}</p><div class="meter"><i style="width:${Math.round(loading.pct * 100)}%"></i></div><p class="note" id="elapsed" style="margin:12px 0 0"></p><p class="note" id="slowhint" style="margin:6px auto 0;max-width:46ch"></p><div class="row" style="justify-content:center;margin-top:14px"><button class="btn ghost sm" data-a="cancel-load">${T('cancel')}</button></div></div>` :
      `<div class="drop" id="drop"><p style="font-size:19px">${T('up_drop')}</p><p class="note">${T('up_formats')}</p>
        <div class="row" style="justify-content:center;margin-top:18px"><button class="btn" data-a="pick-file">${T('up_pick')}</button><button class="btn ghost" data-a="sample">${T('up_sample')}</button></div>
        <input type="file" id="file" class="sr" accept=".xlsx,.xls,.xlsm,.csv,.tsv,.txt" aria-label="${T('up_pick')}"></div>`}
    ${S.error ? `<div class="err" role="alert">${esc(S.error)}</div>` : ''}
    <div class="lock"><span>🔒</span><span>${T('up_privacy')} ${T('up_privacy2')}</span></div>
    <div class="row" style="margin-top:30px"><button class="btn ghost" data-a="back-to" data-v="ob">← ${T('back')}</button></div>
  </div>`;
}
function wireDrop(z) {
  ['dragenter', 'dragover'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.remove('over'); }));
  z.addEventListener('drop', e => { const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) loadFile(f); });
  const inp = $('#file'); if (inp) inp.addEventListener('change', () => inp.files[0] && loadFile(inp.files[0]));
}

/* ---- aba ---- */
function sheetPick() {
  return `<div class="wrap-narrow"><h2>${title2(T('sheet_h'))}</h2><p class="sub">${T('sheet_p')}</p>
    <div class="opts">${S.sheets.map(n => `<button class="opt" data-a="sheet" data-v="${esc(n)}"><strong>${esc(n)}</strong></button>`).join('')}</div>
    <button class="btn ghost" data-a="back-to" data-v="upload">← ${T('back')}</button></div>`;
}

/* ---- preview ---- */
function piiCols(ds) {
  const out = [];
  ds.columns.forEach(c => {
    let hit = /cpf|cnpj|e-?mail|telefone|phone|celular|^nome|\bname\b|rg$/i.test(c.name);
    if (!hit) {
      const sample = c.texts ? c.texts.filter(Boolean).slice(0, 100) : c.dict ? c.dict.slice(0, 100) : [];
      hit = sample.length > 5 && sample.filter(v => /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(v) || /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)).length / sample.length > 0.5;
    }
    if (hit) out.push(c.name);
  });
  return out;
}
function preview() {
  const ds = S.ds, cols = ds.columns, nullsTot = cols.reduce((a, c) => a + c.nulls, 0);
  const nullCols = cols.filter(c => c.nulls > 0).sort((a, b) => b.nulls - a.nulls).slice(0, 4);
  const amb = cols.find(c => c.kind === 'date' && c.ambiguous);
  const out = cols.filter(c => c.kind === 'number' && c.outliers > 0 && c.outliers / ds.rowCount > 0.005).slice(0, 2);
  const pii = piiCols(ds);
  const head = cols.map((c, i) => `<th class="${c.kind === 'number' || c.kind === 'date' ? 'num-c' : ''}">${esc(c.name)}<select data-c="retype" data-col="${i}" aria-label="${esc(T('kind')[c.kind])}: ${esc(c.name)}">${['date', 'number', 'category', 'geo', 'text'].map(k => `<option value="${k}" ${k === c.kind ? 'selected' : ''}>${T('kind')[k]}</option>`).join('')}</select></th>`).join('');
  const body = ds.preview.map(r => `<tr>${r.map((v, i) => `<td class="${cols[i].kind === 'number' || cols[i].kind === 'date' ? 'num-c' : ''}">${esc(v)}</td>`).join('')}</tr>`).join('');
  return `<div>
    <div class="lbl">[ ${T('step')} // 08 ]</div><h2 style="margin-top:12px">${title2(T('pv_h'))}</h2><p class="sub">${T('pv_p')}</p>
    <div class="stats"><div><span class="num">${fmtInt(ds.rowCount, LANG)}</span><span class="lbl">${T('pv_rows')}</span></div><div><span class="num">${cols.length}</span><span class="lbl">${T('pv_cols')}</span></div><div><span class="num">${fmtInt(ds.dupRows, LANG)}</span><span class="lbl">${T('pv_dups')}</span></div><div><span class="num">${fmtInt(nullsTot, LANG)}</span><span class="lbl">${T('pv_nulls')}</span></div></div>
    <div class="tbl-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
    <div class="grid2"><div class="card"><div class="lbl">[ ${T('q_h')} ]</div>
      <p style="margin:10px 0 0;font-size:14px">${nullCols.length ? nullCols.map(c => `<span class="chip">${esc(c.name)}: ${fmtInt(c.nulls, LANG)} (${(c.nulls / ds.rowCount * 100).toFixed(1).replace('.', LANG === 'pt' ? ',' : '.')}%)</span>`).join(' ') : T('q_none')}</p>
      <div class="lbl" style="margin-top:16px">${T('q_nulls')}</div>
      <div class="radio" role="group">${[['ignore', 'null_ignore'], ['zero', 'null_zero'], ['keep', 'null_keep']].map(([v, k]) => `<button data-a="nulls" data-v="${v}" aria-pressed="${S.nullPolicy === v}">${T(k)}</button>`).join('')}</div>
      <p class="note" style="margin:8px 0 0">${T('null_hint')}</p></div>
      <div>${ds.encoding ? `<div class="note">${T('enc_note', ds.encoding, ds.delimiter)}</div>` : ''}
      ${amb ? `<div class="warn"><span>${T('amb_date', esc(amb.name))}</span><button class="btn ghost sm" data-a="swapdate" data-col="${cols.indexOf(amb)}">${T('amb_swap')}</button></div>` : ''}
      ${pii.map(n => `<div class="warn"><span>${T('pii', esc(n))}</span></div>`).join('')}
      ${out.map(c => `<div class="warn"><span>${T('outl', fmtInt(c.outliers, LANG), esc(c.name))}</span></div>`).join('')}</div></div>
    <div class="row" style="margin-top:30px"><button class="btn ghost" data-a="back-to" data-v="upload">← ${T('back')}</button><button class="btn" data-a="to-mapping">${T('next')} →</button></div>
  </div>`;
}

/* ---- mapeamento ---- */
function kindOk(cols) {
  const m = cols.filter(isMeasure).length, d = cols.filter(isDim).length, t = cols.filter(c => c.kind === 'date').length;
  return { time: t >= 1 && m >= 1, category: d >= 1 && (m >= 1), relation: m >= 2, hist: m >= 1 };
}
const csBlank = reg => Object.fromEntries(reg.fields.map(f => [f.k, f.role === 'agg' ? 'sum' : -1]));
// um bloco por gráfico de canvas registrado: colunas de cada papel + cálculo + resumo do que será desenhado
function csMapBlocks(m, cols, built) {
  const roleF = r => (r === 'ent' ? csIsEntCol : r === 'measure' ? isMeasure : r === 'dim' ? (c => isDim(c) && csAvgLen(c) <= 45) : r === 'period' ? (c => c.kind === 'date' || isDim(c)) : r === 'date' ? (c => c.kind === 'date') : () => true), idx = f => cols.map((c, i) => [c, i]).filter(([c]) => f(c));
  return Object.values(CHART_REG).map(reg => {
    const mp = (m.cs && m.cs[reg.id]) || csBlank(reg), D = built && built.cs && built.cs[reg.id];
    const fields = reg.fields.map(f => f.role === 'agg'
      ? `<label><span class="lbl">${T('cs_agg')}</span><select data-c="mapcs" data-id="${reg.id}" data-f="agg">${(f.aggs || ['sum', 'mean', 'count']).map(a => `<option value="${a}" ${mp.agg === a ? 'selected' : ''}>${T('cs_aggs')[a]}</option>`).join('')}</select></label>`
      : `<label><span class="lbl">${T(f.label)}</span><select data-c="mapcs" data-id="${reg.id}" data-f="${f.k}">${f.none ? `<option value="-1" ${mp[f.k] < 0 ? 'selected' : ''}>${T(f.none)}</option>` : ''}${idx(roleF(f.role)).map(([c, i]) => `<option value="${i}" ${i === mp[f.k] ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>`).join('');
    return `<div class="csmap" data-cs="${reg.id}"><div class="lbl">[ ${T(reg.id + '_h')} ]</div><p class="note" style="margin:4px 0 10px">${T(reg.id + '_help')}</p><div class="fields" style="margin-top:0">${fields}</div><div class="summary"><span class="note">${D ? esc(reg.summary(D)) : T(reg.id + '_none')}</span></div></div>`;
  }).join('');
}
function mappingBody() {
  const cols = S.ds.columns, m = S.mapping, ok = kindOk(cols);
  const idx = f => cols.map((c, i) => [c, i]).filter(([c]) => f(c));
  const sel = (id, label, list, cur, optional) => `<label><span class="lbl">${label}</span><select data-c="map" data-f="${id}">${optional ? `<option value="-1" ${cur < 0 ? 'selected' : ''}>${T('mp_none')}</option>` : ''}${list.map(([c, i]) => `<option value="${i}" ${i === cur ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>`;
  let fields = '';
  if (m.kind === 'time') fields = sel('x', T('mp_x_time'), idx(c => c.kind === 'date'), m.x) + sel('y', T('mp_y'), idx(isMeasure), m.y) + sel('series', T('mp_series'), idx(isDim), m.series, true);
  else if (m.kind === 'category') fields = sel('x', T('mp_x_cat'), idx(isDim), m.x) + sel('y', T('mp_y'), idx(isMeasure), m.y) + sel('series', T('mp_series'), idx(c => isDim(c)).filter(([, i]) => i !== m.x), m.series, true);
  else if (m.kind === 'relation') fields = sel('x', T('mp_x_num'), idx(isMeasure), m.x) + sel('y', T('mp_y_num'), idx(isMeasure), m.y) + sel('size', T('mp_size'), idx(isMeasure), m.size, true) + sel('entity', T('mp_entity'), idx(isDim), m.entity, true) + sel('series', T('mp_series'), idx(isDim), m.series, true);
  else fields = sel('x', T('mp_y'), idx(isMeasure), m.x);
  const aggOpts = [['sum', 'agg_sum'], ['mean', 'agg_mean'], ['count', 'agg_count']];
  const extra = m.kind === 'hist' ? '' : `<label><span class="lbl">${T('mp_agg')}</span><select data-c="map" data-f="agg">${aggOpts.map(([v, k]) => `<option value="${v}" ${m.agg === v ? 'selected' : ''}>${T(k)}</option>`).join('')}</select></label>` +
    (m.kind === 'time' ? `<label><span class="lbl">${T('mp_grain')}</span><select data-c="map" data-f="grain">${['auto', ...GRAINS].map(g => `<option value="${g}" ${m.grain === g ? 'selected' : ''}>${g === 'auto' ? T('grain_auto') : grainName(g, LANG)}</option>`).join('')}</select></label>` : '');
  // visual principal: árvore radial (período > entidade > registro)
  const og = m.org || { hub: -1, entity: -1, color: -1, size: -1, grain: 'auto' };
  const osel = (f, label, list, cur, none) => `<label><span class="lbl">${label}</span><select data-c="maporg" data-f="${f}"><option value="-1" ${cur < 0 ? 'selected' : ''}>${none}</option>${list.map(([c, i]) => `<option value="${i}" ${i === cur ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>`;
  const skipD = new Set([og.hub, og.entity, og.color, og.size].filter(i => i >= 0)), allD = S.ds.columns.map((c, i) => i).filter(i => !skipD.has(i)), curD = new Set(Array.isArray(og.details) ? og.details : orgAutoDetails(S.ds.columns, skipD));
  const detBlock = og.hub >= 0 && og.entity >= 0 && allD.length ? `<div class="detmap"><div class="lbl" style="margin-bottom:6px">${T('org_det_h')}</div><p class="note" style="margin:0 0 8px">${T('org_det_p')}</p><div class="detchips">${allD.map(i => { const c = S.ds.columns[i]; return `<button type="button" class="dchip${curD.has(i) ? ' on' : ''}" data-a="orgdet" data-v="${i}" aria-pressed="${curD.has(i)}">${orgIsLong(c) ? '¶ ' : ''}${esc(c.name)}</button>`; }).join('')}</div></div>` : '';
  const orgBlock = `<div class="orgmap"><div class="lbl">[ ${T('org_h')} ]</div><p class="note" style="margin:4px 0 10px">${T('org_help')}</p><div class="fields" style="margin-top:0">${osel('hub', T('org_hub'), idx(c => c.kind === 'date' || isDim(c)), og.hub, T('org_off'))}${osel('entity', T('org_ent'), idx(isDim).filter(([, i]) => i !== og.hub), og.entity, T('org_off'))}${osel('color', T('org_col'), idx(isDim).filter(([, i]) => i !== og.hub && i !== og.entity), og.color, T('mp_none'))}${osel('size', T('org_size'), idx(isMeasure), og.size, T('org_rowsopt'))}</div>${detBlock}</div>`;
  let sum = '', valid = false, bb = null, orgSum = `<span class="note">${T('org_none')}</span>`;
  try { const b = buildSeries(S.ds, m, { lang: LANG, nullPolicy: S.nullPolicy }); valid = true; bb = b; if (b.org) orgSum = `<span class="num" style="font-size:22px">${T('org_sum', fmtInt(b.org.rowsUsed, LANG), fmtInt(b.org.leaves.length, LANG), b.org.hubs.length, b.org.ents.length)}</span>`; sum = `<span class="num" style="font-size:26px">${T('mp_sum', b.stats)}</span>` + (b.grain ? `<span class="chip">${grainName(b.grain, LANG)}</span>` : ''); }
  catch (e) { sum = `<span class="note">${m.x < 0 || (m.kind !== 'hist' && m.kind !== 'category' && m.y < 0) ? T('mp_err') : T('mp_no_data')}</span>`; }
  const kinds = [['time', 'k_time'], ['category', 'k_category'], ['relation', 'k_relation'], ['hist', 'k_hist']];
  const html = `${['flow', 'geo'].includes(S.br.story) ? `<div class="warn"><span>${T('flow_note')}</span></div>` : ''}
    ${orgBlock}
    <details class="orgmap"><summary class="lbl" style="cursor:pointer">[ ${T('cs_more')} ]</summary>${csMapBlocks(m, cols, bb)}</details>
    <details class="orgmap"><summary class="lbl" style="cursor:pointer">[ ${T('org_other')} ]</summary>
    <div class="fields"><label><span class="lbl">${T('mp_kind')}</span><select data-c="mkind">${kinds.map(([k, l]) => `<option value="${k}" ${m.kind === k ? 'selected' : ''} ${ok[k] ? '' : 'disabled'}>${T(l)}</option>`).join('')}</select></label>${fields}${extra}</div>
    <div class="summary" style="margin-top:16px">${sum}</div></details>
    ${S.error ? `<div class="err" role="alert">${esc(S.error)}</div>` : ''}
    <div class="summary">${orgSum}</div>`;
  return { html, valid };
}
function mappingScreen() {
  const mb = mappingBody();
  return `<div class="wrap-narrow" style="max-width:860px">
    <div class="lbl">[ ${T('step')} // 09 ]</div><h2 style="margin-top:12px">${title2(T('mp_h'))}</h2><p class="sub">${T('mp_p')}</p>
    ${mb.html}
    <div class="row" style="margin-top:30px"><button class="btn ghost" data-a="back-to" data-v="preview">← ${T('back')}</button><button class="btn" data-a="generate" ${mb.valid ? '' : 'disabled'}>${T('generate')} →</button></div></div>`;
}

/* ---- editar mapeamento (modal) e troca de planilha ---- */
const mapChanged = () => (S.mapModal ? refreshMapModal() : render());
function mapModalHtml() {
  const ds = S.ds, cols = ds.columns, mb = mappingBody(); S._mmValid = mb.valid;
  const head = cols.map((c, i) => `<th class="${c.kind === 'number' || c.kind === 'date' ? 'num-c' : ''}"><input class="mm-name" data-c="mmname" data-col="${i}" value="${esc(c.name)}" aria-label="${T('mm_rename')}"><select data-c="retype" data-col="${i}" aria-label="${esc(T('kind')[c.kind])}: ${esc(c.name)}">${['date', 'number', 'category', 'text'].map(k => `<option value="${k}" ${c.kind === k ? 'selected' : ''}>${T('kind')[k]}</option>`).join('')}</select></th>`).join('');
  const body = ds.preview.slice(0, 8).map(r => `<tr>${r.map((v, i) => `<td class="${cols[i].kind === 'number' || cols[i].kind === 'date' ? 'num-c' : ''}">${esc(v)}</td>`).join('')}</tr>`).join('');
  return `<div class="mm"><div class="mm-top"><span class="note">${T('mm_file', esc(S.fileName || ''), fmtInt(ds.rowCount, LANG), cols.length)}</span><button type="button" class="btn ghost sm" data-a="mm-upload">${T('mm_upload')}</button></div>
    <p class="note" style="margin:0 0 4px">${T('mm_note')}</p>${mb.html}
    <div class="lbl" style="margin:22px 0 8px">[ ${T('mm_cols')} ]</div><div class="tbl-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></div>`;
}
function refreshMapModal() {
  const b = $('.mdl .mdl-b'); if (!b) return;
  const a = document.activeElement, key = a && a.dataset && (a.dataset.f || a.dataset.col || a.dataset.v) ? `[data-c="${a.dataset.c}"]${a.dataset.f ? `[data-f="${a.dataset.f}"]` : ''}${a.dataset.col ? `[data-col="${a.dataset.col}"]` : ''}` : null;
  const open = [...b.querySelectorAll('details')].map(d => d.open), sc = b.scrollTop;
  b.innerHTML = mapModalHtml(); b.querySelectorAll('details').forEach((d, i) => { d.open = !!open[i]; }); b.scrollTop = sc;
  if (S.mapFocus) { const id = S.mapFocus; S.mapFocus = null; const el = b.querySelector(id === 'organism' ? '.orgmap' : `.csmap[data-cs="${id}"]`); if (el) { const d = el.closest('details'); if (d) d.open = true; el.classList.add('flash'); setTimeout(() => el.scrollIntoView({ block: 'center' }), 30); } }
  const ap = $('.mdl [data-m="0"]'); if (ap) ap.disabled = !S._mmValid;
  if (key) { const n = b.querySelector(key); if (n) n.focus({ preventScroll: true }); }
}
function openMapModal() {
  if (!S.ds) {
    modal({ title: T('mm_title'), body: `<p class="note" style="margin:0">${T('rec_none_data')}</p>`, actions: [{ label: T('mm_upload'), v: 'up', kind: 'primary' }, { label: T('mdl_cancel'), v: null, kind: 'text' }] }).then(r => { if (r && r.v === 'up') pickReplace(); });
    return;
  }
  const backup = { mapping: JSON.parse(JSON.stringify(S.mapping)), cols: S.ds.columns.slice(), names: S.ds.columns.map(c => c.name) };
  S.mapModal = true;
  modal({ title: T('mm_title'), wide: true, body: mapModalHtml(), actions: [{ label: T('mm_apply'), v: 'apply', kind: 'primary', check: () => S._mmValid }, { label: T('mdl_cancel'), v: null, kind: 'text' }] }).then(r => {
    S.mapModal = false;
    if (r && r.v === 'apply') applyMapping(T('mm_applied'));
    else { S.mapping = backup.mapping; S.ds.columns = backup.cols; S.ds.columns.forEach((c, i) => { c.name = backup.names[i]; }); }
  });
  setTimeout(refreshMapModal, 0);
}
// refaz a peça com o mapeamento atual, mantendo o estilo (paleta, fundo, fontes, textos editados)
function applyMapping(msg, undo, wantType) {
  const old = S.piece; if (!old) return;
  teardownChart();
  const np = makePiece();
  Object.assign(np, { id: old.id, saveName: old.saveName, palId: old.palId, colors: old.colors, bg: old.bg, fontPair: old.fontPair, opts: old.opts, title: old.title, subtitle: old.subtitle, foot: old.foot, sort: old.sort, big: old.big, place: old.place });
  np.type = wantType && np.choice.all.includes(wantType) ? wantType : np.choice.all.includes(old.type) ? old.type : np.choice.primary;
  np.hist = old.hist.slice(0, old.hi + 1); np.hi = old.hi; S.piece = np; pushHist(); S.dirty = true;
  const prev = undo || { piece: old, mapping: S._prevMapping, ds: S._prevDs };
  render();
  toast(msg, { label: T('mm_undo'), fn: () => { teardownChart(); S.piece = prev.piece; if (prev.mapping) S.mapping = prev.mapping; if (prev.ds) S.ds = prev.ds; S.dirty = true; render(); } });
}
/* ---- escolher um gráfico: se os dados comportam, troca; se não, tenta ajustar o mapeamento (com desfazer) ou leva ao bloco certo ---- */
function pickChart(t) {
  const P = S.piece; if (!P) return;
  if (P.choice.all.includes(t)) { if (P.type !== t) { P.type = t; npsSession.switched = true; pushHist(); refreshAll(true); } return; }
  if (!S.ds) { toast(T('chart_nodata')); return; }
  const cols = S.ds.columns, canvas = t === 'organism' || !!CHART_REG[t];
  const tryMap = (story, opt) => { try { const m = suggestMapping(story, cols, opt || {}), b = buildSeries(S.ds, m, { lang: LANG, nullPolicy: S.nullPolicy }); return availableCharts(b).includes(t) ? m : null; } catch (e) { return null; } };
  let m = null;
  if (!canvas) { const tries = { line: ['time'], area: ['time'], race: ['time'], calendar: [['distribution', { hist: false }]], bars: ['compare'], hbars: ['compare'], stacked100: ['composition', 'time'], treemap: ['composition', 'compare'], scatter: ['relation'], bubble: ['relation'] }[t] || []; for (const tr of tries) { m = Array.isArray(tr) ? tryMap(tr[0], tr[1]) : tryMap(tr); if (m) break; } }
  if (m) { const prev = S.mapping; S.mapping = m; applyMapping(T('chart_remapped', T('chart')[t]), { piece: P, mapping: prev, ds: S.ds }, t); return; }
  if (canvas) { S.mapFocus = t; openMapModal(); }
  toast(T('chart_cant', T('chart')[t], T('why_' + t)));
}
function pickReplace() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.xlsx,.xls,.xlsm,.csv,.tsv,.txt';
  inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) replaceSheet(f); };
  inp.click();
}
async function replaceSheet(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!['xlsx', 'xls', 'xlsm', 'csv', 'tsv', 'txt'].includes(ext)) { toast(T('up_bad')); return; }
  const o = S.piece && S.piece.built.org, strip = n => (n || '').replace(/ \(.*\)$/, '');
  const csNames = {}; if (S.piece) for (const id in CHART_REG) { const D = S.piece.built.cs && S.piece.built.cs[id]; if (D) csNames[id] = CHART_REG[id].names(D); }
  S.replace = { prevDs: S.ds, prevMapping: S.mapping, csNames, names: o ? { hub: strip(o.hubName), entity: o.entName, color: o.colName, size: ['Linhas', 'Rows'].includes(o.sizeName) ? null : o.sizeName } : null };
  S.isSample = false; S._prevMapping = S.mapping; S._prevDs = S.ds;
  loadBuffer(file.name, await file.arrayBuffer());
}
function finishReplace(m) {
  const r = S.replace; S.replace = null; S.loading = null;
  if (!m.rowCount || !m.columns.length) { S.ds = r.prevDs; go('editor'); toast(T('up_empty')); return; }
  S.ds = m; S.fileName = m.fileName; S.mapping = defaultMapping();
  // mantém os papéis das colunas quando a nova planilha tem colunas com os mesmos nomes
  if (r.names && S.mapping.org) { const find = n => (n ? m.columns.findIndex(c => c.name.toLowerCase() === n.toLowerCase()) : -1); for (const k of ['hub', 'entity', 'color', 'size']) { const i = find(r.names[k]); if (i >= 0) S.mapping.org[k] = i; } delete S.mapping.org.details; }
  for (const id in (r.csNames || {})) { const mp = S.mapping.cs && S.mapping.cs[id] || (S.mapping.cs = S.mapping.cs || {}, S.mapping.cs[id] = csBlank(CHART_REG[id])), nm = r.csNames[id]; for (const k in nm) { const i = nm[k] ? m.columns.findIndex(c => c.name.toLowerCase() === nm[k].toLowerCase()) : -1; if (i >= 0) mp[k] = i; } delete mp.details; }
  S.piece.fileName = m.fileName; S.isSample = false;
  applyMapping(T('mm_replaced'), { piece: S.piece, mapping: r.prevMapping, ds: r.prevDs });
}

/* ---- geração ---- */
// mesma tela de carregamento da página inicial (SVG da árvore, marca, barra), agora com o texto "Organizando seus dados"
function generating() {
  const src = decB64('splash-html').split('<script>')[0], tmp = document.createElement('div'); tmp.innerHTML = src;
  const inner = tmp.querySelector('.in'); if (!inner) return `<div class="gen"><h2>${T('gen_h')}</h2></div>`;
  const tag = inner.querySelector('.tag'), st = inner.querySelector('.st');
  if (tag) { tag.removeAttribute('id'); tag.innerHTML = T('gen_h').toUpperCase().replace(/(\S+)$/, '<b>$1</b>'); }
  if (st) { st.removeAttribute('id'); st.id = 'gen-st'; st.textContent = T('gen_1') + '…'; }
  return `<div id="dvs" class="gen-s" role="status" aria-live="polite"><div class="in">${inner.innerHTML}</div></div>`;
}
function runGeneration() {
  const t0 = performance.now(), total = RM ? 250 : 2900, st = $('#gen-st');
  [[T('gen_1'), 0], [T('gen_2'), 0.36], [T('gen_3'), 0.7]].forEach(([txt, f]) => setTimeout(() => { const e = $('#gen-st'); if (e && S.step === 'gen') e.textContent = txt + '…'; }, total * f));
  let piece, err;
  setTimeout(() => { try { piece = makePiece(); } catch (e) { err = e; } }, 60); // deixa a tela aparecer antes do cálculo
  setTimeout(() => { if (S.step !== 'gen') return; if (err) return go('mapping', T('mp_no_data')); S.piece = piece; go('editor'); npsTrack('gen'); npsSession.switched = false; npsMoment('gen'); }, Math.max(0, total - (performance.now() - t0)));
}

/* ---- animação de pontos (identidade Doto) ---- */
function dotsAnimate(canvas, { duration = 0, loop = false } = {}) {
  const ctx = canvas.getContext('2d'), dpr = devicePixelRatio || 1;
  const w = canvas.clientWidth || 600, h = canvas.clientHeight || 300;
  canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
  const gap = Math.max(10, Math.round(w / 48)), cols = Math.floor(w / gap), rows = Math.floor(h / gap), ox = (w - cols * gap) / 2 + gap / 2, oy = (h - rows * gap) / 2 + gap / 2;
  const lime = '#d4ff00', dim = getComputedStyle(document.documentElement).getPropertyValue('--line').trim() || '#272c23';
  const targets = [];
  const hts = i => 0.2 + 0.7 * Math.abs(Math.sin(i * 0.43 + 0.6) * Math.cos(i * 0.13 + 1.1));
  const seedR = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  for (let i = 0; i < cols; i++) for (let r = 0; r < rows; r++) targets.push({ i, r, on: r >= rows - Math.round(hts(i) * rows) });
  const t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    if (!canvas.isConnected) return;
    const el = now - t0, p = duration ? Math.min(1, el / duration) : 1, e = ease(p);
    ctx.clearRect(0, 0, w, h);
    targets.forEach((d, k) => {
      const tx = ox + d.i * gap, ty = oy + d.r * gap;
      let x = tx, y = ty, on = d.on, a = 1;
      if (loop) { const wave = 0.5 + 0.5 * Math.sin(el / 900 + d.i * 0.45); const lim = rows - Math.round((0.18 + 0.72 * wave * hts(d.i) / 0.9) * rows); on = d.r >= lim; }
      else if (!RM && duration && d.on) { x = ox + seedR(k) * (cols * gap) * (1 - e) + (tx - ox) * e; y = oy + seedR(k + 999) * (rows * gap) * (1 - e) + (ty - oy) * e; }
      ctx.fillStyle = on ? lime : dim; ctx.globalAlpha = on ? (loop ? 1 : 0.35 + 0.65 * e) : 0.55;
      ctx.beginPath(); ctx.arc(x, y, on ? gap * 0.22 : gap * 0.11, 0, 6.283); ctx.fill();
    });
    if (loop ? !RM : p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------------- a peça ---------------- */
function makePiece() {
  const built = buildSeries(S.ds, S.mapping, { lang: LANG, nullPolicy: S.nullPolicy });
  const narrow = S.br.place === 'mobile' || innerWidth < 640;
  const choice = chooseChart({ ...S.br, narrow }, S.mapping, built);
  const reg = CHART_REG[choice.primary], csD = reg && built.cs && built.cs[choice.primary];
  const insights = csD && reg.insights ? reg.insights(csD, S.br, LANG, T) : computeInsights(built, S.br, LANG, T);
  const tone = TONE_DEFAULT[S.br.tone] || TONE_DEFAULT.corporate;
  S.dirty = true;
  const P = { built, choice, insights, type: choice.primary, palId: tone.pal, colors: PALETTES[tone.pal].slice(), bg: { ...tone.bg }, id: newId(), hadIns: insights.length > 0, title: S.br.message.trim(), subtitle: null, foot: null, fontPair: tone.pair, opts: { ...DEFAULT_OPTS }, br: { ...S.br }, big: S.br.place === 'projector', place: S.br.place, fileName: S.fileName, isSample: S.isSample, lang: LANG, sort: 'value', host: null, hist: [], hi: -1 };
  P.hist.push(snap(P)); P.hi = 0;
  return P;
}
const snap = P => JSON.stringify({ type: P.type, palId: P.palId, colors: P.colors, bg: P.bg, title: P.title, sort: P.sort, fontPair: P.fontPair, opts: P.opts, subtitle: P.subtitle, foot: P.foot, insights: P.insights });
function pushHist() { const P = S.piece; P.hist = P.hist.slice(0, P.hi + 1); const s = snap(P); if (P.hist[P.hi] === s) return; P.hist.push(s); P.hi++; if (P.hist.length > 60) { P.hist.shift(); P.hi--; } markDirty(); refreshBar(); }
const canUndo = () => S.piece && S.piece.hi > 0;
const canRedo = () => S.piece && S.piece.hi < S.piece.hist.length - 1;
function restore(dir) { const P = S.piece; const ni = P.hi + dir; if (ni < 0 || ni >= P.hist.length) return; P.hi = ni; Object.assign(P, JSON.parse(P.hist[ni])); syncTexts(); refreshAll(true); markDirty(); }
// textos editáveis: devolve ao DOM o que o histórico restaurou
function syncTexts() {
  const P = S.piece, set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  set('#ptitle', P.title); set('#psub', subtitleOf(P)); set('#pfoot', footOf(P));
  const ins = $('#pins'); if (ins) ins.innerHTML = insightsHtml(P, true);
}
/* ---- salvar: só quando a pessoa pede; "não salvo" avisa antes de sair ---- */
function markDirty() { S.dirty = true; refreshSaveChip(); }
function refreshSaveChip() { const c = $('#savechip'); if (c) { c.textContent = S.dirty ? '● ' + T('unsaved') : '✓ ' + T('saved'); c.classList.toggle('dirty', !!S.dirty); } }
async function saveNow(name) {
  const P = S.piece; if (!P) return;
  P.saveName = (name || '').trim() || P.saveName || P.title || P.fileName;
  await saveProject(P); S.recents = (await listProjects()) || []; S.dirty = false; refreshSaveChip(); toast(T('saved_toast'));
}
async function askName(P) {
  const r = await modal({ title: T('mdl_savename_t'), input: { label: T('mdl_name'), value: P.saveName || P.title || P.fileName || '' }, actions: [{ label: T('mdl_save'), v: 'save', kind: 'primary' }, { label: T('mdl_cancel'), v: null, kind: 'text' }] });
  return r && r.v === 'save' ? r.text : null;
}
async function saveFlow() { const P = S.piece; if (!P) return false; const n = P.saveName || (await askName(P)); if (n === null) return false; await saveNow(n); return true; }
// devolve true para seguir. kind 'exit' (Sair): Salvar / Não salvar. Os demais: Salvar / Não salvar / Cancelar.
async function guard(kind) {
  if (!(S.step === 'editor' && S.piece && S.dirty)) return true;
  const P = S.piece, name = P.saveName || P.title || P.fileName || '';
  const acts = [{ label: T('mdl_save'), v: 'save', kind: 'primary' }, { label: T('mdl_nosave'), v: 'discard', kind: 'ghost' }];
  if (kind !== 'exit') acts.push({ label: T('mdl_cancel'), v: null, kind: 'text' });
  const r = await modal({ title: T('mdl_save_t'), body: `<p class="note" style="margin:0 0 14px">${T('mdl_save_p', esc(name))}</p>`, input: { label: T('mdl_name'), value: name }, actions: acts });
  if (!r || r.v === null) return false;
  if (r.v === 'save') await saveNow(r.text);
  return true;
}
function closeProject() { teardownChart(); S.piece = null; S.ds = null; S.mapping = null; S.dirty = false; S.br = { audience: null, decision: null, message: '', story: null, tone: null, place: null, other: {} }; }
window.addEventListener('beforeunload', e => { if (S.step === 'editor' && S.piece && S.dirty) { e.preventDefault(); e.returnValue = ''; } });
function refreshBar() { refreshSaveChip(); $$('[data-a=undo]').forEach(b => (b.disabled = !canUndo())); $$('[data-a=redo]').forEach(b => (b.disabled = !canRedo())); }

function editor() {
  const P = S.piece;
  return `<div class="editor${S.panelOpen ? '' : ' nopanel'}${S.sheet ? ' sheet-open' : ''}" id="editor"><div class="stage">${pieceHtml(P, { editable: true })}</div>
    <div class="sheet" id="sheet"><div class="sheet-h" id="sheet-h"><i class="grab" aria-hidden="true"></i><span class="lbl">[ ${T('sheet_h')} ]</span><button class="ico" data-a="sheet-close" aria-label="${T('sheet_close')}">✕</button></div>
      <aside class="panel" id="panel" aria-label="Editor">${panel()}</aside></div>
    <nav class="mbar" aria-label="${T('sheet_h')}"><button class="ico" data-a="undo" aria-label="${T('undo')}" ${canUndo() ? '' : 'disabled'}>↶</button><button class="ico" data-a="redo" aria-label="${T('redo')}" ${canRedo() ? '' : 'disabled'}>↷</button>
      <button class="btn" data-a="sheet-toggle" aria-expanded="${!!S.sheet}" aria-controls="sheet">✎ ${T('m_edit')}</button><button class="btn ghost" data-a="present">▶ ${T('m_present')}</button></nav></div>`;
}
function panel() {
  const P = S.piece, base = bgBase(P.bg), low = P.colors.filter(c => contrast(c, base) < 3).length;
  // todos os gráficos, sempre: recomendados (sugerido + alternativas), outros disponíveis e os que precisam de outros dados (com o motivo)
  const avail = new Set(P.choice.all), rec = [P.choice.primary, ...P.choice.alts], more = P.choice.all.filter(t => !rec.includes(t)), need = ALL_CHARTS.filter(t => !avail.has(t));
  const typeBtn = (t, tag) => `<button class="type" data-a="type" data-v="${t}" aria-pressed="${P.type === t}"><small>${tag || '&nbsp;'}</small>${T('chart')[t]}</button>`;
  const offBtn = t => `<button class="type off" data-a="type" data-v="${t}" aria-pressed="false" title="${esc(T('why_' + t))}"><small>${T('tg_fix')}</small>${T('chart')[t]}<span class="why">${esc(T('why_' + t))}</span></button>`;
  const types = `<div class="types">${rec.map((t, i) => typeBtn(t, i === 0 ? T('tg_sug') : T('tg_alt'))).join('')}</div>`
    + (more.length ? `<h4 class="tg-sub">${T('tg_more')}</h4><div class="types">${more.map(t => typeBtn(t)).join('')}</div>` : '')
    + (need.length ? `<h4 class="tg-sub">${T('tg_need')}</h4><div class="types">${need.map(offBtn).join('')}</div>` : '');
  return `<section><h3>[ ${T('tg_h')} · ${T('tg_all', ALL_CHARTS.length)} ]</h3><h4 class="tg-sub first">${T('tg_rec')}</h4>${types}</section>
  <section><h3>[ ${T('pal_h')} ]</h3><div class="pals">${Object.keys(PALETTES).map(id => `<button class="pal" data-a="pal" data-v="${id}" aria-pressed="${P.palId === id}"><span>${T('pal')[id]}</span><span class="sw">${PALETTES[id].slice(0, 5).map(c => `<i style="background:${c}"></i>`).join('')}</span></button>`).join('')}</div>
    <div class="picker"><input type="color" id="accent" value="${P.colors[0]}" aria-label="${T('pal_accent')}"><span class="note">${T('pal_accent')}</span></div>
    <div class="aa ${low ? 'low' : 'ok'}">${low ? '⚠ ' + T('aa_low', low) : '✓ ' + T('aa_ok')}</div></section>
  <section><h3>[ ${T('bg_h')} ]</h3><div class="bgs">${[['light', 'bg_light', '#f7f8f4'], ['dark', 'bg_dark', '#0b0d0a'], ['solid', 'bg_solid', P.bg.color], ['gradient', 'bg_grad', P.bg.base]].map(([m, k, c]) => `<button data-a="bg" data-v="${m}" aria-pressed="${P.bg.mode === m}"><i style="background:${m === 'gradient' ? `linear-gradient(135deg,${c},${mixHex(c, P.colors[0], 0.3)})` : c}"></i>${T(k)}</button>`).join('')}</div>
    ${P.bg.mode === 'solid' || P.bg.mode === 'gradient' ? `<div class="picker"><input type="color" id="bgcolor" value="${P.bg.mode === 'solid' ? P.bg.color : P.bg.base}" aria-label="${T('bg_h')}"></div>` : ''}</section>
  <section><h3>[ ${T('font_h')} ]</h3><div class="fonts">${Object.keys(FONT_PAIRS).map(k => `<button class="fpair" data-a="font" data-v="${k}" aria-pressed="${P.fontPair === k}"><span class="fs" style="font-family:${FONT_PAIRS[k].title.replace(/"/g, "'")}">Aa</span><span>${FONT_PAIRS[k].sample}</span></button>`).join('')}</div></section>
  <section><h3>[ ${T('opt_h')} ]</h3><div class="sws">${[['legend', 'opt_legend'], ['grid', 'opt_grid'], ['labels', 'opt_labels'], ['annotations', 'opt_ann'], ['notes', 'opt_notes']].map(([k, l]) => `<button class="sw2" role="switch" data-a="opt" data-v="${k}" aria-checked="${k === 'labels' ? !!P.opts[k] : P.opts[k] !== false}"><span>${T(l)}</span><i></i></button>`).join('')}</div><p class="note" style="margin:8px 0 0">${T('labels_hint')} ${T('edit_hint')}</p></section>
  <section><h3>[ ${T('ex_h')} ]</h3><div class="exps"><button class="btn sm" data-a="present">▶ ${T('present')}</button><button class="btn ghost sm" data-a="ex" data-v="html">${T('ex_html')}</button><button class="btn ghost sm" data-a="ex" data-v="png">${T('ex_png')}</button><button class="btn ghost sm" data-a="ex" data-v="png2">${T('ex_png2')}</button><button class="btn ghost sm" data-a="ex" data-v="steps">${T('ex_steps')}</button></div>
    <p class="note" style="margin:10px 0 0" id="exstat" role="status">${T('ex_note')}</p><p class="note" style="margin:4px 0 0">${T('present_hint')}</p></section>
  <section><h3>[ ${T('data_h')} ]</h3><button class="btn ghost sm" data-a="edit-data">${T('edit_data')}</button></section>${npsOn() ? `<section><h3>[ ${T('nps_fb_h')} ]</h3><button class="btn ghost sm" data-a="feedback">${T('nps_fb')}</button></section>` : ''}`;
}

/* ---------------- Vizzu no editor ---------------- */
async function mountChart() {
  const P = S.piece; if (!P) return;
  applyPieceCss(P);
  const box = $('#vz');
  try {
    if (S.step !== 'editor' || S.piece !== P) return;
    const host = await createChartHost({
      P, root: $('#piece'),
      hooks: { getType: () => P.type, getSort: () => P.sort, onSort: m => { P.sort = m; pushHist(); host.resort(); } },
    });
    if (S.step !== 'editor' || S.piece !== P) { host.destroy(); return; }
    P.host = host;
    await host.mount(1.8);
  } catch (e) {
    console.error(e);
    box.innerHTML = `<div class="err">${esc(T('err_title'))}: ${esc(e && e.message || e)}</div>`;
  }
}
function teardownChart() { const P = S.piece; if (P && P.host) { P.host.destroy(); P.host = null; } }
async function refreshAll(withConfig) {
  const P = S.piece; applyPieceCss(P); const pn = $('#panel'); if (pn) pn.innerHTML = panel(); refreshBar();
  if (!P.host) return;
  if (withConfig) await P.host.setType(P.type); else await P.host.restyle();
}

/* ---------------- menu (gaveta) e painel em folha: celular e tablet vertical ---------------- */
function setMenu(on, quiet) {
  S.menu = !!on; const d = $('#drawer'); if (!d) return;
  d.classList.toggle('open', S.menu); d.setAttribute('aria-hidden', String(!S.menu)); document.body.classList.toggle('menu-open', S.menu);
  const b = $('.burger'); if (b) { b.setAttribute('aria-expanded', String(S.menu)); b.setAttribute('aria-label', T(S.menu ? 'menu_close' : 'menu_open')); }
  if (quiet) return;
  if (S.menu) setTimeout(() => { const c = d.querySelector('.dr-h .ico'); if (c) c.focus(); }, 30); else if (b) b.focus();
}
function setSheet(on) {
  S.sheet = !!on; const ed = $('#editor'); if (!ed) return;
  ed.classList.toggle('sheet-open', S.sheet); document.body.classList.toggle('sheet-open', S.sheet);
  const b = $('.mbar [data-a=sheet-toggle]'); if (b) b.setAttribute('aria-expanded', String(S.sheet));
  const sh = $('#sheet'); if (sh) sh.style.transform = '';
  if (S.sheet) { setTimeout(() => { const v = $('#vz'); if (v && v.scrollIntoView) v.scrollIntoView({ block: 'start', behavior: RM ? 'auto' : 'smooth' }); }, 80); }
}
function openIosInstall() {
  modal({ title: T('m_ios_h'), body: `<ol class="ios-steps">${T('m_ios').map(x => `<li>${esc(x)}</li>`).join('')}</ol><p class="note" style="margin:10px 0 0">${T('m_ios_note')}</p>`, actions: [{ label: T('nps_close'), v: null, kind: 'primary' }] });
}
// arrastar a alça para baixo fecha o painel
(() => {
  let y0 = null, dy = 0;
  document.addEventListener('pointerdown', e => { const h = e.target.closest('#sheet-h'); if (!h || e.target.closest('button')) return; y0 = e.clientY; dy = 0; h.setPointerCapture(e.pointerId); });
  document.addEventListener('pointermove', e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); const sh = $('#sheet'); if (sh) sh.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (y0 === null) return; const sh = $('#sheet'); y0 = null; if (dy > 90) setSheet(false); else if (sh) sh.style.transform = ''; };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
})();

/* ---------------- eventos ---------------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]'); if (!t) return;
  const a = t.dataset.a, v = t.dataset.v;
  const P = S.piece;
  if (S.menu && t.closest('#drawer') && !['lang', 'ui', 'menu', 'menu-close'].includes(a)) setMenu(false, true); // a gaveta fecha ao escolher um item
  switch (a) {
    case 'lang': setLang(v); if (S.step === 'editor') { rebuildPieceForLang(); } render(); break;
    case 'ui': S.ui = S.ui === 'dark' ? 'light' : 'dark'; render(); break;
    case 'guest': { const x = $('.mdl .mdl-x'); if (x) x.click(); S.user = { guest: true }; S.ob = 0; go('ob'); break; }
    case 'start': if (!S.user) S.user = { guest: true }; S.ob = 0; go('ob'); break;
    case 'anchor': { e.preventDefault(); const el = document.getElementById((t.getAttribute('href') || '').slice(1)); if (el) el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); break; }
    case 'pick': {
      const key = OB[S.ob].key; if (!S.br.other) S.br.other = {};
      if (v === 'other') { const prev = S.br.other[key]; S.br.other[key] = { on: true, text: prev ? prev.text : '' }; S.br[key] = obResolve(key, S.br.other[key].text); render(); setTimeout(() => { const i = $('#ob-other'); if (i) i.focus(); }, 30); break; }
      S.br.other[key] = null; S.br[key] = v; $$('.opt').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); setTimeout(() => { if (S.step === 'ob') nextOb(); }, RM ? 0 : 220); break; }
    case 'ob-next': nextOb(); break;
    case 'ob-back': if (S.ob === 0) go('entry'); else { S.ob--; render(); } break;
    case 'pick-file': $('#file') && $('#file').click(); break;
    case 'sample': S.isSample = true; loadBuffer('exemplo-vendas.csv', sampleCsv()); break;
    case 'sheet': S.loading = { stage: 'read', pct: 0.5, t0: Date.now(), size: 0, got: true }; S.step = 'upload'; render(); getWorker().postMessage({ type: 'sheet', name: v }); startLoadTicker(); break;
    case 'cancel-load': cancelLoad(); break;
    case 'panel': S.panelOpen = !S.panelOpen; lsSet('dv-panel', S.panelOpen ? '1' : '0'); { const ed = $('#editor'); if (ed) ed.classList.toggle('nopanel', !S.panelOpen); t.setAttribute('aria-pressed', S.panelOpen); } break;
    case 'orgdet': { const og = S.mapping.org, cols = S.ds.columns, skip = new Set([og.hub, og.entity, og.color, og.size].filter(i => i >= 0)); const cur = new Set(Array.isArray(og.details) ? og.details : orgAutoDetails(cols, skip)), i = +v; cur.has(i) ? cur.delete(i) : cur.add(i); og.details = [...cur].sort((a, b) => (orgIsLong(cols[a]) - orgIsLong(cols[b])) || a - b); mapChanged(); break; }
    case 'back-to': go(v === 'ob' ? 'ob' : v); if (v === 'ob') { S.ob = 5; render(); } break;
    case 'nulls': S.nullPolicy = v; $$('.radio button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); break;
    case 'swapdate': getWorker().postMessage({ type: 'retype', col: +t.dataset.col, kind: 'date', order: 'MDY' }); break;
    case 'to-mapping': go('mapping'); break;
    case 'generate': go('gen'); break;
    case 'type': pickChart(v); break;
    case 'pwa-install': pwaInstall(); break;
    case 'pal': if (P) { P.palId = v; P.colors = PALETTES[v].slice(); pushHist(); refreshAll(false); } break;
    case 'bg': if (P) { const cur = bgBase(P.bg); P.bg = v === 'light' || v === 'dark' ? { ...P.bg, mode: v } : { ...P.bg, mode: v, [v === 'solid' ? 'color' : 'base']: cur }; pushHist(); refreshAll(false); } break;
    case 'present': if (P && P.host) { P.pres = startPresentation({ root: $('#piece'), ix: P.host.ix, P, onEnd: n => { npsTrack('pres'); if (n >= 2) npsMoment('pres'); } }); } break;
    case 'feedback': npsManual(); break;
    case 'menu': setMenu(!S.menu); break;
    case 'menu-close': setMenu(false); break;
    case 'sheet-toggle': setSheet(!S.sheet); break;
    case 'sheet-close': setSheet(false); break;
    case 'pwa-ios': openIosInstall(); break;
    case 'privacy': openPrivacy(); break;
    case 'ex': if (P) doExport(v); break;
    case 'undo': restore(-1); break;
    case 'redo': restore(1); break;
    case 'home': guard('home').then(ok => { if (!ok) return; closeProject(); go('entry'); }); break;
    case 'new': guard('new').then(ok => { if (!ok) return; closeProject(); S.ob = 0; go(S.user ? 'ob' : 'entry'); }); break;
    case 'logout': guard('exit').then(ok => { if (!ok) return; closeProject(); S.user = null; go('entry'); }); break;
    case 'save': saveFlow(); break;
    case 'edit-data': openMapModal(); break;
    case 'mm-upload': { const x = $('.mdl-x'); if (x) x.click(); pickReplace(); break; }
    case 'opt': if (P) { P.opts[v] = P.opts[v] === false || !P.opts[v] ? true : false; if (v === 'annotations' || v === 'notes') { applyPieceCss(P); const pn = $('#panel'); if (pn) pn.innerHTML = panel(); pushHist(); } else { pushHist(); refreshAll(v !== 'grid'); } } break;
    case 'font': if (P && P.fontPair !== v) { P.fontPair = v; pushHist(); Promise.all(['600 20px Lora', '600 20px "Geist Mono"', '400 14px Geist'].map(f => document.fonts.load(f).catch(() => 0))).then(() => refreshAll(false)); } break;
    case 'idel': if (P) { P.insights.splice(+t.dataset.i, 1); $('#pins').innerHTML = insightsHtml(P, true); pushHist(); } break;
    case 'projects': openProjects(); break;
    case 'open-rec': { const id = t.dataset.id, x = $('.mdl .mdl-x'); if (x) x.click(); guard('new').then(ok => { if (ok) openRecent(id); }); break; }
    case 'del-rec': {
      // duas etapas: o primeiro clique pede confirmação no próprio botão
      if (!t.dataset.armed) { t.dataset.armed = '1'; t.textContent = t.dataset.cf; clearTimeout(t._t); t._t = setTimeout(() => { delete t.dataset.armed; t.textContent = t.dataset.lbl; }, 3500); break; }
      deleteProject(t.dataset.id).then(async () => { S.recents = (await listProjects()) || []; refreshProjects(); if (S.step !== 'entry') render(); }); break; }
    case 'clear-rec': clearProjects().then(() => { S.recents = []; refreshProjects(); }); break;
  }
});
// "Outra coisa": a descrição vira uma das opções do Datavix quando traz uma palavra reconhecível; senão vale o padrão (a escolha mais neutra)
const OB_WORDS = {
  audience: [['board', /conselho|board|acionista|investidor/i], ['clevel', /c-?level|ceo|cfo|cmo|presidente|diretor-?executivo|executivo/i], ['team', /time|equipe|squad|colega|operaç/i], ['client', /client|customer|parceiro|fornecedor/i], ['director', /diretor|diretoria|gerente|gestor|chefia|lideran/i]],
  decision: [['cut', /cort|reduz|economi|enxug|cancel|descontinu|cost|cut/i], ['alert', /alert|risco|queda|desvio|problema|aten[cç]|warn/i], ['celebrate', /celebr|recorde|meta|conquista|parab|resultado|win/i], ['invest', /invest|cresc|expand|aposta|oportunidade|grow/i], ['prioritize', /priori|foco|ordem|escolh|rank/i]],
  story: [['flow', /fluxo|funil|etapa|jornada|convers|origem|destino|flow|funnel/i], ['geo', /mapa|regi[aã]o|estado|cidade|pa[ií]s|geogr|map|region/i], ['relation', /rela[cç]|correla|causa|impacto|depende|versus|vs\.?|relation/i], ['distribution', /distribui|frequ[eê]n|dispers|faixa|histogram|spread/i], ['composition', /composi|particip|parcela|fatia|share|mix|part/i], ['time', /tempo|evolu|m[eê]s|ano|trimestre|hist[oó]ric|tend[eê]n|sazon|time|trend/i], ['compare', /compar|ranking|maior|menor|melhor|pior|diferen/i]],
};
const OB_DEFAULT = { audience: 'director', decision: 'prioritize', story: 'compare' };
function obResolve(key, text) { const hit = (OB_WORDS[key] || []).find(([, re]) => re.test(text || '')); return hit ? hit[0] : OB_DEFAULT[key]; }
function nextOb() {
  const q = OB[S.ob];
  if (q.text && !S.br.message.trim()) { const er = $('#msg-err'); if (er) er.textContent = T('msg_required'); return; }
  if (!q.text && !S.br[q.key]) return;
  if (S.ob < OB.length - 1) { S.ob++; render(); } else go('upload');
}
function rebuildPieceForLang() {
  if (!S.piece || !S.ds) return;
  const old = S.piece, wasDirty = S.dirty, np = makePiece();
  np.id = old.id; np.saveName = old.saveName; S.dirty = wasDirty;
  np.type = old.type; np.colors = old.colors; np.palId = old.palId; np.bg = old.bg; np.title = old.title; np.hist = old.hist; np.hi = old.hi;
  teardownChart(); S.piece = np;
}
document.addEventListener('change', e => {
  const t = e.target, c = t.dataset && t.dataset.c; if (!c) return;
  if (c === 'retype') getWorker().postMessage({ type: 'retype', col: +t.dataset.col, kind: t.value });
  else if (c === 'mkind') { S.mapping = suggestMapping(STORY_OF_KIND[t.value], S.ds.columns, { hist: t.value === 'hist' }); mapChanged(); }
  else if (c === 'mmname') { const col = S.ds.columns[+t.dataset.col]; col.name = t.value.trim() || col.name; mapChanged(); }
  else if (c === 'maporg') { const f = t.dataset.f; if (!S.mapping.org) S.mapping.org = { hub: -1, entity: -1, color: -1, size: -1, grain: 'auto' }; S.mapping.org[f] = +t.value; mapChanged(); }
  else if (c === 'mapcs') { const id = t.dataset.id, f = t.dataset.f, reg = CHART_REG[id]; if (!S.mapping.cs) S.mapping.cs = {}; if (!S.mapping.cs[id]) S.mapping.cs[id] = csBlank(reg); S.mapping.cs[id][f] = f === 'agg' ? t.value : +t.value; mapChanged(); }
  else if (c === 'map') { const f = t.dataset.f; S.mapping[f] = ['agg', 'grain'].includes(f) ? t.value : +t.value; mapChanged(); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'ob-other') { const key = OB[S.ob].key; if (!S.br.other) S.br.other = {}; S.br.other[key] = { on: true, text: t.value }; S.br[key] = obResolve(key, t.value); return; }
  if (t.id === 'msg') { S.br.message = t.value; const n = [...t.value].length; $('#msg-n').textContent = T('chars', n); $('#msg-hint').textContent = n > 90 ? T('chars_long') : T('q_message_hint'); const b = $('[data-a=ob-next]'); if (b) b.disabled = !t.value.trim(); const er = $('#msg-err'); if (er) er.textContent = ''; }
  else if (t.id === 'accent' && S.piece) { S.piece.colors[0] = t.value; S.piece.palId = 'custom'; applyPieceCss(S.piece); clearTimeout(S._ac); S._ac = setTimeout(() => { pushHist(); refreshAll(false); }, 250); }
  else if (t.id === 'bgcolor' && S.piece) { const P = S.piece; P.bg[P.bg.mode === 'solid' ? 'color' : 'base'] = t.value; clearTimeout(S._bc); S._bc = setTimeout(() => { pushHist(); refreshAll(false); }, 250); }
});
document.addEventListener('focusout', e => {
  const P = S.piece, t = e.target; if (!P) return;
  const txt = t.textContent.trim();
  if (t.id === 'ptitle') { if (txt !== P.title) { P.title = txt; pushHist(); } }
  else if (t.id === 'psub') { if (txt !== subtitleOf(P)) { P.subtitle = txt; pushHist(); } }
  else if (t.id === 'pfoot') { if (txt !== footOf(P)) { P.foot = txt; pushHist(); } }
  else if (t.classList && t.classList.contains('itext')) { const i = P.insights[+t.dataset.i]; if (i && txt !== i.text) { i.text = txt; i.edited = true; pushHist(); $('#pins').innerHTML = insightsHtml(P, true); } }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.querySelector('.mdl')) { if (S.menu) { setMenu(false); return; } if (S.sheet) { setSheet(false); return; } }
  if (S.step === 'editor' && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !(e.target.isContentEditable)) { e.preventDefault(); restore(e.shiftKey ? 1 : -1); }
  if (e.key === 'Enter' && (e.target.id === 'ptitle' || e.target.id === 'psub' || e.target.id === 'pfoot' || (e.target.classList && e.target.classList.contains('itext')))) { e.preventDefault(); e.target.blur(); }
  if (e.key === 'Enter' && e.target.id === 'msg' && !e.shiftKey) { e.preventDefault(); nextOb(); }
});

/* ---------------- início ---------------- */
setLang(navigator.language && navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en');
if (window.dvSplash) window.dvSplash.set(T('splash_ui'));
render();
// a tela de carregamento sai quando a interface e as fontes estão prontas (no máximo 2,5 s de espera pelas fontes)
Promise.race([Promise.all(['400 14px Geist', '400 14px "Geist Mono"', '700 14px Doto'].map(f => document.fonts.load(f).catch(() => 0))), new Promise(r => setTimeout(r, 2500))]).then(() => { if (window.dvSplash) setTimeout(window.dvSplash.done, RM ? 0 : Math.max(350, 1100 - performance.now())); });
listProjects().then(r => { S.recents = r || []; if (S.recents.length) render(); });
pwaInit();
window.__datavix = { S, render, go, loadBuffer, renderPng, buildExportHtml, startPresentation, buildSteps };
