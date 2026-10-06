(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), errs = [];
  console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 200)); };
  window.addEventListener('error', e => errs.push('ERR ' + e.message));
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Cada pedido do semestre', story: 'compare', tone: location.hash.includes('light') ? 'corporate' : 'tech', place: 'screen' };
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  if (location.hash.includes('nopanel')) { const b = document.querySelector('[data-a=panel]'); if (b) b.click(); }
  await sleep(4200);
  const P = S.piece, av = document.querySelector('.altview'), org = av && av._org, eng = org && org.engine, out = { sug: S.mapping.cs.fan, type: P.type, all: P.choice.all.join(','), ins: P.insights.map(i => i.text) };
  if (!eng || !eng.seq) { out.err = 'sem motor'; out.errs = errs; return JSON.stringify(out); }
  out.nVis = eng.nVis; out.A = +eng.A.toFixed(2); out.Lmax = Math.round(eng.Lmax); out.errs = errs;
  const cv = document.querySelector('#orgcv'), rc = cv.getBoundingClientRect(), fire = (t, x, y) => cv.dispatchEvent(new MouseEvent(t, { clientX: rc.left + x, clientY: rc.top + y, bubbles: true }));
  if (location.hash.includes('hover')) {
    const id = eng.stats().ids[12], [x, y] = eng.tipXY(id); fire('mousemove', x + 1, y); await sleep(900); out.hover = eng.hoverId + ' want ' + id; out.card = document.querySelector('#pcard').innerText.replace(/\n/g, '|').slice(0, 330);
    if (location.hash.includes('click')) { fire('click', x + 1, y); await sleep(500); out.pinned = org.pinned(); }
  }
  if (location.hash.includes('axis')) { const t = eng.cy - eng.Ha / 2 + eng.Ha * 0.25; fire('mousemove', eng.axisX + 20, t); await sleep(800); out.axis = eng.hoverId; }
  if (location.hash.includes('filter')) { document.querySelector('.orgc[data-c="1"]').click(); await sleep(1800); out.nVis2 = eng.nVis; }
  if (location.hash.includes('sort')) { const s = document.querySelector('#fsort'); s.value = 'cat'; s.dispatchEvent(new Event('change', { bubbles: true })); await sleep(2000); }
  if (location.hash.includes('top')) { const s = document.querySelector('#ftop'); s.value = 60; s.dispatchEvent(new Event('input', { bubbles: true })); await sleep(2000); out.nVis3 = eng.nVis; }
  return JSON.stringify(out, null, 1);
})()
