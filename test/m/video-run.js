(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S, errs = []; console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 200)); window.addEventListener('error', e => { if (!/ResizeObserver/.test(e.message)) errs.push('ERR ' + e.message); });
  const [type, fmt] = (location.hash.slice(1) || 'hbars:vertical').split(':');
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Receita por categoria', story: 'compare', tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(2500);
  if (type !== 'fan') { document.querySelector('.panel .type[data-v=' + type + ']').click(); await sl(2200); }
  const out = { type, fmt, mime: videoMime() }; const t0 = performance.now(); let frames = 0, minGap = 1e9, maxGap = 0, last = 0;
  const res = await recordVideo(S.piece, fmt, { cancel: false }, { onFrame: () => { const n = performance.now(); if (last) { const g = n - last; minGap = Math.min(minGap, g); maxGap = Math.max(maxGap, g); } last = n; frames++; } });
  out.rec = { ms: Math.round(performance.now() - t0), size: res.blob.size, type: res.blob.type, ext: res.ext, seconds: res.seconds, frames, avgFps: Math.round(frames / ((performance.now() - t0) / 1000)), maxGapMs: Math.round(maxGap) };
  const url = URL.createObjectURL(res.blob), v = document.createElement('video'); v.muted = true; v.preload = 'auto'; v.src = url; document.body.appendChild(v); v.style.cssText = 'position:fixed;left:-9999px';
  await new Promise(r => { v.onloadeddata = r; v.onerror = r; setTimeout(r, 6000); }); out.video = { dur: v.duration, w: v.videoWidth, h: v.videoHeight, err: v.error && v.error.message };
  await fetch('/save?name=vid-' + type + '-' + fmt + '.' + res.ext, { method: 'POST', body: res.blob });
  const times = (location.search.slice(1) || '0.6,2.4,4.5,8,11.5,15,18.2,21').split(',').map(Number), cv = document.createElement('canvas'); cv.width = v.videoWidth / 2; cv.height = v.videoHeight / 2; const cx = cv.getContext('2d'); out.frames = [];
  const sheet = document.createElement('canvas'); const cw = cv.width, ch = cv.height; sheet.width = cw * times.length; sheet.height = ch; const sx = sheet.getContext('2d');
  for (const [k, tt] of times.entries()) { v.currentTime = Math.min(tt, (v.duration || 30) - 0.05); await new Promise(r => { v.onseeked = r; setTimeout(r, 2500); }); cx.drawImage(v, 0, 0, cw, ch); sx.drawImage(cv, k * cw, 0); }
  await fetch('/save?name=vsheet-' + type + '-' + fmt + '.png', { method: 'POST', body: await new Promise(r => sheet.toBlob(r, 'image/png')) });
  out.errs = errs; return JSON.stringify(out, null, 1); })()
