(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Projetos', story: 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer('projetos.csv', await (await fetch('/dados-teste/projetos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(1500);
  const P0 = S.piece; P0.title = 'Título editado'; document.querySelector('[data-a=pal][data-v=vibrant]') && document.querySelector('[data-a=pal][data-v=vibrant]').click();
  document.querySelector('[data-a=edit-data]').click(); await sleep(600);
  out.modal = !!document.querySelector('.mdl-box.wide'); out.cols = document.querySelectorAll('.mm-name').length; out.rows = document.querySelectorAll('.mm tbody tr').length;
  return 'open';
})()
