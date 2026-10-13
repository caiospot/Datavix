// Gate 42: catálogo coerente e migração dos ids antigos de S.br.story (7 valores) para os novos, sem quebrar o resto do app
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, bad = [];
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  ok('10 histórias em ordem', NV_ST_ORDER.length === 10 && NV_ST_ORDER.every(id => NV_STORIES[id]) && Object.keys(NV_STORIES).length === 10);
  ok('nomes e perguntas em PT e EN', Object.values(NV_STORIES).every(d => d.name.pt && d.name.en && d.ask.pt && d.ask.en));
  ok('fases 1 (6), 2 (2) e 3 (2)', [1, 2, 3].map(p => Object.values(NV_STORIES).filter(d => d.phase === p).length).join() === '6,2,2');
  const known = new Set(Object.values(NV_CLASS).concat(['attain', 'variance', 'step'])); // famílias do motor + as 3 novas da Fase 3
  const strange = Object.entries(NV_STORIES).flatMap(([id, d]) => d.allow.filter(c => !known.has(c)).map(c => id + ':' + c));
  ok('famílias permitidas existem no motor' + (strange.length ? ' (' + strange.join(',') + ')' : ''), !strange.length);
  const chartsOk = Object.entries(NV_STORIES).every(([id, d]) => [d.charts.primary, ...d.charts.alts].every(c => ALL_CHARTS.includes(c)));
  ok('gráficos de cada história existem', chartsOk);
  const old = ['time', 'compare', 'composition', 'distribution', 'relation', 'flow', 'geo'];
  ok('ids antigos → novos', old.map(nvStoryNorm).join() === 'time,compare,composition,distribution,relation,funnel,geo');
  ok('ids novos continuam novos', NV_ST_ORDER.every(id => nvStoryNorm(id) === id));
  ok('desconhecido e vazio → null', nvStoryNorm('xyz') === null && nvStoryNorm(null) === null && nvStoryNorm('') === null);
  ok('novos → vocabulário antigo', ['rank', 'before_after', 'goal', 'funnel'].map(nvStoryLegacy).join() === 'compare,time,compare,flow');
  ok('ids antigos passam intactos', old.every(id => nvStoryLegacy(id) === id) && nvStoryLegacy(null) === null);
  ok('ida e volta dos 7 antigos', old.every(id => nvStoryLegacy(nvStoryNorm(id)) === id));
  // o app ainda aceita os dois vocabulários
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry');
  D.loadBuffer('lojas.csv', await (await fetch('/dados-teste/lojas.csv')).arrayBuffer()); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(200);
  const cols = S.ds.columns, j = o => JSON.stringify(o);
  ok('suggestMapping: rank = compare', j(suggestMapping('rank', cols)) === j(suggestMapping('compare', cols)));
  ok('suggestMapping: funnel = flow', j(suggestMapping('funnel', cols)) === j(suggestMapping('flow', cols)));
  ok('suggestMapping: before_after = time', j(suggestMapping('before_after', cols)) === j(suggestMapping('time', cols)));
  D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 100 && S.step !== 'editor' && S.step !== 'find'; i++) await sl(150); if (S.step === 'find') D.go('editor'); await sl(800);
  const P = S.piece, built = P.built, m = S.mapping, c1 = chooseChart({ ...S.br, story: 'composition' }, m, built), c2 = chooseChart({ ...S.br, story: 'composition' }, m, built), c3 = chooseChart({ ...S.br, story: 'rank' }, m, built), c4 = chooseChart({ ...S.br, story: 'compare' }, m, built);
  ok('chooseChart estável', j(c1) === j(c2)); ok('chooseChart: rank = compare', j(c3) === j(c4));
  // projeto salvo com story antigo: abre, gera e o plano continua válido
  S.br.story = 'flow'; const pl = nvPlan(P, P.host.ix.meta, buildSteps(P, P.host.ix.meta), 5); ok('plano de 5 slides com story antigo', pl && pl.slides.length === 5 && pl.report.errors.length === 0);
  S.br.story = 'funnel'; const pl2 = nvPlan(P, P.host.ix.meta, buildSteps(P, P.host.ix.meta), 5); ok('plano de 5 slides com story novo', pl2 && pl2.slides.length === 5 && pl2.report.errors.length === 0);
  out.RESUMO = bad.length ? bad : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
