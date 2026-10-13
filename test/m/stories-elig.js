// Gate 42: elegibilidade das histórias (Fase 1) sobre a bateria sintética. Mostra as 3 sugeridas, as possíveis e as bloqueadas por planilha e confere com o gabarito.
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [], fails = [];
  window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push(e.message); });
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  // gabarito (docs/especificacao-historias.md §9): sugere = pelo menos uma destas aparece entre as 3 primeiras e todas devem ser possíveis; bloqueia = nenhuma pode ser possível
  const G = {
    vendas_sazonal: { poss: ['time', 'compare', 'composition', 'relation'], block: [] }, // Quantidade × Receita andam juntas de verdade (ρ ≈ 0,86)
    vendas_plana: { poss: ['compare', 'time'], block: [] },
    nps_pesquisa: { poss: ['compare', 'distribution'], block: ['rank'] },
    rh_folha: { poss: ['distribution', 'compare'], block: [] },
    marketing_campanhas: { poss: ['relation', 'compare'], block: [] },
    saude_atendimentos: { poss: ['distribution', 'compare', 'time'], block: ['relation'] },
    educacao_notas: { poss: ['relation', 'distribution'], block: [] },
    publico_orcamento: { poss: ['compare', 'rank'], block: ['relation'] },
    armadilha_ids: { poss: ['compare'], block: [] },
    pequena: { poss: ['compare'], block: ['distribution', 'relation'] },
    dados_faltantes: { poss: ['time', 'compare'], block: [] },
    negativos_zero: { poss: ['compare', 'time'], block: ['composition'] },
    concentrado: { poss: ['rank'], block: [] },
    formato_brasil: { poss: ['time', 'compare'], block: [] },
    pivot_largo: { poss: ['time', 'compare'], block: [] },
    texto_livre: { poss: ['compare'], block: ['relation', 'distribution'] },
  };
  const only = new URLSearchParams(location.search).get('only');
  for (const name of Object.keys(G)) {
    if (only && !only.split(',').includes(name)) continue;
    S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; D.go('entry');
    D.loadBuffer(name + '.csv', await (await fetch('/dados-teste/bateria/' + name + '.csv')).arrayBuffer());
    for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(200);
    const ds = S.ds, sg = nvStorySuggest(ds, { lang: 'pt' }), g = G[name], f = [];
    for (const id of g.poss) if (!sg.possible.includes(id)) f.push('deveria ser possível: ' + id + ' (' + sg.all[id].why + ')');
    if (!g.poss.some(id => sg.list.includes(id))) f.push('nenhuma esperada entre as sugeridas');
    for (const id of g.block) if (sg.possible.includes(id) && sg.all[id].score >= NV_ST_MIN_SCORE) f.push('deveria estar bloqueada ou fraca: ' + id + ' (' + sg.all[id].why + ')');
    out[name] = { sugere: sg.list.map(id => id + ' ' + sg.all[id].score.toFixed(2)).join(' | '), bloqueadas: sg.blocked.map(id => id + ': ' + sg.all[id].why).join(' | ').slice(0, 220), falhas: f };
    if (f.length) fails.push(name + ': ' + f.join('; '));
  }
  out.RESUMO = fails.length ? fails : 'tudo conforme o gabarito'; out.errs = errs; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
