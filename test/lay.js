(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  const opts = new Set(location.hash.slice(1).split(','));
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Nossos projetos em um só gráfico', story: window.__story || 'compare', tone: 'tech', place: 'screen' };
  const buf = await (await fetch('/dados-teste/projetos.csv')).arrayBuffer();
  D.loadBuffer('projetos.csv', buf);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300);
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  if (opts.has('nopanel')) document.querySelector('[data-a=panel]').click();
  await sleep(3800);
  const org = document.querySelector('.altview')._org, eng = org && org.engine, cv = document.querySelector('#orgcv'), out = {};
  if (eng) {
    const rc = cv.getBoundingClientRect(), mid = eng.leafN.filter(l => l.vis).sort((a, b) => b.rad - a.rad)[8], [x, y] = eng.leafXY(mid.i);
    const fire = (t) => cv.dispatchEvent(new MouseEvent(t, { clientX: rc.left + x, clientY: rc.top + y, bubbles: true }));
    if (opts.has('hover')) { fire('mousemove'); await sleep(500); }
    if (opts.has('pin')) { fire('mousemove'); fire('click'); await sleep(1500); }
  }
  const pc = document.querySelector('#piece'), c1 = document.querySelector('#pc1');
  out.lay = pc.dataset.lay; out.pieceW = pc.clientWidth; out.c1 = [c1.clientWidth, c1.scrollWidth]; out.hscroll = document.documentElement.scrollWidth > innerWidth;
  out.stageH = document.querySelector('.stage').scrollWidth > document.querySelector('.stage').clientWidth;
  out.card = (document.querySelector('#pcard').className) + ' | ' + document.querySelector('#pcard').innerText.slice(0, 60).replace(/\n/g, ' ');
  return JSON.stringify(out);
})()
