/* Datavix: a história dos números. Cada slide é um "ato": uma frase que conta o achado, o número que o prova, o cálculo à vista
 * e o destaque no gráfico. Tudo vem de cálculos sobre os dados (totais por grupo, participações, razões e os insights da peça);
 * nenhuma frase afirma algo que não tenha o cálculo ao lado. */
const STORY_TXT = {
  pt: {
    kick: { overview: 'O panorama', leader: 'O líder', balance: 'O equilíbrio', conc: 'A concentração', contrast: 'O contraste', relation: 'A relação', peak: 'O pico', low: 'O vale', jump_up: 'A virada', drop: 'A queda', trend_up: 'A tendência', trend_down: 'A tendência', dominant: 'O domínio', outlier: 'O ponto fora da curva', flow_conv: 'A conversão', flow_drop: 'O gargalo', flow_path: 'O caminho', ridge_cmp: 'A comparação', other: 'O destaque' },
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
    lbl: { total: 'do total', top: k => `nos ${k} maiores`, ratio: 'líder ÷ menor', corr: 'correlação (r)', value: 'valor', records: 'registros' },
    calc: {
      ovT: 'Total e contagem', ovF: 'Soma do valor em todos os registros; grupos distintos do eixo.', total: 'Total', groups: 'Grupos', mean: 'Média por grupo',
      leadT: 'Participação do líder', leadF: 'Valor do líder ÷ soma de todos os grupos.', share: 'Participação',
      concT: 'Concentração nos maiores', concF: 'Soma dos maiores ÷ soma de todos os grupos.', topSum: 'Soma dos maiores', rest: 'Demais grupos',
      conT: 'Razão entre extremos', conF: 'Maior valor ÷ menor valor.', ratio: 'Razão',
      corT: 'Correlação de Pearson', corF: 'Covariância dos dois valores ÷ produto dos desvios (−1 a 1). Forte: |r| ≥ 0,7; moderada: ≥ 0,4.', points: 'Pontos',
    },
  },
  en: {
    kick: { overview: 'The big picture', leader: 'The leader', balance: 'The balance', conc: 'The concentration', contrast: 'The contrast', relation: 'The relationship', peak: 'The peak', low: 'The low', jump_up: 'The turn', drop: 'The drop', trend_up: 'The trend', trend_down: 'The trend', dominant: 'The dominance', outlier: 'The outlier', flow_conv: 'The conversion', flow_drop: 'The bottleneck', flow_path: 'The path', ridge_cmp: 'The comparison', other: 'The highlight' },
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
    lbl: { total: 'of the total', top: k => `in the top ${k}`, ratio: 'leader ÷ smallest', corr: 'correlation (r)', value: 'value', records: 'records' },
    calc: {
      ovT: 'Total and count', ovF: 'Sum of the value over all records; distinct groups on the axis.', total: 'Total', groups: 'Groups', mean: 'Mean per group',
      leadT: "Leader's share", leadF: "Leader's value ÷ sum of all groups.", share: 'Share',
      concT: 'Concentration in the largest', concF: 'Sum of the largest ÷ sum of all groups.', topSum: 'Sum of the largest', rest: 'Other groups',
      conT: 'Ratio between extremes', conF: 'Largest value ÷ smallest value.', ratio: 'Ratio',
      corT: 'Pearson correlation', corF: 'Covariance of the two values ÷ product of the deviations (−1 to 1). Strong: |r| ≥ 0.7; moderate: ≥ 0.4.', points: 'Points',
    },
  },
};

// número do slide: o primeiro "%" do cálculo (variação ou participação); senão, a primeira linha
function storyBig(ins) {
  const rows = (ins.calc && ins.calc.rows) || [], pr = rows.filter(r => /%/.test(String(r.v)));
  const r = pr.length ? pr[pr.length - 1] : rows[0]; return r ? { text: String(r.v), label: String(r.k) } : null;
}

function buildStory(P, meta, steps) {
  const L = STORY_TXT[LANG] || STORY_TXT.pt, b = P.built, tot = (b.totX || []).filter(t => t.value !== null), n = tot.length, f = v => fmtNum(v, b.unit, LANG);
  const isSum = b.aggKind !== 'mean', pctS = x => csPct(x, LANG), rows = (b.stats && (b.stats.rowsUsed || b.stats.rowsTotal)) || 0, rowsTxt = fmtInt(rows, LANG);
  let hero = null; try { hero = kpiCards(b, LANG, T)[0] || null; } catch (e) { /* sem indicador */ }
  const labels = meta && meta.filterLabels ? meta.filterLabels : [];
  // destaque no gráfico: um passo existente para o rótulo, ou o filtro direto nos gráficos de Vizzu
  const stepFor = lab => steps.find(s => s.state && s.caption && String(s.caption).startsWith(lab) && !/^i\d/.test(s.id));
  const viz = !isCsType(P.type), stateOf = lab => { if (!lab) return null; const s = stepFor(String(lab)); if (s) return s.state; return viz && labels.includes(lab) ? { sel: [lab] } : null; };
  // vários grupos de uma vez: filtro nos de Vizzu; nos de canvas, só quando cada grupo tem um passo com a lista de grupos (ex.: Leque)
  const manyState = labs => { if (viz) return labels.length && labs.every(l => labels.includes(l)) ? { sel: labs.slice() } : null; const sts = labs.map(stateOf); return sts.every(x => x && x.cs && Array.isArray(x.cs.cats)) ? { cs: { cats: sts.flatMap(x => x.cs.cats) } } : null; };
  const out = []; const add = s => { s.kick = { n: String(out.length + 1).padStart(2, '0'), label: L.kick[s.act] || L.kick.other }; s.caption = s.head; out.push(s); };

  // 1) panorama
  if (b.kind === 'relation' && b.pts) {
    add({ id: 'st-ov', act: 'overview', head: L.ovRel(fmtInt(b.pts.length, LANG), b.names.x, b.names.y), big: hero ? { text: kpiFmt(hero), label: hero.label } : null, state: null,
      calc: { title: L.calc.ovT, formula: L.calc.ovF, rows: [{ k: L.calc.points, v: fmtInt(b.pts.length, LANG), n: rows }] } });
  } else if (n) {
    const sum = tot.reduce((a, t) => a + t.value, 0), mean = sum / n, totTxt = hero ? kpiFmt(hero) : f(sum);
    const head = !isSum ? L.ovMean(rowsTxt, fmtInt(n, LANG), b.names.x) : b.xIsTime ? L.ovTime(rowsTxt, totTxt, tot[0].label, tot[n - 1].label) : L.ovSum(rowsTxt, totTxt, fmtInt(n, LANG), b.names.x);
    add({ id: 'st-ov', act: 'overview', head, hl: isSum ? totTxt : '', big: hero ? { text: kpiFmt(hero), label: hero.label } : null, state: null,
      calc: { title: L.calc.ovT, formula: L.calc.ovF, rows: [{ k: L.calc.total, v: isSum ? f(sum) : totTxt, n: rows }, { k: L.calc.groups, v: fmtInt(n, LANG) }, { k: L.calc.mean, v: f(mean) }] } });
    // 2) o líder e 3) a concentração, 4) o contraste: só para grupos (não para tempo)
    if (!b.xIsTime && n >= 3) {
      const srt = tot.slice().sort((x, y) => y.value - x.value), top = srt[0], low = srt[n - 1];
      if (isSum && sum > 0) {
        const share = top.value / sum * 100, balanced = share <= 125 / n;
        add({ id: 'st-lead', act: balanced ? 'balance' : 'leader', head: balanced ? L.balance(top.label, pctS(share)) : L.leader(top.label, f(top.value), pctS(share)), hl: pctS(share), big: { text: pctS(share), label: L.lbl.total }, state: stateOf(top.label),
          calc: { title: L.calc.leadT, formula: L.calc.leadF, rows: [{ k: top.label, v: f(top.value), n: top.rows }, { k: L.calc.total, v: f(sum) }, { k: L.calc.share, v: pctS(share) }] } });
        if (n >= 6) {
          const k = 3, kt = srt.slice(0, k), ks = kt.reduce((a, t) => a + t.value, 0), p = ks / sum * 100, rest = n - k, q = 100 - p;
          add({ id: 'st-conc', act: 'conc', head: L.conc(k, pctS(p), rest, pctS(q)), hl: pctS(p), big: { text: pctS(p), label: L.lbl.top(k) }, state: manyState(kt.map(t => t.label)),
            calc: { title: L.calc.concT, formula: L.calc.concF, rows: [...kt.map(t => ({ k: t.label, v: f(t.value), n: t.rows })), { k: L.calc.topSum, v: f(ks) }, { k: L.calc.rest, v: pctS(q) }] } });
        }
      } else if (!isSum) {
        add({ id: 'st-lead', act: 'leader', head: L.leaderMean(top.label, f(top.value)), hl: f(top.value), big: { text: f(top.value), label: L.lbl.value }, state: stateOf(top.label),
          calc: { title: L.calc.conT, formula: L.calc.conF, rows: [{ k: top.label, v: f(top.value), n: top.rows }, { k: low.label, v: f(low.value), n: low.rows }] } });
      }
      if (low.value > 0 && top.value / low.value >= 3) {
        const x = top.value / low.value, xt = (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10).toString().replace('.', LANG === 'pt' ? ',' : '.');
        add({ id: 'st-contrast', act: 'contrast', head: L.contrast(top.label, xt, low.label), hl: xt + '×', big: { text: xt + '×', label: L.lbl.ratio }, state: stateOf(low.label),
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
  // 5) os insights da peça (cada um já traz o cálculo), na ordem em que a pessoa os deixou
  const seen = new Set(), lead = out.filter(x => x.id === 'st-lead' || x.id === 'st-contrast').map(x => x.calc.rows[0].k + '|' + x.calc.rows[0].v);
  (P.insights || []).forEach((ins, k) => {
    const rowsC = (ins.calc && ins.calc.rows) || [], subj = /^(jump|drop)/.test(ins.id) ? (rowsC[1] && rowsC[1].k) : rowsC[0] && rowsC[0].k;
    const big = storyBig(ins), key = subj + '|' + (big ? big.text : '');
    if (seen.has(key)) return; seen.add(key); // o mesmo item com o mesmo número já foi contado
    if (/^(peak|low|outlier|dominant)$/.test(ins.id) && rowsC[0] && lead.includes(rowsC[0].k + '|' + rowsC[0].v)) return; // o líder já ganhou o seu ato
    const bare = big ? big.text.replace(/^[\-−+]/, '') : '', hl = big ? (ins.text.includes(big.text) ? big.text : ins.text.includes(bare) ? bare : '') : ''; // o destaque tem que existir na frase
    add({ id: 'i' + k, act: ins.id, head: ins.text, hl, big, state: stateOf(subj), calc: ins.calc || null, insight: true });
  });
  return out;
}
