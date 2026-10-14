/* Datavix: conciliação entre abas (portão 53). Quando a pasta tem uma aba Principal (por período e entidade) e uma aba Detalhe (por corrida, jogo…),
 * o Datavix soma ou conta o detalhe por período e entidade e compara com o valor da Principal: "Conferido" quando bate, "Não confere" com a lista dos
 * valores divergentes. Só compara: nunca corrige um número nem escolhe qual das duas abas está certa. Regras (cada uma vale só se a coluna existe):
 *   pontos       soma da coluna Pontos do detalhe
 *   vitórias     contagem de Resultado = 1
 *   pódios       contagem de Resultado de 1 a 3
 *   poles        contagem de Grid = 1
 *   disputados   contagem de linhas em que a entidade tem resultado e não está marcada como "não participou" (coluna de exposição da Principal) */

const NV_WR_ABSENT = /n[aã]o (particip|disput|estre|compet)|ainda n[aã]o|sem particip/i;
const NV_WR_RULES = [
  { id: 'pts', main: /pontos|points|pts/i, col: /^(pontos|points|pts)$/, how: 'sum' },
  { id: 'wins', main: /vit[oó]ria|\bwins?\b|victor/i, col: /^(resultado|result|posicao|position|colocacao)$/, how: 'res1' },
  { id: 'podiums', main: /p[oó]dio|podium/i, col: /^(resultado|result|posicao|position|colocacao)$/, how: 'res3' },
  { id: 'poles', main: /pole/i, col: /^(grid|largada)$/, how: 'grid1' },
  { id: 'starts', main: null, col: /^(resultado|result|posicao|position|colocacao)$/, how: 'starts' },
];
const nvwrNum = x => (typeof x === 'number' && Number.isFinite(x) ? x : typeof x === 'string' && /^[+-]?\d+([.,]\d+)?$/.test(x.trim()) ? +x.replace(',', '.') : null);

function nvWbReconcile(wbx, pk) {
  const dt = nvWbDetail(wbx, pk); if (!dt || !pk || !pk.pd) return null;
  const { M, cols, find, pcol, ents } = dt, E = ents.length, stat = ents.map((_, e) => find(e, /^(situacao|status)$/));
  const agg = new Map(); // período + entidade → totais do detalhe
  const res = ents.map((_, e) => find(e, /^(resultado|result|posicao|position|colocacao)$/)), pts = ents.map((_, e) => find(e, /^(pontos|points|pts)$/)), grid = ents.map((_, e) => find(e, /^(grid|largada)$/));
  M.slice(1).forEach(r => {
    const p = String(r[pcol] == null ? '' : r[pcol]).trim(); if (!p) return;
    ents.forEach((_, e) => {
      const k = p + '\u0001' + e; let a = agg.get(k); if (!a) { a = { pts: 0, wins: 0, podiums: 0, poles: 0, starts: 0 }; agg.set(k, a); }
      const rc = res[e] ? r[res[e].c] : null, st = stat[e] && r[stat[e].c] != null ? String(r[stat[e].c]) : '', played = rc !== null && rc !== undefined && String(rc).trim() !== '' && !NV_WR_ABSENT.test(st);
      if (!played) return; a.starts++;
      const pos = nvwrNum(rc); if (pos === 1) a.wins++; if (pos !== null && pos >= 1 && pos <= 3) a.podiums++;
      if (pts[e]) { const x = nvwrNum(r[pts[e].c]); if (x !== null) a.pts += x; }
      if (grid[e]) { const g = nvwrNum(r[grid[e].c]); if (g === 1) a.poles++; }
    });
  });
  const rows = [], names = [...new Set(pk.pd.flatMap(x => x.m.map(m => m.name)))];
  NV_WR_RULES.forEach(rule => {
    if (!ents.every((_, e) => find(e, rule.col))) return;
    const label = find(0, rule.col).label;
    const targets = rule.id === 'starts' ? (pk.cols && pk.cols.expo ? [pk.cols.expo] : []) : names.filter(n => rule.main.test(n) && !pk.pd.some(x => x.m.some(m => m.name === n && (m.ord || m.rate))));
    targets.forEach(name => {
      let n = 0; const bad = [];
      pk.pd.forEach(x => ents.forEach((_, e) => {
        const mv = rule.id === 'starts' ? x.ex[e] : (x.m.find(m => m.name === name) || { v: [] }).v[e];
        if (mv === null || mv === undefined || !Number.isFinite(mv)) return;
        const a = agg.get(x.p + '\u0001' + e); if (!a) return;
        const dv = rule.id === 'pts' ? a.pts : a[rule.id]; n++; if (Math.abs(dv - mv) > 1e-9) bad.push({ p: x.p, e, main: mv, det: dv });
      }));
      if (n) rows.push({ metric: name, rule: rule.id, label, n, bad });
    });
  });
  if (!rows.length) return null;
  return { sheet: dt.det.name, rows, n: rows.reduce((a, r) => a + r.n, 0), bad: rows.reduce((a, r) => a + r.bad.length, 0), status: rows.some(r => r.bad.length) ? 'diff' : 'ok', ents: ents.slice() };
}

const NVWR_T = {
  pt: {
    ok: (sheet, names, n) => `Conciliação com a aba “${sheet}”: conferido (${names}; ${n} comparações por período e entidade)`, diff: (sheet, bad, n) => `Conciliação com a aba “${sheet}”: não confere em ${bad} de ${n} comparações`,
    line: (metric, p, ent, a, b) => `${metric} ${p}, ${ent}: resumo ${a}, soma dos detalhes ${b}`, more: k => `… e mais ${k} diferenças`,
    ct: 'Conciliação entre abas', cf: 'Soma (ou contagem) da aba Detalhe por período e entidade, comparada com o valor da aba Principal. O Datavix só compara: nunca altera um número nem diz qual aba está certa.',
    how: { pts: l => `soma de “${l}”`, wins: l => `contagem de “${l}” = 1`, podiums: l => `contagem de “${l}” de 1 a 3`, poles: l => `contagem de “${l}” = 1`, starts: l => `contagem de linhas com “${l}”` }, conf: 'conferido', diffs: k => `${k} ${k === 1 ? 'diferença' : 'diferenças'}`, cmp: 'comparações',
  },
  en: {
    ok: (sheet, names, n) => `Reconciliation with the “${sheet}” sheet: matches (${names}; ${n} comparisons by period and entity)`, diff: (sheet, bad, n) => `Reconciliation with the “${sheet}” sheet: does not match in ${bad} of ${n} comparisons`,
    line: (metric, p, ent, a, b) => `${metric} ${p}, ${ent}: summary ${a}, sum of details ${b}`, more: k => `… and ${k} more differences`,
    ct: 'Reconciliation between sheets', cf: 'Sum (or count) of the Detail sheet by period and entity, compared with the value in the Main sheet. Datavix only compares: it never changes a number nor says which sheet is right.',
    how: { pts: l => `sum of “${l}”`, wins: l => `count of “${l}” = 1`, podiums: l => `count of “${l}” from 1 to 3`, poles: l => `count of “${l}” = 1`, starts: l => `count of rows with “${l}”` }, conf: 'matches', diffs: k => `${k} ${k === 1 ? 'difference' : 'differences'}`, cmp: 'comparisons',
  },
};
// texto da conciliação: linhas para os limites e o "ver cálculo"
function nvWbReconText(rc) {
  if (!rc) return null; const X = NVWR_T[LANG] || NVWR_T.pt, f = x => new Intl.NumberFormat(LANG === 'en' ? 'en-US' : 'pt-BR', { maximumFractionDigits: 2 }).format(x);
  const lines = [rc.status === 'ok' ? X.ok(rc.sheet, rc.rows.map(r => r.metric).join(', '), rc.n) : X.diff(rc.sheet, rc.bad, rc.n)];
  const bads = rc.rows.flatMap(r => r.bad.map(b => X.line(r.metric, b.p, rc.ents[b.e], f(b.main), f(b.det))));
  bads.slice(0, 5).forEach(l => lines.push(l)); if (bads.length > 5) lines.push(X.more(bads.length - 5));
  const calc = { title: X.ct, formula: X.cf, rows: rc.rows.map(r => ({ k: `${r.metric} · ${X.how[r.rule](r.label)}`, v: `${r.n} ${X.cmp} · ${r.bad.length ? X.diffs(r.bad.length) : X.conf}` })), base: rc.sheet };
  return { lines, calc, status: rc.status };
}
