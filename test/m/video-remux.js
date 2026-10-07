(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const D = window.__datavix, S = D.S, errs = [], out = {}; console.error = (...a) => errs.push(a.map(String).join(' ').slice(0, 200));
  S.user = { guest: true }; S.br = { audience: 'director', decision: 'prioritize', message: 'Receita por categoria', story: 'compare', tone: 'tech', place: 'screen' }; for (const k of ['org', 'rays', 'river', 'fan', 'ridge', 'flow']) localStorage.setItem('dv-' + k + '-tutorial', '1');
  D.loadBuffer('pedidos.csv', await (await fetch('/dados-teste/pedidos.csv')).arrayBuffer()); for (let i = 0; i < 80 && S.step !== 'preview'; i++) await sl(100); D.go('mapping'); await sl(300); document.querySelector('[data-a=generate]').click(); for (let i = 0; i < 80 && S.step !== 'editor'; i++) await sl(150); await sl(2500);
  document.querySelector('.panel .type[data-v=hbars]').click(); await sl(2000);
  // gravar uma vez e comparar o fragmentado com o convertido
  const orig = mp4Remux; let frag = null; window.mp4Remux = u => { frag = u; return orig(u); };
  const res = await recordVideo(S.piece, 'square', { cancel: false }); window.mp4Remux = orig; const fragBlob = new Blob([frag], { type: 'video/mp4' });
  out.sizes = { frag: fragBlob.size, remux: res.blob.size };
  await fetch('/save?name=remux-frag.mp4', { method: 'POST', body: fragBlob }); await fetch('/save?name=remux-out.mp4', { method: 'POST', body: res.blob });
  const mk = async b => { const v = document.createElement('video'); v.muted = true; v.preload = 'auto'; v.src = URL.createObjectURL(b); document.body.appendChild(v); v.style.cssText = 'position:fixed;left:-9999px'; await new Promise(r => { v.onloadeddata = r; v.onerror = r; setTimeout(r, 6000); }); return v; };
  const a = await mk(fragBlob), b = await mk(res.blob); out.dur = { frag: a.duration, remux: b.duration }; out.dims = [b.videoWidth, b.videoHeight]; out.err = [a.error && a.error.message, b.error && b.error.message];
  const grab = async (v, t) => { v.currentTime = t; await new Promise(r => { v.onseeked = r; setTimeout(r, 3000); }); const c = document.createElement('canvas'); c.width = 270; c.height = 270; const x = c.getContext('2d'); x.drawImage(v, 0, 0, 270, 270); return x.getImageData(0, 0, 270, 270).data; };
  out.diff = []; for (const t of [0.8, 4.2, 8.5, 12.7, 17.5, 21.5]) { const p = await grab(a, t), q = await grab(b, t); let s = 0; for (let i = 0; i < p.length; i += 4) s += Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]); out.diff.push(+(s / (p.length / 4) / 3).toFixed(2)); }
  out.errs = errs; return JSON.stringify(out, null, 1); })()
