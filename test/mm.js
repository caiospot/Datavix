(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Projetos', story: 'compare', tone: 'tech', place: 'screen' };
  D.loadBuffer('projetos.csv', await (await fetch('/dados-teste/projetos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
  D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
  await sleep(1500);
  const P0 = S.piece; P0.title = 'Título editado'; document.querySelector('[data-a=pal][data-v=vibrant]') && document.querySelector('[data-a=pal][data-v=vibrant]').click();
  document.querySelector('[data-a=edit-data]').click(); await sleep(600);
  out.modal = !!document.querySelector('.mdl-box.wide'); out.cols = document.querySelectorAll('.mm-name').length; out.rows = document.querySelectorAll('.mm tbody tr').length;
  const sel = document.querySelector('select[data-c=maporg][data-f=color]'); out.colorBefore = sel.options[sel.selectedIndex].text;
  sel.value = [...sel.options].find(o => o.text === 'Região').value; sel.dispatchEvent(new Event('change', { bubbles: true })); await sleep(400);
  out.colorAfterRender = document.querySelector('select[data-c=maporg][data-f=color]').selectedOptions[0].text;
  document.querySelector('.mdl [data-m="0"]').click(); await sleep(2500);
  out.applied = S.piece.built.org.colName + ' | titulo=' + S.piece.title + ' | pal=' + S.piece.palId + ' | toast=' + document.querySelector('#toast').textContent.slice(0, 60);
  // desfazer
  document.querySelector('#toast button').click(); await sleep(1500); out.undo = S.piece.built.org.colName;
  // trocar planilha
  const buf = await (await fetch('/dados-teste/projetos.csv')).arrayBuffer();
  await replaceSheet(new File([buf], 'projetos-2.csv')); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150); await sleep(2500);
  out.replaced = S.step + ' | ' + S.piece.fileName + ' | ' + S.piece.built.org.hubName + '/' + S.piece.built.org.entName + '/' + S.piece.built.org.colName + ' | titulo=' + S.piece.title;
  return JSON.stringify(out, null, 1);
})()
