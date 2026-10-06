(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Nossos projetos', story: 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer('projetos.csv', await (await fetch('/dados-teste/projetos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(400);
  const b = document.querySelector('[data-a=orgdet][data-v="9"]'); if (b) { b.click(); await sleep(200); }
  return document.querySelector('.orgsum, .summary') ? [...document.querySelectorAll('.summary')].map(x => x.innerText).join(' | ') : '';
})()
