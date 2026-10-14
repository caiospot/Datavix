/* Datavix: modelo "Resumo por temporada" (portão 55). Especificação: docs/gate-55-modelos-extras.md.
 * É a leitura "por entidade" da mesma planilha do Face a face: uma linha para cada entidade e período (piloto × temporada, loja × mês), várias medidas.
 * Em vez de comparar quem tem o maior valor, mostra como CADA entidade foi de um período para o outro: uma tabela por entidade (métricas nas linhas,
 * períodos nas colunas, o maior valor de cada métrica marcado), o período de maior valor de todas lado a lado e os limites. Vem de built.vs.pd, o
 * mesmo pacote por períodos do Face a face; nada novo é lido da planilha. "Maior valor" é neutro: o Datavix não diz que é o melhor nem explica a variação. */

const NV_SS_TOP = 3; // métricas citadas na frase
const NV_SS_ROWS = 8; // linhas por tabela (a de exposição conta)
const NV_SS_COLS = 10; // períodos por tabela

// ---------------------------------------------------------------- dados por entidade
function nvSsData(pk) {
  if (!pk || !pk.pd || !pk.ents || pk.pd.length < 3) return null;
  const ents = pk.ents, pd = pk.pd.slice(), meta = new Map(), order = [];
  const yr = p => { const m = /^\s*(\d{4})\b/.exec(String(p)); return m ? +m[1] : null; };
  if (pd.every(x => yr(x.p) !== null)) pd.sort((a, b) => yr(a.p) - yr(b.p)); // anos fora de ordem na planilha: a evolução segue o calendário (a ordenação é estável); rótulos de texto (jan, fev…) ficam na ordem em que aparecem
  pd.forEach(x => x.m.forEach(m => { if (!meta.has(m.name)) { meta.set(m.name, { name: m.name, unit: m.unit || '', ord: !!m.ord, rate: !!m.rate, add: !!m.add }); order.push(m.name); } }));
  const per = ents.map((name, e) => {
    const rows = []; pd.forEach(x => { if (!x.present.includes(e)) return; const v = {}; let any = false; x.m.forEach(m => { const y = m.v[e]; if (y !== null && y !== undefined && Number.isFinite(y)) { v[m.name] = y; any = true; } }); if (any) rows.push({ p: x.p, ex: x.ex[e] === undefined ? null : x.ex[e], v }); });
    const exv = rows.map(r => r.ex).filter(x => x !== null && x > 0), exMax = exv.length ? Math.max(...exv) : 0;
    const partial = exMax ? rows.filter(r => r.ex !== null && r.ex / exMax < NV_VS_PARTIAL).map(r => ({ p: r.p, ex: r.ex })) : []; // menos da metade do maior valor de exposição da própria entidade
    const peaks = {}; order.forEach(nm => { if (!meta.get(nm).add) return; const vals = rows.filter(r => r.v[nm] !== undefined).map(r => ({ p: r.p, v: r.v[nm] })); if (vals.length < 2) return; const top = Math.max(...vals.map(a => a.v)); if (!(top > 0)) return; peaks[nm] = { top, ps: vals.filter(a => a.v === top).map(a => a.p), vals: vals.map(a => a.v) }; });
    return { e, name, rows, exMax, partial, peaks, ok: rows.length >= 3 && Object.keys(peaks).length > 0 };
  });
  return { ents, pd, meta, order, per, expo: (pk.cols && pk.cols.expo) || '', K: pk.periods.length, M: order.length };
}
// a planilha serve ao modelo quando pelo menos uma entidade tem 3 ou mais períodos e uma medida que soma com maior valor positivo
function nvSsEligible(pk) { const D = nvSsData(pk); if (!D) return null; const ok = D.per.filter(p => p.ok); return ok.length ? { K: D.K, M: D.M, E: D.ents.length, ok: ok.length, ents: D.ents.slice() } : null; }

// ---------------------------------------------------------------- texto
Object.assign(NV_CALC, { sspeak: v => ({ x: Math.max(...v.vals) }) });
Object.assign(NV_DEN, { sspeak: v => v.vals.length });
Object.assign(NV_CFG.minSample, { sspeak: 2 });
Object.assign(NV_CLASS, { sspeak: 'sspeak' });

const NVSS = {
  pt: {
    t: { cover: 'Capa', peaks: 'Maior valor de cada métrica', lim: 'Limites e síntese', concl: 'Conclusão' }, metric: 'Métrica', of: 'de', per: s => (s ? 'temporada' : 'período'),
    cover: (ents, K, word, span, M, per, file) => [ents, `${K} ${word}${span ? ` (${span})` : ''}, ${M} ${M === 1 ? 'métrica' : 'métricas'} por ${per}`, file ? `Fonte: ${file}` : ''].filter(Boolean),
    entH: (ent, rng, parts) => `${ent}, ${rng}: ${parts}.`, hl: (i, nm, ps, v) => `${i ? 'de' : 'maior valor de'} ${nm} em ${ps} (${v})`,
    peakCT: 'Maior valor de cada métrica', peakCF: ent => `Para cada métrica que soma, o maior valor entre os períodos de ${ent}; em caso de empate, todos os períodos aparecem.`,
    tabT: s => `Valores por ${s ? 'temporada' : 'período'}`, partNote: (word, expo, items) => `${word} com menos da metade do maior valor de ${expo}: ${items}`, cut: (k, n) => `Mostrando os últimos ${k} de ${n} períodos`, more: k => `+${k} ${k === 1 ? 'métrica' : 'métricas'} na planilha`,
    peaksH: s => `Em que ${s ? 'temporada' : 'período'} cada um teve o maior valor de cada métrica.`, peaksT: 'Período do maior valor, por entidade', peaksCF: 'Para cada métrica que soma, o período em que cada entidade tem o maior valor, com esse valor; em caso de empate, todos os períodos aparecem.',
    limFew: (ent, k, word) => `${ent} tem registro em só ${k} ${word}: sem slide próprio`, limAbs: (ent, ps) => `${ent} não tem registro em ${ps}`, limRoom: names => `Sem slide próprio por falta de espaço: ${names}`,
    limPart: (ent, word, items, expo) => `${ent}: ${word} com menos da metade do maior valor de ${expo}: ${items}`, limOrd: names => `Posições e ordens aparecem na tabela, sem destaque de maior valor: ${names}`,
    limWhy: 'O resumo mostra o que mudou de um período para o outro, não por que mudou', synth: parts => parts, cnt: (ent, k, word) => `${ent}: ${k} ${word}`,
  },
  en: {
    t: { cover: 'Cover', peaks: 'Highest value of each metric', lim: 'Summary and limits', concl: 'Conclusion' }, metric: 'Metric', of: 'of', per: s => (s ? 'season' : 'period'),
    cover: (ents, K, word, span, M, per, file) => [ents, `${K} ${word}${span ? ` (${span})` : ''}, ${M} ${M === 1 ? 'metric' : 'metrics'} per ${per}`, file ? `Source: ${file}` : ''].filter(Boolean),
    entH: (ent, rng, parts) => `${ent}, ${rng}: ${parts}.`, hl: (i, nm, ps, v) => `${i ? 'of' : 'highest value of'} ${nm} in ${ps} (${v})`,
    peakCT: 'Highest value of each metric', peakCF: ent => `For each metric that adds up, the highest value across ${ent}’s periods; if tied, every period is shown.`,
    tabT: s => `Values by ${s ? 'season' : 'period'}`, partNote: (word, expo, items) => `${word} with less than half of the highest ${expo}: ${items}`, cut: (k, n) => `Showing the last ${k} of ${n} periods`, more: k => `+${k} ${k === 1 ? 'metric' : 'metrics'} in the sheet`,
    peaksH: s => `In which ${s ? 'season' : 'period'} each one had the highest value of each metric.`, peaksT: 'Period of the highest value, by entity', peaksCF: 'For each metric that adds up, the period in which each entity has its highest value, with that value; if tied, every period is shown.',
    limFew: (ent, k, word) => `${ent} has a record in only ${k} ${word}: no slide of its own`, limAbs: (ent, ps) => `${ent} has no record in ${ps}`, limRoom: names => `No slide of their own, for lack of room: ${names}`,
    limPart: (ent, word, items, expo) => `${ent}: ${word} with less than half of the highest ${expo}: ${items}`, limOrd: names => `Positions and orders appear in the table, without a highest-value highlight: ${names}`,
    limWhy: 'The summary shows what changed from one period to the next, not why', synth: parts => parts, cnt: (ent, k, word) => `${ent}: ${k} ${word}`,
  },
};
const nvssT = () => NVSS[LANG] || NVSS.pt;
const nvssCap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);

// ---------------------------------------------------------------- slides
function nvPlanSeason(P, N) {
  const b = P && P.built, pk = b && b.vs, D = nvSsData(pk); if (!D || !D.per.some(p => p.ok)) return null;
  const X = nvssT(), V = nvvT(), ents = D.ents, seasonal = NV_VS_SEASON.test(pk.periodName || ''), word = k => V.perWord(seasonal, k), base = `${V.base} · ${ents.join(V.vs)}`;
  const core = [], push = (key, slide, pri) => core.push({ key, slide, pri });
  const okEnts = D.per.filter(p => p.ok);
  // capa
  { const lines = X.cover(V.list(ents), D.K, word(D.K), pk.span, D.M, X.per(seasonal), P.fileName || ''), s = nvXText('ss-cover', 'ctx', X.t.cover, lines); s.head = s.caption = lines.join('. '); push('cover', s, 5); }
  // uma tabela por entidade: métricas nas linhas, períodos nas colunas, o maior valor de cada métrica marcado
  okEnts.forEach(pe => {
    const rows = pe.rows.slice(-NV_SS_COLS), names = D.order.filter(nm => rows.some(r => r.v[nm] !== undefined)), body = [];
    if (D.expo && rows.some(r => r.ex !== null)) body.push([D.expo, ...rows.map(r => (r.ex === null ? '—' : nvXNum(r.ex)))]);
    const ms = names.slice(0, NV_SS_ROWS - body.length);
    ms.forEach(nm => { const mt = D.meta.get(nm), pkk = pe.peaks[nm]; body.push([nm, ...rows.map(r => (r.v[nm] === undefined ? '—' : { t: nvXNum(r.v[nm], mt.unit, nm), hi: !!(pkk && pkk.ps.includes(r.p)) }))]); });
    const hl = D.order.filter(nm => pe.peaks[nm]).slice(0, NV_SS_TOP), rng = `${pe.rows[0].p}–${pe.rows[pe.rows.length - 1].p}`;
    const parts = V.list(hl.map((nm, i) => X.hl(i, nm, V.list(pe.peaks[nm].ps), nvXNum(pe.peaks[nm].top))));
    const f = pe.peaks[hl[0]], big = { text: nvXNum(f.top), label: `${hl[0]} · ${V.list(f.ps)}`.toUpperCase() };
    const calc = { title: X.peakCT, formula: X.peakCF(pe.name), rows: D.order.filter(nm => pe.peaks[nm]).slice(0, 8).map(nm => ({ k: nm, v: `${nvXNum(pe.peaks[nm].top, D.meta.get(nm).unit)} · ${V.list(pe.peaks[nm].ps)}` })), base: `${V.base} · ${pe.name}` };
    const note = pe.partial.length ? X.partNote(nvssCap(word(pe.partial.length)), D.expo, pe.partial.map(a => `${a.p} (${nvXNum(a.ex)} ${X.of} ${nvXNum(pe.exMax)})`).join(', ')) : '';
    const vnote = [pe.rows.length > rows.length ? X.cut(rows.length, pe.rows.length) : '', names.length > ms.length ? X.more(names.length - ms.length) : ''].filter(Boolean).join(' · ');
    const ev = nvEv('sspeak', { vals: f.vals.slice(), top: f.top }, [{ k: 'x', value: f.top, text: nvXNum(f.top) }], { n: f.vals.length, method: 'max', refs: [pe.name, hl[0], ...f.ps] });
    const s = nvvSlide(`ss-ent-${pe.e}`, 'ss_entity', pe.name, { head: X.entH(pe.name, rng, parts), big, calc, note, ev, viz: { kind: 'table', plain: true, title: X.tabT(seasonal), head: [X.metric, ...rows.map(r => r.p)], rows: body, note: vnote } });
    push('ent' + pe.e, s, okEnts.indexOf(pe) === 0 ? 1 : 3 + okEnts.indexOf(pe) / 10); // o primeiro piloto é o último a sair; o resumo de todos vem antes dos demais
  });
  // o período do maior valor de todos, lado a lado
  { const ms = D.order.filter(nm => okEnts.some(p => p.peaks[nm])).slice(0, 8), cell = (p, nm) => (p.ok && p.peaks[nm] ? `${V.list(p.peaks[nm].ps)} · ${nvXNum(p.peaks[nm].top, D.meta.get(nm).unit)}` : '—');
    const calc = { title: X.peakCT, formula: X.peaksCF, rows: ms.slice(0, 6).map(nm => ({ k: nm, v: D.per.filter(p => p.ok && p.peaks[nm]).map(p => `${p.name}: ${nvXNum(p.peaks[nm].top, D.meta.get(nm).unit)} (${V.list(p.peaks[nm].ps)})`).join(' · ') })), base };
    push('peaks', nvvSlide('ss-peaks', 'ss_peaks', X.t.peaks, { head: X.peaksH(seasonal), calc, viz: { kind: 'table', plain: true, title: X.peaksT, head: [X.metric, ...ents], rows: ms.map(nm => [nm, ...D.per.map(p => cell(p, nm))]), note: '' } }), 2); }
  // limites e síntese: o texto é refeito depois do ajuste ao tamanho
  const lim = nvXText('ss-limits', 'synthesis', X.t.lim, [X.synth('')]); push('limits', lim, -1);
  const keep = N <= 2 ? [core.find(x => x.key === 'peaks'), core.find(x => x.key === 'limits')].filter(Boolean) : nvXFit(P, core, N);
  { const L = [], n = pk.notes || {}, shown = new Set(keep.map(x => x.key));
    L.push(X.synth(D.per.filter(p => p.rows.length).map(p => X.cnt(p.name, p.rows.length, word(p.rows.length))).join(' · ')));
    D.per.forEach(p => { if (p.rows.length && !p.ok) L.push(X.limFew(p.name, p.rows.length, word(p.rows.length))); });
    ents.forEach((en, e) => { const ps = [...new Set(pk.absent.filter(a => a.e === e).map(a => a.p))]; if (ps.length) L.push(X.limAbs(en, V.list(ps))); });
    const lost = okEnts.filter(p => !shown.has('ent' + p.e)).map(p => p.name); if (lost.length) L.push(X.limRoom(V.list(lost)));
    okEnts.forEach(p => { if (p.partial.length) L.push(X.limPart(p.name, word(p.partial.length), p.partial.map(a => `${a.p} (${nvXNum(a.ex)} ${X.of} ${nvXNum(p.exMax)})`).join(', '), D.expo)); });
    const rcx = nvWbReconText(nvWbReconcile(b.wbx, pk)); if (rcx) L.push(...rcx.lines);
    nvWbDerive(b.wbx).caveats.forEach(c => L.push(c.k ? `${c.k}: ${c.t}` : c.t));
    if (n.ord && n.ord.length) L.push(X.limOrd(n.ord.join(', '))); if (n.lower && n.lower.length) L.push(V.limLower(n.lower.join(', '))); if (n.dropped && n.dropped.length) L.push(V.limDrop(n.dropped.join(', ')));
    L.push(X.limWhy, V.limRange);
    lim.lines = L; lim.head = lim.caption = L.join('. '); if (rcx) lim.calc = rcx.calc; }
  return nvXFinish(P, N, 'season', keep, core, nvXConcl(X.t.concl));
}
