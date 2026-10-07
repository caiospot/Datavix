(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S, errs = [], out = {}; console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 200)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Receita por categoria', story: 'compare', tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(2500);
  document.querySelector('.panel .type[data-v=hbars]').click(); await sl(2000);
  document.querySelector('#ptab-share').click(); await sl(200); const btn = document.querySelector('[data-a=video]'); out.btn = btn.textContent.trim(); btn.click(); await sl(600);
  const m = document.querySelector('.mdl'); out.dialog = { title: m.querySelector('h3').textContent, warn: m.querySelector('.vd-warn').textContent.slice(0, 70), fmts: [...m.querySelectorAll('.vd-fmt')].map(b => b.dataset.f + ':' + b.getAttribute('aria-pressed')), len: m.querySelector('#vd-secs').textContent, goOn: !m.querySelector('[data-vd=go]').disabled };
  m.querySelector('.vd-fmt[data-f=square]').click(); await sl(200); out.afterSquare = m.querySelector('.vd-fmt[data-f=square]').getAttribute('aria-pressed');
  // cancelar no meio
  m.querySelector('[data-vd=go]').click(); await sl(3500); out.rec = { canvas: !!m.querySelector('.vd-live'), stat: m.querySelector('#vd-stat').textContent, bar: m.querySelector('#vd-bar').style.width, hosts: document.querySelectorAll('body > div[style*="z-index:-1"], body > div[style*="z-index: -1"]').length, dpr: devicePixelRatio };
  m.querySelector('[data-vd=abort]').click(); await sl(800); out.afterAbort = { chooseAgain: !!m.querySelector('[data-vd=go]'), hosts: document.querySelectorAll('body > div[style*="z-index:-1"], body > div[style*="z-index: -1"]').length, dpr: devicePixelRatio, modalOpen: !!document.querySelector('.mdl') };
  // gravar de verdade e baixar
  m.querySelector('.vd-fmt[data-f=vertical]').click(); m.querySelector('[data-vd=go]').click(); await sl(25500);
  const v = m.querySelector('.vd-video'); out.result = { video: !!v, src: v && v.src.slice(0, 5), note: [...m.querySelectorAll('.note')].map(n => n.textContent).join(' | ').slice(0, 80), btns: [...m.querySelectorAll('.mdl-a button')].map(b => b.textContent.trim()), dur: 0 };
  await new Promise(r => { if (v.readyState >= 1) r(); else { v.onloadedmetadata = r; setTimeout(r, 3000); } }); out.result.dur = Math.round(v.duration); out.result.dims = v.videoWidth + 'x' + v.videoHeight;
  let dl = 0; const oc = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { dl++; out.dlName = this.download; }; m.querySelector('[data-vd=dl]').click(); HTMLAnchorElement.prototype.click = oc; out.downloads = dl;
  m.querySelector('[data-vd=back]').click(); await sl(300); out.back = !!m.querySelector('[data-vd=go]');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await sl(400); out.closed = !document.querySelector('.mdl');
  // o editor continua funcionando
  document.querySelector('#ptab-chart').click(); document.querySelector('.panel .type[data-v=bars]').click(); await sl(1800); out.editor = S.piece.type + ' dpr=' + devicePixelRatio; out.errs = errs; return JSON.stringify(out, null, 1); })()
