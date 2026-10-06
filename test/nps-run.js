(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 200)); };
  window.addEventListener('error', e => errs.push('ERR ' + e.message));
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1'); // tutorial aberto bloqueia a pesquisa (regra do NPS)
  localStorage.setItem('dv-nps', JSON.stringify({ id: 'test-anon-id', usage: { gen: 3, exp: 0, pres: 0 } }));
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Titulo secreto da peça', story: 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(2500);
  out.on = typeof npsOn === 'function' && npsOn(); out.feedbackBtn = !!document.querySelector('[data-a=feedback]');
  // 1) NPS depois de exportar
  await doExport('html'); await sleep(2600);
  const card = () => document.getElementById('npscard');
  out.card1 = card() ? card().dataset.kind + ' | ' + card().innerText.replace(/\n/g, ' ').slice(0, 90) : 'sem cartão';
  card().querySelector('.nc-n[data-v="9"]').click(); await sleep(300);
  out.step2 = card().querySelector('.nc-h span').textContent;
  const tx = card().querySelector('#nc-text'); tx.value = 'Gostei muito dos Raios radiais.'; 
  const ck = card().querySelector('#nc-contact'); ck.checked = true; ck.dispatchEvent(new Event('change', { bubbles: true })); card().querySelector('#nc-email').value = 'pessoa@exemplo.com';
  card().querySelector('[data-n=send]').click(); await sleep(1200);
  out.thanks = card() ? card().innerText.slice(0, 50) : 'fechou';
  await sleep(3200); out.closed = !card();
  // 2) regra de frequência: não pergunta de novo na mesma sessão
  await doExport('html'); await sleep(2600); out.again = !!card();
  // 3) fila offline: endereço fora do ar -> fica na fila -> volta e entrega
  window.__DV_NPS.url = '/nps-fora'; npsSession.asked = false; npsOpen('thumb', 'gen', 'chart'); await sleep(300);
  card().querySelector('[data-n=thumb][data-v="1"]').click(); await sleep(1500);
  out.queued = (await npsQueueAll()).length;
  window.__DV_NPS.url = '/nps'; await npsFlush(); await sleep(800); out.queuedAfter = (await npsQueueAll()).length;
  // 4) 👎 com motivo
  await sleep(2800); npsSession.asked = false; npsOpen('thumb', 'pres', 'pres'); await sleep(300);
  card().querySelector('[data-n=thumb][data-v="0"]').click(); await sleep(300);
  card().querySelector('.nc-chip[data-i="1"]').click(); card().querySelector('[data-n=send]').click(); await sleep(1200);
  // 5) o que é enviado
  await sleep(3000); npsSession.asked = false; npsOpen('nps', 'manual'); await sleep(300); card().querySelector('[data-n=more]').click(); await sleep(500);
  out.explain = !!document.querySelector('.mdl .nc-list') && document.querySelector('.mdl').innerText.includes('test-anon-id');
  out.log = (await (await fetch('/nps')).text()).trim().split('\n').map(l => JSON.parse(l));
  out.errs = errs;
  return JSON.stringify(out, null, 1);
})()
