(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S, errs = []; console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 160)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Receita por categoria', story: 'compare', tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(2500);
  const out = {}; const root = () => document.querySelector('#piece'), key = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })), click = s => document.querySelector(s).click();
  // destaque do item citado no insight (fan tem passo "spot")
  const fanSteps = S.piece.pres ? null : null; document.querySelector('[data-a=present]').click(); await sl(800); let pres = S.piece.pres; const ins = pres.steps.filter(s => /^i\d/.test(s.id)), spot = pres.steps.find(s => s.id === 'spot');
  out.fan = { insightHasState: ins.map(s => !!s.state), spotState: !!(spot && spot.state), sameAsSpot: ins[0] && spot ? JSON.stringify(ins[0].state) === JSON.stringify(spot.state) : null };
  out.introBtns = [...document.querySelectorAll('.pintro .pi-btns button')].map(b => b.textContent.trim()); out.navBtns = [...document.querySelectorAll('#pnav button')].map(b => b.dataset.p + ':' + b.textContent.trim());
  pres.stop(); await sl(400);
  // reprodução automática num gráfico de poucos passos
  document.querySelector('.panel .type[data-v=hbars]').click(); await sl(1800); document.querySelector('[data-a=present]').click(); await sl(800); pres = S.piece.pres; const n = pres.steps.length;
  click('.pn-speed'); click('.pn-speed'); out.speed = document.querySelector('.pn-speed').textContent; // 1x -> 1.5x -> 2x
  click('.pintro .pi-auto'); await sl(500); out.auto = { playing: pres.isPlaying(), step0: document.querySelector('#pcount').textContent, run: document.querySelectorAll('.pseg.run').length, playBtn: document.querySelector('.pn-play').textContent, cls: root().classList.contains('pplaying') };
  await sl(9000); out.advanced = document.querySelector('#pcount').textContent;
  key(' '); await sl(300); out.pausedBySpace = { playing: pres.isPlaying(), run: document.querySelectorAll('.pseg.run').length }; const holdAt = document.querySelector('#pcount').textContent; await sl(3200); out.holdsWhilePaused = holdAt === document.querySelector('#pcount').textContent;
  key('p'); await sl(300); out.resumedByP = pres.isPlaying(); click('.c3 .vzbox'); await sl(300); out.pausedByChartClick = !pres.isPlaying();
  click('.pn-play'); out.resumedByBtn = pres.isPlaying(); await pres.show(n - 1); await sl(8500);
  out.outro = { on: root().classList.contains('pouro-on'), playing: pres.isPlaying(), cnt: document.querySelector('#pcount').textContent, items: document.querySelectorAll('.po-list li').length, ins: S.piece.insights.length, doneSegs: document.querySelectorAll('.pseg.done').length + '/' + n };
  click('.pouro [data-p=restart]'); await sl(600); out.restart = { intro: root().classList.contains('pintro-on'), outroHidden: !root().classList.contains('pouro-on') };
  await pres.show(0); await sl(300); click('.pseg[data-k="2"]'); await sl(400); out.jump = document.querySelector('#pcount').textContent;
  key('End'); await sl(300); key('ArrowRight'); await sl(500); out.rightFromLast = root().classList.contains('pouro-on'); key('ArrowLeft'); await sl(400); out.leftFromOutro = document.querySelector('#pcount').textContent;
  pres.stop(); await sl(400); out.cleaned = ['.pglow', '.pprog', '.pintro', '.pouro', '.pctx', '.pbody', '.pn-play', '.pn-speed'].map(s => document.querySelectorAll(s).length).join('') === '00000000' && !root().classList.contains('presenting');
  out.errs = errs; return JSON.stringify(out, null, 1); })()
