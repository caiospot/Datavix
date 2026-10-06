(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, mode = location.hash.slice(1);
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Nossos projetos em um só gráfico', story: 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer('projetos.csv', await (await fetch('/dados-teste/projetos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(400); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 120 && S.step !== 'editor'; i++) await sleep(150);
  document.querySelector('[data-a=panel]').click(); await sleep(3800);
  const org = document.querySelector('.altview')._org, eng = org.engine;
  out.count = document.querySelector('.plc').textContent; out.rows = document.querySelectorAll('.plr').length;
  if (mode === 'rowhover') { const r = document.querySelectorAll('.plr')[4]; r.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); await sleep(500); out.hov = eng.hov.leaf; out.card = document.querySelector('#pcard').className; }
  if (mode === 'rowclick') { const r = document.querySelectorAll('.plr')[2]; r.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); r.dispatchEvent(new MouseEvent('click', { bubbles: true })); await sleep(1500); out.card = document.querySelector('#pcard').className; out.focus = eng.st.focus; out.sel = !!document.querySelector('.plr.sel'); }
  if (mode === 'search') { const i = document.querySelector('.pls'); i.value = 'planilhas'; i.dispatchEvent(new Event('input', { bubbles: true })); await sleep(400); out.count = document.querySelector('.plc').textContent; }
  if (mode === 'bubble') { const cv = document.querySelector('#orgcv'), rc = cv.getBoundingClientRect(), big = eng.leafN.filter(l => l.vis).sort((a, b) => b.rad - a.rad)[10], [x, y] = eng.leafXY(big.i); cv.dispatchEvent(new MouseEvent('mousemove', { clientX: rc.left + x, clientY: rc.top + y, bubbles: true })); await sleep(500); out.hot = document.querySelector('.plr.hot') ? document.querySelector('.plr.hot').innerText.replace(/\n/g, ' ') : 'nenhuma'; }
  return JSON.stringify(out);
})()
