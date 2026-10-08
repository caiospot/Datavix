/* Datavix: vídeo para redes sociais (MP4, sem áudio). Tudo no navegador: uma composição em canvas (1080×1920 ou 1080×1080) é gravada em
 * tempo real com MediaRecorder. Todos os gráficos animam: o Vizzu numa instância própria fora da tela, os gráficos de canvas com o motor da tela conduzido
 * quadro a quadro (entrada e transições entre passos), calendário e indicadores com entrada própria. Os números vêm sempre dos cálculos da peça. */
const VID_FMT = {
  // vertical: o gráfico ocupa quase toda a largura e a maior parte da altura; topo e pé ficam livres para a interface das redes (logo ~110 px, barra de progresso depois do gráfico)
  vertical: { w: 1080, h: 1920, logoY: 112, headY: 185, headH: 470, chart: { x: 30, y: 660, w: 1020, h: 990 }, progY: 1700, head: [72, 60, 50], sub: 36, calc: 28, k: 2, tk: 1.15 },
  square: { w: 1080, h: 1080, logoY: 62, headY: 120, headH: 250, chart: { x: 30, y: 392, w: 1020, h: 612 }, progY: 1038, head: [50, 42, 36], sub: 28, calc: 23, k: 1.8, tk: 1.1 },
};
const VID_SITE = (window.__DV && window.__DV.site) || 'caiospot.github.io/Datavix';
const VID_FPS = 30;
const vEase = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
const vClamp = (a, lo, hi) => Math.max(lo, Math.min(hi, a));

// formato de gravação: MP4 (H.264) quando o navegador grava; senão WebM
function videoMime() {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
  for (const t of ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']) if (MediaRecorder.isTypeSupported(t)) return t;
  return null;
}

/* ---- texto em canvas ---- */
function vLines(ctx, text, maxW, font) {
  ctx.font = font; const words = String(text).split(/\s+/), out = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
  if (line) out.push(line); return out;
}
// escolhe o maior corpo de letra da lista em que o texto cabe em `maxLines`
function vFit(ctx, text, maxW, fam, weight, sizes, maxLines) {
  for (const s of sizes) { const l = vLines(ctx, text, maxW, `${weight} ${s}px ${fam}`); if (l.length <= maxLines) return { size: s, lines: l }; }
  const s = sizes[sizes.length - 1]; return { size: s, lines: vLines(ctx, text, maxW, `${weight} ${s}px ${fam}`).slice(0, maxLines) };
}
function vDrawLines(ctx, lines, x, y, lh, font, color) { ctx.font = font; ctx.fillStyle = color; ctx.textBaseline = 'top'; lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh)); return y + lines.length * lh; }
function vLogo(ctx, cx, y, size, color) {
  const word = 'DATAVIX', gap = size * 0.3, sq = size * 0.72; ctx.font = `500 ${size}px 'Geist Mono', ui-monospace, monospace`; ctx.textBaseline = 'middle';
  const ws = [...word].map(c => ctx.measureText(c).width), total = sq + size * 0.5 + ws.reduce((a, b) => a + b, 0) + gap * (word.length - 1); let x = cx - total / 2;
  ctx.fillStyle = '#d4ff00'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y - sq / 2, sq, sq, sq * 0.16) : ctx.rect(x, y - sq / 2, sq, sq); ctx.fill(); x += sq + size * 0.5;
  ctx.fillStyle = color; [...word].forEach((c, i) => { ctx.fillText(c, x, y); x += ws[i] + gap; });
}

/* ---- plano: quais cenas entram e quanto dura cada uma ---- */
function videoPlan(P, fmt) {
  const meta = P.host.ix.meta, base = buildSteps(P, meta), isIns = s => /^i\d/.test(s.id), sq = fmt === 'square';
  let hero = null, ov = null; try { hero = kpiCards(P.built, LANG, T)[0] || null; ov = genOverview(P); } catch (e) { /* sem indicador */ }
  let story = []; try { story = P.sb ? storyFromAnswers(P, meta, base) : buildStory(P, meta, base); } catch (e) { console.error(e); }
  const scenes = [{ kind: 'hook', ms: 2700 }], SLx = STORY_TXT[LANG] || STORY_TXT.pt;
  const listOf = s => (s.type === 'prio' ? s.rank.map(r => `${r.n}. ${r.k}, ${r.v}${r.s ? ' (' + r.s + ')' : ''}`) : s.type === 'impl' ? s.lines : s.type === 'plan' ? s.rows.map(r => [r.a, r.o, r.d].filter(Boolean).join(' · ')) : s.type === 'diag' ? (s.chips || []).map(c => `${c.text} ${c.label}`) : null);
  // roteiro guiado: o vídeo mostra até 5 atos; ficam o panorama, o centro, o diagnóstico, as prioridades e a decisão, e o resto preenche pela ordem
  const pickV = arr => { if (arr.length <= 5) return arr; const must = new Set([0, 1]); arr.forEach((s, i) => { if (s.type === 'diag' || s.type === 'prio' || s.type === 'ask') must.add(i); }); const keep = new Set([...must].slice(0, 5)); for (let i = 0; i < arr.length && keep.size < 5; i++) keep.add(i); return arr.filter((s, i) => keep.has(i)); };
  if (story.length >= 3) (P.sb ? pickV(story) : story.slice(0, 4)).forEach(s => { const ls = listOf(s); scenes.push({ kind: 'step', ms: s.calc || ls ? 3600 : 2800, kick: s.kick.label, head: s.type === 'impl' || s.type === 'plan' ? s.kick.label : s.head, sub: '', calc: ls ? null : s.calc, list: ls, state: s.state, viz: s.viz || null }); });
  else {
    const cut = c => { const p = c.split(' · '); return [p[0], p.slice(1).join(' · ')]; };
    const seg = base.filter(s => s.id !== 'overview' && s.id !== 'end' && !isIns(s) && s.caption).slice(0, 2), ins = base.filter(isIns).slice(0, 2);
    scenes.push({ kind: 'step', ms: 2500, head: T('pres_overview'), sub: hero ? hero.sub : '', state: null });
    seg.forEach(s => { const [h, sub] = cut(s.caption); scenes.push({ kind: 'step', ms: 2500, head: h, sub, state: s.state }); });
    ins.forEach(s => scenes.push({ kind: 'step', ms: 3500, head: s.caption, sub: '', calc: s.calc, state: s.state }));
  }
  const sumLine = x => (x.type === 'prio' ? `${x.head}: ${x.rank.map(r => r.k).join(', ')}` : x.type === 'plan' ? x.rows.map(r => r.a).join(' · ') : x.head);
  const lines = (story.length >= 3 ? (P.sb ? story.filter(x => x.id !== 'st-ov').slice(-4) : story.slice(1)).map(sumLine) : (P.insights || []).map(x => x.text)).slice(0, sq ? 2 : 4);
  scenes.push({ kind: 'summary', ms: 3000, lines, facts: ov && ov.left ? ov.left.slice(0, 4) : [] }, { kind: 'brand', ms: 2600 });
  let t = 0; scenes.forEach(s => { s.t0 = t; t += s.ms; s.t1 = t; }); scenes.total = t;
  const stepsOnly = scenes.filter(s => s.kind === 'step');
  return { scenes, hero, meta, firstStep: stepsOnly[0], lastStep: stepsOnly[stepsOnly.length - 1] };
}

/* ---- camada do gráfico: tudo que desenha dentro do retângulo do gráfico, ao vivo ----
 * { cnv, go(state, first), frame(ms), destroy() }. `cnv` é o quadro do gráfico (tamanho do retângulo), `go` é chamado no começo de cada cena de passo
 * (first = primeira vez: entrada animada), `frame` avança o relógio do gráfico a cada quadro da gravação. */
function videoEngineLayer(P, box, k, tk) {
  const cv = document.createElement('canvas'); cv.width = box.w; cv.height = box.h; const ctx = cv.getContext('2d');
  const eng = csEngine(P, { rm: false }); if (!eng) return null;
  eng.stop(); eng.start = () => {}; // quem avança o motor é a gravação, não o relógio da tela
  eng.ctx = csScaleFont(ctx, { textK: tk || 1 }); eng.resize(box.w / k, box.h / k, k); // tela virtual grande (gráfico grande) e só o texto ampliado
  let on = false, enter = false;
  return {
    cnv: cv,
    go(st, first) { const cs = st && st.cs ? st.cs : null; if (P.type !== 'organism' || cs) eng.setState(cs); if (first || !on) { on = true; enter = true; } },
    frame(ms) { if (!on) return; const dt = Math.min(0.05, Math.max(0, ms / 1000)); (eng.step_ || eng.step).call(eng, enter ? dt * 1.7 : dt); if (enter && eng.grow >= 1) enter = false; eng.render(); },
    destroy() { eng.stop(); },
  };
}
// calendário: as semanas aparecem em onda, da esquerda para a direita
function videoCalLayer(P, box, fam) {
  const cv = document.createElement('canvas'); cv.width = box.w; cv.height = box.h; const ctx = cv.getContext('2d'), k = 2, w = box.w / k, h = box.h / k;
  const lay = calLayout(P, w, { maxCell: 36 }); let age = -1;
  const s = lay ? Math.min(1, h / lay.height, w / lay.width) : 1, ox = lay ? (w - lay.width * s) / 2 : 0, oy = lay ? (h - lay.height * s) / 2 : 0;
  return {
    cnv: cv, go() { if (age < 0) age = 0; },
    frame(ms) {
      if (age < 0 || !lay) return; age += ms; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.scale(k, k); ctx.textBaseline = 'top';
      for (const sh of lay.shapes) {
        const e = sh.k === 'rect' ? vEase((age - sh.wk * 26) / 520) : vEase(age / 500); if (e <= 0) continue;
        ctx.globalAlpha = e; ctx.fillStyle = sh.fill;
        if (sh.k === 'rect') { const cx = ox + (sh.x + sh.w / 2) * s, cy = oy + (sh.y + sh.h / 2) * s, ww = sh.w * s * (0.55 + 0.45 * e), hh = sh.h * s * (0.55 + 0.45 * e); fillRound(ctx, cx - ww / 2, cy - hh / 2, ww, hh, sh.rx * s); }
        else { ctx.font = `${sh.w || 400} ${sh.size * s}px ${fam}`; ctx.fillText(sh.t, ox + sh.x * s, oy + sh.y * s); }
      }
      ctx.globalAlpha = 1;
    },
    destroy() {},
  };
}
// cartões de KPI em grade 2×2 (o desenho do PNG é largo demais para o vídeo vertical); entram em sequência e os números sobem
function videoKpiLayer(P, box, fam) {
  const cv = document.createElement('canvas'); cv.width = box.w; cv.height = box.h; const ctx = cv.getContext('2d'); let age = -1;
  return { cnv: cv, go() { if (age < 0) age = 0; }, frame(ms) { if (age < 0) return; age += ms; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); videoKpi(ctx, P, box.w, box.h, fam, age); }, destroy() {} };
}
function videoKpi(ctx, P, W, H, fam, age = 1e9) {
  let cards = []; try { cards = kpiCards(P.built, LANG, T).slice(0, 4); } catch (e) { return; }
  const base = bgBase(P.bg), fg = readableOn(base), muted = mixHex(fg, base, 0.45), acc = P.colors[0], g = 26, cw = (W - g) / 2, ch = Math.min(470, (H - g) / 2), u = ch / 380;
  cards.forEach((c, i) => {
    const e = vEase((age - i * 170) / 650); if (e <= 0) return;
    const x = (i % 2) * (cw + g), y = Math.floor(i / 2) * (ch + g) + (1 - e) * 34; ctx.save(); ctx.globalAlpha = e;
    ctx.fillStyle = fg + '0d'; ctx.strokeStyle = fg + '33'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, cw, ch, 22) : ctx.rect(x, y, cw, ch); ctx.fill(); ctx.stroke();
    ctx.textBaseline = 'top'; ctx.fillStyle = muted; ctx.font = `500 ${Math.round(24 * u)}px 'Geist Mono', ui-monospace, monospace`;
    vLines(ctx, String(c.label).toUpperCase(), cw - 44, ctx.font).slice(0, 2).forEach((l, k) => ctx.fillText(l, x + 22, y + 22 + k * 28 * u));
    const fin = kpiFmt(c), q = numParts(fin), cnt = vEase((age - i * 170 - 150) / 1300), txt = cnt >= 1 || !q ? fin : numFrame(q, cnt);
    let fs = Math.round(104 * u); ctx.font = `700 ${fs}px Doto, 'Geist Mono', monospace`; while (ctx.measureText(fin).width > cw - 44 && fs > 40) { fs -= 6; ctx.font = `700 ${fs}px Doto, 'Geist Mono', monospace`; }
    ctx.fillStyle = acc; ctx.textBaseline = 'alphabetic'; ctx.fillText(txt, x + 22, y + ch * 0.62);
    if (c.sub) { ctx.textBaseline = 'top'; ctx.fillStyle = fg; ctx.globalAlpha = e * .75; ctx.font = `400 ${Math.round(24 * u)}px ${fam}`; vLines(ctx, c.sub, cw - 44, ctx.font).slice(0, 2).forEach((l, k) => ctx.fillText(l, x + 22, y + ch * 0.68 + k * 28 * u)); }
    ctx.restore();
  });
}

// instância própria do Vizzu, fora da tela, no tamanho da gravação (DPR 2 forçado só enquanto ela existe)
async function videoVizzu(P, box, meta) {
  const dprDesc = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => 2 });
  const host = document.createElement('div'); host.style.cssText = `position:fixed;left:0;top:0;z-index:-1;opacity:0;pointer-events:none;width:${box.w / 2}px;height:${box.h / 2}px`; // dentro da viewport (o Vizzu não anima fora dela), mas invisível
  const cnv = document.createElement('canvas'); cnv.style.cssText = 'width:100%;height:100%;display:block'; host.appendChild(cnv); document.body.appendChild(host);
  const filt = st => (P.type === 'race' ? (() => { const last = meta.xLabels[meta.xLabels.length - 1]; return rec => rec[meta.xName] === last; })() : makeFilter(meta, st ? { sel: st.sel ? new Set(st.sel) : null, range: st.range || null } : null));
  const full = st => ({ data: { ...P.built.vz, filter: filt(st) }, config: vzConfig(P.type, P.built, P.sort, chartOpt(P, { cumul: false })), style: vzStyle(P, { size: 16 }) });
  let chart;
  try {
    const Vizzu = await loadVizzu(); chart = new Vizzu({ element: cnv }); await chart.initializing;
    chart.feature('tooltip', false);
    await within(new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), 500);
  } catch (e) { try { chart && chart.detach(); } catch (x) { /* ok */ } host.remove(); if (dprDesc) Object.defineProperty(window, 'devicePixelRatio', dprDesc); throw e; }
  return {
    cnv, chart,
    // primeira cena: o gráfico nasce (barras crescem, linhas se desenham) em vez de aparecer pronto
    first: st => {
      try { chart.animate(full(st), { duration: 1.7, easing: 'cubic-bezier(.25,.8,.25,1)' }).catch(() => {}); } catch (e) { /* segue */ }
    },
    go: st => { try { chart.animate({ data: { filter: filt(st) } }, { duration: 0.9, easing: 'cubic-bezier(.4,0,.2,1)' }).catch(() => {}); } catch (e) { /* segue */ } },
    destroy() { try { chart.detach(); } catch (e) { /* ok */ } host.remove(); if (dprDesc) Object.defineProperty(window, 'devicePixelRatio', dprDesc); window.dispatchEvent(new Event('resize')); },
  };
}
async function videoVizzuLayer(P, box, meta) {
  const v = await videoVizzu(P, box, meta); let started = false;
  return { cnv: v.cnv, go(st, first) { if (!started) { started = true; v.first(st); } else v.go(st); }, frame() {}, destroy: () => v.destroy() };
}
async function videoChartLayer(P, box, fmt, meta, fam) {
  const k = VID_FMT[fmt].k;
  // nuvem de palavras: o texto maior não cabe nas margens fixas do motor
  if (isCsType(P.type)) { const l = videoEngineLayer(P, box, k, ['words'].includes(P.type) ? 1 : VID_FMT[fmt].tk); if (l) return l; }
  if (P.type === 'calendar') return videoCalLayer(P, box, fam);
  if (P.type === 'kpi') return videoKpiLayer(P, box, fam);
  return videoVizzuLayer(P, box, meta);
}

/* ---- quadro da composição ---- */
function videoRender(P, fmt, plan, th, prep) {
  const F = VID_FMT[fmt], cv = prep.cv, ctx = prep.ctx, W = F.w, H = F.h, fam = th.fam, tfam = th.tfam, tw = th.tw, M = 60;
  const bgDraw = t => {
    if (P.bg.mode === 'gradient') { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, P.bg.base); g.addColorStop(1, mixHex(P.bg.base, th.accent, 0.18)); ctx.fillStyle = g; } else ctx.fillStyle = th.base;
    ctx.fillRect(0, 0, W, H);
    const dx = Math.sin(t / 5200) * W * 0.08, dy = Math.cos(t / 6400) * H * 0.04;
    const g1 = ctx.createRadialGradient(W * 0.78 + dx, H * 0.26 + dy, 0, W * 0.78 + dx, H * 0.26 + dy, W * 0.75); g1.addColorStop(0, th.accent + '38'); g1.addColorStop(1, th.accent + '00'); ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(W * 0.2 - dx, H * 0.84 - dy, 0, W * 0.2 - dx, H * 0.84 - dy, W * 0.6); g2.addColorStop(0, th.accent + '1f'); g2.addColorStop(1, th.accent + '00'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
  };
  const sceneAt = t => { for (let i = 0; i < plan.scenes.length; i++) if (t < plan.scenes[i].t1) return i; return plan.scenes.length - 1; };
  // barras dos atos de casos, desenhadas no lugar do gráfico
  const drawViz = (v, lt, alpha) => {
    const c = F.chart, rows = v.rows.slice(0, 7), fs = fmt === 'square' ? 24 : 34, rh = Math.min(fmt === 'square' ? 62 : 124, (c.h - 90) / Math.max(1, rows.length)), kw = c.w * 0.34, vw = 180, bx = c.x + kw + 14, bw = c.w - kw - vw - 28;
    ctx.save(); ctx.textBaseline = 'middle';
    ctx.globalAlpha = alpha; ctx.font = `500 ${fs - 6}px 'Geist Mono', ui-monospace, monospace`; ctx.fillStyle = th.muted; ctx.fillText(String(v.title).toUpperCase().slice(0, 44), c.x, c.y + 14);
    rows.forEach((r, k) => {
      const e = vEase((lt - 250 - k * 120) / 600), y = c.y + 60 + k * rh + rh / 2; ctx.globalAlpha = alpha * Math.min(1, e * 2);
      ctx.font = `500 ${fs}px ${fam}`; ctx.fillStyle = th.fg; const k0 = String(r.ks || r.k); let kt = k0; while (kt.length > 4 && ctx.measureText(kt).width > kw) kt = kt.slice(0, -2); ctx.fillText(kt === k0 ? kt : kt.trimEnd() + '…', c.x, y);
      ctx.fillStyle = th.muted; ctx.globalAlpha = alpha * Math.min(1, e * 2) * 0.35; ctx.fillRect(bx, y - 15, bw, 30);
      ctx.globalAlpha = alpha * Math.min(1, e * 2); ctx.fillStyle = r.hi === false ? th.muted : th.accent; ctx.fillRect(bx, y - 15, bw * Math.max(0.015, Math.min(1, r.p / 100)) * e, 30);
      if (v.ref) { ctx.fillStyle = th.fg; ctx.fillRect(bx + bw * Math.min(1, v.ref.p / 100) - 1, y - 18, 3, 36); }
      ctx.textAlign = 'right'; ctx.font = `700 ${fs + 2}px ${fam}`; ctx.fillStyle = th.fg; ctx.fillText(r.t, c.x + c.w, y); ctx.textAlign = 'left';
    });
    ctx.restore();
  };
  const drawChart = (t, i) => {
    const sc = plan.scenes[i], prev = plan.scenes[i - 1], lt = t - sc.t0; let a = 0;
    if (sc.kind === 'step') a = prev && prev.kind === 'hook' ? vEase(lt / 450) : 1;
    else if (sc.kind === 'summary') a = 0.12;
    if (a <= 0.01) return;
    if (sc.kind === 'step' && sc.viz) { drawViz(sc.viz, lt, a); return; }
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(prep.layer.cnv, F.chart.x, F.chart.y, F.chart.w, F.chart.h); ctx.restore();
  };
  const textBlock = (sc, lt, alpha) => {
    const e = vEase(lt / 550), sq = fmt === 'square', y0 = F.headY + (1 - e) * 36; ctx.save(); ctx.globalAlpha = alpha * e;
    const maxW = W - 2 * M; let top = y0;
    if (sc.kick) { ctx.font = `500 ${sq ? 24 : 30}px 'Geist Mono', ui-monospace, monospace`; ctx.fillStyle = th.accent; ctx.textBaseline = 'top'; ctx.fillText(String(sc.kick).toUpperCase().split('').join(sq ? '' : ''), M, top); top += sq ? 34 : 46; }
    const f = vFit(ctx, sc.head, maxW, tfam, tw, sq && (sc.calc || sc.list) ? [42, 37, 32] : F.head, sc.list || (sq && sc.calc) ? 2 : 3);
    let y = vDrawLines(ctx, f.lines, M, top, f.size * 1.08, `${tw} ${f.size}px ${tfam}`, th.fg);
    ctx.fillStyle = th.accent; ctx.fillRect(M - 28, top + 6, 8, f.lines.length * f.size * 1.08 - 12);
    if (sc.sub) { y += 14; y = vDrawLines(ctx, vLines(ctx, sc.sub, maxW, `400 ${F.sub}px 'Geist Mono', ui-monospace, monospace`).slice(0, 2), M, y, F.sub * 1.3, `400 ${F.sub}px 'Geist Mono', ui-monospace, monospace`, th.muted); }
    if (sc.list && sc.list.length) {
      y += sq ? 8 : 16; ctx.globalAlpha = alpha * vEase((lt - 250) / 500); const lf = `500 ${sq ? 25 : 33}px ${fam}`, lh = (sq ? 25 : 33) * 1.25;
      sc.list.slice(0, sq ? 3 : 4).forEach(t => { const ls = vLines(ctx, t, maxW - 30, lf).slice(0, sq ? 1 : 2); ctx.fillStyle = th.accent; ctx.fillRect(M, y + 4, 6, ls.length * lh - 8); y = vDrawLines(ctx, ls, M + 24, y, lh, lf, th.fg) + 8; });
    } else if (sc.calc) {
      y += sq ? 8 : 18; const c = sc.calc, cf = `400 ${F.calc}px ${fam}`; ctx.globalAlpha = alpha * vEase((lt - 350) / 500);
      y = vDrawLines(ctx, vLines(ctx, c.formula, maxW, cf).slice(0, sq ? 1 : 2), M, y, F.calc * 1.35, cf, th.muted);
      (c.rows || []).slice(0, 2).forEach(r => { y += 4; ctx.font = `600 ${F.calc}px ${fam}`; ctx.fillStyle = th.fg; const vw = ctx.measureText(`${r.v}`).width; let kt = `${r.k}`; while (kt.length > 6 && ctx.measureText(kt).width > W - 2 * M - vw - 24) kt = kt.slice(0, -2); ctx.fillText(kt === `${r.k}` ? kt : kt.trimEnd() + '…', M, y); ctx.fillText(`${r.v}`, W - M - vw, y); ctx.fillStyle = th.muted; ctx.fillRect(M, y + F.calc * 1.3, W - 2 * M, 1); y += F.calc * 1.55; });
    }
    ctx.restore();
  };
  const hookScene = (sc, lt, alpha) => {
    ctx.save(); ctx.globalAlpha = alpha; const maxW = W - 2 * M, e = vEase(lt / 600), sq = fmt === 'square';
    const f = vFit(ctx, titleOf(P), maxW, tfam, tw, sq ? [62, 52, 44] : [84, 70, 58, 48], sq ? 2 : 3);
    ctx.globalAlpha = alpha * e; vDrawLines(ctx, f.lines, M, F.headY + (1 - e) * 40, f.size * 1.05, `${tw} ${f.size}px ${tfam}`, th.fg);
    if (plan.hero) {
      const k = vEase((lt - 350) / 1900), fin = kpiFmt(plan.hero), q = numParts(fin), txt = k >= 1 || !q ? fin : numFrame(q, k);
      const fs = sq ? 190 : 250, y = sq ? 560 : 900; ctx.globalAlpha = alpha * vEase((lt - 200) / 400); ctx.font = `700 ${fs}px Doto, 'Geist Mono', monospace`; ctx.textBaseline = 'alphabetic';
      let fz = fs; while (ctx.measureText(txt).width > maxW && fz > 80) { fz -= 8; ctx.font = `700 ${fz}px Doto, 'Geist Mono', monospace`; }
      ctx.fillStyle = th.accent; ctx.fillText(txt, M, y);
      ctx.font = `500 ${sq ? 30 : 38}px 'Geist Mono', ui-monospace, monospace`; ctx.fillStyle = th.muted; ctx.textBaseline = 'top'; ctx.fillText(String(plan.hero.label).toUpperCase(), M, y + 28);
      if (plan.hero.sub) { ctx.font = `400 ${sq ? 28 : 34}px ${fam}`; ctx.fillText(plan.hero.sub, M, y + (sq ? 76 : 88)); }
    }
    ctx.restore();
  };
  const summaryScene = (sc, lt, alpha) => {
    ctx.save(); const maxW = W - 2 * M - 40, e = vEase(lt / 500); ctx.globalAlpha = alpha * e; ctx.textBaseline = 'top';
    ctx.font = `500 ${fmt === 'square' ? 28 : 34}px 'Geist Mono', ui-monospace, monospace`; ctx.fillStyle = th.muted; ctx.fillText(`[ ${T('pres_outro').toUpperCase()} ]`, M, F.headY);
    let y = F.headY + (fmt === 'square' ? 56 : 80); const fsz = fmt === 'square' ? [36, 32] : [48, 42, 36];
    if (sc.lines.length) sc.lines.forEach((tx, k) => { ctx.globalAlpha = alpha * vEase((lt - 250 - k * 260) / 500); const f = vFit(ctx, tx, maxW, fam, 500, fsz, fmt === 'square' ? 3 : 4), h = f.lines.length * f.size * 1.25; ctx.fillStyle = th.accent; ctx.fillRect(M, y + 4, 8, h - 8); vDrawLines(ctx, f.lines, M + 32, y, f.size * 1.25, `500 ${f.size}px ${fam}`, th.fg); y += h + (fmt === 'square' ? 24 : 40); });
    else sc.facts.forEach(([k, v], n) => { ctx.globalAlpha = alpha * vEase((lt - 250 - n * 220) / 500); ctx.font = `500 ${fmt === 'square' ? 24 : 30}px 'Geist Mono', ui-monospace, monospace`; ctx.fillStyle = th.muted; ctx.fillText(String(k).toUpperCase(), M, y); ctx.font = `600 ${fmt === 'square' ? 42 : 56}px ${fam}`; ctx.fillStyle = th.fg; ctx.fillText(String(v), M, y + 40); y += fmt === 'square' ? 96 : 128; });
    ctx.restore();
  };
  const brandScene = (sc, lt, alpha) => {
    ctx.save(); const e = vEase(lt / 700), cy = H * (fmt === 'square' ? 0.44 : 0.42); ctx.globalAlpha = alpha * e; ctx.translate(0, (1 - e) * 30);
    vLogo(ctx, W / 2, cy, fmt === 'square' ? 84 : 112, th.fg);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.globalAlpha = alpha * vEase((lt - 350) / 600); ctx.font = `600 ${fmt === 'square' ? 46 : 64}px ${tfam}`; ctx.fillStyle = th.fg;
    ctx.fillText(LANG === 'pt' ? 'Tudo vira dado.' : 'Everything becomes data.', W / 2, cy + (fmt === 'square' ? 90 : 120));
    ctx.globalAlpha = alpha * vEase((lt - 800) / 600); ctx.font = `500 ${fmt === 'square' ? 30 : 38}px 'Geist Mono', ui-monospace, monospace`; ctx.fillStyle = th.accent; ctx.fillText(VID_SITE, W / 2, cy + (fmt === 'square' ? 168 : 218));
    ctx.restore();
  };
  return t => {
    bgDraw(t); const i = sceneAt(t), sc = plan.scenes[i], lt = t - sc.t0, ov = 380, prev = plan.scenes[i - 1];
    drawChart(t, i);
    const draw = (s, l, a) => { if (s.kind === 'hook') hookScene(s, l, a); else if (s.kind === 'step') textBlock(s, l, a); else if (s.kind === 'summary') summaryScene(s, l, a); else brandScene(s, l, a); };
    if (prev && lt < 200 && prev.kind !== 'brand') draw(prev, prev.ms, 1 - vEase(lt / 200)); // a cena anterior sai rápido
    draw(sc, prev && prev.kind !== 'hook' && sc.kind !== 'brand' ? Math.max(0, lt - 160) : lt, 1); // e a nova entra logo depois, sem sobrepor os textos
    if (sc.kind !== 'brand') vLogo(ctx, W / 2, F.logoY, fmt === 'square' ? 30 : 38, th.fg); // logotipo centralizado no topo (na cena final ele é o grande, no centro)
    if (sc.kind !== 'brand') { const pw = W - 2 * M; ctx.fillStyle = th.fg + '26'; ctx.fillRect(M, F.progY, pw, 6); ctx.fillStyle = th.accent; ctx.fillRect(M, F.progY, pw * vClamp(t / plan.scenes.total, 0, 1), 6); }
  };
}

/* ---- gravação ---- */
// prepara tudo que a gravação (ou um teste de quadros) precisa: plano, tema, camada do gráfico e o desenho de cada instante
async function videoPrepare(P, fmt) {
  const F = VID_FMT[fmt], plan = videoPlan(P, fmt), ft = fontsOf(P);
  await fontEnsure(ft.fams); await Promise.all([`${ft.tw} 40px ${ft.title}`, `400 30px ${ft.body}`, `500 30px 'Geist Mono'`, `700 40px 'Doto'`].map(f => document.fonts.load(f).catch(() => 0)));
  const base = bgBase(P.bg), fg = readableOn(base), th = { base, fg, muted: mixHex(fg, base, 0.4), accent: P.colors[0].length === 7 ? P.colors[0] : '#d4ff00', fam: ft.body, tfam: ft.title, tw: ft.tw };
  const cv = document.createElement('canvas'); cv.width = F.w; cv.height = F.h; const ctx = cv.getContext('2d'), prep = { cv, ctx, layer: null };
  prep.layer = await videoChartLayer(P, F.chart, fmt, plan.meta, ft.body);
  return { F, plan, th, prep, cv, draw: videoRender(P, fmt, plan, th, prep), destroy: () => { if (prep.layer) prep.layer.destroy(); } };
}
// st: { cancel } ; onFrame(canvas, t, total) ; devolve { blob, mime, ext }
async function recordVideo(P, fmt, st, hooks = {}) {
  const mime = videoMime(); if (!mime) throw new Error(T('vid_unsupported'));
  const V = await videoPrepare(P, fmt), { plan, prep, cv, draw } = V;
  if (hooks.onFrame) hooks.onFrame(cv, 0, plan.scenes.total);
  draw(0);
  const stream = cv.captureStream(VID_FPS), rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6 }), chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise(r => { rec.onstop = r; });
  let wl = null; try { if (navigator.wakeLock) wl = await navigator.wakeLock.request('screen'); } catch (e) { /* sem bloqueio de tela */ }
  try {
    rec.start(250); const t0 = performance.now(); let vi = -1, last = 0, started = false;
    await new Promise(res => {
      const tick = () => {
        if (st.cancel) return res();
        const t = performance.now() - t0, i = plan.scenes.findIndex(s => t < s.t1);
        if (i !== vi && i >= 0) { vi = i; const s = plan.scenes[i]; if (s.kind === 'step') { prep.layer.go(s.state, !started); started = true; } }
        prep.layer.frame(t - last); last = t;
        draw(Math.min(t, plan.scenes.total - 1));
        if (hooks.onFrame) hooks.onFrame(cv, t, plan.scenes.total);
        if (t >= plan.scenes.total) return res();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await new Promise(r => setTimeout(r, 250));
    if (rec.state !== 'inactive') rec.stop(); await stopped;
  } finally { stream.getTracks().forEach(x => x.stop()); V.destroy(); if (wl) wl.release().catch(() => {}); }
  if (st.cancel) return null;
  const mp4 = /mp4/.test(mime); let blob = new Blob(chunks, { type: mp4 ? 'video/mp4' : 'video/webm' });
  if (mp4) { try { const u8 = mp4Remux(await blob.arrayBuffer()); if (u8) blob = new Blob([u8], { type: 'video/mp4' }); } catch (e) { console.error(e); /* sem conversão: segue com o arquivo original */ } }
  return { blob, mime, ext: mp4 ? 'mp4' : 'webm', seconds: Math.round(plan.scenes.total / 1000) };
}

/* ---- janela ---- */
async function openVideoDialog() {
  const P = S.piece; if (!P || !P.host) return;
  const mime = videoMime(), st = { cancel: false }, isMp4 = mime && /mp4/.test(mime);
  let fmt = 'vertical', url = null, result = null;
  const secs = () => { try { return Math.round(videoPlan(P, fmt).scenes.total / 1000); } catch (e) { return 20; } };
  const pick = (m, f) => { fmt = f; m.querySelectorAll('.vd-fmt').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === f))); const s = m.querySelector('#vd-secs'); if (s) s.textContent = T('vid_len', secs()); };
  const choose = m => {
    const b = m.querySelector('.mdl-b'); b.innerHTML = `<p class="note vd-warn">${esc(T('vid_warn'))}</p>
      <div class="vd-fmts" role="group" aria-label="${esc(T('vid_format'))}"><button type="button" class="vd-fmt" data-f="vertical" aria-pressed="true"><i class="vd-ico v"></i><strong>9:16</strong><small>${esc(T('vid_vertical'))}</small></button><button type="button" class="vd-fmt" data-f="square" aria-pressed="false"><i class="vd-ico s"></i><strong>1:1</strong><small>${esc(T('vid_square'))}</small></button></div>
      <p class="note" id="vd-secs" style="margin:10px 0 0">${esc(T('vid_len', secs()))}</p><p class="note" style="margin:4px 0 0">${esc(mime ? T(isMp4 ? 'vid_fmt_mp4' : 'vid_fmt_webm') : T('vid_unsupported'))}</p>
      <p class="note" style="margin:4px 0 0">${esc(T('vid_keep'))}</p>
      <div class="mdl-a" style="padding:14px 0 18px"><button type="button" class="btn ghost" data-vd="close">${esc(T('vid_cancel'))}</button><button type="button" class="btn" data-vd="go" ${mime ? '' : 'disabled'}>● ${esc(T('vid_go'))}</button></div>`;
    pick(m, fmt);
  };
  const run = async (m, done) => {
    st.cancel = false; const b = m.querySelector('.mdl-b'), F = VID_FMT[fmt];
    b.innerHTML = `<div class="vd-stage ${fmt}"><canvas class="vd-live" width="${F.w}" height="${F.h}"></canvas></div><div class="vd-prog"><i id="vd-bar"></i></div><p class="note" id="vd-stat" role="status" style="margin:8px 0 0">${esc(T('vid_rec'))}</p>
      <div class="mdl-a" style="padding:12px 0 18px"><button type="button" class="btn ghost" data-vd="abort">${esc(T('vid_cancel'))}</button></div>`;
    const live = b.querySelector('.vd-live').getContext('2d'), bar = b.querySelector('#vd-bar'), stat = b.querySelector('#vd-stat');
    try {
      result = await recordVideo(P, fmt, st, { onFrame: (cv, t, total) => { live.drawImage(cv, 0, 0); bar.style.width = Math.min(100, (t / total) * 100) + '%'; stat.textContent = `${T('vid_rec')} ${Math.min(Math.round(t / 1000), Math.round(total / 1000))}/${Math.round(total / 1000)} s`; } });
    } catch (e) { console.error(e); b.innerHTML = `<p class="note vd-warn">${esc(T('vid_fail', (e && e.message) || e))}</p><div class="mdl-a" style="padding:12px 0 18px"><button type="button" class="btn ghost" data-vd="close">${esc(T('nps_close'))}</button><button type="button" class="btn" data-vd="back">${esc(T('vid_again'))}</button></div>`; return; }
    if (!result) return; // cancelado
    url = URL.createObjectURL(result.blob); const name = `${slug(titleOf(P))}-${fmt === 'square' ? '1x1' : '9x16'}.${result.ext}`, mb = (result.blob.size / 1048576).toFixed(1);
    const canShare = navigator.canShare && navigator.share && (() => { try { return navigator.canShare({ files: [new File([result.blob], name, { type: result.blob.type })] }); } catch (e) { return false; } })();
    b.innerHTML = `<div class="vd-stage ${fmt}"><video class="vd-video" src="${url}" controls autoplay loop muted playsinline></video></div><p class="note" style="margin:8px 0 0">${esc(`${result.ext.toUpperCase()} · ${mb} MB · ${result.seconds} s`)}${result.ext === 'webm' ? ' · ' + esc(T('vid_webm_note')) : ''}</p>
      <div class="mdl-a" style="padding:12px 0 18px"><button type="button" class="btn ghost" data-vd="back">${esc(T('vid_again'))}</button>${canShare ? `<button type="button" class="btn ghost" data-vd="share">${esc(T('vid_share'))}</button>` : ''}<button type="button" class="btn" data-vd="dl">⤓ ${esc(T('vid_dl'))}</button></div>`;
    npsTrack('exp'); npsMoment('export');
    m._vd = { name, canShare };
  };
  await modal({
    title: T('vid_h'), body: '', actions: [],
    onOpen: (m, done) => {
      choose(m);
      m.addEventListener('click', async e => {
        const f = e.target.closest('.vd-fmt'); if (f) { pick(m, f.dataset.f); return; }
        const a = e.target.closest('[data-vd]'); if (!a) return;
        if (a.dataset.vd === 'close') done(null);
        else if (a.dataset.vd === 'go') run(m, done);
        else if (a.dataset.vd === 'abort') { st.cancel = true; choose(m); }
        else if (a.dataset.vd === 'back') { if (url) { URL.revokeObjectURL(url); url = null; } result = null; choose(m); }
        else if (a.dataset.vd === 'dl' && result) download(result.blob, m._vd.name);
        else if (a.dataset.vd === 'share' && result) { try { await navigator.share({ files: [new File([result.blob], m._vd.name, { type: result.blob.type })], title: titleOf(P) }); } catch (x) { /* cancelado */ } }
      });
    },
  });
  st.cancel = true; if (url) setTimeout(() => URL.revokeObjectURL(url), 4000);
}
