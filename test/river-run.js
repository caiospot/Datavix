(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), errs = [];
  console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 200)); };
  window.addEventListener('error', e => errs.push('ERR ' + e.message));
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Receita por canal ao longo do tempo', story: 'time', tone: location.hash.includes('light') ? 'corporate' : 'tech', place: 'screen' };
  D.loadBuffer('canais.csv', await (await fetch('/dados-teste/canais.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  if (location.hash.includes('nopanel')) { const b = document.querySelector('[data-a=panel]'); if (b) b.click(); }
  await sleep(4200);
  const P = S.piece, av = document.querySelector('.altview'), org = av && av._org, eng = org && org.engine, out = { sug: S.mapping.cs.river, type: P.type, all: P.choice.all.join(','), ins: P.insights.map(i => i.text) };
  if (!eng) { out.err = 'sem motor'; out.errs = errs; return JSON.stringify(out); }
  out.K = eng.K; out.nP = eng.nP; out.ord = eng.ord.map(k => eng.D.cats[k].label).join(','); out.errs = errs;
  const cv = document.querySelector('#orgcv'), rc = cv.getBoundingClientRect(), fire = (t, x, y) => cv.dispatchEvent(new MouseEvent(t, { clientX: rc.left + x, clientY: rc.top + y, bubbles: true }));
  if (location.hash.includes('hover')) {
    const p = Math.floor(eng.nP * 0.6), k = eng.ord[1], i = k * eng.nP + p, x = (eng.X0[i] + eng.X1[i]) / 2, y = eng.Y[p];
    fire('mousemove', x, y); await sleep(900); out.hover = eng.hoverId + ' p=' + eng.hoverP; out.card = document.querySelector('#pcard').innerText.replace(/\n/g, '|').slice(0, 330);
    if (location.hash.includes('click')) { fire('click', x, y); await sleep(500); out.pinned = org.pinned(); }
  }
  if (location.hash.includes('semi')) { const c = eng.C[eng.allOrd[0]]; fire('click', c.sx, eng.base - 4); await sleep(1800); out.catsAfter = JSON.stringify([...(eng.st.cats || [])]); out.vis = eng.ord.length; }
  if (location.hash.includes('range')) { document.querySelector('#orA').value = 20; document.querySelector('#orA').dispatchEvent(new Event('input', { bubbles: true })); await sleep(2000); out.range = JSON.stringify(eng.st.range); }
  if (location.hash.includes('share')) { const s = document.querySelector('#rvmode'); s.value = 'share'; s.dispatchEvent(new Event('change', { bubbles: true })); await sleep(2000); }
  return JSON.stringify(out, null, 1);
})()
