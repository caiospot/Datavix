(async () => { const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {};
  S.user = { guest: true }; S.br = { area: null, audience: null, decision: null, time: null, message: '', story: null, tone: null, place: null }; S.ob = 0; D.go('ob'); await sl(300);
  out.q1 = !!document.querySelector('[data-a=ob-skip]'); const seen = [];
  for (let i = 0; i < 4; i++) { seen.push(S.step + ':' + S.ob); document.querySelector('[data-a=ob-skip]').click(); await sl(250); }
  out.afterSkips = S.step; out.seen = seen.join(' ');
  document.querySelector('[data-a=back-to][data-v=ob]').click(); await sl(400); out.back = S.step + ':' + S.ob + ' skip=' + !!document.querySelector('[data-a=ob-skip]');
  document.querySelector('[data-a=ob-skip]').click(); await sl(300); out.again = S.step;
  D.loadBuffer('vendas.csv', await (await fetch('/dados-teste/vendas.csv')).arrayBuffer()); for (let i = 0; i < 100 && !['editor', 'read', 'find'].includes(S.step); i++) await sl(150); await sl(1500); out.end = S.step; out.br = JSON.stringify(S.br);
  return JSON.stringify(out); })()
