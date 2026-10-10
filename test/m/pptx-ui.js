// botão "PowerPoint (.pptx)" no painel Exportar: gera o arquivo (status "Arquivo gerado") e respeita o aviso de título
(async () => { const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'normal', message: '', story: null, tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('vendas.csv', await (await fetch('/dados-teste/vendas.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(1500);
  const btn = document.querySelector('[data-a=ex][data-v=pptx]'); out.btn = btn ? btn.textContent.trim() : null;
  let dl = null; const orig = URL.createObjectURL; URL.createObjectURL = b => { dl = b; return orig.call(URL, b); };
  btn.click(); for (let i = 0; i < 80 && !dl; i++) await sl(150); await sl(500);
  out.status = (document.querySelector('#exstat') || {}).textContent; out.blob = dl ? dl.size : 0; out.type = dl ? dl.type : null;
  return JSON.stringify(out); })()
