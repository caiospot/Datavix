(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  S.br = { audience: 'clevel', decision: 'prioritize', message: 'Teste', story: 'compare', tone: 'corporate', place: 'screen' };
  D.loadBuffer('projetos.csv', await (await fetch('/dados-teste/projetos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  document.querySelector('[data-a=panel]').click(); await sleep(1800);
  const out = {}, host = () => S.piece.host, card = () => document.querySelector('#pcard');
  const setT = async t => { document.querySelector(`[data-a=type][data-v=${t}]`) ? 0 : 0; S.piece.type = t; await host().setType(t); await sleep(2500); };
  // barras: varre o canvas
  await setT('bars'); out.ovBars = card().innerText.slice(0, 80).replace(/\n/g, ' ');
  const cv = host().box.querySelector('canvas'), r = cv.getBoundingClientRect();
  for (let y = 0.3; y < 0.95 && !/hov/.test(card().className); y += 0.1) for (let x = 0.1; x < 0.95 && !/hov/.test(card().className); x += 0.1) { const o = { clientX: r.left + r.width * x, clientY: r.top + r.height * y, bubbles: true, pointerId: 1, pointerType: 'mouse' }; cv.dispatchEvent(new PointerEvent('pointermove', o)); await sleep(20); }
  out.hovBars = card().className + ' | ' + card().innerText.slice(0, 90).replace(/\n/g, ' ');
  await setT('kpi'); const k = document.querySelector('.kpi'); k.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); await sleep(300);
  out.kpi = card().className + ' | ' + card().innerText.slice(0, 90).replace(/\n/g, ' ');
  k.dispatchEvent(new MouseEvent('click', { bubbles: true })); await sleep(300); out.kpiPin = card().className;
  if (S.piece.choice.all.includes('calendar')) { await setT('calendar'); const c = document.querySelector('[data-d]'); c.dispatchEvent(new MouseEvent('mousemove', { bubbles: true })); await sleep(300); out.cal = card().className + ' | ' + card().innerText.slice(0, 90).replace(/\n/g, ' '); }
  else out.cal = 'sem calendário nesta história';
  await setT('treemap'); out.ovTree = card().className + ' | ' + card().innerText.slice(0, 60).replace(/\n/g, ' ');
  return JSON.stringify(out, null, 1);
})()
