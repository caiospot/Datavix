/* Datavix: exportação (HTML autossuficiente, PNG, ZIP por etapa). Só roda no editor. */

const decB64 = id => new TextDecoder().decode(b64bytes(b64text(id)));
const slug = s => (String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'datavix');

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- HTML interativo: um arquivo só, abre offline ---------- */
function buildExportHtml(P) {
  const data = JSON.stringify(pieceData(P))
    .replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');
  const csp = "default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval' blob:; worker-src blob:; connect-src blob: data:; style-src 'unsafe-inline'; font-src data:; img-src data: blob:";
  return '<!doctype html><html lang="' + (LANG === 'pt' ? 'pt-BR' : 'en') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(P.title) + '</title>'
    + '<meta http-equiv="Content-Security-Policy" content="' + csp + '"><style>' + decB64('splash-css') + '</style><style>' + decB64('exp-css') + '</style></head><body>' + decB64('splash-html') + '<div id="app"></div>'
    + '<script id="dv-data" type="application/json">' + data + '</script>'
    + '<script id="vz-js" type="text/plain">' + b64text('vz-js') + '</script><script id="vz-wasm" type="text/plain">' + b64text('vz-wasm') + '</script>'
    + '<script>' + decB64('exp-src') + '\n' + decB64('exp-boot') + '</script></body></html>';
}

/* ---------- PNG ---------- */
function wrapText(ctx, text, x, y, maxW, lineH, font, color) {
  ctx.font = font; ctx.fillStyle = color; ctx.textBaseline = 'top';
  const words = String(text).split(/\s+/); let line = '';
  const lines = [];
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return y + lines.length * lineH;
}

// aba em segundo plano pausa requestAnimationFrame: nunca espere quadro sem limite de tempo
const within = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);

async function renderPng(P, o = {}) {
  const sc = o.scale || 1, W = 1920 * sc, H = 1080 * sc, pad = 88 * sc;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const base = bgBase(P.bg), fg = readableOn(base), muted = mixHex(fg, base, 0.4), accent = P.colors[0];
  if (P.bg.mode === 'gradient') { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, P.bg.base); g.addColorStop(1, mixHex(P.bg.base, accent, 0.18)); ctx.fillStyle = g; } else ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  try { await document.fonts.load("700 20px 'Doto'"); await document.fonts.ready; } catch (e) { /* segue com fonte do sistema */ }
  const ft = fontsOf(P), fam = ft.body, tfam = ft.title;
  try { await document.fonts.load(`600 20px ${tfam}`); } catch (e) { /* segue */ }
  let y = pad * 0.8;
  y = wrapText(ctx, P.title, pad, y, W - 2 * pad, 66 * sc, `600 ${58 * sc}px ${tfam}`, fg) + 6 * sc;
  y = wrapText(ctx, subtitleOf(P), pad, y, W - 2 * pad, 32 * sc, `400 ${22 * sc}px ${fam}`, muted) + 20 * sc;
  if (o.caption) {
    const top = y;
    y = wrapText(ctx, o.caption, pad + 22 * sc, y, W * 0.62, 50 * sc, `500 ${38 * sc}px ${fam}`, fg);
    ctx.fillStyle = accent; ctx.fillRect(pad, top, 5 * sc, y - top);
    y += 14 * sc;
  } else if (P.insights.length && P.opts.annotations !== false) {
    const n = Math.min(3, P.insights.length), gap = 36 * sc, colW = (W - 2 * pad - gap * (n - 1)) / n;
    let bottom = y;
    P.insights.slice(0, n).forEach((ins, k) => {
      const x = pad + k * (colW + gap), e = wrapText(ctx, ins.text, x + 18 * sc, y, colW - 18 * sc, 32 * sc, `400 ${23 * sc}px ${fam}`, fg);
      ctx.fillStyle = accent; ctx.fillRect(x, y, 4 * sc, e - y); bottom = Math.max(bottom, e);
    });
    y = bottom + 14 * sc;
  }
  const footY = H - pad * 0.62, chartTop = y + 10 * sc, chartH = footY - 20 * sc - chartTop, chartW = W - 2 * pad;
  if (isCsType(P.type)) {
    const live = P.host && P.host.alt && P.host.alt._org;
    drawCsStatic(P, ctx, pad, chartTop, chartW, chartH, o.cs || (live ? live.getState() : null));
  } else if (P.type === 'calendar') {
    const lay = calLayout(P, chartW / sc, { maxCell: 36 });
    if (lay) drawShapes(ctx, lay, pad, chartTop, Math.min(sc, chartH / lay.height, chartW / lay.width), fam);
  } else if (P.type === 'kpi') {
    drawKpi(ctx, P, pad, chartTop, chartW, chartH, sc, fam);
  } else {
    // gráfico em alta resolução: instância própria, fora da tela, do tamanho exato da exportação
    let filter = o.filter || null;
    if (P.type === 'race' && !filter) { const m = makeMeta(P), last = m.xLabels[m.xLabels.length - 1]; filter = rec => rec[m.xName] === last; }
    const dpr = devicePixelRatio || 1;
    const host = document.createElement('div');
    host.style.cssText = `position:fixed;left:-99999px;top:0;width:${chartW / dpr}px;height:${chartH / dpr}px`;
    const cnv = document.createElement('canvas'); cnv.style.cssText = 'width:100%;height:100%;display:block'; host.appendChild(cnv); document.body.appendChild(host);
    let chart;
    try {
      const Vizzu = await loadVizzu();
      chart = new Vizzu({ element: cnv }); await chart.initializing;
      await within(chart.animate({ data: { ...P.built.vz, filter }, config: vzConfig(P.type, P.built, P.sort, chartOpt(P, { cumul: o.cumul })), style: vzStyle(P, { size: (21 * sc) / dpr }) }, { duration: 0 }), 4000);
      await within(new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), 400);
      ctx.drawImage(cnv, pad, chartTop, chartW, chartH);
    } finally { try { chart && chart.detach(); } catch (e) { /* ok */ } host.remove(); }
  }
  if (P.opts.notes !== false) wrapText(ctx, footOf(P), pad, footY, W - 2 * pad, 24 * sc, `400 ${16 * sc}px ${fam}`, muted);
  return new Promise(r => cv.toBlob(r, 'image/png'));
}

/* ---------- ZIP sem compressão (um arquivo por etapa) ---------- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = u8 => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zipStore(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  let off = 0;
  const u16 = (v, n) => { v.push(n & 255, (n >> 8) & 255); }, u32 = (v, n) => { v.push(n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255); };
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const lh = []; u32(lh, 0x04034b50); u16(lh, 20); u16(lh, 0x0800); u16(lh, 0); u16(lh, 0); u16(lh, 0x21); u32(lh, crc); u32(lh, size); u32(lh, size); u16(lh, name.length); u16(lh, 0);
    parts.push(new Uint8Array(lh), name, f.data);
    const ch = []; u32(ch, 0x02014b50); u16(ch, 20); u16(ch, 20); u16(ch, 0x0800); u16(ch, 0); u16(ch, 0); u16(ch, 0x21); u32(ch, crc); u32(ch, size); u32(ch, size); u16(ch, name.length); u16(ch, 0); u16(ch, 0); u16(ch, 0); u16(ch, 0); u32(ch, 0); u32(ch, off);
    central.push(new Uint8Array(ch), name);
    off += lh.length + name.length + size;
  }
  const csize = central.reduce((a, b) => a + b.length, 0), end = []; u32(end, 0x06054b50); u16(end, 0); u16(end, 0); u16(end, files.length); u16(end, files.length); u32(end, csize); u32(end, off); u16(end, 0);
  return new Blob([...parts, ...central, new Uint8Array(end)], { type: 'application/zip' });
}

/* ---------- ações do painel ---------- */
async function doExport(kind) {
  const P = S.piece, stat = $('#exstat'), say = m => { if (stat) stat.textContent = m; };
  const base = slug(P.title);
  say(T('ex_busy'));
  try {
    if (kind === 'html') {
      download(new Blob([buildExportHtml(P)], { type: 'text/html' }), `${base}.html`);
    } else if (kind === 'png' || kind === 'png2') {
      download(await renderPng(P, { scale: kind === 'png2' ? 2 : 1, filter: P.host ? P.host.ix.filterFn() : null, cumul: P.host ? P.host.ix.cumul : false }), `${base}${kind === 'png2' ? '-4k' : ''}.png`);
    } else if (kind === 'steps') {
      const meta = P.host.ix.meta, steps = buildSteps(P, meta), files = [];
      for (let i = 0; i < steps.length; i++) {
        const st = steps[i].state, blob = await renderPng(P, { filter: makeFilter(meta, st ? { sel: st.sel ? new Set(st.sel) : null, range: st.range || null } : null), caption: steps[i].caption, cs: st && st.cs });
        files.push({ name: `${base}-${String(i + 1).padStart(2, '0')}.png`, data: new Uint8Array(await blob.arrayBuffer()) });
        say(`${T('ex_busy')} ${i + 1}/${steps.length}`);
      }
      download(zipStore(files), `${base}-etapas.zip`);
    }
    say(T('ex_done')); npsTrack('exp'); npsMoment('export');
  } catch (e) { console.error(e); say(T('ex_fail', e && e.message || e)); }
}
