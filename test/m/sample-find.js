(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S, out = {}; const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sl(400);
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'normal', message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  S.isSample = true; D.loadBuffer('exemplo-vendas.csv', sampleCsv()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300);
  out.mapping = { story: S.mapping.story, kind: S.mapping.kind, x: S.ds.columns[S.mapping.x] && S.ds.columns[S.mapping.x].name, y: S.ds.columns[S.mapping.y] && S.ds.columns[S.mapping.y].name, series: S.ds.columns[S.mapping.series] && S.ds.columns[S.mapping.series].name, cols: S.ds.columns.map(c => c.name + ':' + c.kind).join(', ') };
  document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'find'; i++) await sl(150); await sl(600);
  const P = S.piece; out.piece = { type: P.type, title: P.title, all: P.choice.all.join(','), alts: P.choice.alts.join(',') };
  out.cards = [...document.querySelectorAll('.fd-card')].map(c => c.innerText.replace(/\n/g, ' | ').slice(0, 150));
  document.querySelector('[data-a=fd-quick]').click(); for (let i = 0; i < 60 && S.step !== 'editor'; i++) await sl(150); await sl(1500);
  document.querySelector('[data-a=present]').click(); await sl(900); out.slides = S.piece.pres.steps.map(s => s.kick.n + ' ' + s.kick.label + ' | ' + s.head);
  return JSON.stringify(out, null, 1); })()
