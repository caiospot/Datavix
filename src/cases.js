/* Datavix: análise de casos e pesquisas. Quando cada linha é um caso ou uma resposta, os números que contam a história são taxas
 * (sim ÷ sim + não, só entre respostas válidas), o impacto de um resultado sobre outro, onde o resultado varia e as respostas e termos mais citados.
 * Tudo vem de contagens das linhas; o resultado guarda só números e rótulos (P.cases) e a frase é montada na hora, no idioma da tela. */
const CS_OUT = /solucion|resolv|solved|sucesso|success|efic|atingi|conclu/i;
const CS_CAUSE = /causa|motivo|reason|cause|raz[aã]o|\bdor\b|pain|problema|issue/i;
const CS_TEXT = /voz|coment|comment|feedback|relato|d[oó]r|descri|detalh|diagn|causa|a[cç][aã]o|observa/i;
const CS_STOP = new Set(('para com uma uns umas como mais mas pela pelo pelas pelos sobre entre quando onde porque que foi foram esta este isso essa esse ainda tambem apos cada seus suas dele dela eles elas muito sido sendo tinha tinham dos das nos nas num numa ser estar fazer feito fez havia nao sim seu sua pois tem tendo ter nessa nesse nesta neste esses essas depois antes sem ate aos estou estamos estao tenho temos tive fiz fica ficou ficam quer quero disse falou porem entao assim vai vou fosse sendo tambem pode podem deve devem foi eram era esta estao estava estavam desde aqui ali alem outro outra outros outras mesmo mesma ja so quanto qual quais ' +
  'with that this have from were been they their there which would about will your what when more also than then into only some such other after before were while them these those over under because between during being does done make made very just like each both without within').split(' '));
const csKey = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function csFlagInfo(ds) {
  const n = ds.rowCount, out = [];
  ds.columns.forEach((c, ci) => {
    if (c.role !== 'flag' || c.use === false || !c.codes || !c.flagMap) return;
    const map = c.dict.map(v => (c.flagMap[v] === 'pos' ? 1 : c.flagMap[v] === 'neg' ? 0 : 2)), cls = new Int8Array(n);
    let pos = 0, neg = 0, other = 0, blank = 0;
    for (let i = 0; i < n; i++) { const k = c.codes[i]; const v = k < 0 ? -1 : map[k]; cls[i] = v; if (v === 1) pos++; else if (v === 0) neg++; else if (v === 2) other++; else blank++; }
    out.push({ ci, name: c.name, cls, pos, neg, other, blank, valid: pos + neg });
  });
  return out;
}
const csRate = (a, b) => (a + b ? a / (a + b) * 100 : null);

function casesAnalyze(ds) {
  const n = ds.rowCount, cols = ds.columns, flags = csFlagInfo(ds).filter(f => f.valid >= 10), terms = casesTerms(ds);
  if (!flags.length) return terms.length ? { n, outcome: null, facts: terms } : null;
  const out = flags.slice().sort((a, b) => (CS_OUT.test(b.name) - CS_OUT.test(a.name)) || b.valid - a.valid)[0];
  const rateOf = f => ({ k: 'rate', name: f.name, pos: f.pos, neg: f.neg, other: f.other, blank: f.blank, n });
  const rates = [out, ...flags.filter(f => f !== out).sort((a, b) => b.valid - a.valid).slice(0, 3)].map(rateOf);
  // impacto: a taxa de cada outro sim/não dentro de cada resposta do resultado
  const imp = [];
  flags.filter(f => f !== out).forEach(f => {
    let a1 = 0, b1 = 0, a0 = 0, b0 = 0;
    for (let i = 0; i < n; i++) { if (f.cls[i] > 1 || f.cls[i] < 0) continue; if (out.cls[i] === 1) { if (f.cls[i] === 1) a1++; else b1++; } else if (out.cls[i] === 0) { if (f.cls[i] === 1) a0++; else b0++; } }
    const v1 = a1 + b1, v0 = a0 + b0; if (v1 < 8 || v0 < 8) return;
    const d = csRate(a1, b1) - csRate(a0, b0); if (Math.abs(d) >= 10) imp.push({ k: 'impact', o: out.name, f: f.name, a1, v1, a0, v0, d });
  });
  imp.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
  // onde o resultado varia: a taxa por grupo de cada categoria
  const wh = [];
  cols.forEach(c => {
    if (!c.codes || !c.dict || c.use === false || c.role === 'flag' || c.role === 'id' || c.role === 'pii' || c.role === 'text' || c.dict.length < 3 || c.dict.length > 40) return;
    const a = new Array(c.dict.length).fill(0), b = new Array(c.dict.length).fill(0);
    for (let i = 0; i < n; i++) { const k = c.codes[i]; if (k < 0) continue; if (out.cls[i] === 1) a[k]++; else if (out.cls[i] === 0) b[k]++; }
    const gs = c.dict.map((l, k) => ({ l, a: a[k], v: a[k] + b[k], r: csRate(a[k], b[k]) })).filter(g => g.v >= 8 && !isPlaceholderLabel(g.l));
    if (gs.length < 2) return;
    gs.sort((x, y) => x.r - y.r); const lo = gs[0], hi = gs[gs.length - 1];
    if (hi.r - lo.r >= 15) wh.push({ k: 'where', o: out.name, g: c.name, lo: { l: lo.l, a: lo.a, v: lo.v }, hi: { l: hi.l, a: hi.a, v: hi.v }, all: { a: out.pos, v: out.valid }, spread: hi.r - lo.r });
  });
  wh.sort((a, b) => b.spread - a.spread);
  // respostas mais frequentes das colunas de causa ou motivo
  const cause = [];
  cols.forEach(c => {
    if (!c.codes || !c.dict || c.use === false || c.role !== 'category' || !CS_CAUSE.test(c.name) || c.dict.length < 2 || c.dict.length > 80) return;
    const cnt = new Array(c.dict.length).fill(0); let filled = 0;
    for (let i = 0; i < n; i++) { const k = c.codes[i]; if (k >= 0 && !isPlaceholderLabel(c.dict[k])) { cnt[k]++; filled++; } }
    if (filled < 8) return;
    const top = c.dict.map((l, k) => ({ l, n: cnt[k] })).filter(x => x.n > 0).sort((x, y) => y.n - x.n).slice(0, 5);
    if (top.length >= 2) cause.push({ k: 'cause', name: c.name, filled, n, top });
  });
  cause.sort((a, b) => b.filled - a.filled);
  return { n, outcome: out.name, facts: [rates[0], ...imp.slice(0, 3), ...wh.slice(0, 2), ...cause.slice(0, 2), ...terms, ...rates.slice(1)] };
}

// termos que mais se repetem nos textos livres: em quantas linhas cada palavra aparece
function casesTerms(ds) {
  const n = ds.rowCount, res = [];
  ds.columns.forEach(c => {
    if (c.role !== 'text' || c.use === false || !CS_TEXT.test(c.name) || !(c.texts || c.dict)) return;
    const get = i => (c.texts ? c.texts[i] : c.codes[i] >= 0 ? c.dict[c.codes[i]] : null);
    let filled = 0; const cnt = new Map(), shown = new Map();
    for (let i = 0; i < n; i++) {
      const t = get(i); if (!t) continue; filled++;
      const seen = new Set(); String(t).toLowerCase().split(/[^\p{L}\p{N}]+/u).forEach(w => { if (w.length < 4 || /^\d+$/.test(w)) return; const k = csKey(w); if (CS_STOP.has(k) || seen.has(k)) return; seen.add(k); if (!shown.has(k)) shown.set(k, w); });
      seen.forEach(k => cnt.set(k, (cnt.get(k) || 0) + 1));
    }
    if (filled < 20) return;
    const top = [...cnt].filter(([, v]) => v >= 3 && v <= filled * 0.45).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => ({ l: shown.get(k), n: v }));
    if (top.length >= 3) res.push({ k: 'terms', name: c.name, filled, n, top });
  });
  return res.sort((a, b) => b.filled - a.filled).slice(0, 1);
}
