(async () => { const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), errs = [], out = {};
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 300)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const [file, sheet, types] = decodeURIComponent(location.hash.slice(1)).split('|');
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', time: 'normal', message: '', story: null, tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer(file, await (await fetch('/dados-teste/' + file)).arrayBuffer(), sheet || undefined); for (let i = 0; i < 100 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 100 && S.step !== 'editor'; i++) await sl(150); await sl(1200);
  for (const type of types.split(',')) {
    const b = document.querySelector('#panel .type[data-v=' + type + ']'); if (!b) { out[type] = 'sem botão'; continue; } b.click(); await sl(2600); const md = document.querySelector('.mdl .mm'); if (md) { const x = document.querySelector('.mdl [data-m="1"]'); if (x) x.click(); await sl(300); }
    try { const blob = await buildPptx(S.piece); await fetch('/save?name=pptx-' + type + '.pptx', { method: 'POST', body: blob }); out[type] = blob.size; } catch (e) { out[type] = 'ERRO ' + e.message; } }
  out.errs = errs.slice(0, 4); return JSON.stringify(out); })()
