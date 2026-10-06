(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
  const btns = () => [...document.querySelectorAll('.mdl .btn')].map(b => b.textContent.trim());
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Projetos', story: 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer('projetos.csv', await (await fetch('/dados-teste/projetos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(1000); out.chip0 = document.querySelector('#savechip').textContent;
  document.querySelector('[data-a=home]').click(); await sleep(300); out.home = btns(); out.homeStep = S.step;
  document.querySelector('.mdl [data-m="2"]').click(); await sleep(300); out.afterCancel = S.step + ' modal=' + !!document.querySelector('.mdl');
  document.querySelector('[data-a=new]').click(); await sleep(300); out.new = btns();
  document.querySelector('.mdl-x').click(); await sleep(200);
  document.querySelector('[data-a=logout]').click(); await sleep(300); out.logout = btns();
  // salvar pelo modal de sair
  document.querySelector('#mdl-input').value = 'Meu projeto teste';
  document.querySelector('.mdl [data-m="0"]').click(); await sleep(900);
  out.afterLogout = S.step + ' user=' + JSON.stringify(S.user) + ' recents=' + (S.recents || []).map(r => r.name).join(',');
  return JSON.stringify(out, null, 1);
})()
