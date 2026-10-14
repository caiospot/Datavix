/* Datavix: Face a face por fases (portão 52). Quando a planilha traz a exposição de cada entidade (GP disputados, jogos…) e há períodos sem registro de
 * um lado ou com exposição muito diferente, comparar tudo junto engana. O Datavix classifica cada período e agrupa os vizinhos de mesma classe em fases:
 *   solo        só parte das entidades tem registro (ex.: a outra ainda não tinha estreado)
 *   partial     todas têm registro, mas o menor valor de exposição é menos da metade do maior (temporada incompleta)
 *   comparable  todas têm registro e exposição parecida
 * Cada fase vira um slide, em ordem cronológica: o placar só vale na fase comparável; na incompleta cada métrica aparece por exposição.
 * O texto de contexto das células (observações) é mostrado na íntegra. Corrida a corrida usa a aba Detalhe, com uma regra objetiva e visível. */

const NV_VS_PARTIAL = 0.5; // exposição: o menor valor abaixo de metade do maior torna o período incompleto
const NV_VS_RACES = 4; // corridas por período comparável
const NV_VS_NOTE_MAX = 220; // texto de contexto maior que isto não entra no slide (nunca é cortado)

// ---------------------------------------------------------------- pacote: períodos e fases
function nvVsPhasePack(ds, v, all, periods, ents, absent, expo) {
  const cols = ds.columns, n = ds.rowCount, ec = cols[v.entityCol], E = ents.length, pc = v.periodCol >= 0 ? cols[v.periodCol] : null;
  const eIdx = ec.dict.map(l => ents.indexOf(l));
  const cand = cols.map((c, i) => [c, i]).filter(([c, i]) => i !== v.entityCol && i !== v.periodCol && (c.kind === 'category' || c.kind === 'text') && (c.role === 'text' || c.role === 'category' || c.role === 'id') && !c.hide);
  const stat = cand.map(([c, i]) => { let t = 0, k = 0; for (let r = 0; r < n; r++) { const s = nvVsAt(c, r); if (s && !/^[—-]+$/.test(s.trim())) { t += s.length; k++; } } return { c, i, k, avg: k ? t / k : 0, d: c.dict ? c.dict.length : 99 }; }).filter(x => x.k);
  const ctx = stat.filter(x => x.avg >= 30).sort((a, b) => b.avg - a.avg)[0] || null, TEAM = /equipe|team|time|clube|escuder|squad/i;
  const team = stat.filter(x => x !== ctx && x.avg < 30).sort((a, b) => (TEAM.test(b.c.name) ? 1 : 0) - (TEAM.test(a.c.name) ? 1 : 0) || a.d - b.d)[0] || null;
  const abs = new Set(absent.map(a => nvVsKey(a.p, a.e))), txt = new Map(), tm = new Map();
  for (let r = 0; r < n; r++) {
    const e = ec.codes[r] < 0 ? -1 : eIdx[ec.codes[r]]; if (e < 0) continue; const p = pc ? nvVsAt(pc, r).trim() : ''; if (abs.has(nvVsKey(p, e))) continue;
    if (ctx) { const s = nvVsAt(ctx.c, r).trim(); if (s && !/^[—-]+$/.test(s)) txt.set(nvVsKey(p, e), s); }
    if (team) { const s = nvVsAt(team.c, r).trim(); if (s && !/^[—-]+$/.test(s)) tm.set(nvVsKey(p, e), s); }
  }
  const absBy = new Map(); absent.forEach(a => { if (!absBy.has(a.p)) absBy.set(a.p, new Set()); absBy.get(a.p).add(a.e); });
  const metrics = all.filter(m => !m.exp && !m.dup);
  const pd = periods.map(p => {
    const ab = absBy.get(p) || new Set(), present = [...Array(E).keys()].filter(e => !ab.has(e));
    const ex = ents.map((_, e) => (expo && !ab.has(e) && expo.cells.has(nvVsKey(p, e)) ? expo.cells.get(nvVsKey(p, e)) : null));
    let cls = 'comparable';
    if (ab.size) cls = present.length ? 'solo' : 'none';
    else if (expo && ex.every(x => x !== null && x > 0)) { const hi = Math.max(...ex), lo = Math.min(...ex); if (lo / hi < NV_VS_PARTIAL) cls = 'partial'; }
    return { p, cls, present, ex, team: ents.map((_, e) => tm.get(nvVsKey(p, e)) || null), text: ents.map((_, e) => txt.get(nvVsKey(p, e)) || null),
      m: metrics.map(m => ({ name: m.name, unit: m.units.get(nvVsKey(p, present[0] === undefined ? 0 : present[0])) || m.unit || '', ord: m.ord, rate: m.rate, add: !m.ord && !m.rate && [...m.cells.values()].every(x => x >= 0), v: ents.map((_, e) => (ab.has(e) || !m.cells.has(nvVsKey(p, e)) ? null : m.cells.get(nvVsKey(p, e)))) })).filter(x => x.v.some(y => y !== null)) };
  });
  const phases = []; pd.forEach(x => { if (x.cls === 'none') return; const last = phases[phases.length - 1]; if (last && last.cls === x.cls && (x.cls !== 'solo' || last.present.join() === x.present.join())) last.ps.push(x.p); else phases.push({ cls: x.cls, ps: [x.p], present: x.present.slice() }); });
  return { pd, phases, cols: { team: team ? team.c.name : null, ctx: ctx ? ctx.c.name : null, expo: expo ? expo.name : null } };
}

// ---------------------------------------------------------------- corrida a corrida (aba Detalhe)
// colunas por entidade: "Prefixo Entidade" (Pontos Senna, Equipe Senna…); só entram corridas em que todas têm pontos
function nvWbRaces(P, pk, periods) {
  const wbx = P && P.built && P.built.wbx, det = wbx && wbx.sheets.find(s => s.role === 'detail' && s.matrix && s.matrix.length > 1); if (!det) return null;
  const M = det.matrix, head = M[0].map(h => String(h == null ? '' : h)), nh = head.map(nvwNorm), ents = pk.ents;
  const pcol = nh.findIndex(h => h && h === nvwNorm(pk.periodName)); if (pcol < 0) return null;
  const toks = ents.map(e => { const w = nvwNorm(e).split(' '); return [nvwNorm(e), w[w.length - 1], w[0]]; }), uniq = a => new Set(a).size === a.length;
  const ti = [0, 1, 2].find(k => toks.every(t => t[k]) && uniq(toks.map(t => t[k])) && toks.every(t => nh.some((h, c) => c !== pcol && h.endsWith(' ' + t[k])))); if (ti === undefined) return null; // o sufixo de cada entidade precisa ser único
  const cols = ents.map(() => ({})); // prefixo normalizado → { c, label }
  ents.forEach((_, e) => { const tk = toks[e][ti]; nh.forEach((h, c) => { if (c !== pcol && h.endsWith(' ' + tk)) cols[e][h.slice(0, -tk.length - 1).trim()] = { c, label: head[c].slice(0, head[c].length - tk.length - 1).trim() }; }); });
  const RE = { pts: /^(pontos|points|pts)$/, res: /^(resultado|result|posicao|position|colocacao)$/, team: /^(equipe|team|time|clube|escuderia)$/ };
  const find = (e, re) => { const k = Object.keys(cols[e]).find(x => re.test(x)); return k === undefined ? null : cols[e][k]; };
  const ci = ents.map((_, e) => ({ pts: find(e, RE.pts), res: find(e, RE.res), team: find(e, RE.team) })); if (ci.some(c => !c.pts)) return null;
  const used = new Set([pcol]); cols.forEach(o => Object.values(o).forEach(x => used.add(x.c)));
  const nameCol = nh.findIndex((h, c) => !used.has(c) && /(grande premio|gp|corrida|jogo|partida|evento|prova|race|match|nome)/.test(h)), roundCol = nh.findIndex((h, c) => !used.has(c) && /(etapa|round|rodada)/.test(h));
  const num = x => (typeof x === 'number' && Number.isFinite(x) ? x : typeof x === 'string' && /^[+-]?\d+([.,]\d+)?$/.test(x.trim()) ? +x.replace(',', '.') : null);
  const pset = new Set(periods), byP = new Map();
  M.slice(1).forEach((r, idx) => {
    const p = String(r[pcol] == null ? '' : r[pcol]).trim(); if (!pset.has(p)) return;
    const pts = ci.map(c => num(r[c.pts.c])); if (pts.some(x => x === null)) return; const d = Math.max(...pts) - Math.min(...pts);
    const cell = ci.map(c => ({ team: c.team && r[c.team.c] != null ? String(r[c.team.c]) : '', res: c.res && r[c.res.c] != null ? String(r[c.res.c]) : '' }));
    const label = [p, nameCol >= 0 && r[nameCol] != null ? String(r[nameCol]) : roundCol >= 0 && r[roundCol] != null ? String(r[roundCol]) : ''].filter(Boolean).join(' · ');
    if (!byP.has(p)) byP.set(p, []); byP.get(p).push({ idx, p, label, pts, d, cell });
  });
  const both = [...byP.values()].reduce((a, x) => a + x.length, 0); if (!both) return null;
  const chosen = [...byP.values()].flatMap(list => list.filter(x => x.d > 0).sort((a, b) => b.d - a.d || a.idx - b.idx).slice(0, NV_VS_RACES).sort((a, b) => a.idx - b.idx));
  return chosen.length ? { rows: chosen, labels: { pts: ci[0].pts.label, res: ci[0].res ? ci[0].res.label : '', team: ci[0].team ? ci[0].team.label : '' }, total: both, periods: [...byP.keys()] } : null;
}

// ---------------------------------------------------------------- texto
const NVF = {
  pt: {
    t: { question: 'A pergunta', timeline: 'Linha do tempo', solo: 'Só um lado tem registro', partial: 'Temporada incompleta', comparable: 'Em condições comparáveis', races: 'Corrida a corrida', limits: 'Síntese e limites', concl: 'Conclusão' },
    ask: (ents, span) => `Como ${nvvT().list(ents)} se comparam${span ? ' entre ' + span.replace('–', ' e ') : ''}?`,
    recCut: ps => `Só ${ps} têm todos em condições comparáveis`, recNone: 'Nenhum período tem todos em condições comparáveis', span: s => `Período: ${s}`, src: f => `Fonte: ${f}`,
    tlH: (items) => `Linha do tempo: ${items}.`, tlSolo: (ps, who) => `${ps}, só ${who}`, tlPart: ps => `${ps}, incompleta`, tlComp: ps => `${ps}, comparável`, tlT: (e) => (e ? `Presença e ${e} por período` : 'Presença por período'),
    tlCT: 'Como classifiquei cada período', tlCF: (e) => `Sem registro: a entidade não aparece naquele período. Incompleto: o menor valor de ${e || 'exposição'} é menos da metade do maior. Comparável: os demais.`, tlNone: 'sem registro', tlInc: 'incompleto', tlCmp: 'comparável',
    soloH: (ps, who, abs) => `Em ${ps}, só ${who} ${who.includes(' e ') ? 'têm' : 'tem'} registro; ${abs} ${abs.includes(' e ') ? 'não têm' : 'não tem'} registro nesse período.`, soloT: who => `${who}, por período`, soloCT: 'Valores do período', soloCF: 'Valores copiados da planilha, sem comparação, porque só um lado tem registro.', soloOrd: 'Posições e ordens',
    partH: (ps, e, items) => `Em ${ps}, ${e}: ${items}. Totais não comparáveis, então cada métrica aparece por ${e}.`, partT: e => `Por ${e}`, partCT: e => `Métrica por ${e}`, partCF: e => `Total da métrica ÷ total de ${e} no período, para cada entidade.`, partBig: e => e,
    compH: (ps, parts, T, tie) => `Em condições comparáveis (${ps}), ${parts} entre ${T} ${T === 1 ? 'métrica' : 'métricas'}${tie ? `; empate em ${tie}` : ''}.`, compT: 'Totais no período comparável', compCT: 'Quem tem o maior valor em cada métrica', compCF: 'Soma dos períodos comparáveis para cada métrica; maior valor entre as entidades, empates à parte.', compPer: 'Placar de cada período',
    raceH: (ps, k, w) => `Corrida a corrida (${ps}): as ${k} etapas com a maior diferença de pontos entre os dois, em ${w}.`, raceCT: 'Como escolhi as corridas', raceCF: (n, w) => `Entre as ${n} corridas em que todos têm pontos, as ${NV_VS_RACES} de maior diferença em cada ${w} (empates, pela ordem do calendário); mostradas em ordem de calendário.`, raceDiff: 'Diferença', raceRace: 'Corrida', raceTotal: 'Corridas com pontos de todos', raceT: 'Corridas de maior diferença de pontos',
    sumNone: 'Nenhum período em condições comparáveis: não há placar', sumLine: (ents, ks, T, tie) => NVV.pt.synthH(ents, ks, T, tie), defPart: e => `Temporada incompleta: o menor valor de ${e} é menos da metade do maior`,
    concl: 'Conclusão',
  },
  en: {
    t: { question: 'The question', timeline: 'Timeline', solo: 'Only one side has a record', partial: 'Incomplete season', comparable: 'On comparable terms', races: 'Race by race', limits: 'Summary and limits', concl: 'Conclusion' },
    ask: (ents, span) => `How do ${nvvT().list(ents)} compare${span ? ' between ' + span.replace('–', ' and ') : ''}?`,
    recCut: ps => `Only ${ps} have everyone on comparable terms`, recNone: 'No period has everyone on comparable terms', span: s => `Period: ${s}`, src: f => `Source: ${f}`,
    tlH: (items) => `Timeline: ${items}.`, tlSolo: (ps, who) => `${ps}, only ${who}`, tlPart: ps => `${ps}, incomplete`, tlComp: ps => `${ps}, comparable`, tlT: (e) => (e ? `Presence and ${e} by period` : 'Presence by period'),
    tlCT: 'How I classified each period', tlCF: (e) => `No record: the entity does not appear in that period. Incomplete: the lowest ${e || 'exposure'} is less than half of the highest. Comparable: the rest.`, tlNone: 'no record', tlInc: 'incomplete', tlCmp: 'comparable',
    soloH: (ps, who, abs) => `In ${ps}, only ${who} ${who.includes(' and ') ? 'have' : 'has'} a record; ${abs} ${abs.includes(' and ') ? 'have' : 'has'} no record in this period.`, soloT: who => `${who}, by period`, soloCT: 'Values for the period', soloCF: 'Values copied from the sheet, without comparison, because only one side has a record.', soloOrd: 'Positions and orders',
    partH: (ps, e, items) => `In ${ps}, ${e}: ${items}. Totals are not comparable, so each metric is shown per ${e}.`, partT: e => `Per ${e}`, partCT: e => `Metric per ${e}`, partCF: e => `Metric total ÷ ${e} total in the period, for each entity.`, partBig: e => e,
    compH: (ps, parts, T, tie) => `On comparable terms (${ps}), ${parts} out of ${T} ${T === 1 ? 'metric' : 'metrics'}${tie ? `; tied on ${tie}` : ''}.`, compT: 'Totals in the comparable period', compCT: 'Who has the highest value in each metric', compCF: 'Sum of the comparable periods for each metric; highest value among the entities, ties apart.', compPer: 'Scoreboard of each period',
    raceH: (ps, k, w) => `Race by race (${ps}): the ${k} races with the largest points gap between them, across ${w}.`, raceCT: 'How I picked the races', raceCF: (n, w) => `Among the ${n} races where everyone has points, the ${NV_VS_RACES} with the largest gap in each ${w} (ties by calendar order); shown in calendar order.`, raceDiff: 'Gap', raceRace: 'Race', raceTotal: 'Races with points for everyone', raceT: 'Races with the largest points gap',
    sumNone: 'No period on comparable terms: there is no scoreboard', sumLine: (ents, ks, T, tie) => NVV.en.synthH(ents, ks, T, tie), defPart: e => `Incomplete season: the lowest ${e} is less than half of the highest`,
    concl: 'Conclusion',
  },
};
const nvfT = () => NVF[LANG] || NVF.pt;
const nvfClip = t => String(t).length <= NV_VS_NOTE_MAX ? String(t) : null;

// ---------------------------------------------------------------- slides
function nvPlanVersusPhases(P, N, pk) {
  const X = nvvT(), F = nvfT(), ents = pk.ents, E = ents.length, pd = pk.pd, expo = pk.cols && pk.cols.expo, seasonal = NV_VS_SEASON.test(pk.periodName || '');
  const word = k => X.perWord(seasonal, k), rng = ps => (ps.length <= 3 ? X.list(ps) : `${ps[0]}–${ps[ps.length - 1]}`), names = idx => X.list(idx.map(e => ents[e]));
  const base = `${X.base} · ${ents.join(X.vs)}`, byP = Object.fromEntries(pd.map(x => [x.p, x]));
  const noteOf = (ps, who) => { const out = []; ps.forEach(p => who.forEach(e => { const t = byP[p].text[e]; const c = t ? nvfClip(t) : null; if (c) out.push(`${pk.cols && pk.cols.ctx ? pk.cols.ctx + ' · ' : ''}${ps.length > 1 ? p + ' · ' : ''}${ents[e]}: ${c}`); })); return out.slice(0, 2).join(' · '); };
  // soma por métrica aditiva num conjunto de períodos (todas as entidades da lista precisam ter valor em todos os períodos)
  const sums = (ps, who) => { const names0 = pd.find(x => x.p === ps[0]).m.filter(m => m.add).map(m => m.name); return names0.map(nm => { const rows = ps.map(p => byP[p].m.find(m => m.name === nm)); if (rows.some(r => !r || who.some(e => r.v[e] === null))) return null; const f = rows[0]; return { name: nm, unit: f.unit, rate: false, v: ents.map((_, e) => (who.includes(e) ? rows.reduce((a, r) => a + r.v[e], 0) : null)) }; }).filter(Boolean); };
  const slides = {}, core = [];
  const push = (key, slide, pri) => { core.push({ key, slide, pri }); slides[key] = slide; };
  const pushAfterComp = (key, slide, pri) => { let at = -1; core.forEach((x, i) => { if (x.slide.role === 'vs_comparable') at = i; }); core.splice(at + 1, 0, { key, slide, pri }); slides[key] = slide; }; // a corrida a corrida vem logo depois da fase comparável
  const phases = pk.phases, comp = phases.filter(f => f.cls === 'comparable'), compPs = comp.flatMap(f => f.ps);
  // 1) a pergunta e o recorte
  { const lines = [ents.join(' × '), F.ask(ents, pk.span), compPs.length ? F.recCut(rng(compPs)) : F.recNone, pk.span ? F.span(pk.span) : '', P.fileName ? F.src(P.fileName) : ''].filter(Boolean);
    const s = nvpSynth('vs-cover', 'ctx', F.t.question, lines); s.head = s.caption = lines.join('. ').replace(/([?!])\./g, '$1'); s.verbatim = true; s.lintText = ''; s.noChart = true; push('cover', s, 0); }
  // 2) linha do tempo
  { const items = phases.map(f => (f.cls === 'solo' ? F.tlSolo(rng(f.ps), names(f.present)) : f.cls === 'partial' ? F.tlPart(rng(f.ps)) : F.tlComp(rng(f.ps)))).join('; '), exMax = Math.max(1, ...pd.flatMap(x => x.ex.filter(v => v !== null)));
    const rows = ents.map((en, e) => ({ k: en, cells: pd.map(x => (x.ex[e] !== null ? { t: nvvNum(x.ex[e]), p: Math.max(6, x.ex[e] / exMax * 100), c: x.cls === 'comparable' ? 'ok' : 'part' } : x.present.includes(e) ? { t: '●', p: 100, c: x.cls === 'comparable' ? 'ok' : 'part' } : { t: '—', p: 0, c: 'none' })) }));
    const calc = { title: F.tlCT, formula: F.tlCF(expo), rows: pd.map(x => ({ k: x.p, v: x.cls === 'solo' ? `${F.tlNone}: ${names(ents.map((_, e) => e).filter(e => !x.present.includes(e)))}` : `${x.ex.some(v => v !== null) ? x.ex.map(v => nvvNum(v)).join(X.vs) + ' · ' : ''}${x.cls === 'partial' ? F.tlInc : F.tlCmp}` })), base };
    push('timeline', nvvSlide('vs-timeline', 'vs_timeline', F.t.timeline, { head: F.tlH(items), calc, viz: { kind: 'timeline', title: F.tlT(expo), periods: pd.map(x => x.p), rows, note: expo || '' } }), 3); }
  // 3) fases, em ordem cronológica
  phases.forEach((f, i) => {
    const id = `vs-ph${i}-${f.cls}`, ps = f.ps, R = rng(ps), pds = ps.map(p => byP[p]);
    if (f.cls === 'solo') {
      const absE = ents.map((_, e) => e).filter(e => !f.present.includes(e)), head = F.soloH(R, names(f.present), names(absE));
      const addM = pds[0].m.filter(m => !m.ord && !m.rate).map(m => m.name), per = Math.max(1, Math.floor(12 / Math.max(1, ps.length)));
      let rows = [];
      if (f.present.length === 1) { const e = f.present[0]; addM.slice(0, per).forEach(nm => { const vals = pds.map(x => { const m = x.m.find(q => q.name === nm); return m ? m.v[e] : null; }), hi = Math.max(...vals.filter(v => v !== null), 1e-12); pds.forEach((x, k) => { if (vals[k] !== null) rows.push({ k: `${nm} · ${x.p}`, p: Math.max(0, vals[k] / hi * 100), t: nvvNum(vals[k]), hi: true }); }); }); }
      else { const pe = f.present, it = sums(ps, pe).map(m => ({ ...m, v: pe.map(e => m.v[e]) })); rows = nvvPairs(it, pe.map(e => ents[e]), 12, (m, x) => nvvNum(x, m.unit)); }
      const cr = [];
      pds.forEach(x => x.m.forEach(m => { if (!m.rate) f.present.forEach(e => { if (m.v[e] !== null) cr.push({ k: `${m.name} · ${x.p}${f.present.length > 1 ? ' · ' + ents[e] : ''}`, v: nvvNum(m.v[e], m.unit) }); }); }));
      const calc = { title: F.soloCT, formula: F.soloCF, rows: cr.slice(0, 14), base };
      push('ph' + i, nvvSlide(id, 'vs_solo', F.t.solo, { head, calc, note: noteOf(ps, f.present), viz: { title: F.soloT(names(f.present)), rows, note: R } }), 5);
    } else if (f.cls === 'partial' && expo) {
      const exSum = ents.map((_, e) => pds.reduce((a, x) => a + (x.ex[e] || 0), 0)), it = sums(ps, ents.map((_, e) => e)), asPct = it.every(m => m.v.every((x, e) => x / exSum[e] <= 1 + 1e-9));
      const rate = it.map(m => ({ name: m.name, v: m.v.map((x, e) => x / exSum[e]), raw: m.v.slice(), unit: '' }));
      if (!it.length) return;
      const rows = []; const per = Math.max(1, Math.floor(12 / E)); rate.slice(0, per).forEach(m => { const hi = Math.max(...m.v, 1e-12), top = nvVsWinner(m.v); m.v.forEach((x, e) => rows.push({ k: `${m.name} · ${ents[e]}`, p: Math.max(0, x / hi * 100), t: nvvRateFmt(x, asPct), hi: top === e })); });
      const head = F.partH(R, expo, ents.map((en, e) => `${en} ${nvvNum(exSum[e])}`).join(', ')), calc = { title: F.partCT(expo), formula: F.partCF(expo), rows: rate.map(m => ({ k: m.name, v: m.raw.map((x, e) => `${nvvNum(x)} ÷ ${nvvNum(exSum[e])} = ${nvvRateFmt(m.v[e], asPct)}`).join(' · ') })), base };
      push('ph' + i, nvvSlide(id, 'vs_partial', F.t.partial, { head, calc, note: noteOf(ps, ents.map((_, e) => e)), viz: { title: F.partT(expo), rows, note: R } }), 4);
    } else if (f.cls === 'comparable') {
      const items = sums(ps, ents.map((_, e) => e)); if (!items.length) return;
      const t = nvVsTally(items, E), lead = Math.max(...t.wins), leaders = ents.filter((_, e) => t.wins[e] === lead), T = items.length;
      const parts = leaders.length === E ? (E === 2 && lead > 0 ? X.scoreEq(ents, lead) : X.scoreAll(ents, t.wins)) : leaders.length > 1 ? X.scoreAll(ents, t.wins) : E === 2 ? `${X.scoreP(leaders[0], lead)}, ${ents.find(e => e !== leaders[0])} ${LANG === 'en' ? 'in' : 'em'} ${Math.min(...t.wins)}` : X.scoreAll(ents, t.wins);
      const perRows = ps.length >= 2 ? ps.map(p => { const its = byP[p].m.filter(m => m.add && m.v.every(x => x !== null)).map(m => ({ v: m.v })); const tl = nvVsTally(its, E); return { k: `${F.compPer} · ${p}`, v: tl.wins.join(X.vs) + (tl.tie ? ` (${X.ties.toLowerCase()} ${tl.tie})` : '') }; }) : [];
      const calc = { title: F.compCT, formula: F.compCF, rows: [...items.map((m, k) => ({ k: m.name, v: `${m.v.map(x => nvvNum(x, m.unit)).join(X.vs)} → ${t.who[k] < 0 ? X.ties : ents[t.who[k]]}` })), ...perRows], base };
      push('ph' + i, nvvSlide(id, 'vs_comparable', F.t.comparable, { head: F.compH(R, parts, T, t.tie), big: { text: E === 2 ? t.wins.join(X.vs) : `${lead}/${T}`, label: X.big }, calc,
        viz: { title: F.compT, rows: nvvPairs(items, ents, 12, (m, x) => nvvNum(x, m.unit)), note: R }, ev: nvEv('vsscore', { wins: t.wins.slice(), tie: t.tie, total: T }, [{ k: 'tot', value: T, text: String(T) }], { n: T, method: 'count', refs: ents.slice() }) }), 1);
    }
  });
  // 4) corrida a corrida (aba Detalhe)
  if (compPs.length) { const rc = nvWbRaces(P, pk, compPs);
    if (rc) {
      const k = rc.rows.length, w = word(rc.periods.length), head = F.raceH(rng(rc.periods), k, `${rc.periods.length} ${w}`);
      const cells = rc.rows.map(r => [r.label, ...ents.map((_, e) => [r.cell[e].team, r.cell[e].res ? `${rc.labels.res} ${r.cell[e].res}` : '', `${nvvNum(r.pts[e])} ${rc.labels.pts.toLowerCase()}`].filter(Boolean).join(' · ')), nvvNum(r.d)]);
      const calc = { title: F.raceCT, formula: F.raceCF(rc.total, word(1)), rows: [...rc.rows.map(r => ({ k: r.label, v: `${r.pts.map(x => nvvNum(x)).join(X.vs)} → ${F.raceDiff} ${nvvNum(r.d)}` })), { k: F.raceTotal, v: String(rc.total) }], base };
      pushAfterComp('races', nvvSlide('vs-races', 'vs_races', F.t.races, { head, calc, viz: { kind: 'table', title: F.raceT, head: [F.raceRace, ...ents, F.raceDiff], rows: cells, note: '' } }), 2); }
  }
  // 5) síntese e limites
  { const n = pk.notes || {}, L = [], it = compPs.length ? sums(compPs, ents.map((_, e) => e)) : [], t = it.length ? nvVsTally(it, E) : null;
    L.push(it.length ? F.sumLine(ents, t.wins, it.length, t.tie) : F.sumNone);
    const hasPart = phases.some(f => f.cls === 'partial'); if (hasPart && expo) L.push(F.defPart(expo));
    nvWbDerive(P.built.wbx).caveats.forEach(c => L.push(c.k ? `${c.k}: ${c.t}` : c.t));
    if (n.ord && n.ord.length) L.push(X.limOrd(n.ord.join(', '))); if (n.lower && n.lower.length) L.push(X.limLower(n.lower.join(', ')));
    if (n.noUnit && n.noUnit.length) L.push(X.limUnit(n.noUnit.join(', '))); if (n.leftOut && n.leftOut.length) L.push(X.limLeft(n.leftOut.join(', '))); if (n.dropped && n.dropped.length) L.push(X.limDrop(n.dropped.join(', ')));
    L.push(X.limWho, X.limRange);
    const s = nvpSynth('vs-synthlim', 'synthesis', F.t.limits, L); s.verbatim = true; s.lintText = ''; s.noChart = true;
    if (it.length) s.ev = nvEv('vsscore', { wins: t.wins.slice(), tie: t.tie, total: it.length }, [{ k: 'tot', value: it.length, text: String(it.length) }], { n: it.length, method: 'count', refs: ents.slice() });
    push('limits', s, -1); }
  // 6) a conclusão é da pessoa: slide em branco, editável na apresentação
  const concl = { id: 'vs-conclusion', act: 'vs_conclusion', role: 'conclusion', planTitle: F.t.concl, kick: { n: '00', label: F.t.concl }, head: '', caption: '', hl: '', big: null, calc: null, viz: null, state: null, synthetic: true, ev: null, refs: [], note: '', blank: true, noNote: true, noChart: true, lintText: '', verbatim: true };
  // ajuste ao tamanho: sai primeiro o que menos pesa (primeiro as fases só de um lado, depois as incompletas, a linha do tempo e a corrida a corrida)
  const withSrc = !!nvWbSourcesSlide(P) && N >= 5, room = N <= 2 ? 2 : N - (withSrc ? 1 : 0) - 1;
  let keep = core.slice();
  while (keep.length > room) { const drop = keep.filter(x => x.pri > 1).sort((a, b) => b.pri - a.pri)[0] || keep.filter(x => x.pri === 1).slice(1).pop() || keep.find(x => x.pri === 0); if (!drop) break; keep = keep.filter(x => x !== drop); } // sai primeiro o que menos pesa: fases de um lado só, incompletas, linha do tempo e corrida a corrida
  if (N <= 2) keep = [keep.find(x => x.slide.role === 'vs_comparable') || keep.find(x => x.key.startsWith('ph')), keep.find(x => x.key === 'limits')].filter(Boolean);
  const order = core.map(x => x.slide), picked = keep.map(x => x.slide).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const plan = [...picked, ...(N >= 5 ? [concl] : [])];
  const out = nvFinishPlan(P, plan, N, { items: [] }, null); out.story = 'versus'; return out;
}
