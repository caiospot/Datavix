(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 160)); };
  window.addEventListener('error', e => errs.push('ERR ' + e.message));
  for (const f of ['vendas.csv', 'fluxo.csv', 'financeiro.xlsx', 'unidades.csv', 'canais.csv', 'pedidos.csv', 'lojas.csv', 'funil.csv', 'projetos.csv']) {
    S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'T ' + f, story: 'compare', tone: 'corporate', place: 'screen' };
    D.go('entry'); D.loadBuffer(f, await (await fetch('/dados-teste/' + f)).arrayBuffer());
    for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
    D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
    for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
    await sleep(900);
    const rg = S.mapping.cs && S.mapping.cs.rays, built = S.piece.built.cs && S.piece.built.cs.rays;
    out[f] = S.piece.type + ' | all=' + S.piece.choice.all.join(',') + ' | rays=' + (built ? built.ents.length + ' ents/' + built.groups.length + ' grp, ' + built.entName + '/' + built.valName + '/' + built.agg : 'null');
  }
  out.errors = errs; return JSON.stringify(out, null, 1);
})()
