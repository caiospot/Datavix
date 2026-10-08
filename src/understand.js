/* Datavix: leitura inteligente da planilha. Reconhece o papel de cada coluna e o tipo da planilha pelos VALORES e padrões (nomes só ajudam),
 * para qualquer arquivo: identificadores, dados pessoais, texto livre, sim/não, categorias, datas e o tipo de medida.
 * Nada aqui altera a planilha: os papéis são sugestões que a pessoa confirma ou corrige na tela "Como li a sua planilha". */
const U_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const U_CPF = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, U_CNPJ = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, U_PHONE = /^\+?\d[\d\s().-]{8,}\d$/;
const U_NAME_PRIVATE = /(^|[^a-z])(e-?mail|cpf|cnpj|rg|telefone|fone|phone|celular|whats(app)?|msisdn|endere[cç]o|address|logradouro|cep|nascimento|birth)([^a-z]|$)/i;
const U_NAME_PERSON = /(^|[^a-z])(nome|name|respons[aá]vel|solicitante|analista|vendedor|colaborador|funcion[aá]rio|usu[aá]rio|user|contato|paciente|aluno|titular|gerente|atendente|operador|t[eé]cnico|representante|consultor|agente|autor|owner)([^a-z]|$)/i;
const U_NAME_CUSTOMER = /(^|[^a-z])(cliente|customer|client)([^a-z]|$)/i;
const U_NAME_NOTPERSON = /(produto|product|item|empresa|company|unidade|loja|store|campanha|campaign|cidade|city|categoria|category|marca|brand|setor|projeto|project|arquivo|file|canal|channel|jornada|journey|segmento|regi[aã]o)/i;
const U_NAME_PHONE = /(tel|fone|phone|celular|whats|msisdn|contato|contrato)/i;
const U_NAME_ID = /(^|[^a-z])(id|c[oó]digo|code|cod|n[uú]mero|num|n[ºo°]|protocolo|ticket|caso|pedido|chave|key|uuid|guid|ref|refer[eê]ncia|matr[ií]cula|sku|serial|lote|nf|contrato|lead|conta|chamado|ordem|os)([^a-z]|$)/i;
const U_MEASURE_NAME = /receita|valor|venda|faturamento|revenue|total|amount|sales|realizado|custo|cost|lucro|profit|pre[cç]o|price/i;
const U_NAME_ATTR = /(taxa|rate|margem|margin|percent|%|(^|[^a-z])idade|(^|[^a-z])age([^a-z]|$)|pre[cç]o|price|ticket m[eé]dio|m[eé]dia|average|avg|desconto|discount|peso|weight|altura|temperatura)/i;
const U_NAME_DURATION = /(dias|days|dura[cç][aã]o|duration|tempo|prazo|esfor[cç]o|sla|tat|meses|months|horas|hours)/i;
const U_NAME_SCORE = /(nps|nota|score|rating|avalia|satisfa|csat|ces)/i;
const U_NAME_COUNT = /(qtd|quant|qty|count|n[ºo°] de|n[uú]mero de|pedidos|tickets|visitas|volume|unidades)/i;
const uNorm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// valores da coluna com a contagem de cada um (categorias) ou amostra (texto)
function uValues(c, cap = 600) {
  const out = [];
  if (c.dict && c.codes) { const cnt = new Array(c.dict.length).fill(0); for (let i = 0; i < c.codes.length; i++) if (c.codes[i] >= 0) cnt[c.codes[i]]++; c.dict.forEach((v, i) => out.push([v, cnt[i]])); }
  else if (c.texts) { const seen = new Map(); for (let i = 0; i < c.texts.length && seen.size < cap; i++) { const v = c.texts[i]; if (v != null) seen.set(v, (seen.get(v) || 0) + 1); } seen.forEach((n, v) => out.push([v, n])); }
  return out;
}
const uShare = (vals, test) => { let a = 0, t = 0; for (const [v, n] of vals) { t += n; if (test(String(v))) a += n; } return t ? a / t : 0; };

// sim / não / não se aplica, em português ou inglês
function uFlagClass(v) {
  const s = uNorm(v).replace(/[.()]/g, '').trim();
  if (/^(n\/?a|na|n\/?d|nd|nao se aplica|nao aplicavel|-|\?|sem informacao|nao informado)$/.test(s)) return 'na';
  if (/^(sim|s|yes|y|true|verdadeiro|ok|resolvido|concluido)(\b|$)/.test(s)) return 'pos';
  if (/^(nao|n|no|false|falso)(\b|$)/.test(s)) return 'neg';
  return null;
}

function uProfileColumn(c, nRows, area) {
  const nonNull = (c.n || nRows) - (c.nulls || 0), name = String(c.name || ''), r = { role: 'category', why: '' };
  c.hide = false; c.mtype = null; c.flagMap = null; c.retype = null; c.retypeUnits = false;
  if (nonNull <= 0) { c.role = 'empty'; c.hide = true; c.why = 'vazia'; return c; }
  const distinct = c.dict ? c.dict.length : c.texts ? new Set(c.texts.filter(v => v != null && v !== '')).size : c.distinct || 0;
  if (c.kind === 'date') { c.role = 'date'; return c; }
  const vals = c.kind === 'number' ? [] : uValues(c), avgLen = vals.length ? vals.reduce((a, [v, n]) => a + String(v).length * n, 0) / Math.max(1, vals.reduce((a, [, n]) => a + n, 0)) : 0;
  // dados pessoais: padrões nos valores primeiro, nomes de coluna só reforçam
  if (c.kind !== 'number') {
    const email = uShare(vals, v => U_EMAIL.test(v.trim())), cpf = uShare(vals, v => U_CPF.test(v.trim()) || U_CNPJ.test(v.trim()));
    const phone = uShare(vals, v => { const d = v.replace(/\D/g, ''); return U_PHONE.test(v.trim()) && d.length >= 10 && d.length <= 13; });
    const tokens = v => v.trim().split(/\s+/), person = uShare(vals, v => { const t = tokens(v); return t.length >= 2 && t.length <= 5 && t.every(x => /^[\p{L}][\p{L}'.\-]*$/u.test(x)); });
    const ratio = distinct / nonNull;
    if (email >= 0.6) { c.role = 'pii'; c.why = 'e-mail'; }
    else if (cpf >= 0.6) { c.role = 'pii'; c.why = 'documento'; }
    else if (phone >= 0.6 && U_NAME_PHONE.test(name)) { c.role = 'pii'; c.why = 'telefone'; }
    else if (U_NAME_PRIVATE.test(name) && (U_NAME_PRIVATE.exec(name)[2] || '').length && avgLen > 0) { c.role = 'pii'; c.why = 'dado de contato'; }
    else if (areaHit(area, 'pii', name) && person >= 0.7 && distinct >= 3 && (U_NAME_CUSTOMER.test(name) ? ratio >= 0.6 : ratio >= 0.1) && !U_NAME_NOTPERSON.test(name)) { c.role = 'pii'; c.why = 'nome de pessoa'; }
    else if (person >= 0.7 && distinct >= 3 && !U_NAME_NOTPERSON.test(name) && ((U_NAME_PERSON.test(name) && (!U_NAME_CUSTOMER.test(name) || ratio >= 0.6)) || (U_NAME_CUSTOMER.test(name) && ratio >= 0.85))) { c.role = 'pii'; c.why = 'nome de pessoa'; }
    if (c.role === 'pii') { c.hide = true; return c; }
  }
  // identificadores: únicos e com cara de código; nunca viram medida nem grupo
  if (c.kind === 'number') {
    const arr = c.data, N = arr.length; let ints = 0, n2 = 0, digits = 0; const seen = new Set(); let sorted = true, prev = -Infinity;
    for (let i = 0; i < N && n2 < 20000; i++) { const x = arr[i]; if (Number.isNaN(x)) continue; n2++; if (Number.isInteger(x)) ints++; seen.add(x); digits = Math.max(digits, String(Math.abs(Math.trunc(x))).length); if (x < prev) sorted = false; prev = x; }
    const uq = seen.size / Math.max(1, n2), isInt = ints === n2;
    if (isInt && uq >= 0.95 && n2 >= 8 && !U_MEASURE_NAME.test(name) && (U_NAME_ID.test(name) || areaHit(area, 'id', name) || digits >= 9 || (sorted && c.min <= 1) || /^(id|#)$/i.test(name.trim()))) { c.role = 'id'; c.why = 'identificador'; return c; }
    if (isInt && digits >= 10 && uq >= 0.9 && U_NAME_PHONE.test(name)) { c.role = 'pii'; c.hide = true; c.why = 'telefone'; return c; }
    c.role = 'measure'; const uniq = seen.size;
    const smallInt = (isInt && c.min >= 0 && c.max <= 10 && uniq <= 11) || (isInt && c.min >= 1 && c.max <= 5), at = areaMeasureType(area, name);
    if (at) c.mtype = at; // o nome casa com o vocabulário da área
    else if (U_NAME_SCORE.test(name) && c.max <= 100 && c.min >= -100) c.mtype = 'score';
    else if (c.unit === '%' || U_NAME_ATTR.test(name)) c.mtype = 'attr';
    else if (U_NAME_DURATION.test(name)) c.mtype = 'duration';
    else if (U_NAME_COUNT.test(name) || U_MEASURE_NAME.test(name)) c.mtype = U_NAME_COUNT.test(name) && !U_MEASURE_NAME.test(name) ? 'count' : 'amount';
    else c.mtype = smallInt ? 'score' : 'amount';
    c.agg = c.mtype === 'amount' || c.mtype === 'count' ? 'sum' : 'mean';
    return c;
  }
  const codeLike = uShare(vals, v => { const s = v.trim(); return s.length <= 28 && !/\s/.test(s) && /\d/.test(s); });
  if (nonNull >= 8 && distinct / nonNull >= 0.9 && (U_NAME_ID.test(name) || areaHit(area, 'id', name) || codeLike >= 0.8)) { c.role = 'id'; c.why = 'identificador'; return c; }
  // textos curtos e quase únicos (nome da unidade, código do pedido) identificam a linha; só frases viram texto livre
  const words = vals.length ? vals.reduce((a, [v, n]) => a + String(v).trim().split(/\s+/).length * n, 0) / Math.max(1, vals.reduce((a, [, n]) => a + n, 0)) : 0;
  const numTxt = uShare(vals, v => /^-?[\d.,\s]+$/.test(v) && /\d/.test(v)), numUnit = uShare(vals, v => /^-?[\d.,]+\s*(dias?|d|meses|m[eê]s|semanas?|horas?|h|min(utos?)?|anos?|days?|months?|weeks?|hours?|years?)\.?\s*$/i.test(v.trim()));
  if (c.kind === 'text' || c.kind === 'category') if (vals.length >= 3 && numTxt + numUnit >= 0.8 && numTxt + numUnit > 0) { c.retype = 'number'; c.retypeUnits = numUnit > 0; c.role = 'measure'; c.mtype = U_NAME_DURATION.test(name) || numUnit > 0 ? 'duration' : 'amount'; c.agg = c.mtype === 'duration' ? 'mean' : 'sum'; return c; } // números guardados como texto
  if (c.kind === 'text' && avgLen <= 30 && words <= 4 && distinct / nonNull < 0.85 && distinct >= 2) { c.retype = 'category'; c.role = 'category'; return c; } // repete: é categoria
  if (c.kind === 'text' && avgLen <= 40 && words <= 4) { c.role = 'id'; c.why = 'identificador'; return c; }
  if (c.kind === 'text' || avgLen > 60) { c.role = 'text'; c.why = 'texto livre'; return c; }
  // sim / não: poucas respostas que se leem como positivo e negativo
  if (distinct <= 8) {
    const cls = uShare(vals, v => !!uFlagClass(v)), has = k => vals.some(([v]) => uFlagClass(v) === k);
    if (cls >= 0.85 && has('pos') && has('neg')) { c.role = 'flag'; c.flagMap = {}; vals.forEach(([v]) => { c.flagMap[v] = uFlagClass(v) || 'other'; }); return c; }
  }
  if (distinct <= 1) { c.role = 'constant'; c.hide = true; c.why = 'um só valor'; return c; }
  c.role = c.kind === 'geo' ? 'geo' : 'category';
  return c;
}

/* ---- resumo já somado: a data e as categorias formam uma grade completa, cada combinação aparece uma vez ---- */
function uGrid(live, nRows) {
  const g = live.filter(c => (c.role === 'date' && c.kind === 'date') || ((c.role === 'category' || c.role === 'geo') && c.dict && c.dict.length >= 2 && c.dict.length <= 40));
  const dates = g.filter(c => c.kind === 'date').slice(0, 1), cats = g.filter(c => c.kind !== 'date');
  if (nRows < 6 || !live.some(c => c.role === 'measure') || live.some(c => c.role === 'id' || c.role === 'text' || c.role === 'flag') || dates.length + cats.length < 2 || cats.length > 2) return 0;
  let prod = 1; const parts = [...dates, ...cats]; parts.forEach(c => { prod *= c.kind === 'date' ? new Set(Array.from(c.data).filter(x => !Number.isNaN(x))).size : c.dict.length; });
  const seen = new Set(); for (let i = 0; i < nRows; i++) { const k = parts.map(c => (c.kind === 'date' ? c.data[i] : c.codes[i])).join('|'); if (seen.has(k)) return 0; seen.add(k); }
  return prod > 0 && nRows / prod >= 0.8 ? Math.round(nRows / prod * 100) : 0;
}
/* ---- tipo da planilha: o que é cada linha? ---- */
function uShape(cols, nRows, area) {
  const live = cols.filter(c => !['empty', 'constant'].includes(c.role)), n = Math.max(1, live.length);
  const flags = live.filter(c => c.role === 'flag').length, texts = live.filter(c => c.role === 'text').length, dates = live.filter(c => c.role === 'date').length;
  const amounts = live.filter(c => c.role === 'measure' && c.mtype === 'amount' && U_MEASURE_NAME.test(c.name) && (c.nulls || 0) / Math.max(1, c.n || nRows) < 0.4).length;
  const textShare = texts / n, why = [];
  let cases = 0;
  if (flags >= 4) { cases += 4; why.push(['flags', flags]); } else if (flags >= 3) { cases += 2; why.push(['flags', flags]); } else if (flags >= 2) { cases += 1; why.push(['flags', flags]); }
  if (textShare >= 0.25) { cases += 2; why.push(['texts', texts]); } else if (texts >= 2) { cases += 1; why.push(['texts', texts]); }
  if (flags >= 2 && texts >= 2) cases += 1;
  if (amounts && flags < 4 && textShare < 0.25) cases -= 2;
  if (!live.some(c => c.role === 'measure')) return { shape: 'cases', conf: cases >= 2 ? 'média' : 'baixa', why: [['nomeas', 0]] }; // sem número para somar, só dá para contar linhas
  cases += areaOf(area).cases || 0; // a área inclina a leitura, nunca decide sozinha
  if (cases >= 4) return { shape: 'cases', conf: cases >= 6 ? 'alta' : 'média', why };
  const sm = uGrid(live, nRows); if (sm) return { shape: 'summary', conf: 'média', why: [['grid', sm]] };
  if (amounts || live.some(c => c.role === 'measure' && c.mtype !== 'score')) return { shape: 'ledger', conf: amounts ? 'alta' : 'média', why: [[amounts ? 'amounts' : 'numbers', 0]] };
  return { shape: 'summary', conf: 'baixa', why: [['few', 0]] };
}

/* ---- rótulos parecidos: sugestões de unificação (não alteram a planilha, só o agrupamento) ---- */
function uCanon(v) { return uNorm(v).replace(/^[a-z]{0,3}\d{1,3}\s*[-–:.)]\s*/, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
function uMergeSuggestions(c) {
  if (!c.dict || (c.role !== 'category' && c.role !== 'flag' && c.role !== 'geo') || c.dict.length < 2 || c.dict.length > 400) return [];
  const cnt = new Array(c.dict.length).fill(0); for (let i = 0; i < c.codes.length; i++) if (c.codes[i] >= 0) cnt[c.codes[i]]++;
  const groups = new Map(); c.dict.forEach((v, i) => { const k = uCanon(v); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); });
  const out = [];
  const pref = v => { const m = /^([a-z]{0,3}\d{1,3})\s*[-–:.)]/i.exec(uNorm(v)); return m ? m[1] : ''; };
  groups.forEach(ix => { const ps = new Set(ix.map(i => pref(c.dict[i])).filter(Boolean)); if (ix.length > 1 && ps.size <= 1) { const keep = ix.slice().sort((a, b) => cnt[b] - cnt[a])[0]; out.push({ kind: 'same', keep: c.dict[keep], from: ix.filter(i => i !== keep).map(i => c.dict[i]), rows: ix.reduce((a, i) => a + cnt[i], 0) }); } });
  if (c.role === 'flag' && c.flagMap) { // sim/não escritos de formas diferentes ("NÃO" e "Não resolvido"): a pessoa decide
    ['pos', 'neg'].forEach(k => { const ix = c.dict.map((v, i) => i).filter(i => c.flagMap[c.dict[i]] === k); if (ix.length > 1) { const keep = ix.slice().sort((a, b) => uNorm(c.dict[a]).length - uNorm(c.dict[b]).length || cnt[b] - cnt[a])[0]; const from = ix.filter(i => i !== keep && !out.some(o => o.from.includes(c.dict[i]) || o.keep === c.dict[i])).map(i => c.dict[i]); if (from.length) out.push({ kind: 'flag', keep: c.dict[keep], from, rows: from.reduce((a, v) => a + cnt[c.dict.indexOf(v)], 0) }); } });
  }
  return out;
}
// aplica unificações escolhidas: reescreve só os códigos de agrupamento da coluna (a planilha original continua intacta)
function uApplyMerges(c, merges) {
  const map = new Map(); merges.forEach(m => m.from.forEach(f => map.set(f, m.keep)));
  if (!map.size) return 0; const dict = [], idx = new Map(), remap = c.dict.map(v => { const t = map.get(v) || v; if (!idx.has(t)) { idx.set(t, dict.length); dict.push(t); } return idx.get(t); });
  let changed = 0; for (let i = 0; i < c.codes.length; i++) { const k = c.codes[i]; if (k >= 0) { const nk = remap[k]; if (nk !== k) changed++; c.codes[i] = nk; } }
  c.dict = dict; c.distinct = dict.length; c.merged = true; return changed;
}

// entrada: perfila todas as colunas do dataset e decide o tipo da planilha
function understandSheet(ds) {
  const area = ds.columns.area || null;
  ds.columns.forEach(c => uProfileColumn(c, ds.rowCount, area));
  const sh = uShape(ds.columns, ds.rowCount, area);
  return { shape: sh.shape, conf: sh.conf, why: sh.why, auto: sh.shape };
}

// colunas de texto que, na verdade, são número ou categoria: pede ao leitor para reinterpretar (uma vez por coluna)
function uRetypes(ds, done) {
  const out = [];
  ds.columns.forEach((c, i) => { if (c.retype && !done.has(c.name + '|' + c.retype)) { done.add(c.name + '|' + c.retype); out.push({ col: i, kind: c.retype, units: !!c.retypeUnits }); } });
  return out;
}
