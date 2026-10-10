// Botão Sair: aparece em toda tela da ferramenta (fora da página inicial), mesmo sem sessão; no editor sempre abre "Salvar este projeto?"
(async () => {
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click();
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  window.addEventListener('error', e => errs.push(e.message)); const has = () => !!document.querySelector('.top-r [data-a=logout]'), mdl = () => (document.querySelector('.mdl h3') || {}).textContent || '';
  S.user = null; S.step = 'entry'; D.go('entry'); await sleep(300); out.entry = has();
  S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'Projetos', story: 'compare', tone: 'tech', place: 'screen' }; D.go('ob'); await sleep(300); out.ob = has();
  D.loadBuffer('projetos.csv', await (await fetch('/dados-teste/projetos.csv')).arrayBuffer());
  for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100); await sleep(200); out.preview = has();
  D.go('mapping'); await sleep(300); out.mapping = has();
  document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150); await sleep(800);
  out.editor = has(); out.dirty = S.dirty;
  S.user = null; D.go('editor'); await sleep(300); out.editorSemSessao = has() + ' user=' + JSON.stringify(S.user); // go() recria a sessão de quem está dentro da ferramenta
  S.dirty = false; document.querySelector('.top-r [data-a=logout]').click(); await sleep(400); out.modalLimpo = mdl();
  document.querySelector('.mdl [data-m="1"]').click(); await sleep(500); out.depois = S.step + ' user=' + JSON.stringify(S.user) + ' piece=' + !!S.piece;
  out.entryDepois = has(); out.errs = errs;
  return JSON.stringify(out);
})()
