// Quadros do vídeo sem gravar: monta a composição de um gráfico e salva uma folha de contato. Hash: tipo:formato ; query: sheet=Vendas&times=0.5,2,4,...
(async () => {
  const D = window.__datavix, S = D.S, sl = ms => new Promise(r => setTimeout(r, ms)), out = {}, errs = [];
  console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 200)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const [type, fmt0] = decodeURIComponent(location.hash.slice(1) || 'bars:vertical').split(':'), fmt = fmt0 || 'vertical', q = new URLSearchParams(location.search), sheet = q.get('sheet') || 'Vendas';
  const times = (q.get('times') || '0.4,1.2,2.4,3.4,4.6,6.5,9,12,16,20').split(',').map(Number);
  const pt = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'PT'); if (pt) pt.click(); await sl(300);
  for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow', 'gal', 'vz']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  S.user = { guest: true }; S.br = { area: null, audience: 'director', decision: 'prioritize', time: 'full', message: '', story: null, tone: 'tech', place: 'screen' };
  const buf = await (await fetch('/dados-teste/datavix-planilha-ideal.xlsx')).arrayBuffer(); D.loadBuffer('ideal.xlsx', buf, sheet);
  for (let i = 0; i < 150 && S.step !== 'preview'; i++) await sl(100); await sl(500); D.go('mapping'); await sl(400); document.querySelector('[data-a=generate]').click();
  for (let i = 0; i < 100 && S.step !== 'editor' && S.step !== 'find'; i++) await sl(150); if (S.step === 'find') D.go('editor'); await sl(1500);
  if (type !== 'auto') { const b = document.querySelector('#panel .type[data-v=' + type + ']'); if (!b) return JSON.stringify({ err: 'sem botão ' + type }); b.click(); await sl(2800); const md = document.querySelector('.mdl .mm'); if (md) { const x = document.querySelector('.mdl [data-m="1"]'); if (x) x.click(); await sl(400); } }
  const P = S.piece; out.type = P.type; const t0 = performance.now(), V = await videoPrepare(P, fmt), { plan, prep, draw, cv } = V; out.prep = Math.round(performance.now() - t0); out.total = plan.scenes.total; out.scenes = plan.scenes.map(s => s.kind + ':' + s.t0).join(' ');
  const vizzu = !isCsType(P.type) && P.type !== 'calendar' && P.type !== 'kpi', cw = cv.width / 3, ch = cv.height / 3, sheetC = document.createElement('canvas'); sheetC.width = cw * times.length; sheetC.height = ch; const sx = sheetC.getContext('2d');
  let vi = -1, started = false, t = 0, ti = 0, last = 0; const wall0 = performance.now();
  while (t <= plan.scenes.total && ti < times.length) {
    const i = plan.scenes.findIndex(s => t < s.t1); if (i !== vi && i >= 0) { vi = i; const s = plan.scenes[i]; if (s.kind === 'step') { prep.layer.go(s.state, !started); started = true; } }
    prep.layer.frame(t - last); last = t; draw(Math.min(t, plan.scenes.total - 1));
    if (t >= times[ti] * 1000) { sx.drawImage(cv, ti * cw, 0, cw, ch); ti++; }
    if (vizzu) { const target = performance.now() - wall0; t = Math.min(plan.scenes.total, target); await sl(16); } else { t += 33; if (ti % 3 === 0) await sl(0); }
  }
  V.destroy(); const key = type + '-' + fmt;
  await fetch('/save?name=vf-' + key + '.png', { method: 'POST', body: await new Promise(r => sheetC.toBlob(r, 'image/png')) });
  out.errs = errs.slice(0, 4); out.wall = Math.round(performance.now() - wall0); return JSON.stringify(out); })()
