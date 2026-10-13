// Gate 5 do motor de história: bateria de planilhas sintéticas (dados-teste/bateria, gerada por gerar-bateria.mjs) com o que foi plantado em cada uma.
// Mede se o motor acha o que existe (recall) e se não inventa o que não existe (precisão), e se os planos de 2, 5 e 10 slides ficam válidos.
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, bad = [], errs = [], rows = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const man = await (await fetch('/dados-teste/bateria/bateria.json')).json(), only = new URLSearchParams(location.search).get('only');
  const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (lb) lb.click(); await sl(300);
  const load = async (name, buf) => { S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1'); D.go('entry'); D.loadBuffer(name, buf); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(500); };
  for (const [name, info] of Object.entries(man)) {
    if (only && !only.split(',').includes(name)) continue;
    const t0 = performance.now(); await load(name + '.csv', await (await fetch('/dados-teste/bateria/' + name + '.csv')).arrayBuffer());
    const P = S.piece, ds = S.ds, meta = P.host.ix.meta, steps = buildSteps(P, meta), pl = info.plant || {}, res = [], fail = [];
    const pool = nvpPool(P, meta, steps), facts = pool.items, kinds = facts.map(f => f.ev.kind + ':' + (f.ev.refs || []).slice(0, 2).join('+'));
    const has = fn => facts.some(fn), refsOf = f => (f.ev.refs || []).map(String);
    const exp = (k, okv) => { res.push((okv ? '✓ ' : '✗ ') + k); if (!okv) fail.push(k); };
    if (pl.trend) exp('tendência de ' + pl.trend, has(f => f.ev.kind === 'trend' && (pl.trend === 'up' ? f.ev.values.tail > f.ev.values.head : f.ev.values.tail < f.ev.values.head)));
    if (pl.forbid) for (const k of pl.forbid) exp('sem ' + k, !has(f => f.ev.kind === k));
    if (pl.leader) exp('líder ' + pl.leader, has(f => ['lead', 'dominant'].includes(f.ev.kind) && refsOf(f)[0] === pl.leader));
    if (pl.dominant) exp('dominante ' + pl.dominant, has(f => ['lead', 'dominant', 'conc'].includes(f.ev.kind) && refsOf(f).includes(pl.dominant)));
    if (pl.balanced) exp('equilíbrio reconhecido', facts.some(f => f.act === 'balance') || !has(f => f.ev.kind === 'lead' && f.act === 'leader'));
    if (pl.assoc) exp('associação', has(f => f.ev.kind === 'assoc' || f.ev.kind === 'corr'));
    if (pl.forbidAssoc) exp('sem associação mecânica', !has(f => f.ev.kind === 'assoc'));
    if (pl.noAssocWith) exp('ID fora da associação (' + pl.noAssocWith.join(',') + ')', !has(f => f.ev.kind === 'assoc' && refsOf(f).some(r => pl.noAssocWith.includes(r))));
    if (pl.idCols) exp('ID não é medida', pl.idCols.every(n => { const c = ds.columns.find(x => x.name === n); return c && c.role !== 'measure'; }));
    if (pl.dist) exp('distribuição assimétrica', has(f => f.ev.kind === 'dist'));
    if (pl.outliers) exp('atípicos', has(f => f.ev.kind === 'outrows' || f.ev.kind === 'outlier'));
    if (pl.lowGroup) exp('grupo mais fraco ' + pl.lowGroup, has(f => refsOf(f).includes(pl.lowGroup)));
    if (pl.negatives) exp('sem participação sobre total inválido', !has(f => ['lead', 'dominant', 'conc'].includes(f.ev.kind) && f.ev.values && (f.ev.values.total <= 0)));
    if (pl.parse) exp('formato brasileiro lido', P.built.rowStats && P.built.rowStats.n >= 400 && !!P.built.period);
    if (pl.unpivot) exp('períodos em colunas desdobrados', !!(ds.fixes && ds.fixes.unpivot && !ds.fixes.unpivot.skipped));
    if (pl.text) exp('texto livre aproveitado', !!(P.cases) || (P.choice.all || []).includes('words') || has(f => /^c_terms/.test(f.act || '')));
    const planInfo = {};
    for (const N of [2, 5, 10]) { const a = nvPlan(P, meta, steps, N), b = nvPlan(P, meta, steps, N); const ok1 = a.slides.length >= 1 && a.slides.length <= N && !a.slides.some(s => s.role === 'nos') && a.report.ok, det = JSON.stringify(a.slides.map(s => [s.id, s.head])) === JSON.stringify(b.slides.map(s => [s.id, s.head])); planInfo['n' + N] = ok1 && det ? 'ok' : 'FALHOU'; if (!ok1) fail.push('plano ' + N + ': ' + a.slides.length + ' ' + a.report.errors.map(e => e.code).join('|')); if (!det) fail.push('plano ' + N + ' não determinístico'); }
    if (pl.small) { const p = nvPlan(P, meta, steps, 5); exp('amostra pequena sinalizada', p.slides.some(s => /exploratór|exploratory|Poucas|Few/.test((s.note || '') + ' ' + (s.lines || []).join(' '))) || facts.length === 0); }
    if (pl.missing) { const p = nvPlan(P, meta, steps, 5); exp('ausências no contexto', p.slides[0].lines.some(l => /sem valor|without a value/.test(l))); }
    const lab = { high: 0, medium: 0, exploratory: 0 }; facts.forEach(f => { lab[f.confidenceLabel] = (lab[f.confidenceLabel] || 0) + 1; });
    const det = new URLSearchParams(location.search).get('det') ? { roles: ds.columns.map(c => c.name + ':' + c.role).join(' '), mapping: JSON.stringify({ x: S.mapping.x, y: S.mapping.y, s: S.mapping.series, agg: S.mapping.agg, kind: S.mapping.kind }), heads: facts.map(f => f.id + '|' + f.head.slice(0, 90)), rs: P.built.rowStats && { n: P.built.rowStats.n, median: P.built.rowStats.median, mean: P.built.rowStats.mean, assoc: P.built.rowStats.assoc } } : undefined;
    rows.push({ det, name, shape: S.read && S.read.shape + '/' + S.read.conf, chart: P.type, facts: facts.length, kinds: kinds.join(' '), conf: `${lab.high}/${lab.medium}/${lab.exploratory}`, planos: Object.values(planInfo).join(','), checks: res.join(' · '), falhas: fail.length, ms: Math.round(performance.now() - t0) });
    if (fail.length) bad.push(name + ': ' + fail.join('; '));
  }
  out.resumo = { planilhas: rows.length, comFalha: rows.filter(r => r.falhas).length }; out.linhas = rows; out.bad = bad; out.errs = errs.slice(0, 5); return JSON.stringify(out, null, 1); })()
