(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = []; window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const files = (location.hash.slice(1) || 'lojas.csv').split(',');
  for (const f of files) { S.user = { guest: true }; S.br = { audience: 'board', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
    D.go('entry'); D.loadBuffer(f, await (await fetch('/dados-teste/' + f)).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100); D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150); await sleep(600);
    const P = S.piece, meta = makeMeta(P), base = buildSteps(P, meta), facts = buildStory(P, meta, base, { insights: allInsights(P), extras: true });
    out[f] = { type: P.type, kept: (P.insights || []).length, all: allInsights(P).length, facts: facts.map(x => x.id + ' | ' + x.head + ' | ' + (x.big ? x.big.text : '-')) }; }
  out.errs = errs; return JSON.stringify(out, null, 1); })()
