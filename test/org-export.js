(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Nossos projetos em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
  const buf = await (await fetch('/dados-teste/projetos.csv')).arrayBuffer();
  D.loadBuffer('projetos.csv', buf);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300);
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(1500);
  const html = buildExportHtml(S.piece);
  await fetch('/save?name=projetos-export.html', { method: 'POST', body: html });
  return 'bytes=' + html.length;
})()
