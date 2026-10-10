(async () => { const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'normal', message: '', story: null, tone: 'tech', place: 'screen' };
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('datavix-planilha-ideal.xlsx', await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer(), 'Casos CX'); for (let i = 0; i < 100 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 100 && S.step !== 'editor'; i++) await sl(150); await sl(2500);
  document.querySelector('[data-a=present]').click(); await sl(1500); document.querySelector('.pi-go').click(); await sl(1500); await S.piece.pres.show(1); await sl(2500);
  const av = document.querySelector('.altview'), eng = av && av._org && av._org.engine, cv = document.querySelector('#orgcv'); out.hasEng = !!eng; if (!eng) return JSON.stringify(out);
  const leaves = eng.leafN.filter(l => l.vis).sort((a, b) => b.rad - a.rad), r = cv.getBoundingClientRect();
  const clickLeaf = async l => { const [x, y] = eng.leafXY(l.i); const ev = t => new MouseEvent(t, { clientX: r.left + x, clientY: r.top + y, bubbles: true }); cv.dispatchEvent(ev('mousemove')); await sl(150); cv.dispatchEvent(ev('click')); await sl(500); };
  const card = () => document.querySelector('.pcard.pin'); const dq = () => ({ pin: !!card(), cmp: !!document.querySelector('.pcard.cmp'), cg: document.querySelectorAll('.pcard .cg').length, maxRows: Math.max(0, ...Array.from(document.querySelectorAll('.pcard .cg')).map(g => g.querySelectorAll('.cf').length)) });
  await clickLeaf(leaves[3]); out.one = dq(); await clickLeaf(leaves[6]); out.two = dq(); out.cmpRows = document.querySelectorAll('.pcard.cmp .cf.cmp').length; out.hoverHidden = true;
  const p2 = document.querySelector('#piece'); out.shot = p2.getBoundingClientRect().height;
  await clickLeaf(leaves[9]); out.three = dq();
  await S.piece.pres.show(2); await sl(800); out.afterSlide = dq();
  out.errs = errs.slice(0, 3); return JSON.stringify(out); })()
