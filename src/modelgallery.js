/* Datavix: galeria de modelos (portão 54). Depois da leitura, em vez de uma janela só de texto, uma galeria no estilo da de modelos do Google Planilhas:
 * cada cartão mostra uma miniatura de slide montada com os dados da própria planilha (rótulos e valores reais, nunca imagem genérica), a sequência de
 * slides do modelo e por que ele serve (ou não) para esta planilha. Os que servem vêm primeiro, em destaque; os que não servem aparecem apagados, com o
 * motivo. Em telas pequenas, ou por escolha, a mesma janela vira uma lista sem miniaturas. A miniatura só descreve (totais e formas dos dados): quem afirma
 * achados é o roteiro, que passa pelo validador. Nada sai do navegador. */

Object.assign(I18N.pt, {
  mg_p: 'Cada modelo conta uma história a partir de uma pergunta que os seus dados respondem. As miniaturas usam os números da sua planilha. O primeiro já está marcado.',
  mg_fit_h: 'Serve para esta planilha', mg_all: 'Todos os modelos', mg_fit: 'Serve para esta planilha', mg_poss: 'Possível', mg_no: 'Indisponível',
  mg_view: 'Exibição', mg_view_g: 'Galeria', mg_view_l: 'Lista', mg_seq: 'Sequência de slides', mg_open: 'Ver galeria de modelos', mg_thumb: n => `Miniatura do modelo ${n} com os dados da planilha`,
  mg_g: { compare: 'Comparar', time: 'Ao longo do tempo', weigh: 'Quem pesa', plan: 'Planejamento', explore: 'Explorar', overview: 'Panorama' },
  mg_vs_fit: (e, m, k) => `${e} entidades × ${m} ${m === 1 ? 'métrica' : 'métricas'} × ${k} ${k === 1 ? 'período' : 'períodos'}`,
  mg_by: (m, g) => `${m} por ${g}`, mg_dist: m => `Distribuição de ${m}`, mg_rel: (y, x) => `${y} × ${x}`, mg_stages: 'Etapas', mg_rows: 'linhas', mg_before: 'Antes', mg_after: 'Depois', mg_need_cut: 'escolha a data do marco depois',
  mg_pan_t: (f, n) => `${f}: ${n} linhas`, mg_empty: 'sem miniatura', mg_none: 'A planilha não sustenta um modelo específico: segue o Panorama.', mg_always: 'Sempre disponível',
});
Object.assign(I18N.en, {
  mg_p: 'Each model tells a story from a question your data answers. Thumbnails use the numbers from your spreadsheet. The first one is already selected.',
  mg_fit_h: 'Fits this spreadsheet', mg_all: 'All models', mg_fit: 'Fits this spreadsheet', mg_poss: 'Possible', mg_no: 'Unavailable',
  mg_view: 'View', mg_view_g: 'Gallery', mg_view_l: 'List', mg_seq: 'Slide sequence', mg_open: 'Open the model gallery', mg_thumb: n => `Thumbnail of the ${n} model with data from the spreadsheet`,
  mg_g: { compare: 'Compare', time: 'Over time', weigh: 'What weighs most', plan: 'Planning', explore: 'Explore', overview: 'Overview' },
  mg_vs_fit: (e, m, k) => `${e} entities × ${m} ${m === 1 ? 'metric' : 'metrics'} × ${k} ${k === 1 ? 'period' : 'periods'}`,
  mg_by: (m, g) => `${m} by ${g}`, mg_dist: m => `Distribution of ${m}`, mg_rel: (y, x) => `${y} × ${x}`, mg_stages: 'Stages', mg_rows: 'rows', mg_before: 'Before', mg_after: 'After', mg_need_cut: 'pick the milestone date afterwards',
  mg_pan_t: (f, n) => `${f}: ${n} rows`, mg_empty: 'no thumbnail', mg_none: 'The spreadsheet does not support one specific model: using the Overview.', mg_always: 'Always available',
});

const MG_GROUPS = [
  { id: 'compare', ids: ['versus', 'compare'] }, { id: 'time', ids: ['time', 'before_after'] }, { id: 'weigh', ids: ['rank', 'composition'] },
  { id: 'plan', ids: ['goal', 'funnel'] }, { id: 'explore', ids: ['distribution', 'relation', 'geo'] }, { id: 'overview', ids: [''] },
];
const MG_KICK = { versus: 'timeline', compare: 'lead', time: 'var', rank: 'conc', composition: 'part', distribution: 'typical', relation: 'rel', geo: 'lead', funnel: 'rate', goal: 'att', before_after: 'step' }; // título do slide do gráfico, o mesmo do arco do modelo

/* ---------------- textos curtos ---------------- */
const mgClip = (s, n) => { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, Math.max(1, n - 1)).trimEnd() + '…' : s; };
function mgWrap(s, n, lines) { // quebra por palavras em até `lines` linhas de `n` caracteres; a última linha é cortada com reticências
  const words = String(s == null ? '' : s).replace(/\s+/g, ' ').trim().split(' '), out = []; let cur = '';
  for (const w of words) { if (!cur) cur = w; else if ((cur + ' ' + w).length <= n) cur += ' ' + w; else { out.push(cur); cur = w; } }
  if (cur) out.push(cur);
  if (out.length > lines) { const keep = out.slice(0, lines); keep[lines - 1] = mgClip(keep[lines - 1] + ' …', n); return keep; }
  return out.map(l => mgClip(l, n + 4));
}
const mgNum = (v, unit) => fmtNum(v, unit || null, LANG);

/* ---------------- dados reais da planilha para cada miniatura ---------------- */
// total (ou média, ou contagem) por categoria, do maior para o menor; mesma regra de soma ou média do gráfico
function mgGroupAgg(ds, gi, mi, top) {
  const g = ds.columns[gi]; if (!g || !g.codes || !g.dict) return null; const m = mi >= 0 ? ds.columns[mi] : null, n = ds.rowCount, kind = gal2Agg(ds.columns, mi);
  const sum = g.dict.map(() => 0), cnt = g.dict.map(() => 0);
  for (let r = 0; r < n; r++) { const k = g.codes[r]; if (k < 0) continue; const v = m ? m.data[r] : 1; if (!Number.isFinite(v)) continue; sum[k] += v; cnt[k]++; }
  const arr = g.dict.map((l, k) => ({ k: l, v: kind === 'mean' ? (cnt[k] ? sum[k] / cnt[k] : 0) : sum[k], n: cnt[k] })).filter(x => x.n > 0 && !isPlaceholderLabel(x.k)).sort((a, b) => b.v - a.v);
  const unit = m ? m.unit : null; return { items: arr.slice(0, top || 5).map(x => ({ ...x, t: kind === 'count' ? fmtInt(x.v, LANG) : mgNum(x.v, unit) })), all: arr.length, kind, name: g.name, measure: m ? m.name : '', unit };
}
function mgSeries(ds, ti, mi) {
  const c = ds.columns[ti]; if (!c || !c.data) return null; const grain = riverGrain(c.min, c.max, c) || pickGrain(c.min, c.max), m = mi >= 0 ? ds.columns[mi] : null, kind = gal2Agg(ds.columns, mi), n = ds.rowCount, map = new Map();
  for (let r = 0; r < n; r++) { const t = c.data[r]; if (Number.isNaN(t)) continue; const v = m ? m.data[r] : 1; if (!Number.isFinite(v)) continue; const b = bucketStart(t, grain), o = map.get(b) || [0, 0]; o[0] += v; o[1]++; map.set(b, o); }
  const pts = [...map].sort((a, b) => a[0] - b[0]).map(([t, o]) => ({ t, v: kind === 'mean' ? o[0] / o[1] : o[0] })); if (pts.length < 2) return null;
  return { pts, grain, first: bucketLabel(pts[0].t, grain, LANG), last: bucketLabel(pts[pts.length - 1].t, grain, LANG), measure: m ? m.name : (LANG === 'en' ? 'Rows' : 'Linhas'), unit: m ? m.unit : null, kind };
}
function mgHist(ds, mi) {
  const c = ds.columns[mi]; if (!c || !c.data) return null; const n = ds.rowCount; let lo = Infinity, hi = -Infinity, k = 0;
  for (let r = 0; r < n; r++) { const v = c.data[r]; if (!Number.isFinite(v)) continue; if (v < lo) lo = v; if (v > hi) hi = v; k++; }
  if (k < 8 || !(hi > lo)) return null; const B = 12, bins = new Array(B).fill(0), w = (hi - lo) / B;
  for (let r = 0; r < n; r++) { const v = c.data[r]; if (!Number.isFinite(v)) continue; bins[Math.min(B - 1, Math.floor((v - lo) / w))]++; }
  return { bins, lo, hi, n: k, measure: c.name, unit: c.unit };
}
function mgPoints(ds, xi, yi, max) {
  const cx = ds.columns[xi], cy = ds.columns[yi]; if (!cx || !cy || !cx.data || !cy.data) return null; const n = ds.rowCount, ok = []; for (let r = 0; r < n; r++) if (Number.isFinite(cx.data[r]) && Number.isFinite(cy.data[r])) ok.push(r);
  if (ok.length < 4) return null; const step = Math.max(1, Math.floor(ok.length / (max || 70))), pts = []; for (let i = 0; i < ok.length; i += step) pts.push([cx.data[ok[i]], cy.data[ok[i]]]);
  return { pts, x: cx.name, y: cy.name, n: ok.length };
}
function mgStages(ds, idx) {
  const items = idx.map(i => { const c = ds.columns[i]; let k = 0; if (c && c.codes) for (let r = 0; r < ds.rowCount; r++) if (c.codes[r] >= 0) k++; return { k: c ? c.name : '', v: k, t: fmtInt(k, LANG) }; }); return items.length >= 2 ? { items } : null;
}

/* ---------------- desenho (SVG com as cores do produto; o destaque é a cor da peça) ---------------- */
function mgFrame(kick, title, body, alt) {
  const tl = mgWrap(title, 36, 2);
  return `<svg class="mg-svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(alt || title)}"><rect class="mg-bg" x="0" y="0" width="320" height="180" rx="10"/>
    <text class="mg-k" x="16" y="22">${esc(mgClip(String(kick).toUpperCase(), 44))}</text>${tl.map((l, i) => `<text class="mg-t" x="16" y="${44 + i * 16}">${esc(l)}</text>`).join('')}${body}</svg>`;
}
function mgBarsSvg(items, o = {}) {
  const max = Math.max(...items.map(i => Math.max(0, i.v)), 1e-12), x0 = 100, w = 162, step = 17, y0 = 82;
  return items.slice(0, 5).map((it, k) => { const y = y0 + k * step, bw = Math.max(2, w * Math.max(0, it.v) / max), cx = o.center ? x0 + (w - bw) / 2 : x0;
    return `<text class="mg-l" x="16" y="${y + 9}">${esc(mgClip(it.k, 15))}</text><rect class="mg-tr" x="${x0}" y="${y}" width="${w}" height="11" rx="3"/><rect class="mg-ac${k && o.fade ? ' mg-fd' : ''}" x="${cx.toFixed(1)}" y="${y}" width="${bw.toFixed(1)}" height="11" rx="3"/><text class="mg-v" x="304" y="${y + 9}" text-anchor="end">${esc(it.t)}</text>`; }).join('');
}
function mgLineSvg(s) {
  const pts = s.pts, hi = Math.max(...pts.map(p => p.v)), lo = Math.min(0, ...pts.map(p => p.v)), x0 = 16, x1 = 304, y0 = 88, y1 = 150, span = hi - lo || 1;
  const xy = pts.map((p, i) => [x0 + (x1 - x0) * i / (pts.length - 1), y1 - (y1 - y0) * (p.v - lo) / span]), d = xy.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('');
  return `<path class="mg-ar" d="${d}L${x1} ${y1}L${x0} ${y1}Z"/><path class="mg-ln" d="${d}"/><circle class="mg-dot" cx="${xy[xy.length - 1][0].toFixed(1)}" cy="${xy[xy.length - 1][1].toFixed(1)}" r="3"/>
    <text class="mg-l" x="${x0}" y="168">${esc(mgClip(s.first, 14))}</text><text class="mg-l" x="${x1}" y="168" text-anchor="end">${esc(mgClip(s.last, 14))}</text>`;
}
function mgHistSvg(h) {
  const mx = Math.max(...h.bins), x0 = 16, w = 288 / h.bins.length, base = 152;
  return h.bins.map((b, i) => `<rect class="mg-ac" x="${(x0 + i * w + 1).toFixed(1)}" y="${(base - 62 * b / mx).toFixed(1)}" width="${(w - 2).toFixed(1)}" height="${Math.max(1, 62 * b / mx).toFixed(1)}" rx="1.5"/>`).join('')
    + `<text class="mg-l" x="16" y="168">${esc(mgNum(h.lo, h.unit))}</text><text class="mg-l" x="304" y="168" text-anchor="end">${esc(mgNum(h.hi, h.unit))}</text>`;
}
function mgScatterSvg(sc) {
  const xs = sc.pts.map(p => p[0]), ys = sc.pts.map(p => p[1]), xl = Math.min(...xs), xh = Math.max(...xs), yl = Math.min(...ys), yh = Math.max(...ys), sx = xh - xl || 1, sy = yh - yl || 1;
  return sc.pts.map(p => `<circle class="mg-ac mg-o" cx="${(20 + 280 * (p[0] - xl) / sx).toFixed(1)}" cy="${(158 - 66 * (p[1] - yl) / sy).toFixed(1)}" r="2.4"/>`).join('');
}
function mgPairSvg(items) { // realizado (cor da peça) e meta (cinza) por grupo
  const max = Math.max(...items.map(i => Math.max(i.a, i.m)), 1e-12), x0 = 100, w = 162;
  return items.slice(0, 4).map((it, k) => { const y = 82 + k * 21, p = it.m > 0 ? it.a / it.m * 100 : 0;
    return `<text class="mg-l" x="16" y="${y + 10}">${esc(mgClip(it.k, 15))}</text><rect class="mg-ac" x="${x0}" y="${y}" width="${Math.max(2, w * it.a / max).toFixed(1)}" height="8" rx="2.5"/><rect class="mg-mt" x="${x0}" y="${y + 10}" width="${Math.max(2, w * it.m / max).toFixed(1)}" height="8" rx="2.5"/><text class="mg-v" x="304" y="${y + 10}" text-anchor="end">${esc(csPct(p, LANG))}</text>`; }).join('');
}
function mgTimelineSvg(pk) {
  const pd = pk.pd, E = pk.ents.length, rows = Math.min(E, 4), n = pd.length, x0 = 100, w = 204, cw = w / n, y0 = 84, rh = 22;
  let s = ''; for (let e = 0; e < rows; e++) { const y = y0 + e * rh; s += `<text class="mg-l" x="16" y="${y + 11}">${esc(mgClip(pk.ents[e], 15))}</text>`;
    pd.forEach((x, i) => { const has = x.present.includes(e), cls = !has ? 'mg-no' : x.cls === 'comparable' ? 'mg-ac' : 'mg-mt'; s += `<rect class="${cls}" x="${(x0 + i * cw + 1).toFixed(1)}" y="${y}" width="${Math.max(2, cw - 2).toFixed(1)}" height="15" rx="3"/>`; }); }
  return s + `<text class="mg-l" x="${x0}" y="${y0 + rows * rh + 10}">${esc(mgClip(pd[0].p, 12))}</text><text class="mg-l" x="304" y="${y0 + rows * rh + 10}" text-anchor="end">${esc(mgClip(pd[pd.length - 1].p, 12))}</text>`;
}

// miniatura de cada modelo: { svg, line } ou null; `line` resume o que a miniatura mostra (usado no texto alternativo)
function mgThumb(id, ctx) {
  const { ds, rk } = ctx, e = rk.all[id] || {}, c = e.cols || {}, kick = id === '' ? nvpT().r.main : id === 'versus' ? nvfT().t.timeline : ((NVS_T[LANG] || NVS_T.pt)[MG_KICK[id]] || nvStoryInfo(id, LANG).name);
  const bars = (gi, mi, title) => { const a = mgGroupAgg(ds, gi, mi, 5); return a && a.items.length ? { svg: mgFrame(kick, title || T('mg_by', a.measure || T('mg_rows'), a.name), mgBarsSvg(a.items)), line: a.items.map(x => `${x.k} ${x.t}`).join(', ') } : null; };
  const line = (ti, mi, title) => { const s = mgSeries(ds, ti, mi); return s ? { svg: mgFrame(kick, title || T('mg_by', s.measure, grainName(s.grain, LANG)), mgLineSvg(s)), line: `${s.first} – ${s.last}` } : null; };
  switch (id) {
    case 'compare': case 'rank': return bars(c.group, c.measure);
    case 'composition': return bars(c.group, c.measure);
    case 'geo': {
      if (c.lat !== undefined && c.lon !== undefined) { const sc = mgPoints(ds, c.lon, c.lat, 140); return sc ? { svg: mgFrame(kick, `${ds.columns[c.lat].name} × ${ds.columns[c.lon].name}`, mgScatterSvg(sc)), line: `${fmtInt(sc.n, LANG)} ${T('mg_rows')}` } : null; }
      return bars(c.geo, c.measure);
    }
    case 'time': return line(c.time, c.measure);
    case 'before_after': { const g = c.time !== undefined ? c.time : ds.columns.findIndex(x => x.kind === 'date' && x.data); const l = line(g, F_main(ds)); if (l && e.needsCut) l.line += ' · ' + T('mg_need_cut'); return l; }
    case 'distribution': { const h = mgHist(ds, c.measure); return h ? { svg: mgFrame(kick, T('mg_dist', h.measure), mgHistSvg(h)), line: `${fmtInt(h.n, LANG)} ${T('mg_rows')}` } : null; }
    case 'relation': { const sc = mgPoints(ds, c.x, c.y, 70); return sc ? { svg: mgFrame(kick, T('mg_rel', sc.y, sc.x), mgScatterSvg(sc)), line: `${fmtInt(sc.n, LANG)} ${T('mg_rows')}` } : null; }
    case 'funnel': { const f = mgStages(ds, c.stages || []); return f ? { svg: mgFrame(kick, f.items.map(x => x.k).join(' → '), mgBarsSvg(f.items, { center: true, fade: true })), line: f.items.map(x => `${x.k} ${x.t}`).join(' → ') } : null; }
    case 'goal': { const g = nvGoalStats(ds); if (!g) return null; const items = (g.groups && g.groups.length >= 2 ? g.groups.slice().sort((a, b) => b.m - a.m).slice(0, 4).map(x => ({ k: x.label, a: x.a, m: x.m })) : [{ k: g.actual, a: g.A, m: g.M }]);
      return { svg: mgFrame(kick, `${g.actual} × ${g.meta}`, mgPairSvg(items)), line: items.map(x => `${x.k} ${csPct(x.m > 0 ? x.a / x.m * 100 : 0, LANG)}`).join(', ') }; }
    case 'versus': { const pk = nvVsPack(ds); if (!pk) return null; const title = pk.ents.join(' × '); if (pk.pd && pk.pd.length >= 2) return { svg: mgFrame(kick, title, mgTimelineSvg(pk)), line: `${pk.pd[0].p} – ${pk.pd[pk.pd.length - 1].p}` };
      const tl = nvVsTally(pk.score.items, pk.ents.length); return { svg: mgFrame(kick, title, mgBarsSvg(pk.ents.map((en, i) => ({ k: en, v: tl.wins[i], t: String(tl.wins[i]) })))), line: pk.ents.map((en, i) => `${en} ${tl.wins[i]}`).join(' · ') }; }
    default: { // Panorama: a visão completa começa pelo que a planilha tem de mais forte
      const pick = rk.possible.find(x => x !== 'versus' && x !== 'distribution' && x !== 'relation' && x !== 'before_after' && x !== 'goal' && x !== 'funnel' && x !== 'geo');
      const t = pick && pick !== '' ? mgThumb(pick, ctx) : null; if (t) return t;
      return { svg: mgFrame(kick, T('mg_pan_t', ctx.file || '', fmtInt(ds.rowCount, LANG)), ''), line: '' };
    }
  }
}
const F_main = ds => { const F = nvStoryFacts(ds); return F.main; };

/* ---------------- sequência de slides do modelo ---------------- */
function mgSeq(id, ctx) {
  const X = nvpT(), R = X.r, TT = NVS_T[LANG] || NVS_T.pt;
  if (id === 'versus' && ctx.P && ctx.P.host && ctx.P.host.ix) { try { const P = ctx.P, pl = nvPlan(P, P.host.ix.meta, buildSteps(P, P.host.ix.meta), 5, 'versus'); if (pl && pl.slides.length) return pl.slides.map(s => s.planTitle); } catch (e) { /* segue com a sequência padrão */ } }
  if (id === '') return [R.ctx, R.main, R.evid, R.explore, R.impl];
  const arc = NV_STORIES[id] && NV_STORIES[id].arc && NV_STORIES[id].arc[5]; if (!arc) return [R.ctx, R.q1, R.q2];
  return arc.map(([kind, key]) => (kind === 'ctx' ? R.ctx : kind === 'over' ? R.over : kind === 'fact' ? TT[key] : kind === 'limits' ? TT[key || 'limits'] : kind === 'synth' ? R.synth : R.impl)).filter(Boolean);
}

/* ---------------- cartões e janela ---------------- */
function mgFitText(id, ctx) {
  const e = ctx.rk.all[id] || {};
  if (id === 'versus' && e.ok) { const pk = nvVsPack(ctx.ds); if (pk && pk.score) return T('mg_vs_fit', pk.ents.length, pk.score.items.length, pk.periods.length); }
  return e.why || '';
}
function mgCard(id, ctx, sel, kind) { // kind: 'fit' (recomendado), 'poss' (possível) ou 'no' (indisponível)
  const i = id === '' ? { name: T('story_pan'), ask: T('tell_pan_ask') } : nvStoryInfo(id, LANG), e = ctx.rk.all[id] || {}, n = ctx.rk.facts[id];
  const why = id === '' ? '' : kind === 'no' ? (e.why || '') : mgFitText(id, ctx), tag = id === '' ? T('mg_always') : kind === 'fit' ? T('mg_fit') : kind === 'poss' ? T('mg_poss') : T('mg_no');
  let thumb = ''; if (ctx.thumbs) { let t = null; try { t = kind === 'no' ? null : mgThumb(id, ctx); } catch (err) { t = null; console.error(err); } thumb = `<span class="mg-thumb${t ? '' : ' none'}" aria-hidden="true">${t ? t.svg : (kind === 'no' ? '' : `<span class="mg-na">${esc(T('mg_empty'))}</span>`)}</span>${t && t.line ? `<span class="mg-sr">${esc(T('mg_thumb', i.name))}: ${esc(t.line)}</span>` : ''}`; }
  const seq = ctx.thumbs && kind !== 'no' ? `<span class="mg-seq" aria-label="${esc(T('mg_seq'))}">${mgSeq(id, ctx).map((s, k) => `<i><em>${k + 1}</em>${esc(s)}</i>`).join('')}</span>` : '';
  const fit = `<small class="mg-fit"><b>${esc(tag)}</b>${why ? ': ' + esc(why) : ''}${kind !== 'no' && id !== 'versus' && n != null ? ' · ' + esc(T('tell_facts', n)) : ''}</small>`;
  const inner = `${thumb}<b>${esc(i.name)}</b><span class="mg-ask">${esc(i.ask)}</span>${fit}${seq}`;
  return kind === 'no' ? `<div class="tell-c mg-card off" aria-disabled="true">${inner}</div>` : `<button type="button" class="tell-c mg-card ${kind}" data-id="${esc(id)}" aria-pressed="${sel === id}">${inner}</button>`;
}
// corpo da janela: recomendados em destaque, depois todos os modelos por grupo; `view` é 'gallery' ou 'list'
function mgBody(P, env, sel, view) {
  const rk = env.rk, thumbs = !!S.ds && S.ds.rowCount <= 3e6, ctx = { P, ds: S.ds, rk, thumbs, file: P.fileName || S.fileName || '' }, rec = rk.list.slice();
  const kindOf = id => (id === '' ? 'poss' : rk.all[id] && rk.all[id].ok ? (rec.includes(id) ? 'fit' : 'poss') : 'no');
  const groups = MG_GROUPS.map(g => { const ids = g.ids.filter(id => !rec.includes(id)); if (!ids.length) return ''; ids.sort((a, b) => (kindOf(a) === 'no') - (kindOf(b) === 'no'));
    return `<section class="mg-g" data-g="${g.id}"><h4 class="mg-gh">${esc(T('mg_g')[g.id])}</h4><div class="mg-grid">${ids.map(id => mgCard(id, ctx, sel, kindOf(id))).join('')}</div></section>`; }).join('');
  const recHtml = rec.length ? `<section class="mg-g mg-rec-s"><h4 class="mg-gh">${esc(T('mg_fit_h'))}</h4><div class="tell mg-grid mg-rec">${rec.map(id => mgCard(id, ctx, sel, 'fit')).join('')}</div></section>` : `<p class="note">${esc(T('mg_none'))}</p>`;
  const toggle = thumbs ? `<div class="mg-view" role="group" aria-label="${esc(T('mg_view'))}"><button type="button" data-a="mg-view" data-v="gallery" aria-pressed="${view === 'gallery'}">${esc(T('mg_view_g'))}</button><button type="button" data-a="mg-view" data-v="list" aria-pressed="${view === 'list'}">${esc(T('mg_view_l'))}</button></div>` : '';
  return `<div class="mg" style="--mg-a:${esc((P.colors && P.colors[0]) || '#d4ff00')}" data-view="${thumbs ? view : 'list'}"><div class="mg-top"><p class="note tell-p">${esc(T('mg_p'))}</p>${toggle}</div>${recHtml}<details class="tell-more" open><summary>${esc(T('mg_all'))}</summary><div class="mg-groups">${groups}</div></details></div>`;
}
const mgView = () => { let v = null; try { v = localStorage.getItem('dv-mg-view'); } catch (e) { v = null; } return v === 'gallery' || v === 'list' ? v : (innerWidth < 760 ? 'list' : 'gallery'); };
