/* Datavix: modais e avisos da interface do produto (não fazem parte das peças exportadas). */
// modal({ title, body (html), input: { label, value }, actions: [{ label, v, kind }], wide }) -> Promise<{ v, text } | null>
// null = fechou (Esc ou clique fora). Foco preso dentro do modal; devolve o foco a quem abriu.
function modal(o) {
  return new Promise(res => {
    const prev = document.activeElement, m = document.createElement('div');
    m.className = 'mdl'; m.innerHTML = `<div class="mdl-box${o.wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="mdt">
      <div class="mdl-h"><h3 id="mdt">${o.title}</h3>${o.closable === false ? '' : `<button type="button" class="mdl-x" data-m="close" aria-label="${T('org_card_close')}">×</button>`}</div>
      <div class="mdl-b">${o.body || ''}${o.input ? `<label class="mdl-in"><span class="lbl">${o.input.label}</span><input class="field" id="mdl-input" type="text" maxlength="80" value="${esc(o.input.value || '')}"></label>` : ''}</div>
      ${o.actions && o.actions.length ? `<div class="mdl-a">${o.actions.map((a, i) => `<button type="button" class="btn${a.kind === 'primary' ? '' : a.kind === 'text' ? ' text' : ' ghost'}" data-m="${i}">${a.label}</button>`).join('')}</div>` : ''}</div>`;
    document.body.appendChild(m); document.body.classList.add('mdl-open');
    const box = m.querySelector('.mdl-box'), input = m.querySelector('#mdl-input');
    const done = (v, a) => { document.removeEventListener('keydown', onKey, true); m.remove(); if (!document.querySelector('.mdl')) document.body.classList.remove('mdl-open'); if (prev && prev.focus) prev.focus({ preventScroll: true }); res(v === null ? null : { v, text: input ? input.value : '', action: a }); };
    const onKey = e => {
      if (e.key === 'Escape' && o.closable !== false) { e.preventDefault(); e.stopPropagation(); done(null); }
      else if (e.key === 'Enter' && input && e.target === input) { e.preventDefault(); const p = (o.actions || []).findIndex(a => a.kind === 'primary'); if (p >= 0) done(o.actions[p].v, o.actions[p]); }
      else if (e.key === 'Tab') { const f = [...box.querySelectorAll('button,input,select,textarea,[href]')].filter(x => !x.disabled && x.offsetParent !== null); if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    };
    document.addEventListener('keydown', onKey, true);
    m.addEventListener('mousedown', e => { if (e.target === m && o.closable !== false) done(null); });
    m.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; if (b.dataset.m === 'close') done(null); else { const a = o.actions[+b.dataset.m]; if (a.check && !a.check()) return; done(a.v, a); } });
    if (o.onOpen) o.onOpen(m, done);
    requestAnimationFrame(() => { (input || m.querySelector('.btn:not(.ghost):not(.text)') || m.querySelector('.btn') || box).focus(); if (input) input.select(); });
  });
}
let _toastT = null;
function toast(msg, act) {
  let t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.toggle('act', !!act);
  if (act) { const b = document.createElement('button'); b.type = 'button'; b.textContent = act.label; b.onclick = () => { t.classList.remove('on'); act.fn(); }; t.appendChild(b); }
  t.classList.add('on'); clearTimeout(_toastT); _toastT = setTimeout(() => t.classList.remove('on'), act ? 7000 : 2400);
}
