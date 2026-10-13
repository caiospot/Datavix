/* Datavix: face a face (portão 49). Lê, depois da leitura da planilha, o que o parser já reorganizou (ds.fixes.versus) ou reconhece o formato longo
 * (uma coluna Entidade com 2 a 4 valores e uma chave de período), e entrega um descritor: quem são as entidades, onde estão o valor, a unidade e o texto,
 * quais linhas são "não participou" e qual é a direção de cada métrica (neutra por padrão). Nada aqui altera um número: só localiza e marca. */

const NV_VS_ABSENT = /^\s*(ainda n[aã]o|n[aã]o (particip|disput|estre|compet)|sem particip|n\/?d\b|—|-+\s*$)/i; // início da célula: "Sem participação na F1." conta; "Schumacher ainda não estreara…" (sobre o outro) não
const NV_VS_EXPOSURE = /(disputad|largad|jogos|participa|partidas|games|starts|apari[cç]|^gp\b|\bgps?\b)/i;
const NV_VS_PERIOD = /temporada|season|per[ií]odo|^ano$|year|data|date|rodada/i;
const NV_VS_LOWER = /(abandon|dnf|erro|falha|custo|tempo|cancel|reclama|defeito|atraso|perda|churn|devolu)/i;
// direção de uma métrica: "neutral" por padrão; a sugestão "lower" aparece para nomes como abandono, custo, atraso (a pessoa decide)
const nvVersusDirection = name => ({ dir: 'neutral', hint: NV_VS_LOWER.test(String(name || '')) ? 'lower' : null });

function nvVersus(ds) {
  if (!ds || !ds.columns) return null;
  if (ds._vs !== undefined) return ds._vs;
  let v = null; try { v = nvVersusFromFixes(ds) || nvVersusLong(ds); } catch (e) { v = null; console.error(e); }
  Object.defineProperty(ds, '_vs', { value: v, enumerable: false, configurable: true }); return v;
}
const nvVsCol = (ds, name) => ds.columns.findIndex(c => c.name === name);
const nvVsLabel = (c, i) => (c.codes ? (c.codes[i] < 0 ? '' : String(c.dict[c.codes[i]])) : c.texts && c.texts[i] ? String(c.texts[i]) : '');
function nvVsFinish(ds, v) {
  const n = ds.rowCount, ec = ds.columns[v.entityCol], absent = new Uint8Array(n), absentBy = {};
  v.entities = ec.dict.slice(); v.exposureCol = -1;
  if (v.form === 'entity-long') {
    const ex = (v.measures || []).find(i => NV_VS_EXPOSURE.test(ds.columns[i].name)); v.exposureCol = ex === undefined ? -1 : ex;
    const txtCols = ds.columns.map((c, i) => [c, i]).filter(([c, i]) => (c.kind === 'category' || c.kind === 'text') && i !== v.entityCol && i !== v.periodCol && (c.role === 'text' || c.role === 'category' || c.role === 'id'));
    for (let i = 0; i < n; i++) {
      let a = v.exposureCol >= 0 && ds.columns[v.exposureCol].data[i] === 0;
      if (!a) for (const [c] of txtCols) { const t = nvVsLabel(c, i); if (t && NV_VS_ABSENT.test(t)) { a = true; break; } }
      if (a) { absent[i] = 1; const e = ec.dict[ec.codes[i]]; absentBy[e] = (absentBy[e] || 0) + 1; }
    }
  }
  v.absent = absent; v.absentBy = absentBy; v.direction = {};
  (v.form === 'metric-long' ? [] : (v.measures || []).map(i => ds.columns[i].name)).forEach(m => { v.direction[m] = nvVersusDirection(m); });
  return v;
}
// o parser já reorganizou (entidades em colunas ou colunas repetidas por entidade)
function nvVersusFromFixes(ds) {
  const fx = ds.fixes && ds.fixes.versus; if (!fx || !fx.rows) return null;
  const entityCol = nvVsCol(ds, 'Entidade'); if (entityCol < 0 || !ds.columns[entityCol].codes) return null;
  const pc = fx.periodCol ? nvVsCol(ds, fx.periodCol) : -1;
  if (fx.form === 'metric-long') return nvVsFinish(ds, { form: 'metric-long', source: 'columns', entityCol, valueCol: nvVsCol(ds, 'Valor'), unitCol: nvVsCol(ds, 'Unidade'), textCol: nvVsCol(ds, 'Texto'), metricCol: fx.metricCol ? nvVsCol(ds, fx.metricCol) : -1, periodCol: pc, metrics: null });
  const measures = ds.columns.map((c, i) => [c, i]).filter(([c, i]) => c.kind === 'number' && c.role === 'measure' && i !== pc && fx.metrics.includes(c.name)).map(x => x[1]);
  return nvVsFinish(ds, { form: 'entity-long', source: 'suffix', entityCol, periodCol: pc, measures, metricNames: fx.metrics.slice() });
}
// formato longo sem reorganização: uma coluna com 2 a 4 entidades, 2 ou mais medidas e uma chave de período em que (período, entidade) quase nunca se repete
function nvVersusLong(ds) {
  const cols = ds.columns, n = ds.rowCount; if (n < 6) return null;
  const meas = cols.map((c, i) => [c, i]).filter(([c, i]) => colUsable(c) && c.kind === 'number' && c.role === 'measure' && !NV_VS_PERIOD.test(c.name)).map(x => x[1]); if (meas.length < 2) return null;
  const keyIdx = cols.findIndex(c => colUsable(c) && NV_VS_PERIOD.test(c.name) && (c.kind === 'date' || c.kind === 'number' || c.kind === 'category')); if (keyIdx < 0) return null;
  let best = null;
  cols.forEach((c, i) => {
    if (!(isGroupDim(c) && c.codes && c.dict) || i === keyIdx) return; const real = c.dict.filter(l => !isPlaceholderLabel(l));
    if (real.length < 2 || real.length > 4) return;
    const cnt = c.dict.map(() => 0), pair = new Map(); for (let r = 0; r < n; r++) { const k = c.codes[r]; if (k < 0) continue; cnt[k]++; const key = (cols[keyIdx].codes ? cols[keyIdx].codes[r] : cols[keyIdx].data[r]) + '|' + k; pair.set(key, (pair.get(key) || 0) + 1); }
    if (cnt.some((x, k) => x > 0 && x < 3)) return;
    const uniq = [...pair.values()].filter(x => x === 1).length / pair.size; if (uniq < 0.8) return;
    // as entidades se encontram nos mesmos períodos: a maioria das chaves tem 2 ou mais entidades e a grade período × entidade está bem preenchida
    const byKey = new Map(); pair.forEach((_, key) => { const [kk, ee] = key.split('|'); if (!byKey.has(kk)) byKey.set(kk, new Set()); byKey.get(kk).add(ee); });
    const meet = [...byKey.values()].filter(set => set.size >= 2).length / byKey.size; if (byKey.size < 3 || meet < 0.6 || pair.size / (byKey.size * real.length) < 0.5) return;
    if (!best || real.length < best.k) best = { i, k: real.length };
  });
  if (!best) return null;
  return nvVsFinish(ds, { form: 'entity-long', source: 'long', entityCol: best.i, periodCol: keyIdx, measures: meas });
}
