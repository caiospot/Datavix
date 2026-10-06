(async () => {
  const D = window.__datavix, S = D.S;
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Nossos projetos em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
  const buf = await (await fetch('/dados-teste/projetos.csv')).arrayBuffer();
  D.loadBuffer('projetos.csv', buf);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await new Promise(r => setTimeout(r, 100));
  D.go('mapping');
  await new Promise(r => setTimeout(r, 300));
  window.__mapHtml = document.querySelector('.detchips') ? document.querySelector('.detchips').innerText : 'SEM CHIPS';
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await new Promise(r => setTimeout(r, 150));
  await new Promise(r => setTimeout(r, 3500));
  const org = document.querySelector('.altview').closest('.vzbox') && document.querySelector('.org') ? document.querySelector('.altview')._org : null;
  window.__org = org;
  return 'step=' + S.step + ' org=' + !!org + ' chips=' + window.__mapHtml.replace(/\n/g, '|');
})()
