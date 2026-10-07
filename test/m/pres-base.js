(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S; const t = (location.hash.slice(1) || 'fan');
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Receita por categoria', story: 'compare', tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(2500);
  if (t !== 'fan') { document.querySelector('.panel .type[data-v=' + t + ']').click(); await sl(2000); }
  document.querySelector('[data-a=present]').click(); await sl(+(location.search.slice(1)) || 2500);
  const P = S.piece; return JSON.stringify({ steps: P.pres.steps.map(s => s.id + ':' + (s.caption || '').slice(0, 30)), cnt: document.querySelector('#pcount').textContent }); })()
