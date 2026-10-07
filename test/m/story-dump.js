(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
  for (const f of ['vendas.csv', 'fluxo.csv', 'financeiro.xlsx', 'unidades.csv', 'canais.csv', 'pedidos.csv', 'lojas.csv', 'funil.csv', 'projetos.csv']) {
    S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'T ' + f, story: 'compare', tone: 'corporate', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
    D.go('entry'); D.loadBuffer(f, await (await fetch('/dados-teste/' + f)).arrayBuffer());
    for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
    D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
    for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150); await sleep(700);
    const b = S.piece.built, tx = b.totX || [], ts = b.totS || [];
    out[f] = { type: S.piece.type, kind: b.kind, agg: b.aggKind, unit: b.unit, isTime: b.xIsTime, names: b.names, rows: b.stats && b.stats.rowsUsed, totX: tx.length + ' ' + JSON.stringify(tx.slice(0, 2)), totS: ts.length + ' ' + JSON.stringify(ts.slice(0, 2)), ins: S.piece.insights.map(i => i.id + ':' + i.text.slice(0, 50)), keys: Object.keys(b).join(',').slice(0, 120) };
  }
  return JSON.stringify(out, null, 1); })()
