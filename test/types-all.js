(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 200)); };
  window.addEventListener('error', e => errs.push('ERR ' + e.message));
  const file = location.hash.slice(1) || 'pedidos';
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Teste', story: 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer(file + '.csv', await (await fetch('/dados-teste/' + file + '.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(2500);
  const btns = () => [...document.querySelectorAll('#panel .type')];
  out.total = btns().length; out.off = btns().filter(b => b.classList.contains('off')).map(b => b.dataset.v).join(','); out.type0 = S.piece.type;
  out.groups = [...document.querySelectorAll('#panel .tg-sub')].map(e => e.textContent).join(' | ');
  const click = async v => { const b = btns().find(x => x.dataset.v === v); if (b) b.click(); await sleep(3500); return S.piece.type + ' | toast=' + ((document.querySelector('#toast') || {}).innerText || '').replace(/\n/g, ' ').slice(0, 90) + ' | modal=' + !!document.querySelector('.mdl .mm'); };
  if (file === 'pedidos') { out.calendar = await click('calendar'); out.afterTotal = btns().length; out.offAfter = btns().filter(b => b.classList.contains('off')).map(b => b.dataset.v).join(','); }
  out.scatter = await click('scatter');
  out.flow = await click('flow');
  if (document.querySelector('.mdl .mm')) { out.flash = !!document.querySelector('.csmap.flash'); out.detailsOpen = !!document.querySelector('.mm details[open] .csmap[data-cs=flow]'); document.querySelector('.mdl [data-m="1"]').click(); await sleep(400); }
  out.errs = errs;
  return JSON.stringify(out, null, 1);
})()
