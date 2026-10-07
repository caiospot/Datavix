(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S;
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Receita por categoria', story: 'compare', tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(2500);
  document.querySelector('.panel .type[data-v=hbars]').click(); await sl(1500);
  document.querySelector('#ptab-style').click(); document.querySelector('.fp-btn').click(); await sl(500); document.querySelector('.fp-o[data-v=playfair]').click(); await sl(1500);
  const html = buildExportHtml(S.piece); await fetch('/save?name=font-export.html', { method: 'POST', body: html });
  const png = await renderPng(S.piece, { scale: 1 }); await fetch('/save?name=font-export.png', { method: 'POST', body: png });
  const families = [...html.matchAll(/font-family:'([^']+)'/g)].map(m => m[1]).filter((v, i, a) => a.indexOf(v) === i);
  return JSON.stringify({ htmlKB: Math.round(html.length / 1024), families, png: png.size }); })()
