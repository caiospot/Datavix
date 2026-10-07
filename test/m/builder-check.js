(async () => {
  const D = window.__datavix, S = D.S, sleep = ms => new Promise(r => setTimeout(r, ms)), out = {}, bad = [];
  for (const lang of ['pt', 'en']) {
    const lb = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === lang.toUpperCase()); if (lb) lb.click(); await sleep(300);
    for (const f of ['vendas.csv', 'fluxo.csv', 'financeiro.xlsx', 'unidades.csv', 'canais.csv', 'pedidos.csv', 'lojas.csv', 'funil.csv', 'projetos.csv']) {
      for (const dec of ['invest', 'alert']) {
        S.user = { guest: true }; S.br = { audience: 'team', decision: dec, time: 'full', message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
        if (dec === 'invest') { D.go('entry'); D.loadBuffer(f, await (await fetch('/dados-teste/' + f)).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sleep(100); D.go('mapping'); await sleep(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sleep(150); await sleep(500); }
        const P = S.piece, meta = makeMeta(P), steps = buildSteps(P, meta); P.br = { ...P.br, decision: dec }; const c = storyCandidates(P, meta, steps), tag = `${lang}:${f}:${dec}`;
        const pr = storyPriority(P, null), mets = storyMetrics(P, c.facts), rd = storyReadings(P, c.facts);
        P.sb = { msg: '', center: c.center, ev: c.ev, diag: { fact: (rd[0] || {}).id || null, text: '' }, impl: ['Primeira implicação', ''], prio: pr.avail.length ? { crit: pr.avail[0], n: 3 } : null, plan: [{ a: 'Agir', o: 'Time', d: 'Q4', m: (mets[0] || {}).id || '' }], ask: 'Decidir' };
        const st = storyFromAnswers(P, meta, steps) || []; out[tag] = st.length;
        if (st.length < 5) bad.push(tag + ' poucos slides ' + st.length);
        st.forEach((s, k) => { const txt = [s.kick && s.kick.label, s.head, s.big && s.big.text, ...(s.rank || []).flatMap(r => [r.k, r.v]), ...(s.rows || []).flatMap(r => [r.a, r.m]), ...(s.chips || []).map(x => x.text + x.label), ...(s.calc ? s.calc.rows.flatMap(r => [r.k, r.v]) : [])].join(' | '); if (/undefined|NaN|\[object|null/.test(txt)) bad.push(tag + ' #' + k + ' texto inválido: ' + txt.slice(0, 140)); if (!s.head || !s.kick) bad.push(tag + ' #' + k + ' sem frase'); });
        const types = st.map(s => s.type || 'fact').join(','); if (!/diag/.test(types) || !/impl/.test(types) || !/plan/.test(types) || !/ask/.test(types)) bad.push(tag + ' tipos ausentes: ' + types);
        if (pr.avail.length && !/prio/.test(types)) bad.push(tag + ' sem prioridades');
      }
    }
  }
  out.bad = bad; return JSON.stringify(out); })()
