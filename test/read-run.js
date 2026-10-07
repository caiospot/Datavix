(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 160)); };
  window.addEventListener('error', e => errs.push('ERR ' + e.message));
  for (const f of ['vendas.csv', 'fluxo.csv', 'financeiro.xlsx', 'unidades.csv', 'canais.csv', 'pedidos.csv', 'lojas.csv', 'funil.csv', 'projetos.csv']) {
    S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'T ' + f, story: null, tone: 'corporate', place: 'screen' };
    D.go('entry'); D.loadBuffer(f, await (await fetch('/dados-teste/' + f)).arrayBuffer());
    for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
    const r = S.read, m = S.mapping, cols = S.ds.columns;
    out[f] = { shape: r.shape + ' (' + r.conf + ') ' + r.why.join('; '), roles: cols.map(c => c.name + '=' + c.role + (c.mtype ? ':' + c.mtype : '') + (c.why ? '[' + c.why + ']' : '')).join(' | '), merges: r.sug.map(x => cols[x.col].name + ': ' + x.from.join('/') + '->' + x.keep + (x.on ? '' : ' (off)')).join(' ; '), map: m.kind + ' x=' + (cols[m.x] || {}).name + ' y=' + (cols[m.y] || {}).name + ' s=' + (cols[m.series] || {}).name + ' agg=' + m.agg };
  }
  out.errors = errs; return JSON.stringify(out, null, 1);
})()
