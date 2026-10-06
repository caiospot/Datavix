(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Nossos projetos em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
  const buf = await (await fetch('/dados-teste/projetos.csv')).arrayBuffer();
  D.loadBuffer('projetos.csv', buf);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300);
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(3600);
  const av = document.querySelector('.altview'), org = av._org, eng = org.engine, cv = document.querySelector('#orgcv'), rc = cv.getBoundingClientRect();
  const out = {};
  const mid = eng.leafN.filter(l => l.vis).sort((a, b) => b.rad - a.rad)[8];
  const [x, y] = eng.leafXY(mid.i);
  const fire = (t, px, py) => cv.dispatchEvent(new MouseEvent(t, { clientX: rc.left + px, clientY: rc.top + py, bubbles: true }));
  const mode = window.__mode || location.hash.slice(1);
  if (mode === 'hover') { fire('mousemove', x, y); await sleep(600); }
  if (mode === 'pin') { fire('mousemove', x, y); fire('click', x, y); await sleep(1800); out.pinned = document.querySelector('#orgtip').className; }
  if (mode === 'filter') { document.querySelector('.orgc[data-c="2"]').click(); await sleep(260); }
  if (mode === 'filter2') { document.querySelector('.orgc[data-c="2"]').click(); await sleep(1800); }
  if (mode === 'tut') { await sleep(100); org.tutorial(); await sleep(900); }
  if (mode === 'tut2') { org.tutorial(); await sleep(700); document.querySelector('.orgtut .tnext').click(); await sleep(900); }
  if (mode === 'tut3') { org.tutorial(); await sleep(500); const n = () => document.querySelector('.orgtut .tnext').click(); n(); await sleep(300); n(); await sleep(900); }
  if (mode === 'tut4') { org.tutorial(); await sleep(500); const n = () => document.querySelector('.orgtut .tnext').click(); n(); n(); n(); await sleep(900); }
  return JSON.stringify(out);
})()
