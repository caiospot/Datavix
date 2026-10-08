// Galeria: apresentação, PNG e quadro estático para o gráfico da hash
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 200)); window.addEventListener('error', e => errs.push('ERR ' + e.message));
  const type = decodeURIComponent(location.hash.slice(1)) || 'donut';
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: 'corporate', place: 'screen' };
  const buf = await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer(); D.loadBuffer('ideal.xlsx', buf, 'Vendas');
  for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(500); D.go('mapping'); await sl(400); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 100 && S.step !== 'editor' && S.step !== 'find'; i++) await sl(150); if (S.step === 'find') D.go('editor'); await sl(1200);
  document.querySelector('#panel .type[data-v=' + type + ']').click(); await sl(2500); const md = document.querySelector('.mdl [data-m="1"]'); if (md) { md.click(); await sl(400); }
  out.type = S.piece.type;
  const png = await D.renderPng(S.piece, { scale: 1 }); out.png = png ? (png.size || png.length || 'ok') : 'sem png';
  const steps = D.buildSteps(S.piece, S.piece.host.ix.meta); out.steps = steps.map(s => s.id + ':' + (s.caption || '').slice(0, 30)).join(' | ');
  document.querySelector('#orgpres').click(); await sl(2500); const root = document.querySelector('#piece'), key = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })), caps = [];
  for (let i = 0; i < 8; i++) { key('ArrowRight'); await sl(900); const b = document.querySelector('.pbody'); caps.push(root.classList.contains('pouro-on') ? 'OUTRO' : ((b.querySelector('.ps-head') || b.querySelector('.pc-h') || {}).textContent || '?').slice(0, 40)); }
  out.caps = caps; out.errs = errs.slice(0, 5); return JSON.stringify(out, null, 1); })()
