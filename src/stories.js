/* Datavix: histórias (storytelling por pergunta). Especificação: docs/especificacao-historias.md.
 * Uma história é uma pergunta de negócio (comparar, ver a evolução, achar concentração…). Este arquivo guarda o catálogo e diz, para cada planilha,
 * quais histórias são POSSÍVEIS (regra dura), quão bem cada uma se ajusta (score) e por quê (frase com os números da própria planilha).
 * Nada aqui inventa dado: tudo é contagem ou cálculo sobre as colunas lidas. */

const NV_ST_ORDER = ['versus', 'season', 'profile', 'compare', 'time', 'rank', 'composition', 'distribution', 'relation', 'geo', 'funnel', 'goal', 'before_after'];
const NV_ST_MIN_SCORE = 0.45; // abaixo disso a história é possível, mas não é sugerida
const NV_OWN = ['versus', 'season', 'profile']; // modelos com roteiro próprio: o plano sai do pacote lido da planilha (built.vs, built.fc), não do conjunto de achados do motor
const NV_STORIES = {
  versus: { phase: 2, name: { pt: 'Face a face', en: 'Head to head' }, ask: { pt: 'Como A se compara a B, métrica a métrica?', en: 'How does A compare to B, metric by metric?' },
    allow: [], charts: { primary: null, alts: [] } },
  season: { phase: 2, name: { pt: 'Resumo por temporada', en: 'Season summary' }, ask: { pt: 'Como cada um evoluiu de uma temporada para a outra?', en: 'How did each one change from one season to the next?' },
    allow: [], charts: { primary: null, alts: [] } },
  profile: { phase: 2, name: { pt: 'Ficha / perfil', en: 'Profile sheet' }, ask: { pt: 'Quais são os números e os traços de uma só entidade?', en: 'What are the numbers and traits of a single entity?' },
    allow: [], charts: { primary: null, alts: [] } },
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
const NV_STORY_TO_OLD = { versus: 'compare', season: 'compare', profile: 'compare', compare: 'compare', rank: 'compare', time: 'time', before_after: 'time', composition: 'composition', distribution: 'distribution', relation: 'relation', funnel: 'flow', geo: 'geo', goal: 'compare' };
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
  pt: { rows: 'contagem de linhas', vals: 'valores', per: 'períodos', noGroup: 'falta uma coluna de categorias (2 a 12 valores)', noGroup6: 'nenhuma coluna de categorias com 6 ou mais valores', manyGroups: 'categorias demais (use Ranking e concentração)', noDate: 'falta uma coluna de datas com pelo menos 4 períodos', noAdd: 'a medida é uma média ou razão: não soma', negs: 'há valores negativos demais para falar em partes de um todo', noMeasure: 'falta uma coluna numérica', fewRows: n => `só ${n} linhas com valor (mínimo 30)`, fewPts: 'poucos pontos de latitude e longitude (mínimo 20)', noGeo: 'falta uma coluna de estado, cidade ou latitude e longitude', noGoal: 'falta uma coluna de meta (meta, orçado, planejado)', pickCut: 'escolha a data do marco no painel', noCut: 'falta uma data com 8 períodos ou uma coluna antes/depois', noFlow: 'faltam colunas de etapas em sequência (2 a 5)', flat: 'os valores quase não variam', noPair: 'é preciso uma segunda coluna numérica com 30 ou mais pares', mech: 'as colunas numéricas são múltiplos uma da outra (relação mecânica)', weak: r => `relação fraca (|ρ| máx ${r})`, soon: 'em breve', top3: p => `os 3 maiores somam ${p}%`, rho: r => `ρ ${r}` },
  en: { rows: 'row count', vals: 'values', per: 'periods', noGroup: 'needs a category column (2 to 12 values)', noGroup6: 'no category column with 6 or more values', manyGroups: 'too many categories (use Ranking and concentration)', noDate: 'needs a date column with at least 4 periods', noAdd: 'the measure is an average or ratio: it does not add up', negs: 'too many negative values to talk about parts of a whole', noMeasure: 'needs a numeric column', fewRows: n => `only ${n} rows with a value (minimum 30)`, fewPts: 'too few latitude and longitude points (minimum 20)', noGeo: 'needs a state, city or latitude and longitude column', noGoal: 'needs a goal column (goal, budget, planned)', pickCut: 'pick the milestone date in the panel', noCut: 'needs a date with 8 periods or a before/after column', noFlow: 'needs stage columns in sequence (2 to 5)', flat: 'the values hardly vary', noPair: 'needs a second numeric column with 30 or more pairs', mech: 'the numeric columns are multiples of each other (mechanical relationship)', weak: r => `weak relationship (max |ρ| ${r})`, soon: 'coming soon', top3: p => `the top 3 add up to ${p}%`, rho: r => `ρ ${r}` },
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
      const odd = outs > 0 || skew, sc = Math.min(1, odd ? 0.5 + (s.n >= 500 ? 0.3 : s.n >= 100 ? 0.15 : 0) + 0.2 : 0.3 + (s.n >= 100 ? 0.1 : 0)); // sem assimetria nem pontos fora da faixa não há o que contar: possível, mas não sugerida
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

  // geo (Fase 2): UF/estado/município reconhecido, ou latitude e longitude, com uma medida (ou contagem)
  { let sg = null; try { sg = CHART_REG.bubmap && CHART_REG.bubmap.suggest(ds.columns); } catch (e) { sg = null; }
    let si = null; try { si = CHART_REG.isomap && CHART_REG.isomap.suggest(ds.columns); } catch (e) { si = null; }
    if (si) { const la = ds.columns[si.lat], pts = ds.rowCount; out.geo = pts >= 20 ? { ok: true, score: Math.min(1, 0.6 + (pts >= 100 ? 0.25 : 0.1) + (F.mainCol ? 0.1 : 0)), why: `${ds.columns[si.lat].name} + ${ds.columns[si.lon].name}: ${fmtInt(pts, lang)} ${lang === 'en' ? 'points' : 'pontos'}`, cols: { lat: si.lat, lon: si.lon, measure: si.val } } : no(X.fewPts); }
    else if (sg) { const c = ds.columns[sg.geo !== undefined ? sg.geo : sg.cat]; const k = c && c.dict ? c.dict.length : 0; out.geo = c && k >= 2 ? { ok: true, score: Math.min(1, 0.6 + (k >= 5 ? 0.25 : 0.1) + (F.mainCol ? 0.1 : 0)), why: `${c.name}: ${k} ${X.vals} · ${mname}`, cols: { geo: sg.geo !== undefined ? sg.geo : sg.cat, measure: F.main } } : no(X.noGeo); }
    else out.geo = no(X.noGeo); }
  // funnel (Fase 2): 2 a 5 colunas de etapa reconhecidas pelo gráfico de funil
  { let fl = null; try { fl = CHART_REG.flow && CHART_REG.flow.suggest(ds.columns); } catch (e) { fl = null; }
    const idx = fl ? [fl.s1, fl.s2, fl.s3, fl.s4, fl.s5].filter(i => i !== undefined && i >= 0) : [];
    // só é funil se as colunas parecem etapas: o nome diz (etapa, fase, proposta…) ou o preenchimento cai de uma etapa para a próxima (quem sai do funil deixa as etapas seguintes vazias)
    const fill = i => { const c = ds.columns[i]; let k = 0; for (let r = 0; r < ds.rowCount; r++) if (c.codes[r] >= 0) k++; return k / Math.max(1, ds.rowCount); };
    const hint = idx.filter(i => /etapa|est[aá]gio|fase|funil|stage|phase|status|jornada|qualific|proposta|proposal|resultado|result|convers|fechament|closing/i.test(ds.columns[i].name)).length;
    const fills = idx.map(fill), drops = fills.slice(1).filter((f, k) => f < fills[k] - 0.05).length;
    if (idx.length >= 2 && hint < 2 && drops < 1) idx.length = 0;
    out.funnel = idx.length >= 2 ? { ok: true, score: Math.min(1, 0.5 + 0.12 * idx.length + (fl.value >= 0 ? 0.1 : 0)), why: idx.map(i => ds.columns[i].name).join(' → '), cols: { stages: idx, measure: fl.value } } : no(X.noFlow); }

  Object.assign(out, nvStoryEligibility3(ds, lang, F)); // Fase 3: meta e antes e depois
  // face a face: a planilha foi lida como comparação entre 2 a 4 entidades, com pelo menos uma métrica comparável
  { let pk = null; try { pk = typeof nvVsPack === 'function' ? nvVsPack(ds) : null; } catch (e) { pk = null; }
    out.versus = pk && pk.score && pk.score.items.length ? { ok: true, score: 1, why: `${pk.ents.join(' × ')} · ${pk.score.items.length} ${lang === 'en' ? 'comparable metrics' : 'métricas comparáveis'}`, cols: {}, metrics: pk.score.items.length } : no(lang === 'en' ? 'needs 2 to 4 entities with metrics in common' : 'precisa de 2 a 4 entidades com métricas em comum');
    // resumo por temporada: a mesma leitura (entidades × períodos), vista entidade por entidade
    let ss = null; try { ss = pk && typeof nvSsEligible === 'function' ? nvSsEligible(pk) : null; } catch (e) { ss = null; }
    out.season = ss ? { ok: true, score: 0.9, why: `${pk.ents.join(' × ')} · ${ss.K} ${lang === 'en' ? 'periods' : 'períodos'} · ${ss.M} ${lang === 'en' ? 'metrics' : 'métricas'}`, cols: {}, metrics: ss.M } : no(lang === 'en' ? 'needs 2 to 4 entities with 3 or more periods and a metric that adds up' : 'precisa de 2 a 4 entidades com 3 ou mais períodos e uma medida que soma');
    // ficha / perfil: lista de indicadores de uma só entidade (uma linha para cada métrica)
    let fc = null; try { fc = typeof nvFichaPack === 'function' ? nvFichaPack(ds) : null; } catch (e) { fc = null; }
    out.profile = fc ? { ok: true, score: fc.strong ? 1 : 0.6, why: `${fc.nNum} ${lang === 'en' ? 'indicators' : 'indicadores'}${fc.nText ? ` + ${fc.nText} ${lang === 'en' ? 'texts' : 'textos'}` : ''}${fc.entity ? ' · ' + fc.entity : ''}`, cols: {}, metrics: fc.nNum + fc.nText } : no(lang === 'en' ? 'needs a list of indicators for a single entity (one row per metric)' : 'precisa de uma lista de indicadores de uma só entidade (uma linha para cada métrica)'); }
  // linhas que são métricas diferentes (ficha, face a face em linhas por métrica): sem uma medida numérica, contar linhas por grupo não diz nada
  if (!F.mainCol && (!!(ds.fixes && ds.fixes.versus && ds.fixes.versus.form === 'metric-long') || out.profile.ok)) ['compare', 'rank', 'composition'].forEach(id => { if (out[id] && out[id].ok) out[id] = no(lang === 'en' ? 'the rows are different metrics: counting rows says nothing' : 'as linhas são métricas diferentes: contar linhas não diz nada'); });
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

/* =====================================================================================================================
 * Portão 43: arcos de roteiro por história (2, 5 e 10 slides) e filtro de pertencimento.
 * Cada passo é [tipo, chave, classes]. tipo: ctx (contexto), over (visão geral), fact (achado de uma das classes, em ordem de preferência),
 * synth (síntese e limites), impl (implicações). Achado fora de `allow` nunca entra; sem achado para um passo, o slide diz que não há base.
 * ===================================================================================================================== */
const NV_ARCS = {
  goal: {
    2: [['fact', 'att', ['attain']], ['impl']],
    5: [['ctx'], ['fact', 'att', ['attain']], ['fact', 'best', ['variance']], ['fact', 'worst', ['variance']], ['impl']],
    10: [['ctx'], ['over'], ['fact', 'att', ['attain']], ['fact', 'best', ['variance']], ['fact', 'worst', ['variance']], ['fact', 'gap', ['gap']], ['fact', 'ratio', ['ratio']], ['limits', 'limits2'], ['synth'], ['impl']],
  },
  before_after: {
    2: [['fact', 'step', ['step']], ['impl']],
    5: [['ctx'], ['fact', 'step', ['step']], ['fact', 'trend', ['trend']], ['fact', 'by', ['dimgap']], ['impl']],
    10: [['ctx'], ['over'], ['fact', 'step', ['step']], ['fact', 'trend', ['trend']], ['fact', 'by', ['dimgap']], ['fact', 'extra1', ['step', 'trend', 'dimgap']], ['fact', 'extra2', ['step', 'trend', 'dimgap']], ['limits', 'limits2'], ['synth'], ['impl']],
  },
  geo: {
    2: [['fact', 'lead', ['top', 'conc']], ['impl']],
    5: [['ctx'], ['fact', 'lead', ['top', 'conc']], ['fact', 'last', ['bottom']], ['fact', 'diff', ['spread', 'dimgap']], ['impl']],
    10: [['ctx'], ['over'], ['fact', 'lead', ['top']], ['fact', 'conc', ['conc']], ['fact', 'last', ['bottom']], ['fact', 'diff', ['spread']], ['fact', 'by', ['dimgap']], ['fact', 'extra1', ['top', 'bottom', 'conc', 'spread', 'dimgap']], ['synth'], ['impl']],
  },
  funnel: {
    2: [['fact', 'drop', ['drop', 'ratio']], ['impl']],
    5: [['ctx'], ['fact', 'rate', ['ratio']], ['fact', 'drop', ['drop']], ['fact', 'diff', ['dimgap']], ['impl']],
    10: [['ctx'], ['over'], ['fact', 'rate', ['ratio']], ['fact', 'drop', ['drop']], ['fact', 'drop2', ['drop']], ['fact', 'diff', ['dimgap']], ['fact', 'lead', ['top']], ['fact', 'last', ['bottom']], ['synth'], ['impl']],
  },
  compare: {
    2: [['fact', 'lead', ['top', 'spread']], ['impl']],
    5: [['ctx'], ['fact', 'lead', ['top', 'spread']], ['fact', 'last', ['bottom', 'gap']], ['fact', 'diff', ['dimgap', 'ratio', 'shift']], ['impl']],
    10: [['ctx'], ['over'], ['fact', 'lead', ['top']], ['fact', 'dist', ['spread', 'gap']], ['fact', 'last', ['bottom']], ['fact', 'diff', ['dimgap']], ['fact', 'ratio', ['ratio', 'gap']], ['fact', 'exc', ['shift']], ['synth'], ['impl']],
  },
  time: {
    2: [['fact', 'var', ['change', 'trend']], ['impl']],
    5: [['ctx'], ['fact', 'var', ['change', 'trend']], ['fact', 'trend', ['trend', 'shift']], ['fact', 'peak', ['top', 'bottom', 'drop']], ['impl']],
    10: [['ctx'], ['over'], ['fact', 'var', ['change']], ['fact', 'trend', ['trend']], ['fact', 'peak', ['top']], ['fact', 'low', ['bottom']], ['fact', 'turn', ['shift', 'drop']], ['fact', 'who', ['contrib']], ['synth'], ['impl']],
  },
  rank: {
    2: [['fact', 'conc', ['conc', 'top']], ['impl']],
    5: [['ctx'], ['fact', 'conc', ['conc']], ['fact', 'top', ['top']], ['fact', 'tail', ['bottom', 'contrib']], ['impl']],
    10: [['ctx'], ['over'], ['fact', 'conc', ['conc']], ['fact', 'top', ['top']], ['fact', 'top2', ['top']], ['fact', 'tail', ['bottom']], ['fact', 'weight', ['contrib']], ['fact', 'ratio', ['ratio']], ['synth'], ['impl']],
  },
  composition: {
    2: [['fact', 'part', ['top', 'conc']], ['impl']],
    5: [['ctx'], ['fact', 'part', ['top', 'conc']], ['fact', 'small', ['bottom']], ['fact', 'mix', ['shift', 'contrib']], ['impl']],
    10: [['ctx'], ['over'], ['fact', 'part', ['top']], ['fact', 'order', ['conc']], ['fact', 'small', ['bottom']], ['fact', 'mix', ['shift']], ['fact', 'who', ['contrib']], ['fact', 'by', ['dimgap']], ['synth'], ['impl']],
  },
  distribution: {
    2: [['fact', 'typical', ['dist']], ['impl']],
    5: [['ctx'], ['fact', 'typical', ['dist']], ['fact', 'atyp', ['atypical', 'atypical-rows']], ['fact', 'grp', ['dimgap']], ['impl']],
    10: [['ctx'], ['over'], ['fact', 'typical', ['dist']], ['fact', 'atyp', ['atypical']], ['fact', 'rows', ['atypical-rows']], ['fact', 'grp', ['dimgap']], ['fact', 'extra1', ['dist', 'atypical', 'atypical-rows', 'dimgap']], ['fact', 'extra2', ['dist', 'atypical', 'atypical-rows', 'dimgap']], ['synth'], ['impl']],
  },
  relation: {
    2: [['fact', 'rel', ['assoc']], ['impl']],
    5: [['ctx'], ['fact', 'rel', ['assoc']], ['fact', 'grp', ['dimgap']], ['fact', 'out', ['atypical-rows']], ['impl']],
    10: [['ctx'], ['over'], ['fact', 'rel', ['assoc']], ['fact', 'rel2', ['assoc']], ['fact', 'grp', ['dimgap']], ['fact', 'out', ['atypical-rows']], ['fact', 'ratio', ['ratio']], ['limits'], ['synth'], ['impl']],
  },
};
for (const id in NV_ARCS) NV_STORIES[id].arc = NV_ARCS[id];

const NVS_T = {
  pt: { att: 'Atingimento da meta', best: 'Quem superou a meta', worst: 'Quem ficou aquém', step: 'O que mudou depois do marco', rate: 'Quanto passa de uma etapa à outra', drop: 'Maior perda entre etapas', drop2: 'Segunda maior perda', lead: 'Quem lidera', dist: 'Distância entre os primeiros', last: 'Quem fica atrás', diff: 'O que diferencia os grupos', ratio: 'Quantas vezes maior', exc: 'Exceção', var: 'Variação no período', trend: 'Tendência', peak: 'Pico', low: 'Vale', turn: 'Ponto de virada', who: 'Quem puxou a variação',
    conc: 'Concentração', top: 'Quem lidera', top2: 'Quem vem em seguida', tail: 'A cauda', weight: 'Peso do topo', part: 'Maior parte do total', small: 'Menores partes', mix: 'Mudança de composição', order: 'Ordem das partes', by: 'Por outra dimensão',
    typical: 'Valor típico e faixa', atyp: 'Valores fora do padrão', rows: 'Linhas fora do padrão', grp: 'Grupo que se desvia', extra1: 'Mais um olhar sobre os valores', extra2: 'Outro ponto sobre os valores', rel: 'Relação principal', rel2: 'Segunda relação', out: 'Pontos que fogem da relação', limits: 'O que a relação não mostra', limits2: 'O que não dá para afirmar' },
  en: { att: 'Goal attainment', best: 'Who beat the goal', worst: 'Who fell short', step: 'What changed after the milestone', rate: 'How much moves from one stage to the next', drop: 'Largest loss between stages', drop2: 'Second largest loss', lead: 'Who leads', dist: 'Distance between the top ones', last: 'Who trails', diff: 'What sets groups apart', ratio: 'How many times larger', exc: 'Exception', var: 'Change in the period', trend: 'Trend', peak: 'Peak', low: 'Low', turn: 'Turning point', who: 'Who drove the change',
    conc: 'Concentration', top: 'Who leads', top2: 'Who comes next', tail: 'The tail', weight: 'Weight of the top', part: 'Largest part of the total', small: 'Smallest parts', mix: 'Change in mix', order: 'Order of the parts', by: 'By another dimension',
    typical: 'Typical value and range', atyp: 'Values outside the pattern', rows: 'Rows outside the pattern', grp: 'Group that deviates', extra1: 'Another look at the values', extra2: 'Another point about the values', rel: 'Main relationship', rel2: 'Second relationship', out: 'Points that leave the relationship', limits: 'What the relationship does not show', limits2: 'What cannot be claimed' },
};
// classes a que cada tipo de achado de "casos" (pesquisas, protocolos) equivale para efeito de pertencimento
const NV_ST_CASEFAM = { c_rate: 'ratio', c_where: 'dimgap', c_impact: 'gap', c_cause: 'dimgap', c_terms: 'overview' };
const nvStoryFam = f => { const c = nvCls(f); return NV_ST_CASEFAM[c] || c; };
const nvStoryAllows = (id, f) => { const d = NV_STORIES[id]; return !!d && d.allow.includes(nvStoryFam(f)); };
// o conjunto de achados da história: só o que pertence a ela; relações e fusões seguem coerentes com o recorte
function nvStoryPool(pool, id) {
  const items = pool.items.filter(f => nvStoryAllows(id, f)), ids = new Set(items.map(f => f.id));
  return { ...pool, items, relations: (pool.relations || []).filter(r => ids.has(r.a) && ids.has(r.b)) };
}

function nvPlanStory(P, meta, steps, N, id, basePool) {
  const D = NV_STORIES[id], arc = D && D.arc && D.arc[N]; if (!arc) return null;
  const X = nvpT(), R = X.r, TT = NVS_T[LANG] || NVS_T.pt, b = P.built, full = basePool || nvpPool(P, meta, steps), pool = nvStoryPool(full, id), used = new Set(), slides = [];
  const gn = ((typeof storyGroups === 'function' && b.kind !== 'relation') ? (storyGroups(P) || { list: [] }).list.length : 0) || ((b.totX || []).filter(t => t.value !== null).length);
  const take = cls => nvpTake(pool, used, f => cls.includes(nvStoryFam(f)));
  const fact = (f, role, title) => nvpFactSlide(f, role, title, N);
  let main = null; const gaps = [];
  const sCtx = () => { const c = nvpContext(P, X, N > 2); return nvpSynth('plan-ctx', 'ctx', R.ctx, c.lines, c.ev); };
  for (const [kind, key, cls] of arc) {
    if (kind === 'ctx') slides.push(sCtx());
    else if (kind === 'over') { const ov = nvpOverview(P, X), cx = nvpContext(P, X, true); if (nvpOverviewAdds(b, ov, cx)) slides.push(nvpSynth('plan-over', 'over', R.over, ov.lines, ov.ev)); }
    else if (kind === 'limits') { if (slides.some(s => !s.synthetic)) slides.push(nvpSynth('plan-limits', 'limits', TT[key || 'limits'], [X.noRange])); }
    else if (kind === 'fact') {
      let f = take(cls), role = key;
      if (!f) { // sem achado desta classe: um achado complementar da mesma história, se sobrar; senão o slide diz que não há base
        f = nvpTake(pool, used, () => true); role = 'extra';
        if (!f) { gaps.push(`${TT[key]}: ${X.no.nogen}`); continue; } // não vira slide: vai para a nota de limites
      }
      if (!main) main = f;
      slides.push(fact(f, role, role === 'extra' ? R.extra : TT[key]));
    } else if (kind === 'synth') {
      const c = nvpContext(P, X, false), left = pool.items.filter(f => !used.has(f.id)).slice(0, 3); left.forEach(f => used.add(f.id));
      const lim = []; const ex = pool.items.filter(f => f.confidenceLabel === 'exploratory').length; if (ex) lim.push(X.expl(ex));
      lim.push(...c.lines.filter(l => !/^(Todas|All) /.test(l) && /\d/.test(l) && /(usadas|used|ignoradas|ignored|fora dos cálculos|left out|Poucas|Few)/.test(l)));
      const sl = [...lim, ...gaps, ...left.map(f => f.head)].slice(0, 5);
      if (sl.length) { const sy = nvpSynth('plan-synth', 'synthesis', R.synth, [...sl, X.noRange]); sy.allow = left.some(f => ((f.ev && f.ev.allow) || []).includes('causal')) ? ['causal'] : []; slides.push(sy); }
    } else if (kind === 'impl') {
      const lines = [nvpQ(main, X, b.xIsTime), X.noRange], ex = pool.items.filter(f => f.confidenceLabel === 'exploratory').length; if (ex) lines.splice(1, 0, X.expl(ex));
      slides.push(nvpSynth('plan-impl', 'implication', N === 2 ? R.q2 : R.impl, lines));
    }
  }
  if (!slides.some(s => !s.synthetic)) { // a história não achou nada nos dados: roteiro curto e honesto, igual ao do Panorama sem achados
    const c = nvpContext(P, X, true), numeric = !!(b.rowStats || (b.aggKind && b.aggKind !== 'count'));
    const base = [nvpSynth('plan-ctx', 'ctx', R.ctx, c.lines, c.ev), nvpSynth('plan-lim', 'synth', R.synth, [X.noFind, ...(numeric ? [] : [X.noNum]), X.noRange])];
    const o = nvFinishPlan(P, base.slice(0, N), N, pool, null); o.story = id; return o;
  }
  if (N === 2 && slides[0] && slides[0].role !== 'ctx') { const c = nvpContext(P, X, false); if (!slides[0].synthetic) slides[0].note = [c.lines.slice(0, 2).join(' · '), slides[0].note].filter(Boolean).join('. '); }
  const out = nvFinishPlan(P, slides.filter(Boolean), N, pool, main); out.story = id;
  const bad = out.slides.filter(s => !s.synthetic && !nvStoryAllows(id, s)).map(s => s.id); // nunca deve acontecer; o validador também confere
  if (bad.length) out.report.errors.push({ id: 'plan', code: 'out-of-story', msg: 'achado fora da história: ' + bad.join(',') }), out.report.ok = false;
  return out;
}

/* Portão 44: ranking final com os achados já calculados. A elegibilidade diz o que os dados PERMITEM; aqui entra o que o motor realmente ACHOU
 * dentro de cada história: sem nenhum achado a história cai para fora das sugestões e, com vários, sobe. `pool` vem de nvpPool(P, meta, steps). */
function nvStoryRank(ds, P, pool, opt = {}) {
  const base = nvStorySuggest(ds, { ...opt, n: 99 }), all = base.all, area = P && P.br && P.br.area || opt.area || null, N = opt.n || 3, facts = {}, score = {};
  for (const id of NV_ST_ORDER) {
    if (!all[id].ok) continue;
    if (NV_OWN.includes(id)) { facts[id] = all[id].metrics; score[id] = Math.min(1.5, all[id].score + 0.2 + (typeof nvStoryAreaBoost === 'function' ? nvStoryAreaBoost(area, id) : 0)); continue; } // o roteiro vem do próprio pacote (face a face, resumo por temporada, ficha), não do conjunto de achados
    const items = nvStoryPool(pool, id).items, firm = items.filter(f => f.confidenceLabel !== 'exploratory').length;
    if (NV_STORIES[id].phase > 1 && nvStoryLegacy(id) !== (P && P.mstory)) { facts[id] = null; score[id] = Math.min(1, all[id].score + (typeof nvStoryAreaBoost === 'function' ? nvStoryAreaBoost(area, id) : 0)); continue; } // história que pede outro mapeamento: os achados só existem depois de remontar a peça
    facts[id] = items.length; let sc = all[id].score;
    if (!items.length) sc = Math.min(sc, 0.3); else sc = Math.min(1, sc * (0.85 + 0.15 * Math.min(1, firm / 3))) + 0.0; // achado firme sobe, só exploratório desce um pouco
    sc += (typeof nvStoryAreaBoost === 'function' ? nvStoryAreaBoost(area, id) : 0);
    score[id] = Math.round(sc * 1000) / 1000;
  }
  const spec = id => (NV_STORIES[id].phase > 1 ? 1 : 0); // empate: a história mais específica (meta, funil, geografia, antes e depois) vence a genérica
  const possible = NV_ST_ORDER.filter(id => all[id].ok).sort((a, b) => score[b] - score[a] || spec(b) - spec(a) || ((facts[b] || 0) - (facts[a] || 0)) || NV_ST_ORDER.indexOf(a) - NV_ST_ORDER.indexOf(b));
  const list = possible.filter(id => score[id] >= NV_ST_MIN_SCORE && (facts[id] === null || facts[id] > 0)).slice(0, N);
  return { all, list, possible, blocked: base.blocked, facts, score, area };
}

/* Portão 45: a área de atuação é um SINAL (empurra a sugestão), nunca um filtro. Valores da especificação §8. */
const NV_ST_AREA = { sales: ['goal', 'rank', 'time'], marketing: ['funnel', 'relation', 'compare'], growth: ['funnel', 'time', 'before_after'], cx: ['compare', 'distribution', 'rank'], finance: ['goal', 'time', 'composition'], ops: ['distribution', 'time', 'funnel'], hr: ['distribution', 'compare', 'composition'], health: ['distribution', 'time', 'geo'], education: ['relation', 'distribution', 'compare'], public: ['goal', 'geo', 'composition'], legal: ['time', 'rank', 'compare'], general: [] };
const nvStoryAreaBoost = (area, id) => { const l = NV_ST_AREA[area]; if (!l) return 0; const i = l.indexOf(id); return i < 0 ? 0 : [0.08, 0.05, 0.03][i]; };

/* =====================================================================================================================
 * Portão 47: Meta e desempenho (realizado × meta) e Antes e depois (degrau entre dois blocos de tempo).
 * Achados novos com evidência estruturada e recálculo independente (attain, varc, step). Nada de meta inventada: sem coluna de meta, não há história.
 * ===================================================================================================================== */
Object.assign(NV_CALC, {
  attain: v => ({ p: v.a / v.m * 100 }),
  varc: v => ({ d: (v.a / v.m - 1) * 100, p: v.a / v.m * 100 }),
  step: v => ({ ch: (v.a / v.b - 1) * 100, t: v.na >= 2 && v.nb >= 2 && (v.sa * v.sa / v.na + v.sb * v.sb / v.nb) > 0 ? (v.a - v.b) / Math.sqrt(v.sa * v.sa / v.na + v.sb * v.sb / v.nb) : null }),
});
Object.assign(NV_DEN, { attain: v => v.m, varc: v => v.m, step: v => v.b });
Object.assign(NV_CFG.minSample, { attain: 1, varc: 1, step: 8 });
Object.assign(NV_CLASS, { attain: 'attain', varc: 'variance', step: 'step' });
NV_CFG.stepT = 2; // diferença entre antes e depois só vale com |t| de Welch >= 2 sobre os totais por período

const NV_META_RE = /(^|[^a-z])(meta|metas|or[cç]ad\w*|planejad\w*|previst\w*|target|budget|plan|objetivo|quota|forecast)([^a-z]|$)/i;
const NV_REAL_RE = /(realizad\w*|executad\w*|actual|resultado|venda|receita|revenue|sales|real)/i;
const NV_PHASE_RE = /(antes|depois|before|after|pr[eé]|p[oó]s|post)/i;
function nvGoalPair(cols) {
  const meas = cols.map((c, i) => ({ c, i })).filter(({ c }) => colUsable(c) && !c.hide && c.kind === 'number' && c.role === 'measure');
  const meta = meas.find(({ c }) => NV_META_RE.test(c.name)); if (!meta) return null;
  const rest = meas.filter(x => x !== meta), act = rest.find(({ c }) => NV_REAL_RE.test(c.name)) || rest[0]; if (!act) return null;
  return { meta, act };
}
// realizado e meta somados nas linhas em que os dois existem, e por grupo (a primeira dimensão com 2 a 30 valores)
function nvGoalStats(ds) {
  const pair = nvGoalPair(ds.columns); if (!pair) return null;
  const n = ds.rowCount, a = pair.act.c, m = pair.meta.c; let A = 0, M = 0, k = 0;
  for (let i = 0; i < n; i++) { const x = a.data[i], y = m.data[i]; if (Number.isFinite(x) && Number.isFinite(y)) { A += x; M += y; k++; } }
  if (k < 5 || !(M > 0)) return null;
  let groups = null, groupName = null;
  const dim = ds.columns.filter(c => isGroupDim(c) && c.codes && c.dict && c.dict.length >= 2 && c.dict.length <= 30 && colUsable(c) && !c.hide).sort((p, q) => p.dict.length - q.dict.length)[0];
  if (dim) { const ga = dim.dict.map(() => 0), gm = dim.dict.map(() => 0); for (let i = 0; i < n; i++) { const x = a.data[i], y = m.data[i], g = dim.codes[i]; if (g >= 0 && Number.isFinite(x) && Number.isFinite(y)) { ga[g] += x; gm[g] += y; } } groups = dim.dict.map((l, g) => ({ label: l, a: ga[g], m: gm[g] })).filter(g => g.m > 0 && !isPlaceholderLabel(g.label)); groupName = dim.name; }
  return { actual: a.name, meta: m.name, unit: a.unit || null, A, M, n: k, groups, groupName };
}
// degrau: totais por período antes e depois do marco (coluna de fase com duas categorias, ou data escolhida pela pessoa)
function nvStepStats(ds, cut) {
  const dcol = ds.columns.find(c => c.kind === 'date' && colUsable(c) && !c.hide && c.data); if (!dcol) return null;
  const meas = ds.columns.find((c, i) => i === bestMeasure(ds.columns)), n = ds.rowCount;
  let ph = null; // coluna de fase: duas categorias com ar de antes/depois
  for (const c of ds.columns) if (isGroupDim(c) && c.codes && c.dict && c.dict.length === 2 && c.dict.every(l => NV_PHASE_RE.test(l))) { ph = c; break; }
  let cutMs = Number.isFinite(cut) ? cut : null, label = null;
  if (ph) { const order = ph.dict.map((l, k) => [l, k]).sort((x, y) => (/antes|before|pr[eé]|pre/i.test(x[0]) ? -1 : 1) - (/antes|before|pr[eé]|pre/i.test(y[0]) ? -1 : 1)); ph._bef = order[0][1]; label = order[1][0]; }
  else if (cutMs === null) return null;
  // o grão é o mais grosso em que cada lado tem 6 ou mais períodos (senão 4); períodos que misturam os dois lados ficam de fora
  const run = grain => {
    const tot = new Map(), side = new Map();
    for (let i = 0; i < n; i++) {
      const t = dcol.data[i]; if (Number.isNaN(t)) continue; const v = meas && meas.data ? meas.data[i] : 1; if (!Number.isFinite(v)) continue;
      const b = bucketStart(t, grain); tot.set(b, (tot.get(b) || 0) + v);
      const sd = ph ? (ph.codes[i] < 0 ? -1 : ph.codes[i] === ph._bef ? 0 : 1) : (t < cutMs ? 0 : 1); if (sd < 0) continue;
      const s = side.get(b) || [0, 0]; s[sd]++; side.set(b, s);
    }
    const bef = [], aft = [];
    for (const [b, v] of [...tot].sort((x, y) => x[0] - y[0])) { const s = side.get(b); if (!s) continue; if (s[0] && !s[1]) bef.push(v); else if (s[1] && !s[0]) aft.push(v); }
    return { bef, aft, grain };
  };
  const grains = ['year', 'quarter', 'month', 'week', 'day'].filter(g => { const c = bucketCount(dcol.min, dcol.max, g); return c >= 8 && c <= 400; }), runs = grains.map(run);
  const pick = runs.find(r => r.bef.length >= 6 && r.aft.length >= 6) || runs.find(r => r.bef.length >= 4 && r.aft.length >= 4); if (!pick) return null;
  const { bef, aft, grain } = pick;
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length, sd = a => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / (a.length - 1)); };
  if (!(mean(bef) > 0)) return null;
  return { measure: meas ? meas.name : null, unit: meas ? meas.unit || null : null, grain, cutMs, label: label || null, byPhase: !!ph, b: mean(bef), a: mean(aft), sb: sd(bef), sa: sd(aft), nb: bef.length, na: aft.length };
}
const NV_GX = {
  pt: { att: (a, m, p, M, A, u) => `${a} atingiu ${p} da meta (${m}): ${A} de ${M}.`, over: (g, d, a, m) => `${g} superou a meta em ${d} (${a} de ${m}).`, under: (g, d, a, m) => `${g} ficou ${d} frente à meta (${a} de ${m}).`, step: (g, a, b, d, cut, meas) => `Depois do marco${cut ? ' (' + cut + ')' : ''}, a média de ${meas} por ${g} foi ${a}, ${d} em relação aos ${b} de antes.`,
    cAtt: 'Atingimento da meta', fAtt: 'realizado ÷ meta', cDev: 'Desvio frente à meta', fDev: 'realizado ÷ meta − 1', cStep: 'Média por período, antes e depois', fStep: 'média depois ÷ média antes − 1', real: 'Realizado', meta: 'Meta', ratio: 'Atingimento', before: 'Antes', after: 'Depois', chg: 'Variação', per: 'períodos', base: 'Base', grain: { day: 'dia', week: 'semana', month: 'mês', quarter: 'trimestre', year: 'ano' } },
  en: { att: (a, m, p, M, A, u) => `${a} reached ${p} of the goal (${m}): ${A} of ${M}.`, over: (g, d, a, m) => `${g} beat the goal by ${d} (${a} of ${m}).`, under: (g, d, a, m) => `${g} came in ${d} against the goal (${a} of ${m}).`, step: (g, a, b, d, cut, meas) => `After the milestone${cut ? ' (' + cut + ')' : ''}, the average ${meas} per ${g} was ${a}, ${d} compared with ${b} before.`,
    cAtt: 'Goal attainment', fAtt: 'actual ÷ goal', cDev: 'Deviation from goal', fDev: 'actual ÷ goal − 1', cStep: 'Average per period, before and after', fStep: 'average after ÷ average before − 1', real: 'Actual', meta: 'Goal', ratio: 'Attainment', before: 'Before', after: 'After', chg: 'Change', per: 'periods', base: 'Base', grain: { day: 'day', week: 'week', month: 'month', quarter: 'quarter', year: 'year' } },
};
function nvGoalInsights(b, lang) {
  const out = [], L = lang === 'en' ? 'en' : 'pt', X = NV_GX[L], g = b && b.goal, s = b && b.step;
  if (g) {
    const f = v => fmtNum(v, g.unit, lang), p = g.A / g.M * 100, pt = csPct(p, lang), base = `${X.base} · ${g.actual} × ${g.meta}`;
    out.push({ id: 'goal_attain', act: 'goal_attain', text: X.att(g.actual, g.meta, pt, f(g.M), f(g.A)), calc: { title: X.cAtt, formula: X.fAtt, rows: [{ k: X.real, v: f(g.A), n: g.n }, { k: X.meta, v: f(g.M) }, { k: X.ratio, v: pt }], base },
      ev: nvEv('attain', { a: g.A, m: g.M }, [{ k: 'p', value: p, text: pt }], { n: g.n, method: 'ratio-of-sums', refs: [g.actual, g.meta] }) });
    const gs = (g.groups || []).filter(x => x.m > 0);
    if (gs.length >= 3) {
      const dev = x => (x.a / x.m - 1) * 100, srt = gs.slice().sort((x, y) => dev(y) - dev(x)), hi = srt[0], lo = srt[srt.length - 1];
      for (const [x, up] of [[hi, true], [lo, false]]) {
        const d = dev(x); if (Math.abs(d) < 5 || (up && d <= 0) || (!up && d >= 0)) continue; const dt = fmtPct(d, lang);
        out.push({ id: 'goal_' + (up ? 'over' : 'under') + ':' + g.groupName, act: 'goal_group', text: (up ? X.over : X.under)(x.label, dt, f(x.a), f(x.m)), calc: { title: X.cDev, formula: X.fDev, rows: [{ k: x.label + ' · ' + X.real, v: f(x.a) }, { k: x.label + ' · ' + X.meta, v: f(x.m) }, { k: X.chg, v: dt }], base: `${base} · ${g.groupName}` },
          ev: nvEv('varc', { a: x.a, m: x.m }, [{ k: 'd', value: d, text: dt }], { n: gs.length, method: 'ratio-by-group', refs: [x.label, g.groupName] }) });
      }
    }
  }
  if (s) {
    const f = v => fmtNum(v, s.unit, lang), ch = (s.a / s.b - 1) * 100, dt = fmtPct(ch, lang), gr = X.grain[s.grain] || s.grain, meas = s.measure || (lang === 'en' ? 'rows' : 'linhas');
    out.push({ id: 'step_change', act: 'step', text: X.step(gr, f(s.a), f(s.b), dt, s.label || '', meas), calc: { title: X.cStep, formula: X.fStep, rows: [{ k: X.before, v: f(s.b), n: s.nb }, { k: X.after, v: f(s.a), n: s.na }, { k: X.chg, v: dt }], base: `${X.base} · ${meas}` },
      ev: nvEv('step', { a: s.a, b: s.b, sa: s.sa, sb: s.sb, na: s.na, nb: s.nb }, [{ k: 'ch', value: ch, text: dt }], { n: s.na + s.nb, method: 'welch', refs: [s.label || '', meas] }) });
  }
  return out;
}

// elegibilidade (acrescenta às da Fase 1; chamada por nvStoryEligibility)
function nvStoryEligibility3(ds, lang, F) {
  const X = NV_TX[lang], out = {}, no = why => ({ ok: false, score: 0, why });
  const pair = nvGoalPair(ds.columns);
  out.goal = pair ? { ok: true, score: Math.min(1, 0.75 + (ds.rowCount >= 30 ? 0.25 : 0.05)), why: `${pair.act.c.name} × ${pair.meta.c.name}`, cols: { actual: pair.act.i, meta: pair.meta.i } } : no(X.noGoal);
  let ph = null; for (const c of ds.columns) if (isGroupDim(c) && c.codes && c.dict && c.dict.length === 2 && c.dict.every(l => NV_PHASE_RE.test(l))) ph = c;
  const dt = F.dates.find(d => d.periods >= 8);
  if (ph) out.before_after = { ok: true, score: 1, why: `${ph.name}: ${ph.dict.join(' / ')}`, cols: { phase: ds.columns.indexOf(ph) } };
  else if (dt) out.before_after = { ok: true, score: 0.3, why: X.pickCut, needsCut: true, cols: { time: dt.i } }; // possível, mas só com a data do marco escolhida pela pessoa: nunca sugerida sozinha
  else out.before_after = no(X.noCut);
  return out;
}
