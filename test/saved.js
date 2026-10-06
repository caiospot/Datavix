(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), mode = location.hash.slice(1), out = {};
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Nossos projetos', story: 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer('projetos.csv', await (await fetch('/dados-teste/projetos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(500); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 120 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(1500);
  document.querySelector('[data-a=save]').click(); await sleep(400); document.querySelector('#mdl-input').value = 'Painel de projetos 2024'; document.querySelector('.mdl [data-m="0"]').click(); await sleep(900);
  out.recents = (S.recents || []).length;
  document.querySelector('[data-a=home]').click(); await sleep(2200);
  if (mode.includes('light')) { S.ui = 'light'; D.render(); await sleep(1500); }
  out.hdrBtn = (document.querySelector('[data-a=projects]') || {}).textContent;
  if (mode.includes('modal')) { document.querySelector('[data-a=projects]').click(); await sleep(500); out.modal = document.querySelector('.mdl .pjr') ? document.querySelector('.mdl .pjr').innerText.replace(/\n/g, ' | ') : 'sem'; }
  if (mode.includes('section')) { document.getElementById('salvos').scrollIntoView(); await sleep(900); }
  if (mode.includes('faq')) { document.getElementById('faq').scrollIntoView(); await sleep(900); }
  if (mode.includes('del')) { document.querySelector('.pj [data-a=del-rec]').click(); await sleep(200); out.arm = document.querySelector('.pj [data-a=del-rec]').textContent; document.querySelector('.pj [data-a=del-rec]').click(); await sleep(700); out.after = (S.recents || []).length + ' section=' + !!document.getElementById('salvos'); }
  if (mode.includes('open')) { document.querySelector('.pj [data-a=open-rec]').click(); await sleep(2500); out.step = S.step + ' title=' + (S.piece && S.piece.title) + ' name=' + (S.piece && S.piece.saveName) + ' chip=' + document.querySelector('#savechip').textContent; }
  return JSON.stringify(out);
})()
