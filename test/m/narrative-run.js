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
  // ---- integração: achados reais ----
  const files = (new URLSearchParams(location.search).get('files') || 'vendas.csv,fluxo.csv,financeiro.xlsx,unidades.csv,canais.csv,pedidos.csv,lojas.csv,funil.csv,projetos.csv').split(',');
  for (const lang of ['pt', 'en']) {
    const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === lang.toUpperCase()); if (lb) lb.click(); await sl(300);
    for (const f of files) {
      S.user = { guest: true }; S.br = { audience: 'team', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
      D.go('entry'); D.loadBuffer(f, await (await fetch('/dados-teste/' + f)).arrayBuffer());
      for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100);
      D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click();
      for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(700);
      const P = S.piece, meta = P.host.ix.meta, tag = lang + ':' + f, steps = buildSteps(P, meta);
      const st = buildStory(P, meta, steps, { insights: allInsights(P), extras: true }), r = st.report, st2 = buildStory(P, meta, steps, { insights: allInsights(P), extras: true });
      const iv = nvValidate(P.insights);
      out[tag] = { slides: st.length, checked: r.checked, unchecked: r.unchecked, errors: r.errors.length, ins: P.insights.length, insChecked: iv.checked, insErr: iv.errors.length };
      if (r.errors.length) bad.push(tag + ' erros no roteiro: ' + r.errors.map(e => e.id + ':' + e.code + ' ' + e.msg).join(' | '));
      if (iv.errors.length) bad.push(tag + ' erros nos insights: ' + iv.errors.map(e => e.id + ':' + e.code + ' ' + e.msg).join(' | '));
      const base = /^(peak|low|jump_up|drop|trend_up|trend_down|dominant|outlier)$/; const miss = P.insights.filter(i => base.test(i.id) && !i.ev).map(i => i.id); if (miss.length) bad.push(tag + ' insight base sem evidência: ' + miss.join(','));
      out[tag].pendentes = P.insights.filter(i => !i.ev).map(i => i.id).join(',') || undefined; // achados de gráficos específicos: evidência no gate 2
      if (JSON.stringify(st.map(s => s.head)) !== JSON.stringify(st2.map(s => s.head))) bad.push(tag + ' roteiro não determinístico');
    }
  }
  out.errs = errs.slice(0, 5); out.bad = bad; return JSON.stringify(out, null, 1); })()
