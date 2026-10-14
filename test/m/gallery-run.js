// Gate 54: galeria de modelos. Miniaturas com os dados reais da planilha, recomendados em destaque, grupos, modelos indisponíveis com o motivo,
// alternância galeria/lista, escolha por clique duplo, abertura pelo painel e o Face a face da planilha da F1. Rodar com ?tell
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], out = {}, bad = [];
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); window.__gout = out; };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1'); try { localStorage.removeItem('dv-mg-view'); } catch (e) { /* segue */ }
  const lang = l => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === l); if (b) b.click(); };
  lang('PT'); await sl(300);
  const esc = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  const waitModal = async (n = 60) => { for (let i = 0; i < n && !q('.mdl .mg'); i++) await sl(150); await sl(300); return !!q('.mdl .mg'); };
  const load = async (file, wb) => {
    S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry'); await sl(200); S.ds = null; S.piece = null;
    D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer()); for (let i = 0; i < 150 && S.step !== 'preview' && S.step !== 'sheet'; i++) await sl(100); await sl(300);
    if (S.step === 'sheet') { q('[data-a=wb-go]').click(); for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); }
    D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
    for (let i = 0; i < 80 && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(500); };
  const openFromPanel = async () => { const b = q('[data-a=mg-open]'); if (!b) return false; b.click(); return await waitModal(20); };
  const txt = el => (el ? el.textContent : '');
  const sumBy = (ds, gi, mi) => { const g = ds.columns[gi], m = ds.columns[mi], sum = g.dict.map(() => 0), cnt = g.dict.map(() => 0); for (let r = 0; r < ds.rowCount; r++) { const k = g.codes[r]; if (k < 0) continue; const v = m ? m.data[r] : 1; if (!Number.isFinite(v)) continue; sum[k] += v; cnt[k]++; } const mean = gal2Agg(ds.columns, mi) === 'mean'; return g.dict.map((l, k) => ({ l, v: mean ? (cnt[k] ? sum[k] / cnt[k] : 0) : sum[k], n: cnt[k] })).filter(x => x.n > 0 && !isPlaceholderLabel(x.l)).sort((a, b) => b.v - a.v); };
  // ---- A) lojas.csv: galeria aberta logo depois de gerar
  await load('lojas.csv'); ok('A: a galeria abre depois de gerar', await waitModal());
  const ds = S.ds, el = nvStoryEligibility(ds, { lang: 'pt' }), recs = qa('.mdl .tell > .tell-c.fit[data-id]');
  ok('A: recomendados em destaque (2 a 3), cada um com miniatura e sequência', recs.length >= 2 && recs.length <= 3 && recs.every(c => c.querySelector('.mg-thumb svg') && c.querySelectorAll('.mg-seq i').length >= 3)); out.rec = recs.map(c => c.dataset.id).join(',');
  const cmp = recs.find(c => c.dataset.id === 'compare') || q('.mdl .tell-c[data-id=compare]'); ok('A: Comparativo está na galeria', !!cmp);
  { const gi = el.compare.cols.group, mi = el.compare.cols.measure, top = sumBy(ds, gi, mi)[0], m = ds.columns[mi], g = ds.columns[gi], svgT = txt(cmp.querySelector('svg'));
    ok('A: miniatura do Comparativo tem o título e o maior valor reais da planilha', svgT.includes(`${m ? m.name : 'Linhas'} por ${g.name}`) && svgT.includes(top.l) && svgT.includes(m && gal2Agg(ds.columns, mi) !== 'count' ? fmtNum(top.v, m.unit, LANG) : fmtInt(top.v, LANG))); out.top = `${top.l} ${top.v}`; }
  { const tc = q('.mdl .tell-c[data-id=time]'), c = ds.columns[el.time.cols.time], grain = riverGrain(c.min, c.max, c) || pickGrain(c.min, c.max), svgT = txt(tc.querySelector('svg'));
    ok('A: miniatura da Evolução tem o primeiro e o último período reais', svgT.includes(bucketLabel(bucketStart(c.min, grain), grain, LANG)) && svgT.includes(bucketLabel(bucketStart(c.max, grain), grain, LANG)) && tc.querySelectorAll('.mg-thumb path.mg-ln').length === 1); }
  { const off = qa('.mdl .tell-c.off'), vs = off.find(c => /Face a face/.test(c.textContent));
    ok('A: modelos indisponíveis aparecem apagados, sem botão, com o motivo', off.length >= 2 && off.every(c => c.tagName === 'DIV' && c.getAttribute('aria-disabled') === 'true' && !c.dataset.id && /Indisponível/.test(c.textContent)) && !!vs && txt(vs).includes(el.versus.why)); }
  { const heads = qa('.mdl .mg-gh').map(h => h.textContent.trim()); out.heads = heads.join(' | ');
    ok('A: grupos na ordem Comparar, Ao longo do tempo, Quem pesa, Planejamento, Explorar, Panorama (os com cartões)', heads[0] === 'Serve para esta planilha' && heads.slice(1).join('|') === ['Comparar', 'Ao longo do tempo', 'Quem pesa', 'Planejamento', 'Explorar', 'Panorama'].filter(g => heads.includes(g)).join('|') && heads[heads.length - 1] === 'Panorama'); }
  ok('A: Panorama é um cartão selecionável (data-id vazio)', !!q('.mdl .tell-c[data-id=""]'));
  ok('A: cada cartão tem texto para leitor de tela com o que a miniatura mostra', recs.every(c => c.querySelector('.mg-sr') && c.querySelector('.mg-sr').textContent.length > 12));
  // ---- B) alternância galeria / lista
  { q('.mdl [data-a=mg-view][data-v=list]').click(); await sl(200); const root = q('.mdl .mg'), th = q('.mdl .mg-thumb');
    ok('B: Lista esconde miniaturas e sequências e lembra a escolha', root.dataset.view === 'list' && getComputedStyle(th).display === 'none' && localStorage.getItem('dv-mg-view') === 'list' && q('.mdl [data-a=mg-view][data-v=list]').getAttribute('aria-pressed') === 'true');
    q('.mdl [data-a=mg-view][data-v=gallery]').click(); await sl(200); ok('B: Galeria mostra de novo', root.dataset.view === 'gallery' && getComputedStyle(th).display !== 'none' && localStorage.getItem('dv-mg-view') === 'gallery'); }
  // ---- C) escolher: um clique marca, clique duplo escolhe
  { const second = recs[1]; second.click(); await sl(150); ok('C: um clique marca o cartão', second.getAttribute('aria-pressed') === 'true' && recs[0].getAttribute('aria-pressed') === 'false');
    second.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); await sl(700); ok('C: clique duplo escolhe o modelo e fecha a janela', !q('.mdl') && S.piece.br.storyKind === second.dataset.id); out.chose = S.piece.br.storyKind; }
  // ---- D) pelo painel
  { ok('D: o painel tem o botão "Ver galeria de modelos"', !!q('[data-a=mg-open]') && /galeria/i.test(q('[data-a=mg-open]').textContent));
    const cur = S.piece.br.storyKind; ok('D: abre a galeria com o modelo atual marcado', await openFromPanel() && q('.mdl .tell-c[aria-pressed="true"]').dataset.id === cur);
    esc(); await sl(500); ok('D: fechar sem escolher não muda o modelo', !q('.mdl') && S.piece.br.storyKind === cur);
    await openFromPanel(); q('.mdl .tell-c[data-id=""]').click(); await sl(150); q('.mdl [data-m="0"]').click(); await sl(600); ok('D: escolher o Panorama e confirmar', !q('.mdl') && (S.piece.br.storyKind === null || S.piece.br.storyKind === '')); }
  // ---- E) funil
  await load('funil.csv'); await waitModal(); { const e2 = nvStoryEligibility(S.ds, { lang: 'pt' }), fc = q('.mdl .tell-c[data-id=funnel]'), svgT = txt(fc && fc.querySelector('svg')), st = e2.funnel.cols.stages;
    const counts = st.map(i => { const c = S.ds.columns[i]; let k = 0; for (let r = 0; r < S.ds.rowCount; r++) if (c.codes[r] >= 0) k++; return [c.name, fmtInt(k, LANG)]; });
    ok('E: miniatura do Funil tem as etapas e as contagens reais', !!fc && counts.every(([n, k]) => svgT.includes(n) && svgT.includes(k))); out.funil = counts.map(x => x.join(' ')).join(' > '); esc(); await sl(400); }
  // ---- F) meta
  await load('metas.csv'); await waitModal(); { const e3 = nvStoryEligibility(S.ds, { lang: 'pt' }), gc = q('.mdl .tell-c[data-id=goal]'), svgT = txt(gc && gc.querySelector('svg')), gs = nvGoalStats(S.ds);
    ok('F: miniatura de Meta e desempenho traz realizado × meta e o atingimento calculado', !!gc && svgT.includes(`${gs.actual} × ${gs.meta}`) && /%/.test(svgT) && gc.querySelectorAll('.mg-thumb .mg-mt').length >= 1); esc(); await sl(400); }
  // ---- G) geografia por pontos
  await load('pontos-geo.csv'); await waitModal(); { const gg = q('.mdl .tell-c[data-id=geo]'); ok('G: miniatura de Geografia desenha os pontos reais', !!gg && gg.querySelectorAll('.mg-thumb circle.mg-o').length >= 10); esc(); await sl(400); }
  // ---- H) F1: Face a face em destaque, aberto pelo painel
  await load('f1-senna-schumacher.xlsx'); { const auto = await waitModal(8); ok('H: a galeria abre (sozinha, se houver mais de um modelo, ou pelo painel)', auto || await openFromPanel());
    const first = q('.mdl .tell > .tell-c[data-id]'), svgT = txt(first.querySelector('svg')), pk = S.piece.built.vs;
    ok('H: Face a face é o primeiro, com a forma da planilha (2 entidades × 5 métricas × 6 períodos)', first.dataset.id === 'versus' && /2 entidades × 5 métricas × 6 períodos/.test(first.textContent));
    ok('H: miniatura com as entidades e os períodos reais, com os tracejados do período sem registro', svgT.includes('Ayrton Senna') && svgT.includes('Michael Schumacher') && svgT.includes('1989') && svgT.includes('1994') && first.querySelectorAll('.mg-thumb rect.mg-no').length === 2);
    ok('H: a sequência é a do roteiro por fases (A pergunta, Síntese e limites…)', [...first.querySelectorAll('.mg-seq i')].map(i => i.textContent).join('|').includes('A pergunta') && /Síntese e limites/.test(first.querySelector('.mg-seq').textContent));
    ok('H: sem "achados" no Face a face (o roteiro vem do próprio modelo)', !/achado/.test(first.querySelector('.mg-fit').textContent)); esc(); await sl(400); }
  // ---- I) inglês
  lang('EN'); await sl(500); { const opened = await openFromPanel(); out.enHeads = qa('.mdl .mg-gh').map(h => h.textContent.trim()).join(' | '); out.enSample = txt(q('.mdl .mg')).slice(0, 300);
    ok('I: a galeria em inglês', opened && /Fits this spreadsheet/.test(txt(q('.mdl .mg-gh'))) && qa('.mdl .mg-gh').some(h => /Compare|Over time|Overview/.test(h.textContent)) && !/Indisponível|Serve para/.test(txt(q('.mdl .mg')))); esc(); await sl(400); lang('PT'); await sl(300); }
  out.RESUMO = bad.length ? bad : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack + '\n' + JSON.stringify(window.__gout || {}, null, 1); } })()
