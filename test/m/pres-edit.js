(async () => { const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; };
  const mode = location.hash.slice(1) || 'normal';
  S.user = { guest: true }; S.br = mode === 'blank' ? { area: null, audience: null, decision: null, time: null, message: '', story: null, tone: 'tech', place: 'screen' } : { audience: 'director', decision: 'prioritize', time: 'normal', message: '', story: null, tone: 'tech', place: 'screen' };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('datavix-planilha-ideal.xlsx', await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer(), 'Casos CX'); for (let i = 0; i < 100 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 100 && S.step !== 'editor'; i++) await sl(150); await sl(2500);
  const P = S.piece; if (mode === 'blank') P.title = 'Meu tema';
  document.querySelector('[data-a=present]').click(); await sl(1500); out.segs = document.querySelectorAll('.pprog .pseg').length;
  document.querySelector('.pi-go').click(); await sl(1200);
  out.li0 = Array.from(document.querySelectorAll('.ps-list li')).map(l => l.textContent.slice(0, 30) + '|' + !!l.isContentEditable).join(' ; '); { const li = document.querySelector('.ps-list li'); if (li) { li.dispatchEvent(new FocusEvent('focus')); li.textContent = 'Linha minha'; li.dispatchEvent(new FocusEvent('blur')); await sl(200); } }
  await S.piece.pres.show(1); await sl(900);
  out.head1 = (document.querySelector('.ps-head') || {}).textContent; out.editable = !!document.querySelector('.ps-head[contenteditable]'); out.ph = (document.querySelector('.ps-head') || {}).dataset && document.querySelector('.ps-head').dataset.ph;
  // editar o slide 1
  const h = document.querySelector('.ps-head'); if (h) { h.dispatchEvent(new FocusEvent('focus')); h.textContent = 'Texto escrito por mim'; h.dispatchEvent(new FocusEvent('blur')); await sl(300); }
  out.edits = JSON.stringify(P.sedits); out.dirty = S.dirty;
  await S.piece.pres.show(2); await sl(700); await S.piece.pres.show(0); await sl(900); out.li0b = (document.querySelector('.ps-list li') || {}).textContent; await S.piece.pres.show(1); await sl(900);
  out.head1b = (document.querySelector('.ps-head') || {}).textContent; ok('edição volta ao reabrir o slide', out.head1b === 'Texto escrito por mim');
  out.errs = errs.slice(0, 4); return JSON.stringify(out, null, 1); })()
