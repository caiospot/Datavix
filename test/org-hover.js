(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const r0 = await (async () => {
    const D = window.__datavix, S = D.S;
    S.br = { audience: 'clevel', decision: 'prioritize', message: 'Nossos projetos em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
    const buf = await (await fetch('/dados-teste/projetos.csv')).arrayBuffer();
    D.loadBuffer('projetos.csv', buf);
    for (let i = 0; i < 80 && S.step !== 'preview'; i++) await new Promise(r => setTimeout(r, 100));
    D.go('mapping'); await new Promise(r => setTimeout(r, 300));
    document.querySelector('[data-a=generate]').click();
    for (let i = 0; i < 80 && S.step !== 'editor'; i++) await new Promise(r => setTimeout(r, 150));
    await new Promise(r => setTimeout(r, 3600));
  })();
  const av = document.querySelector('.altview'), eng = av._org.engine, cv = document.querySelector('#orgcv');
  const big = eng.leafN.filter(l => l.vis).sort((a, b) => b.rad - a.rad)[0], [x, y] = eng.leafXY(big.i), rc = cv.getBoundingClientRect();
  cv.dispatchEvent(new MouseEvent('mousemove', { clientX: rc.left + x, clientY: rc.top + y, bubbles: true }));
  await new Promise(r => setTimeout(r, 700));
  const card = document.querySelector('#orgtip');
  return JSON.stringify({ hidden: card.hidden, cls: card.className, text: card.innerText.slice(0, 700), size: [card.offsetWidth, card.offsetHeight], maxRad: eng.maxRad.toFixed(1), R: eng.R.toFixed(0) });
})()
