// Gate 43: arcos de 2, 5 e 10 slides por história (Fase 1) sobre a bateria. Confere: tamanho, validador, pertencimento, linguagem, e que cada história com base tem achados.
(async () => { try {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, fails = [], errs = [];
  window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push(e.message); });
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  const only = new URLSearchParams(location.search).get('only'), names = (await (await fetch('/dados-teste/bateria/bateria.json')).json()), WORDS = /\b(causa|causou|provoca|provocou|devido a|por causa|culpa|explica|fraude|erro de)\b/i, OKW = new Set(['contrib', 'shift']); // contribuição e mudança usam "explica" no sentido de parcela do total (lista branca do próprio motor)
  const stories = ['compare', 'time', 'rank', 'composition', 'distribution', 'relation'], tot = { planos: 0, slides: 0, fatos: 0, semBase: 0 };
  for (const name of Object.keys(names)) {
    if (only && !only.split(',').includes(name)) continue;
    S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1'); D.go('entry');
    D.loadBuffer(name + '.csv', await (await fetch('/dados-teste/bateria/' + name + '.csv')).arrayBuffer());
    for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(200);
    D.go('mapping'); await sl(250); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 150 && S.step !== 'editor' && S.step !== 'find'; i++) await sl(150); if (S.step === 'find') D.go('editor'); await sl(500);
    const P = S.piece, meta = P.host.ix.meta, steps = buildSteps(P, meta), pool = nvpPool(P, meta, steps), sg = nvStorySuggest(S.ds, { lang: 'pt' }), rk = nvStoryRank(S.ds, P, pool, { lang: 'pt' }), row = {};
    for (const id of stories) {
      const info = []; let nFacts = 0;
      for (const N of [2, 5, 10]) {
        const pl = nvPlanStory(P, meta, steps, N, id, pool), f = [];
        if (!pl) { f.push('sem plano'); } else {
          tot.planos++; tot.slides += pl.slides.length;
          if (pl.slides.length !== N) f.push(N + ': tamanho ' + pl.slides.length);
          if (!pl.report.ok) f.push(N + ': validador ' + pl.report.errors.map(e => e.code + ':' + e.id).join(','));
          for (const s of pl.slides) {
            if (!s.synthetic) { nFacts++; tot.fatos++; if (!nvStoryAllows(id, s)) f.push(N + ': fora da história ' + s.id + ' (' + nvStoryFam(s) + ')'); }
            if (s.role === 'nos') tot.semBase++;
            const txt = [s.head, ...(s.lines || []), s.note].filter(Boolean).join(' '); if (!(s.ev && OKW.has(s.ev.kind)) && WORDS.test(txt)) f.push(N + ': linguagem proibida em ' + s.id + ': ' + txt.match(WORDS)[0]);
          }
          if (!new Set(pl.slides.map(s => s.id)).size === pl.slides.length) f.push(N + ': slide repetido');
        }
        if (f.length) fails.push(name + '/' + id + ' ' + f.join('; '));
        info.push(N + ':' + (pl ? pl.slides.filter(s => !s.synthetic).length + 'f' : '—'));
      }
      if (rk.list.includes(id) && nFacts === 0) fails.push(name + '/' + id + ': história sugerida, mas sem nenhum achado em nenhum tamanho'); row.__ = rk.list.join(',');
      row[id] = info.join(' ') + (sg.possible.includes(id) ? '' : ' (bloqueada)');
    }
    out[name] = row;
  }
  out.TOTAL = tot; out.RESUMO = fails.length ? fails : 'tudo conforme'; out.errs = errs; return JSON.stringify(out, null, 1);
} catch (e) { return 'ERRO ' + e.stack; } })()
