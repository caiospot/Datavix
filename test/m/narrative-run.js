// Gate 1 do motor de história: evidência estruturada + validador. Testa o validador com casos sintéticos e confere todos os achados reais das planilhas de teste.
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, bad = [], errs = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  // ---- unidade: validador ----
  const mk = (kind, values, shown, n, text, extra = {}) => ({ id: 't-' + kind, head: text, ev: nvEv(kind, values, shown, { n }), ...extra });
  const good = mk('lead', { top: 60, total: 100 }, [{ k: 'share', value: 60, text: '60%' }], 5, 'A lidera com 60% do total.');
  ok('u-bom', nvValidate([good]).ok && nvValidate([good]).checked === 1);
  ok('u-valor-adulterado', nvValidate([mk('lead', { top: 60, total: 120 }, [{ k: 'share', value: 60, text: '60%' }], 5, 'A lidera com 60% do total.')]).errors.some(e => e.code === 'mismatch'));
  ok('u-texto-sem-numero', nvValidate([mk('lead', { top: 60, total: 100 }, [{ k: 'share', value: 60, text: '60%' }], 5, 'A lidera com folga.')]).errors.some(e => e.code === 'text-mismatch'));
  ok('u-denominador-zero', nvValidate([mk('lead', { top: 5, total: 0 }, [], 5, 'x')]).errors.some(e => e.code === 'bad-denominator'));
  ok('u-denominador-negativo', nvValidate([mk('jump', { prev: -3, cur: 4 }, [], 2, 'x')]).errors.some(e => e.code === 'bad-denominator'));
  ok('u-amostra-pequena', nvValidate([mk('lead', { top: 60, total: 100 }, [{ k: 'share', value: 60, text: '60%' }], 2, 'A lidera com 60% do total.')]).errors.some(e => e.code === 'small-sample'));
  ok('u-nan', nvValidate([mk('conc', { parts: [1, NaN], total: 10 }, [], 8, 'x')]).errors.some(e => e.code === 'invalid-value'));
  ok('u-causal', nvValidate([mk('corr', { r: 0.8 }, [{ k: 'r', value: 0.8, text: '0,80' }], 20, 'X causou Y: r = 0,80.')]).errors.some(e => e.code === 'causal'));
  ok('u-causal-en', nvValidate([mk('corr', { r: 0.8 }, [{ k: 'r', value: 0.8, text: '0.80' }], 20, 'X leads to Y, r = 0.80.')]).errors.some(e => e.code === 'causal'));
  ok('u-contrib-explica-ok', nvValidate([mk('contrib', { diff: 40, dTotal: 100 }, [{ k: 'p', value: 40, text: '40%' }], 8, 'A explica 40% da alta do período.')]).ok);
  ok('u-acusacao-anomalia', nvValidate([mk('outlier', { value: 100, q1: 10, q3: 20 }, [], 20, 'Janeiro tem valor atípico (100), possível erro.')]).errors.some(e => e.code === 'accusation'));
  ok('u-acusacao-fraude', nvValidate([mk('outlier', { value: 100, q1: 10, q3: 20 }, [], 20, 'Possible fraud in March (100).')]).errors.some(e => e.code === 'accusation'));
  ok('u-outlier-valido', nvValidate([mk('outlier', { value: 100, q1: 10, q3: 20 }, [], 20, 'Janeiro tem valor atípico (100).')]).ok);
  ok('u-outlier-falso', nvValidate([mk('outlier', { value: 15, q1: 10, q3: 20 }, [], 20, 'Janeiro tem valor atípico (15).')]).errors.some(e => e.code === 'not-outlier'));
  ok('u-outlier-exploratorio', nvValidate([mk('outlier', { value: 100, q1: 10, q3: 20 }, [], 9, 'Janeiro tem valor atípico (100).')]).warnings.some(w => w.code === 'exploratory'));
  ok('u-tipo-desconhecido', nvValidate([{ id: 'z', head: 'x', ev: { kind: 'xyz', values: {}, shown: [] } }]).errors.some(e => e.code === 'unknown-kind'));
  ok('u-sem-evidencia-aviso', (() => { const r = nvValidate([{ id: 'q', head: 'sem ev' }]); return r.ok && r.unchecked === 1 && r.warnings.some(w => w.code === 'no-evidence'); })());
  ok('u-editado-pula', nvValidate([{ ...mk('lead', { top: 1, total: 0 }, [], 5, 'x'), edited: true }]).ok);
  ok('u-repetida', nvValidate([{ id: 'a', head: 'Mesma frase.' }, { id: 'b', head: 'mesma frase.' }]).warnings.some(w => w.code === 'repeated'));
  { const items = [{ id: 'a', head: 'ok', kick: { n: '01' } }, mk('lead', { top: 1, total: 0 }, [], 5, 'x', { kick: { n: '02' } }), { id: 'c', head: 'ok2', kick: { n: '03' } }], g = nvGuard(items); ok('u-guard-remove-e-renumera', g.items.length === 2 && g.items[1].kick.n === '02' && g.report.errors.length === 1); }
  ok('u-deterministico', JSON.stringify(nvValidate([good, good])) === JSON.stringify(nvValidate([good, good])));
  // ---- unidade: famílias novas ----
  ok('u-dist-bom', nvValidate([mk('dist', { median: 10, mean: 15, n: 100, q1: 5, q3: 20 }, [{ k: 'gap', value: 50, text: '50%' }], 100, 'Metade abaixo de 10, média 15 (50% acima).')]).ok);
  ok('u-dist-adulterada', nvValidate([mk('dist', { median: 10, mean: 15, n: 100, q1: 5, q3: 20 }, [{ k: 'gap', value: 80, text: '80%' }], 100, 'média 80% acima.')]).errors.some(e => e.code === 'mismatch'));
  ok('u-dist-mediana-zero', nvValidate([mk('dist', { median: 0, mean: 15, n: 100, q1: 0, q3: 20 }, [], 100, 'x')]).errors.some(e => e.code === 'bad-denominator'));
  ok('u-dist-poucas-linhas', nvValidate([mk('dist', { median: 10, mean: 15, n: 12, q1: 5, q3: 20 }, [{ k: 'gap', value: 50, text: '50%' }], 12, 'média 50% acima.')]).errors.some(e => e.code === 'small-sample'));
  ok('u-outrows-bom', nvValidate([mk('outrows', { count: 5, n: 100, q1: 1, q3: 2 }, [{ k: 'p', value: 5, text: '5%' }, { k: 'count', value: 5, text: '5' }], 100, '5 de 100 registros (5%) ficam acima da faixa usual.')]).ok);
  ok('u-outrows-contagem-invalida', nvValidate([mk('outrows', { count: 0, n: 100, q1: 1, q3: 2 }, [], 100, 'x')]).errors.some(e => e.code === 'bad-count'));
  ok('u-outrows-acusacao', nvValidate([mk('outrows', { count: 5, n: 100, q1: 1, q3: 2 }, [{ k: 'p', value: 5, text: '5%' }], 100, '5 registros (5%) com erro de digitação.')]).errors.some(e => e.code === 'accusation'));
  ok('u-assoc-bom', nvValidate([mk('assoc', { rho: 0.7, n: 200 }, [{ k: 'rho', value: 0.7, text: '0,70' }], 200, 'A e B variam juntos (Spearman 0,70).')]).ok);
  ok('u-assoc-fora-de-faixa', nvValidate([mk('assoc', { rho: 1.4, n: 200 }, [], 200, 'x')]).errors.some(e => e.code === 'out-of-range'));
  ok('u-assoc-causal', nvValidate([mk('assoc', { rho: 0.7, n: 200 }, [{ k: 'rho', value: 0.7, text: '0,70' }], 200, 'A causa B (0,70).')]).errors.some(e => e.code === 'causal'));
  ok('u-assoc-causal-en', nvValidate([mk('assoc', { rho: 0.7, n: 200 }, [{ k: 'rho', value: 0.7, text: '0.70' }], 200, 'A leads to B (0.70).')]).errors.some(e => e.code === 'causal'));
  ok('u-assoc-amostra', nvValidate([mk('assoc', { rho: 0.7, n: 10 }, [{ k: 'rho', value: 0.7, text: '0,70' }], 10, 'A e B variam juntos (0,70).')]).errors.some(e => e.code === 'small-sample'));
  ok('u-ratio-gappp', nvValidate([mk('ratio', { num: 30, den: 120 }, [{ k: 'p', value: 25, text: '25%' }], 120, '25% resolvidos.'), mk('gappp', { a1: 30, v1: 100, a0: 10, v0: 100 }, [{ k: 'd', value: 20, text: '20' }], 100, 'diferença de 20 pontos.')]).ok);
  ok('u-contagem-pequena-aviso', nvValidate([{ ...mk('ratio', { num: 3, den: 10 }, [{ k: 'p', value: 30, text: '30%' }], 10, '30% resolvidos.'), ev: { ...nvEv('ratio', { num: 3, den: 10 }, [{ k: 'p', value: 30, text: '30%' }], { n: 10, method: 'count' }) } }]).warnings.some(w => w.code === 'exploratory'));
  // estatística: postos, Spearman e perfil das linhas
  ok('u-rank-empates', JSON.stringify(nvRank([10, 20, 20, 30])) === JSON.stringify([1, 2.5, 2.5, 4]));
  ok('u-spearman-monotona', Math.abs(nvSpearman([1, 2, 3, 4, 5], [1, 8, 27, 64, 125]) - 1) < 1e-9 && Math.abs(nvSpearman([1, 2, 3, 4, 5], [9, 7, 5, 3, 1]) + 1) < 1e-9);
  ok('u-spearman-constante', nvSpearman([1, 2, 3], [5, 5, 5]) === null);
  { const n = 100, y = Float64Array.from({ length: n }, (_, i) => (i === 99 ? 1000 : 10 + (i % 10))), x = Float64Array.from({ length: n }, (_, i) => y[i] * 2 + 1), ds = { rowCount: n, columns: [{ name: 'Y', kind: 'number', role: 'measure', data: y }, { name: 'X', kind: 'number', role: 'measure', data: x }, { name: 'ID', kind: 'number', role: 'id', data: x }] };
    const rs = nvRowStats(ds, ds.columns[0]); ok('u-perfil-linhas', rs.n === 100 && rs.median === 14 && rs.outAbove === 1 && !rs.outBelow && rs.assoc && rs.assoc.name === 'X' && rs.assoc.rho > 0.99);
    ok('u-id-nao-vira-associacao', rs.assoc.name !== 'ID');
    const ins = nvRowInsights({ rowStats: rs, kind: 'category' }, 'pt', T); ok('u-insights-linhas', ins.map(i => i.id).join() === 'dist_skew,outlier_rows,assoc' || ins.map(i => i.id).join() === 'outlier_rows,assoc' || ins.some(i => i.id === 'assoc'));
    ok('u-insights-linhas-validos', nvValidate(ins).ok && nvValidate(ins).checked === ins.length);
    ok('u-poucas-linhas-sem-insight', nvRowInsights({ rowStats: nvRowStats({ rowCount: 10, columns: [] }, { name: 'Y', data: Float64Array.from({ length: 10 }, (_, i) => i) }), kind: 'category' }, 'pt', T).length === 0);
    ok('u-sem-medida', nvRowStats({ rowCount: 5, columns: [] }, null) === null); }
  // ---- integração: achados reais ----
  const files = (new URLSearchParams(location.search).get('files') || 'vendas.csv,fluxo.csv,financeiro.xlsx,unidades.csv,canais.csv,pedidos.csv,lojas.csv,funil.csv,projetos.csv').split(',');
  const seenNew = new Set(), jobs = files.map(f => ['/dados-teste/' + f, f, null]).concat((new URLSearchParams(location.search).get('sheets') || 'Vendas,Casos CX,Funil,Resumo,Mapa').split(',').filter(x => x && !location.search.includes('nosheets')).map(sh => ['/dados-teste/datavix-planilha-ideal.xlsx', 'ideal:' + sh, sh]));
  for (const lang of ['pt', 'en']) {
    const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === lang.toUpperCase()); if (lb) lb.click(); await sl(300);
    for (const [url, f, sheet] of jobs) {
      S.user = { guest: true }; S.br = { audience: 'team', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
      D.go('entry'); D.loadBuffer(f.replace('ideal:', 'ideal-') + (sheet ? '.xlsx' : ''), await (await fetch(url)).arrayBuffer(), sheet || undefined);
      for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100);
      D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click();
      for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(700);
      const P = S.piece, meta = P.host.ix.meta, tag = lang + ':' + f, steps = buildSteps(P, meta);
      const st = buildStory(P, meta, steps, { insights: allInsights(P), extras: true }), r = st.report, st2 = buildStory(P, meta, steps, { insights: allInsights(P), extras: true });
      const all = allInsights(P), av = nvValidate(all); all.forEach(i => { if (/^(dist_skew|outlier_rows|assoc)$/.test(i.id)) seenNew.add(i.id); });
      out[tag + '#todos'] = { n: all.length, checked: av.checked, errors: av.errors.length, novos: all.filter(i => /^(dist_skew|outlier_rows|assoc)$/.test(i.id)).map(i => i.id).join(',') || undefined };
      if (av.errors.length) bad.push(tag + ' erros em todos os achados: ' + av.errors.map(e => e.id + ':' + e.code + ' ' + e.msg).join(' | '));
      const iv = nvValidate(P.insights);
      out[tag] = { slides: st.length, checked: r.checked, unchecked: r.unchecked, errors: r.errors.length, ins: P.insights.length, insChecked: iv.checked, insErr: iv.errors.length };
      if (r.errors.length) bad.push(tag + ' erros no roteiro: ' + r.errors.map(e => e.id + ':' + e.code + ' ' + e.msg).join(' | '));
      if (iv.errors.length) bad.push(tag + ' erros nos insights: ' + iv.errors.map(e => e.id + ':' + e.code + ' ' + e.msg).join(' | '));
      const base = /^(peak|low|jump_up|drop|trend_up|trend_down|dominant|outlier)$/; const miss = P.insights.filter(i => base.test(i.id) && !i.ev).map(i => i.id); if (miss.length) bad.push(tag + ' insight base sem evidência: ' + miss.join(','));
      out[tag].pendentes = P.insights.filter(i => !i.ev).map(i => i.id).join(',') || undefined; // achados de gráficos específicos: evidência no gate 2
      if (JSON.stringify(st.map(s => s.head)) !== JSON.stringify(st2.map(s => s.head))) bad.push(tag + ' roteiro não determinístico');
    }
  }
  ok('familias-novas-aparecem', seenNew.size >= 2); out.novos = [...seenNew].join(',');
  out.errs = errs.slice(0, 5); out.bad = bad; return JSON.stringify(out, null, 1); })()
