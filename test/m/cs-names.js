(async () => { const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {};
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null };
  for (const f of ['pedidos.csv', 'lojas.csv', 'funil.csv', 'unidades.csv', 'vendas.csv']) { D.go('entry'); D.loadBuffer(f, await (await fetch('/dados-teste/' + f)).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100); D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150); await sleep(700);
    const cs = S.piece.built.cs || {}, o = {}; for (const k in cs) if (cs[k]) o[k] = Object.keys(cs[k]).filter(x => /name/i.test(x)).map(x => x + '=' + JSON.stringify(cs[k][x]).slice(0, 24)).join(','); const org = S.piece.built.org; if (org) o.organism = Object.keys(org).filter(x => /name/i.test(x)).map(x => x + '=' + JSON.stringify(org[x]).slice(0, 24)).join(',');
    out[f] = { type: S.piece.type, title: S.piece.title, names: o }; }
  return JSON.stringify(out, null, 1); })()
