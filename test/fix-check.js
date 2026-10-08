// Planilhas bagunçadas: título acima do cabeçalho, subtotais, rodapé, períodos em colunas. Confere o que foi arrumado e que as somas batem com a planilha (valores conferidos com openpyxl)
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
  const buf = await (await fetch('/dados-teste/datavix-planilha-bagunca.xlsx')).arrayBuffer();
  const load = async sh => { S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; S.ds = null; D.go('entry'); D.loadBuffer('b.xlsx', buf.slice(0), sh); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(500); };
  const sums = ds => Object.fromEntries(ds.columns.filter(c => c.kind === 'number').map(c => [c.name, Math.round(Array.from(c.data).reduce((a, x) => a + (Number.isNaN(x) ? 0 : x), 0) * 100) / 100]));
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; };
  await load('Título e totais'); let d = S.ds, f = d.fixes, sm = sums(d);
  ok('titulo-linhas', d.rowCount === 8 && f.title.n === 2); ok('totais-e-rodape', f.totals.n === 5); ok('titulo-somas', sm['Quantidade'] === 330 && sm['Receita (R$)'] === 752966.9);
  await load('Largo por mês'); d = S.ds; f = d.fixes; sm = sums(d);
  ok('mes-desdobrado', d.rowCount === 180 && f.unpivot.k === 12 && f.unpivot.dropped.join() === 'Total' && f.totals.n === 1); ok('mes-periodo-data', d.columns.find(c => c.name === 'Período').kind === 'date'); ok('mes-soma', sm['Valor'] === 9948454.89 && Object.keys(sm).length === 1);
  ok('mes-resumo-somado', S.read.shape === 'summary');
  D.go('read'); await sl(400); ok('tela-mostra-arrumacoes', !!document.querySelector('.rd-fix') && document.querySelectorAll('[data-c=rd-fix]').length === 2);
  const cb = document.querySelector('[data-c=rd-fix][data-k=unpivot]'); cb.checked = false; cb.dispatchEvent(new Event('change', { bubbles: true }));
  for (let i = 0; i < 60 && S.ds.rowCount === 180; i++) await sl(100); await sl(500); ok('desfazer', S.ds.rowCount === 15 && S.step === 'read' && !!S.ds.columns.find(c => c.name === 'jan/25'));
  await load('Largo por ano'); d = S.ds; sm = sums(d); ok('ano-desdobrado', d.rowCount === 24 && d.fixes.unpivot.k === 4 && sm['Valor'] === 112703719 && d.columns.find(c => c.name === 'Período').kind === 'date');
  await load('Mês sem ano'); d = S.ds; sm = sums(d); ok('mes-sem-ano', d.rowCount === 24 && d.columns.find(c => c.name === 'Período').kind === 'category' && sm['Valor'] === 11515);
  await load('Largo com meta'); d = S.ds; ok('meta-nao-desdobra', d.rowCount === 4 && d.fixes.unpivot.skipped === 'numeric' && d.columns.length === 5);
  await load('Subtotal verificado'); d = S.ds; sm = sums(d); ok('subtotal-por-soma', d.rowCount === 7 && d.fixes.totals.n === 2 && sm['Orçado (R$)'] === 504499.47 && sm['Realizado (R$)'] === 483198);
  // planilhas sem bagunça não mudam: nenhuma arrumação
  const ideal = await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer();
  for (const sh of ['Vendas', 'Casos CX', 'Funil']) { S.ds = null; D.go('entry'); D.loadBuffer('i.xlsx', ideal.slice(0), sh); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(500); ok('sem-arrumacao-' + sh, Object.keys(S.ds.fixes || {}).length === 0); }
  return JSON.stringify(out, null, 1); })()
