// Gate 52: Face a face por fases (só um lado / incompleta / comparável), linha do tempo, corrida a corrida (aba Detalhe) e conclusão em branco.
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), out = {}, bad = [];
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  const start = async file => { S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry'); await sl(200); S.ds = null; S.piece = null;
    D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer()); for (let i = 0; i < 150 && S.step !== 'sheet' && S.step !== 'preview'; i++) await sl(100); await sl(400); if (S.step === 'sheet') { q('[data-a=wb-go]').click(); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); } };
  const gen = async () => { D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
    for (let i = 0; i < 80 && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(400); if (q('.mdl')) { q('.mdl [data-m="1"]').click(); await sl(300); } };
  const FORBID = /\b(melhor|melhores|superior|inferior|por causa|culpa|devido|causou|better|best|because)\b/i;
  await start('f1-senna-schumacher.xlsx'); await gen();
  const P = S.piece, pk = P.built.vs, meta = P.host.ix.meta, steps = buildSteps(P, meta), ds = S.ds, wbx = P.built.wbx;
  ok('Fases: solo 1989–1990, incompleta 1991, comparável 1992–1993, incompleta 1994', pk.phases.map(f => f.cls + ':' + f.ps.join('+')).join(' ') === 'solo:1989+1990 partial:1991 comparable:1992+1993 partial:1994'); out.phases = pk.phases.map(f => f.cls + ':' + f.ps.join('+')).join(' ');
  ok('Fases: só Senna tem registro em 1989–1990', pk.phases[0].present.join() === '0' && pk.ents[0] === 'Ayrton Senna');
  ok('Colunas de contexto e equipe reconhecidas', pk.cols.ctx === 'Contexto comparativo' && pk.cols.team === 'Equipe principal' && pk.cols.expo === 'GP disputados*');
  const plans = {}; for (const N of [2, 5, 10]) plans[N] = nvPlan(P, meta, steps, N, 'versus');
  ok('Planos 2, 5 e 10 válidos e até N', [2, 5, 10].every(N => plans[N].report.ok && plans[N].slides.length <= N && plans[N].story === 'versus')); out.len = [2, 5, 10].map(N => plans[N].slides.length).join(',');
  out.p10 = plans[10].slides.map(s => s.id).join(' > ');
  ok('Roteiro de 10: pergunta, linha do tempo, fases em ordem, corrida a corrida, síntese e limites, fontes e conclusão', out.p10 === 'vs-cover > vs-timeline > vs-ph0-solo > vs-ph1-partial > vs-ph2-comparable > vs-races > vs-ph3-partial > vs-synthlim > wb-sources > vs-conclusion');
  ok('Roteiro de 5: pergunta, fase comparável, síntese e limites, fontes e conclusão', plans[5].slides.map(s => s.id).join(' > ') === 'vs-cover > vs-ph2-comparable > vs-synthlim > wb-sources > vs-conclusion');
  ok('Roteiro de 2: fase comparável e síntese', plans[2].slides.map(s => s.id).join(' > ') === 'vs-ph2-comparable > vs-synthlim');
  const S10 = id => plans[10].slides.find(s => s.id === id), cell = (name, i) => { const c = ds.columns.find(x => x.name === name); return nvVsAt(c, i); };
  // pergunta
  const cv = S10('vs-cover'); ok('Pergunta: A × B, a pergunta com o período e o recorte comparável', /Como Ayrton Senna e Michael Schumacher se comparam entre 1989 e 1994\?/.test(cv.head) && /Só 1992 e 1993 têm todos em condições comparáveis/.test(cv.head) && !/\?\./.test(cv.head));
  // linha do tempo
  const tl = S10('vs-timeline').viz; ok('Linha do tempo: 6 períodos, Schumacher sem registro em 1989 e 1990, GPs 16 × 6 em 1991', tl.kind === 'timeline' && tl.periods.join() === '1989,1990,1991,1992,1993,1994' && tl.rows[1].cells[0].c === 'none' && tl.rows[1].cells[1].c === 'none' && tl.rows[1].cells[2].t === '6' && tl.rows[0].cells[2].t === '16' && tl.rows[1].cells[3].c === 'ok' && tl.rows[1].cells[2].c === 'part');
  // solo
  const so = S10('vs-ph0-solo'); ok('Fase só um lado: Senna em 1989–1990, sem comparação', /Em 1989 e 1990, só Ayrton Senna tem registro; Michael Schumacher não tem registro/.test(so.head) && so.viz.rows.length >= 8);
  const c89 = ds.columns.find(c => c.name === 'Contexto comparativo'); let t89 = ''; for (let i = 0; i < ds.rowCount; i++) if (cell('Temporada', i) === '1989' && cell('Piloto', i) === 'Ayrton Senna') t89 = nvVsAt(c89, i);
  ok('Fase só um lado: o texto de contexto da planilha vem na íntegra', !!t89 && so.note.includes(t89)); ok('Fase só um lado: Posição final 2 (1989) e 1 (1990) no cálculo', so.calc.rows.some(r => /Posição final · 1989/.test(r.k) && r.v === '2') && so.calc.rows.some(r => /Posição final · 1990/.test(r.k) && r.v === '1'));
  // incompletas
  const p91 = S10('vs-ph1-partial'), p94 = S10('vs-ph3-partial');
  ok('Incompleta 1991: GP disputados 16 × 6, por GP (Pontos 6 e 0,67; Vitórias 0,44 e 0)', /GP disputados\*: Ayrton Senna 16, Michael Schumacher 6/.test(p91.head) && p91.viz.rows.some(r => /Pontos oficiais · Ayrton Senna/.test(r.k) && r.t === '6') && p91.viz.rows.some(r => /Pontos oficiais · Michael/.test(r.k) && r.t === '0,67') && p91.viz.rows.some(r => /Vitórias · Ayrton/.test(r.k) && r.t === '0,44'));
  ok('Incompleta 1994: GP 3 × 14 e o texto "Campeão. Cumpriu suspensão…" copiado como está', /Ayrton Senna 3, Michael Schumacher 14/.test(p94.head) && /Campeão\. Cumpriu suspensão de duas provas e foi desclassificado em duas etapas; 14 largadas em 16 GPs\./.test(p94.note));
  ok('Incompleta: nenhum placar de "maior valor" (só taxas por GP)', !/tem o maior valor/.test(p91.head + p94.head) && !p91.ev);
  // comparável
  const cp = S10('vs-ph2-comparable'), tot = n => cp.calc.rows.find(r => r.k === n).v;
  ok('Comparável 1992–1993: placar 3 × 2 e totais do período (8×2, 14×17, 2×0, 2×7, 123×105)', cp.big.text === '3 × 2' && [tot('Vitórias'), tot('Pódios'), tot('Poles'), tot('Voltas mais rápidas'), tot('Pontos oficiais')].map(x => x.split(' →')[0]).join(' | ') === '8 × 2 | 14 × 17 | 2 × 0 | 2 × 7 | 123 × 105');
  ok('Comparável: placar de cada período no cálculo (1992 2×3, 1993 3×2)', cp.calc.rows.some(r => /Placar de cada período · 1992/.test(r.k) && /^2 × 3/.test(r.v)) && cp.calc.rows.some(r => /Placar de cada período · 1993/.test(r.k) && /^3 × 2/.test(r.v)));
  // corrida a corrida: conferido de forma independente com a matriz da aba Detalhe
  const rc = S10('vs-races'), det = wbx.sheets.find(s => s.role === 'detail').matrix, H = det[0], ix = n => H.indexOf(n);
  const rows = det.slice(1).map((r, idx) => ({ idx, p: String(r[ix('Temporada')]), gp: r[ix('Grande Prêmio')], a: r[ix('Pontos Senna')], b: r[ix('Pontos Schumacher')] })).filter(r => ['1992', '1993'].includes(r.p) && typeof r.a === 'number' && typeof r.b === 'number');
  const exp = ['1992', '1993'].flatMap(p => rows.filter(r => r.p === p).map(r => ({ ...r, d: Math.abs(r.a - r.b) })).filter(r => r.d > 0).sort((x, y) => y.d - x.d || x.idx - y.idx).slice(0, 4).sort((x, y) => x.idx - y.idx)).map(r => r.p + ' · ' + r.gp);
  ok('Corrida a corrida: 8 etapas, 4 por temporada, as de maior diferença de pontos (conferido na aba)', rc.viz.rows.length === 8 && rc.viz.rows.map(r => r[0]).join('|') === exp.join('|')); out.races = rc.viz.rows.map(r => r[0]).join(', ');
  ok('Corrida a corrida: equipes e resultados da aba (McLaren e Benetton) e critério à vista', rc.viz.rows.every(r => /^McLaren/.test(r[1]) && /^Benetton/.test(r[2])) && /maior diferença/.test(rc.calc.formula) && rc.calc.rows[rc.calc.rows.length - 1].v === String(rows.length));
  // síntese e limites + fontes + conclusão
  const sl2 = S10('vs-synthlim'), cm = nvWbRows(wbx.sheets[2]).find(r => r.k === 'Comparabilidade');
  ok('Síntese e limites: resumo em números, Comparabilidade idêntica e definição de incompleta', /Resumo: Ayrton Senna 3 · Michael Schumacher 2/.test(sl2.lines[0]) && sl2.lines.some(l => l === 'Comparabilidade: ' + cm.t) && sl2.lines.some(l => /Temporada incompleta: o menor valor de GP disputados\*/.test(l)));
  const cn = S10('vs-conclusion'); ok('Conclusão: slide em branco, escrito pela pessoa (sem texto do Datavix)', cn.blank === true && cn.head === '' && !cn.lines && !cn.big && plans[10].report.ok && plans[10].slides[plans[10].slides.length - 1] === cn);
  ok('Fontes: penúltimo, 18 itens', plans[10].slides[plans[10].slides.length - 2].id === 'wb-sources' && S10('wb-sources').viz.items.length === 18);
  const mine = plans[10].slides.filter(s => !['wb-sources'].includes(s.id)).flatMap(s => [s.head && !/^(vs-synthlim)$/.test(s.id) ? s.head : '', s.big && s.big.label, s.calc && s.calc.formula]).filter(Boolean).join(' | ');
  ok('Nenhum veredito: sem "melhor", "superior", "por causa" e sem "vencedor"', !FORBID.test(mine.replace(/Contexto comparativo[^|]*|Schumacher ainda[^|]*/g, '')) && !/vencedor|campe[aã]o absoluto/i.test(mine)); out.forbid = (mine.match(FORBID) || [])[0] || null;
  // a conclusão escrita pela pessoa fica guardada
  P.sedits = P.sedits || {}; P.sedits['vs-conclusion'] = { head: 'Minha conclusão.' }; const pl3 = nvPlan(P, meta, steps, 10, 'versus'), s3 = pl3.slides[pl3.slides.length - 1]; nvApplyEdits(P, pl3.slides); ok('Conclusão: o texto da pessoa entra no slide', s3.head === 'Minha conclusão.'); delete P.sedits['vs-conclusion'];
  // exportações
  P.br = P.br || {}; P.br.storyKind = 'versus'; S.br.storyKind = 'versus'; const deck = pxDeck(P), xml = deck.slides.map(s => s.sh.join('')).join('');
  ok('PPTX: linha do tempo, tabela de corridas e conclusão com espaço para escrever', /name="Entidade"/.test(xml) && /name="Célula"/.test(xml) && /Benetton/.test(xml) && deck.slides.length >= 10); out.pptx = deck.slides.length;
  // inglês
  { const en = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'EN'); if (en) en.click(); await sl(400);
    const pe = nvPlan(S.piece, S.piece.host.ix.meta, buildSteps(S.piece, S.piece.host.ix.meta), 10, 'versus'), te = pe.slides.map(s => [s.head, ...(s.lines || []), s.calc && s.calc.title, s.calc && s.calc.formula].filter(Boolean).join(' ')).join(' | ');
    ok('EN: plano válido, sem undefined/NaN, com as fases em inglês', pe.report.ok && !/undefined|NaN/.test(te) && /Only one side has a record/.test(pe.slides.map(s => s.planTitle).join('|')) && /On comparable terms \(1992 and 1993\)/.test(te)); out.en = pe.slides.map(s => s.planTitle).join(' > ');
    const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sl(300); }
  // sem exposição ou sem fases: o roteiro clássico continua valendo (planilha de uma aba, formato de métricas em linhas)
  await start('f1-comparativo-v1.xlsx'); await gen(); { const P1 = S.piece, p1 = nvPlan(P1, P1.host.ix.meta, buildSteps(P1, P1.host.ix.meta), 10, 'versus'); ok('Planilha v1 (métricas em linhas): roteiro clássico, sem fases', p1.slides.some(s => s.id === 'vs-score') && !p1.slides.some(s => /^vs-ph/.test(s.id)) && p1.report.ok); }
  out.RESUMO = bad.length ? bad : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
