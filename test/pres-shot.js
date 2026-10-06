(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  const [file, story, type, step] = location.hash.slice(1).split('-');
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Receita da rede por unidade e região', story: story || 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer(file + '.csv', await (await fetch('/dados-teste/' + file + '.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(2500);
  if (type && type !== 'auto') { const b = document.querySelector(`[data-a=type][data-v=${type}]`); if (b) { b.click(); await sleep(3000); } }
  document.querySelector('[data-a=present]').click(); await sleep(1500);
  for (let i = 0; i < (+step || 0); i++) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await sleep(900); }
  await sleep(1500);
  const pc = document.querySelector('#piece'), r = el => { const b = document.querySelector(el).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  return JSON.stringify({ pres: pc.classList.contains('presenting'), logo: r('.plogo'), c1: r('.c1'), card: r('#pcard'), c3: r('.c3'), vz: r('#vz'), sx: document.documentElement.scrollWidth <= innerWidth });
})()
