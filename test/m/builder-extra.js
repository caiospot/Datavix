(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S, errs = [], out = {}; console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 200)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sl(400);
  S.user = { guest: true }; S.br = { audience: 'team', decision: 'invest', time: 'normal', message: '', story: null, tone: null, place: null }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('lojas.csv', await (await fetch('/dados-teste/lojas.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'find'; i++) await sl(150); await sl(500);
  out.pt = { h: document.querySelector('.wrap-narrow h2').textContent.replace(/\s+/g, ' '), badge: (document.querySelector('.fd-badge') || {}).textContent, cards: [...document.querySelectorAll('.fd-kick')].map(x => x.textContent).join(' | '), bad: /undefined|NaN|\[object/.test(document.body.innerText) };
  document.querySelector('[data-a=fd-quick]').click(); for (let i = 0; i < 60 && S.step !== 'editor'; i++) await sl(150); await sl(1500);
  out.quick = { step: S.step, sb: !!S.piece.sb, center: S.piece.sb && S.piece.sb.center, ev: S.piece.sb && S.piece.sb.ev.length };
  // editar história pelo painel
  document.querySelector('#ptab-share').click(); await sl(200); out.panelBtns = [...document.querySelectorAll('[data-a=story-edit],[data-a=story-find]')].map(b => b.textContent.trim());
  document.querySelector('[data-a=story-edit]').click(); await sl(500); out.edit = { step: S.step, prog: document.querySelector('.prog .lbl').textContent, q: document.querySelector('.sb-screen h2').textContent.replace(/\s+/g, ' '), msg: document.querySelector('#sb-msg').value };
  const next = async () => { document.querySelector('[data-a=sb-next], [data-a=sb-finish]').click(); await sl(300); };
  await next(); out.ev = document.querySelectorAll('.sb-list .fd-card.on').length; await next(); await next(); await next(); document.querySelector('.sb-opt').click(); await sl(200); await next(); await next();
  const ask = document.querySelector('#sb-ask'); ask.value = 'Aprovar o piloto no próximo trimestre'; ask.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('[data-a=sb-finish]').click(); for (let i = 0; i < 60 && S.step !== 'editor'; i++) await sl(150); await sl(1200);
  out.edited = { step: S.step, ask: S.piece.sb.ask, prio: S.piece.sb.prio, toast: (document.querySelector('#toast') || {}).textContent };
  // salvar e reabrir
  const P = S.piece; await saveProject(P); const rec = await getProject(P.id); out.saved = { sb: !!(rec && rec.data && rec.data.sb), ask: rec && rec.data && rec.data.sb && rec.data.sb.ask };
  await openRecent(P.id); for (let i = 0; i < 60 && S.step !== 'editor'; i++) await sl(150); await sl(1500); out.reopened = { step: S.step, ask: S.piece.sb && S.piece.sb.ask };
  document.querySelector('[data-a=present]').click(); await sl(900); out.pres = S.piece.pres.steps.map(s => (s.type || s.act) + ':' + String(s.head).slice(0, 30)); S.piece.pres.stop(); await sl(300);
  // mudar de idioma com a história guiada
  const en = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'EN'); if (en) en.click(); await sl(1500); document.querySelector('[data-a=present]').click(); await sl(900); out.presEN = S.piece.pres.steps.map(s => String(s.kick.label)).join(' | '); S.piece.pres.stop();
  out.errs = errs; return JSON.stringify(out, null, 1); })()
