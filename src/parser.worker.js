/* Datavix parser worker. Roda isolado da interface.
 * PapaParse e SheetJS são concatenados na frente deste arquivo no build.
 * Entrada:  {type:'load', name, buffer} | {type:'sheet', name} | {type:'retype', col, kind}
 * Saída:    {type:'progress'|'sheets'|'dataset'|'retyped'|'error', ...} */

let RAW = null;   // { header: string[], rows: any[][], fileName, sheet, sheetNames }
let BUF = null, SHEETS = null;   // arquivo xlsx guardado para ler só a aba escolhida

const NULL_RE = /^\s*(|-|--|n\/?a|n\/?d|null|nan|#n\/?a|#valor!|none)\s*$/i;
const isNull = v => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v)) || (typeof v === 'string' && NULL_RE.test(v));

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const UF_NAMES = ['acre', 'alagoas', 'amapa', 'amazonas', 'bahia', 'ceara', 'distrito federal', 'espirito santo', 'goias', 'maranhao', 'mato grosso', 'mato grosso do sul', 'minas gerais', 'para', 'paraiba', 'parana', 'pernambuco', 'piaui', 'rio de janeiro', 'rio grande do norte', 'rio grande do sul', 'rondonia', 'roraima', 'santa catarina', 'sao paulo', 'sergipe', 'tocantins'];
const UF_SET = new Set(UFS.concat(UF_NAMES));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const isUF = s => UF_SET.has(norm(s).length === 2 ? norm(s).toUpperCase() : norm(s));

const MONTHS = { jan: 1, fev: 2, feb: 2, mar: 3, abr: 4, apr: 4, mai: 5, may: 5, jun: 6, jul: 7, ago: 8, aug: 8, set: 9, sep: 9, out: 10, oct: 10, nov: 11, dez: 12, dec: 12 };

const post = (msg, transfer) => postMessage(msg, transfer || []);
const progress = (stage, pct) => post({ type: 'progress', stage, pct });

/* ---------------- números (pt-BR e en-US) ---------------- */
function cleanNumStr(s) {
  let t = String(s).trim().replace(/−/g, '-');
  let neg = false;
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }
  t = t.replace(/(R\$|US\$|\$|€|£|%|\s)/g, '');
  if (/-$/.test(t)) { neg = true; t = t.slice(0, -1); }
  if (!/^[+-]?[\d.,']+$/.test(t) || !/\d/.test(t)) return null;
  return { t: t.replace(/'/g, ''), neg };
}
// voto de separador decimal: +1 vírgula, -1 ponto, 0 ambíguo
function decimalVote(t) {
  const hasDot = t.includes('.'), hasCom = t.includes(',');
  if (hasDot && hasCom) return t.lastIndexOf(',') > t.lastIndexOf('.') ? 1 : -1;
  if (hasCom) {
    if ((t.match(/,/g) || []).length > 1) return -1;           // 1,234,567 → vírgula é milhar
    return /,\d{3}$/.test(t) && /^[+-]?\d{1,3},/.test(t) ? 0 : 1;
  }
  if (hasDot) {
    if ((t.match(/\./g) || []).length > 1) return 1;           // 1.234.567 → ponto é milhar
    return /\.\d{3}$/.test(t) && /^[+-]?\d{1,3}\./.test(t) ? 0 : -1;
  }
  return 0;
}
// "11 dias", "16 Dias.", "3h": número com unidade escrita junto (só quando a pessoa/leitura pede)
const UNIT_TAIL = /\s*(dias?|d|meses|m[eê]s|semanas?|horas?|h|min(utos?)?|anos?|days?|months?|weeks?|hours?|years?)\.?\s*$/i;
function parseNum(s, comma) {
  const c = cleanNumStr(s);
  if (!c) return NaN;
  const t = comma ? c.t.replace(/\./g, '').replace(',', '.') : c.t.replace(/,/g, '');
  const n = Number(t);
  return Number.isFinite(n) ? (c.neg ? -n : n) : NaN;
}

/* ---------------- datas ---------------- */
function validYMD(y, m, d) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
const fixYear = y => (y < 100 ? y + (y < 70 ? 2000 : 1900) : y);
const RE_DMY = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:[ T,]+\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?$/;
const RE_ISO = /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:[ T,]+\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?$/;
const RE_YM = /^(\d{4})[\/\-](\d{1,2})$/;
const RE_MY = /^(\d{1,2})[\/\-](\d{4})$/;
const RE_MON = /^([a-zç]{3,9})\.?[\/\-. ]*(?:de\s+)?(\d{2,4})$/i;

// classifica uma string de data: devolve partes ou null. kind: 'dmy' | 'ymd' | 'ym' | 'mon'
function dateParts(s) {
  s = String(s).trim();
  let m;
  if ((m = RE_ISO.exec(s))) return { k: 'ymd', y: +m[1], m: +m[2], d: +m[3] };
  if ((m = RE_DMY.exec(s))) return { k: 'dmy', a: +m[1], b: +m[2], y: fixYear(+m[3]) };
  if ((m = RE_YM.exec(s))) return { k: 'ymd', y: +m[1], m: +m[2], d: 1 };
  if ((m = RE_MY.exec(s))) return { k: 'ymd', y: +m[2], m: +m[1], d: 1 };
  if ((m = RE_MON.exec(s))) {
    const mo = MONTHS[norm(m[1]).slice(0, 3)];
    if (mo) return { k: 'ymd', y: fixYear(+m[2]), m: mo, d: 1 };
  }
  return null;
}
const excelSerialToMs = n => Math.round((n - 25569) * 86400000);

/* ---------------- inferência de coluna ---------------- */
function inferKind(name, vals) {
  const sample = [];
  for (let i = 0; i < vals.length && sample.length < 2000; i++) if (!isNull(vals[i])) sample.push(vals[i]);
  if (!sample.length) return { kind: 'text' };
  let nDate = 0, nNum = 0, nStr = 0, votes = 0, maxA = 0, maxB = 0, amb = false, nPct = 0, nCur = 0;
  const distinct = new Set();
  let allInt = true, minN = Infinity, maxN = -Infinity;
  for (const v of sample) {
    distinct.add(v instanceof Date ? v.getTime() : v);
    if (v instanceof Date) { nDate++; continue; }
    if (typeof v === 'number') { nNum++; allInt = allInt && Number.isInteger(v); minN = Math.min(minN, v); maxN = Math.max(maxN, v); continue; }
    nStr++;
    const s = String(v);
    const dp = dateParts(s);
    if (dp) {
      nDate++;
      if (dp.k === 'dmy') { maxA = Math.max(maxA, dp.a); maxB = Math.max(maxB, dp.b); if (dp.a <= 12 && dp.b <= 12 && dp.a !== dp.b) amb = true; }
      continue;
    }
    const c = cleanNumStr(s);
    if (c) { nNum++; votes += decimalVote(c.t); if (/%/.test(s)) nPct++; if (/R\$|US\$|\$|€|£/.test(s)) nCur++; const n = parseNum(s, true); if (Number.isFinite(n)) { allInt = allInt && Number.isInteger(n); minN = Math.min(minN, n); maxN = Math.max(maxN, n); } }
  }
  const N = sample.length;
  const geoHits = sample.filter(v => typeof v === 'string' && isUF(v)).length;
  const info = { sampleSize: N, distinct: distinct.size };
  // serial do Excel numa coluna com nome de data
  if (nNum === N && allInt && minN >= 25569 && maxN <= 73050 && /data|date|dia|periodo|período|competencia|competência|^dt/i.test(name)) return { ...info, kind: 'date', serial: true };
  // coluna "Ano" com inteiros plausíveis
  if (nNum === N && allInt && minN >= 1900 && maxN <= 2100 && /^(ano|year|exercicio|exercício)$/i.test(name.trim())) return { ...info, kind: 'date', yearOnly: true };
  if (nDate / N >= 0.9) {
    let order = 'DMY';
    if (maxA > 12) order = 'DMY'; else if (maxB > 12) order = 'MDY';
    return { ...info, kind: 'date', order, ambiguous: order === 'DMY' && maxA <= 12 && amb };
  }
  if (nNum / N >= 0.9) {
    // empate de votos (ex.: só "1.234" ou "1,234"): assume pt-BR, vírgula decimal
    return { ...info, kind: 'number', comma: votes >= 0, unit: nPct / N > 0.5 ? '%' : nCur / N > 0.5 ? 'R$' : null };
  }
  const uniq = distinct.size;
  if (geoHits / N >= 0.8 && uniq <= 60) return { ...info, kind: 'geo' };
  if (uniq <= Math.max(60, N * 0.05) || uniq / N < 0.5) return { ...info, kind: 'category' };
  return { ...info, kind: 'text' };
}

// converte a coluna inteira para o tipo pedido
function buildColumn(name, vals, hint) {
  const n = vals.length;
  const kind = hint.kind;
  const col = { name, kind, n };
  let nulls = 0, parsed = 0;
  if (kind === 'number') {
    const arr = new Float64Array(n);
    const comma = hint.comma !== false;
    for (let i = 0; i < n; i++) {
      const v = vals[i];
      if (isNull(v)) { arr[i] = NaN; nulls++; continue; }
      const x = typeof v === 'number' ? v : v instanceof Date ? v.getTime() : parseNum(hint.units && typeof v === 'string' ? v.replace(UNIT_TAIL, '') : v, comma);
      if (Number.isNaN(x)) { arr[i] = NaN; nulls++; } else { arr[i] = x; parsed++; }
    }
    col.data = arr; col.unit = hint.unit || null; col.comma = comma;
    const sorted = Array.from(arr).filter(x => !Number.isNaN(x)).sort((a, b) => a - b);
    if (sorted.length) {
      const q = p => sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))];
      const q1 = q(0.25), q3 = q(0.75), iqr = q3 - q1;
      col.min = sorted[0]; col.max = sorted[sorted.length - 1];
      col.mean = sorted.reduce((s, x) => s + x, 0) / sorted.length;
      col.outliers = iqr > 0 ? sorted.filter(x => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr).length : 0;
    }
  } else if (kind === 'date') {
    const arr = new Float64Array(n);
    const mdy = hint.order === 'MDY';
    for (let i = 0; i < n; i++) {
      const v = vals[i];
      if (isNull(v)) { arr[i] = NaN; nulls++; continue; }
      let ms = NaN;
      if (v instanceof Date) ms = Date.UTC(v.getFullYear(), v.getMonth(), v.getDate());
      else if (typeof v === 'number') ms = hint.yearOnly ? Date.UTC(v, 0, 1) : excelSerialToMs(v);
      else {
        const p = dateParts(v);
        if (p) {
          let y, m, d;
          if (p.k === 'dmy') { y = p.y; m = mdy ? p.a : p.b; d = mdy ? p.b : p.a; } else { y = p.y; m = p.m; d = p.d; }
          if (validYMD(y, m, d)) ms = Date.UTC(y, m - 1, d);
        }
      }
      if (Number.isNaN(ms)) { arr[i] = NaN; nulls++; } else { arr[i] = ms; parsed++; }
    }
    col.data = arr; col.order = hint.order || 'DMY'; col.ambiguous = !!hint.ambiguous;
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < n; i++) { const x = arr[i]; if (!Number.isNaN(x)) { if (x < mn) mn = x; if (x > mx) mx = x; } }
    col.min = mn; col.max = mx;
  } else if (kind === 'category' || kind === 'geo') {
    const dict = [], idx = new Map(), codes = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      const v = vals[i];
      if (isNull(v)) { codes[i] = -1; nulls++; continue; }
      const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v).trim();
      let c = idx.get(s);
      if (c === undefined) { c = dict.length; dict.push(s); idx.set(s, c); }
      codes[i] = c; parsed++;
    }
    col.codes = codes; col.dict = dict; col.distinct = dict.length;
  } else {
    const arr = new Array(n);
    for (let i = 0; i < n; i++) { const v = vals[i]; if (isNull(v)) { arr[i] = null; nulls++; } else { arr[i] = String(v); parsed++; } }
    col.texts = arr; col.kind = 'text';
  }
  col.nulls = nulls; col.parsedPct = n ? parsed / n : 0;
  return col;
}

/* ---------------- leitura de arquivo ---------------- */
function decodeText(buf) {
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); }
  catch (e) { text = new TextDecoder('windows-1252').decode(buf); return { text, encoding: 'windows-1252' }; }
  return { text: text.replace(/^﻿/, ''), encoding: 'utf-8' };
}

function cleanHeader(h, n) {
  const seen = new Map();
  const out = [];
  for (let i = 0; i < n; i++) {
    let s = h && h[i] != null ? String(h[i]).trim() : '';
    if (!s) s = 'Coluna ' + (i + 1);
    const c = seen.get(s) || 0;
    seen.set(s, c + 1);
    out.push(c ? s + ' (' + (c + 1) + ')' : s);
  }
  return out;
}

/* ---------------- arrumação da estrutura (regras, sem IA; nunca altera um valor) ----------------
 * 1) linhas de título acima do cabeçalho; 2) colunas totalmente vazias; 3) linhas de total, subtotal e rodapé;
 * 4) colunas de período (meses, anos, trimestres) desdobradas em linhas (Período e Valor).
 * Cada arrumação é relatada à pessoa e pode ser desfeita (opts). */
const FIX_ON = { title: true, totals: true, unpivot: true };
let ORIG = null, ORIG_META = null;
const median = a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const fillOf = r => r.filter(v => !isNull(v)).length;
const strShare = r => { const c = r.filter(v => !isNull(v)); return c.length ? c.filter(v => typeof v === 'string' && !cleanNumStr(v) && !dateParts(v)).length / c.length : 0; };
// cabeçalho: texto que não é número nem data completa (nomes de mês como "jan/25" valem como rótulo) ou uma sequência de anos como 2022, 2023, 2024
function isHeaderRow(first, next) {
  const nn = first.filter(v => !isNull(v)), words = nn.filter(v => typeof v === 'string' && v.trim() && !cleanNumStr(v) && (!dateParts(v) || /[a-zA-ZÀ-ÿ]/.test(v)));
  if (words.length >= Math.max(1, Math.ceil(nn.length * 0.6))) return true;
  const yrs = nn.filter(v => typeof v === 'number' && Number.isInteger(v) && v >= 1990 && v <= 2100);
  return yrs.length >= 3 && words.length >= 1 && yrs.length + words.length === nn.length && !(next && next.filter(v => typeof v === 'number' && Number.isInteger(v) && v >= 1990 && v <= 2100).length >= 3);
}
const TOTAL_EXACT = /^\s*(total( geral)?|subtotal|totais|soma|grand total|total général|sum)\s*:?\s*$/i, TOTAL_LEAD = /^\s*(sub ?total|total)\b/i;
const numOf = v => (typeof v === 'number' ? v : typeof v === 'string' ? (() => { const c = cleanNumStr(v); return c ? parseNum(v, decimalVote(c.t) >= 0) : NaN; })() : NaN);

// período no cabeçalho: devolve uma data local (mês, trimestre ou ano) ou um rótulo de mês sem ano
function periodHeader(h) {
  if (h === null || h === undefined) return null;
  if (h instanceof Date) return { v: h };
  if (typeof h === 'number' && Number.isInteger(h) && h >= 1990 && h <= 2100) return { v: new Date(h, 0, 1) };
  const s = String(h).trim(); let m;
  if (/^(19|20)\d\d$/.test(s)) return { v: new Date(+s, 0, 1) };
  if ((m = /^(?:q|t)([1-4])[\s\/\-.]*((?:19|20)?\d\d)$/i.exec(s))) return { v: new Date(fixYear(+m[2]), (+m[1] - 1) * 3, 1) };
  if ((m = /^((?:19|20)\d\d)[\s\/\-.]*(?:q|t)([1-4])$/i.exec(s))) return { v: new Date(+m[1], (+m[2] - 1) * 3, 1) };
  const dp = dateParts(s); if (dp && dp.k === 'ymd') return { v: new Date(dp.y, dp.m - 1, dp.d) };
  if (dp && dp.k === 'dmy' && dp.b >= 1 && dp.b <= 12 && dp.a >= 1 && dp.a <= 31) return { v: new Date(dp.y, dp.b - 1, dp.a) };
  if (/^[a-zç]{3,9}\.?$/i.test(s) && MONTHS[norm(s).slice(0, 3)]) return { label: s };
  return null;
}

function restructure(matrix, opts) {
  opts = { ...FIX_ON, ...(opts || {}) };
  const fixes = {};
  let rows = matrix.filter(r => r && r.some(v => !isNull(v)));
  if (!rows.length) throw new Error('empty');
  // 1) linhas de título acima do cabeçalho
  let hdr = 0;
  { const n = Math.min(rows.length, 40), fills = rows.slice(0, n).map(fillOf), W = median(fills.slice(Math.min(4, n - 1)).length ? fills.slice(Math.min(4, n - 1)) : fills);
    for (let i = 0; i < Math.min(12, n); i++) {
      if (fills[i] >= Math.max(2, 0.6 * W) && strShare(rows[i]) >= 0.6 && (i + 1 >= rows.length || fills[i + 1] >= 0.5 * fills[i])) { if (i > 0 && fills.slice(0, i).every(f => f <= 0.5 * fills[i])) hdr = i; break; }
    } }
  if (hdr > 0) { fixes.title = { n: hdr, texts: rows.slice(0, hdr).map(r => String(r.find(v => !isNull(v)))).map(t => t.slice(0, 80)) }; if (opts.title) rows = rows.slice(hdr); }
  const ncols0 = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const first = rows[0];
  const headerLike = isHeaderRow(first, rows[1]);
  let header = headerLike ? first.slice() : [], body = headerLike ? rows.slice(1) : rows;
  // 2) colunas sem cabeçalho e sem nenhum valor
  { const keep = []; for (let c = 0; c < ncols0; c++) { if (!isNull(header[c]) || body.some(r => !isNull(r[c]))) keep.push(c); }
    if (keep.length < ncols0) { fixes.emptyCols = ncols0 - keep.length; header = header.length ? keep.map(c => header[c]) : header; body = body.map(r => keep.map(c => r[c])); } }
  const ncols = Math.max(header.length, body.reduce((m, r) => Math.max(m, r.length), 0));
  // 3) linhas de total, subtotal e rodapé
  if (headerLike && body.length >= 4) {
    const numCols = []; for (let c = 0; c < ncols; c++) { let nn = 0, tot = 0; for (let i = 0; i < Math.min(body.length, 300); i++) { const v = body[i][c]; if (isNull(v)) continue; tot++; if (Number.isFinite(numOf(v))) nn++; } if (tot >= 3 && nn / tot >= 0.8) numCols.push(c); }
    const drop = new Set(), labels = []; let acc = new Array(ncols).fill(0), accAll = new Array(ncols).fill(0);
    body.forEach((r, i) => {
      const lab = r.find(v => typeof v === 'string' && TOTAL_LEAD.test(v)), exact = r.some(v => typeof v === 'string' && TOTAL_EXACT.test(v));
      if (lab !== undefined && numCols.length) {
        let ok = 0, tried = 0; numCols.forEach(c => { const v = numOf(r[c]); if (!Number.isFinite(v)) return; tried++; if ([acc[c], accAll[c]].some(a => Math.abs(v - a) <= Math.max(1e-9, Math.abs(a) * 0.005))) ok++; });
        const verified = tried > 0 && ok / tried >= 0.5;
        if (verified || exact) { drop.add(i); labels.push(String(lab).slice(0, 40)); acc = new Array(ncols).fill(0); return; }
      }
      numCols.forEach(c => { const v = numOf(r[c]); if (Number.isFinite(v)) { acc[c] += v; accAll[c] += v; } });
    });
    // rodapé: últimas linhas com um só valor de texto (fonte, observação)
    let e = body.length; while (e > 1 && !drop.has(e - 1) && fillOf(body[e - 1]) <= 1 && typeof body[e - 1].find(v => !isNull(v)) === 'string' && ncols >= 3) { drop.add(e - 1); labels.push(String(body[e - 1].find(v => !isNull(v))).slice(0, 40)); e--; }
    if (drop.size) { fixes.totals = { n: drop.size, labels: labels.slice(0, 4) }; if (opts.totals) body = body.filter((_, i) => !drop.has(i)); }
  }
  // 4) colunas de período desdobradas em linhas
  if (headerLike && body.length >= 2 && header.length >= 4) {
    let best = null, run = null;
    for (let c = 0; c <= header.length; c++) {
      const ph = c < header.length ? periodHeader(header[c]) : null;
      let isNumCol = false;
      if (ph) { let nn = 0, tot = 0; for (let i = 0; i < Math.min(body.length, 200); i++) { const v = body[i][c]; if (isNull(v)) continue; tot++; if (Number.isFinite(numOf(v))) nn++; } isNumCol = tot > 0 && nn / tot >= 0.7; }
      if (ph && isNumCol) { if (!run) run = { a: c, z: c }; else run.z = c; } else { if (run && (!best || run.z - run.a > best.z - best.a)) best = run; run = null; }
    }
    if (best && best.z - best.a + 1 >= 3) {
      const pc = []; for (let c = best.a; c <= best.z; c++) pc.push(c);
      const others = []; for (let c = 0; c < header.length; c++) if (c < best.a || c > best.z) others.push(c);
      const isNumeric = c => { let nn = 0, tot = 0; for (let i = 0; i < Math.min(body.length, 200); i++) { const v = body[i][c]; if (isNull(v)) continue; tot++; if (Number.isFinite(numOf(v))) nn++; } return tot >= 2 && nn / tot >= 0.8; };
      const totalish = c => /^(total|soma|acumulado|acum\.?|m[eé]dia|ytd|sum|average)\b/i.test(String(header[c] || '').trim());
      const dropC = others.filter(c => isNumeric(c) && totalish(c)), keepC = others.filter(c => !dropC.includes(c)), blocker = keepC.filter(isNumeric);
      const info = { k: pc.length, first: String(header[best.a]), last: String(header[best.z]), dropped: dropC.map(c => String(header[c])).slice(0, 3) };
      if (!keepC.length) fixes.unpivot = { skipped: 'noid', ...info };
      else if (blocker.length) fixes.unpivot = { skipped: 'numeric', ...info, cols: blocker.map(c => String(header[c])).slice(0, 3) };
      else {
        fixes.unpivot = { ...info, rows: 0 };
        if (opts.unpivot) {
          const out = []; const pv = pc.map(c => periodHeader(header[c]));
          body.forEach(r => { pc.forEach((c, k) => { const v = r[c]; if (isNull(v)) return; out.push([...keepC.map(cc => r[cc]), pv[k].v || pv[k].label, v]); }); });
          fixes.unpivot.rows = out.length; header = [...keepC.map(c => header[c]), 'Período', 'Valor']; body = out;
        }
      }
    }
  }
  return { header: headerLike ? header : [], rows: headerLike ? body : body, headerLike, fixes, ncols: Math.max(header.length, body.reduce((m, r) => Math.max(m, r.length), 0)) };
}

function setRows(matrix, meta, opts) {
  ORIG = matrix; ORIG_META = meta; FIXES_OPTS = { ...FIX_ON, ...(opts || {}) };
  const R = restructure(matrix, FIXES_OPTS);
  const header = R.headerLike ? cleanHeader(R.header, R.ncols) : cleanHeader([], R.ncols);
  RAW = { header, rows: R.rows, ncols: R.ncols, fixes: R.fixes, fixOpts: FIXES_OPTS, ...meta };
}
let FIXES_OPTS = { ...FIX_ON };

function sigRows(rows) {
  const seen = new Set();
  let dups = 0;
  for (let i = 0; i < rows.length; i++) {
    const s = rows[i].join('\u0001');
    if (seen.has(s)) dups++; else seen.add(s);
  }
  return dups;
}

function analyze() {
  const { header, rows, ncols } = RAW;
  const n = rows.length;
  progress('types', 0.55);
  const cols = [], raw = [];
  for (let c = 0; c < ncols; c++) {
    const vals = new Array(n);
    for (let i = 0; i < n; i++) vals[i] = rows[i][c] === undefined ? null : rows[i][c];
    raw.push(vals);
  }
  RAW.cols = raw;
  RAW.hints = [];
  for (let c = 0; c < ncols; c++) {
    const hint = inferKind(header[c], raw[c]);
    RAW.hints.push(hint);
    cols.push(buildColumn(header[c], raw[c], hint));
    progress('types', 0.55 + 0.35 * ((c + 1) / ncols));
  }
  const dupRows = sigRows(rows);
  const preview = rows.slice(0, 10).map(r => header.map((_, c) => {
    const v = r[c];
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return v === null || v === undefined ? '' : String(v);
  }));
  const transfer = [];
  for (const col of cols) { if (col.data) transfer.push(col.data.buffer); if (col.codes) transfer.push(col.codes.buffer); }
  post({ type: 'dataset', fileName: RAW.fileName, sheet: RAW.sheet || null, sheetNames: RAW.sheetNames || null, encoding: RAW.encoding || null, delimiter: RAW.delimiter || null, rowCount: n, columns: cols, preview, dupRows, fixes: RAW.fixes || {}, fixOpts: RAW.fixOpts || null, restructure: !!RAW.restructured }, transfer);
}

// lê só a aba escolhida e só os valores (sem fórmulas, HTML nem texto formatado): bem mais leve em planilhas grandes
function loadSheet(name) {
  progress('read', 0.2);
  const wb = XLSX.read(new Uint8Array(BUF), { type: 'array', cellDates: true, dense: true, sheets: name, cellFormula: false, cellHTML: false, cellText: false, cellNF: false, sheetStubs: false });
  progress('read', 0.5);
  const ws = wb.Sheets[name];
  if (!ws) throw new Error('aba "' + name + '" não encontrada');
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: false });
  progress('read', 0.52);
  setRows(matrix, { fileName: RAW ? RAW.fileName : '', sheet: name, sheetNames: SHEETS });
  analyze();
}

self.onmessage = e => {
  const m = e.data;
  try {
    if (m.type === 'load') {
      progress('read', 0.05);
      const ext = (m.name.split('.').pop() || '').toLowerCase();
      if (['xlsx', 'xls', 'xlsm'].includes(ext)) {
        BUF = m.buffer; RAW = { fileName: m.name };
        // 1) só os nomes das abas (rápido, não lê as células)
        SHEETS = XLSX.read(new Uint8Array(BUF), { type: 'array', bookSheets: true }).SheetNames;
        progress('read', 0.15);
        if (SHEETS.length > 1 && !m.sheet) { post({ type: 'sheets', names: SHEETS, fileName: m.name }); return; }
        // 2) as células, só da aba escolhida
        loadSheet(m.sheet || SHEETS[0]);
      } else {
        const { text, encoding } = decodeText(m.buffer);
        progress('read', 0.3);
        const res = Papa.parse(text, { delimitersToGuess: [';', ',', '\t', '|'], skipEmptyLines: 'greedy' });
        progress('read', 0.5);
        setRows(res.data, { fileName: m.name, encoding, delimiter: res.meta.delimiter });
        analyze();
      }
    } else if (m.type === 'sheet') {
      loadSheet(m.name);
    } else if (m.type === 'restructure') {
      setRows(ORIG, ORIG_META, m.opts); RAW.restructured = true; analyze();
    } else if (m.type === 'retype') {
      const c = m.col;
      const hint = inferKindForced(c, m.kind);
      if (m.units) hint.units = true;
      if (m.order) { hint.order = m.order; hint.ambiguous = false; }
      RAW.hints[c] = hint;
      const col = buildColumn(RAW.header[c], RAW.cols[c], hint);
      const transfer = [];
      if (col.data) transfer.push(col.data.buffer);
      if (col.codes) transfer.push(col.codes.buffer);
      post({ type: 'retyped', col: c, column: col }, transfer);
    }
  } catch (err) {
    post({ type: 'error', message: String((err && err.message) || err) });
  }
};

// reaproveita a detecção de formato (vírgula/ordem de data) mas força o tipo
function inferKindForced(c, kind) {
  const vals = RAW.cols[c];
  const base = inferKind(RAW.header[c], vals);
  const h = { ...base, kind };
  if (kind === 'number' && base.comma === undefined) {
    let votes = 0;
    for (let i = 0; i < vals.length && i < 2000; i++) { const cl = typeof vals[i] === 'string' ? cleanNumStr(vals[i]) : null; if (cl) votes += decimalVote(cl.t); }
    h.comma = votes >= 0;
  }
  if (kind === 'date' && !base.order) { h.order = 'DMY'; }
  return h;
}
