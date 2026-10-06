(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), errs = [], out = {};
  const oe = console.error; console.error = (...a) => { errs.push(a.map(String).join(' ').slice(0, 160)); };
  window.addEventListener('error', e => errs.push('ERR ' + e.message));
  window.addEventListener('unhandledrejection', e => errs.push('REJ ' + (e.reason && e.reason.message || e.reason)));
  const buf = await (await fetch('/dados-teste/projetos.csv')).arrayBuffer();
  for (const story of ['time', 'compare', 'composition', 'distribution', 'relation']) {
    S.user = { guest: true }; S.br = { audience: 'clevel', decision: 'prioritize', message: 'T ' + story, story, tone: 'corporate', place: 'screen' };
    D.go('entry'); D.loadBuffer('projetos.csv', buf.slice(0));
    for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
    D.go('mapping'); await sleep(250); document.querySelector('[data-a=generate]').click();
    for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150);
    await sleep(1200); const P = S.piece, res = [];
    for (const t of P.choice.all) { P.type = t; try { await P.host.setType(t); } catch (e) { errs.push('setType ' + t + ' ' + e.message); } await sleep(700); res.push(t + (document.querySelector('#pcard').innerText.length > 10 ? '✓' : '✗')); }
    out[story] = res.join(' ');
  }
  out.errors = errs.slice(0, 8);
  return JSON.stringify(out, null, 1);
})()
