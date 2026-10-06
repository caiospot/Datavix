(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), mode = location.hash.slice(1);
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Nossos projetos em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer('projetos.csv', await (await fetch('/dados-teste/projetos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(900); document.querySelector('[data-a=generate]').click();
  if (mode === 'gen') { await sleep(1600); return 'step=' + S.step + ' txt=' + (document.querySelector('#gen-st') || {}).textContent; }
  if (mode === 'trans') { for (let i = 0; i < 100 && S.step !== 'editor'; i++) await sleep(50); await sleep(250); return 'step=' + S.step; }
  await sleep(6000); return 'step=' + S.step;
})()
