(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), mode = location.hash.slice(1);
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Nossos projetos em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer('projetos.csv', await (await fetch('/dados-teste/projetos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  document.querySelector('[data-a=panel]').click(); await sleep(3500);
  if (mode === 'pres') { document.querySelector('[data-a=present]').click(); await sleep(800); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await sleep(2500); }
  if (mode === 'tut') { document.querySelector('.lp, #orgtut') && document.querySelector('#orgtut').click(); await sleep(600); document.querySelector('.orgtut .tnext').click(); await sleep(900); }
  return 'ok';
})()
