/* Datavix: pesquisa de satisfação (NPS e "o gráfico serviu?"). Só existe no app, nunca no HTML exportado.
 * O que sai do navegador: nota, comentário, e-mail (só se a pessoa pedir contato) e dados técnicos (idioma, tipo de gráfico, faixas de tamanho).
 * Nunca a planilha, nomes de colunas, valores, título ou insights. Sem endereço configurado no build, a pesquisa fica desligada. */
Object.assign(I18N.pt, {
  nps_q: 'Quanto você recomendaria o Datavix a um colega?', nps_lo: 'Nada provável', nps_hi: 'Muito provável', nps_c_hi: 'O que mais gostou?', nps_c_lo: 'O que faltou ou atrapalhou?', nps_c_ph: 'Se quiser, escreva em uma ou duas frases.',
  nps_contact: 'Pode entrar em contato comigo sobre isso', nps_email: 'Seu e-mail', nps_send: 'Enviar', nps_later: 'Agora não', nps_thanks: 'Obrigado! Sua resposta ajuda a melhorar o Datavix.', nps_close: 'Fechar',
  nps_priv: 'Enviamos só a nota, o comentário e dados técnicos (idioma, tipo de gráfico, faixa de linhas). Nunca a sua planilha.', nps_more: 'O que é enviado?',
  nps_t_q: 'O gráfico sugerido serviu?', nps_t_yes: 'Sim', nps_t_no: 'Não', nps_t_why: 'O que aconteceu?', nps_t_r: ['Não era o gráfico que eu queria', 'Faltaram dados ou colunas', 'Ficou confuso', 'Ficou lento', 'Outro'],
  nps_p_q: 'A apresentação ficou como você queria?', nps_fb: 'Enviar feedback', nps_fb_h: 'Feedback',
  nps_d_t: 'O que a pesquisa envia', nps_d_yes: 'Enviado', nps_d_no: 'Nunca enviado', nps_d_y: ['A nota e o comentário que você escrever', 'Seu e-mail, só se marcar que aceita contato', 'Idioma, tema, tipo de gráfico e se o app está instalado', 'Faixas aproximadas (linhas e colunas da planilha, tamanho da tela), sistema e navegador', 'Um código anônimo gerado neste navegador, para não contar a mesma pessoa duas vezes'], nps_d_n: ['A planilha, os valores ou os nomes das colunas', 'O título, os insights ou o nome do arquivo', 'Qualquer coisa do projeto salvo'], nps_d_id: 'Seu código anônimo',
  nps_faq_q: 'O Datavix envia algum dado?', nps_faq_a: 'Só se você responder à pesquisa de satisfação (NPS): a nota, o comentário e dados técnicos como idioma e tipo de gráfico. Nunca a planilha, os nomes de colunas ou os valores. Você pode ignorar a pesquisa.',
});
Object.assign(I18N.en, {
  nps_q: 'How likely are you to recommend Datavix to a colleague?', nps_lo: 'Not likely', nps_hi: 'Very likely', nps_c_hi: 'What did you like most?', nps_c_lo: 'What was missing or got in the way?', nps_c_ph: 'If you like, write a sentence or two.',
  nps_contact: 'You may contact me about this', nps_email: 'Your email', nps_send: 'Send', nps_later: 'Not now', nps_thanks: 'Thank you! Your answer helps improve Datavix.', nps_close: 'Close',
  nps_priv: 'We only send the score, the comment and technical data (language, chart type, row range). Never your spreadsheet.', nps_more: 'What is sent?',
  nps_t_q: 'Did the suggested chart work for you?', nps_t_yes: 'Yes', nps_t_no: 'No', nps_t_why: 'What happened?', nps_t_r: ['It was not the chart I wanted', 'Data or columns were missing', 'It was confusing', 'It was slow', 'Other'],
  nps_p_q: 'Did the presentation turn out the way you wanted?', nps_fb: 'Send feedback', nps_fb_h: 'Feedback',
  nps_d_t: 'What the survey sends', nps_d_yes: 'Sent', nps_d_no: 'Never sent', nps_d_y: ['The score and the comment you write', 'Your email, only if you agree to be contacted', 'Language, theme, chart type and whether the app is installed', 'Approximate ranges (spreadsheet rows and columns, screen size), system and browser', 'An anonymous code generated in this browser, so the same person is not counted twice'], nps_d_n: ['The spreadsheet, the values or the column names', 'The title, the insights or the file name', 'Anything from a saved project'], nps_d_id: 'Your anonymous code',
  nps_faq_q: 'Does Datavix send any data?', nps_faq_a: 'Only if you answer the satisfaction survey (NPS): the score, the comment and technical data such as language and chart type. Never the spreadsheet, column names or values. You can ignore the survey.',
});

const NPS_KEY = 'dv-nps', NPS_DAY = 86400000;
const npsCfg = () => (window.__DV && window.__DV.nps) || window.__DV_NPS || null;
const npsOn = () => !!npsCfg();
const npsLoad = () => { try { return JSON.parse(localStorage.getItem(NPS_KEY)) || {}; } catch (e) { return {}; } };
const npsSave = s => { try { localStorage.setItem(NPS_KEY, JSON.stringify(s)); } catch (e) { /* sem armazenamento: segue sem lembrar */ } };
const npsRid = () => (crypto.randomUUID ? crypto.randomUUID() : 'r' + Math.random().toString(36).slice(2) + Date.now().toString(36));
function npsState() {
  const s = npsLoad(); s.id = s.id || npsRid(); s.usage = Object.assign({ gen: 0, exp: 0, pres: 0 }, s.usage); s.thumbs = Object.assign({ n: 0, last: 0 }, s.thumbs); s.nps = Object.assign({ last: 0, snooze: 0, asked: 0, answered: 0 }, s.nps); return s;
}
let npsSession = { asked: false, gen: 0, switched: false };

/* ---------------- envio: fila local (IndexedDB) e envio ao Google Apps Script ---------------- */
let npsMem = [];
const npsDb = () => new Promise((res, rej) => { try { const r = indexedDB.open('datavix-nps', 1); r.onupgradeneeded = () => r.result.createObjectStore('q', { keyPath: 'rid' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
const npsTx = async (mode, fn) => { try { const db = await npsDb(); return await new Promise((res, rej) => { const t = db.transaction('q', mode), st = t.objectStore('q'), q = fn(st); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); } catch (e) { return undefined; } };
async function npsQueueAdd(p) { const ok = await npsTx('readwrite', st => st.put(p)); if (ok === undefined) npsMem.push(p); }
async function npsQueueAll() { const a = await npsTx('readonly', st => st.getAll()); return (a || []).concat(npsMem); }
async function npsQueueDel(rid) { await npsTx('readwrite', st => st.delete(rid)); npsMem = npsMem.filter(x => x.rid !== rid); }
let npsFlushing = false;
async function npsFlush() {
  const c = npsCfg(); if (!c || npsFlushing || (navigator.onLine === false)) return; npsFlushing = true;
  try {
    for (const p of await npsQueueAll()) {
      try { const r = await fetch(c.url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...p, token: c.token || '' }), keepalive: true }); if (r.type === 'basic' && !r.ok) break; await npsQueueDel(p.rid); }
      catch (e) { break; } // sem rede: fica na fila e tenta de novo depois
    }
  } finally { npsFlushing = false; }
}
const npsBand = (n, edges, labels) => labels[edges.findIndex(e => n < e) < 0 ? labels.length - 1 : edges.findIndex(e => n < e)];
function npsPayload(ev, moment, extra) {
  const P = S.piece, st = npsState(), ds = S.ds, w = innerWidth, ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Other', br = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  return { v: 1, rid: npsRid(), id: st.id, ts: new Date().toISOString(), ev, moment, lang: LANG, theme: S.ui, app: (window.__DV && window.__DV.build) || 'dev', mode: pwaStandalone() ? 'app' : 'browser',
    chart: P ? P.type : '', suggested: P ? P.choice.primary : '', switched: !!npsSession.switched, rows: ds ? npsBand(ds.rowCount, [100, 1000, 10000], ['<100', '100-1k', '1k-10k', '10k+']) : '', cols: ds ? npsBand(ds.columns.length, [5, 11, 21], ['<5', '5-10', '11-20', '20+']) : '',
    os, browser: br, screen: w < 760 ? 'mobile' : w < 1180 ? 'tablet' : 'desktop', usage: st.usage.gen + '/' + st.usage.exp + '/' + st.usage.pres, ...extra };
}
async function npsSubmit(ev, moment, extra) { const p = npsPayload(ev, moment, extra); await npsQueueAdd(p); npsFlush(); return p; }

/* ---------------- quando perguntar ---------------- */
// uso: contadores locais; no máximo uma pergunta por sessão; NPS no máximo a cada 30 dias (90 se a pessoa dispensou); "o gráfico serviu?" a cada 7 dias, até 4 vezes
function npsTrack(kind) { const s = npsState(); s.usage[kind] = (s.usage[kind] || 0) + 1; npsSave(s); }
const npsBusy = () => !!document.querySelector('.mdl, .orgtut, #npscard') || (document.querySelector('.piece.presenting') !== null) || !['editor'].includes(S.step);
function npsEligible(kind) {
  if (!npsOn() || npsSession.asked || /[?&]nonps\b/.test(location.search) || navigator.doNotTrack === '1') return false;
  const s = npsState(), now = Date.now(), u = s.usage;
  if (kind === 'nps') return u.gen + u.exp + u.pres >= 3 && now > s.nps.snooze && now - s.nps.last > 30 * NPS_DAY;
  return s.thumbs.n < 4 && now - s.thumbs.last > 7 * NPS_DAY;
}
// moment: 'gen' (depois de gerar), 'export' (depois de exportar), 'pres' (ao sair da apresentação)
function npsMoment(moment) {
  const delay = moment === 'gen' ? 22000 : 1400;
  setTimeout(() => {
    if (npsBusy()) return;
    if ((moment === 'export' || moment === 'pres') && npsEligible('nps')) npsOpen('nps', moment);
    else if (moment === 'gen' && npsEligible('thumb')) npsOpen('thumb', moment, 'chart');
    else if (moment === 'pres' && npsEligible('thumb')) npsOpen('thumb', moment, 'pres');
  }, RM ? Math.min(delay, 600) : delay);
}

/* ---------------- cartão ---------------- */
function npsClose() { const c = document.getElementById('npscard'); if (!c) return; c.classList.remove('on'); setTimeout(() => c.remove(), 260); document.removeEventListener('keydown', npsKey, true); }
const npsKey = e => { if (e.key === 'Escape' && document.getElementById('npscard') && !document.querySelector('.mdl')) { e.stopPropagation(); npsDismiss(); } };
function npsDismiss() {
  const c = document.getElementById('npscard'); if (!c) return; const s = npsState(), now = Date.now();
  if (c.dataset.kind === 'nps' && c.dataset.manual !== '1') { s.nps.snooze = now + 90 * NPS_DAY; npsSave(s); } // dispensou: só volta em 90 dias
  npsClose();
}
function npsOpen(kind, moment, topic) {
  if (document.getElementById('npscard')) return; npsSession.asked = true;
  const s = npsState(), now = Date.now(), manual = moment === 'manual';
  if (kind === 'nps' && !manual) { s.nps.asked++; s.nps.last = now; } else if (kind === 'thumb') { s.thumbs.last = now; s.thumbs.n++; } npsSave(s);
  const c = document.createElement('div'); c.id = 'npscard'; c.className = 'npscard'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-live', 'polite'); c.dataset.kind = kind; c.dataset.manual = manual ? '1' : '';
  c.setAttribute('aria-label', kind === 'nps' ? T('nps_q') : T(topic === 'pres' ? 'nps_p_q' : 'nps_t_q'));
  const head = (q) => `<div class="nc-h"><span>${esc(q)}</span><button type="button" class="nc-x" data-n="dismiss" aria-label="${T('nps_close')}">×</button></div>`;
  const priv = `<p class="nc-priv">${esc(T('nps_priv'))} <button type="button" class="nc-link" data-n="more">${esc(T('nps_more'))}</button></p>`;
  let score = null, thumb = null;
  const detail = (final, band) => { // passo 2: comentário, contato e envio
    const lo = band === 'lo';
    c.innerHTML = `${head(kind === 'nps' ? T(lo ? 'nps_c_lo' : 'nps_c_hi') : T('nps_t_why'))}
      ${kind === 'thumb' ? `<div class="nc-chips">${T('nps_t_r').map((r, i) => `<button type="button" class="nc-chip" data-n="chip" data-i="${i}" aria-pressed="false">${esc(r)}</button>`).join('')}</div>` : ''}
      <textarea id="nc-text" maxlength="500" rows="3" placeholder="${esc(T('nps_c_ph'))}" aria-label="${esc(T('nps_c_ph'))}"></textarea>
      <label class="nc-ck"><input type="checkbox" id="nc-contact"> <span>${esc(T('nps_contact'))}</span></label>
      <input type="email" id="nc-email" class="nc-email" placeholder="${esc(T('nps_email'))}" aria-label="${esc(T('nps_email'))}" maxlength="120" hidden autocomplete="email">
      ${priv}<div class="nc-a"><button type="button" class="btn ghost sm" data-n="skip">${esc(T('nps_later'))}</button><button type="button" class="btn sm" data-n="send">${esc(T('nps_send'))}</button></div>`;
    const t = c.querySelector('#nc-text'); if (t) t.focus({ preventScroll: true });
  };
  if (kind === 'nps') {
    c.innerHTML = `${head(T('nps_q'))}<div class="nc-scale" role="group" aria-label="0–10">${Array.from({ length: 11 }, (_, i) => `<button type="button" class="nc-n" data-n="score" data-v="${i}" aria-label="${i}">${i}</button>`).join('')}</div>
      <div class="nc-ends"><span>${esc(T('nps_lo'))}</span><span>${esc(T('nps_hi'))}</span></div>${priv}`;
  } else {
    c.innerHTML = `${head(T(topic === 'pres' ? 'nps_p_q' : 'nps_t_q'))}<div class="nc-thumbs"><button type="button" class="nc-t" data-n="thumb" data-v="1"><span aria-hidden="true">👍</span> ${esc(T('nps_t_yes'))}</button><button type="button" class="nc-t" data-n="thumb" data-v="0"><span aria-hidden="true">👎</span> ${esc(T('nps_t_no'))}</button></div>${priv}`;
  }
  document.body.appendChild(c); requestAnimationFrame(() => c.classList.add('on')); document.addEventListener('keydown', npsKey, true);
  const finish = () => { c.innerHTML = `<div class="nc-h"><span>${esc(T('nps_thanks'))}</span><button type="button" class="nc-x" data-n="dismiss" aria-label="${T('nps_close')}">×</button></div>`; c.dataset.kind = 'done'; setTimeout(npsClose, 2600); };
  const send = async () => {
    const text = (c.querySelector('#nc-text') || {}).value || '', contact = !!(c.querySelector('#nc-contact') || {}).checked, email = contact ? ((c.querySelector('#nc-email') || {}).value || '').trim().slice(0, 120) : '';
    const why = [...c.querySelectorAll('.nc-chip[aria-pressed=true]')].map(b => +b.dataset.i);
    if (kind === 'nps') { const st = npsState(); st.nps.answered++; npsSave(st); }
    await npsSubmit(kind, moment, kind === 'nps' ? { score, comment: text.trim().slice(0, 500), contact, email } : { topic, score: thumb, why, comment: text.trim().slice(0, 500), contact, email });
    finish();
  };
  c.addEventListener('click', async e => {
    const b = e.target.closest('[data-n]'); if (!b) return; const a = b.dataset.n;
    if (a === 'dismiss') { if (c.dataset.kind === 'done') npsClose(); else npsDismiss(); }
    else if (a === 'score') { score = +b.dataset.v; c.querySelectorAll('.nc-n').forEach(x => x.setAttribute('aria-pressed', x === b)); detail(false, score >= 9 ? 'hi' : 'lo'); }
    else if (a === 'thumb') { thumb = +b.dataset.v; if (thumb === 1) { await npsSubmit('thumb', moment, { topic, score: 1, why: [], comment: '', contact: false, email: '' }); finish(); } else detail(false, 'lo'); }
    else if (a === 'chip') b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    else if (a === 'skip') { if (kind === 'nps' && score !== null) await npsSubmit('nps', moment, { score, comment: '', contact: false, email: '' }); else if (kind === 'thumb' && thumb !== null) await npsSubmit('thumb', moment, { topic, score: thumb, why: [], comment: '', contact: false, email: '' }); npsClose(); }
    else if (a === 'send') send();
    else if (a === 'more') npsExplain();
  });
  c.addEventListener('change', e => { if (e.target.id === 'nc-contact') { const m = c.querySelector('#nc-email'); m.hidden = !e.target.checked; if (e.target.checked) m.focus(); } });
}
// transparência: exatamente o que vai e o que nunca vai
function npsExplain() {
  const li = a => `<ul class="nc-list">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  modal({ title: T('nps_d_t'), body: `<h4 class="nc-sub">${T('nps_d_yes')}</h4>${li(T('nps_d_y'))}<h4 class="nc-sub">${T('nps_d_no')}</h4>${li(T('nps_d_n'))}<p class="note" style="margin:12px 0 0">${T('nps_d_id')}: <code>${esc(npsState().id)}</code></p><p class="note" style="margin:8px 0 0"><button type="button" class="nc-link" data-pv="1">${esc(privT().title)}</button></p>`, actions: [{ label: T('nps_close'), v: null, kind: 'primary' }], onOpen: m => { const b = m.querySelector('[data-pv="1"]'); if (b) b.addEventListener('click', e => { e.stopPropagation(); openPrivacy(); }, true); } });
}
// "Enviar feedback": abre a pergunta quando a pessoa quiser, sem regra de frequência
function npsManual() { npsSession.asked = false; npsOpen('nps', 'manual'); }
window.addEventListener('online', () => { if (npsOn()) setTimeout(npsFlush, 500); });
setTimeout(() => { if (npsOn()) npsFlush(); }, 5000);
