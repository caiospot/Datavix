/* Datavix: tela "Como li a sua planilha". Mostra o papel que o app deu a cada coluna (categoria, sim/não, número, data, identificador,
 * dado pessoal, texto livre), o tipo da planilha (o que é cada linha) e rótulos parecidos que podem ser unificados.
 * A pessoa corrige o que quiser; nada aqui muda um número da planilha. */
const RDX = {
  pt: {
    lbl: 'LEITURA', h: ['COMO LI A', 'sua planilha'], p: 'Antes de montar os gráficos, veja o que entendi de cada coluna. Corrija o que estiver errado: os gráficos e a história partem daqui.',
    shapeH: 'O que é cada linha?', why: 'Li assim porque', shapes: {
      cases: ['Casos ou respostas', 'Cada linha é um atendimento, uma resposta ou um registro. O Datavix conta linhas e calcula taxas, sem somar nada.'],
      ledger: ['Valores', 'Cada linha traz um valor para somar (vendas, custos, quantidades).'],
      summary: ['Resumo já somado', 'A planilha já traz totais por grupo ou período.']
    },
    conf: { alta: 'confiança alta', 'média': 'confiança média', baixa: 'confiança baixa' },
    secH: 'Colunas', groups: { pii: 'Dados pessoais', id: 'Identificadores', text: 'Texto livre', flag: 'Sim ou não', category: 'Categorias', geo: 'Lugares', date: 'Datas', measure: 'Números', empty: 'Vazias ou com um só valor' },
    gnote: { pii: 'Ficam de fora dos gráficos e da apresentação. Você pode liberar uma coluna se quiser.', id: 'Servem para identificar uma linha, nunca para somar ou agrupar.', text: 'Comentários e descrições: aparecem nos detalhes, não nos gráficos.', flag: 'Respostas que se leem como sim ou não: viram taxas.', measure: 'Somo valores e quantidades; para notas e taxas, uso a média.', empty: 'Sem informação útil para os gráficos.' },
    roles: { category: 'Categoria', flag: 'Sim ou não', measure: 'Número', date: 'Data', id: 'Identificador', text: 'Texto livre', pii: 'Dado pessoal', ignore: 'Ignorar', geo: 'Lugar', empty: 'Vazia', constant: 'Um só valor' },
    mt: { score: 'nota (uso a média)', attr: 'taxa ou atributo (uso a média)', duration: 'duração (uso a média)', count: 'quantidade (somo)', amount: 'valor (somo)' },
    vals: n => `${n} valores distintos`, rowsOf: (a, b) => `${a} de ${b} linhas preenchidas`,
    mergeH: 'Rótulos parecidos', mergeP: 'Estes rótulos parecem ser a mesma coisa escrita de formas diferentes. Unificar muda só o agrupamento, nunca os números da planilha.', mergeSame: 'mesmo texto com pequenas diferenças', mergeFlag: 'mesma resposta, escritas diferentes (você decide)', rows: n => `${n} linhas`,
    wh: { flags: n => `${n} colunas de sim/não`, texts: n => `${n} colunas de texto livre`, amounts: () => 'há valores para somar', numbers: () => 'há números para agregar', few: () => 'poucos números e categorias' }, open: 'ver colunas',
    next: 'Continuar', back: 'Voltar', noMerge: 'Não encontrei rótulos parecidos.', hidden: 'fora dos gráficos', use: 'Usar esta coluna', skipped: n => `${n} coluna(s) de fora`,
    fv: { pos: 'conta como SIM', neg: 'conta como NÃO', na: 'fora da conta' }, fvH: 'Como contei cada resposta',
    sum: (nc, nu) => `${nc} colunas lidas, ${nu} em uso nos gráficos.`
  },
  en: {
    lbl: 'READING', h: ['HOW I READ', 'your spreadsheet'], p: 'Before building charts, see what I understood about each column. Fix anything that is wrong: charts and the story start here.',
    shapeH: 'What is each row?', why: 'I read it this way because', shapes: {
      cases: ['Cases or answers', 'Each row is a ticket, an answer or a record. Datavix counts rows and computes rates, without summing anything.'],
      ledger: ['Values', 'Each row carries a value to sum (sales, costs, quantities).'],
      summary: ['Already summed', 'The sheet already has totals per group or period.']
    },
    conf: { alta: 'high confidence', 'média': 'medium confidence', baixa: 'low confidence' },
    secH: 'Columns', groups: { pii: 'Personal data', id: 'Identifiers', text: 'Free text', flag: 'Yes or no', category: 'Categories', geo: 'Places', date: 'Dates', measure: 'Numbers', empty: 'Empty or single-valued' },
    gnote: { pii: 'Kept out of charts and the presentation. You can release a column if you want.', id: 'They identify a row, never to be summed or grouped.', text: 'Comments and descriptions: shown in details, not in charts.', flag: 'Answers read as yes or no: they become rates.', measure: 'I sum amounts and quantities; for scores and rates I use the mean.', empty: 'No useful information for charts.' },
    roles: { category: 'Category', flag: 'Yes or no', measure: 'Number', date: 'Date', id: 'Identifier', text: 'Free text', pii: 'Personal data', ignore: 'Ignore', geo: 'Place', empty: 'Empty', constant: 'Single value' },
    mt: { score: 'score (I use the mean)', attr: 'rate or attribute (I use the mean)', duration: 'duration (I use the mean)', count: 'quantity (I sum)', amount: 'amount (I sum)' },
    vals: n => `${n} distinct values`, rowsOf: (a, b) => `${a} of ${b} rows filled`,
    mergeH: 'Similar labels', mergeP: 'These labels look like the same thing written in different ways. Merging only changes grouping, never the numbers in your sheet.', mergeSame: 'same text with small differences', mergeFlag: 'same answer, different wording (you decide)', rows: n => `${n} rows`,
    wh: { flags: n => `${n} yes/no columns`, texts: n => `${n} free-text columns`, amounts: () => 'there are amounts to sum', numbers: () => 'there are numbers to aggregate', few: () => 'few numbers and categories' }, open: 'show columns',
    next: 'Continue', back: 'Back', noMerge: 'I found no similar labels.', hidden: 'kept out of charts', use: 'Use this column', skipped: n => `${n} column(s) left out`,
    fv: { pos: 'counts as YES', neg: 'counts as NO', na: 'left out' }, fvH: 'How I counted each answer',
    sum: (nc, nu) => `${nc} columns read, ${nu} used in charts.`
  }
};
const RX = () => RDX[LANG === 'en' ? 'en' : 'pt'];
const RD_ORDER = ['pii', 'id', 'text', 'flag', 'category', 'geo', 'date', 'measure', 'empty'];
const rdGroup = c => (c.role === 'constant' ? 'empty' : c.role);
const rdMask = v => String(v).split(/\s+/).map(w => (w.length <= 1 ? w : w[0] + '•'.repeat(Math.min(5, w.length - 1)))).join(' ');

// sugestões de unificação de rótulos para toda a planilha (calculadas uma vez por leitura)
function rdSuggest(ds) {
  const out = [];
  ds.columns.forEach((c, ci) => uMergeSuggestions(c).forEach(m => out.push({ col: ci, kind: m.kind, keep: m.keep, from: m.from, rows: m.rows, on: m.kind === 'same' })));
  return out;
}
function rdStart(ds, keep) {
  const prev = keep && S.read ? S.read : null, ov = {};
  if (prev && prev.over) Object.assign(ov, prev.over);
  const r = understandSheet(ds);
  ds.columns.forEach(c => { const o = ov[c.name]; if (o) rdSetRole(c, o, true); });
  r.over = ov; r.sug = rdSuggest(ds); ds.columns.shape = r.shape; S.read = r;
}
function rdRetype() { uRetypes(S.ds, S._rt || (S._rt = new Set())).forEach(r => getWorker().postMessage({ type: 'retype', col: r.col, kind: r.kind, units: r.units })); }
function rdSetRole(c, role, quiet) {
  if (role === 'ignore') { c.use = false; return; }
  c.use = true;
  if (role === 'pii') { c.role = 'pii'; c.hide = true; return; }
  c.hide = false; c.role = role;
  if (role === 'flag' && c.dict) { c.flagMap = {}; c.dict.forEach(v => { c.flagMap[v] = uFlagClass(v) || 'other'; }); }
  if (role === 'measure') { c.mtype = c.mtype || 'amount'; c.agg = c.agg || 'sum'; }
}
function rdRoleOptions(c) {
  if (c.kind === 'number') return ['measure', 'id', 'pii', 'ignore'];
  if (c.kind === 'date') return ['date', 'ignore'];
  if (c.kind === 'text') return ['text', 'pii', 'ignore'];
  return ['category', 'flag', 'id', 'text', 'pii', 'ignore'];
}
function rdSample(c) {
  const mask = c.role === 'pii';
  let vals = [];
  if (c.dict) vals = c.dict.slice(0, 3); else if (c.texts) vals = c.texts.filter(Boolean).slice(0, 3);
  else if (c.kind === 'number') return `${fmtNum(c.min, c.unit, LANG)} – ${fmtNum(c.max, c.unit, LANG)}`;
  else if (c.kind === 'date') return `${bucketLabel(c.min, 'day', LANG)} – ${bucketLabel(c.max, 'day', LANG)}`;
  return vals.map(v => { const s = String(v).slice(0, 38) + (String(v).length > 38 ? '…' : ''); return mask ? rdMask(s) : s; }).join(' · ');
}
// sim/não: como cada resposta entra na taxa (a pessoa corrige o que o app leu errado)
function rdFlagVals(c, i) {
  const t = RX(), cnt = new Array(c.dict.length).fill(0); for (let k = 0; k < c.codes.length; k++) if (c.codes[k] >= 0) cnt[c.codes[k]]++;
  const cls = v => (c.flagMap[v] === 'pos' || c.flagMap[v] === 'neg' ? c.flagMap[v] : 'na');
  return `<div class="rd-fv"><span class="note">${esc(t.fvH)}</span>${c.dict.map((v, k) => `<label class="rd-fi"><span>${esc(String(v).slice(0, 44))} <i>${fmtInt(cnt[k], LANG)}</i></span><select class="rd-sel" data-c="rd-flagval" data-i="${i}" data-k="${k}" aria-label="${esc(String(v))}">${['pos', 'neg', 'na'].map(o => `<option value="${o}" ${cls(v) === o ? 'selected' : ''}>${esc(t.fv[o])}</option>`).join('')}</select></label>`).join('')}</div>`;
}
function rdRow(c, i) {
  const t = RX(), cur = c.use === false ? 'ignore' : c.role === 'constant' || c.role === 'empty' ? null : c.role === 'geo' ? 'category' : c.role;
  const opts = rdRoleOptions(c), off = c.use === false || c.role === 'pii';
  const extra = c.role === 'measure' && c.mtype ? `<span class="rd-mt">${esc(t.mt[c.mtype])}</span>` : c.dict ? `<span class="rd-mt">${esc(t.vals(fmtInt(c.dict.length, LANG)))}</span>` : '';
  const sel = cur === null ? `<span class="rd-tag">${esc(t.roles[c.role])}</span>` : `<select class="rd-sel" data-c="rd-role" data-i="${i}" aria-label="${esc(t.roles[cur] || '')}: ${esc(c.name)}">${opts.map(o => `<option value="${o}" ${cur === o ? 'selected' : ''}>${esc(t.roles[o])}</option>`).join('')}</select>`;
  const fv = c.role === 'flag' && c.use !== false && c.dict && c.flagMap && c.dict.length <= 8 ? rdFlagVals(c, i) : '';
  return `<div class="rd-row ${off ? 'off' : ''}"><div class="rd-main"><b>${esc(c.name)}</b>${extra}</div><div class="rd-smp">${esc(rdSample(c))}${c.role === 'pii' ? ` <i>(${esc(t.hidden)})</i>` : ''}</div>${sel}${fv}</div>`;
}
function readScreen() {
  const t = RX(), ds = S.ds, cols = ds.columns, rd = S.read; if (!rd) return '';
  const used = cols.filter(c => colUsable(c) && c.role !== 'id').length;
  const sh = ['cases', 'ledger', 'summary'].map(k => `<button type="button" class="rd-sh" data-a="rd-shape" data-v="${k}" aria-pressed="${rd.shape === k}"><b>${esc(t.shapes[k][0])}</b><span>${esc(t.shapes[k][1])}</span></button>`).join('');
  const why = rd.shape === rd.auto && rd.why && rd.why.length ? `<p class="note rd-why">${esc(t.why)}: ${esc(rd.why.map(([k, n]) => t.wh[k](n)).join('; '))} (${esc(t.conf[rd.conf])}).</p>` : '';
  const groups = RD_ORDER.map(g => {
    const list = cols.map((c, i) => [c, i]).filter(([c]) => rdGroup(c) === g);
    if (!list.length) return '';
    const head = `<div class="rd-gh"><span class="lbl">[ ${esc(t.groups[g])} · ${list.length} ]</span>${t.gnote[g] ? `<span class="note">${esc(t.gnote[g])}</span>` : ''}</div>`, rows = list.map(([c, i]) => rdRow(c, i)).join('');
    return list.length > 6 && (g === 'text' || g === 'empty') ? `<details class="rd-grp" data-g="${g}"><summary>${head}</summary>${rows}</details>` : `<section class="rd-grp" data-g="${g}">${head}${rows}</section>`;
  }).join('');
  const sug = rd.sug || [];
  const merge = sug.length ? `<div class="rd-merge"><div class="lbl">[ ${esc(t.mergeH)} ]</div><p class="note" style="margin:6px 0 12px">${esc(t.mergeP)}</p>${sug.map((m, k) => `<label class="rd-mi"><input type="checkbox" data-c="rd-merge" data-k="${k}" ${m.on ? 'checked' : ''}><span><b>${esc(cols[m.col].name.replace(/[:\s]+$/, ""))}</b>: ${m.from.map(f => `“${esc(f)}”`).join(', ')} → “${esc(m.keep)}” <i>${esc(t.rows(fmtInt(m.rows, LANG)))} · ${esc(m.kind === 'same' ? t.mergeSame : t.mergeFlag)}</i></span></label>`).join('')}</div>` : '';
  return `<div class="wrap-narrow" style="max-width:860px">
    <div class="lbl">[ ${T('step')} // ${String(OB.length + 3).padStart(2, '0')} ]</div><h2 style="margin-top:12px">${title2(t.h)}</h2><p class="sub">${esc(t.p)}</p>
    <div class="rd-shapes"><div class="lbl">[ ${esc(t.shapeH)} ]</div><div class="rd-shl" role="group">${sh}</div>${why}</div>
    <div class="rd-cols"><div class="lbl" style="margin-bottom:10px">[ ${esc(t.secH)} ] <span class="note">${esc(t.sum(cols.length, used))}</span></div>${groups}</div>
    ${merge}
    <div class="row" style="margin-top:30px"><button class="btn ghost" data-a="back-to" data-v="preview">← ${esc(t.back)}</button><button class="btn" data-a="to-mapping">${esc(t.next)} →</button></div></div>`;
}
// aplica as unificações marcadas (só reescreve o agrupamento das colunas)
function rdApply() {
  const rd = S.read, by = {};
  (rd.sug || []).filter(m => m.on).forEach(m => { (by[m.col] = by[m.col] || []).push(m); });
  Object.keys(by).forEach(ci => { const c = S.ds.columns[ci]; uApplyMerges(c, by[ci]); if (c.role === 'flag') { const old = c.flagMap || {}; c.flagMap = {}; c.dict.forEach(v => { c.flagMap[v] = old[v] || uFlagClass(v) || 'other'; }); } });
  rd.sug = []; rd.merged = Object.keys(by).length;
}
function readContinue() { rdApply(); S.ds.columns.shape = S.read.shape; S.mapping = defaultMapping(); go('mapping'); }
function readClick(e) {
  const t = e.target.closest('[data-a]'); if (!t) return; const a = t.dataset.a;
  if (a === 'rd-shape') { e.stopPropagation(); S.read.shape = t.dataset.v; S.ds.columns.shape = S.read.shape; render(); }
  else if (a === 'to-mapping' && S.step === 'read') { e.stopPropagation(); readContinue(); }
}
function readInput(e) {
  const t = e.target, c = t.dataset && t.dataset.c; if (!S.read || !c || c.indexOf('rd-') !== 0) return;
  if (c === 'rd-role') { const col = S.ds.columns[+t.dataset.i]; rdSetRole(col, t.value); S.read.over[col.name] = t.value; S.read.sug = rdSuggest(S.ds); render(); }
  else if (c === 'rd-flagval') { const col = S.ds.columns[+t.dataset.i]; col.flagMap[col.dict[+t.dataset.k]] = t.value; render(); }
  else if (c === 'rd-merge') { S.read.sug[+t.dataset.k].on = t.checked; }
}
document.addEventListener('click', readClick, true);
document.addEventListener('change', readInput, true);
