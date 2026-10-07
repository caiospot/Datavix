(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S, errs = []; console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => errs.push('ERR ' + e.message));
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Receita por categoria', story: 'compare', tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(2500);
  const out = {}; const vis = s => { const e = document.querySelector(s); return !!e && e.getBoundingClientRect().height > 0; };
  out.tabs = [...document.querySelectorAll('.ptabs [role=tab]')].map(b => b.textContent + (b.getAttribute('aria-selected') === 'true' ? '*' : ''));
  out.chartTab = { types: document.querySelectorAll('.panel .type').length, icons: document.querySelectorAll('.panel .type .cico').length, fontsVisible: vis('#fp'), exportVisible: vis('[data-a=present]') };
  document.querySelector('#ptab-style').click(); await sl(300);
  out.styleTab = { fontsVisible: vis('#fp'), typesVisible: vis('.panel .type'), exportVisible: vis('[data-a=present]'), pal: vis('.pal') };
  document.querySelector('.fp-btn').click(); await sl(900);
  out.fpOpen = { listVisible: vis('.fp-list'), options: document.querySelectorAll('.fp-o').length, groups: [...document.querySelectorAll('.fp-g')].map(g => g.textContent), focused: document.activeElement.dataset.v, loaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')).filter((v, i, a) => a.indexOf(v) === i).length };
  document.querySelector('.fp-o[data-v=playfair]').click(); await sl(1800);
  out.afterPick = { pair: S.piece.fontPair, listVisible: vis('.fp-list'), h1font: getComputedStyle(document.querySelector('#ptitle')).fontFamily.slice(0, 40), h1w: getComputedStyle(document.querySelector('#ptitle')).fontWeight, ok: document.fonts.check("600 20px 'Playfair Display'"), btn: document.querySelector('.fp-nm b').textContent };
  document.querySelector('#ptab-share').click(); await sl(200); out.shareTab = { exportVisible: vis('[data-a=present]'), dataVisible: vis('[data-a=edit-data]') };
  out.errs = errs; return JSON.stringify(out, null, 1); })()
