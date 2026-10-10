/* Datavix: planos de 2, 5 e 10 slides (gate 4 do motor de história).
 * Cada plano é montado do zero para o seu tamanho (não é o de 10 com páginas cortadas). Os slides saem no mesmo formato que a apresentação
 * e o vídeo já usam; os que não vêm de um achado (contexto, qualidade dos dados, síntese, implicação) são montados só com números calculados
 * da planilha e com perguntas cautelosas, nunca com causas. O validador confere o plano antes de devolvê-lo. */

const NVP_N = { quick: 2, normal: 5, full: 10 }; // a pergunta "tempo" do onboarding escolhe o tamanho
const nvSlideCount = br => NVP_N[br && br.time] || 10;
const NVP = {
  pt: {
    r: { ctx: 'Contexto', q1: 'O que está acontecendo?', q2: 'O que isso sugere?', main: 'Descoberta principal', evid: 'Evidência', explore: 'Exploração', impl: 'Implicações e próximos passos', over: 'Visão geral e qualidade dos dados', evol: 'Evolução no tempo', comp: 'Comparação entre grupos', conc: 'Concentração e composição', dist: 'Distribuição e atípicos', synth: 'Síntese e limitações', extra: 'Evidência complementar', nos: 'Sem dados para esta análise', detail: 'Evidência em detalhe' },
    scope: (n, f) => `${n} registros em ${f}`, missM: (k, p) => `${k} linhas sem valor na métrica ficaram fora dos cálculos (${p})`, period: p => `Período: ${p}`, groups: (n, name) => `${n} grupos em “${name}”`, periods: n => `${n} períodos analisados`,
    used: (u, t, p) => `${u} de ${t} linhas usadas (${p})`, allUsed: t => `Todas as ${t} linhas foram usadas`, miss: (k, p) => `${k} linhas sem valor foram ignoradas (${p})`, fewRows: 'Poucas linhas: leitura exploratória', expl: n => `${n} ${n === 1 ? 'achado é exploratório' : 'achados são exploratórios'} (amostra pequena ou evidência frágil)`,
    med: (m, a) => `Mediana ${m} e média ${a}`, total: (l, v) => `${l}: ${v}`, noRange: 'Os números descrevem esta planilha e não provam relações entre as variáveis',
    q: { top: s => `O que diferencia ${s} dos demais? Vale olhar ${s} por outra dimensão da planilha antes de concluir`, change: (a, b) => `O que mudou entre ${a} e ${b}? Vale checar se foi pontual ou se se repete`, atyp: 'Os valores atípicos têm algo em comum? Vale olhar um a um antes de concluir', assoc: 'A relação se mantém dentro de cada grupo? Vale separar por categoria antes de tirar conclusões', gen: 'Vale investigar o que há por trás dessa diferença, com outras colunas da planilha', period: s => `O que aconteceu em ${s}? Vale checar se foi sazonal ou pontual antes de concluir` },
    no: { nogen: 'Nenhum achado confiável nesta dimensão com os dados atuais', conc6: 'Há menos de 6 grupos: pouco para falar de concentração', nonum: 'Não há uma coluna de valores numéricos para analisar a distribuição', evol: 'Os dados não têm uma coluna de data: não há como analisar a evolução no tempo', evol2: 'Não houve variação relevante nem dados suficientes para destacar a evolução no tempo', comp: 'Há poucos grupos para comparar', conc: 'Não há grupos suficientes ou um total somável para analisar concentração', dist: 'Há menos de 30 linhas com valor: pouco para analisar a distribuição', dist2: 'Nenhum valor atípico relevante foi encontrado' },
    evLines: 'Evidências complementares', lim: 'Limites',
  },
  en: {
    r: { ctx: 'Context', q1: 'What is happening?', q2: 'What does it suggest?', main: 'Main finding', evid: 'Evidence', explore: 'Exploration', impl: 'Implications and next steps', over: 'Overview and data quality', evol: 'Change over time', comp: 'Comparison across groups', conc: 'Concentration and composition', dist: 'Distribution and atypical values', synth: 'Summary and limits', extra: 'Further evidence', nos: 'Not enough data for this analysis', detail: 'Evidence in detail' },
    scope: (n, f) => `${n} records in ${f}`, missM: (k, p) => `${k} rows without a value in the metric were left out of the calculations (${p})`, period: p => `Period: ${p}`, groups: (n, name) => `${n} groups in “${name}”`, periods: n => `${n} periods analyzed`,
    used: (u, t, p) => `${u} of ${t} rows used (${p})`, allUsed: t => `All ${t} rows were used`, miss: (k, p) => `${k} rows without a value were ignored (${p})`, fewRows: 'Few rows: exploratory reading', expl: n => `${n} ${n === 1 ? 'finding is exploratory' : 'findings are exploratory'} (small sample or weak evidence)`,
    med: (m, a) => `Median ${m} and average ${a}`, total: (l, v) => `${l}: ${v}`, noRange: 'The numbers describe this spreadsheet and do not prove relationships between variables',
    q: { top: s => `What sets ${s} apart from the rest? Look at ${s} through another dimension of the spreadsheet before concluding`, change: (a, b) => `What changed between ${a} and ${b}? Check whether it was a one-off or repeats`, atyp: 'Do the atypical values have something in common? Look at them one by one before concluding', assoc: 'Does the relationship hold within each group? Split by category before drawing conclusions', gen: 'Worth investigating what lies behind this difference, using other columns of the spreadsheet', period: s => `What happened in ${s}? Check whether it was seasonal or a one-off before concluding` },
    no: { nogen: 'No reliable finding in this dimension with the current data', conc6: 'Fewer than 6 groups: too few to talk about concentration', nonum: 'There is no numeric value column to analyze the distribution', evol: 'The data has no date column: there is no way to analyze change over time', evol2: 'There was no relevant change or enough data to highlight change over time', comp: 'There are too few groups to compare', conc: 'There are not enough groups or a summable total to analyze concentration', dist: 'Fewer than 30 rows have a value: too little to analyze the distribution', dist2: 'No relevant atypical value was found' },
    evLines: 'Further evidence', lim: 'Limits',
  },
};
const nvpT = () => NVP[LANG] || NVP.pt;

/* ---- classes de achado por seção ---- */
// seção do plano pelo tipo de cálculo (não pela classe): pico e vale contam como evolução quando o eixo é tempo e como comparação quando são categorias
const nvpSlotPred = (slot, isTime) => f => {
  const k = f.ev.kind, a = f.act || '';
  if (slot === 'evol') return k === 'trend' || k === 'jump' || (isTime && (k === 'peak' || k === 'low'));
  if (slot === 'comp') return k === 'lead' || k === 'gapz' || k === 'contrast' || k === 'dropc' || k === 'gappp' || (!isTime && (k === 'peak' || k === 'low')) || /^c_(where|impact)$/.test(a);
  if (slot === 'conc') return k === 'conc' || k === 'contrib' || k === 'shift' || k === 'dominant';
  if (slot === 'dist') return k === 'dist' || k === 'outrows' || k === 'outlier';
  return false;
};
const nvpQ = (main, X, isTime) => { // pergunta cautelosa a partir do achado principal (nunca afirma causa)
  const c = main ? nvCls(main) : '', r = (main && main.ev && main.ev.refs) || [];
  if (isTime && main && (main.ev.kind === 'peak' || main.ev.kind === 'low') && r[0]) return X.q.period(r[0]);
  if (c === 'top' || c === 'bottom' || c === 'c_rate' || c === 'c_cause' || c === 'c_impact' || c === 'c_where') return X.q.top(r[0] || '—');
  if ((c === 'trend' || c === 'change') && r.length >= 2) return X.q.change(r[r.length - 2], r[r.length - 1]);
  if (c === 'atypical' || c === 'atypical-rows') return X.q.atyp;
  if (c === 'assoc') return X.q.assoc;
  return X.q.gen;
};

/* ---- peças de slide ---- */
function nvpFactSlide(f, role, title, N) { // slide de achado: mesmo formato da apresentação, com papel, rótulo do plano e ressalva visível
  const X = nvpT(), expl = f.confidenceLabel === 'exploratory' || (f.caveats || []).includes('exploratory');
  return { ...f, role, planTitle: title, kick: { n: '00', label: title }, note: expl ? X.expl(1) : '', refs: [f.id] };
}
function nvpSynth(id, role, title, lines, ev) { // slide sem achado próprio: só números calculados e perguntas cautelosas
  const head = lines.join('. ');
  return { id, act: 'plan_' + role, type: 'impl', role, planTitle: title, kick: { n: '00', label: title }, head, caption: head, lines, state: null, calc: null, big: null, synthetic: true, ev: ev || null, refs: [] };
}
function nvpContext(P, X, deep) {
  const b = P.built, st = b.stats || {}, rs = b.rowStats, L = [], tot = (b.totX || []).filter(t => t.value !== null);
  let ev = null;
  const rows = st.rowsTotal || st.rowsUsed || 0;
  L.push(X.scope(fmtInt(rows, LANG), P.fileName || '—'));
  if (b.period) L.push(X.period(b.period)); else if (b.xIsTime && tot.length) L.push(X.periods(tot.length));
  const sg = (typeof storyGroups === 'function' && b.kind !== 'relation') ? storyGroups(P) : null, gn = sg ? sg.list.length : (!b.xIsTime ? tot.length : 0);
  if (gn >= 2 && !b.xIsTime) L.push(X.groups(fmtInt(gn, LANG), (sg && sg.name) || b.names.x));
  if (st.rowsUsed != null && st.rowsTotal && st.rowsUsed < st.rowsTotal) { const p = csPct(st.rowsUsed / st.rowsTotal * 100, LANG); L.push(X.used(fmtInt(st.rowsUsed, LANG), fmtInt(st.rowsTotal, LANG), p)); ev = nvEv('usage', { used: st.rowsUsed, total: st.rowsTotal }, [{ k: 'p', value: st.rowsUsed / st.rowsTotal * 100, text: p }], { n: st.rowsTotal, method: 'count' }); }
  else if (st.rowsTotal && !(rs && rs.miss > 0)) L.push(X.allUsed(fmtInt(st.rowsTotal, LANG)));
  if (rs && rs.miss > 0 && rs.n + rs.miss > 0) { const p = csPct(rs.miss / (rs.n + rs.miss) * 100, LANG); L.push(X.missM(fmtInt(rs.miss, LANG), p)); if (!ev) ev = nvEv('missing', { miss: rs.miss, n: rs.n }, [{ k: 'p', value: rs.miss / (rs.n + rs.miss) * 100, text: p }], { n: rs.n + rs.miss, method: 'count' }); }
  if (rows && rows < 30) L.push(X.fewRows);
  return { lines: L, ev };
}
function nvpOverview(P, X) { // visão geral e qualidade: totais, mediana e média, ausências
  const b = P.built, rs = b.rowStats, L = [], r = nvpContext(P, X, true); let hero = null; try { hero = kpiCards(b, LANG, T)[0] || null; } catch (e) { hero = null; }
  if (hero) L.push(X.total(hero.label, kpiFmt(hero)));
  if (rs && rs.n >= NV_ROWS.min && rs.median != null) L.push(X.med(fmtNum(rs.median, rs.unit, LANG), fmtNum(rs.mean, rs.unit, LANG)));
  return { lines: [...L, ...r.lines.slice(1)], ev: r.ev };
}

/* ---- escolha dos achados ---- */
function nvpPool(P, meta, steps) { // todos os achados válidos e pontuados, sem repetição, do melhor para o pior
  const br = P.br || {}, all = buildStory(P, meta, steps, { insights: allInsights(P), extras: true }), rep = all.report || null;
  const facts = all.filter(x => x.id !== 'st-ov' && x.ev && x.score), dd = nvDedupe(facts);
  const items = dd.items.map((f, i) => ({ f, i })).sort((a, b) => b.f.score.total - a.f.score.total || a.i - b.i).map(x => x.f);
  return { items, merged: dd.merged, relations: nvRelations(items), overview: all.find(x => x.id === 'st-ov') || null, report: rep };
}
// descoberta principal: maior nota, com um bônus por coerência (relações com outros achados) e sem partir de achado exploratório quando há alternativa
function nvpMain(pool) {
  const rel = new Map(); pool.relations.forEach(r => { rel.set(r.a, (rel.get(r.a) || 0) + 1); rel.set(r.b, (rel.get(r.b) || 0) + 1); });
  const firm = pool.items.filter(f => f.confidenceLabel !== 'exploratory'), base = firm.length ? firm : pool.items;
  let best = null, bv = -1; base.forEach(f => { const v = f.score.total + 3 * Math.min(3, rel.get(f.id) || 0); if (v > bv + 1e-9) { bv = v; best = f; } });
  return best;
}
function nvpTake(pool, used, pred) { // melhor achado ainda não usado que cumpre o predicado (a lista já vem ordenada por nota)
  const f = pool.items.find(x => !used.has(x.id) && pred(x)); if (f) used.add(f.id); return f || null;
}
// o que mais combina com o principal: relacionado a ele; senão, de classe diferente
function nvpEvidence(pool, used, main) {
  const ids = new Set(); pool.relations.forEach(r => { if (r.a === main.id) ids.add(r.b); if (r.b === main.id) ids.add(r.a); });
  return nvpTake(pool, used, f => ids.has(f.id)) || nvpTake(pool, used, f => nvCls(f) !== nvCls(main)) || nvpTake(pool, used, () => true);
}

/* ---- planos ---- */
function nvPlan(P, meta, steps, N) {
  const X = nvpT(), pool = nvpPool(P, meta, steps), used = new Set(), slides = [], b = P.built, br = P.br || {};
  const main = nvpMain(pool); if (main) used.add(main.id);
  const R = X.r, impl = () => { const lines = [nvpQ(main, X, b.xIsTime), X.noRange]; const ex = pool.items.filter(f => f.confidenceLabel === 'exploratory').length; if (ex) lines.splice(1, 0, X.expl(ex)); return lines; };
  const unsupported = (key, role, title, why) => nvpSynth('plan-no-' + key, role, title, [why]);
  const gn = ((typeof storyGroups === 'function' && b.kind !== 'relation') ? (storyGroups(P) || { list: [] }).list.length : 0) || ((b.totX || []).filter(t => t.value !== null).length);
  const fact = (f, role, title) => (f ? nvpFactSlide(f, role, title, N) : null);
  if (!main) { // sem nenhum achado válido: roteiro descritivo com contexto e limites, no tamanho pedido
    const c = nvpContext(P, X, true), ov = nvpOverview(P, X);
    const base = [nvpSynth('plan-ctx', 'ctx', R.ctx, c.lines, c.ev), nvpSynth('plan-over', 'over', R.over, ov.lines, ov.ev), nvpSynth('plan-lim', 'synth', R.synth, [X.noRange, ...(c.lines.slice(-1))])];
    while (base.length < N) base.push(nvpSynth('plan-nos-' + base.length, 'nos', R.nos, [X.no.gen || X.q.gen]));
    return nvFinishPlan(P, base.slice(0, N), N, pool, null);
  }
  if (N === 2) {
    const c = nvpContext(P, X, false), s1 = fact(main, 'finding', R.q1), ev = nvpEvidence(pool, used, main);
    const s2 = ev ? { ...fact(ev, 'implication', R.q2), note: [nvpQ(main, X, b.xIsTime), X.noRange].join('. ') } : nvpSynth('plan-impl', 'implication', R.q2, impl());
    if (s1) s1.note = [c.lines.slice(0, 2).join(' · '), s1.note].filter(Boolean).join('. '); // contexto mínimo junto da descoberta
    slides.push(s1, s2);
  } else if (N === 5) {
    const c = nvpContext(P, X, true); slides.push(nvpSynth('plan-ctx', 'ctx', R.ctx, c.lines, c.ev), fact(main, 'finding', R.main));
    const ev = nvpEvidence(pool, used, main); slides.push(ev ? fact(ev, 'evidence', R.evid) : nvpSynth('plan-ev', 'evidence', R.evid, [X.noRange]));
    const ex = nvpTake(pool, used, f => nvCls(f) !== nvCls(main) && (!ev || nvCls(f) !== nvCls(ev)) && !((f.ev.refs || [])[0] && (f.ev.refs || [])[0] === (main.ev.refs || [])[0])) || nvpTake(pool, used, f => nvCls(f) !== nvCls(main)) || nvpTake(pool, used, () => true);
    slides.push(ex ? fact(ex, 'exploration', R.explore) : nvpSynth('plan-ex', 'exploration', R.explore, [X.no.comp]));
    slides.push(nvpSynth('plan-impl', 'implication', R.impl, impl()));
  } else { // 10
    const c = nvpContext(P, X, false), ov = nvpOverview(P, X);
    slides.push(nvpSynth('plan-ctx', 'ctx', R.ctx, c.lines, c.ev), nvpSynth('plan-over', 'over', R.over, ov.lines, ov.ev), fact(main, 'finding', R.main));
    const ev = nvpEvidence(pool, used, main); slides.push(ev ? fact(ev, 'evidence', R.detail) : nvpSynth('plan-ev', 'evidence', R.detail, [X.noRange]));
    const gaps = []; // limites definitivos dos dados (sem coluna de data, poucos grupos...) vão para o slide de síntese e limitações
    const slot = (key, role, title, why, definitive) => {
      let f = nvpTake(pool, used, nvpSlotPred(key, !!b.xIsTime)); if (f) return fact(f, role, title);
      if (definitive) gaps.push(why);
      f = nvpTake(pool, used, () => true); if (f) return fact(f, 'extra', R.extra); // sobrou achado: melhor um achado complementar do que um slide vazio
      return unsupported(role, role, R.nos, `${title}: ${why}`);
    };
    const rs = b.rowStats, evolWhy = !b.xIsTime ? X.no.evol : X.no.evol2, compWhy = gn < 3 ? X.no.comp : X.no.nogen, concWhy = gn < 6 ? X.no.conc6 : X.no.nogen, distWhy = !rs ? X.no.nonum : rs.n < NV_ROWS.min ? X.no.dist : X.no.dist2; // cada motivo descreve o que os dados realmente têm
    slides.push(slot('evol', 'evolution', R.evol, evolWhy, !b.xIsTime), slot('comp', 'comparison', R.comp, compWhy, gn < 3), slot('conc', 'concentration', R.conc, concWhy, gn < 6), slot('dist', 'distribution', R.dist, distWhy, !rs || rs.n < NV_ROWS.min));
    const left = pool.items.filter(f => !used.has(f.id)).slice(0, 3); left.forEach(f => used.add(f.id));
    const lim = []; const ex = pool.items.filter(f => f.confidenceLabel === 'exploratory').length; if (ex) lim.push(X.expl(ex)); lim.push(...c.lines.filter(l => !/^(Todas|All) /.test(l) && /\d/.test(l) && /(usadas|used|ignoradas|ignored|fora dos cálculos|left out|Poucas|Few)/.test(l)));
    const sl = [...lim, ...gaps, ...left.map(f => f.head)].slice(0, 5);
    const synth = nvpSynth('plan-synth', 'synthesis', R.synth, [...sl, X.noRange]); synth.allow = left.some(f => ((f.ev && f.ev.allow) || []).includes('causal')) ? ['causal'] : []; slides.push(synth); // o nome de uma coluna pode ser "Causa"
    slides.push(nvpSynth('plan-impl', 'implication', R.impl, impl()));
  }
  return nvFinishPlan(P, slides.filter(Boolean), N, pool, main);
}
function nvFinishPlan(P, slides, N, pool, main) {
  slides.forEach((s, i) => { s.kick = { n: String(i + 1).padStart(2, '0'), label: s.planTitle || (s.kick && s.kick.label) || '' }; });
  const report = nvValidatePlan(slides, N, pool);
  const out = { slides, N, report, storyline: { main: main && main.id, order: slides.map(s => s.role + ':' + s.id) } }; slides.isPlan = true; slides.report = report;
  return out;
}
const nvPlanFor = (P, meta, steps) => nvPlan(P, meta, steps, nvSlideCount(P.br));

/* ---- validação do plano ---- */
function nvValidatePlan(slides, N, pool) {
  const errors = [], warnings = [], ids = new Set((pool && pool.items || []).map(f => f.id)), seen = new Map();
  if (slides.length !== N) errors.push({ id: 'plan', code: 'slide-count', msg: `o plano tem ${slides.length} slides e deveria ter ${N}` });
  slides.forEach((s, i) => {
    const id = s.id || 'slide-' + i;
    if (!s.role || !s.planTitle) errors.push({ id, code: 'no-role', msg: 'slide sem papel ou título' });
    if (!String(s.head || '').trim()) errors.push({ id, code: 'empty', msg: 'slide sem texto' });
    if (!s.synthetic && !ids.has(s.id) && !(s.refs || []).length) errors.push({ id, code: 'unknown-insight', msg: 'achado inexistente no conjunto validado' });
    const lint = [s.head, ...(s.lines || []), s.note].filter(Boolean).join(' ');
    if (NV_CFG.causal.test(lint) && !(s.ev && NV_CAUSAL_OK.has(s.ev.kind)) && !((s.ev && s.ev.allow) || []).includes('causal') && !(s.allow || []).includes('causal')) errors.push({ id, code: 'causal', msg: 'linguagem de causa no slide' });
    if (NV_CFG.accuse.test(lint)) errors.push({ id, code: 'accusation', msg: 'acusação (erro/fraude) no slide' });
    if ((s.confidenceLabel === 'exploratory') && !String(s.note || '').trim()) errors.push({ id, code: 'no-caveat', msg: 'achado exploratório sem ressalva visível' });
    const key = String(s.head || '').trim().toLowerCase(); if (key) { if (seen.has(key)) errors.push({ id, code: 'repeated', msg: 'mesma afirmação de ' + seen.get(key) }); else seen.set(key, id); }
    if (s.ev) { const r = nvCheckItem(s); r.errors.forEach(e => errors.push(e)); r.warns.forEach(w => warnings.push(w)); }
  });
  const ids2 = slides.map(s => s.id); if (new Set(ids2).size !== ids2.length) errors.push({ id: 'plan', code: 'duplicate-slide', msg: 'o mesmo achado aparece duas vezes' });
  return { ok: !errors.length, errors, warnings };
}
