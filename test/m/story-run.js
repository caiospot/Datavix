(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const files = (location.hash.slice(1) || 'pedidos.csv').split(',');
  for (const f of files) {
    S.user = { guest: true }; S.br = { audience: 'team', decision: 'prioritize', message: 'T ' + f, story: 'compare', tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
    D.go('entry'); D.loadBuffer(f, await (await fetch('/dados-teste/' + f)).arrayBuffer());
    for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
    D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
    for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150); await sleep(900);
    const P = S.piece, base = buildSteps(P, P.host.ix.meta), st = buildStory(P, P.host.ix.meta, base);
    out[f] = { type: P.type, slides: st.map(s => `${s.kick.n} ${s.kick.label} | ${s.head} | big=${s.big ? s.big.text + ' (' + s.big.label + ')' : '-'} | state=${s.state ? JSON.stringify(s.state).slice(0, 40) : '-'} | calc=${s.calc ? s.calc.rows.length + ' linhas' : '-'}`) };
  }
  out.errs = errs; return JSON.stringify(out, null, 1); })()
