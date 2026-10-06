(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Nossos projetos em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
  const buf = await (await fetch('/dados-teste/projetos.csv')).arrayBuffer();
  D.loadBuffer('projetos.csv', buf);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300);
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(2500);
  const P = S.piece, t0 = performance.now();
  const r = await renderPng(P, { scale: 1, org: { colors: [2], range: [0, 6], focus: null } });
  const blob = r instanceof Blob ? r : (r && r.blob) || r;
  await fetch('/save?name=projetos.png', { method: 'POST', body: blob });
  // apresentação: passos
  const steps = buildSteps(P).length;
  return 'png ' + (blob.size || '?') + ' bytes em ' + Math.round(performance.now() - t0) + ' ms; passos=' + steps;
})()
