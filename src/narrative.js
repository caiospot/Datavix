/* Datavix: evidência estruturada e validador narrativo (gate 1 do motor de história).
 * Cada achado pode trazer `ev`: os valores brutos de onde o número sai, o método e o tamanho da amostra, mais os números que aparecem na tela
 * (`shown`, com o texto exato exibido). O validador recalcula cada número só a partir dos valores brutos e confere se o texto da afirmação
 * contém o número recalculado, sem causalidade em associação e sem acusação em anomalia. Tudo roda no navegador; nada sai dele. */

// pesos e limites centralizados (hipóteses de produto, para calibrar depois com dados reais)
const NV_CFG = {
  minSample: { gapz: 10, usage: 1, missing: 1, gappp: 2, dist: 30, outrows: 30, assoc: 30, ratio: 2, dropc: 2, peak: 2, low: 2, jump: 2, trend: 4, dominant: 2, outlier: 8, lead: 3, conc: 6, contrast: 3, corr: 3, contrib: 4, shift: 4, overview: 1 },
  peakZ: 2, // pico, vale, maior salto e maior queda: pelo menos 2 desvios-padrão da variação normal (quando há períodos para medir)
  trendZ: 2, // tendência só com Mann-Kendall z >= 2 sobre os períodos
  gapzMin: 3, gapzDevMin: 20, derivedCv: 0.08, // grupo que difere da média geral: z e desvio mínimos; relação "mecânica" quando a razão entre as colunas varia menos que isso
  causal: /\b(causou|causa[rm]?|causado|por causa|devido a|provoc\w+|gerou|ocasion\w+|culpa|caused?|causes|because|due to|leads? to|led to|results? in|triggered)\b/i,
  accuse: /\b(erro|fraude|fraudulent\w*|falha|defeito|mentira|errors?|fraud|mistakes?|faulty|wrong)\b/i,
};
// quem fala em "explica" no ato de contribuição calculada não está afirmando causa: o cálculo existe
const NV_CAUSAL_OK = new Set(['contrib', 'shift']);

/* ---- recalculo independente de cada tipo de número: só usa ev.values ---- */
const NV_CALC = {
  peak: v => ({ dev: (v.top / (v.sum / v.n) - 1) * 100, top: v.top }),
  low: v => ({ dev: (v.top / (v.sum / v.n) - 1) * 100, top: v.top }),
  jump: v => ({ ch: (v.cur / v.prev - 1) * 100 }),
  trend: v => ({ ch: (v.tail / v.head - 1) * 100, z: v.S != null && v.nn >= 6 ? (v.S - Math.sign(v.S)) / Math.sqrt(v.nn * (v.nn - 1) * (2 * v.nn + 5) / 18) : null }),
  dominant: v => ({ share: v.top / v.total * 100 }),
  outlier: v => { const iqr = v.q3 - v.q1; return { hi: v.q3 + 1.5 * iqr, lo: v.q1 - 1.5 * iqr, out: v.value > v.q3 + 1.5 * iqr || v.value < v.q1 - 1.5 * iqr }; },
  lead: v => ({ share: v.top / v.total * 100, top: v.top }),
  conc: v => ({ p: v.parts.reduce((a, x) => a + x, 0) / v.total * 100, sum: v.parts.reduce((a, x) => a + x, 0) }),
  contrast: v => ({ x: v.top / v.low }),
  corr: v => ({ r: v.r }),
  contrib: v => ({ p: v.diff / v.dTotal * 100 }),
  shift: v => ({ d: v.s1 / v.t1 * 100 - v.s0 / v.t0 * 100 }),
  overview: v => ({ total: v.sum }),
  ratio: v => ({ p: v.num / v.den * 100 }),
  dropc: v => ({ p: (1 - v.next / v.cur) * 100 }),
  gappp: v => ({ d: v.a1 / v.v1 * 100 - v.a0 / v.v0 * 100 }),
  dist: v => ({ gap: (v.mean / v.median - 1) * 100 }),
  outrows: v => ({ p: v.count / v.n * 100, count: v.count }),
  assoc: v => ({ rho: v.rho }),
  gapz: v => ({ dev: (v.gm / v.om - 1) * 100, z: (v.gm - v.om) / (v.sd / Math.sqrt(v.ng)) }),
  usage: v => ({ p: v.used / v.total * 100 }),
  missing: v => ({ p: v.miss / (v.n + v.miss) * 100 }),
};
// o denominador de cada cálculo precisa existir e ser positivo (na contribuição, a variação total pode ser queda: vale o módulo)
const NV_DEN = { gapz: v => Math.min(v.om, v.sd), usage: v => v.total, missing: v => v.n + v.miss, gappp: v => Math.min(v.v1, v.v0), ratio: v => v.den, dropc: v => v.cur, dist: v => v.median, outrows: v => v.n, assoc: v => v.n, peak: v => v.sum / v.n, low: v => v.sum / v.n, jump: v => v.prev, trend: v => v.head, dominant: v => v.total, lead: v => v.total, conc: v => v.total, contrast: v => v.low, contrib: v => Math.abs(v.dTotal), shift: v => Math.min(v.t0, v.t1) };

/* ---- construtor ---- */
// kind: chave de NV_CALC; values: entradas brutas; shown: [{ k, value, text }] com o número calculado pelo código e o texto exibido; refs: de onde vieram (rótulos, períodos)
function nvEv(kind, values, shown, o = {}) {
  return { kind, method: o.method || kind, sampleSize: o.n != null ? o.n : null, values, shown: shown || [], refs: o.refs || [], unit: o.unit || null, allow: o.allow || [] }; // allow: verificações dispensadas de propósito (ex.: coluna chamada "Causa")
}

/* ---- validação de um item (achado ou ato da história) ---- */
function nvCheckItem(item, lang) {
  const errors = [], warns = [], ev = item.ev, id = item.id, text = String(item.text || item.head || ''), calcTxt = ((item.calc && item.calc.rows) || []).map(r => `${r.k} ${r.v}`).join(' ');
  if (item.edited) return { errors, warns, state: 'edited' }; // a frase é da pessoa: ela responde por ela
  if (!ev) return { errors, warns: [{ id, code: 'no-evidence', msg: 'sem evidência estruturada' }], state: 'unchecked' };
  const fn = NV_CALC[ev.kind]; if (!fn) return { errors: [{ id, code: 'unknown-kind', msg: 'tipo de evidência desconhecido: ' + ev.kind }], warns, state: 'error' };
  const v = ev.values || {}, bad = (code, msg) => errors.push({ id, code, msg });
  if (Object.values(v).some(x => (typeof x === 'number' && !isFinite(x)) || (Array.isArray(x) && x.some(y => !isFinite(y))))) bad('invalid-value', 'valor bruto inválido (NaN ou infinito)');
  const min = NV_CFG.minSample[ev.kind] || 1; if (ev.sampleSize != null && ev.sampleSize < min) bad('small-sample', `amostra ${ev.sampleSize} menor que o mínimo (${min}) para ${ev.kind}`);
  const den = NV_DEN[ev.kind]; if (den) { let d; try { d = den(v); } catch (e) { d = NaN; } if (!(d > 0)) bad('bad-denominator', 'denominador zero, negativo ou ausente'); }
  if (!errors.length) {
    let calc; try { calc = fn(v); } catch (e) { bad('calc-failed', 'não foi possível recalcular'); }
    if (calc) {
      if (ev.kind === 'outlier' && !calc.out) bad('not-outlier', 'o valor não está fora dos limites do IQR');
      for (const s of ev.shown) {
        const re = calc[s.k]; if (re === undefined) { if (ev.kind !== 'outlier') bad('unknown-shown', `número "${s.k}" não tem recálculo`); continue; }
        if (Math.abs(re - s.value) > 1e-6 * Math.max(1, Math.abs(re))) bad('mismatch', `"${s.k}": exibido ${s.value}, recalculado ${re}`);
        if (s.text && !(text.includes(s.text) || calcTxt.includes(s.text) || (item.hl && String(item.hl).includes(s.text)) || (item.big && String(item.big.text).includes(s.text)))) bad('text-mismatch', `o texto não contém "${s.text}"`);
      }
    }
  }
  if (!NV_CAUSAL_OK.has(ev.kind) && !(ev.allow || []).includes('causal') && NV_CFG.causal.test(text)) bad('causal', 'afirmação com linguagem de causa');
  if (['corr', 'assoc', 'outlier', 'outrows', 'dist'].includes(ev.kind) && NV_CFG.accuse.test(text)) bad('accusation', 'anomalia ou associação descrita como erro ou fraude');
  if (ev.kind === 'trend' && v.S != null) { const z = NV_CALC.trend(v).z; if (z === null || Math.abs(z) < NV_CFG.trendZ - 1e-9) bad('insignificant', 'tendência dentro da variação normal dos períodos'); }
  if ((ev.kind === 'peak' || ev.kind === 'low') && v.sd != null && v.n >= 8) { const z = ((ev.kind === 'peak' ? 1 : -1) * (v.top - v.sum / v.n)) / v.sd; if (!(z >= NV_CFG.peakZ - 1e-9)) bad('insignificant', 'valor extremo dentro da variação normal dos períodos'); }
  if (ev.kind === 'jump' && v.sc != null) { const ch = (v.cur / v.prev - 1) * 100, z = (ch - v.mc) / v.sc; if (!(Math.abs(z) >= NV_CFG.peakZ - 1e-9)) bad('insignificant', 'variação dentro do que é normal entre períodos'); }
  if (ev.kind === 'gapz') { const z = NV_CALC.gapz(v).z; if (!(Math.abs(z) >= nvZNeed(v.k || 1) - 1e-9)) bad('insignificant', 'diferença do grupo dentro da variação normal'); }
  if (ev.kind === 'assoc' && v.n >= 2 && Math.abs(v.rho) * Math.sqrt(v.n - 1) < NV_ROWS.rhoZ - 1e-9) bad('insignificant', 'associação dentro do que o acaso gera com tão poucas linhas');
  if (ev.kind === 'assoc' && Math.abs(v.rho) > 1) bad('out-of-range', 'correlação fora de -1 a 1');
  if (ev.kind === 'outrows' && !(v.count > 0 && v.count <= v.n)) bad('bad-count', 'contagem de atípicos inválida');
  if (ev.kind === 'outlier' && ev.sampleSize != null && ev.sampleSize < 12) warns.push({ id, code: 'exploratory', msg: 'poucas observações para a referência do IQR' });
  if (ev.kind === 'corr' && ev.sampleSize != null && ev.sampleSize < 10) warns.push({ id, code: 'exploratory', msg: 'poucos pontos para a correlação' });
  if (ev.method === 'count' && ev.sampleSize != null && ev.sampleSize < 30) warns.push({ id, code: 'exploratory', msg: 'menos de 30 registros: leitura exploratória' });
  if (ev.kind === 'contrast' && ev.sampleSize != null && ev.sampleSize < 5) warns.push({ id, code: 'exploratory', msg: 'poucos grupos: leitura exploratória' });
  return { errors, warns, state: errors.length ? 'error' : 'ok' };
}

/* ---- validação de uma lista (insights da peça ou roteiro) ---- */
// devolve { ok, errors, warnings, checked, unchecked, drop: Set de índices com erro bloqueante }
function nvValidate(items, lang) {
  const out = { ok: true, errors: [], warnings: [], checked: 0, unchecked: 0, drop: new Set() }, seen = new Map();
  (items || []).forEach((it, i) => {
    const r = nvCheckItem(it, lang);
    if (r.state === 'ok') out.checked++; else if (r.state === 'unchecked') out.unchecked++;
    out.errors.push(...r.errors); out.warnings.push(...r.warns);
    if (r.errors.length) out.drop.add(i);
    const key = String(it.head || it.text || '').trim().toLowerCase(); // o mesmo enunciado em dois slides sem evidência nova
    if (key && it.id !== 'st-ov') { if (seen.has(key)) out.warnings.push({ id: it.id, code: 'repeated', msg: 'mesma afirmação de ' + seen.get(key) }); else seen.set(key, it.id); }
  });
  out.ok = !out.errors.length;
  return out;
}
// roteiro: tira o que tem erro bloqueante (nunca reescreve em silêncio) e guarda o motivo
function nvGuard(items, lang) {
  const r = nvValidate(items, lang); if (!r.drop.size) return { items, report: r };
  const kept = items.filter((_, i) => !r.drop.has(i)); kept.forEach((s, i) => { if (s.kick) s.kick.n = String(i + 1).padStart(2, '0'); });
  try { console.warn('[narrativa] removido por validação:', r.errors.map(e => e.id + ':' + e.code).join(', ')); } catch (e) { /* sem console */ }
  return { items: kept, report: r };
}


/* ---- famílias que dependem dos valores linha a linha: distribuição, atípicos nas linhas e associação ---- */
// calculado uma vez na montagem dos dados (buildSeriesBase) e guardado em built.rowStats; os achados saem daí, sem reler a planilha
const NV_ROWS = { min: 30, assocCols: 8, assocCap: 20000, gapMin: 15, dimMax: 5, dimCats: 300, dimLeadMin: 40, outMinPct: 1, rhoMin: 0.4, rhoZ: 3.5 }; // associação: |ρ| mínimo e |ρ|·√(n−1) mínimo (o acaso em poucas linhas gera ρ alto)
function nvRank(a) { // postos com média nos empates
  const idx = a.map((v, i) => i).sort((x, y) => a[x] - a[y]), r = new Array(a.length);
  for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && a[idx[j + 1]] === a[idx[i]]) j++; const m = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[idx[k]] = m; i = j + 1; }
  return r;
}
function nvSpearman(xs, ys) {
  const n = xs.length; if (n < 3) return null; const rx = nvRank(xs), ry = nvRank(ys);
  let sx = 0, sy = 0; for (let i = 0; i < n; i++) { sx += rx[i]; sy += ry[i]; } const mx = sx / n, my = sy / n; let a = 0, b = 0, c = 0;
  for (let i = 0; i < n; i++) { const dx = rx[i] - mx, dy = ry[i] - my; a += dx * dy; b += dx * dx; c += dy * dy; }
  return b > 0 && c > 0 ? a / Math.sqrt(b * c) : null;
}
function nvRowStats(ds, yc) {
  if (!yc || !yc.data) return null;
  const n = ds.rowCount, vals = []; let miss = 0;
  for (let i = 0; i < n; i++) { const v = yc.data[i]; if (Number.isFinite(v)) vals.push(v); else miss++; }
  const out = { n: vals.length, miss, unit: yc.unit || null, name: yc.name };
  if (vals.length < NV_ROWS.min) return out;
  const s = Float64Array.from(vals).sort(), q = p => s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))];
  const q1 = q(0.25), q3 = q(0.75), med = q(0.5), mean = vals.reduce((a, b) => a + b, 0) / vals.length, iqr = q3 - q1;
  Object.assign(out, { min: s[0], max: s[s.length - 1], q1, q3, median: med, mean });
  if (iqr > 0) { const hi = q3 + 1.5 * iqr, lo = q1 - 1.5 * iqr; let above = 0, below = 0; for (const v of vals) { if (v > hi) above++; else if (v < lo) below++; } out.outAbove = above; out.outBelow = below; }
  // associação: a coluna numérica (papel de medida) mais forte contra a medida principal, por postos de Spearman
  const best = [], others = ds.columns.map((c, i) => [c, i]).filter(([c]) => c !== yc && c.kind === 'number' && c.role === 'measure' && c.use !== false && !c.hide && c.data).slice(0, NV_ROWS.assocCols);
  const step = Math.max(1, Math.ceil(n / NV_ROWS.assocCap));
  for (const [c] of others) {
    const xs = [], ys = []; for (let i = 0; i < n; i += step) { const a = yc.data[i], b = c.data[i]; if (Number.isFinite(a) && Number.isFinite(b)) { xs.push(a); ys.push(b); } }
    if (xs.length < NV_ROWS.min) continue;
    const rr = []; for (let i = 0; i < xs.length; i++) if (xs[i] !== 0) rr.push(ys[i] / xs[i]); const mr = rr.reduce((a, b) => a + b, 0) / (rr.length || 1), cv = rr.length > 10 && mr !== 0 ? Math.sqrt(rr.reduce((a, b) => a + (b - mr) * (b - mr), 0) / rr.length) / Math.abs(mr) : 1;
    if (cv < NV_CFG.derivedCv) { (out.derived = out.derived || []).push(c.name); continue; } // uma coluna é praticamente um múltiplo da outra (executado ≈ 90% do orçado): relação mecânica, não é achado
    const rho = nvSpearman(xs, ys); if (rho !== null) best.push({ name: c.name, unit: c.unit || null, rho, n: xs.length });
  }
  best.sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho)); if (best[0]) out.assoc = best[0];
  // outras dimensões da planilha (o gráfico só mostra uma): contagem e soma por grupo
  out.sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (vals.length - 1));
  const dims = ds.columns.filter(c => c.role === 'category' && c.use !== false && !c.hide && c.codes && c.dict && c.dict.length >= 2 && c.dict.length <= NV_ROWS.dimCats).sort((a, b) => a.dict.length - b.dict.length).slice(0, NV_ROWS.dimMax); out.dims = [];
  for (const c of dims) {
    const g = c.dict.map(() => ({ n: 0, sum: 0 })); let used = 0;
    for (let i = 0; i < n; i++) { const v = yc.data[i], k = c.codes[i]; if (k < 0 || !Number.isFinite(v)) continue; g[k].n++; g[k].sum += v; used++; }
    const list = g.map((x, k) => ({ label: c.dict[k], n: x.n, sum: x.sum })).filter(x => x.n > 0); if (list.length >= 2 && used >= NV_ROWS.min) out.dims.push({ name: c.name, groups: list, used });
  }
  return out;
}
function nvRowInsights(built, lang, T) {
  const rs = built && built.rowStats, out = []; if (!rs || rs.n < NV_ROWS.min || built.kind === 'hist' || built.kind === 'relation') return out;
  const f = v => fmtNum(v, rs.unit, lang), nm = rs.name, base = `${T('rs_base')} · ${nm}`;
  if (rs.median > 0 && rs.mean > 0) {
    const gap = (rs.mean / rs.median - 1) * 100;
    if (Math.abs(gap) >= NV_ROWS.gapMin) {
      const up = gap > 0, gt = fmtPct(gap, lang).replace('+', '');
      out.push({ id: 'dist_skew', text: T(up ? 'ins_dist_up' : 'ins_dist_dn', nm, f(rs.median), f(rs.mean), gt), calc: { title: T('calc_dist'), formula: T('f_dist'), rows: [{ k: T('rs_median'), v: f(rs.median), n: rs.n }, { k: T('rs_avg'), v: f(rs.mean) }, { k: T('rs_gap'), v: fmtPct(gap, lang) }], base },
        ev: nvEv('dist', { median: rs.median, mean: rs.mean, n: rs.n, q1: rs.q1, q3: rs.q3 }, [{ k: 'gap', value: gap, text: gt }], { n: rs.n, method: 'median-mean', refs: [nm] }) });
    }
  }
  const k = (rs.outAbove || 0) + (rs.outBelow || 0), p = k / rs.n * 100;
  if (k > 0 && p >= NV_ROWS.outMinPct && p <= 25) {
    const side = rs.outAbove && rs.outBelow ? 'both' : rs.outAbove ? 'above' : 'below', pt = csPct(p, lang);
    out.push({ id: 'outlier_rows', text: T('ins_outrows', nm, fmtInt(k, lang), fmtInt(rs.n, lang), pt, side), calc: { title: T('calc_outrows'), formula: T('f_outrows'), rows: [{ k: T('rs_outside'), v: fmtInt(k, lang), n: rs.n }, { k: T('rs_range'), v: `${f(Math.max(rs.min, rs.q1 - 1.5 * (rs.q3 - rs.q1)))} – ${f(rs.q3 + 1.5 * (rs.q3 - rs.q1))}` }, { k: T('share'), v: pt }], base },
      ev: nvEv('outrows', { count: k, n: rs.n, q1: rs.q1, q3: rs.q3 }, [{ k: 'p', value: p, text: pt }, { k: 'count', value: k, text: fmtInt(k, lang) }], { n: rs.n, method: 'iqr', refs: [nm] }) });
  }
  const a = rs.assoc;
  if (a && Math.abs(a.rho) >= NV_ROWS.rhoMin && a.n >= NV_ROWS.min && Math.abs(a.rho) * Math.sqrt(a.n - 1) >= NV_ROWS.rhoZ) {
    const rt = a.rho.toFixed(2).replace('.', lang === 'pt' ? ',' : '.');
    out.push({ id: 'assoc', text: T(a.rho > 0 ? 'ins_assoc_p' : 'ins_assoc_n', nm, a.name, rt), calc: { title: T('calc_assoc'), formula: T('f_assoc'), rows: [{ k: 'ρ (Spearman)', v: rt, n: a.n }, { k: T('rs_pairs'), v: fmtInt(a.n, lang) }], base: `${T('rs_base')} · ${nm} × ${a.name}` },
      ev: nvEv('assoc', { rho: a.rho, n: a.n }, [{ k: 'rho', value: a.rho, text: rt }], { n: a.n, method: 'spearman', refs: [nm, a.name] }) });
  }
  // outras dimensões: quem concentra a soma e quem se afasta da média geral por registro
  const aggSum = built.aggKind === 'sum', om = rs.mean, sdAll = rs.sd;
  for (const d of rs.dims || []) {
    const tot = d.groups.reduce((a, g) => a + g.sum, 0), srt = d.groups.slice().sort((a, b) => b.sum - a.sum), top = srt[0];
    if (aggSum && d.groups.length >= 3 && tot > 0 && d.groups.every(g => g.sum >= 0) && top.sum / tot * 100 >= NV_ROWS.dimLeadMin) {
      const sh = csPct(top.sum / tot * 100, lang);
      out.push({ id: 'dim_lead:' + d.name, act: 'dim_lead', text: T('ins_dimlead', d.name, top.label, f(top.sum), sh), calc: { title: T('calc_dimlead'), formula: T('f_dimlead'), rows: [{ k: top.label, v: f(top.sum), n: top.n }, { k: T('total'), v: f(tot) }, { k: T('share'), v: sh }], base: `${T('rs_base')} · ${nm} · ${d.name}` },
        ev: nvEv('lead', { top: top.sum, total: tot }, [{ k: 'share', value: top.sum / tot * 100, text: sh }, { k: 'top', value: top.sum, text: f(top.sum) }], { n: d.groups.length, refs: [top.label, d.name] }) });
    }
    if (om > 0 && sdAll > 0) {
      let best = null; for (const g of d.groups) { if (g.n < 10) continue; const gm = g.sum / g.n, z = (gm - om) / (sdAll / Math.sqrt(g.n)), dev = (gm / om - 1) * 100; if (Math.abs(z) >= nvZNeed(d.groups.length) && Math.abs(dev) >= NV_CFG.gapzDevMin && (!best || Math.abs(z) > Math.abs(best.z))) best = { g, gm, z, dev }; }
      if (best) { const lo = best.dev < 0, dt = fmtPct(best.dev, lang);
        out.push({ id: 'dim_gap:' + d.name, act: 'dim_gap', text: T(lo ? 'ins_dimgap_lo' : 'ins_dimgap_hi', d.name, best.g.label, nm, f(best.gm), f(om), dt), calc: { title: T('calc_dimgap'), formula: T('f_dimgap'), rows: [{ k: best.g.label, v: f(best.gm), n: best.g.n }, { k: T('rs_avg_all'), v: f(om), n: rs.n }, { k: T('rs_gap'), v: dt }], base: `${T('rs_base')} · ${nm} · ${d.name}` },
          ev: nvEv('gapz', { gm: best.gm, om, ng: best.g.n, sd: sdAll, k: d.groups.length }, [{ k: 'dev', value: best.dev, text: dt }], { n: best.g.n, method: 'z', refs: [best.g.label, d.name] }) }); }
    }
  }
  return out;
}


/* ---- pontuação, deduplicação, relações e seleção ---- */
// z mínimo para um grupo se destacar: sobe com o número de grupos comparados (mais comparações, mais chance de acaso)
const nvZNeed = k => NV_CFG.gapzMin + 0.8 * Math.log10(Math.max(1, k));
// pesos e limites são hipóteses de produto (centralizados para calibrar com dados reais), não medidas científicas de importância
Object.assign(NV_CFG, {
  w: { relevance: 0.30, magnitude: 0.25, confidence: 0.30, clarity: 0.15 },
  minConf: 35, capLow: 45, varPenalty: 0.15,
  confK: { period: 5, rows: 40 }, // quanto de amostra leva a ~63% de confiança
  aud: { board: { lead: 8, dominant: 8, conc: 8, trend: 8, jump: 6 }, clevel: { lead: 8, dominant: 8, conc: 8, trend: 8, jump: 6 }, director: {}, team: { contrast: 6, gappp: 6, ratio: 4, dist: 6, outrows: 6 }, client: { lead: 4, trend: 6 } },
});
// família do fenômeno: o que "diz a mesma coisa" cai na mesma classe
const NV_CLASS = { lead: 'top', dominant: 'top', peak: 'top', low: 'bottom', contrast: 'spread', conc: 'conc', jump: 'change', trend: 'trend', outlier: 'atypical', corr: 'assoc', assoc: 'assoc', contrib: 'contrib', shift: 'shift', dist: 'dist', gapz: 'dimgap', outrows: 'atypical-rows', ratio: 'ratio', dropc: 'drop', gappp: 'gap', overview: 'overview' };
const NV_ROWKINDS = new Set(['dist', 'outrows', 'assoc', 'corr']);
const nvClamp = (x, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
// magnitude: medida própria de cada tipo, sempre de 0 a 100 (não compara correlação com variação percentual como se fossem a mesma unidade)
function nvMagnitude(ev) {
  const v = ev.values || {}, k = ev.kind, sh = ev.shown || [], calc = NV_CALC[k] ? NV_CALC[k](v) : {};
  switch (k) {
    case 'peak': case 'low': return { m: 'dev%', x: Math.abs(calc.dev), v: nvClamp(Math.abs(calc.dev)) };
    case 'jump': case 'trend': return { m: 'var%', x: Math.abs(calc.ch), v: nvClamp(Math.abs(calc.ch) * 2) };
    case 'dominant': case 'lead': return { m: 'share', x: calc.share, v: nvClamp(calc.share * 1.25) };
    case 'conc': return { m: 'share', x: calc.p, v: nvClamp(calc.p) };
    case 'contrast': return { m: 'ratio', x: calc.x, v: nvClamp(25 * Math.log2(Math.max(1, calc.x))) };
    case 'outlier': { const iqr = v.q3 - v.q1, out = Math.max(v.value - v.q3, v.q1 - v.value) / (iqr || 1); return { m: 'iqr', x: out, v: nvClamp(40 + 20 * out) }; }
    case 'corr': case 'assoc': return { m: 'rho', x: Math.abs(calc.rho), v: nvClamp(Math.abs(calc.rho) * 100) };
    case 'contrib': return { m: 'share', x: Math.abs(calc.p), v: nvClamp(Math.abs(calc.p)) };
    case 'shift': return { m: 'pp', x: Math.abs(calc.d), v: nvClamp(Math.abs(calc.d) * 8) };
    case 'gapz': return { m: 'dev%', x: Math.abs(calc.dev), v: nvClamp(Math.abs(calc.dev) * 1.2) };
    case 'dist': return { m: 'gap%', x: Math.abs(calc.gap), v: nvClamp(Math.abs(calc.gap) / 2) };
    case 'outrows': return { m: 'share', x: calc.p, v: nvClamp(calc.p * 5) };
    case 'ratio': return { m: 'share', x: calc.p, v: nvClamp(calc.p) };
    case 'dropc': return { m: 'share', x: calc.p, v: nvClamp(calc.p * 1.5) };
    case 'gappp': return { m: 'pp', x: Math.abs(calc.d), v: nvClamp(Math.abs(calc.d) * 3) };
    case 'overview': return { m: 'none', x: 0, v: 0 };
    default: return { m: 'none', x: 0, v: 50 };
  }
}
// ctx: { decision, area, audience }; devolve { score, label, caveats, why } ou null quando não há como pontuar
function nvScore(item, ctx) {
  const ev = item.ev; if (!ev || !NV_CALC[ev.kind]) return null;
  const chk = nvCheckItem(item), w = NV_CFG.w;
  if (chk.errors.length) return null; // inválido não pontua: é descartado pelo validador
  const mg = nvMagnitude(ev);
  const pri = typeof storyPri === 'function' ? storyPri(item, ctx.decision, ctx.area) : 2, aud = ((NV_CFG.aud[ctx.audience] || {})[ev.kind]) || 0;
  const generic = ctx.cases && !/^c_/.test(item.act || '') && item.id !== 'st-ov'; // em casos e pesquisas, o que é específico de casos vem antes dos achados genéricos de período (mesma regra de storyPri para concentração e contraste)
  const relevance = nvClamp(100 - 16 * (generic ? 6 : pri) + (generic ? 0 : aud), 5, 100);
  const n = ev.sampleSize != null ? ev.sampleSize : 0, K = ev.method === 'count' || NV_ROWKINDS.has(ev.kind) ? NV_CFG.confK.rows : NV_CFG.confK.period, expl = chk.warns.filter(x => x.code === 'exploratory').length;
  const confidence = nvClamp(100 * (1 - Math.exp(-n / K)) - 25 * expl);
  const flags = { metric: !!(item.calc && item.calc.rows && item.calc.rows.length), comparison: !!(item.calc && item.calc.rows && item.calc.rows.length >= 2), subject: (ev.refs || []).length > 0, number: (ev.shown || []).length > 0 };
  const clarity = 25 * Object.values(flags).filter(Boolean).length;
  let total = Math.round(w.relevance * relevance + w.magnitude * mg.v + w.confidence * confidence + w.clarity * clarity);
  const weak = confidence < NV_CFG.minConf; if (weak) total = Math.min(total, NV_CFG.capLow); // magnitude alta não compensa evidência fraca
  const label = weak || expl ? 'exploratory' : confidence >= 70 ? 'high' : 'medium';
  return { score: { relevance: Math.round(relevance), magnitude: Math.round(mg.v), confidence: Math.round(confidence), clarity, total }, label, caveats: chk.warns.map(x => x.code),
    why: { relevance: { priority: pri, audience: aud }, magnitude: { measure: mg.m, value: mg.x }, confidence: { n, k: K, penalties: expl }, clarity: flags } };
}
function nvScoreAll(items, ctx) { items.forEach(it => { const r = nvScore(it, ctx || {}); if (r) { it.score = r.score; it.confidenceLabel = r.label; it.caveats = r.caveats; it.scoreWhy = r.why; } }); return items; }

const NV_DIRC = new Set(['change', 'trend', 'shift', 'contrib', 'gap', 'assoc', 'dist']); // classes em que o sinal muda o sentido da afirmação
// classe de um item: nos atos de casos vale o tipo do ato (taxa, impacto, onde varia, causa), não o tipo do cálculo
const nvCls = it => (/^c_/.test(it.act || '') ? it.act : it.ev ? NV_CLASS[it.ev.kind] || it.ev.kind : it.act);
// identidade semântica: classe do fenômeno + assunto + direção
function nvIdentity(it) {
  const ev = it.ev; if (!ev) return null; const k = ev.kind, c = nvCls(it), refs = (ev.refs || []).slice(0, 2).map(x => String(x).toLowerCase()).join('+');
  let dir = '';
  try { const r = NV_DIRC.has(c) && NV_CALC[k] && NV_CALC[k](ev.values || {}); if (r) { const x = r.ch ?? r.dev ?? r.d ?? r.gap ?? r.rho ?? null; dir = x === null ? '' : x >= 0 ? '+' : '-'; } } catch (e) { dir = ''; }
  return `${c}|${refs}|${dir}`;
}
// agrupa afirmações redundantes (mesma classe, assunto e direção): fica a de maior nota e a outra vira evidência complementar dela
function nvDedupe(items) {
  const keep = [], by = new Map(), merged = [];
  items.forEach((it, i) => {
    const key = nvIdentity(it); if (!key || key.split('|')[1] === '') { keep.push(it); return; }
    const hit = by.get(key);
    if (!hit) { by.set(key, it); keep.push(it); return; }
    const best = (it.score ? it.score.total : 0) > (hit.score ? hit.score.total : 0) ? it : hit, other = best === it ? hit : it;
    best.ev = { ...best.ev, extra: [...(best.ev.extra || []), { id: other.id, ev: other.ev }] }; best.related = [...(best.related || []), { id: other.id, rel: 'corrobora' }];
    merged.push({ kept: best.id, merged: other.id, key });
    if (best === it) { keep[keep.indexOf(hit)] = it; by.set(key, it); }
  });
  return { items: keep, merged };
}
// relações entre os achados que ficam: corrobora (mesma classe, assuntos diferentes não entram aqui), complementa (mesmo assunto, classes diferentes), segmenta (contribuição ou mudança de participação sobre uma evolução)
function nvRelations(items) {
  const out = [], ref0 = it => ((it.ev && it.ev.refs) || []).map(x => String(x).toLowerCase());
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j]; if (!a.ev || !b.ev) continue;
    const ca = nvCls(a), cb = nvCls(b), ra = ref0(a), rb = ref0(b), shared = ra.some(x => rb.includes(x)); if (!shared || ca === cb) continue;
    const seg = (x, y) => ['contrib', 'shift'].includes(x) && ['trend', 'change'].includes(y);
    out.push({ a: a.id, b: b.id, rel: seg(ca, cb) || seg(cb, ca) ? 'segmenta' : 'complementa' });
  }
  return out;
}
// seleção determinística: maior nota primeiro, com desconto por repetir a mesma classe de achado; o panorama (sem nota) sempre fica
function nvSelect(items, cap) {
  const idx = items.map((it, i) => i), keep = new Set(), used = {};
  items.forEach((it, i) => { if (it.id === 'st-ov') keep.add(i); });
  const rest = idx.filter(i => !keep.has(i));
  while (keep.size < cap && rest.length) {
    let bi = -1, bv = -1;
    for (const i of rest) { const it = items[i], cl = nvCls(it), base = it.score ? it.score.total : 40, v = base * (1 - NV_CFG.varPenalty * (used[cl] || 0)); if (v > bv + 1e-9) { bv = v; bi = i; } }
    const it = items[bi], cl = nvCls(it); used[cl] = (used[cl] || 0) + 1; keep.add(bi); rest.splice(rest.indexOf(bi), 1);
  }
  return keep;
}
