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
      const x = typeof v === 'number' ? v : v instanceof Date ? v.getTime() : parseNum(v, comma);
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

function setRows(matrix, meta) {
  matrix = matrix.filter(r => r && r.some(v => !isNull(v)));
  if (!matrix.length) throw new Error('empty');
  const ncols = matrix.reduce((m, r) => Math.max(m, r.length), 0);
  const first = matrix[0];
  const headerLike = first.filter(v => typeof v === 'string' && v.trim() && !cleanNumStr(v) && !dateParts(v)).length >= Math.max(1, Math.ceil(first.filter(v => !isNull(v)).length * 0.6));
  const header = headerLike ? cleanHeader(first, ncols) : cleanHeader([], ncols);
  const rows = headerLike ? matrix.slice(1) : matrix;
  RAW = { header, rows, ncols, ...meta };
}

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
  post({ type: 'dataset', fileName: RAW.fileName, sheet: RAW.sheet || null, sheetNames: RAW.sheetNames || null, encoding: RAW.encoding || null, delimiter: RAW.delimiter || null, rowCount: n, columns: cols, preview, dupRows }, transfer);
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
    } else if (m.type === 'retype') {
      const c = m.col;
      const hint = inferKindForced(c, m.kind);
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
