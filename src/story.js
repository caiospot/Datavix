/* Datavix: a história dos números. Cada slide é um "ato": uma frase que conta o achado, o número que o prova, o cálculo à vista
 * e o destaque no gráfico. Tudo vem de cálculos sobre os dados (totais por grupo, participações, razões e os insights da peça);
 * nenhuma frase afirma algo que não tenha o cálculo ao lado. */
const STORY_TXT = {
  pt: {
    kick: { c_rate: 'A taxa', c_impact: 'O impacto', c_where: 'Onde varia', c_cause: 'As causas', c_terms: 'O que se repete', overview: 'O panorama', leader: 'O líder', balance: 'O equilíbrio', conc: 'A concentração', contrast: 'O contraste', relation: 'A relação', peak: 'O pico', low: 'O vale', jump_up: 'A virada', drop: 'A queda', trend_up: 'A tendência', trend_down: 'A tendência', dominant: 'O domínio', outlier: 'O ponto fora da curva', flow_conv: 'A conversão', flow_drop: 'O gargalo', flow_path: 'O caminho', ridge_cmp: 'A comparação', other: 'O destaque' },
    ovCount: (r, a, b) => `${r} registros entre ${a} e ${b}.`, ovCountG: (r, n, x) => `${r} registros em ${n} grupos de “${x}”.`,
    cs: {
      yes: 'SIM', no: 'NÃO', when: 'Quando', valid: 'Respostas válidas', outside: 'Fora da conta', rate: 'Taxa de SIM', gap: 'Diferença', all: 'Todos os grupos', rows: 'Linhas', filled: 'Linhas preenchidas', share: 'Participação',
      rateH: (c, p, a, v) => `“${c}”: SIM em ${p} das respostas válidas (${a} de ${v}).`,
      impactH: (o, f, p1, a1, v1, p0, a0, v0) => `Quando “${o}” é SIM, “${f}” é SIM em ${p1} dos casos (${a1} de ${v1}); quando é NÃO, em ${p0} (${a0} de ${v0}).`,
      whereH: (g, o, lo, plo, alo, vlo, hi, phi, ahi, vhi) => `Por “${g}”, o SIM em “${o}” vai de ${plo} em ${lo} (${alo} de ${vlo}) a ${phi} em ${hi} (${ahi} de ${vhi}).`,
      causeH: (c, top, k, f) => `Em “${c}”, a resposta mais frequente é ${top}: ${k} de ${f}.`,
      termsH: (c, w, k, f) => `Nos textos de “${c}”, “${w}” aparece em ${k} de ${f} casos.`,
      lbl: { rate: 'DAS RESPOSTAS VÁLIDAS', gap: 'DE DIFERENÇA', spread: 'DE AMPLITUDE', top: 'DAS RESPOSTAS', terms: 'DOS CASOS' }, pp: 'p.p.',
      rateT: 'Taxa entre respostas válidas', rateF: 'SIM ÷ (SIM + NÃO). Respostas em branco, “não se aplica” e outras não entram na conta.',
      impactT: 'Impacto de um resultado sobre outro', impactF: 'Taxa de SIM em cada coluna, calculada dentro de cada resposta do resultado; a diferença vem em pontos percentuais. Só entram grupos com 8 ou mais respostas válidas.',
      whereT: 'Taxa por grupo', whereF: 'SIM ÷ (SIM + NÃO) dentro de cada grupo (8 ou mais respostas válidas); mostra o menor e o maior.',
      causeT: 'Respostas mais frequentes', causeF: 'Linhas com cada resposta ÷ linhas preenchidas (em branco e “sem informação” ficam de fora).',
      termsT: 'Termos mais citados', termsF: 'Linhas cujo texto contém a palavra ÷ linhas preenchidas (4 letras ou mais, sem conectivos; variações da mesma palavra contam à parte).'
    },
    ovSum: (r, t, n, x) => `${r} registros somam ${t}, repartidos em ${n} grupos de “${x}”.`,
    ovTime: (r, t, a, b) => `${r} registros somam ${t} entre ${a} e ${b}.`,
    ovMean: (r, n, x) => `${r} registros analisados em ${n} grupos de “${x}”.`,
    ovRel: (n, x, y) => `${n} pontos relacionam “${x}” e “${y}”.`,
    leader: (l, v, p) => `${l} lidera: ${v}, ${p} do total.`,
    leaderMean: (l, v) => `${l} tem o maior valor: ${v}.`,
    balance: (l, p) => `Nenhum grupo domina: o maior, ${l}, tem só ${p} do total.`,
    conc: (k, p, r, q) => `Os ${k} maiores somam ${p} do total; os outros ${r} dividem ${q}.`,
    contrast: (a, x, b) => `${a} vale ${x}× ${b}.`,
    corr: (x, y, r, d) => `A correlação entre “${x}” e “${y}” é ${r}: ${d}.`,
    corrD: { sp: 'forte e positiva, as duas medidas sobem juntas', mp: 'moderada e positiva, tendem a subir juntas', wp: 'fraca e positiva, quase sem relação', sn: 'forte e negativa, quando uma sobe a outra cai', mn: 'moderada e negativa, tendem a andar em sentidos opostos', wn: 'fraca e negativa, quase sem relação' },
    contrib: (g, p, up) => `${g} explica ${p} ${up ? 'da alta' : 'da queda'} do período.`,
    shift: (g, pp, up) => `${g} ${up ? 'ganhou' : 'perdeu'} ${pp} de participação entre o início e o fim.`,
    lbl: { total: 'do total', top: k => `nos ${k} maiores`, ratio: 'líder ÷ menor', corr: 'correlação (r)', value: 'valor', records: 'registros', pp: 'p.p.', ofChange: 'da variação', ofShare: 'de participação' },
    kick2: { contrib: 'O motor da mudança', shift: 'A virada de participação', diag: 'O diagnóstico', impl: 'O que isso significa', prio: 'As prioridades', plan: 'O plano de ação', ask: 'A decisão' },
    read: { c_rate: 'Taxa de resposta', c_impact: 'Impacto no resultado', c_where: 'Variação entre grupos', c_cause: 'Causas principais', c_terms: 'Termos mais citados', overview: 'Panorama', leader: 'Liderança forte', balance: 'Equilíbrio', conc: 'Dependência de poucos', contrast: 'Distância entre extremos', relation: 'Relação entre medidas', peak: 'Um pico marcante', low: 'Um vale', jump_up: 'Uma virada para cima', drop: 'Uma queda', trend_up: 'Crescimento', trend_down: 'Retração', dominant: 'Domínio de um grupo', outlier: 'Ponto fora da curva', flow_conv: 'Conversão do funil', flow_drop: 'Gargalo', flow_path: 'Caminho dominante', ridge_cmp: 'Diferença entre lados', contrib: 'Motor da mudança', shift: 'Mudança de participação', other: 'Destaque' },
    crit: { top: 'Onde concentrar (maiores valores)', low: 'O que rever (menores valores)', growth: 'Onde cresce mais', drop: 'Onde cai mais' },
    critS: { top: 'onde concentrar', low: 'o que rever', growth: 'onde cresce mais', drop: 'onde cai mais' },
    critF: { top: 'Grupos ordenados do maior para o menor valor.', low: 'Grupos ordenados do menor para o maior valor.', growth: 'Variação entre a janela inicial e a final, por grupo.', drop: 'Maiores quedas entre a janela inicial e a final, por grupo.' },
    prioH: 'Prioridade: ', diagCalc: 'Números que sustentam', planCalc: 'Números que acompanham cada ação', plan: { who: 'Quem', when: 'Quando', track: 'Acompanha' },
    calc: {
      ovT: 'Total e contagem', ovF: 'Soma do valor em todos os registros; grupos distintos do eixo.', total: 'Total', groups: 'Grupos', mean: 'Média por grupo',
      leadT: 'Participação do líder', leadF: 'Valor do líder ÷ soma de todos os grupos.', share: 'Participação',
      concT: 'Concentração nos maiores', concF: 'Soma dos maiores ÷ soma de todos os grupos.', topSum: 'Soma dos maiores', rest: 'Demais grupos',
      conT: 'Razão entre extremos', conF: 'Maior valor ÷ menor valor.', ratio: 'Razão',
      contribT: 'Contribuição para a variação', contribF: 'Variação do grupo ÷ variação do total, da janela inicial para a final.', shiftT: 'Mudança de participação', shiftF: 'Participação do grupo na janela final − na janela inicial.', change: 'Variação', share0: 'Participação no início', share1: 'Participação no fim',
      corT: 'Correlação de Pearson', corF: 'Covariância dos dois valores ÷ produto dos desvios (−1 a 1). Forte: |r| ≥ 0,7; moderada: ≥ 0,4.', points: 'Pontos',
    },
  },
  en: {
    kick: { c_rate: 'The rate', c_impact: 'The impact', c_where: 'Where it varies', c_cause: 'The causes', c_terms: 'What repeats', overview: 'The big picture', leader: 'The leader', balance: 'The balance', conc: 'The concentration', contrast: 'The contrast', relation: 'The relationship', peak: 'The peak', low: 'The low', jump_up: 'The turn', drop: 'The drop', trend_up: 'The trend', trend_down: 'The trend', dominant: 'The dominance', outlier: 'The outlier', flow_conv: 'The conversion', flow_drop: 'The bottleneck', flow_path: 'The path', ridge_cmp: 'The comparison', other: 'The highlight' },
    ovCount: (r, a, b) => `${r} records between ${a} and ${b}.`, ovCountG: (r, n, x) => `${r} records across ${n} “${x}” groups.`,
    cs: {
      yes: 'YES', no: 'NO', when: 'When', valid: 'Valid answers', outside: 'Left out', rate: 'YES rate', gap: 'Difference', all: 'All groups', rows: 'Rows', filled: 'Filled rows', share: 'Share',
      rateH: (c, p, a, v) => `“${c}”: YES in ${p} of valid answers (${a} of ${v}).`,
      impactH: (o, f, p1, a1, v1, p0, a0, v0) => `When “${o}” is YES, “${f}” is YES in ${p1} of cases (${a1} of ${v1}); when it is NO, in ${p0} (${a0} of ${v0}).`,
      whereH: (g, o, lo, plo, alo, vlo, hi, phi, ahi, vhi) => `By “${g}”, YES on “${o}” goes from ${plo} in ${lo} (${alo} of ${vlo}) to ${phi} in ${hi} (${ahi} of ${vhi}).`,
      causeH: (c, top, k, f) => `In “${c}”, the most frequent answer is ${top}: ${k} of ${f}.`,
      termsH: (c, w, k, f) => `In the texts of “${c}”, “${w}” shows up in ${k} of ${f} cases.`,
      lbl: { rate: 'OF VALID ANSWERS', gap: 'DIFFERENCE', spread: 'SPREAD', top: 'OF ANSWERS', terms: 'OF CASES' }, pp: 'p.p.',
      rateT: 'Rate among valid answers', rateF: 'YES ÷ (YES + NO). Blank, “not applicable” and other answers are left out.',
      impactT: 'Impact of one result on another', impactF: 'YES rate in each column, computed inside each answer of the result; the difference is in percentage points. Only groups with 8 or more valid answers count.',
      whereT: 'Rate by group', whereF: 'YES ÷ (YES + NO) inside each group (8 or more valid answers); shows the lowest and the highest.',
      causeT: 'Most frequent answers', causeF: 'Rows with each answer ÷ filled rows (blank and “no information” are left out).',
      termsT: 'Most cited terms', termsF: 'Rows whose text contains the word ÷ filled rows (4+ letters, no connectives; variants of the same word count separately).'
    },
    ovSum: (r, t, n, x) => `${r} records add up to ${t}, split into ${n} “${x}” groups.`,
    ovTime: (r, t, a, b) => `${r} records add up to ${t} between ${a} and ${b}.`,
    ovMean: (r, n, x) => `${r} records analyzed across ${n} “${x}” groups.`,
    ovRel: (n, x, y) => `${n} points relate “${x}” and “${y}”.`,
    leader: (l, v, p) => `${l} leads with ${v}, ${p} of the total.`,
    leaderMean: (l, v) => `${l} has the highest value: ${v}.`,
    balance: (l, p) => `No group dominates: the largest, ${l}, holds only ${p} of the total.`,
    conc: (k, p, r, q) => `The top ${k} add up to ${p} of the total; the other ${r} share ${q}.`,
    contrast: (a, x, b) => `${a} is worth ${x}× ${b}.`,
    corr: (x, y, r, d) => `The correlation between “${x}” and “${y}” is ${r}: ${d}.`,
    corrD: { sp: 'strong and positive, both measures rise together', mp: 'moderate and positive, they tend to rise together', wp: 'weak and positive, almost no relationship', sn: 'strong and negative, when one rises the other falls', mn: 'moderate and negative, they tend to move in opposite directions', wn: 'weak and negative, almost no relationship' },
    contrib: (g, p, up) => `${g} explains ${p} of the period's ${up ? 'rise' : 'fall'}.`,
    shift: (g, pp, up) => `${g} ${up ? 'gained' : 'lost'} ${pp} of share between the start and the end.`,
    lbl: { total: 'of the total', top: k => `in the top ${k}`, ratio: 'leader ÷ smallest', corr: 'correlation (r)', value: 'value', records: 'records', pp: 'p.p.', ofChange: 'of the change', ofShare: 'of share' },
    kick2: { contrib: 'The driver of change', shift: 'The share shift', diag: 'The diagnosis', impl: 'What it means', prio: 'The priorities', plan: 'The action plan', ask: 'The decision' },
    read: { c_rate: 'Answer rate', c_impact: 'Impact on the result', c_where: 'Variation across groups', c_cause: 'Main causes', c_terms: 'Most cited terms', overview: 'Big picture', leader: 'Strong leader', balance: 'Balance', conc: 'Dependence on a few', contrast: 'Gap between extremes', relation: 'Relationship between measures', peak: 'A striking peak', low: 'A low', jump_up: 'A turn upward', drop: 'A drop', trend_up: 'Growth', trend_down: 'Decline', dominant: 'One group dominates', outlier: 'Outlier', flow_conv: 'Funnel conversion', flow_drop: 'Bottleneck', flow_path: 'Dominant path', ridge_cmp: 'Difference between sides', contrib: 'Driver of change', shift: 'Share shift', other: 'Highlight' },
    crit: { top: 'Where to concentrate (highest values)', low: 'What to review (lowest values)', growth: 'Where it grows most', drop: 'Where it falls most' },
    critS: { top: 'where to concentrate', low: 'what to review', growth: 'where it grows most', drop: 'where it falls most' },
    critF: { top: 'Groups sorted from the highest to the lowest value.', low: 'Groups sorted from the lowest to the highest value.', growth: 'Change between the first and the last window, per group.', drop: 'Largest falls between the first and the last window, per group.' },
    prioH: 'Priority: ', diagCalc: 'Numbers that support it', planCalc: 'Numbers that track each action', plan: { who: 'Who', when: 'When', track: 'Tracks' },
    calc: {
      ovT: 'Total and count', ovF: 'Sum of the value over all records; distinct groups on the axis.', total: 'Total', groups: 'Groups', mean: 'Mean per group',
      leadT: "Leader's share", leadF: "Leader's value ÷ sum of all groups.", share: 'Share',
      concT: 'Concentration in the largest', concF: 'Sum of the largest ÷ sum of all groups.', topSum: 'Sum of the largest', rest: 'Other groups',
      conT: 'Ratio between extremes', conF: 'Largest value ÷ smallest value.', ratio: 'Ratio',
      contribT: 'Contribution to the change', contribF: "Group's change ÷ total change, from the first window to the last.", shiftT: 'Share shift', shiftF: "Group's share in the last window − in the first window.", change: 'Change', share0: 'Share at the start', share1: 'Share at the end',
      corT: 'Pearson correlation', corF: 'Covariance of the two values ÷ product of the deviations (−1 to 1). Strong: |r| ≥ 0.7; moderate: ≥ 0.4.', points: 'Points',
    },
  },
};

// número do slide: o primeiro "%" do cálculo (variação ou participação); senão, a primeira linha
function storyBig(ins) {
  const rows = (ins.calc && ins.calc.rows) || [], pr = rows.filter(r => /%/.test(String(r.v)));
  const r = pr.length ? pr[pr.length - 1] : rows[0]; return r ? { text: String(r.v), label: String(r.k) } : null;
}

// o agrupamento principal que o gráfico escolhido usa (categorias no Leque, lojas na Cordilheira, UFs na Árvore...), com o nome da dimensão
function storyGroups(P) {
  const b = P.built, cs = b.cs && b.cs[P.type], t = P.type, mp = a => (a || []).map(x => ({ label: x.label, value: x.v, rows: x.n })).filter(x => x.label != null && x.value != null);
  let g = null, name = '';
  if (cs && t === 'fan') { g = mp(cs.cats); name = cs.catName; }
  else if (cs && t === 'rays') { const grp = cs.groups && cs.groups.length > 1; g = mp(grp ? cs.groups : cs.ents); name = grp ? cs.grpName : cs.entName; }
  else if (cs && t === 'river') { g = mp(cs.cats); name = cs.catName; }
  else if (cs && t === 'ridge') { g = mp(cs.ents); name = cs.entName; }
  else if (t === 'organism' && b.org) { g = mp(b.org.ents); name = b.org.entName; }
  if (g) g = g.filter(x => !isPlaceholderLabel(x.label));
  return g && g.length >= 3 ? { list: g, name: name || '' } : null;
}

// todos os insights candidatos (os da peça mais os que o limite do público cortou), para o construtor de história
function allInsights(P) {
  const b = P.built, reg = CHART_REG[P.type], csD = reg && b.cs && b.cs[P.type], br = { ...(P.br || {}), limit: 14, all: true };
  let extra = []; try { extra = csD && reg.insights ? reg.insights(csD, br, LANG, T) : computeInsights(b, br, LANG, T); } catch (e) { extra = []; }
  const have = new Set((P.insights || []).map(i => i.id + '|' + i.text));
  return [...(P.insights || []), ...extra.filter(i => !have.has(i.id + '|' + i.text))];
}
// matriz grupo × período dos gráficos de tempo (Rio ou Cordilheira): base das análises "quem explica a mudança" e "quem ganhou participação"
function storyMatrix(P, want) {
  const cs = P.built.cs || {}, c = [];
  if (cs.river && cs.river.cats && cs.river.m && cs.river.periods) c.push({ groups: cs.river.cats.map(x => x.label), periods: cs.river.periods.map(x => x.label), rows: cs.river.m });
  if (cs.ridge && cs.ridge.ents && cs.ridge.m && cs.ridge.times) c.push({ groups: cs.ridge.ents.map(x => x.label), periods: cs.ridge.times.map(x => x.label), rows: cs.ridge.m.map(r => (Array.isArray(r[0]) ? r[0].map((_, t) => r.reduce((a, q) => a + (+q[t] || 0), 0)) : r)) });
  const score = m => (want ? m.groups.filter(g => want.includes(g)).length / m.groups.length : 0);
  return c.sort((a, b) => score(b) - score(a))[0] || null;
}

// destaque no gráfico: um passo existente para o rótulo, ou o filtro direto nos gráficos de Vizzu
function storyStates(P, meta, steps) {
  const labels = meta && meta.filterLabels ? meta.filterLabels : [], viz = !isCsType(P.type);
  const stepFor = lab => steps.find(s => s.state && s.caption && String(s.caption).startsWith(lab) && !/^i\d/.test(s.id));
  const stateOf = lab => { if (!lab) return null; const s = stepFor(String(lab)); if (s) return s.state; return viz && labels.includes(lab) ? { sel: [lab] } : null; };
  // vários grupos de uma vez: filtro nos de Vizzu; nos de canvas, só quando cada grupo tem um passo com a lista de grupos (ex.: Leque)
  const manyState = labs => { if (viz) return labels.length && labs.every(l => labels.includes(l)) ? { sel: labs.slice() } : null; const sts = labs.map(stateOf); return sts.every(x => x && x.cs && Array.isArray(x.cs.cats)) ? { cs: { cats: sts.flatMap(x => x.cs.cats) } } : null; };
  return { stateOf, manyState };
}

// casos e pesquisas (P.cases, calculado com a planilha): cada fato vira um ato com número, cálculo e, nas listas, ranking
function casesFacts(P) {
  const C = P.cases; if (!C || !C.facts || !C.facts.length) return [];
  const X = (STORY_TXT[LANG] || STORY_TXT.pt).cs, I = v => fmtInt(v, LANG), pc = v => csPct(v, LANG), r = (a, b) => (a + b ? a / (a + b) * 100 : 0), dec = LANG === 'pt' ? ',' : '.';
  const ppt = d => (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(Math.abs(d) < 10 ? 1 : 0).replace('.', dec) + ' ' + X.pp;
  const out = [], nm = t => { t = String(t).trim().replace(/[:\s]+$/, ''); return t && t === t.toUpperCase() && /[A-ZÀ-Ý]/.test(t) ? t.charAt(0) + t.slice(1).toLowerCase() : t; }; // nomes de coluna em CAIXA ALTA viram frase
  C.facts.forEach((f0, i) => {
    let s = null; const f = { ...f0 }; ['name', 'o', 'f', 'g'].forEach(k => { if (f[k]) f[k] = nm(f[k]); });
    if (f.k === 'rate') {
      const v = f.pos + f.neg, p = pc(r(f.pos, f.neg));
      s = { id: 'c-rate-' + i, act: 'c_rate', head: X.rateH(f.name, p, I(f.pos), I(v)), hl: p, big: { text: p, label: X.lbl.rate }, bars: [{ k: X.yes, p: r(f.pos, f.neg), t: p }, { k: X.no, p: r(f.neg, f.pos), t: pc(r(f.neg, f.pos)) }],
        calc: { title: X.rateT, formula: X.rateF, rows: [{ k: X.yes, v: I(f.pos), n: f.n }, { k: X.no, v: I(f.neg) }, { k: X.valid, v: I(v) }, { k: X.outside, v: I(f.other + f.blank) }, { k: X.rate, v: p }] } };
    } else if (f.k === 'impact') {
      const p1 = pc(r(f.a1, f.v1 - f.a1)), p0 = pc(r(f.a0, f.v0 - f.a0)), d = ppt(f.d);
      s = { id: 'c-imp-' + i, act: 'c_impact', head: X.impactH(f.o, f.f, p1, I(f.a1), I(f.v1), p0, I(f.a0), I(f.v0)), hl: '', big: { text: d, label: X.lbl.gap }, bars: [{ k: `${X.when} ${X.yes}`, p: r(f.a1, f.v1 - f.a1), t: p1 }, { k: `${X.when} ${X.no}`, p: r(f.a0, f.v0 - f.a0), t: p0 }],
        calc: { title: X.impactT, formula: X.impactF, rows: [{ k: `${f.o} = ${X.yes} · ${f.f} = ${X.yes}`, v: `${p1} (${I(f.a1)}/${I(f.v1)})` }, { k: `${f.o} = ${X.no} · ${f.f} = ${X.yes}`, v: `${p0} (${I(f.a0)}/${I(f.v0)})` }, { k: X.gap, v: d }] } };
    } else if (f.k === 'where') {
      const plo = pc(f.lo.a / f.lo.v * 100), phi = pc(f.hi.a / f.hi.v * 100), pall = pc(f.all.a / f.all.v * 100), d = ppt(f.spread).replace('+', '');
      s = { id: 'c-where-' + i, act: 'c_where', head: X.whereH(f.g, f.o, f.lo.l, plo, I(f.lo.a), I(f.lo.v), f.hi.l, phi, I(f.hi.a), I(f.hi.v)), hl: '', big: { text: d, label: X.lbl.spread }, bars: [{ k: f.lo.l, p: f.lo.a / f.lo.v * 100, t: plo }, { k: f.hi.l, p: f.hi.a / f.hi.v * 100, t: phi }, { k: X.all, p: f.all.a / f.all.v * 100, t: pall }],
        calc: { title: X.whereT, formula: X.whereF, rows: [{ k: f.lo.l, v: `${plo} (${I(f.lo.a)}/${I(f.lo.v)})` }, { k: f.hi.l, v: `${phi} (${I(f.hi.a)}/${I(f.hi.v)})` }, { k: X.all, v: `${pall} (${I(f.all.a)}/${I(f.all.v)})` }, { k: X.gap, v: d }] } };
    } else if (f.k === 'cause' || f.k === 'terms') {
      const top = f.top[0], p = pc(top.n / f.filled * 100), cause = f.k === 'cause';
      s = { id: (cause ? 'c-cause-' : 'c-terms-') + i, type: 'prio', act: cause ? 'c_cause' : 'c_terms', head: cause ? X.causeH(f.name, top.l, I(top.n), I(f.filled)) : X.termsH(f.name, top.l, I(top.n), I(f.filled)), hl: '', big: { text: p, label: cause ? X.lbl.top : X.lbl.terms },
        rank: f.top.map((x, j) => ({ n: j + 1, k: x.l, v: I(x.n), s: pc(x.n / f.filled * 100) })),
        calc: { title: cause ? X.causeT : X.termsT, formula: cause ? X.causeF : X.termsF, rows: [...f.top.map(x => ({ k: x.l, v: `${I(x.n)} (${pc(x.n / f.filled * 100)})` })), { k: X.filled, v: I(f.filled), n: f.n }] } };
    }
    if (s) { s.state = null; if (!s.head.includes(s.hl)) s.hl = ''; out.push(s); }
  });
  return out;
}

function buildStory(P, meta, steps, opt = {}) {
  const L = STORY_TXT[LANG] || STORY_TXT.pt, b = P.built, tot = (b.totX || []).filter(t => t.value !== null), n = tot.length, f = v => fmtNum(v, b.unit, LANG);
  const isSum = b.aggKind !== 'mean', pctS = x => csPct(x, LANG), rows = (b.stats && (b.stats.rowsUsed || b.stats.rowsTotal)) || 0, rowsTxt = fmtInt(rows, LANG);
  let hero = null; try { hero = kpiCards(b, LANG, T)[0] || null; } catch (e) { /* sem indicador */ }
  const { stateOf, manyState } = storyStates(P, meta, steps);
  const sg = b.kind === 'relation' ? null : storyGroups(P);
  const out = []; const add = s => { s.kick = { n: String(out.length + 1).padStart(2, '0'), label: L.kick[s.act] || L.kick2[s.act] || L.kick.other }; s.caption = s.head; out.push(s); };

  // 1) panorama
  if (b.kind === 'relation' && b.pts) {
    add({ id: 'st-ov', act: 'overview', head: L.ovRel(fmtInt(b.pts.length, LANG), b.names.x, b.names.y), big: hero ? { text: kpiFmt(hero), label: hero.label } : null, state: null,
      calc: { title: L.calc.ovT, formula: L.calc.ovF, rows: [{ k: L.calc.points, v: fmtInt(b.pts.length, LANG), n: rows }] } });
  } else if (n || sg) {
    const gl = sg ? sg.list : (!b.xIsTime ? tot : []), gn = gl.length, gname = sg && sg.name ? sg.name : b.names.x;
    const sum = (b.xIsTime || !sg ? tot : gl).reduce((a, t) => a + t.value, 0), mean = sum / Math.max(1, (b.xIsTime ? n : gn)), totTxt = hero ? kpiFmt(hero) : f(sum);
    const head = b.aggKind === 'count' ? (b.xIsTime && n ? L.ovCount(rowsTxt, tot[0].label, tot[n - 1].label) : L.ovCountG(rowsTxt, fmtInt(gn || n, LANG), gname)) : !isSum ? L.ovMean(rowsTxt, fmtInt(gn || n, LANG), gname) : b.xIsTime && n ? L.ovTime(rowsTxt, totTxt, tot[0].label, tot[n - 1].label) : L.ovSum(rowsTxt, totTxt, fmtInt(gn || n, LANG), gname);
    add({ id: 'st-ov', act: 'overview', head, hl: isSum && b.aggKind !== 'count' ? totTxt : '', big: hero ? { text: kpiFmt(hero), label: hero.label } : null, state: null,
      calc: { title: L.calc.ovT, formula: L.calc.ovF, rows: [{ k: L.calc.total, v: isSum ? f(sum) : totTxt, n: rows }, { k: L.calc.groups, v: fmtInt(gn || n, LANG) }, { k: L.calc.mean, v: f(mean) }] } });
    casesFacts(P).forEach(add); // casos e pesquisas: taxas, impacto, onde varia, causas e termos logo depois do panorama
    // 2) o líder, 3) a concentração e 4) o contraste: sobre os grupos do gráfico escolhido
    if (gn >= 3) {
      const gsum = gl.reduce((a, t) => a + t.value, 0), srt = gl.slice().sort((x, y) => y.value - x.value), top = srt[0], low = srt[gn - 1], n2 = gn;
      if (isSum && gsum > 0) {
        const share = top.value / gsum * 100, balanced = share <= 125 / n2;
        add({ id: 'st-lead', act: balanced ? 'balance' : 'leader', head: balanced ? L.balance(top.label, pctS(share)) : L.leader(top.label, f(top.value), pctS(share)), hl: pctS(share), big: { text: pctS(share), label: L.lbl.total }, state: stateOf(top.label),
          calc: { title: L.calc.leadT, formula: L.calc.leadF, rows: [{ k: top.label, v: f(top.value), n: top.rows }, { k: L.calc.total, v: f(gsum) }, { k: L.calc.share, v: pctS(share) }] } });
        if (n2 >= 6) {
          const k = 3, kt = srt.slice(0, k), ks = kt.reduce((a, t) => a + t.value, 0), p = ks / gsum * 100, rest = n2 - k, q = 100 - p;
          add({ id: 'st-conc', lowPri: !!P.cases, act: 'conc', head: L.conc(k, pctS(p), rest, pctS(q)), hl: pctS(p), big: { text: pctS(p), label: L.lbl.top(k) }, state: manyState(kt.map(t => t.label)),
            calc: { title: L.calc.concT, formula: L.calc.concF, rows: [...kt.map(t => ({ k: t.label, v: f(t.value), n: t.rows })), { k: L.calc.topSum, v: f(ks) }, { k: L.calc.rest, v: pctS(q) }] } });
        }
      } else if (!isSum) {
        add({ id: 'st-lead', act: 'leader', head: L.leaderMean(top.label, f(top.value)), hl: f(top.value), big: { text: f(top.value), label: L.lbl.value }, state: stateOf(top.label),
          calc: { title: L.calc.conT, formula: L.calc.conF, rows: [{ k: top.label, v: f(top.value), n: top.rows }, { k: low.label, v: f(low.value), n: low.rows }] } });
      }
      if (low.value > 0 && top.value / low.value >= 3) {
        const x = top.value / low.value, xt = (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10).toString().replace('.', LANG === 'pt' ? ',' : '.');
        add({ id: 'st-contrast', lowPri: !!P.cases, act: 'contrast', head: L.contrast(top.label, xt, low.label), hl: xt + '×', big: { text: xt + '×', label: L.lbl.ratio }, state: stateOf(low.label),
          calc: { title: L.calc.conT, formula: L.calc.conF, rows: [{ k: top.label, v: f(top.value), n: top.rows }, { k: low.label, v: f(low.value), n: low.rows }, { k: L.calc.ratio, v: xt + '×' }] } });
      }
    }
  }
  // correlação (dispersão): o r do indicador, com a leitura em palavras
  if (b.kind === 'relation' && b.pts) {
    const r = pearson(b.pts); if (r !== null) {
      const a = Math.abs(r), key = (a >= 0.7 ? 's' : a >= 0.4 ? 'm' : 'w') + (r >= 0 ? 'p' : 'n'), rt = r.toFixed(2).replace('.', LANG === 'pt' ? ',' : '.');
      add({ id: 'st-corr', act: 'relation', head: L.corr(b.names.x, b.names.y, rt, L.corrD[key]), hl: rt, big: { text: rt, label: L.lbl.corr }, state: null, calc: { title: L.calc.corT, formula: L.calc.corF, rows: [{ k: L.calc.points, v: fmtInt(b.pts.length, LANG) }, { k: 'r', v: rt }] } });
    }
  }
  // análises extras (só no construtor): quem explica a mudança do período e quem ganhou ou perdeu participação
  if (opt.extras && isSum && b.kind !== 'relation') {
    const mx = storyMatrix(P, sg ? sg.list.map(x => x.label) : null);
    if (mx && mx.periods.length >= 4 && mx.groups.length >= 2) {
      const np = mx.periods.length, w = Math.min(12, Math.floor(np / 2)), sw = (row, a, z) => { let t = 0; for (let i = a; i < z; i++) t += +row[i] || 0; return t; };
      const hd = mx.rows.map(r => sw(r, 0, w)), tl = mx.rows.map(r => sw(r, np - w, np)), H = hd.reduce((a, x) => a + x, 0), Tt = tl.reduce((a, x) => a + x, 0), dT = Tt - H;
      const l1 = `${mx.periods[0]} → ${mx.periods[w - 1]}`, l2 = `${mx.periods[np - w]} → ${mx.periods[np - 1]}`, dec = LANG === 'pt' ? ',' : '.';
      if (H > 0 && Tt > 0 && Math.abs(dT) / H >= 0.05) {
        const up = dT > 0, d = mx.rows.map((_, i) => tl[i] - hd[i]); let gi = -1;
        d.forEach((v, i) => { if ((up ? v > 0 : v < 0) && (gi < 0 || Math.abs(v) > Math.abs(d[gi]))) gi = i; });
        if (gi >= 0) { const p = d[gi] / dT * 100; if (p >= 25) add({ id: 'x-contrib', act: 'contrib', head: L.contrib(mx.groups[gi], pctS(p), up), hl: pctS(p), big: { text: pctS(p), label: L.lbl.ofChange }, state: stateOf(mx.groups[gi]),
          calc: { title: L.calc.contribT, formula: L.calc.contribF, rows: [{ k: `${mx.groups[gi]} · ${l1}`, v: f(hd[gi]) }, { k: `${mx.groups[gi]} · ${l2}`, v: f(tl[gi]) }, { k: `${L.calc.total} · ${l1} → ${l2}`, v: `${f(H)} → ${f(Tt)}` }, { k: L.calc.share, v: pctS(p) }] } }); }
        const sh = mx.rows.map((_, i) => tl[i] / Tt * 100 - hd[i] / H * 100); let si = 0; sh.forEach((v, i) => { if (Math.abs(v) > Math.abs(sh[si])) si = i; });
        if (Math.abs(sh[si]) >= 2) { const ppt = Math.abs(sh[si]).toFixed(1).replace('.', dec) + ' ' + L.lbl.pp, upS = sh[si] > 0;
          add({ id: 'x-shift', act: 'shift', head: L.shift(mx.groups[si], ppt, upS), hl: ppt, big: { text: (upS ? '+' : '−') + ppt, label: L.lbl.ofShare }, state: stateOf(mx.groups[si]),
            calc: { title: L.calc.shiftT, formula: L.calc.shiftF, rows: [{ k: `${mx.groups[si]} · ${L.calc.share0} (${l1})`, v: pctS(hd[si] / H * 100) }, { k: `${mx.groups[si]} · ${L.calc.share1} (${l2})`, v: pctS(tl[si] / Tt * 100) }, { k: L.calc.change, v: (upS ? '+' : '−') + ppt }] } }); }
      }
    }
  }
  // 5) os insights da peça (cada um já traz o cálculo), na ordem em que a pessoa os deixou
  const seen = new Set(), lead = out.filter(x => x.id === 'st-lead' || x.id === 'st-contrast').map(x => x.calc.rows[0].k + '|' + x.calc.rows[0].v);
  (opt.insights || P.insights || []).forEach((ins, k) => {
    const rowsC = (ins.calc && ins.calc.rows) || [], subj = /^(jump|drop)/.test(ins.id) ? (rowsC[1] && rowsC[1].k) : rowsC[0] && rowsC[0].k;
    const big = storyBig(ins), key = subj + '|' + (big ? big.text : '');
    if (seen.has(key)) return; seen.add(key); // o mesmo item com o mesmo número já foi contado
    if (/^(peak|low|outlier|dominant)$/.test(ins.id) && rowsC[0] && lead.includes(rowsC[0].k + '|' + rowsC[0].v)) return; // o líder já ganhou o seu ato
    const bare = big ? big.text.replace(/^[\-−+]/, '') : '', hl = big ? (ins.text.includes(big.text) ? big.text : ins.text.includes(bare) ? bare : '') : ''; // o destaque tem que existir na frase
    add({ id: 'i' + k, act: ins.id, head: ins.text, hl, big, state: stateOf(subj), calc: ins.calc || null, insight: true });
  });
  return out;
}

// tempo curto: fica o panorama e os atos que mais pesam para a decisão escolhida (os insights na ordem da decisão; o líder e a concentração logo depois)
function storyCut(story, cap, decision) {
  if (!story || story.length <= cap) return story;
  const keep = new Set(story.map((s, i) => [storyPri(s, decision), i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, cap).map(x => x[1]));
  return story.filter((s, i) => keep.has(i)).map((s, i) => ({ ...s, kick: { ...s.kick, n: String(i + 1).padStart(2, '0') } }));
}

/* ---------------- construtor de história: respostas viram slides ---------------- */
// prioridade de um fato para a decisão escolhida (menor = mais importante)
function storyPri(s, decision) {
  const ord = (typeof INSIGHT_ORDER !== 'undefined' && INSIGHT_ORDER[decision]) || [], gen = { leader: 1.5, balance: 1.5, relation: 1.5, conc: 2.5, contrast: 3.5, contrib: 1.2, shift: 2.2, c_impact: 0.6, c_cause: 1.0, c_rate: 1.4, c_where: 1.6, c_terms: 2.8 };
  if (s.id === 'st-ov') return -1;
  if (s.lowPri) return 6;
  if (/^c-rate-[1-9]/.test(s.id)) return 3.2; // o resultado principal vale mais que as demais taxas
  if (s.insight) { const k = ord.indexOf(s.act); return k >= 0 ? k : 2; }
  return gen[s.act] ?? 5;
}
// fatos candidatos, o mais indicado para a decisão e a evidência sugerida
function storyCandidates(P, meta, steps) {
  const facts = buildStory(P, meta, steps, { insights: allInsights(P), extras: true }), dec = P.br && P.br.decision, ranked = facts.filter(x => x.id !== 'st-ov').sort((a, b) => storyPri(a, dec) - storyPri(b, dec));
  const cap = { quick: 1, normal: 2, full: 3 }[(P.br && P.br.time) || 'full'];
  return { facts, ranked, center: ranked[0] ? ranked[0].id : null, ev: ranked.slice(1, 1 + cap).map(x => x.id) };
}
// diagnóstico: as "leituras" possíveis são os fatos interpretáveis, com o nome da leitura e o número que a sustenta
function storyReadings(P, facts) {
  const L = STORY_TXT[LANG] || STORY_TXT.pt;
  return facts.filter(x => x.id !== 'st-ov').map(x => ({ id: x.id, label: L.read[x.act] || L.read.other, head: x.head, big: x.big }));
}
// prioridades: critérios disponíveis e a lista ordenada de grupos, sempre com o número que a ordena
function storyPriority(P, crit) {
  const b = P.built, sg = storyGroups(P), L = STORY_TXT[LANG] || STORY_TXT.pt, f = v => fmtNum(v, b.unit, LANG);
  let list = sg ? sg.list.map(x => ({ ...x })) : (!b.xIsTime ? (b.totX || []).filter(t => t.value !== null).map(t => ({ label: t.label, value: t.value, rows: t.rows })) : (b.totS || []).filter(t => t.value !== null).map(t => ({ label: t.label, value: t.value, rows: t.rows })));
  const total = list.reduce((a, t) => a + t.value, 0), mx = storyMatrix(P, list.map(x => x.label)), avail = [];
  if (list.length >= 2) avail.push('top', 'low');
  let growth = false;
  if (mx && mx.periods.length >= 4) {
    const np = mx.periods.length, w = Math.min(12, Math.floor(np / 2)), sw = (r, a, z) => { let t = 0; for (let i = a; i < z; i++) t += +r[i] || 0; return t; };
    mx.groups.forEach((g, i) => { const it = list.find(x => x.label === g); if (!it) return; const h = sw(mx.rows[i], 0, w), t = sw(mx.rows[i], np - w, np); if (h > 0) { it.growth = (t / h - 1) * 100; growth = true; } });
    if (growth) avail.push('growth', 'drop');
  }
  const ok = crit && avail.includes(crit) ? crit : avail[0] || 'top';
  list.forEach(x => { x.share = total > 0 ? x.value / total * 100 : null; });
  const cmp = { top: (a, c) => c.value - a.value, low: (a, c) => a.value - c.value, growth: (a, c) => (c.growth ?? -1e9) - (a.growth ?? -1e9), drop: (a, c) => (a.growth ?? 1e9) - (c.growth ?? 1e9) }[ok];
  if (ok === 'growth' || ok === 'drop') list = list.filter(x => x.growth !== undefined);
  list.sort(cmp);
  return { crit: ok, avail, list, total, f, title: L.crit[ok], formula: L.critF[ok] };
}
// o número que mede cada fato, para o "plano de ação" apontar qual número acompanha a ação
function storyMetrics(P, facts) {
  const L = STORY_TXT[LANG] || STORY_TXT.pt;
  return facts.filter(x => x.big).map(x => ({ id: x.id, text: `${L.read[x.act] || L.read.other}: ${x.big.text} ${x.big.label}`.trim(), value: x.big.text }));
}
// sugestões marcadas como sugestão (nunca como fato): vêm da decisão escolhida e do fato central
function storySuggest(P, center) {
  const dec = (P.br && P.br.decision) || 'prioritize', pt = LANG === 'pt', h = center ? center.head : '';
  const msg = { invest: pt ? 'Onde investir: ' : 'Where to invest: ', cut: pt ? 'O que rever: ' : 'What to review: ', prioritize: pt ? 'O que vem primeiro: ' : 'What comes first: ', alert: pt ? 'Atenção: ' : 'Heads up: ', celebrate: pt ? 'Para comemorar: ' : 'Worth celebrating: ' }[dec] || '';
  const act = { invest: pt ? ['Ampliar o investimento onde há crescimento', 'Testar um piloto antes de escalar'] : ['Expand investment where there is growth', 'Run a pilot before scaling'], cut: pt ? ['Rever o que pesa e não retorna', 'Definir um critério de corte'] : ['Review what weighs and does not pay back', 'Set a cutting criterion'], prioritize: pt ? ['Concentrar o esforço nas primeiras prioridades', 'Definir um responsável por prioridade'] : ['Focus effort on the first priorities', 'Assign an owner per priority'], alert: pt ? ['Investigar a causa do desvio', 'Definir um responsável pela correção'] : ['Investigate the cause of the deviation', 'Assign an owner for the fix'], celebrate: pt ? ['Reconhecer quem puxou o resultado', 'Replicar a prática que funcionou'] : ['Recognize who drove the result', 'Replicate the practice that worked'] }[dec] || [];
  const ask = { invest: pt ? 'Aprovar o investimento nas prioridades apresentadas' : 'Approve investment in the priorities shown', cut: pt ? 'Aprovar a revisão dos itens indicados' : 'Approve the review of the items indicated', prioritize: pt ? 'Aprovar a ordem de prioridades' : 'Approve the order of priorities', alert: pt ? 'Definir quem corrige e até quando' : 'Decide who fixes it and by when', celebrate: pt ? 'Reconhecer o resultado e replicar o que funcionou' : 'Recognize the result and replicate what worked' }[dec] || '';
  const impl = pt ? ['O resultado depende de onde o número se concentra', 'Há um ponto que merece atenção antes dos demais'] : ['The result depends on where the number concentrates', 'There is a point that deserves attention before the others'];
  return { msg: [h ? msg + h : '', h, P.title || ''].filter((x, i, a) => x && a.indexOf(x) === i), act, ask, impl };
}

// o roteiro final: panorama, centro, evidências, diagnóstico, implicações, prioridades, plano e decisão (só o que a pessoa respondeu)
function storyFromAnswers(P, meta, steps) {
  const sb = P.sb; if (!sb) return null;
  const L = STORY_TXT[LANG] || STORY_TXT.pt, facts = buildStory(P, meta, steps, { insights: allInsights(P), extras: true }), by = id => facts.find(x => x.id === id), out = [];
  const add = s => { s.kick = { n: String(out.length + 1).padStart(2, '0'), label: s.kickLabel || L.kick[s.act] || L.kick2[s.act] || L.kick.other }; s.caption = s.head; out.push(s); };
  const { stateOf, manyState } = storyStates(P, meta, steps), seen = new Set();
  const pushFact = id => { const x = by(id); if (x && !seen.has(id)) { seen.add(id); add({ ...x }); } };
  pushFact('st-ov'); if (sb.center) pushFact(sb.center); (sb.ev || []).forEach(pushFact);
  const ev = [sb.center, ...(sb.ev || [])].filter(Boolean).map(by).filter(Boolean);
  const dg = sb.diag || {}, anchor = dg.fact ? by(dg.fact) : null, dText = (dg.text || '').trim();
  if (dText || anchor) {
    const sup = [anchor, ...ev].filter((x, i, a) => x && x.big && a.indexOf(x) === i).slice(0, 4);
    add({ id: 'sb-diag', type: 'diag', act: 'diag', kickLabel: L.kick2.diag, head: dText || anchor.head, big: anchor && anchor.big ? anchor.big : null, hl: dText ? '' : (anchor && anchor.hl) || '', state: (anchor && anchor.state) || (ev[0] && ev[0].state) || null,
      chips: sup.map(x => ({ text: x.big.text, label: x.big.label })), calc: sup.length ? { title: L.diagCalc, formula: sup.map(x => L.read[x.act] || L.read.other).join(' · '), rows: sup.map(x => ({ k: L.read[x.act] || L.read.other, v: `${x.big.text} ${x.big.label}`.trim() })) } : null });
  }
  const impl = (sb.impl || []).map(x => String(x || '').trim()).filter(Boolean).slice(0, 3);
  if (impl.length) add({ id: 'sb-impl', type: 'impl', act: 'impl', kickLabel: L.kick2.impl, head: impl.join(' · '), lines: impl, big: null, state: null, calc: null });
  if (sb.prio && sb.prio.crit) {
    const pr = storyPriority(P, sb.prio.crit), n = Math.max(1, Math.min(5, sb.prio.n || 3)), top = pr.list.slice(0, n);
    if (top.length) add({ id: 'sb-prio', type: 'prio', act: 'prio', kickLabel: L.kick2.prio, head: L.prioH + L.critS[pr.crit], big: null, state: manyState(top.map(x => x.label)),
      rank: top.map((x, i) => ({ n: i + 1, k: x.label, v: pr.crit === 'growth' || pr.crit === 'drop' ? `${csPct(x.growth, LANG)}` : pr.f(x.value), s: x.share != null ? csPct(x.share, LANG) : '' })),
      calc: { title: pr.title, formula: pr.formula, rows: top.map(x => ({ k: x.label, v: pr.crit === 'growth' || pr.crit === 'drop' ? csPct(x.growth, LANG) : pr.f(x.value), n: x.rows })) } });
  }
  const mets = storyMetrics(P, facts), plan = (sb.plan || []).filter(r => r && String(r.a || '').trim()).slice(0, 3);
  if (plan.length) add({ id: 'sb-plan', type: 'plan', act: 'plan', kickLabel: L.kick2.plan, head: plan.map(r => r.a).join(' · '),
    rows: plan.map(r => { const m = mets.find(x => x.id === r.m); return { a: String(r.a).trim(), o: String(r.o || '').trim(), d: String(r.d || '').trim(), m: m ? m.text : '' }; }), big: null, state: null,
    calc: null });
  const ask = (sb.ask || '').trim();
  if (ask) add({ id: 'sb-ask', type: 'ask', act: 'ask', kickLabel: L.kick2.ask, head: ask, big: null, state: null, calc: null });
  return out;
}
