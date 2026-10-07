(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S, errs = []; console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => errs.push('ERR ' + e.message));
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Receita por categoria', story: 'compare', tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(2500);
  const out = {}; const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  document.querySelector('#ptab-style').click(); await sl(200);
  const tab = document.querySelector('#ptab-style'); tab.focus(); key(tab, 'ArrowRight'); await sl(200); out.tabArrow = S.ptab + ' focus=' + document.activeElement.id;
  key(document.querySelector('#ptab-chart'), 'ArrowLeft'); await sl(200); out.tabWrap = S.ptab;
  document.querySelector('#ptab-style').click(); await sl(200);
  const b = document.querySelector('.fp-btn'); b.focus(); key(b, 'ArrowDown'); await sl(500); out.opened = S.fpOpen + ' focus=' + document.activeElement.dataset.v;
  key(document.activeElement, 'ArrowDown'); out.down = document.activeElement.dataset.v; key(document.activeElement, 'End'); out.end = document.activeElement.dataset.v; key(document.activeElement, 'Home'); out.home = document.activeElement.dataset.v;
  key(document.activeElement, 'Escape'); await sl(200); out.esc = 'open=' + S.fpOpen + ' focus=' + document.activeElement.className + ' sheet=' + S.sheet;
  b.focus(); key(b, 'ArrowDown'); await sl(300); document.body.click(); await sl(200); out.outside = 'open=' + S.fpOpen;
  out.errs = errs; return JSON.stringify(out, null, 1); })()
