/* Datavix: evidência estruturada e validador narrativo (gate 1 do motor de história).
 * Cada achado pode trazer `ev`: os valores brutos de onde o número sai, o método e o tamanho da amostra, mais os números que aparecem na tela
 * (`shown`, com o texto exato exibido). O validador recalcula cada número só a partir dos valores brutos e confere se o texto da afirmação
 * contém o número recalculado, sem causalidade em associação e sem acusação em anomalia. Tudo roda no navegador; nada sai dele. */

// pesos e limites centralizados (hipóteses de produto, para calibrar depois com dados reais)
const NV_CFG = {
  minSample: { gappp: 2, dist: 30, outrows: 30, assoc: 30, ratio: 2, dropc: 2, peak: 2, low: 2, jump: 2, trend: 4, dominant: 2, outlier: 8, lead: 3, conc: 6, contrast: 3, corr: 3, contrib: 4, shift: 4, overview: 1 },
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
  trend: v => ({ ch: (v.tail / v.head - 1) * 100 }),
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
};
// o denominador de cada cálculo precisa existir e ser positivo (na contribuição, a variação total pode ser queda: vale o módulo)
const NV_DEN = { gappp: v => Math.min(v.v1, v.v0), ratio: v => v.den, dropc: v => v.cur, dist: v => v.median, outrows: v => v.n, assoc: v => v.n, peak: v => v.sum / v.n, low: v => v.sum / v.n, jump: v => v.prev, trend: v => v.head, dominant: v => v.total, lead: v => v.total, conc: v => v.total, contrast: v => v.low, contrib: v => Math.abs(v.dTotal), shift: v => Math.min(v.t0, v.t1) };

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
const NV_ROWS = { min: 30, assocCols: 8, assocCap: 20000, gapMin: 25, outMinPct: 1, rhoMin: 0.5 };
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
    if (xs.length < NV_ROWS.min) continue; const rho = nvSpearman(xs, ys); if (rho !== null) best.push({ name: c.name, unit: c.unit || null, rho, n: xs.length });
  }
  best.sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho)); if (best[0]) out.assoc = best[0];
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
  if (a && Math.abs(a.rho) >= NV_ROWS.rhoMin && a.n >= NV_ROWS.min) {
    const rt = a.rho.toFixed(2).replace('.', lang === 'pt' ? ',' : '.');
    out.push({ id: 'assoc', text: T(a.rho > 0 ? 'ins_assoc_p' : 'ins_assoc_n', nm, a.name, rt), calc: { title: T('calc_assoc'), formula: T('f_assoc'), rows: [{ k: 'ρ (Spearman)', v: rt, n: a.n }, { k: T('rs_pairs'), v: fmtInt(a.n, lang) }], base: `${T('rs_base')} · ${nm} × ${a.name}` },
      ev: nvEv('assoc', { rho: a.rho, n: a.n }, [{ k: 'rho', value: a.rho, text: rt }], { n: a.n, method: 'spearman', refs: [nm, a.name] }) });
  }
  return out;
}
