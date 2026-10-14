// Gate 50: modelo Face a face. Critérios de aceite da especificação (§5 e §9) com as duas planilhas da Fórmula 1.
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), out = {}, bad = [];
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  const load = async (file, sheet) => {
    S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry'); await sl(200);
    D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer(), sheet); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100);
    D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
    for (let i = 0; i < 80 && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(400); if (q('.mdl')) { q('.mdl [data-m="1"]').click(); await sl(300); }
  };
  const FORBID = /\b(melhor|melhores|superior|inferior|por causa|culpa|devido|causou|better|best|superior|because)\b/i;
  const txtOf = pl => pl.slides.flatMap(s => [s.head, ...(s.lines || []), s.note, s.big && s.big.label, s.calc && s.calc.formula, ...((s.calc && s.calc.rows) || []).map(r => r.k + ' ' + r.v)]).filter(Boolean).join(' | ');
  // ---- Comparativo 1989-94 (aba principal)
  await load('f1-senna-schumacher.xlsx', 'Comparativo 1989-94'); let P = S.piece, meta = P.host.ix.meta, steps = buildSteps(P, meta), pk = P.built.vs;
  ok('Comparativo: pacote face a face no built', !!pk && pk.form === 'entity-long' && pk.ents.join('|') === 'Ayrton Senna|Michael Schumacher');
  ok('Comparativo: recorte 1991–1994 (1989 e 1990 fora)', pk.score.range === '1991–1994' && pk.absent.length === 2 && pk.absent.every(a => a.e === 1 && /^(1989|1990)$/.test(a.p)));
  ok('Comparativo: 5 métricas de mesma unidade (sem Posição final nem GP disputados)', pk.score.items.map(i => i.name).join(',') === 'Vitórias,Pódios,Poles,Voltas mais rápidas,Pontos oficiais' && pk.notes.ord.includes('Posição final'));
  const tot = n => pk.score.items.find(i => i.name === n).v.join('/');
  ok('Comparativo: totais do recorte (15/10, 26/27, 13/6, 4/15, 219/201)', [tot('Vitórias'), tot('Pódios'), tot('Poles'), tot('Voltas mais rápidas'), tot('Pontos oficiais')].join(' ') === '15/10 26/27 13/6 4/15 219/201');
  const tl = nvVsTally(pk.score.items, 2); ok('Comparativo: placar 3 × 2 sem empates', tl.wins.join() === '3,2' && tl.tie === 0);
  const per = pk.seasons.map(s => s.p + ':' + nvVsTally(s.items, 2).wins.join('x')).join(' ');
  ok('Comparativo: tabela de aceite por temporada (1991 5×0, 1992 2×3, 1993 3×2, 1994 0×5)', per === '1991:5x0 1992:2x3 1993:3x2 1994:0x5'); out.per = per;
  const s94 = pk.seasons.find(s => s.p === '1994'); ok('Comparativo: 1994 Poles 6 × 3 a favor de Schumacher', s94.items.find(i => i.name === 'Poles').v.join('/') === '3/6');
  ok('Comparativo: nota de exposição 1991 (16 × 6)', (pk.notes.expoGap || []).some(g => g.p === '1991' && g.v.join('/') === '16/6'));
  const plans = {}; for (const N of [2, 5, 10]) plans[N] = nvPlan(P, meta, steps, N, 'versus');
  ok('Comparativo: planos 2, 5 e 10 válidos, "até N" e história face a face', [2, 5, 10].every(N => plans[N].report.ok && plans[N].slides.length <= N && plans[N].story === 'versus')); out.len = [2, 5, 10].map(N => plans[N].slides.length).join(','); out.plan10 = plans[10].slides.map(s => s.id).join(' > ');
  ok('Comparativo: roteiro de 10 tem capa, placar, períodos, totais, eficiência, limites e síntese', ['vs-cover', 'vs-score', 'vs-seasons', 'vs-totals', 'vs-eff', 'vs-limits', 'vs-synth'].every(id => plans[10].slides.some(s => s.id === id)));
  const all10 = txtOf(plans[10]) + ' | ' + txtOf(plans[5]) + ' | ' + txtOf(plans[2]);
  ok('Comparativo: nenhum texto com melhor/superior/por causa/culpa', !FORBID.test(all10)); out.forbid = (all10.match(FORBID) || [])[0] || null;
  ok('Comparativo: sem slide "sem dados" e sem "lidera" sobre contagem de linhas', !/sem dados|lidera:|do total\./i.test(all10));
  ok('Comparativo: limites citam 1989 e 1990 e a Posição final', /Schumacher não tem registro em 1989 e 1990/.test(txtOf(plans[10])) && /Posição final/.test(txtOf(plans[10])));
  const sc = plans[10].slides.find(s => s.id === 'vs-score'); ok('Placar: número "3 × 2", ver cálculo e barras por entidade', sc.big.text === '3 × 2' && sc.calc.rows.length >= 5 && sc.viz.rows.length === 2);
  ok('Totais: razão do maior contraste calculada (3,8× em Voltas mais rápidas)', plans[10].slides.find(s => s.id === 'vs-totals').big.text === '3,8×');
  const ef = plans[10].slides.find(s => s.id === 'vs-eff'); ok('Eficiência: taxa calculada com a conta à vista (num ÷ den)', !!ef && /÷/.test(ef.calc.rows[0].v) && ef.ev && ef.ev.kind === 'vsrate');
  // apresentação em inglês também gera
  // ---- Sheet1 (perfil e carreira)
  await load('f1-senna-schumacher.xlsx', 'Sheet1'); P = S.piece; meta = P.host.ix.meta; steps = buildSteps(P, meta); pk = P.built.vs;
  ok('Sheet1: pacote face a face (metric-long) com bloco Carreira Completa', !!pk && pk.form === 'metric-long' && pk.score.block === 'Carreira Completa');
  const names = pk.score.items.map(i => i.name); ok('Sheet1: métricas numéricas da carreira (Títulos, Vitórias, Poles, Pódios, Voltas, Aproveitamento)', ['Títulos Mundiais', 'Vitórias Totais', 'Pole Positions', 'Pódios Totais', 'Voltas Mais Rápidas', 'Aproveitamento Poles'].every(n => names.includes(n)) && !names.includes('GPs Disputados')); out.names = names.join(',');
  ok('Sheet1: Idade e Posição no Campeonato ficam fora (ordem, não quantidade)', pk.notes.ord.includes('Idade') && pk.notes.ord.includes('Posição no Campeonato'));
  ok('Sheet1: abandonos com sugestão "menor é melhor" só como nota', pk.notes.lower.some(n => /Abandonos/.test(n)));
  const ds = S.ds, tcol = ds.columns.find(c => c.name === 'Texto'), alltexts = new Set(); for (let i = 0; i < ds.rowCount; i++) alltexts.add(nvVsLabel(tcol, i));
  ok('Sheet1: perfil traz os textos da planilha sem alteração', pk.profile.length >= 3 && pk.profile.every(o => o.t.filter(x => x !== null).every(t => alltexts.has(t)))); 
  const pl2 = {}; for (const N of [2, 5, 10]) pl2[N] = nvPlan(P, meta, steps, N, 'versus');
  ok('Sheet1: planos válidos e até N', [2, 5, 10].every(N => pl2[N].report.ok && pl2[N].slides.length <= N)); out.len2 = [2, 5, 10].map(N => pl2[N].slides.length).join(',');
  ok('Sheet1: perfil, eficiência com taxa da planilha e calculada', pl2[10].slides.some(s => s.id === 'vs-profile') && pl2[10].slides.some(s => s.id === 'vs-eff'));
  const t2 = [2, 5, 10].map(N => txtOf(pl2[N])).join(' | '); ok('Sheet1: nenhum texto com melhor/superior/por causa/culpa (fora o texto da planilha)', !FORBID.test(t2.replace(/Estilo de Pilotagem[^|]*/g, ''))); out.forbid2 = (t2.match(FORBID) || [])[0] || null;
  ok('Sheet1: nenhum achado "lidera" sobre contagem de linhas', !/lidera:|teve o (maior|menor) valor|do total\./.test(t2));
  // ---- escolha da história: Face a face é a primeira sugestão para as duas planilhas
  const env = storyEnv(P); ok('Sheet1: Face a face é a primeira história sugerida', env.rk.list[0] === 'versus' && env.rk.all.versus.ok); out.list = env.rk.list.join(',');
  // ---- outras planilhas: o modelo não aparece
  for (const f of ['lojas.csv', 'pedidos.csv', 'metas.csv', 'funil.csv', 'projetos.csv']) {
    S.user = { guest: true }; D.go('upload'); S.ds = null; D.loadBuffer(f, await (await fetch('/dados-teste/' + f)).arrayBuffer()); for (let i = 0; i < 150 && !(S.ds && S.fileName); i++) await sl(100); await sl(400);
    const el = nvStoryEligibility(S.ds, { lang: 'pt' }); ok('sem face a face em ' + f, el.versus && el.versus.ok === false);
  }
  // ---- PPTX com as barras pareadas
  await load('f1-senna-schumacher.xlsx', 'Comparativo 1989-94'); P = S.piece; P.br = P.br || {}; P.br.storyKind = 'versus'; S.br.storyKind = 'versus';
  const deck = pxDeck(P), xml = deck.slides.map(s => s.sh.join('')).join(''); ok('PPTX: barras pareadas desenhadas e slides do face a face', /name="Barra"/.test(xml) && /Ayrton Senna/.test(xml) && deck.slides.length >= 5); out.pptxSlides = deck.slides.length;
  // ---- inglês: mesmos números, sem sobra de português nem undefined
  { const en = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'EN'); if (en) en.click(); await sl(400);
    const P2 = S.piece, m2 = P2.host.ix.meta, st2 = buildSteps(P2, m2), pe = nvPlan(P2, m2, st2, 10, 'versus'), te = txtOf(pe);
    ok('EN: plano válido, sem undefined/NaN e sem português', pe.report.ok && !/undefined|NaN|métrica|recorte|Placar/.test(te) && /Ayrton Senna has the highest value in 3/.test(te)); out.en = pe.slides.map(s => s.planTitle).join(' > ');
    const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sl(300); }
  out.RESUMO = bad.length ? bad : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
