(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  const oe = console.error; console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 160)); };
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Unidades da rede', story: 'time', tone: 'tech', place: 'screen' };
  D.loadBuffer('lojas.csv', await (await fetch('/dados-teste/lojas.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(500);
  out.mapBlocks = document.querySelectorAll('.csmap').length; out.mapSel = [...document.querySelectorAll('.csmap select[data-id=ridge]')].map(s => s.dataset.f + '=' + s.options[s.selectedIndex].text).join(',');
  document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 120 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(2500);
  out.agg0 = document.querySelector('.altview')._org.engine.D.agg; out.v0 = document.querySelector('#pcard').innerText.split('\n').slice(2, 4).join(' ');
  document.querySelector('[data-a=edit-data]').click(); await sleep(700);
  const agg = document.querySelector('.mdl select[data-c=mapcs][data-id=ridge][data-f=agg]'); agg.value = 'mean'; agg.dispatchEvent(new Event('change', { bubbles: true })); await sleep(400);
  const grp = document.querySelector('.mdl select[data-c=mapcs][data-id=ridge][data-f=comp]'); out.grpOpts = [...grp.options].map(o => o.text).join('/');
  document.querySelector('.mdl [data-m="0"]').click(); await sleep(3200);
  const eng = document.querySelector('.altview')._org.engine; out.agg1 = eng.D.agg; out.type1 = S.piece.type; out.v1 = document.querySelector('#pcard').innerText.split('\n').slice(2, 4).join(' ');
  // salvar e reabrir
  document.querySelector('[data-a=save]').click(); await sleep(400); document.querySelector('#mdl-input').value = 'Unidades raios'; document.querySelector('.mdl [data-m="0"]').click(); await sleep(900);
  document.querySelector('[data-a=home]').click(); await sleep(2200);
  out.tag = [...document.querySelectorAll('.lp-ch')].slice(0, 3).map(e => e.innerText.replace(/\n/g, ' ').slice(0, 40)).join(' || ');
  document.querySelector('.pj [data-a=open-rec]').click(); await sleep(3500);
  const e2 = document.querySelector('.altview') && document.querySelector('.altview')._org;
  out.reopen = S.step + ' type=' + (S.piece && S.piece.type) + ' rays=' + !!(e2 && e2.engine && e2.engine.D && e2.engine.nVis) + ' agg=' + (e2 && e2.engine.D.agg);
  out.errs = errs;
  return JSON.stringify(out, null, 1);
})()
