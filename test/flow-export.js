(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Cada unidade da rede em um só gráfico', story: 'flow', tone: 'tech', place: 'screen' };
  if (location.hash.includes('light')) S.br.tone = 'corporate';
  const buf = await (await fetch('/dados-teste/funil.csv')).arrayBuffer();
  D.loadBuffer('funil.csv', buf);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300);
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(3500);
  const html = buildExportHtml(S.piece);
  await fetch('/save?name=funil-export.html', { method: 'POST', body: html });
  const png = await renderPng(S.piece, { scale: 1, cs: { sel: [0], order: 'size', mode: 'pct' } });
  await fetch('/save?name=funil.png', { method: 'POST', body: png });
  return 'html=' + html.length + ' png=' + png.size;
})()
