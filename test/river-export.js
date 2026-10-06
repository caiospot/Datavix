(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Cada unidade da rede em um só gráfico', story: 'time', tone: 'tech', place: 'screen' };
  if (location.hash.includes('light')) S.br.tone = 'corporate';
  const buf = await (await fetch('/dados-teste/canais.csv')).arrayBuffer();
  D.loadBuffer('canais.csv', buf);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300);
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(3500);
  const html = buildExportHtml(S.piece);
  await fetch('/save?name=canais-export.html', { method: 'POST', body: html });
  const png = await renderPng(S.piece, { scale: 1, cs: { cats: [0, 2, 3], range: [4, 20], order: 'value', mode: 'share' } });
  await fetch('/save?name=canais.png', { method: 'POST', body: png });
  return 'html=' + html.length + ' png=' + png.size;
})()
