// Gate 4 do motor de história: planos de 2, 5 e 10 slides, validador do plano, apresentação e vídeo. Query opcional: ?quick para só os arquivos simples
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, bad = [], errs = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const ok = (k, v) => { out[k] = v ? 'ok' : 'FALHOU'; if (!v) bad.push(k); };
  // ---- unidade: validador do plano ----
  const sy = (id, role, head, o = {}) => ({ id, role, planTitle: 'T', head, caption: head, kick: { n: '01', label: 'T' }, synthetic: true, lines: [head], ...o });
  const pool0 = { items: [] };
  ok('u-plano-bom', nvValidatePlan([sy('a', 'ctx', 'Um'), sy('b', 'finding', 'Dois')], 2, pool0).ok);
  ok('u-numero-de-slides', nvValidatePlan([sy('a', 'ctx', 'Um'), sy('b', 'ctx', 'Dois'), sy('c', 'ctx', 'Tres')], 2, pool0).errors.some(e => e.code === 'slide-count'));
  ok('u-sem-papel', nvValidatePlan([sy('a', '', 'Um', { planTitle: '' })], 1, pool0).errors.some(e => e.code === 'no-role'));
  ok('u-slide-vazio', nvValidatePlan([sy('a', 'ctx', '')], 1, pool0).errors.some(e => e.code === 'empty'));
  ok('u-afirmacao-repetida', nvValidatePlan([sy('a', 'ctx', 'Mesma frase'), sy('b', 'finding', 'mesma frase')], 2, pool0).errors.some(e => e.code === 'repeated'));
  ok('u-slide-duplicado', nvValidatePlan([sy('a', 'ctx', 'Um'), sy('a', 'finding', 'Dois')], 2, pool0).errors.some(e => e.code === 'duplicate-slide'));
  ok('u-causal-no-slide', nvValidatePlan([sy('a', 'ctx', 'A causa B')], 1, pool0).errors.some(e => e.code === 'causal'));
  ok('u-causal-liberado-explicito', nvValidatePlan([sy('a', 'synthesis', 'Em “Causa”, o mais citado é X', { allow: ['causal'] })], 1, pool0).ok);
  ok('u-acusacao-no-slide', nvValidatePlan([sy('a', 'ctx', 'Houve fraude em março')], 1, pool0).errors.some(e => e.code === 'accusation'));
  ok('u-exploratorio-sem-ressalva', nvValidatePlan([sy('a', 'finding', 'Achado', { confidenceLabel: 'exploratory' })], 1, pool0).errors.some(e => e.code === 'no-caveat'));
  ok('u-exploratorio-com-ressalva', nvValidatePlan([sy('a', 'finding', 'Achado', { confidenceLabel: 'exploratory', note: 'Leitura exploratória' })], 1, pool0).ok);
  ok('u-achado-inexistente', nvValidatePlan([{ id: 'zz', role: 'finding', planTitle: 'T', head: 'x', kick: { n: '01', label: 'T' } }], 1, pool0).errors.some(e => e.code === 'unknown-insight'));
  ok('u-numero-do-contexto-recalculado', nvValidatePlan([sy('a', 'ctx', '10 de 100 linhas usadas (10%)', { ev: nvEv('usage', { used: 10, total: 100 }, [{ k: 'p', value: 10, text: '10%' }], { n: 100 }) })], 1, pool0).ok && nvValidatePlan([sy('a', 'ctx', '10 de 100 linhas usadas (10%)', { ev: nvEv('usage', { used: 20, total: 100 }, [{ k: 'p', value: 10, text: '10%' }], { n: 100 }) })], 1, pool0).errors.some(e => e.code === 'mismatch'));
  ok('u-tamanho-pelo-tempo', nvSlideCount({ time: 'quick' }) === 2 && nvSlideCount({ time: 'normal' }) === 5 && nvSlideCount({ time: 'full' }) === 10 && nvSlideCount(null) === 10);
  // ---- integração ----
  const simple = ['vendas.csv', 'fluxo.csv', 'financeiro.xlsx', 'unidades.csv', 'canais.csv', 'pedidos.csv', 'lojas.csv', 'funil.csv', 'projetos.csv'];
  const jobs = [...simple.map(f => [f, null]), ...(location.search.includes('quick') ? [] : ['Vendas', 'Casos CX', 'Funil', 'Resumo', 'Mapa'].map(sh => ['datavix-planilha-ideal.xlsx', sh]))];
  const load = async (name, buf, sheet) => { S.user = { guest: true }; S.br = { audience: 'team', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1'); D.go('entry'); D.loadBuffer(name, buf, sheet || undefined); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(600); };
  let lastP = null;
  for (const lang of ['pt', 'en']) {
    const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === lang.toUpperCase()); if (lb) lb.click(); await sl(300);
    for (const [f, sh] of jobs) {
      await load(f, await (await fetch('/dados-teste/' + f)).arrayBuffer(), sh); const P = S.piece, meta = P.host.ix.meta, steps = buildSteps(P, meta), tag = lang + ':' + (sh || f); lastP = P;
      const r = { };
      for (const N of [2, 5, 10]) {
        const a = nvPlan(P, meta, steps, N), b = nvPlan(P, meta, steps, N), sig = x => JSON.stringify(x.slides.map(s => [s.id, s.role, s.head, s.note || '']));
        r['n' + N] = a.slides.length; if (a.slides.length > N || !a.slides.length) bad.push(`${tag} N=${N}: ${a.slides.length} slides`);
        if (!a.report.ok) bad.push(`${tag} N=${N} plano inválido: ` + a.report.errors.map(e => e.id + ':' + e.code).join('|'));
        if (sig(a) !== sig(b)) bad.push(`${tag} N=${N} não determinístico`);
        if (new Set(a.slides.map(s => s.id)).size !== a.slides.length) bad.push(`${tag} N=${N} ids repetidos`);
        const facts = a.slides.filter(s => !s.synthetic); const v = nvValidate(facts); if (v.errors.length) bad.push(`${tag} N=${N} erro nos achados do plano: ` + v.errors.map(e => e.id + ':' + e.code).join('|'));
        if (a.slides.some(s => s.confidenceLabel === 'exploratory' && !s.note)) bad.push(`${tag} N=${N} exploratório sem ressalva`);
        if (a.slides.some(s => !s.kick || !s.kick.label || !s.role)) bad.push(`${tag} N=${N} slide sem papel/título`);
        if (N === 2) r.roles2 = a.slides.map(s => s.role).join(',');
        if (N === 10) r.sintese = a.slides.filter(s => s.synthetic).length;
      }
      out[tag] = r;
    }
  }
  // dados insuficientes: planilha minúscula e planilha sem coluna numérica
  const tiny = new TextEncoder().encode('Item;Valor\nA;10\nB;20\nC;30\n').buffer; await load('tiny.csv', tiny);
  { const P = S.piece, meta = P.host.ix.meta, steps = buildSteps(P, meta); out.tiny = [2, 5, 10].map(N => { const a = nvPlan(P, meta, steps, N); if (a.slides.length > N || !a.slides.length || !a.report.ok) bad.push('tiny N=' + N + ' ' + a.slides.length + ' ' + a.report.errors.map(e => e.code).join('|')); return a.slides.length; }).join(','); }
  const cat = new TextEncoder().encode('Cidade;Tipo\n' + Array.from({ length: 60 }, (_, i) => `C${i % 6};T${i % 3}`).join('\n') + '\n').buffer; await load('semnumero.csv', cat);
  { const P = S.piece, meta = P.host.ix.meta, steps = buildSteps(P, meta); out.semnumero = [2, 5, 10].map(N => { const a = nvPlan(P, meta, steps, N); if (a.slides.length > N || !a.slides.length || !a.report.ok) bad.push('semnumero N=' + N + ' ' + a.slides.length + ' ' + a.report.errors.map(e => e.code).join('|')); return a.slides.length; }).join(','); }
  // ---- apresentação e vídeo ----
  await load('vendas.csv', await (await fetch('/dados-teste/vendas.csv')).arrayBuffer());
  for (const [time, N] of [['quick', 2], ['normal', 5], ['full', 10]]) {
    S.piece.br = { ...S.piece.br, time }; document.querySelector('[data-a=present]').click(); await sl(1500);
    const segs = document.querySelectorAll('.pprog .pseg').length; ok('apresenta-' + time, segs === N); out['seg-' + time] = segs;
    if (N === 2) { document.querySelector('.pi-go').click(); await sl(900); ok('ressalva-visivel-no-slide-2', !!document.querySelector('.ps-note')); }
    const ex = document.querySelector('.piece.presenting [data-p=exit]'); if (ex) ex.click(); await sl(500);
  }
  { const P = S.piece, vp = videoPlan(P, 'vertical'); out.video = vp.scenes.map(s => s.kind).join(','); ok('video-4-passos-do-plano', vp.scenes.filter(s => s.kind === 'step').length === 4 && vp.scenes[0].kind === 'hook' && vp.scenes[vp.scenes.length - 1].kind === 'brand'); out.videoHeads = vp.scenes.filter(s => s.kind === 'step').map(s => s.head).join(' | '); out.videoSub = vp.scenes.filter(s => s.kind === 'step').map(s => s.sub ? 'nota' : '-').join(','); }
  out.errs = errs.slice(0, 5); out.bad = bad; return JSON.stringify(out, null, 1); })()
