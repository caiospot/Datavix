(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), errs = [];
  console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 200)); };
  window.addEventListener('error', e => errs.push('ERR ' + e.message));
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Do lead ao contrato fechado', story: 'flow', tone: location.hash.includes('light') ? 'corporate' : 'tech', place: 'screen' };
  D.loadBuffer('funil.csv', await (await fetch('/dados-teste/funil.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  if (location.hash.includes('nopanel')) { const b = document.querySelector('[data-a=panel]'); if (b) b.click(); }
  await sleep(4200);
  const P = S.piece, av = document.querySelector('.altview'), org = av && av._org, eng = org && org.engine, out = { sug: S.mapping.cs.flow, type: P.type, all: P.choice.all.join(','), ins: P.insights.map(i => i.text) };
  if (!eng) { out.err = 'sem motor'; out.errs = errs; return JSON.stringify(out); }
  out.nodes = eng.nodes.filter(n => n.tv > 0).length; out.links = eng.links.filter(l => l.tf > 0).length; out.T = JSON.stringify(eng.C.T); out.errs = errs;
  const cv = document.querySelector('#orgcv'), rc = cv.getBoundingClientRect(), fire = (t, x, y) => cv.dispatchEvent(new MouseEvent(t, { clientX: rc.left + x, clientY: rc.top + y, bubbles: true }));
  if (location.hash.includes('hover')) {
    const G = eng.geom(), g = [...G.G.values()].filter(q => q.n.s === 1 && q.n.tv > 0)[0], x = g.left + g.w / 2, y = g.y;
    fire('mousemove', x, y); await sleep(900); out.hover = eng.hoverId + ' want n' + g.n.g; out.card = document.querySelector('#pcard').innerText.replace(/\n/g, '|').slice(0, 330);
    if (location.hash.includes('click')) { fire('click', x, y); await sleep(1800); out.sel = JSON.stringify(eng.st.sel); out.T2 = JSON.stringify(eng.C.T); out.card = document.querySelector('#pcard').innerText.replace(/\n/g, '|').slice(0, 260); out.list = document.querySelector('.plc').innerText; }
  }
  if (location.hash.includes('link')) { const G = eng.geom(), r = G.R.sort((a, b) => b.w - a.w)[0], y = (eng.yS[r.l.s] + eng.yS[r.l.s + 1]) / 2, x = (r.sx + r.tx) / 2 + r.w / 2; fire('mousemove', x, y); await sleep(900); out.linkHover = eng.hoverId + ' want l' + r.l.i; out.linkCard = document.querySelector('#pcard').innerText.replace(/\n/g, '|').slice(0, 220); }
  if (location.hash.includes('range')) { document.querySelector('#orA').value = 20; document.querySelector('#orA').dispatchEvent(new Event('input', { bubbles: true })); await sleep(2000); out.range = JSON.stringify(eng.st.range); }
  if (location.hash.includes('pct')) { const s = document.querySelector('#flmode'); s.value = 'pct'; s.dispatchEvent(new Event('change', { bubbles: true })); await sleep(1500); }
  return JSON.stringify(out, null, 1);
})()
