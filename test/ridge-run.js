(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), errs = [];
  console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 200)); };
  window.addEventListener('error', e => errs.push('ERR ' + e.message));
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Receita por loja, B2C contra B2B', story: 'time', tone: location.hash.includes('light') ? 'corporate' : 'tech', place: 'screen' };
  D.loadBuffer('lojas.csv', await (await fetch('/dados-teste/lojas.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  if (location.hash.includes('nopanel')) { const b = document.querySelector('[data-a=panel]'); if (b) b.click(); }
  await sleep(4200);
  const P = S.piece, av = document.querySelector('.altview'), org = av && av._org, eng = org && org.engine, out = { sug: S.mapping.cs.ridge, type: P.type, all: P.choice.all.join(','), ins: P.insights.map(i => i.text) };
  if (!eng) { out.err = 'sem motor'; out.errs = errs; return JSON.stringify(out); }
  out.nVis = eng.nVis; out.nC = eng.nC; out.s = Math.round(eng.g.s); out.errs = errs;
  const cv = document.querySelector('#orgcv'), rc = cv.getBoundingClientRect(), fire = (t, x, y) => cv.dispatchEvent(new MouseEvent(t, { clientX: rc.left + x, clientY: rc.top + y, bubbles: true }));
  if (location.hash.includes('hover')) {
    const id = eng.seq[2].i, [x, y] = eng.tipXY(id);
    fire('mousemove', x, y + 6); await sleep(900); out.hover = eng.hoverId + ' want ' + id + ' p=' + eng.hoverP; out.card = document.querySelector('#pcard').innerText.replace(/\n/g, '|').slice(0, 330);
    if (location.hash.includes('click')) { fire('click', x, y); await sleep(500); out.pinned = org.pinned(); }
  }
  if (location.hash.includes('comp')) { document.querySelector('.orgc[data-c="1"]').click(); await sleep(1800); out.comps = JSON.stringify(eng.getState().comps); }
  if (location.hash.includes('range')) { document.querySelector('#orA').value = 20; document.querySelector('#orA').dispatchEvent(new Event('input', { bubbles: true })); await sleep(2000); out.range = JSON.stringify(eng.st.range); }
  if (location.hash.includes('sort')) { const s = document.querySelector('#rgsort'); s.value = 'name'; s.dispatchEvent(new Event('change', { bubbles: true })); await sleep(2000); }
  return JSON.stringify(out, null, 1);
})()
