// Gate 46: Geografia e Funil. Elegibilidade (UF, latitude/longitude, etapas), arcos válidos e remontagem da peça com o mapeamento da história. Rodar com ?tell
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, bad = [], q = s => document.querySelector(s);
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  const load = async (file, sheet, br) => {
    S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null, ...(br || {}) }; D.go('entry'); await sl(200);
    D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer(), sheet); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100);
    D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
    for (let i = 0; i < 60 && !q('.mdl .tell-c') && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(300);
  };
  // funil: leads com etapas
  await load('funil.csv'); const e1 = nvStoryEligibility(S.ds, { lang: 'pt' });
  ok('funil: Funil possível com as etapas', e1.funnel.ok && /→/.test(e1.funnel.why)); out.funil = e1.funnel.why + ' | score ' + e1.funnel.score.toFixed(2);
  ok('funil: sem latitude/UF, Geografia indisponível', !e1.geo.ok && !e1.geo.planned);
  const rk = nvStoryRank(S.ds, S.piece, storyEnv(S.piece).pool, {}); out.sugere1 = rk.list.join(',');
  if (q('.mdl')) { q('.mdl [data-m="1"]').click(); await sl(300); }
  const sel = q('[data-a=story-kind]'); ok('seletor oferece Funil', sel && [...sel.options].some(o => o.value === 'funnel' && !o.disabled));
  sel.value = 'funnel'; sel.dispatchEvent(new Event('change', { bubbles: true })); await sl(1500);
  const P = S.piece; ok('Funil remonta a peça com o mapeamento de fluxo', P.br.storyKind === 'funnel' && P.mstory === 'flow'); out.tipoDepois = P.type;
  const meta = P.host && P.host.ix && P.host.ix.meta; for (let i = 0; i < 30 && !(S.piece.host && S.piece.host.ix); i++) await sl(150);
  const P2 = S.piece, m2 = P2.host.ix.meta, st2 = buildSteps(P2, m2), fails = [];
  for (const N of [2, 5, 10]) { const pl = nvPlan(P2, m2, st2, N, 'funnel'); if (!pl || pl.slides.length !== N || !pl.report.ok) fails.push(N + ': ' + (pl ? pl.report.errors.map(e => e.code).join(',') : 'sem plano')); out['funil_' + N] = pl ? pl.slides.map(s => s.planTitle).join(' > ').slice(0, 160) : ''; }
  ok('arcos do Funil válidos (2, 5, 10)' + (fails.length ? ' ' + fails.join(' | ') : ''), !fails.length);
  // geografia: planilha ideal (UF)
  await load('datavix-planilha-ideal.xlsx', 'Vendas'); const e2 = nvStoryEligibility(S.ds, { lang: 'pt' });
  ok('UF: Geografia possível', e2.geo.ok); out.geo = e2.geo.why + ' | score ' + (e2.geo.score || 0).toFixed(2);
  if (q('.mdl')) { q('.mdl [data-m="1"]').click(); await sl(300); }
  const sel2 = q('[data-a=story-kind]'); sel2.value = 'geo'; sel2.dispatchEvent(new Event('change', { bubbles: true })); await sl(1500);
  for (let i = 0; i < 30 && !(S.piece.host && S.piece.host.ix); i++) await sl(150);
  const P3 = S.piece, m3 = P3.host.ix.meta, st3 = buildSteps(P3, m3), f3 = [];
  ok('Geografia remonta com o mapeamento de geo', P3.br.storyKind === 'geo' && P3.mstory === 'geo'); out.tipoGeo = P3.type;
  for (const N of [2, 5, 10]) { const pl = nvPlan(P3, m3, st3, N, 'geo'); if (!pl || pl.slides.length !== N || !pl.report.ok) f3.push(N + ': ' + (pl ? pl.report.errors.map(e => e.code).join(',') : 'sem plano')); out['geo_' + N] = pl ? pl.slides.map(s => s.planTitle).join(' > ').slice(0, 160) : ''; }
  ok('arcos de Geografia válidos' + (f3.length ? ' ' + f3.join(' | ') : ''), !f3.length);
  // latitude e longitude
  await load('pontos-geo.csv'); const e3 = nvStoryEligibility(S.ds, { lang: 'pt' }); ok('lat/long: Geografia possível', e3.geo.ok); out.latlon = e3.geo.why;
  // sem estrutura geográfica nem etapas
  await load('lojas.csv'); const e4 = nvStoryEligibility(S.ds, { lang: 'pt' }); ok('lojas: sem Geografia nem Funil', !e4.geo.ok && !e4.funnel.ok); out.motivos = e4.geo.why + ' | ' + e4.funnel.why;
  ok('a peça de lojas não foi remontada sem necessidade', S.piece.br.storyKind !== 'geo' && S.piece.br.storyKind !== 'funnel');
  out.RESUMO = bad.length ? bad : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
