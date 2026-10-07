(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S, errs = [], out = {}; window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const make = async (f, time, decision) => { S.user = { guest: true }; S.br = { audience: 'director', decision, time, message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
    D.go('entry'); D.loadBuffer(f, await (await fetch('/dados-teste/' + f)).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(1200); };
  const slides = async () => { document.querySelector('[data-a=present]').click(); await sl(700); const p = S.piece.pres, o = p.steps.map(s => s.kick.n + ' ' + s.act); p.stop(); await sl(300); return o; };
  await make('lojas.csv', 'full', 'prioritize'); out.full_prioritize = await slides();
  await make('lojas.csv', 'normal', 'prioritize'); out.normal = await slides();
  await make('lojas.csv', 'quick', 'prioritize'); out.quick_prioritize = await slides();
  await make('lojas.csv', 'quick', 'invest'); out.quick_invest = await slides();
  await make('lojas.csv', 'quick', 'alert'); out.quick_alert = await slides();
  // editor: estilo e fontes maiores
  document.querySelector('#ptab-style').click(); await sl(300); const tones = [...document.querySelectorAll('[data-a=tone]')].map(b => b.textContent.trim() + ':' + b.getAttribute('aria-pressed')); out.tones = tones;
  document.querySelector('[data-a=tone][data-v=tech]').click(); await sl(1500); out.afterTech = { pal: S.piece.palId, bg: S.piece.bg.color, pair: S.piece.fontPair, pressed: document.querySelector('[data-a=tone][data-v=tech]').getAttribute('aria-pressed') };
  document.querySelector('[data-a=big]').click(); await sl(1200); out.big = { on: S.piece.big, cls: document.querySelector('#piece').classList.contains('big'), sw: document.querySelector('[data-a=big]').getAttribute('aria-checked') };
  document.querySelector('[data-a=undo]').click(); await sl(1200); out.undoBig = { on: S.piece.big, cls: document.querySelector('#piece').classList.contains('big') };
  document.querySelector('[data-a=undo]').click(); await sl(1500); out.undoTone = S.piece.palId;
  out.errs = errs; return JSON.stringify(out, null, 1); })()
