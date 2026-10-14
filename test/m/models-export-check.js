// Gate 55: abre a apresentação exportada por file:// (CSP estrita, sem rede) e percorre todos os slides do modelo. Sem biblioteca externa, sem erro.
(async () => { try {
  const sl = ms => new Promise(r => setTimeout(r, ms)), errs = [], out = {}; window.addEventListener('error', e => errs.push('ERR ' + e.message)); console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 140));
  document.addEventListener('securitypolicyviolation', e => errs.push('CSP ' + e.violatedDirective + ' ' + String(e.blockedURI).slice(0, 60)));
  await sl(3500); const btn = document.querySelector('.chipb.present, [data-a=present], .present'); if (!btn) return 'sem botão ' + document.body.innerText.slice(0, 160);
  btn.click(); await sl(1500); const pi = document.querySelector('.pintro .pi-btns button'); if (pi) { pi.click(); await sl(700); }
  const key = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })), root = document.querySelector('#piece'), slides = [];
  for (let i = 0; i < 9; i++) { await sl(1500); const b = document.querySelector('.pbody'); if (root.classList.contains('pouro-on')) { slides.push({ outro: true }); break; }
    slides.push({ cnt: document.querySelector('#pcount').textContent, kick: b.querySelector('.ps-kick') ? b.querySelector('.ps-kick').textContent.replace(/\d+/, '').trim() : '?', head: (b.querySelector('.ps-head') ? b.querySelector('.ps-head').textContent : '').slice(0, 70), table: !!document.querySelector('.vz-tab'), rows: document.querySelectorAll('.vz-tab tbody tr').length, hi: document.querySelectorAll('.vz-tab td.hi').length, text: !!document.querySelector('.vz-text'), vizOn: root.classList.contains('pviz-on') });
    key('ArrowRight'); }
  out.slides = slides; out.title = (document.querySelector('.pi-title') || {}).textContent; out.ext = performance.getEntriesByType('resource').filter(r => !/^(blob|data):/.test(r.name)).length; out.errs = errs.filter(e => !/requestFullscreen|ResizeObserver/.test(e)).slice(0, 6);
  return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
