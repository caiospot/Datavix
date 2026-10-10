(async () => { const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'quick', message: '', story: null, tone: 'tech', place: 'screen' };
  D.loadBuffer('vendas.csv', await (await fetch('/dados-teste/vendas.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(1500);
  S.piece.title = S.piece.title || 'Tema'; document.querySelector('[data-a=present]').click(); await sl(1500); document.querySelector('.pi-go').click(); await sl(800);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sl(900);
  const m = document.querySelector('.mdl'); out.modal = m ? m.querySelector('h3').textContent : null; out.btns = m ? [...m.querySelectorAll('.btn')].map(b => b.textContent.trim()).join('|') : null; out.nameFilled = m ? m.querySelector('#mdl-input').value : null;
  return JSON.stringify(out); })()
