/* Datavix: modelo "Face a face" (portão 50). Especificação: docs/especificacao-modelos-e-abas.md §5.
 * Duas etapas. (1) nvVsPack(ds) transforma a planilha lida como face a face (src/versus.js) em números e textos puros: placar, totais, períodos,
 * taxas, perfis e limites. O resultado vai em built.vs, por isso a apresentação exportada e o vídeo não precisam da planilha. (2) nvPlanVersus(P, N)
 * monta os slides do roteiro (até 8; só existe slide que tem dados) com o cálculo à vista.
 * Regras: só se comparam métricas de mesma unidade, ordens (posição, idade) e colunas de exposição ficam fora do placar, quem não tinha registro
 * no período fica fora do recorte e "maior valor" é neutro: o Datavix não diz quem é melhor nem explica a diferença. */

const NV_VS_ORD = /(^|[^a-zà-ú])(idade|age|posi[cç][aã]o|position|ranking|rank|coloca[cç][aã]o|classifica[cç][aã]o|grid|ordem)([^a-zà-ú]|$)/i;
const NV_VS_RATE = /(m[eé]dia|taxa|aproveit|percent|propor[cç]|rate|avg|average|ratio)|%/i;
const NV_VS_BLOCK = /(carreira|total|geral|career|overall|all[- ]time|hist[oó]ric)/i;
const NV_VS_SEASON = /temporada|season/i;
const nvVsAt = (c, i) => { // rótulo da célula: categoria, texto, número ou data
  if (!c) return '';
  if (c.codes) return c.codes[i] < 0 ? '' : String(c.dict[c.codes[i]]);
  if (c.texts && c.texts[i]) return String(c.texts[i]);
  if (c.data && Number.isFinite(c.data[i])) return c.kind === 'date' ? bucketLabel(c.data[i], 'day', LANG) : String(c.data[i]);
  return '';
};
const nvVsKey = (p, e) => p + '\u0001' + e;

// ---------------------------------------------------------------- etapa 1: números e textos puros
function nvVsPack(ds) {
  if (!ds || !ds.columns) return null;
  if (ds._vsp !== undefined) return ds._vsp;
  let pk = null; try { const v = nvVersus(ds); pk = v ? nvVsBuildPack(ds, v) : null; } catch (e) { console.error(e); pk = null; }
  Object.defineProperty(ds, '_vsp', { value: pk, enumerable: false, configurable: true }); return pk;
}
function nvVsBuildPack(ds, v) {
  const cols = ds.columns, n = ds.rowCount, ec = cols[v.entityCol], ents = v.entities.slice(), E = ents.length;
  if (E < 2 || E > 4 || !ec || !ec.codes) return null;
  const M = new Map(), periods = [], pseen = new Set(), absent = [], absSeen = new Set(), texts = new Map(), eIdx = ec.dict.map(l => ents.indexOf(l));
  const metric = (name, unit) => {
    let m = M.get(name); if (m) return m;
    m = { name, unit: unit || '', ord: NV_VS_ORD.test(name) || unit === 'º', exp: NV_VS_EXPOSURE.test(name), rate: NV_VS_RATE.test(name) || unit === '%', hint: nvVersusDirection(name).hint, cells: new Map(), units: new Map(), dup: false };
    M.set(name, m); return m;
  };
  const put = (m, p, e, x, unit) => { const k = nvVsKey(p, e); if (m.cells.has(k)) m.dup = true; else { m.cells.set(k, x); m.units.set(k, unit || ''); } };
  const addP = p => { if (!pseen.has(p)) { pseen.add(p); periods.push(p); } };
  const markAbsent = (p, e) => { const k = nvVsKey(p, e); if (!absSeen.has(k)) { absSeen.add(k); absent.push({ p, e }); } };
  const pc = v.periodCol >= 0 ? cols[v.periodCol] : null;
  if (v.form === 'metric-long') {
    const vc = cols[v.valueCol], uc = cols[v.unitCol], tc = cols[v.textCol], mc = cols[v.metricCol]; if (!vc || !mc) return null;
    for (let r = 0; r < n; r++) {
      const e = ec.codes[r] < 0 ? -1 : eIdx[ec.codes[r]]; if (e < 0) continue;
      const name = nvVsAt(mc, r).trim(); if (!name) continue; const p = pc ? nvVsAt(pc, r).trim() : ''; addP(p);
      const x = vc.data ? vc.data[r] : NaN, unit = uc ? nvVsAt(uc, r) : '', tx = tc ? nvVsAt(tc, r) : '';
      if (Number.isFinite(x)) put(metric(name, unit), p, e, x, unit);
      else if (tx) { if (NV_VS_ABSENT.test(tx)) markAbsent(p, e); else { const k = name + '\u0001' + p; let o = texts.get(k); if (!o) { o = { name, p, t: ents.map(() => null) }; texts.set(k, o); } if (o.t[e] === null) o.t[e] = tx; } }
    }
  } else {
    const mcs = (v.measures || []).map(i => cols[i]);
    for (let r = 0; r < n; r++) {
      const e = ec.codes[r] < 0 ? -1 : eIdx[ec.codes[r]]; if (e < 0) continue;
      const p = pc ? nvVsAt(pc, r).trim() : ''; addP(p);
      if (v.absent && v.absent[r]) { markAbsent(p, e); continue; } // sem registro naquele período: não entra em nenhuma conta, nunca vira zero
      mcs.forEach(c => { const x = c.data ? c.data[r] : NaN; if (Number.isFinite(x)) put(metric(c.name, c.unit || ''), p, e, x, c.unit || ''); });
    }
  }
  const all = [...M.values()], has = (m, p, e) => m.cells.has(nvVsKey(p, e)), val = (m, p, e) => m.cells.get(nvVsKey(p, e));
  const complete = (m, p) => { for (let e = 0; e < E; e++) if (!has(m, p, e)) return false; const u = m.units.get(nvVsKey(p, 0)); for (let e = 1; e < E; e++) if (m.units.get(nvVsKey(p, e)) !== u) return false; return true; };
  const comparable = all.filter(m => !m.ord && !m.exp && !m.dup), pack = { form: v.form, ents, periods, periodName: pc ? pc.name : '', absent: absent.map(a => ({ p: a.p, e: a.e })), score: null, seasons: [], eff: [], profile: [], notes: {}, span: '' };
  const years = periods.flatMap(p => (p.match(/\b(?:19|20)\d{2}\b/g) || []).map(Number)); if (years.length) { const a = Math.min(...years), b = Math.max(...years); pack.span = a === b ? String(a) : `${a}–${b}`; }
  const expo = all.find(m => m.exp && !m.dup) || null;
  pack.notes.ord = all.filter(m => m.ord && periods.some(p => complete(m, p))).map(m => m.name);
  pack.notes.dropped = ((ds.fixes && ds.fixes.versus && ds.fixes.versus.dropped) || []).slice();
  pack.notes.noUnit = comparable.filter(m => periods.some(p => [...Array(E).keys()].every(e => has(m, p, e))) && !periods.some(p => complete(m, p))).map(m => m.name);
  const itemOf = (m, p) => ({ name: m.name, unit: m.units.get(nvVsKey(p, 0)) || m.unit || '', rate: m.rate, hint: m.hint, v: ents.map((_, e) => val(m, p, e)) });
  if (v.form === 'entity-long') {
    const absP = new Set(absent.map(a => a.p)), incl = periods.filter(p => !absP.has(p) && comparable.some(m => complete(m, p)));
    const add = comparable.filter(m => !m.rate && [...m.cells.values()].every(x => x >= 0)), use = add.filter(m => incl.length && incl.every(p => complete(m, p)));
    try { const ph = nvVsPhasePack(ds, v, all, periods, ents, absent, expo); pack.pd = ph.pd; pack.phases = ph.phases; pack.cols = ph.cols; } catch (e) { console.error(e); }
    pack.incl = incl; pack.notes.leftOut = add.filter(m => !use.includes(m)).map(m => m.name);
    if (!incl.length || !use.length) return pack.score ? pack : null;
    pack.score = { range: nvVsRange(incl), block: null, how: 'sum', items: use.map(m => ({ name: m.name, unit: m.unit, rate: false, hint: m.hint, v: ents.map((_, e) => incl.reduce((a, p) => a + val(m, p, e), 0)) })) };
    if (incl.length >= 2 && use.length >= 2) pack.seasons = incl.map(p => ({ p, items: use.map(m => itemOf(m, p)) }));
    if (expo && incl.every(p => complete(expo, p))) {
      const den = ents.map((_, e) => incl.reduce((a, p) => a + val(expo, p, e), 0));
      if (den.every(d => d > 0)) { pack.exposure = { name: expo.name }; pack.eff = use.map(m => ({ kind: 'calc', name: m.name, den: expo.name, num: pack.score.items.find(it => it.name === m.name).v.slice(), dv: den.slice() })); }
      incl.forEach(p => { const xs = ents.map((_, e) => val(expo, p, e)), hi = Math.max(...xs), lo = Math.min(...xs); if (hi > 0 && lo / hi < 0.5) (pack.notes.expoGap = pack.notes.expoGap || []).push({ p, name: expo.name, v: xs }); });
    }
  } else {
    let best = null;
    periods.forEach(p => { const items = comparable.filter(m => complete(m, p)); if (!items.length) return; const pref = NV_VS_BLOCK.test(p) ? 1 : 0; if (!best || items.length > best.items.length || (items.length === best.items.length && pref > best.pref)) best = { p, items, pref }; });
    if (!best) return null;
    pack.score = { range: best.p || '', block: best.p, how: 'cell', items: best.items.map(m => itemOf(m, best.p)) };
    const seas = periods.filter(p => p !== best.p).map(p => ({ p, items: comparable.filter(m => complete(m, p)).map(m => itemOf(m, p)) })).filter(s => s.items.length >= 2);
    if (seas.length >= 2) pack.seasons = seas;
    if (expo && complete(expo, best.p)) {
      const den = ents.map((_, e) => val(expo, best.p, e));
      if (den.every(d => d > 0)) { pack.exposure = { name: expo.name }; pack.eff = pack.score.items.filter(it => it.rate).map(it => ({ kind: 'sheet', name: it.name, unit: it.unit, v: it.v.slice() })).concat(pack.score.items.filter(it => !it.rate && it.v.every(x => x >= 0)).map(it => ({ kind: 'calc', name: it.name, den: expo.name, num: it.v.slice(), dv: den.slice() }))); }
    }
    pack.profile = [...texts.values()].filter(o => o.t.filter(x => x !== null).length >= 2).map(o => ({ name: o.name, p: o.p, t: o.t.slice() }));
  }
  pack.notes.lower = [...new Set([...(pack.score.items || []), ...pack.seasons.flatMap(s => s.items)].filter(it => it.hint === 'lower').map(it => it.name))];
  return pack;
}
const nvVsRange = a => (a.length <= 3 ? a.join(', ') : `${a[0]}–${a[a.length - 1]}`);
// quem tem o maior valor em cada métrica (índice) ou -1 em empate com o primeiro lugar
const nvVsWinner = v => { let hi = -Infinity, w = -1, tie = false; v.forEach((x, i) => { if (x > hi + 1e-12) { hi = x; w = i; tie = false; } else if (Math.abs(x - hi) <= 1e-12) tie = true; }); return tie ? -1 : w; };
function nvVsTally(items, E) { const wins = new Array(E).fill(0), who = items.map(it => nvVsWinner(it.v)); let tie = 0; who.forEach(w => { if (w < 0) tie++; else wins[w]++; }); return { wins, tie, who }; }

// ---------------------------------------------------------------- etapa 2: texto e slides
Object.assign(NV_CALC, {
  vsscore: v => ({ tot: v.wins.reduce((a, x) => a + x, 0) + v.tie, lead: Math.max(...v.wins) }),
  vsratio: v => ({ x: v.top / v.low }),
  vsrate: v => ({ r: v.num / v.den }),
});
Object.assign(NV_DEN, { vsscore: v => v.total, vsratio: v => v.low, vsrate: v => v.den });
Object.assign(NV_CFG.minSample, { vsscore: 1, vsratio: 1, vsrate: 1 });
Object.assign(NV_CLASS, { vsscore: 'vsscore', vsratio: 'vsratio', vsrate: 'vsrate' });

const NVV = {
  pt: {
    t: { cover: 'Capa', score: 'Placar', seasons: 'Período a período', seasonsS: 'Temporada a temporada', totals: 'Totais lado a lado', eff: 'Eficiência', prof: 'Perfil', lim: 'Limites da comparação', synth: 'Síntese', synthLim: 'Síntese e limites' },
    list: (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1]),
    metrics: n => `${n} ${n === 1 ? 'métrica comparável' : 'métricas comparáveis'}`, ofM: (a, t) => `${a} de ${t}`, vs: ' × ',
    cover: (ents, n, span, file) => [ents.join(' × '), `${n}`, span ? `Período: ${span}` : '', file ? `Fonte: ${file}` : ''].filter(Boolean),
    scoreH: (range, parts, T, tie, ents) => `${range ? `No recorte com registro de todos (${range}), ` : ''}${parts} entre ${T} ${T === 1 ? 'métrica' : 'métricas'}${tie ? `; empate em ${tie}` : ''}.`,
    scoreP: (ent, k) => `${ent} tem o maior valor em ${k}`, scoreEq: (ents, k) => `${ents.join(' e ')} dividem: ${k} métrica${k === 1 ? '' : 's'} para cada`, scoreAll: (ents, ks) => ents.map((e, i) => `${e} em ${ks[i]}`).join(', '),
    scoreT: 'Métricas com o maior valor', scoreCT: 'Quem tem o maior valor em cada métrica', scoreCF: 'Para cada métrica comparável, o maior valor entre as entidades; valores iguais contam como empate.', ties: 'Empates', big: 'METRICAS COM O MAIOR VALOR', base: 'Base', of: 'de',
    perH: (K, word, parts, ties) => `Em ${K} ${word}, ${parts}${ties}.`, perP: (ent, k, ps) => `${ent} tem mais métricas com o maior valor em ${k} (${ps})`, perTie: ps => `empate em ${ps}`, perNone: 'nenhuma entidade ficou à frente',
    perWord: (seasonal, K) => (seasonal ? (K === 1 ? 'temporada' : 'temporadas') : (K === 1 ? 'período' : 'períodos')), perBig: 'À FRENTE EM MAIS MÉTRICAS', perT: 'Métricas com o maior valor, por período',
    perCT: 'Placar de cada período', perCF: 'Em cada período, quantas métricas cada um tem com o maior valor; só entram períodos em que todos têm registro.', gap: 'maior diferença',
    totH: (range, parts, tie) => `Totais lado a lado${range ? ` (${range})` : ''}: ${parts}${tie ? `; empate em ${tie}` : ''}.`, totP: (ent, names) => `${ent} tem o maior valor em ${names}`, totT: 'Totais lado a lado', totCT: 'Valores lado a lado', totCF: 'Soma dos períodos do recorte para cada métrica, ou o valor da planilha.', totSum: 'soma', times: 'vezes',
    ratioL: (m, a, b) => `${m}: ${a} ÷ ${b}`,
    effH: (name, den, parts) => `${name} ÷ ${den}: ${parts}.`, effS: (name, parts) => `${name}: ${parts} (valores da planilha).`, effT: 'Taxas', effCT: 'Taxas calculadas', effCF: 'Total da métrica ÷ total da exposição, no mesmo recorte. Taxas “da planilha” são os valores digitados nela.', calc: 'calculado', sheet: 'da planilha',
    profH: 'Perfil de cada um, nas palavras da planilha.', profT: 'Textos da planilha',
    limAbsent: (ent, ps, k) => `${ent} não tem registro em ${ps}: ${k === 1 ? 'esse período ficou' : 'esses períodos ficaram'} fora do placar`, limGap: (p, name, vals) => `${p}: ${name} não é igual entre as entidades (${vals}), então a comparação tem exposição diferente`,
    limOrd: names => `Não entram no placar por serem uma ordem, não uma quantidade: ${names}`, limLower: names => `Em ${names}, o maior valor pode ser o resultado menos desejável; o Datavix não faz esse julgamento`, limDrop: names => `Colunas derivadas ficaram de fora (o Datavix recalcula): ${names}`,
    limUnit: names => `Sem unidade em comum entre as entidades, não comparadas: ${names}`, limLeft: names => `Faltam valores em algum período, ficaram de fora: ${names}`, limRange: 'Os números descrevem esta planilha e não provam relações entre as variáveis', limWho: 'Comparar totais não explica a diferença entre as entidades',
    synthH: (ents, ks, T, tie) => `Resumo: ${ents.map((e, i) => `${e} ${ks[i]}`).join(' · ')}${tie ? ` · empates ${tie}` : ''}, em ${T} ${T === 1 ? 'métrica comparável' : 'métricas comparáveis'}`,
  },
  en: {
    t: { cover: 'Cover', score: 'Scoreboard', seasons: 'Period by period', seasonsS: 'Season by season', totals: 'Totals side by side', eff: 'Efficiency', prof: 'Profile', lim: 'Limits of the comparison', synth: 'Summary', synthLim: 'Summary and limits' },
    list: (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]),
    metrics: n => `${n} comparable ${n === 1 ? 'metric' : 'metrics'}`, ofM: (a, t) => `${a} of ${t}`, vs: ' × ',
    cover: (ents, n, span, file) => [ents.join(' × '), `${n}`, span ? `Period: ${span}` : '', file ? `Source: ${file}` : ''].filter(Boolean),
    scoreH: (range, parts, T, tie, ents) => `${range ? `Where everyone has a record (${range}), ` : ''}${parts} out of ${T} ${T === 1 ? 'metric' : 'metrics'}${tie ? `; tied on ${tie}` : ''}.`,
    scoreP: (ent, k) => `${ent} has the highest value in ${k}`, scoreEq: (ents, k) => `${ents.join(' and ')} are even: ${k} metric${k === 1 ? '' : 's'} each`, scoreAll: (ents, ks) => ents.map((e, i) => `${e} in ${ks[i]}`).join(', '),
    scoreT: 'Metrics with the highest value', scoreCT: 'Who has the highest value in each metric', scoreCF: 'For each comparable metric, the highest value among the entities; equal values count as a tie.', ties: 'Ties', big: 'METRICS WITH THE HIGHEST VALUE', base: 'Base', of: 'of',
    perH: (K, word, parts, ties) => `Across ${K} ${word}, ${parts}${ties}.`, perP: (ent, k, ps) => `${ent} has more metrics with the highest value in ${k} (${ps})`, perTie: ps => `tied in ${ps}`, perNone: 'no entity came out ahead',
    perWord: (seasonal, K) => (seasonal ? (K === 1 ? 'season' : 'seasons') : (K === 1 ? 'period' : 'periods')), perBig: 'AHEAD ON MORE METRICS', perT: 'Metrics with the highest value, by period',
    perCT: 'Scoreboard of each period', perCF: 'In each period, how many metrics each one has with the highest value; only periods where everyone has a record count.', gap: 'largest gap',
    totH: (range, parts, tie) => `Totals side by side${range ? ` (${range})` : ''}: ${parts}${tie ? `; tied on ${tie}` : ''}.`, totP: (ent, names) => `${ent} has the highest value in ${names}`, totT: 'Totals side by side', totCT: 'Values side by side', totCF: 'Sum of the periods in the cut for each metric, or the value in the sheet.', totSum: 'sum', times: 'times',
    ratioL: (m, a, b) => `${m}: ${a} ÷ ${b}`,
    effH: (name, den, parts) => `${name} ÷ ${den}: ${parts}.`, effS: (name, parts) => `${name}: ${parts} (values from the sheet).`, effT: 'Rates', effCT: 'Computed rates', effCF: 'Metric total ÷ exposure total, in the same cut. “From the sheet” rates are the values typed in it.', calc: 'computed', sheet: 'from the sheet',
    profH: 'Each one’s profile, in the sheet’s own words.', profT: 'Texts from the sheet',
    limAbsent: (ent, ps, k) => `${ent} has no record in ${ps}: ${k === 1 ? 'that period was' : 'those periods were'} left out of the scoreboard`, limGap: (p, name, vals) => `${p}: ${name} differs between the entities (${vals}), so the comparison has different exposure`,
    limOrd: names => `Left out of the scoreboard (an order, not a quantity): ${names}`, limLower: names => `In ${names}, the highest value may be the less desirable result; Datavix does not make that judgment`, limDrop: names => `Derived columns were left out (Datavix recomputes): ${names}`,
    limUnit: names => `No common unit between the entities, not compared: ${names}`, limLeft: names => `Values are missing in some period, left out: ${names}`, limRange: 'The numbers describe this spreadsheet and do not prove relationships between variables', limWho: 'Comparing totals does not explain the difference between the entities',
    synthH: (ents, ks, T, tie) => `Summary: ${ents.map((e, i) => `${e} ${ks[i]}`).join(' · ')}${tie ? ` · ties ${tie}` : ''}, across ${T} comparable ${T === 1 ? 'metric' : 'metrics'}`,
  },
};
const nvvT = () => NVV[LANG] || NVV.pt;
const nvvNum = (x, unit) => new Intl.NumberFormat(LANG === 'en' ? 'en-US' : 'pt-BR', { maximumFractionDigits: Number.isInteger(x) ? 0 : Math.abs(x) < 10 ? 2 : 1 }).format(x) + (unit === '%' ? '%' : '');
const nvvRateFmt = (r, asPct) => (asPct ? csPct(r * 100, LANG) : new Intl.NumberFormat(LANG === 'en' ? 'en-US' : 'pt-BR', { maximumFractionDigits: 2 }).format(r));

// slide de dados do face a face (mesmo formato dos atos da história): sem achado do motor, com cálculo e evidência próprios
function nvvSlide(id, role, title, o) {
  const head = o.head;
  return { id, act: 'vs_' + role, role, planTitle: title, kick: { n: '00', label: title }, head, caption: head, hl: '', big: o.big || null, calc: o.calc || null, viz: o.viz || null, state: null, synthetic: false, ev: o.ev || null, refs: ['vs:' + id], note: o.note || '', lintText: '', verbatim: true };
}
// linhas do gráfico pareado: um grupo por métrica, uma barra por entidade, cada grupo na escala do seu maior valor
function nvvPairs(items, ents, maxRows, fmtItem) {
  const per = Math.max(1, Math.floor(maxRows / ents.length)), rows = [];
  items.slice(0, per).forEach(it => {
    const hi = Math.max(...it.v, 1e-12), top = nvVsWinner(it.v);
    it.v.forEach((x, e) => rows.push({ k: `${it.name} · ${ents[e]}`, ks: ents.length > 1 ? `${it.name} · ${ents[e]}` : it.name, p: Math.max(0, x / hi * 100), t: fmtItem(it, x), hi: top === e, g: it.name }));
  });
  return rows;
}

function nvPlanVersus(P, N) {
  const b = P && P.built, pk = b && b.vs; if (!pk || !pk.score) return null;
  if (pk.pd && pk.phases && pk.phases.some(f => f.cls !== 'comparable')) { const ph = nvPlanVersusPhases(P, N, pk); if (ph) return ph; } // períodos só de um lado ou incompletos: roteiro por fases (src/versusphases.js)
  const X = nvvT(), R = nvpT().r, ents = pk.ents, E = ents.length, sc = pk.score, T = sc.items.length; if (!T) return null;
  const tally = nvVsTally(sc.items, E), seasonal = NV_VS_SEASON.test(pk.periodName || '');
  const fmtItem = (it, x) => nvvNum(x, it.unit);
  const slides = {}, lim = [];
  const calcBase = `${X.base} · ${ents.join(X.vs)}${sc.range ? ' · ' + sc.range : ''}`;
  // capa
  { const lines = X.cover(ents, X.metrics(T), pk.span, P.fileName || ''); slides.cover = nvpSynth('vs-cover', 'ctx', X.t.cover, lines); slides.cover.verbatim = true; slides.cover.lintText = ''; slides.cover.noChart = true; }
  // placar
  { const lead = Math.max(...tally.wins), leaders = ents.filter((_, i) => tally.wins[i] === lead), parts = leaders.length === E ? (E === 2 && lead > 0 ? X.scoreEq(ents, lead) : X.scoreAll(ents, tally.wins)) : leaders.length > 1 ? X.scoreAll(ents, tally.wins) : E === 2 ? `${X.scoreP(leaders[0], lead)}, ${ents.find(e => e !== leaders[0])} ${LANG === 'en' ? 'in' : 'em'} ${Math.min(...tally.wins)}` : X.scoreAll(ents, tally.wins);
    const head = X.scoreH(sc.range, parts, T, tally.tie, ents);
    const calc = { title: X.scoreCT, formula: X.scoreCF, rows: [...sc.items.map((it, k) => ({ k: it.name, v: `${it.v.map(x => nvvNum(x, it.unit)).join(X.vs)} → ${tally.who[k] < 0 ? X.ties : ents[tally.who[k]]}` })), { k: X.ties, v: String(tally.tie) }], base: calcBase };
    const big = { text: E === 2 ? tally.wins.join(X.vs) : `${lead}/${T}`, label: X.big };
    const viz = { title: X.scoreT, rows: ents.map((e, i) => ({ k: e, p: tally.wins[i] / T * 100, t: String(tally.wins[i]), sub: `${X.of} ${T}`, hi: tally.wins[i] === lead && leaders.length === 1 })), note: sc.range };
    slides.score = nvvSlide('vs-score', 'vs_score', X.t.score, { head, big, calc, viz, ev: nvEv('vsscore', { wins: tally.wins.slice(), tie: tally.tie, total: T }, [{ k: 'tot', value: T, text: String(T) }], { n: T, method: 'count', refs: ents.slice() }) }); }
  // período a período
  if (pk.seasons && pk.seasons.length >= 2) {
    const ss = pk.seasons.map(s => { const t = nvVsTally(s.items, E), hi = Math.max(...t.wins), lead = t.wins.filter(w => w === hi).length === 1 ? t.wins.indexOf(hi) : -1;
      let gap = null; s.items.forEach(it => { const mx = Math.max(...it.v), mn = Math.min(...it.v); if (mx > 0 && mx !== mn && (!gap || (mx - mn) / mx > gap.r)) gap = { r: (mx - mn) / mx, it }; }); return { s, t, lead, gap }; });
    const led = ents.map((_, e) => ss.filter(x => x.lead === e).map(x => x.s.p)), tiedP = ss.filter(x => x.lead < 0).map(x => x.s.p), K = ss.length;
    const parts = ents.map((e, i) => (led[i].length ? X.perP(e, led[i].length, X.list(led[i])) : '')).filter(Boolean), head = X.perH(K, X.perWord(seasonal, K), parts.length ? parts.join('; ') : X.perNone, tiedP.length ? `; ${X.perTie(X.list(tiedP))}` : '');
    const rows = []; const per = Math.max(1, Math.floor(12 / E)); ss.slice(0, per).forEach(x => { const Tp = x.s.items.length; ents.forEach((e, i) => rows.push({ k: `${x.s.p} · ${e}`, p: x.t.wins[i] / Tp * 100, t: String(x.t.wins[i]), sub: `${X.of} ${Tp}`, hi: x.lead === i })); });
    const calc = { title: X.perCT, formula: X.perCF, rows: ss.map(x => ({ k: x.s.p, v: `${x.t.wins.join(X.vs)}${x.t.tie ? ` (${X.ties.toLowerCase()} ${x.t.tie})` : ''}${x.gap ? ` · ${X.gap}: ${x.gap.it.name}` : ''}` })), base: calcBase };
    const big = E === 2 ? { text: led.map(l => l.length).join(X.vs), label: X.perBig } : null;
    slides.seasons = nvvSlide('vs-seasons', 'vs_seasons', seasonal ? X.t.seasonsS : X.t.seasons, { head, big, calc, viz: { title: X.perT, rows, note: K > per ? `+${K - per}` : '' },
      ev: nvEv('vsscore', { wins: led.map(l => l.length), tie: tiedP.length, total: K }, [{ k: 'tot', value: K, text: String(K) }], { n: K, method: 'count', refs: ents.slice() }) });
  }
  // totais lado a lado
  { const win = ents.map((_, e) => sc.items.filter((_, k) => tally.who[k] === e).map(it => it.name)), ties = sc.items.filter((_, k) => tally.who[k] < 0).map(it => it.name);
    const parts = ents.map((e, i) => (win[i].length ? X.totP(e, X.list(win[i])) : '')).filter(Boolean);
    if (parts.length) {
      let big = null, ev = null; if (E === 2) { let best = null; sc.items.forEach(it => { const mx = Math.max(...it.v), mn = Math.min(...it.v); if (mn > 0 && mx !== mn && (!best || mx / mn > best.x)) best = { x: mx / mn, it, mx, mn }; });
        if (best && best.x >= 1.2) { const wi = best.it.v.indexOf(best.mx), x = Math.round(best.x * 10) / 10, tx = nvvNum(x) + '×'; big = { text: tx, label: X.ratioL(best.it.name, ents[wi], ents[1 - wi]).toUpperCase() }; ev = nvEv('vsratio', { top: best.mx, low: best.mn }, [{ k: 'x', value: best.mx / best.mn, text: tx }], { n: T, method: 'ratio', refs: [best.it.name, ...ents] }); } }
      const head = X.totH(sc.range, parts.join('; '), ties.length ? X.list(ties) : ''), maxRows = 12;
      const calc = { title: X.totCT, formula: X.totCF, rows: sc.items.map(it => ({ k: it.name, v: it.v.map(x => nvvNum(x, it.unit)).join(X.vs) })), base: calcBase };
      slides.totals = nvvSlide('vs-totals', 'vs_totals', X.t.totals, { head, big, calc, ev, viz: { title: X.totT, rows: nvvPairs(sc.items, ents, maxRows, fmtItem), note: sc.items.length > Math.floor(maxRows / E) ? `+${sc.items.length - Math.floor(maxRows / E)}` : sc.range, pairs: sc.items.slice(0, Math.floor(maxRows / E)).map(it => ({ k: it.name, v: it.v.slice(), t: it.v.map(x => fmtItem(it, x)) })), ents: ents.slice() } });
    } }
  // eficiência
  if (pk.eff && pk.eff.length) {
    const effs = pk.eff.map(f => { if (f.kind === 'sheet') return { f, vals: f.v.slice(), fmt: x => nvvNum(x, f.unit), name: f.name, calc: false }; const r = f.num.map((x, i) => x / f.dv[i]), pct = r.every(x => x <= 1 + 1e-9); return { f, vals: r, fmt: x => nvvRateFmt(x, pct), name: `${f.name} ÷ ${f.den}`, calc: true, pct }; });
    let hd = null; effs.forEach(x => { const mx = Math.max(...x.vals), mn = Math.min(...x.vals); if (mx > 0 && mx !== mn) { const g = (mx - mn) / mx; if (!hd || g > hd.g || (g === hd.g && x.calc && !hd.x.calc)) hd = { g, x }; } });
    if (hd) {
      const x = hd.x, parts = ents.map((e, i) => `${e} ${x.fmt(x.vals[i])}`).join(', '), head = x.calc ? X.effH(x.f.name, x.f.den, parts) : X.effS(x.f.name, parts);
      const rowsAll = effs.map(y => ({ name: y.name + (y.calc ? '' : ''), unit: '', v: y.vals, fmt: y.fmt, tag: y.calc ? X.calc : X.sheet })), per = Math.max(1, Math.floor(12 / E));
      const viz = { title: X.effT, rows: [], note: '' }; rowsAll.slice(0, per).forEach(r => { const hi = Math.max(...r.v, 1e-12), top = nvVsWinner(r.v); r.v.forEach((val, e) => viz.rows.push({ k: `${r.name} · ${ents[e]}`, p: Math.max(0, val / hi * 100), t: r.fmt(val), hi: top === e })); });
      const calc = { title: X.effCT, formula: X.effCF, rows: effs.map(y => ({ k: `${y.name} (${y.calc ? X.calc : X.sheet})`, v: y.calc ? y.f.num.map((n, i) => `${nvvNum(n)} ÷ ${nvvNum(y.f.dv[i])} = ${y.fmt(y.vals[i])}`).join(' · ') : y.vals.map(z => y.fmt(z)).join(X.vs) })), base: calcBase };
      let ev = null, big = null; if (x.calc) { const wi = x.vals.indexOf(Math.max(...x.vals)); ev = nvEv('vsrate', { num: x.f.num[wi], den: x.f.dv[wi] }, [{ k: 'r', value: x.vals[wi], text: x.fmt(x.vals[wi]) }], { n: x.f.dv[wi], method: 'ratio', refs: [x.f.name, x.f.den, ents[wi]] }); big = { text: x.fmt(x.vals[wi]), label: `${ents[wi]} · ${x.name}`.toUpperCase() }; }
      slides.eff = nvvSlide('vs-eff', 'vs_eff', X.t.eff, { head, big, calc, viz, ev });
    }
  }
  // perfil: textos da planilha, na íntegra
  const profItems = nvWbProfile(P, ents) || pk.profile; // a aba de perfil da pasta tem prioridade
  if (profItems && profItems.length) {
    const lines = []; let chars = 0;
    for (const o of profItems) { const ln = `${o.name}${o.p ? ` (${o.p})` : ''}: ${o.t.map((t, i) => (t === null ? null : `${ents[i]}: ${t}`)).filter(Boolean).join(' · ')}`; if (lines.length && chars + ln.length > 760) break; lines.push(ln); chars += ln.length; if (lines.length >= 4) break; }
    if (lines.length) { slides.prof = nvpSynth('vs-profile', 'vs_profile', X.t.prof, lines); slides.prof.verbatim = true; slides.prof.lintText = ''; slides.prof.noChart = true; }
  }
  // limites e síntese
  { const n = pk.notes || {}, L = [];
    const byEnt = ents.map((_, e) => pk.absent.filter(a => a.e === e).map(a => a.p)); byEnt.forEach((ps, e) => { if (ps.length) { const u = [...new Set(ps)]; L.push(X.limAbsent(ents[e], X.list(u), u.length)); } });
    (n.expoGap || []).slice(0, 2).forEach(g => L.push(X.limGap(g.p, g.name, g.v.map((x, i) => `${ents[i]} ${nvvNum(x)}`).join(', '))));
    nvWbDerive(P.built.wbx).caveats.forEach(c => L.push(c.k ? `${c.k}: ${c.t}` : c.t)); // ressalvas da aba de método, na íntegra
    const rcx = nvWbReconText(nvWbReconcile(P.built.wbx, pk)); if (rcx) L.push(...rcx.lines); // conciliação entre a aba Principal e a Detalhe
    if (n.ord && n.ord.length) L.push(X.limOrd(n.ord.join(', '))); if (n.lower && n.lower.length) L.push(X.limLower(n.lower.join(', ')));
    if (n.noUnit && n.noUnit.length) L.push(X.limUnit(n.noUnit.join(', '))); if (n.leftOut && n.leftOut.length) L.push(X.limLeft(n.leftOut.join(', '))); if (n.dropped && n.dropped.length) L.push(X.limDrop(n.dropped.join(', ')));
    L.push(X.limWho, X.limRange);
    const synth = X.synthH(ents, tally.wins, T, tally.tie);
    const mk = (id, role, title, lines) => { const s = nvpSynth(id, role, title, lines); s.verbatim = true; s.lintText = ''; s.noChart = true; return s; };
    slides.lim = mk('vs-limits', 'limits', X.t.lim, L); slides.synth = mk('vs-synth', 'synthesis', X.t.synth, [synth]); slides.synthLim = mk('vs-synthlim', 'synthesis', X.t.synthLim, [synth, ...L]);
    if (rcx) { slides.lim.calc = rcx.calc; slides.synthLim.calc = rcx.calc; }
    slides.synth.ev = nvEv('vsscore', { wins: tally.wins.slice(), tie: tally.tie, total: T }, [{ k: 'tot', value: T, text: String(T) }], { n: T, method: 'count', refs: ents.slice() }); slides.synthLim.ev = slides.synth.ev;
  }
  const pick = (...k) => k.map(x => slides[x]).filter(Boolean);
  let plan;
  if (N <= 2) plan = [slides.score, slides.synthLim];
  else if (N <= 5) { const room = nvWbSourcesSlide(P) ? 1 : 0, mid = pick('seasons', 'totals', 'eff', 'prof').slice(0, 2 - room); plan = [slides.cover, slides.score, ...mid, slides.synthLim]; }
  else plan = [slides.cover, ...pick('score', 'seasons', 'totals', 'eff', 'prof'), slides.lim, slides.synth];
  const out = nvFinishPlan(P, plan.filter(Boolean).slice(0, Math.max(1, N)), N, { items: [] }, null); out.story = 'versus'; return out;
}
