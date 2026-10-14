// Gate 55: interface dos modelos extras. Galeria (cartões, miniaturas com dados reais, sequência), escolha, painel, apresentação (tabelas com destaque,
// texto grande, conclusão em branco), navegação e erros de console. Rodar com ?tell (é o que faz a galeria abrir sozinha, como no produto).
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], out = {}, bad = [], errs = [];
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); window.__uout = out; };
  const oe = console.error; console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 160)); }; window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1'); try { localStorage.removeItem('dv-mg-view'); } catch (e) { /* segue */ }
  const lang = l => { const b = qa('button').find(x => x.textContent.trim() === l); if (b) b.click(); };
  lang('PT'); await sl(300);
  const key = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const waitModal = async (n = 80) => { for (let i = 0; i < n && !q('.mdl .mg'); i++) await sl(150); await sl(400); return !!q('.mdl .mg'); };
  const load = async (file, sheet) => {
    S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry'); await sl(200); S.ds = null; S.piece = null;
    D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer(), sheet); for (let i = 0; i < 150 && S.step !== 'preview' && S.step !== 'sheet'; i++) await sl(100); await sl(300);
    D.go('mapping'); await sl(250); q('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor'; i++) await sl(150);
    for (let i = 0; i < 80 && !(S.piece && S.piece.host && S.piece.host.ix); i++) await sl(150); await sl(600); };
  const present = async () => { q('[data-a=present]').click(); await sl(1300); const pi = q('.pintro .pi-btns button'); if (pi) { pi.click(); await sl(700); } return S.piece.pres; };
  const stop = async pres => { try { pres.stop(); } catch (e) { /* segue */ } await sl(500); };

  // =========================================================== A) F1 Comparativo: a galeria abre sozinha com 3 modelos
  await load('f1-senna-schumacher.xlsx', 'Comparativo 1989-94'); ok('A: a galeria abre depois de gerar (3 modelos possíveis)', await waitModal());
  const rec = qa('.mdl .tell > .tell-c.fit[data-id]'); ok('A: em destaque: Face a face, Resumo por temporada e mais um', rec.length === 3 && rec[0].dataset.id === 'versus' && rec[1].dataset.id === 'season'); out.rec = rec.map(c => c.dataset.id).join();
  const sc = rec[1]; ok('A: cartão do Resumo por temporada com nome, pergunta e "Serve para esta planilha: 2 entidades × 6 métricas × 6 períodos"', /Resumo por temporada/.test(sc.textContent) && /Como cada um evoluiu/.test(sc.textContent) && /Serve para esta planilha: 2 entidades × 6 métricas × 6 períodos/.test(sc.textContent));
  const svg = sc.querySelector('svg.mg-svg'); ok('A: miniatura com os dados reais: duas linhas (uma por piloto), 1989 e 1994 nas pontas, pontos de maior valor', !!svg && svg.querySelectorAll('path.mg-ln, path.mg-ln2').length === 2 && svg.querySelectorAll('circle').length === 2 && /1989/.test(svg.textContent) && /1994/.test(svg.textContent) && /Vitórias/.test(svg.textContent));
  const chips = [...sc.querySelectorAll('.mg-seq i')].map(i => i.textContent.replace(/^\d+/, '')); ok('A: sequência real do modelo (pilotos, maior valor, limites, conclusão)', chips.join('|') === 'Ayrton Senna|Michael Schumacher|Maior valor de cada métrica|Limites e síntese|Conclusão'); out.chips = chips.join(' > ');
  ok('A: texto para leitor de tela da miniatura', /Miniatura do modelo Resumo por temporada/.test(sc.textContent));
  const fcOff = qa('.mdl .mg-groups .tell-c.off').find(c => /Ficha \/ perfil/.test(c.textContent)); ok('A: Ficha / perfil aparece apagada, com o motivo, no grupo Panorama', !!fcOff && /uma lista de indicadores de uma só entidade/.test(fcOff.textContent) && !!fcOff.closest('[data-g=overview]')); ok('A: Resumo por temporada, se não for recomendado, ficaria no grupo "Ao longo do tempo"', !!q('.mdl [data-g=time]'));
  // escolher pelo clique e confirmar
  sc.click(); await sl(200); ok('A: clique marca o cartão', sc.getAttribute('aria-pressed') === 'true'); q('.mdl [data-m="0"]').click(); await sl(1500);
  ok('A: a escolha vale: história do projeto é "season"', S.piece.br.storyKind === 'season'); ok('A: painel mostra "Resumo por temporada" no seletor de história', (() => { const sel = qa('.panel select').find(s => [...s.options].some(o => o.value === 'season')); return !!sel && sel.value === 'season'; })());
  // apresentação
  let pres = await present(); const ids = pres.steps.map(s => s.id); ok('A: a apresentação usa o roteiro do modelo (capa, pilotos, maior valor, limites, conclusão)', ids.join() === 'ss-cover,ss-ent-0,ss-ent-1,ss-peaks,ss-limits,vs-conclusion'); out.ids = ids.join();
  const root = q('#piece');
  await pres.show(1); await sl(2400);
  ok('A: slide do Senna: frase, número grande 7 e a tabela com 7 linhas × 6 temporadas', /Ayrton Senna, 1989–1994: maior valor de Vitórias em 1991 \(7\)/.test(q('.pbody').innerText) && qa('.vz-tab tbody tr').length === 7 && qa('.vz-tab thead th').length === 7);
  ok('A: 5 células de maior valor destacadas', qa('.vz-tab td.hi').length === 5); const tdHi = q('.vz-tab td.hi'); ok('A: destaque tem fundo colorido e negrito', getComputedStyle(tdHi).fontWeight >= 700 && getComputedStyle(tdHi).backgroundColor !== 'rgba(0, 0, 0, 0)');
  const lastPlain = qa('.vz-tab tbody tr:nth-child(5) td:last-child')[0]; ok('A: última coluna (1994) não vira negrito (tabela "plain")', !!lastPlain && +getComputedStyle(lastPlain).fontWeight < 600); ok('A: o gráfico geral da peça não aparece nesse slide', root.classList.contains('pviz-on'));
  ok('A: nota de temporada incompleta visível', /1994 \(3 de 16\)/.test(q('.pbody').innerText));
  const wTab = q('.vz-tab').getBoundingClientRect(); ok('A: a tabela cabe na tela (sem corte à direita)', wTab.right <= innerWidth && wTab.left >= 0 && q('.vz-tab table').scrollWidth <= q('.vz-tab').clientWidth + 1);
  await pres.show(3); await sl(2000); ok('A: slide "Maior valor de cada métrica": 5 linhas e os dois pilotos nas colunas', qa('.vz-tab tbody tr').length === 5 && qa('.vz-tab thead th').length === 3 && /Michael Schumacher/i.test(q('.vz-tab thead').innerText) && /1994 · 8/.test(q('.vz-tab').innerText));
  await pres.show(4); await sl(1800); ok('A: limites e síntese visíveis, em lista', qa('.pbody .ps-list li, .pbody li').length >= 6 && /não tem registro em 1989 e 1990/.test(q('.pbody').innerText));
  await pres.show(5); await sl(1500); ok('A: conclusão em branco, pronta para a pessoa escrever', /Digite aqui|conteúdo/i.test(q('.pbody').innerText) || qa('.pbody [contenteditable], .pbody .ps-head').length > 0);
  key('ArrowLeft'); await sl(900); ok('A: seta para a esquerda volta um slide', q('#pcount').textContent === '05/06');
  await stop(pres);

  // =========================================================== B) ficha-municipio: um só modelo possível, aplicado sozinho
  await load('ficha-municipio.csv'); await sl(800); ok('B: com um só modelo possível a galeria não abre e a Ficha é aplicada', !q('.mdl .mg') && S.piece.br.storyKind === 'profile');
  ok('B: o painel mostra a história "Ficha / perfil"', (() => { const sel = qa('.panel select').find(s => [...s.options].some(o => o.value === 'profile')); return !!sel && sel.value === 'profile'; })());
  q('[data-a=mg-open]').click(); ok('B: a galeria abre pelo painel e a Ficha está marcada', await waitModal(40) && q('.mdl .tell-c.fit[data-id=profile]').getAttribute('aria-pressed') === 'true');
  const fcard = q('.mdl .tell-c.fit[data-id=profile]'), fsv = fcard.querySelector('svg.mg-svg'); ok('B: miniatura da Ficha com o nome da entidade (título automático), indicadores e valores reais', !!fsv && /População/.test(fsv.textContent) && /48\.210 pessoas/.test(fsv.textContent) && fsv.querySelectorAll('text.mg-v').length === 5); out.fcTitle = fsv && fsv.querySelector('text.mg-t') && fsv.querySelector('text.mg-t').textContent;
  ok('B: sequência da Ficha (capa, indicadores 1/2 e 2/2, limites, conclusão)', [...fcard.querySelectorAll('.mg-seq i')].map(i => i.textContent.replace(/^\d+/, '')).join('|') === 'Capa|Indicadores 1/2|Indicadores 2/2|Limites e síntese|Conclusão');
  ok('B: Face a face e Resumo por temporada indisponíveis, com o motivo; contar linhas também', ['versus', 'season'].every(id => true) && qa('.mdl .tell-c.off').filter(c => /Face a face|Resumo por temporada|Comparativo|Ranking e concentração|Composição/.test(c.textContent)).length === 5 && /métricas diferentes/.test(qa('.mdl .tell-c.off').find(c => /Ranking e concentração/.test(c.textContent)).textContent));
  const lv = qa('.mdl [data-a=mg-view]').find(b => b.dataset.v === 'list'); lv.click(); await sl(300); ok('B: a versão em lista mostra a Ficha sem miniatura pesada', q('.mdl .mg').dataset.view === 'list' && getComputedStyle(q('.mdl .mg-thumb')).display === 'none'); try { localStorage.removeItem('dv-mg-view'); } catch (e) { /* segue */ }
  key('Escape'); await sl(500); ok('B: fechar sem escolher não muda a história', S.piece.br.storyKind === 'profile');
  pres = await present(); ok('B: a apresentação usa a Ficha (capa, 2 tabelas, limites, conclusão)', pres.steps.map(s => s.id).join() === 'fc-cover,fc-nums-1,fc-nums-2,fc-limits,vs-conclusion');
  await pres.show(1); await sl(2400); ok('B: tabela de 8 indicadores com eixo, indicador, ano e valor', qa('.vz-tab tbody tr').length === 8 && qa('.vz-tab thead th').length === 4 && /Demografia/.test(q('.vz-tab').innerText) && /48\.210 pessoas/.test(q('.vz-tab').innerText));
  ok('B: a coluna de valores fica em negrito (tabela de ficha não é "plain")', +getComputedStyle(q('.vz-tab tbody tr:nth-child(2) td:last-child')).fontWeight >= 600 && !q('.vz-tab').classList.contains('plain')); ok('B: número grande 48.210 e rótulo POPULAÇÃO', /48\.210/.test(q('.pbody').innerText) && /POPULAÇÃO/.test(q('.pbody').innerText));
  await pres.show(2); await sl(1800); ok('B: segunda tabela com os 6 indicadores restantes (Saúde e Educação)', qa('.vz-tab tbody tr').length === 6 && /Cobertura vacinal/.test(q('.vz-tab').innerText) && /92,3%/.test(q('.vz-tab').innerText));
  await stop(pres);

  // =========================================================== C) ficha-piloto: textos grandes
  await load('ficha-piloto.csv'); await sl(800); ok('C: Ficha aplicada sozinha e título da peça é o nome da entidade', S.piece.br.storyKind === 'profile' && titleOf(S.piece) === 'Ayrton Senna');
  pres = await present(); ok('C: roteiro da ficha com textos', pres.steps.map(s => s.id).join() === 'fc-cover,fc-nums-1,fc-text,fc-limits,vs-conclusion');
  await pres.show(2); await sl(2200); const tv = q('.vz-text'); ok('C: textos da planilha em coluna única e fonte grande', !!tv && tv.classList.contains('big') && getComputedStyle(tv.querySelector('ul')).columnCount === '1' && parseFloat(getComputedStyle(tv.querySelector('li')).fontSize) >= 14 && /Tricampeão Mundial \(1988, 1990, 1991\)/.test(tv.innerText) && /Agressivo, cerebral, mestre sob chuva/.test(tv.innerText));
  await pres.show(1); await sl(2200); ok('C: tabela mostra "161 largadas" e "41 (25.4% de aproveitamento)" como estão na planilha e o "ver cálculo" a leitura', /161 largadas/.test(q('.vz-tab').innerText) && /41 \(25\.4% de aproveitamento\)/.test(q('.vz-tab').innerText) && /VER CÁLCULO/i.test(q('.pbody').innerText) && /→ 41/.test(q('.pbody').innerText));
  await stop(pres);
  // inglês
  lang('EN'); await sl(500); pres = await present(); await pres.show(1); await sl(2200); ok('C: em inglês a ficha usa "Indicators" e "Value"', /INDICATORS/i.test(q('.pbody').innerText) && /Value/i.test(q('.vz-tab thead').innerText) && /Ayrton Senna: 8 indicators in 3 units/.test(q('.pbody').innerText)); await stop(pres); lang('PT'); await sl(300);

  ok('sem erros de console', errs.filter(e => !/requestFullscreen|ResizeObserver/.test(e)).length === 0); out.errs = errs.filter(e => !/requestFullscreen|ResizeObserver/.test(e)).slice(0, 5);
  out.RESUMO = bad.length ? 'FALHOU: ' + bad.join(' | ') : 'tudo certo'; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack + ' ' + JSON.stringify(window.__uout || {}); } })()
