// Gate 53: conciliação entre a aba Principal e a Detalhe. "Conferido" quando bate, "Não confere" com a lista, e nunca altera um número.
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), out = {}, bad = [];
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry'); await sl(200);
  D.loadBuffer('f1.xlsx', await (await fetch('/dados-teste/f1-senna-schumacher.xlsx')).arrayBuffer()); for (let i = 0; i < 150 && S.step !== 'sheet'; i++) await sl(100); await sl(400); q('[data-a=wb-go]').click(); for (let i = 0; i < 150 && S.step !== 'preview' && S.step !== 'read'; i++) await sl(100);
  // tela de leitura
  D.go('read'); await sl(400); { const el = q('.wb-rc'); ok('Leitura: bloco "Conferência entre abas" com "conferido"', !!el && /Conferência entre abas/i.test(el.textContent) && /conferido/.test(el.textContent)); }
  D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
  for (let i = 0; i < 80 && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(400); if (q('.mdl')) { q('.mdl [data-m="1"]').click(); await sl(300); }
  const P = S.piece, pk = P.built.vs, wbx = P.built.wbx, meta = P.host.ix.meta, steps = buildSteps(P, meta);
  const rc = nvWbReconcile(wbx, pk);
  ok('F1: conferido em 5 métricas, 50 comparações (período × entidade)', !!rc && rc.status === 'ok' && rc.bad === 0 && rc.n === 50 && rc.rows.map(r => r.metric).join() === 'Pontos oficiais,Vitórias,Pódios,Poles,GP disputados*'); out.rows = rc.rows.map(r => r.metric + ':' + r.rule + ':' + r.n).join(' | ');
  ok('F1: o Schumacher sem registro em 1989 e 1990 não entra (10 comparações por métrica, não 12)', rc.rows.every(r => r.n === 10));
  const txt = nvWbReconText(rc); ok('Texto: conferido, com as métricas e o total de comparações', /^Conciliação com a aba “Resultados por GP”: conferido \(Pontos oficiais, Vitórias, Pódios, Poles, GP disputados\*; 50 comparações/.test(txt.lines[0]) && txt.lines.length === 1);
  ok('Ver cálculo: uma linha por métrica com a regra e "conferido"', txt.calc.rows.length === 5 && txt.calc.rows.every(r => /conferido$/.test(r.v)) && /soma de “Pontos”/.test(txt.calc.rows[0].k) && /contagem de “Resultado” = 1/.test(txt.calc.rows[1].k));
  // roteiro por fases: síntese e limites traz a linha e o ver cálculo
  const plan = nvPlan(P, meta, steps, 10, 'versus'), lim = plan.slides.find(s => s.id === 'vs-synthlim');
  ok('Síntese e limites: linha da conciliação e ver cálculo', plan.report.ok && lim.lines.some(l => /Conciliação com a aba “Resultados por GP”: conferido/.test(l)) && !!lim.calc && lim.calc.title === 'Conciliação entre abas');
  const cp0 = JSON.stringify(plan.slides.find(s => s.id === 'vs-ph2-comparable').calc.rows), rcs0 = JSON.stringify(pk.pd);
  // painel
  { const pn = document.querySelector('#panel'); ok('Painel: mostra "conferido"', !!pn && /Conciliação com a aba/.test(pn.textContent) && /conferido/.test(pn.textContent)); }
  // adulterar a aba Detalhe (uma vitória de 1993 vira 2º lugar): não confere, com a diferença exata, e nenhum número do Datavix muda
  const det = wbx.sheets.find(s => s.role === 'detail'), H = det.matrix[0], iT = H.indexOf('Temporada'), iR = H.indexOf('Resultado Senna'), iP = H.indexOf('Pontos Schumacher');
  const rowI = det.matrix.findIndex((r, i) => i > 0 && String(r[iT]) === '1993' && String(r[iR]) === '1'), keep = det.matrix[rowI][iR]; det.matrix[rowI][iR] = '2';
  { const r2 = nvWbReconcile(wbx, pk), t2 = nvWbReconText(r2);
    ok('Adulterado: não confere em 1 de 50 e Vitórias 1993 do Senna (resumo 5, detalhes 4)', r2.status === 'diff' && r2.bad === 1 && /não confere em 1 de 50 comparações/.test(t2.lines[0]) && t2.lines.includes('Vitórias 1993, Ayrton Senna: resumo 5, soma dos detalhes 4')); out.diff = t2.lines.join(' | ');
    ok('Adulterado: a conciliação só aponta, sem mudar nenhum número (placar, totais e pacote iguais)', JSON.stringify(pk.pd) === rcs0 && JSON.stringify(nvPlan(P, meta, steps, 10, 'versus').slides.find(s => s.id === 'vs-ph2-comparable').calc.rows) === cp0);
    const pl2 = nvPlan(P, meta, steps, 10, 'versus'), l2 = pl2.slides.find(s => s.id === 'vs-synthlim'); ok('Adulterado: a linha de "não confere" vai para os limites e o plano segue válido', pl2.report.ok && l2.lines.some(l => /não confere em 1 de 50/.test(l)) && l2.calc.rows.some(r => /Vitórias/.test(r.k) && /1 diferença/.test(r.v)));
    const pn = document.querySelector('#panel'); pn.innerHTML = panel(); ok('Painel: mostra "não confere" e a diferença', /não confere em 1 de 50/.test(pn.textContent) && /resumo 5, soma dos detalhes 4/.test(pn.textContent)); }
  det.matrix[rowI][iR] = keep;
  // pontos
  { const rowP = det.matrix.findIndex((r, i) => i > 0 && String(r[iT]) === '1992' && typeof r[iP] === 'number' && r[iP] > 0), kp = det.matrix[rowP][iP]; det.matrix[rowP][iP] = kp + 1; const r3 = nvWbReconcile(wbx, pk), t3 = nvWbReconText(r3);
    ok('Pontos adulterados: aponta Pontos oficiais 1992 do Schumacher (53 × 54)', r3.bad === 1 && t3.lines.includes('Pontos oficiais 1992, Michael Schumacher: resumo 53, soma dos detalhes 54')); det.matrix[rowP][iP] = kp; }
  ok('Restaurado: volta a conferir', nvWbReconcile(wbx, pk).status === 'ok');
  // sem aba Detalhe: sem conciliação
  det.role = 'ignore'; ok('Sem aba Detalhe: sem conciliação', nvWbReconcile(wbx, pk) === null && !nvPlan(P, meta, steps, 10, 'versus').slides.find(s => s.id === 'vs-synthlim').lines.some(l => /^Conciliação/.test(l))); det.role = 'detail';
  // PPTX e roteiro clássico continuam
  P.br = P.br || {}; P.br.storyKind = 'versus'; S.br.storyKind = 'versus'; const deck = pxDeck(P); ok('PPTX gera com a conciliação', deck.slides.length >= 10);
  // inglês
  { const en = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'EN'); if (en) en.click(); await sl(400); const te = nvWbReconText(nvWbReconcile(wbx, pk));
    ok('EN: texto de conferido em inglês', /^Reconciliation with the “Resultados por GP” sheet: matches \(/.test(te.lines[0]) && /sum of “Pontos”/.test(te.calc.rows[0].k)); const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sl(300); }
  out.RESUMO = bad.length ? bad : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
