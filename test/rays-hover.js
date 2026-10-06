(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S;
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Cada unidade da rede em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
  if (location.hash.includes('light')) S.br.tone = 'corporate';
  const buf = await (await fetch('/dados-teste/unidades.csv')).arrayBuffer();
  D.loadBuffer('unidades.csv', buf);
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await new Promise(r => setTimeout(r, 100));
  D.go('mapping'); await new Promise(r => setTimeout(r, 300));
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await new Promise(r => setTimeout(r, 150));
  if (location.hash.includes('nopanel')) { const b = document.querySelector('[data-a=panel]'); if (b) b.click(); }
  await new Promise(r => setTimeout(r, 3800));
  const av = document.querySelector('.altview'), eng = av._org.engine, cv = document.querySelector('#orgcv'), rc = cv.getBoundingClientRect();
  let out = {};
  if (location.hash.includes('hover')) {
    const id = eng.N.find(n => n.pos === 8 && n.vis).i, [x, y] = eng.tipXY(id);
    cv.dispatchEvent(new MouseEvent('mousemove', { clientX: rc.left + x - 4, clientY: rc.top + y + 2, bubbles: true }));
    await new Promise(r => setTimeout(r, 900)); out.hover = eng.hoverId; out.card = document.querySelector('#pcard').innerText.replace(/\n/g, '|').slice(0, 300);
  }
  if (location.hash.includes('click')) {
    cv.dispatchEvent(new MouseEvent('click', { clientX: rc.left + eng.tipXY(eng.hoverId)[0] - 4, clientY: rc.top + eng.tipXY(eng.hoverId)[1] + 2, bubbles: true }));
    await new Promise(r => setTimeout(r, 500)); out.pinned = av._org.pinned(); out.pcls = document.querySelector('#pcard').className;
  }
  if (location.hash.includes('filter')) {
    document.querySelector('.orgc[data-c="1"]').click(); await new Promise(r => setTimeout(r, 1800));
    out.nVis = eng.nVis; out.list = document.querySelector('.plc').innerText;
  }
  out.size = [Math.round(rc.width), Math.round(rc.height)]; out.errs = 0;
  return JSON.stringify(out);
})()
