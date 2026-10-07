(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S, errs = []; console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => errs.push('ERR ' + e.message));
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Receita por categoria', story: 'compare', tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(2500);
  const types = [...document.querySelectorAll('.panel .type:not(.off)')].map(b => b.dataset.v), out = {};
  const left = () => ['.pglow', '.pprog', '.pintro', '.phint', '.pctx', '.pbody'].map(s => document.querySelectorAll(s).length).join('');
  for (const t of types) {
    document.querySelector('.panel .type[data-v="' + t + '"]').click(); await sl(1800);
    document.querySelector('[data-a=present]').click(); await sl(900);
    const P = S.piece, pres = P.pres, root = document.querySelector('#piece'), n = pres.steps.length, r = { n, intro: root.classList.contains('pintro-on'), segs: document.querySelectorAll('.pseg').length, heroTxt: (document.querySelector('[data-num]') || {}).textContent };
    let empty = 0, bad = 0;
    for (let k = 0; k < n; k++) { await pres.show(k); await sl(120); const b = document.querySelector('.pbody'); if (!b || !b.textContent.trim()) empty++; const cur = document.querySelectorAll('.pseg.cur').length, done = document.querySelectorAll('.pseg.done').length; if (cur !== 1 || done !== k) bad++; if (root.classList.contains('pintro-on')) bad++; }
    r.empty = empty; r.badProgress = bad; r.counter = document.querySelector('#pcount').textContent;
    await pres.show(-1); await sl(200); r.backToIntro = root.classList.contains('pintro-on') && document.querySelector('#pcount').textContent === '';
    pres.stop(); await sl(300); r.cleaned = left() === '000000' && !root.classList.contains('presenting') && !root.classList.contains('pintro-on'); out[t] = JSON.stringify(r);
  }
  out.errs = errs; return JSON.stringify(out, null, 1); })()
