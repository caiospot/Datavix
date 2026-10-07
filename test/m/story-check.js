(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, bad = [];
  for (const lang of ['pt', 'en']) {
    const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === lang.toUpperCase()); if (lb) lb.click(); await sleep(300);
    for (const f of ['vendas.csv', 'fluxo.csv', 'financeiro.xlsx', 'unidades.csv', 'canais.csv', 'pedidos.csv', 'lojas.csv', 'funil.csv', 'projetos.csv']) {
      S.user = { guest: true }; S.br = { audience: 'team', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
      D.go('entry'); D.loadBuffer(f, await (await fetch('/dados-teste/' + f)).arrayBuffer());
      for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100);
      D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click();
      for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150); await sleep(700);
      const P = S.piece, meta = P.host.ix.meta, st = buildStory(P, meta, buildSteps(P, meta)), tag = lang + ':' + f;
      out[tag] = st.length;
      if (st.length < 3) bad.push(tag + ' poucos slides: ' + st.length);
      const heads = new Set();
      st.forEach((s, k) => {
        const txt = [s.kick && s.kick.label, s.head, s.big && s.big.text, s.big && s.big.label, ...(s.calc ? s.calc.rows.flatMap(r => [r.k, r.v]) : [])].join(' | ');
        if (/undefined|NaN|\[object|null/.test(txt)) bad.push(tag + ' #' + k + ' texto inválido: ' + txt.slice(0, 120));
        if (!s.head || !s.kick || !s.kick.label) bad.push(tag + ' #' + k + ' sem frase/etapa');
        if (!s.calc || !s.calc.rows || !s.calc.rows.length) bad.push(tag + ' #' + k + ' sem cálculo');
        if (s.big && !numParts(s.big.text)) bad.push(tag + ' #' + k + ' número não parseável: ' + s.big.text);
        if (s.hl && !String(s.head).includes(s.hl)) bad.push(tag + ' #' + k + ' destaque fora da frase: ' + s.hl);
        if (heads.has(s.head)) bad.push(tag + ' #' + k + ' frase repetida'); heads.add(s.head);
      });
    }
  }
  out.bad = bad; return JSON.stringify(out, null, 1); })()
