/* Datavix: histórias (storytelling por pergunta). Especificação: docs/especificacao-historias.md.
 * Uma história é uma pergunta de negócio (comparar, ver a evolução, achar concentração…). Este arquivo guarda o catálogo e diz, para cada planilha,
 * quais histórias são POSSÍVEIS (regra dura), quão bem cada uma se ajusta (score) e por quê (frase com os números da própria planilha).
 * Nada aqui inventa dado: tudo é contagem ou cálculo sobre as colunas lidas. */

const NV_ST_ORDER = ['compare', 'time', 'rank', 'composition', 'distribution', 'relation', 'geo', 'funnel', 'goal', 'before_after'];
const NV_ST_MIN_SCORE = 0.45; // abaixo disso a história é possível, mas não é sugerida
const NV_STORIES = {
  compare: { phase: 1, name: { pt: 'Comparativo', en: 'Comparison' }, ask: { pt: 'Quem é maior, menor, melhor? Como A se compara a B?', en: 'Who is bigger, smaller, better? How does A compare to B?' },
    allow: ['top', 'bottom', 'spread', 'gap', 'ratio', 'dimgap', 'shift', 'overview'], charts: { primary: 'hbars', alts: ['cols', 'fan', 'rays', 'race'] } },
  time: { phase: 1, name: { pt: 'Evolução no tempo', en: 'Change over time' }, ask: { pt: 'Como mudou? Cresceu, caiu, oscilou?', en: 'How did it change? Did it grow, fall, fluctuate?' },
    allow: ['change', 'trend', 'shift', 'drop', 'contrib', 'top', 'bottom', 'overview'], charts: { primary: 'line', alts: ['area', 'river', 'ridge', 'calendar', 'bars'] } },
  rank: { phase: 1, name: { pt: 'Ranking e concentração', en: 'Ranking and concentration' }, ask: { pt: 'Quem puxa o resultado? Poucos fazem muito?', en: 'Who drives the result? Do a few do most?' },
    allow: ['conc', 'top', 'bottom', 'contrib', 'ratio', 'overview'], charts: { primary: 'hbars', alts: ['fan', 'rays', 'treemap', 'packed', 'race'] } },
  composition: { phase: 1, name: { pt: 'Composição', en: 'Composition' }, ask: { pt: 'Do que o total é feito?', en: 'What is the total made of?' },
    allow: ['top', 'conc', 'bottom', 'shift', 'contrib', 'dimgap', 'overview'], charts: { primary: 'treemap', alts: ['donut', 'pie', 'stacked100', 'packed', 'pies'] } },
  distribution: { phase: 1, name: { pt: 'Distribuição e anomalias', en: 'Distribution and anomalies' }, ask: { pt: 'O que é normal? O que foge do padrão?', en: 'What is normal? What breaks the pattern?' },
    allow: ['dist', 'atypical', 'atypical-rows', 'dimgap', 'overview'], charts: { primary: 'box', alts: ['scatter', 'words'] } },
  relation: { phase: 1, name: { pt: 'Relação entre medidas', en: 'Relationship' }, ask: { pt: 'Uma coisa varia junto com a outra?', en: 'Does one thing vary together with the other?' },
    allow: ['assoc', 'atypical-rows', 'dimgap', 'ratio', 'overview'], charts: { primary: 'scatter', alts: ['bubble'] } },
  geo: { phase: 2, name: { pt: 'Geografia', en: 'Geography' }, ask: { pt: 'Onde as coisas acontecem?', en: 'Where do things happen?' },
    allow: ['top', 'bottom', 'conc', 'spread', 'dimgap', 'overview'], charts: { primary: 'bubmap', alts: ['isomap', 'hbars'] } },
  funnel: { phase: 2, name: { pt: 'Funil e conversão', en: 'Funnel and conversion' }, ask: { pt: 'Onde perdemos itens ao longo das etapas?', en: 'Where do we lose items along the stages?' },
    allow: ['drop', 'ratio', 'dimgap', 'top', 'bottom', 'overview'], charts: { primary: 'flow', alts: ['bars'] } },
  goal: { phase: 3, name: { pt: 'Meta e desempenho', en: 'Goal and performance' }, ask: { pt: 'Atingimos o planejado?', en: 'Did we hit the plan?' },
    allow: ['attain', 'variance', 'gap', 'ratio', 'overview'], charts: { primary: 'cols', alts: ['hbars'] } },
  before_after: { phase: 3, name: { pt: 'Antes e depois', en: 'Before and after' }, ask: { pt: 'O que mudou depois do marco?', en: 'What changed after the milestone?' },
    allow: ['step', 'dimgap', 'trend', 'overview'], charts: { primary: 'line', alts: ['area', 'cols'] } },
};

/* ---- migração: ids antigos do S.br.story (7 valores) ↔ ids novos. Projetos salvos continuam abrindo; o resto do app ainda lê os ids antigos ---- */
const NV_STORY_FROM_OLD = { time: 'time', compare: 'compare', composition: 'composition', distribution: 'distribution', relation: 'relation', flow: 'funnel', geo: 'geo' };
const NV_STORY_TO_OLD = { compare: 'compare', rank: 'compare', time: 'time', before_after: 'time', composition: 'composition', distribution: 'distribution', relation: 'relation', funnel: 'flow', geo: 'geo', goal: 'compare' };
// id novo a partir de qualquer id (antigo ou novo); null se não existir
const nvStoryNorm = s => (!s ? null : NV_STORIES[s] ? s : NV_STORY_FROM_OLD[s] || null);
// id no vocabulário antigo, que é o que o mapeamento, a escolha de gráfico e a tela de mapeamento ainda entendem
const nvStoryLegacy = s => (!s ? s : NV_STORY_TO_OLD[s] || s);
const nvStoryInfo = (id, lang) => { const d = NV_STORIES[id]; if (!d) return null; const L = lang === 'en' ? 'en' : 'pt'; return { id, phase: d.phase, name: d.name[L], ask: d.ask[L], allow: d.allow.slice(), charts: d.charts }; };

/* ---- fatos da planilha, calculados uma vez ---- */
function nvStoryFacts(ds) {
  if (ds._stf) return ds._stf;
  const cols = ds.columns, n = ds.rowCount, cases = cols.shape === 'cases';
  const live = cols.map((c, i) => ({ c, i })).filter(({ c }) => colUsable(c) && !c.hide);
  const measures = live.filter(({ c }) => c.kind === 'number' && c.role === 'measure');
  const groups = live.filter(({ c }) => isGroupDim(c) && c.codes && c.dict).map(({ c, i }) => {
    const real = c.dict.map((l, k) => [l, k]).filter(([l]) => !isPlaceholderLabel(l)).length; return { c, i, k: real };
  }).filter(g => g.k >= 2);
  // entidades: coluna de nomes em que cada linha (ou grupo de linhas) é um item (municípios, lojas, produtos). Entram só no Ranking; códigos e protocolos não
  const entities = live.filter(({ c }) => c.kind === 'text' && c.role === 'id' && c.texts && !(typeof U_NAME_ID !== 'undefined' && U_NAME_ID.test(c.name))).map(({ c, i }) => {
    const m = new Map(), codes = new Int32Array(n); let letters = 0, seen = 0;
    for (let r = 0; r < n; r++) { const t = c.texts[r] ? String(c.texts[r]).replace(/\s+/g, ' ').trim() : ''; if (!t || t.length > 40) { codes[r] = -1; continue; } let k = m.get(t); if (k === undefined) { k = m.size; m.set(t, k); if (m.size > 20000) return null; } codes[r] = k; if (seen < 200) { seen++; if (/[a-zA-ZÀ-ú]/.test(t)) letters++; } }
    return seen && letters / seen >= 0.6 && m.size >= 6 ? { c: { name: c.name, codes, dict: [...m.keys()] }, i, k: m.size } : null;
  }).filter(Boolean);
  const dates = live.filter(({ c }) => c.kind === 'date' && c.data).map(({ c, i }) => {
    const grain = riverGrain(c.min, c.max, c); let periods = 0;
    if (grain) { const set = new Set(), step = Math.max(1, Math.ceil(n / 200000)); for (let r = 0; r < n; r += step) { const t = c.data[r]; if (!Number.isNaN(t)) set.add(bucketStart(t, grain)); } periods = set.size; }
    return { c, i, grain, periods };
  });
  const main = cases ? -1 : bestMeasure(cols);
  const f = { n, cases, measures, groups, entities, dates, main, mainCol: main >= 0 ? cols[main] : null, stats: new Map() };
  Object.defineProperty(ds, '_stf', { value: f, enumerable: false, configurable: true });
  return f;
}
const nvStatsOf = (ds, F, m) => { if (!F.stats.has(m.i)) F.stats.set(m.i, nvRowStats(ds, m.c)); return F.stats.get(m.i); };
// soma (ou contagem) por grupo de uma coluna, para participação e concentração
function nvStoryShares(ds, g, m) {
  const sums = g.c.dict.map(() => 0), n = ds.rowCount; let neg = 0, used = 0;
  for (let i = 0; i < n; i++) { const k = g.c.codes[i]; if (k < 0) continue; let v = m ? m.data[i] : 1; if (!Number.isFinite(v)) continue; if (v < 0) neg++; sums[k] += v; used++; }
  const arr = sums.map((v, k) => ({ label: g.c.dict[k], v })).filter(x => !isPlaceholderLabel(x.label)).sort((a, b) => b.v - a.v), tot = arr.reduce((a, x) => a + Math.max(0, x.v), 0);
  return { arr, tot, negShare: used ? neg / used : 0, top1: tot > 0 ? Math.max(0, arr[0].v) / tot : 0, top3: tot > 0 ? arr.slice(0, 3).reduce((a, x) => a + Math.max(0, x.v), 0) / tot : 0 };
}

/* ---- elegibilidade ---- */
const NV_TX = {
  pt: { rows: 'contagem de linhas', vals: 'valores', per: 'períodos', noGroup: 'falta uma coluna de categorias (2 a 12 valores)', noGroup6: 'nenhuma coluna de categorias com 6 ou mais valores', manyGroups: 'categorias demais (use Ranking e concentração)', noDate: 'falta uma coluna de datas com pelo menos 4 períodos', noAdd: 'a medida é uma média ou razão: não soma', negs: 'há valores negativos demais para falar em partes de um todo', noMeasure: 'falta uma coluna numérica', fewRows: n => `só ${n} linhas com valor (mínimo 30)`, flat: 'os valores quase não variam', noPair: 'é preciso uma segunda coluna numérica com 30 ou mais pares', mech: 'as colunas numéricas são múltiplos uma da outra (relação mecânica)', weak: r => `relação fraca (|ρ| máx ${r})`, soon: 'em breve', top3: p => `os 3 maiores somam ${p}%`, rho: r => `ρ ${r}` },
  en: { rows: 'row count', vals: 'values', per: 'periods', noGroup: 'needs a category column (2 to 12 values)', noGroup6: 'no category column with 6 or more values', manyGroups: 'too many categories (use Ranking and concentration)', noDate: 'needs a date column with at least 4 periods', noAdd: 'the measure is an average or ratio: it does not add up', negs: 'too many negative values to talk about parts of a whole', noMeasure: 'needs a numeric column', fewRows: n => `only ${n} rows with a value (minimum 30)`, flat: 'the values hardly vary', noPair: 'needs a second numeric column with 30 or more pairs', mech: 'the numeric columns are multiples of each other (mechanical relationship)', weak: r => `weak relationship (max |ρ| ${r})`, soon: 'coming soon', top3: p => `the top 3 add up to ${p}%`, rho: r => `ρ ${r}` },
};
const nvPct = (x, lang) => (Math.round(x * 100)).toString();
const nvRho = (x, lang) => (Math.round(Math.abs(x) * 100) / 100).toString().replace('.', lang === 'en' ? '.' : ',');

function nvStoryEligibility(ds, opt = {}) {
  const lang = opt.lang === 'en' ? 'en' : 'pt', X = NV_TX[lang], F = nvStoryFacts(ds), out = {}, mname = F.mainCol ? F.mainCol.name : X.rows;
  const no = (why, extra) => Object.assign({ ok: false, score: 0, why }, extra);
  const add = c => !!c && !gal2Avg(c);
  const best = (list, fn) => { let b = null; for (const g of list) { const r = fn(g); if (r && (!b || r.score > b.score)) b = r; } return b; };

  // compare: grupo com 2 a 12 valores
  { const gs = F.groups.filter(g => g.k <= 12);
    const r = best(gs, g => ({ ok: true, score: Math.min(1, 0.5 + (g.k <= 6 ? 0.3 : 0.15) + (F.mainCol ? 0.2 : 0.1)), why: `${g.c.name}: ${g.k} ${X.vals} · ${mname}`, cols: { group: g.i, measure: F.main } }));
    out.compare = r || no(F.groups.length ? X.manyGroups : X.noGroup); }

  // time: data com pelo menos 4 períodos
  { const r = best(F.dates.filter(d => d.periods >= 4), d => ({ ok: true, score: Math.min(1, 0.5 + (d.periods >= 8 ? 0.3 : d.periods >= 6 ? 0.15 : 0) + (F.mainCol ? 0.2 : 0.1)), why: `${d.c.name}: ${d.periods} ${X.per} · ${mname}`, cols: { time: d.i, measure: F.main } }));
    out.time = r || no(X.noDate); }

  // rank: grupo com 6 ou mais valores; pesa mais quando poucos concentram
  { const gs = F.groups.filter(g => g.k >= 6).concat(F.entities);
    const r = best(gs.slice(0, 8), g => { const sh = nvStoryShares(ds, g, F.mainCol), conc = sh.top3 >= 0.5 ? 0.3 : sh.top3 >= 0.35 ? 0.15 : 0; return { ok: true, score: Math.min(1, 0.4 + (g.k >= 15 ? 0.3 : g.k >= 10 ? 0.15 : 0) + conc), why: `${g.c.name}: ${g.k} ${X.vals}${sh.tot > 0 ? ' · ' + X.top3(nvPct(sh.top3, lang)) : ''}`, cols: { group: g.i, measure: F.main } }; });
    out.rank = r || no(X.noGroup6); }

  // composition: 2 a 12 partes, medida que soma (ou contagem de linhas), sem negativos relevantes
  { const gs = F.groups.filter(g => g.k <= 12), useM = add(F.mainCol) ? F.mainCol : null;
    let why = gs.length ? null : X.noGroup;
    const r = best(gs.slice(0, 6), g => { const sh = nvStoryShares(ds, g, useM); if (sh.negShare > 0.05) { why = X.negs; return null; } if (sh.tot <= 0) return null; return { ok: true, score: Math.min(1, 0.5 + (g.k <= 6 ? 0.3 : g.k <= 9 ? 0.15 : 0) + (useM ? 0.2 : 0.1)), why: `${g.c.name}: ${g.k} ${X.vals} · ${useM ? useM.name : X.rows}`, cols: { group: g.i, measure: useM ? F.main : -1 } }; });
    out.composition = r || no(why || (F.mainCol && !useM ? X.noAdd : X.noGroup)); }

  // distribution: medida com 30 ou mais valores e variação real
  { let why = F.measures.length ? null : X.noMeasure, bestR = null;
    for (const m of F.measures.slice(0, 3)) {
      const s = nvStatsOf(ds, F, m); if (!s) continue;
      if (s.n < NV_ROWS.min) { why = X.fewRows(s.n); continue; }
      if (!(s.sd > 0) || s.max === s.min) { why = X.flat; continue; }
      const outs = (s.outAbove || 0) + (s.outBelow || 0), skew = Math.abs(s.mean - s.median) / s.sd >= 0.2;
      const sc = Math.min(1, 0.4 + (s.n >= 500 ? 0.3 : s.n >= 100 ? 0.15 : 0) + (outs > 0 || skew ? 0.3 : 0));
      if (!bestR || sc > bestR.score) bestR = { ok: true, score: sc, why: `${m.c.name}: ${s.n} ${lang === 'en' ? 'rows' : 'linhas'}${outs ? ' · ' + outs + ' ' + (lang === 'en' ? 'outside the usual range' : 'fora da faixa comum') : ''}`, cols: { measure: m.i } };
    }
    out.distribution = bestR || no(why || X.noMeasure); }

  // relation: duas medidas com 30 ou mais pares, sem relação mecânica; o score sobe com a força
  { let why = F.measures.length >= 2 ? null : (F.measures.length ? X.noPair : X.noMeasure), bestR = null, derived = false, weakMax = 0;
    for (const m of F.measures.slice(0, 3)) {
      const s = nvStatsOf(ds, F, m); if (!s || s.n < NV_ROWS.min) continue;
      if (s.derived && s.derived.length) derived = true;
      const a = s.assoc; if (!a) continue;
      const strong = Math.abs(a.rho) >= NV_ROWS.rhoMin && Math.abs(a.rho) * Math.sqrt(a.n - 1) >= NV_ROWS.rhoZ;
      weakMax = Math.max(weakMax, Math.abs(a.rho));
      const sc = strong ? Math.min(1, 0.55 + Math.abs(a.rho) * 0.45) : 0.3;
      if (!bestR || sc > bestR.score) bestR = { ok: true, score: sc, why: `${m.c.name} × ${a.name} · ${X.rho(nvRho(a.rho, lang))}`, cols: { x: m.i, y: ds.columns.findIndex(c => c.name === a.name) } };
    }
    if (bestR && bestR.score < NV_ST_MIN_SCORE) bestR.weak = X.weak(nvRho(weakMax, lang));
    out.relation = bestR || no(derived ? X.mech : why || X.noPair); }

  // fases seguintes: o catálogo já existe, a elegibilidade chega nos próximos portões
  for (const id of NV_ST_ORDER) if (!out[id]) out[id] = no(X.soon, { planned: true, phase: NV_STORIES[id].phase });
  for (const id of NV_ST_ORDER) { out[id].id = id; out[id].phase = NV_STORIES[id].phase; }
  return out;
}

// as histórias possíveis, da que melhor se ajusta para a que menos; "list" são até n sugestões (score mínimo) e "blocked" as que a planilha não sustenta
function nvStorySuggest(ds, opt = {}) {
  const all = nvStoryEligibility(ds, opt), n = opt.n || 3, ids = NV_ST_ORDER.filter(id => all[id].ok).sort((a, b) => all[b].score - all[a].score || NV_ST_ORDER.indexOf(a) - NV_ST_ORDER.indexOf(b));
  const list = ids.filter(id => all[id].score >= NV_ST_MIN_SCORE).slice(0, n);
  return { all, list, possible: ids, blocked: NV_ST_ORDER.filter(id => !all[id].ok && !all[id].planned) };
}
