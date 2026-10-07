(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S; const mode = location.hash.slice(1) || 'find';
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'find'; i++) await sl(150); await sl(500);
  if (mode === 'find') return 'ok';
  document.querySelector('[data-a=fd-guide]').click(); await sl(400); const next = async () => { document.querySelector('[data-a=sb-next], [data-a=sb-finish]').click(); await sl(350); };
  const want = mode.startsWith('q') ? +mode.slice(1) : 7;
  for (let k = 1; k < want; k++) {
    if (k === 1) document.querySelector('.sb-chip').click(); await sl(100);
    if (k === 2) { /* evidências */ } if (k === 3) { document.querySelector('.sb-list .fd-main').click(); await sl(150); } if (k === 4) { document.querySelector('.sb-chip').click(); await sl(100); }
    if (k === 5) { document.querySelector('.sb-opt').click(); await sl(200); } if (k === 6) { document.querySelector('.sb-chip').click(); await sl(100); const po = document.querySelector('#sb-po-0'); po.value = 'Comercial'; po.dispatchEvent(new Event('input', { bubbles: true })); const pd = document.querySelector('#sb-pd-0'); pd.value = 'até 30/11'; pd.dispatchEvent(new Event('input', { bubbles: true })); const pm = document.querySelector('#sb-pm-0'); pm.value = pm.options[2].value; pm.dispatchEvent(new Event('change', { bubbles: true })); }
    await next(); }
  if (mode.startsWith('q')) return 'ok';
  if (want === 7) { document.querySelector('.sb-chip').click(); await sl(100); }
  document.querySelector('[data-a=sb-finish]').click(); for (let i = 0; i < 60 && S.step !== 'editor'; i++) await sl(150); await sl(1500);
  document.querySelector('[data-a=present]').click(); await sl(900); const n = +(mode.replace('pres', '')) || 0; await S.piece.pres.show(n); await sl(2600); return 'ok'; })()
