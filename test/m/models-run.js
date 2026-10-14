// Gate 55: modelos extras. Resumo por temporada (a aba Comparativo da F1 como evolução por piloto) e Ficha / perfil (uma entidade, muitas métricas).
// Os números do pacote e dos slides são recalculados aqui, de forma independente, a partir das colunas da planilha lida.
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), out = {}, bad = [];
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  const lang = l => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === l); if (b) b.click(); };
  lang('PT'); await sl(300);
  const load = async (file, sheet, buf) => {
    S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry'); await sl(200); S.ds = null; S.piece = null;
    D.loadBuffer(file, buf || await (await fetch('/dados-teste/' + file)).arrayBuffer(), sheet); for (let i = 0; i < 150 && S.step !== 'preview' && S.step !== 'sheet'; i++) await sl(100); await sl(300);
    if (S.step === 'sheet') { q('[data-a=wb-go]').click(); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); }
    D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
    for (let i = 0; i < 80 && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(500); if (q('.mdl')) { q('.mdl [data-m="1"]').click(); await sl(300); }
  };
  const loadDs = async (file, sheet, buf) => { // só a leitura, sem gerar a peça
    S.user = { guest: true }; D.go('upload'); S.ds = null; D.loadBuffer(file, buf || await (await fetch('/dados-teste/' + file)).arrayBuffer(), sheet); for (let i = 0; i < 150 && !(S.ds && S.fileName) && S.step !== 'sheet'; i++) await sl(100);
    if (S.step === 'sheet' && S.sheets && S.sheets.length) { const first = S.sheets[0]; D.go('upload'); S.ds = null; D.loadBuffer(file, buf || await (await fetch('/dados-teste/' + file)).arrayBuffer(), first); for (let i = 0; i < 150 && !(S.ds && S.fileName); i++) await sl(100); }
    await sl(350); return S.ds;
  };
  const FORBID = /\b(melhor|melhores|superior|inferior|por causa|culpa|devido|causou|better|best|because)\b/i, BADTXT = /undefined|NaN|\[object|null\b/;
  const txtOf = pl => pl.slides.flatMap(s => [s.head, ...(s.lines || []), s.note, s.big && s.big.text, s.big && s.big.label, s.calc && s.calc.title, s.calc && s.calc.formula, ...((s.calc && s.calc.rows) || []).map(r => r.k + ' ' + r.v), s.viz && s.viz.title, s.viz && s.viz.note, ...(s.viz && s.viz.head ? s.viz.head : []), ...((s.viz && s.viz.rows) || []).flatMap(r => (Array.isArray(r) ? r : [r.k, r.t]).map(c => (c && typeof c === 'object' ? c.t : c))), ...((s.viz && s.viz.items) || []).flatMap(r => [r.k, r.t])]).filter(x => x !== null && x !== undefined && x !== '').join(' | ');
  const col = (ds, n) => ds.columns.find(c => c.name === n), lab = (c, i) => nvVsAt(c, i);

  // =========================================================== A) RESUMO POR TEMPORADA: aba Comparativo 1989-94
  await load('f1-senna-schumacher.xlsx', 'Comparativo 1989-94'); let P = S.piece, ds = S.ds, meta = P.host.ix.meta, steps = buildSteps(P, meta), pk = P.built.vs;
  const elig = nvStoryEligibility(ds, { lang: 'pt' });
  ok('A: Resumo por temporada é possível e tem pontuação 0,9', elig.season.ok && elig.season.score === 0.9 && /6 períodos/.test(elig.season.why) && /6 métricas/.test(elig.season.why)); out.season_why = elig.season.why;
  ok('A: Ficha / perfil não serve (a planilha tem 2 entidades)', !elig.profile.ok && /uma só entidade/.test(elig.profile.why));
  const rk = nvStoryRank(ds, P, nvpPool(P, meta, steps), { lang: 'pt' }); ok('A: o Face a face continua primeiro e o Resumo por temporada vem logo depois', rk.list[0] === 'versus' && rk.list[1] === 'season'); out.rank = rk.list.join(',') + ' | ' + rk.possible.join(',');
  ok('A: "Temporada" (anos como número) não é medida: não entra em soma nem ranking', col(ds, 'Temporada').role === 'id' && !isMeasure(col(ds, 'Temporada')));
  // recálculo independente: máximo de cada medida por piloto e temporada, direto das colunas
  const ents = ['Ayrton Senna', 'Michael Schumacher'], names = ['GP disputados*', 'Vitórias', 'Pódios', 'Poles', 'Voltas mais rápidas', 'Pontos oficiais', 'Posição final'], raw = {};
  for (let i = 0; i < ds.rowCount; i++) { const e = lab(col(ds, 'Piloto'), i), t = String(col(ds, 'Temporada').data[i]); raw[e] = raw[e] || {}; raw[e][t] = {}; names.forEach(n => { const v = col(ds, n).data[i]; raw[e][t][n] = Number.isFinite(v) ? v : null; }); }
  const absent = { 'Michael Schumacher': ['1989', '1990'] }; // "Sem participação" nunca vira zero
  const D55 = nvSsData(pk); ok('A: dados por entidade: Senna 6 temporadas, Schumacher 4 (1989 e 1990 ficam de fora)', D55.per[0].rows.length === 6 && D55.per[1].rows.length === 4 && D55.per[1].rows[0].p === '1991');
  let cellsOk = true, cnt = 0; D55.per.forEach(p => p.rows.forEach(r => { Object.entries(r.v).forEach(([n, v]) => { cnt++; if (raw[p.name][r.p][n] !== v) cellsOk = false; }); if (r.ex !== raw[p.name][r.p]['GP disputados*']) cellsOk = false; })); ok('A: todos os valores do pacote por entidade batem com as células da planilha (' + cnt + ' valores)', cellsOk && cnt >= 50);
  ok('A: Schumacher em 1989 e 1990 não aparece com zeros', !D55.per[1].rows.some(r => absent['Michael Schumacher'].includes(r.p)));
  const peakOf = (e, n) => { const ps = Object.keys(raw[e]).filter(t => raw[e][t][n] !== null && !(e === 'Michael Schumacher' && absent[e].includes(t))), top = Math.max(...ps.map(t => raw[e][t][n])); return { top, ps: ps.filter(t => raw[e][t][n] === top) }; };
  let peaksOk = true; ents.forEach((e, k) => ['Vitórias', 'Pódios', 'Poles', 'Voltas mais rápidas', 'Pontos oficiais'].forEach(n => { const a = peakOf(e, n), b = D55.per[k].peaks[n]; if (!b || b.top !== a.top || b.ps.join() !== a.ps.join()) peaksOk = false; })); ok('A: maior valor e período de cada métrica batem com o recálculo (Senna Vitórias 7 em 1991, Schumacher Pontos 92 em 1994…)', peaksOk);
  ok('A: Posição final (ordem) não tem maior valor marcado', !D55.per[0].peaks['Posição final'] && !D55.per[1].peaks['Posição final']);
  ok('A: temporada incompleta: Senna 1994 (3 de 16) e Schumacher 1991 (6 de 16); Schumacher 1994 (14 de 16) não', D55.per[0].partial.length === 1 && D55.per[0].partial[0].p === '1994' && D55.per[0].partial[0].ex === 3 && D55.per[1].partial.length === 1 && D55.per[1].partial[0].p === '1991' && D55.per[1].partial[0].ex === 6);
  // planos de 2, 5 e 10 slides
  const plans = {}; for (const N of [2, 5, 10]) plans[N] = nvPlan(P, meta, steps, N, 'season');
  ok('A: planos 2, 5 e 10 válidos, "até N" e história resumo por temporada', [2, 5, 10].every(N => plans[N].report.ok && plans[N].slides.length <= N && plans[N].story === 'season')); out.len = [2, 5, 10].map(N => plans[N].slides.length).join(','); out.errs = JSON.stringify(plans[10].report.errors);
  ok('A: roteiro de 2 = maior valor de cada métrica + limites', plans[2].slides.map(s => s.id).join() === 'ss-peaks,ss-limits'); ok('A: roteiro de 5 = uma tabela por piloto, maior valor, limites e a conclusão em branco', plans[5].slides.map(s => s.id).join() === 'ss-ent-0,ss-ent-1,ss-peaks,ss-limits,vs-conclusion'); ok('A: roteiro de 10 = capa, pilotos, maior valor, limites e conclusão', plans[10].slides.map(s => s.id).join() === 'ss-cover,ss-ent-0,ss-ent-1,ss-peaks,ss-limits,vs-conclusion'); out.plan10 = plans[10].slides.map(s => s.id).join(' > ');
  const e0 = plans[10].slides.find(s => s.id === 'ss-ent-0'), e1 = plans[10].slides.find(s => s.id === 'ss-ent-1');
  ok('A: frase do Senna com os números da planilha', e0.head === 'Ayrton Senna, 1989–1994: maior valor de Vitórias em 1991 (7), de Pódios em 1991 (12) e de Poles em 1989 (13).'); out.head0 = e0.head;
  ok('A: frase do Schumacher (1991–1994, tudo em 1994)', e1.head === 'Michael Schumacher, 1991–1994: maior valor de Vitórias em 1994 (8), de Pódios em 1994 (10) e de Poles em 1994 (6).'); out.head1 = e1.head;
  ok('A: número grande 7 (Vitórias em 1991) com evidência recalculável (sspeak)', e0.big.text === '7' && /VIT/.test(e0.big.label) && e0.ev && e0.ev.kind === 'sspeak' && nvCheckItem(e0, 'pt').errors.length === 0);
  const tb = e0.viz; ok('A: tabela do Senna: métricas nas linhas, 6 temporadas nas colunas, exposição na primeira linha', tb.kind === 'table' && tb.plain === true && tb.head.join() === 'Métrica,1989,1990,1991,1992,1993,1994' && tb.rows.length === 7 && tb.rows[0][0] === 'GP disputados*');
  let tbOk = true; tb.rows.forEach(r => { const n = r[0]; r.slice(1).forEach((c, i) => { const t = (c && typeof c === 'object') ? c.t : c, v = raw['Ayrton Senna'][String(1989 + i)][n]; if (String(t).replace(/\./g, '') !== String(v)) tbOk = false; }); }); ok('A: as 42 células da tabela do Senna são idênticas às da planilha', tbOk);
  const his = tb.rows.flatMap((r, k) => r.slice(1).map((c, i) => (c && c.hi ? r[0] + ':' + (1989 + i) : null)).filter(Boolean)); ok('A: células de maior valor marcadas (Vitórias 1991, Pódios 1991, Poles 1989, Voltas 1989, Pontos 1991)', his.sort().join() === ['Vitórias:1991', 'Pódios:1991', 'Poles:1989', 'Voltas mais rápidas:1989', 'Pontos oficiais:1991'].sort().join()); out.his = his.join(', ');
  ok('A: nota de temporada incompleta com a conta (1994: 3 de 16)', /1994 \(3 de 16\)/.test(e0.note) && /GP disputados\*/.test(e0.note) && /1991 \(6 de 16\)/.test(e1.note));
  const pks = plans[10].slides.find(s => s.id === 'ss-peaks'); ok('A: tabela de maior valor lado a lado (Vitórias: 1991 · 7 × 1994 · 8)', pks.viz.rows[0].join('|') === 'Vitórias|1991 · 7|1994 · 8' && pks.viz.head.join() === 'Métrica,Ayrton Senna,Michael Schumacher' && pks.viz.rows.length === 5);
  const lim = plans[10].slides.find(s => s.id === 'ss-limits'), limTxt = lim.lines.join(' | ');
  ok('A: limites: 4 e 6 temporadas, Schumacher sem registro em 1989 e 1990, incompletas, Posição final e "não por que mudou"', /Ayrton Senna: 6 temporadas/.test(limTxt) && /Michael Schumacher: 4 temporadas/.test(limTxt) && /Michael Schumacher não tem registro em 1989 e 1990/.test(limTxt) && /1994 \(3 de 16\)/.test(limTxt) && /Posição final/.test(limTxt) && /não por que mudou/.test(limTxt)); out.lim = limTxt.slice(0, 400);
  const all = [2, 5, 10].map(N => txtOf(plans[N])).join(' || '); ok('A: nenhum texto com melhor/superior/por causa/culpa e sem "undefined" ou "NaN"', !FORBID.test(all) && !BADTXT.test(all)); out.forbid = (all.match(FORBID) || [])[0] || null;
  const cc = plans[10].slides.find(s => s.id === 'vs-conclusion'); ok('A: conclusão em branco, editável', cc.blank === true && cc.head === '' && cc.noNote === true);
  ok('A: ver cálculo do slide por piloto lista o maior valor de cada métrica', e0.calc.rows.length === 5 && e0.calc.rows[0].k === 'Vitórias' && e0.calc.rows[0].v === '7 · 1991');
  // PPTX
  P.br = P.br || {}; P.br.storyKind = 'season'; S.br.storyKind = 'season'; let deck = pxDeck(P), xml = deck.slides.map(s => s.sh.join('')).join('');
  ok('A: PPTX: tabela com destaque do maior valor e os números do Senna', /name="Destaque"/.test(xml) && /name="Célula"/.test(xml) && /Ayrton Senna/.test(xml) && deck.slides.length >= 6); out.pptxSeason = deck.slides.length;
  { const vp = videoPlan(P, 'vertical'), st = vp.scenes.filter(x => x.kind === 'step'), kk = st.map(x => x.kick); ok('A: vídeo: o slide do Senna não se perde (só o contexto vira gancho) e a conclusão em branco não vira cena; tabelas viram cenas de texto', kk.includes('Ayrton Senna') && kk.includes('Michael Schumacher') && !kk.includes('Conclusão') && st.every(x => x.noChart)); out.videoSeason = kk.join(' > '); }
  // inglês
  lang('EN'); await sl(400); const pe = nvPlan(P, meta, steps, 10, 'season'), te = txtOf(pe);
  ok('A: em inglês: plano válido, "Highest value of each metric" e sem "undefined"', pe.report.ok && !BADTXT.test(te) && /Highest value of each metric/.test(te)); out.en0 = pe.slides.find(s => s.id === 'ss-ent-0').head;
  ok('A: em inglês a frase do Senna', pe.slides.find(s => s.id === 'ss-ent-0').head === 'Ayrton Senna, 1989–1994: highest value of Vitórias in 1991 (7), of Pódios in 1991 (12) and of Poles in 1989 (13).'); lang('PT'); await sl(300);

  // =========================================================== B) FICHA / PERFIL
  await load('ficha-municipio.csv'); P = S.piece; ds = S.ds; meta = P.host.ix.meta; steps = buildSteps(P, meta);
  let fc = P.built.fc; const csvRows = (await (await fetch('/dados-teste/ficha-municipio.csv')).text()).trim().split('\n').slice(1).map(l => l.split(','));
  ok('B: ficha-municipio: lida como lista de indicadores de uma entidade (coluna numérica, 14 indicadores, 11 unidades)', !!fc && fc.mode === 'num' && fc.nNum === 14 && fc.nText === 0 && fc.units.length === 11 && fc.group === 'Eixo' && fc.period === 'Ano' && fc.label === 'Indicador'); out.fcsig = fc && fc.sig.join();
  ok('B: indicadores na ordem da planilha, com valor, unidade, eixo e ano idênticos', fc.items.length === 14 && fc.items.every((it, i) => it.name === csvRows[i][1] && it.num === +csvRows[i][2] && it.unit === csvRows[i][3] && it.g === csvRows[i][0] && it.p === csvRows[i][4]));
  ok('B: a coluna Valor não vira medida genérica (indicadores diferentes)', col(ds, 'Valor').role === 'mixed' && !isMeasure(col(ds, 'Valor')));
  ok('B: coluna Ano (anos em CSV) lida como data, não "vazia"', col(ds, 'Ano').kind === 'date' && col(ds, 'Ano').role !== 'empty' && Number.isFinite(col(ds, 'Ano').data[0]) && new Date(col(ds, 'Ano').data[0]).getUTCFullYear() === 2022);
  const el2 = nvStoryEligibility(ds, { lang: 'pt' }); ok('B: Ficha serve (nota 1) e Face a face / Resumo por temporada não', el2.profile.ok && el2.profile.score === 1 && !el2.versus.ok && !el2.season.ok); out.fc_why = el2.profile.why;
  ok('B: contar linhas por grupo não é oferecido (as linhas são indicadores diferentes)', ['compare', 'rank', 'composition'].every(id => !el2[id].ok && /métricas diferentes/.test(el2[id].why)));
  const rk2 = nvStoryRank(ds, P, nvpPool(P, meta, steps), { lang: 'pt' }); ok('B: a Ficha é a única recomendada', rk2.list.length === 1 && rk2.list[0] === 'profile'); out.rk2 = rk2.list.join();
  ok('B: título automático da peça (sem nome de entidade)', autoTitle(P.built, 'bars') === 'Ficha de indicadores');
  const fp = {}; for (const N of [2, 5, 10]) fp[N] = nvPlan(P, meta, steps, N, 'profile');
  ok('B: planos 2, 5 e 10 válidos e história ficha', [2, 5, 10].every(N => fp[N].report.ok && fp[N].slides.length <= N && fp[N].story === 'profile')); out.fcErr = JSON.stringify(fp[10].report.errors);
  ok('B: roteiro de 2 = indicadores + limites; 5 e 10 = capa, 2 páginas de indicadores, limites, conclusão', fp[2].slides.map(s => s.id).join() === 'fc-nums-1,fc-limits' && fp[5].slides.map(s => s.id).join() === 'fc-cover,fc-nums-1,fc-nums-2,fc-limits,vs-conclusion' && fp[10].slides.map(s => s.id).join() === fp[5].slides.map(s => s.id).join()); out.fcPlan10 = fp[10].slides.map(s => s.id + ':' + s.planTitle).join(' > ');
  ok('B: títulos "Indicadores 1/2" e "2/2" só quando há mais de uma página', fp[10].slides[1].planTitle === 'Indicadores 1/2' && fp[10].slides[2].planTitle === 'Indicadores 2/2' && fp[2].slides[0].planTitle === 'Indicadores');
  const t1 = fp[10].slides[1], t2 = fp[10].slides[2];
  ok('B: tabela 1 tem 8 indicadores com eixo, indicador e valor; tabela 2 os outros 6 (14 no total)', t1.viz.kind === 'table' && t1.viz.rows.length === 8 && t2.viz.rows.length === 6 && t1.viz.head.join() === 'Eixo,Indicador,Ano,Valor'); out.tabHead = t1.viz.head.join();
  const rowsAll = [...t1.viz.rows, ...t2.viz.rows]; ok('B: os 14 indicadores da tabela na ordem e com o valor da planilha (48.210 pessoas, 2,31 R$ bilhões, 96,4%…)', rowsAll.every((r, i) => r[1] === csvRows[i][1] && r[2] === csvRows[i][4]) && rowsAll[0][3] === '48.210 pessoas' && rowsAll[4][3] === '2,31 R$ bilhões' && rowsAll[9][3] === '96,4%' && rowsAll[5][3] === 'R$ 47.900'); out.vals = rowsAll.map(r => r[3]).join(' | ');
  ok('B: o eixo só aparece na primeira linha de cada grupo', t1.viz.rows[0][0] === 'Demografia' && t1.viz.rows[1][0] === '' && t1.viz.rows[4][0] === 'Economia');
  ok('B: número grande é o primeiro indicador da planilha (População 48.210)', t1.big.text === '48.210' && t1.big.label === 'POPULAÇÃO');
  const lm = fp[10].slides.find(s => s.id === 'fc-limits'), lmTxt = lm.lines.join(' | ');
  ok('B: limites: unidades diferentes, nada somado nem comparado, uma ficha não compara', /unidades diferentes/.test(lmTxt) && /não foram somados nem comparados/.test(lmTxt) && /não os compara com outras/.test(lmTxt) && /14 indicadores/.test(lmTxt)); out.fcLim = lmTxt.slice(0, 300);
  ok('B: com 2 slides os 6 indicadores que ficaram de fora vão para os limites', /6 indicadores ficaram só na planilha/.test(fp[2].slides[1].lines.join(' ')));
  const fall = [2, 5, 10].map(N => txtOf(fp[N])).join(' || '); ok('B: nenhum texto com melhor/superior/por causa e sem "undefined"/"NaN"', !FORBID.test(fall) && !BADTXT.test(fall));
  P.br = P.br || {}; P.br.storyKind = 'profile'; S.br.storyKind = 'profile'; deck = pxDeck(P); xml = deck.slides.map(s => s.sh.join('')).join('');
  { const vp = videoPlan(P, 'vertical'), kk = vp.scenes.filter(x => x.kind === 'step').map(x => x.kick); ok('B: vídeo: indicadores 1/2 e 2/2 e limites, sem a conclusão em branco', kk.join('|') === 'Indicadores 1/2|Indicadores 2/2|Limites e síntese'); out.videoFc = kk.join(' > '); }
  ok('B: PPTX: tabela de indicadores e conclusão em branco', /name="Célula"/.test(xml) && /48\.210 pessoas/.test(xml) && deck.slides.length >= 5); out.pptxFc = deck.slides.length;

  // ---- Ficha com valores misturados (número com unidade e texto na mesma coluna)
  await load('ficha-piloto.csv'); P = S.piece; ds = S.ds; meta = P.host.ix.meta; steps = buildSteps(P, meta); fc = P.built.fc;
  const csv2 = (await (await fetch('/dados-teste/ficha-piloto.csv')).text()).trim().split('\n').slice(1).map(l => { const m = /^([^,]+),(.*)$/.exec(l); return [m[1], m[2].replace(/^"|"$/g, '')]; });
  ok('B2: ficha-piloto lida (valores mistos): entidade vem do cabeçalho, 8 indicadores e 3 textos', !!fc && fc.mode === 'text' && fc.entity === 'Ayrton Senna' && fc.nNum === 8 && fc.nText === 3 && fc.sig.includes('texts')); out.fc2 = fc && fc.sig.join();
  const gi = n => fc.items.find(i => i.name === n);
  ok('B2: "161 largadas" → 161, unidade largadas, texto original guardado', gi('GPs disputados').num === 161 && gi('GPs disputados').unit === 'largadas' && gi('GPs disputados').raw === '161 largadas');
  ok('B2: "40,3% das corridas" → 40,3 e %; "41 (25.4% de aproveitamento)" → 41 com o texto original', gi('Aproveitamento de poles').num === 40.3 && gi('Aproveitamento de poles').unit === '%' && gi('Aproveitamento de poles').raw === '40,3% das corridas' && gi('Vitórias').num === 41 && gi('Vitórias').raw === '41 (25.4% de aproveitamento)');
  ok('B2: número puro continua número (Pole positions 65, Títulos 3) e idade "24 anos" → 24 anos', gi('Pole positions').num === 65 && gi('Títulos mundiais').num === 3 && gi('Idade na estreia').num === 24 && gi('Idade na estreia').unit === 'anos');
  ok('B2: textos na íntegra e nunca viram número (Status, Equipes, Estilo)', ['Status no grid', 'Equipes', 'Estilo de pilotagem'].every(n => gi(n).num === null && gi(n).text === csv2.find(r => r[0] === n)[1]));
  const f2 = nvPlan(P, meta, steps, 10, 'profile'); ok('B2: plano de 10: capa, indicadores, textos, limites, conclusão', f2.report.ok && f2.slides.map(s => s.id).join() === 'fc-cover,fc-nums-1,fc-text,fc-limits,vs-conclusion'); out.fcErr2 = JSON.stringify(f2.report.errors);
  const tx = f2.slides.find(s => s.id === 'fc-text'); ok('B2: slide de textos copia as 3 frases sem alteração, em fonte grande', tx.viz.kind === 'text' && tx.viz.big === true && tx.viz.items.length === 3 && tx.viz.items.every(it => it.t === csv2.find(r => r[0] === it.k)[1]));
  const n2 = f2.slides.find(s => s.id === 'fc-nums-1'); ok('B2: tabela mostra o texto original quando a célula trazia unidade ("161 largadas", "41 (25.4% de aproveitamento)")', n2.viz.rows.find(r => r[0] === 'GPs disputados')[1] === '161 largadas' && n2.viz.rows.find(r => r[0] === 'Vitórias')[1] === '41 (25.4% de aproveitamento)' && n2.viz.rows.length === 8);
  ok('B2: "ver cálculo" só lista o que a leitura transformou (Vitórias e Aproveitamento), com o texto original', n2.calc && n2.calc.rows.map(r => r.k).join() === 'Vitórias,Aproveitamento de poles' && /41 \(25\.4% de aproveitamento\) → 41/.test(n2.calc.rows[0].v) && /40,3% das corridas → 40,3%/.test(n2.calc.rows[1].v)); out.calc2 = n2.calc && n2.calc.rows.map(r => r.k + ': ' + r.v).join(' | ');
  ok('B2: título automático é o nome da entidade', autoTitle(P.built, 'bars') === 'Ayrton Senna');
  lang('EN'); await sl(400); const f2e = nvPlan(P, meta, steps, 10, 'profile'), f2et = txtOf(f2e); ok('B2: em inglês: plano válido, "Indicators", "Texts from the sheet" e sem "undefined"', f2e.report.ok && /Indicators/.test(f2et) && /Texts from the sheet/.test(f2et) && !BADTXT.test(f2et) && f2e.slides[1].head === 'Ayrton Senna: 8 indicators in 3 units.'); out.en2 = f2e.slides[1].head; lang('PT'); await sl(300);

  // =========================================================== C) O QUE NÃO É FICHA NEM RESUMO POR TEMPORADA
  const none = [['lojas.csv'], ['pedidos.csv'], ['datavix-planilha-ideal.xlsx', 'Vendas'], ['financeiro.xlsx', 'Lançamentos'], ['bateria/vendas_sazonal.csv'], ['bateria/rh_folha.csv'], ['bateria/marketing_campanhas.csv'], ['bateria/publico_orcamento.csv'], ['projetos.csv'], ['canais.csv'], ['funil.csv'], ['metas.csv'], ['antes-depois.csv'], ['unidades.csv'], ['f1-senna-schumacher.xlsx', 'Sheet1'], ['f1-senna-schumacher.xlsx', 'Resultados por GP'], ['f1-comparativo-v1.xlsx']];
  for (const [file, sheet] of none) { const d = await loadDs(file, sheet); if (!d) { out['pulou_' + file] = 'não carregou'; continue; } const f = nvFichaPack(d), s = (() => { const v = nvVsPack(d); return v ? nvSsEligible(v) : null; })(), isRes = file === 'f1-senna-schumacher.xlsx' && sheet === 'Resultados por GP'; ok('C: ' + file + (sheet ? ':' + sheet : '') + ' não é ficha' + (isRes ? '' : ' nem resumo por temporada'), !f && (isRes || !s)); if (f) out['falsoFicha_' + file] = f.sig.join(); }
  // lista de itens do mesmo tipo (regiões e vendas), sem sinal de indicadores diferentes: é ranking, não ficha
  const enc = t => new TextEncoder().encode(t).buffer;
  let dd = await loadDs('regioes.csv', undefined, enc('Região,Vendas\nNorte,120\nSul,340\nLeste,210\nOeste,95\nCentro,410\nSudeste,180\n')); ok('C: região × vendas (itens do mesmo tipo) não é ficha', !nvFichaPack(dd));
  dd = await loadDs('kpis.csv', undefined, enc('Indicador,Valor\nReceita,1200\nClientes,430\nNPS,62\nChurn,3\nTicket médio,310\n')); ok('C: "Indicador, Valor" com sinal de rótulo é ficha (possível mesmo sem unidade)', !!nvFichaPack(dd) && nvFichaPack(dd).sig.join() === 'label');
  dd = await loadDs('precos.csv', undefined, enc('Produto,Preço,Unidade\nArroz,6.5,kg\nÓleo,8.2,L\nOvos,12,dz\nSabão,3.4,un\nLeite,5.1,L\n')); ok('C: lista de preços (só unidades diferentes, sem rótulo de indicador) é ficha fraca: nota 0,6, nunca à frente de um bom ranking', !!nvFichaPack(dd) && nvFichaPack(dd).strong === false && nvStoryEligibility(dd, { lang: 'pt' }).profile.score === 0.6);
  dd = await loadDs('duas.csv', undefined, enc('Indicador,Meta,Realizado\nReceita,1200,1100\nClientes,430,500\nNPS,62,60\nChurn,3,4\n')); ok('C: duas colunas numéricas (meta e realizado) não é ficha', !nvFichaPack(dd));
  dd = await loadDs('curta.csv', undefined, enc('Indicador,Valor,Unidade\nReceita,1200,R$\nClientes,430,pessoas\nNPS,62,pontos\n')); ok('C: menos de 4 indicadores não é ficha', !nvFichaPack(dd));
  // =========================================================== D) planilha fora de ordem: a evolução segue o calendário
  const shuffled = 'Temporada,Time,Vitórias,Pontos\n2021,A,10,30\n2019,B,8,25\n2020,A,12,36\n2018,A,6,18\n2021,B,9,27\n2019,A,7,21\n2018,B,5,15\n2020,B,11,33\n2017,A,4,12\n2017,B,3,9\n';
  dd = await loadDs('fora-de-ordem.csv', undefined, enc(shuffled)); const vp = nvVsPack(dd), sd = vp ? nvSsData(vp) : null;
  ok('D: temporadas fora de ordem na planilha: o resumo por temporada as põe em ordem de calendário (2017…2021)', !!sd && sd.pd.map(x => x.p).join() === '2017,2018,2019,2020,2021' && sd.per.every(p => p.rows.map(r => r.p).join() === '2017,2018,2019,2020,2021') && sd.per[0].peaks['Vitórias'].top === 12 && sd.per[0].peaks['Vitórias'].ps.join() === '2020'); out.shuf = sd ? sd.per.map(p => p.name + ':' + p.rows.map(r => r.p).join('/')).join(' | ') : null;
  // ano em CSV: coluna "Ano" vira data (antes ficava vazia e oculta)
  dd = await loadDs('serie.csv', undefined, enc('Ano,Receita,Custo\n2018,100,60\n2019,120,70\n2020,90,65\n2021,150,80\n2022,170,90\n2023,180,95\n')); ok('C: CSV com coluna "Ano" (2018…2023): data lida, 6 períodos, Evolução no tempo possível', col(dd, 'Ano').kind === 'date' && col(dd, 'Ano').role !== 'empty' && !col(dd, 'Ano').hide && nvStoryEligibility(dd, { lang: 'pt' }).time.ok);

  window.__mout = out; out.RESUMO = bad.length ? 'FALHOU: ' + bad.join(' | ') : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack + ' ' + JSON.stringify(window.__mout || {}); } })()
