// Galeria: abre a aba Vendas da planilha ideal, troca para o gráfico pedido na hash (pie, donut, pies, donuts, packed) e confere desenho, mouse, cartão e erros
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 200)); window.addEventListener('error', e => errs.push('ERR ' + e.message));
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sl(300);
  const type = decodeURIComponent(location.hash.slice(1)) || 'pie', sheet = (location.search.match(/sheet=([^&]+)/) || [])[1] ? decodeURIComponent(location.search.match(/sheet=([^&]+)/)[1]) : 'Vendas';
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: 'tech', place: 'screen' };
  const buf = await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer(); D.loadBuffer('ideal.xlsx', buf, sheet);
  for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(500); D.go('mapping'); await sl(400); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 100 && S.step !== 'editor' && S.step !== 'find'; i++) await sl(150); if (S.step === 'find') D.go('editor'); await sl(1200);
  const P = S.piece; out.available = P.choice.all.filter(t => ['pie', 'donut', 'pies', 'donuts', 'packed', 'cols', 'lines', 'radial', 'radar', 'box', 'words'].includes(t)).join(',');
  const b = document.querySelector('#panel .type[data-v=' + type + ']'); if (!b) return JSON.stringify({ err: 'sem botão ' + type, out }); b.click(); await sl(2800);
  const modal = document.querySelector('.mdl .mm'); if (modal) { out.modal = true; const x = document.querySelector('.mdl [data-m="1"]'); if (x) x.click(); await sl(500); }
  out.type = S.piece.type; const cv = document.querySelector('#orgcv'), eng = document.querySelector('.org') && document.querySelector('.orgstage') && cv && S.piece.host ? null : null;
  const ctl = document.querySelector('#piece .vzbox, #piece .altview') ? null : null;
  const el = document.querySelector('.altview') || document.querySelector('#chart') || document.body; const o = [...document.querySelectorAll('*')].find(e => e._org); const oe = o && o._org;
  out.hasEngine = !!oe; if (oe) { const e = oe.engine, ids = []; for (let y = 40; y < e.h - 10; y += 25) for (let x = 40; x < e.w - 10; x += 25) { const id = e.pick(x, y); if (id !== null && !ids.includes(id)) ids.push(id); } out.picked = ids.length; out.items = e.D.items.length; out.note = (document.querySelector('.caption') || {}).textContent;
    if (ids.length) { const r = cv.getBoundingClientRect(), g = e.N[ids[0]].g; const pt = ['packed', 'lines', 'radial', 'radar', 'words'].includes(type), px = pt ? g.x : ['cols', 'box'].includes(type) ? g.x + g.w / 2 : g.cx + Math.cos((g.a0 + g.a1) / 2) * (g.r0 + g.r1) / 2, py = pt ? g.y : ['cols', 'box'].includes(type) ? g.y + g.h / 2 : g.cy + Math.sin((g.a0 + g.a1) / 2) * (g.r0 + g.r1) / 2; cv.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + px, clientY: r.top + py, bubbles: true })); await sl(500); out.card = (document.querySelector('#pcard') || {}).innerText.slice(0, 80).replace(/\n/g, ' '); cv.dispatchEvent(new MouseEvent('click', { clientX: r.left + px, clientY: r.top + py, bubbles: true })); await sl(400); out.pinned = oe.pinned() !== null; } }
  out.errs = errs.slice(0, 5); return JSON.stringify(out, null, 1); })()
