// Pergunta de área: o vocabulário da área ajusta a leitura das colunas e a medida que abre a história (sem tocar nos números)
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; };
  const run = async (area, csv) => {
    S.user = { guest: true }; S.br = { area, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null };
    D.go('entry'); D.loadBuffer('a.csv', new TextEncoder().encode(csv).buffer); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); await sl(500);
    const c = n => S.ds.columns.find(x => x.name === n); return { c, m: S.mapping, cols: S.ds.columns };
  };
  const rows = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
  // Saúde: paciente é dado pessoal, prontuário é identificador, tempo de espera é duração, atendimentos é medida que abre a história
  const saude = 'Data;Unidade;Prontuário;Paciente;Tempo de espera (min);Custo;Atendimentos\n' + rows(60, i => `0${1 + i % 9}/0${1 + i % 8}/2026;Unidade ${'ABC'[i % 3]};PR${10000 + i};${['Ana Lima', 'Bruno Reis', 'Carla Dias', 'Davi Nunes', 'Elisa Rocha'][i % 5]} ${['Souza', 'Pinto', 'Alves'][i % 3]};${10 + (i * 7) % 50};${1000 + i * 13};${20 + (i * 3) % 40}`);
  let r = await run('health', saude);
  ok('saude-pii', r.c('Paciente').role === 'pii'); ok('saude-id', r.c('Prontuário').role === 'id'); ok('saude-duracao', r.c('Tempo de espera (min)').mtype === 'duration');
  ok('saude-medida', S.ds.columns[S.mapping.y] && S.ds.columns[S.mapping.y].name === 'Atendimentos');
  r = await run('general', saude); ok('geral-medida-custo', S.ds.columns[S.mapping.y] && S.ds.columns[S.mapping.y].name === 'Custo');
  // Marketing: CTR e CPC são médias; leads e impressões somam; a medida que abre é leads
  const mkt = 'Data;Campanha;Canal;Impressões;CTR;CPC;Leads\n' + rows(60, i => `0${1 + i % 9}/0${1 + i % 8}/2026;Camp ${i % 4};${['Busca', 'Social', 'E-mail'][i % 3]};${50000 + i * 91};${1 + (i % 7) / 10};${0.5 + (i % 5) / 10};${100 + i * 3}`);
  r = await run('marketing', mkt);
  ok('mkt-ctr-media', r.c('CTR').mtype === 'attr' && r.c('CTR').agg === 'mean'); ok('mkt-impressoes-soma', r.c('Impressões').mtype === 'count' && r.c('Impressões').agg === 'sum');
  ok('mkt-abre-leads', S.ds.columns[S.mapping.y] && S.ds.columns[S.mapping.y].name === 'Leads');
  // prioridade: o crescimento pesa mais em Growth, a queda em Finanças; nenhuma área esconde fatos
  const pri = (a, area) => storyPri({ insight: true, act: a }, 'prioritize', area);
  ok('boost-growth', pri('trend_up', 'growth') < pri('trend_up', 'general')); ok('boost-finance', pri('drop', 'finance') < pri('drop', 'general')); ok('geral-sem-ajuste', pri('peak', 'general') === pri('peak', undefined));
  // planilha ideal: a área CX mantém a aba de casos como casos; Finanças mantém Vendas como valores
  const buf = await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer();
  for (const [sh, area, want] of [['Casos CX', 'cx', 'cases'], ['Vendas', 'finance', 'ledger'], ['Vendas', 'marketing', 'ledger']]) {
    S.user = { guest: true }; S.br = { area, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null };
    D.go('entry'); D.loadBuffer('ideal.xlsx', buf.slice(0), sh); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(900);
    ok(`ideal-${sh}-${area}`, S.read && S.read.shape === want);
  }
  return JSON.stringify(out, null, 1); })()
