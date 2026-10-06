(async () => {
  localStorage.removeItem('dv-fan-tutorial');
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Cada unidade da rede em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
  const buf = await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer();
  D.loadBuffer('pedidos.csv', buf);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300);
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  const out = {};
  for (let i = 0; i < 60 && !document.querySelector('.orgtut'); i++) await sleep(150);
  out.open = !!document.querySelector('.orgtut'); const titles = [];
  for (let k = 0; k < 4 && document.querySelector('.orgtut'); k++) {
    await sleep(700); titles.push(document.querySelector('.orgtut h3').textContent + ' // ' + document.querySelector('.tstep').textContent + (k === 1 ? ' // card=' + document.querySelector('#pcard').className : ''));
    if (location.hash.includes('stop' + (k + 1))) { out.stopped = k + 1; break; }
    document.querySelector('.tnext').click();
  }
  out.titles = titles; await sleep(600); out.closed = !document.querySelector('.orgtut');
  out.seen = localStorage.getItem('dv-fan-tutorial');
  out.lay = document.querySelector('#piece').dataset.lay; out.sx = document.documentElement.scrollWidth <= innerWidth;
  return JSON.stringify(out);
})()
