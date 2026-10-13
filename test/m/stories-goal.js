// Gate 47: Meta e desempenho, Antes e depois. Achados novos validados, arcos, data do marco e ausência de meta inventada. Rodar com ?tell
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, bad = [], q = s => document.querySelector(s);
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  const load = async file => {
    S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry'); await sl(200);
    D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer()); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100);
    D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
    for (let i = 0; i < 80 && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(500); if (q('.mdl')) { q('.mdl [data-m="1"]').click(); await sl(300); }
  };
  const plans = (P, id) => { const meta = P.host.ix.meta, steps = buildSteps(P, meta), r = {}; for (const N of [2, 5, 10]) { const pl = nvPlan(P, meta, steps, N, id); r[N] = pl; } return r; };
  const planOk = (pl, N) => pl && pl.slides.length >= 1 && pl.slides.length <= N && pl.report.ok;
  // ----- meta
  await load('metas.csv'); let P = S.piece, e = nvStoryEligibility(S.ds, { lang: 'pt' });
  ok('metas: Meta e desempenho possível', e.goal.ok && /×/.test(e.goal.why)); out.meta = e.goal.why + ' | ' + e.goal.score.toFixed(2);
  ok('metas: a planilha tem dados de meta no built', !!P.built.goal && P.built.goal.M > 0); out.totais = P.built.goal ? Math.round(P.built.goal.A) + ' / ' + Math.round(P.built.goal.M) : '—';
  const gi = nvGoalInsights(P.built, 'pt'), chk = nvValidate(gi, 'pt'); out.achados = gi.map(i => i.text).join(' || ');
  ok('achados de meta têm evidência válida (recalculada)', gi.length >= 2 && chk.ok && !chk.errors.length);
  const g = P.built.goal, att = gi.find(i => i.id === 'goal_attain'); ok('atingimento bate com a soma dos dados', att && Math.abs(att.ev.shown[0].value - g.A / g.M * 100) < 1e-9);
  const rk = nvStoryRank(S.ds, P, storyEnv(P).pool, {}); ok('Meta é a primeira sugerida (ou entre as 3)', rk.list.includes('goal')); out.sugere = rk.list.join(',');
  const pg = plans(P, 'goal'); ok('arcos de Meta válidos (2, 5, 10)', [2, 5, 10].every(N => planOk(pg[N], N))); out.roteiroMeta = pg[5].slides.map(s => s.planTitle + (s.synthetic ? '' : ' [f]')).join(' > ');
  ok('Meta: o roteiro usa só achados de meta', pg[10].slides.filter(s => !s.synthetic).every(s => nvStoryAllows('goal', s)));
  // ----- sem meta: nada inventado
  await load('lojas.csv'); e = nvStoryEligibility(S.ds, { lang: 'pt' }); ok('lojas: Meta indisponível (sem coluna de meta)', !e.goal.ok && !e.goal.planned); out.motivoMeta = e.goal.why; ok('lojas: sem achados de meta', !S.piece.built.goal && nvGoalInsights(S.piece.built, 'pt').filter(i => /goal/.test(i.id)).length === 0);
  // ----- antes e depois com coluna de fase
  await load('antes-depois.csv'); P = S.piece; e = nvStoryEligibility(S.ds, { lang: 'pt' });
  ok('fase: Antes e depois possível e sugerível', e.before_after.ok && e.before_after.score >= NV_ST_MIN_SCORE && !e.before_after.needsCut); out.fase = e.before_after.why;
  ok('fase: o degrau é calculado', !!P.built.step && P.built.step.byPhase && P.built.step.nb >= 4 && P.built.step.na >= 4); const st = P.built.step; out.degrau = st ? `antes ${Math.round(st.b)} (${st.nb}) depois ${Math.round(st.a)} (${st.na})` : '—';
  const si = nvGoalInsights(P.built, 'pt').filter(i => i.id === 'step_change'), sv = nvValidate(si, 'pt'); out.achadoStep = si.map(i => i.text).join(' || ');
  ok('degrau validado (t de Welch recalculado)', si.length === 1 && sv.ok);
  ok('texto sem causa ("depois do marco", nunca "por causa")', si.every(i => !NV_CFG.causal.test(i.text)));
  const pb = plans(P, 'before_after'); ok('arcos de Antes e depois válidos', [2, 5, 10].every(N => planOk(pb[N], N))); out.roteiroAD = pb[5].slides.map(s => s.planTitle).join(' > ');
  // ----- série sem fase: só com a data do marco
  await load('serie-sem-fase.csv'); P = S.piece; e = nvStoryEligibility(S.ds, { lang: 'pt' });
  ok('sem fase: possível, mas só com a data (não sugerida)', e.before_after.ok && e.before_after.needsCut && e.before_after.score < NV_ST_MIN_SCORE); out.semFase = e.before_after.why;
  ok('sem data do marco não há degrau', !P.built.step);
  const sel = q('[data-a=story-kind]'); sel.value = 'before_after'; sel.dispatchEvent(new Event('change', { bubbles: true })); await sl(800);
  const inp = q('[data-a=story-cut]'); ok('o painel pede a data do marco', !!inp);
  const cutD = '2025-05-26'; inp.value = cutD; inp.dispatchEvent(new Event('change', { bubbles: true })); await sl(1800); for (let i = 0; i < 40 && !(S.piece.host && S.piece.host.ix); i++) await sl(150);
  const P2 = S.piece; ok('com a data escolhida o degrau aparece', !!P2.built.step && P2.built.step.cutMs === Date.parse(cutD + 'T00:00:00Z')); out.degrau2 = P2.built.step ? `antes ${Math.round(P2.built.step.b)} depois ${Math.round(P2.built.step.a)}` : '—';
  const pc = plans(P2, 'before_after'); ok('arcos com data escolhida válidos', [2, 5, 10].every(N => planOk(pc[N], N))); ok('a data fica guardada na peça', P2.br.cut === Date.parse(cutD + 'T00:00:00Z'));
  // um marco que deixa menos de 4 períodos de um lado não vira achado
  S.br.cut = Date.parse('2025-01-20T00:00:00Z'); const edge = nvStepStats(S.ds, S.br.cut); ok('marco colado no começo (só 2 semanas antes) não gera degrau', edge === null);
  // diferença dentro da variação normal é recusada
  const fake = { a: 1010, b: 1000, sa: 200, sb: 200, na: 6, nb: 6 }, itm = { id: 'x', text: 'depois +1%', ev: nvEv('step', fake, [{ k: 'ch', value: (fake.a / fake.b - 1) * 100, text: '+1%' }], { n: 12 }) };
  ok('degrau dentro da variação normal é recusado pelo validador', nvCheckItem(itm).errors.some(x => x.code === 'insignificant'));
  out.RESUMO = bad.length ? bad : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
