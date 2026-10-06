(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'x', story: 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer('projetos.csv', await (await fetch('/dados-teste/projetos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(1500);
  const host = S.piece.host; S.piece.type = 'bars'; await host.setType('bars'); await sleep(2500);
  const evs = [];
  for (const n of ['pointermove', 'click']) host.chart.on(n, e => { if (e.target && e.target.tagName === 'plot-marker' && evs.length < 3) evs.push(n + ' keys=' + Object.keys(e) + ' tkeys=' + Object.keys(e.target) + ' ' + JSON.stringify({ d: e.data, t: e.target }).slice(0, 700)); });
  const cv = host.box.querySelector('canvas'), r = cv.getBoundingClientRect();
  for (let y = 0.3; y < 0.95; y += 0.1) for (let x = 0.1; x < 0.95; x += 0.1) { const o = { clientX: r.left + r.width * x, clientY: r.top + r.height * y, bubbles: true, pointerId: 1, pointerType: 'mouse' }; cv.dispatchEvent(new PointerEvent('pointermove', o)); cv.dispatchEvent(new MouseEvent('mousemove', o)); await sleep(15); }
  return JSON.stringify(evs).slice(0, 1500);
})()
