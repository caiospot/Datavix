/* Datavix: modelo "Ficha / perfil" (portão 55): uma entidade, muitas métricas. Especificação: docs/gate-55-modelos-extras.md.
 * A planilha é uma lista curta de indicadores de uma só entidade (Indicador, Valor, Unidade…), ou uma coluna de valores misturados (número com unidade
 * e texto) ao lado de uma coluna de rótulos. Cada linha é uma métrica DIFERENTE: somar, tirar média ou comparar uma com a outra não tem sentido, por
 * isso o modelo só apresenta: cada valor como a planilha traz, os textos na íntegra e os limites. Duas etapas, como no Face a face:
 * (1) nvFichaPack(ds) lê a planilha e devolve números e textos puros (vai em built.fc); (2) nvPlanFicha(P, N) monta os slides. */

Object.assign(I18N.pt, { fc_title: 'Ficha de indicadores' });
Object.assign(I18N.en, { fc_title: 'Indicator sheet' });

const NV_FC_LABEL = /^(indicador(?:es)?|m[eé]tricas?|medidas?|atributos?|caracter[ií]sticas?|vari[aá]veis?|campos?|estat[ií]sticas?|par[aâ]metros?|propriedades?|kpis?|metrics?|indicators?|attributes?|characteristics?|variables?|fields?|statistics?|measures?|parameters?|properties)$/i;
const NV_FC_UNIT = /^(unidade(?: de medida)?|unidades|unit(?: of measure)?|units|und|un)$/i;
const NV_FC_GROUP = /^(eixo|eixos|categoria|grupo|tema|dimens[aã]o|[aá]rea|se[cç][aã]o|bloco|category|group|theme|dimension|area|section|block)$/i;
const NV_FC_NAME = /^(entidade|nome|name|cliente|munic[ií]pio|cidade|produto|loja|empresa|pessoa|aluno|paciente|projeto|entity|client|customer|city|product|store|company|person|student|patient|project)$/i;
const NV_FC_IDX = /^(n[ºo°]?|#|id|[ií]ndice|ordem|seq|item)$/i;
const NV_FC_GENERIC = /^(valor|value|resultado|result|dado|dados|data|medida|n[uú]mero)$/i;
const NV_FC_PER = 8; // indicadores por slide

// número que a planilha traz em texto: "161 largadas", "40,3% das corridas", "4º colocado (50 pontos)". Só reconhece quando não há dúvida (1.234 é ambíguo e fica como texto)
function nvFcNum(t) {
  t = String(t).trim(); if (!/^[+-]?\d[\d.,]*$/.test(t)) return NaN;
  const sg = t[0] === '-' ? -1 : 1, u = t.replace(/^[+-]/, '');
  if (/^\d+$/.test(u)) return sg * +u;
  const seps = u.match(/[.,]/g) || [];
  if (seps.length === 1) { const k = u.search(/[.,]/), a = u.slice(0, k), b = u.slice(k + 1); if (!a || !b || (b.length === 3 && a.length <= 3)) return NaN; return sg * +(a + '.' + b); }
  if (new Set(seps).size === 1) return /^\d{1,3}([.,]\d{3})+$/.test(u) ? sg * +u.replace(/[.,]/g, '') : NaN;
  const last = Math.max(u.lastIndexOf(','), u.lastIndexOf('.')), ip = u.slice(0, last), fp = u.slice(last + 1);
  return (/^\d{1,3}(\.\d{3})*$/.test(ip) || /^\d{1,3}(,\d{3})*$/.test(ip)) && /^\d+$/.test(fp) ? sg * +(ip.replace(/[.,]/g, '') + '.' + fp) : NaN;
}
function nvFcCell(s) {
  s = String(s == null ? '' : s).trim(); if (!s) return null;
  let m = /^(\d{1,4})\s*[ºª°]\s*([^()]*?)\s*(\(.*\))?$/.exec(s);
  if (m) return { num: +m[1], unit: 'º', raw: s };
  m = /^([+-]?\d[\d.,]*)\s*(%)?\s*([^\d()]{0,30}?)\s*(\(.*\))?$/.exec(s); if (!m) return null;
  const n = nvFcNum(m[1]); if (!Number.isFinite(n)) return null;
  const word = m[3] ? m[3].trim() : ''; if (!m[2] && word.split(/\s+/).filter(Boolean).length > 3) return null;
  return { num: n, unit: (m[2] ? '%' : word).slice(0, 24), raw: s === String(n) ? '' : s };
}
// o valor como aparece no slide: o texto original quando a célula trazia unidade ou observação; senão o número da planilha com a unidade
function nvFcShow(it) {
  if (it.num === null) return it.text;
  if (it.raw) return it.raw;
  const n = nvXNum(it.num, '', it.name), u = it.unit || '';
  return !u ? n : u === '%' ? n + '%' : /^(r\$|us\$|\$|€|£)$/i.test(u) ? u + ' ' + n : n + ' ' + u;
}

// ---------------------------------------------------------------- etapa 1: leitura
function nvFichaPack(ds) {
  if (!ds || !ds.columns) return null;
  if (ds._fcp !== undefined) return ds._fcp;
  let pk = null; try { pk = nvFichaBuild(ds); } catch (e) { console.error(e); pk = null; }
  Object.defineProperty(ds, '_fcp', { value: pk, enumerable: false, configurable: true }); return pk;
}
function nvFichaBuild(ds) {
  const cols = ds.columns, n = ds.rowCount; if (n < 4 || n > 80 || (ds.fixes && ds.fixes.versus)) return null;
  const textual = c => c.kind === 'category' || c.kind === 'text', skip = c => c.use === false || c.hide || c.role === 'pii', at = (c, i) => nvVsAt(c, i).trim();
  const named = (re, i) => re.test(String(cols[i].name || '').trim());
  const stat = c => { const set = new Set(); let k = 0, len = 0; for (let r = 0; r < n; r++) { const s = at(c, r); if (!s) continue; k++; len += s.length; set.add(s); } return { k, d: set.size, avg: k ? len / k : 0, first: [...set][0] || '' }; };
  const unitI = cols.findIndex((c, i) => textual(c) && !skip(c) && named(NV_FC_UNIT, i));
  const groupI = cols.findIndex((c, i) => { if (!textual(c) || skip(c) || !named(NV_FC_GROUP, i)) return false; const s = stat(c); return s.k >= 0.9 * n && s.d >= 2 && s.d <= 8 && s.d <= n / 2; });
  const nameI = cols.findIndex((c, i) => { if (!textual(c) || skip(c) || !named(NV_FC_NAME, i)) return false; const s = stat(c); return s.k >= 0.9 * n && s.d === 1; });
  const periodI = cols.findIndex((c, i) => !(c.use === false || c.hide) && named(NV_VS_PERIOD, i));
  const lab = cols.findIndex((c, i) => { if (!textual(c) || skip(c) || [unitI, groupI, nameI, periodI].includes(i)) return false; const s = stat(c); return s.k >= 0.9 * n && s.d >= 0.9 * s.k && s.avg <= 60 && s.avg >= 2; });
  if (lab < 0) return null;
  const fin = i => { let k = 0; const d = cols[i].data; for (let r = 0; r < n; r++) if (Number.isFinite(d[r])) k++; return k; };
  const numI = cols.map((c, i) => i).filter(i => i !== lab && i !== periodI && cols[i].kind === 'number' && cols[i].data && !skip(cols[i]) && !named(NV_FC_IDX, i));
  let vi = -1, mode = '';
  if (numI.length === 1 && fin(numI[0]) >= 0.6 * n) { vi = numI[0]; mode = 'num'; } // coluna numérica única: uma medida por linha
  else if (!numI.length) { // valores em texto, com número e unidade misturados
    const cand = cols.map((c, i) => i).filter(i => i !== lab && ![unitI, groupI, nameI, periodI].includes(i) && textual(cols[i]) && !skip(cols[i]));
    const good = cand.filter(i => { let k = 0, t = 0, long = 0; for (let r = 0; r < n; r++) { const s = at(cols[i], r); if (!s) continue; t++; if (nvFcCell(s)) k++; else if (s.length > 160) long++; } return t >= 0.9 * n && k >= 0.4 * t && k < t && !long; });
    if (good.length === 1) { vi = good[0]; mode = 'text'; }
  }
  if (vi < 0) return null;
  const vc = cols[vi], uc = unitI >= 0 ? cols[unitI] : null, gc = groupI >= 0 ? cols[groupI] : null, pc = periodI >= 0 ? cols[periodI] : null, items = [];
  const yearOnly = !!(pc && pc.kind === 'date' && pc.data && Array.from(pc.data).filter(Number.isFinite).every(t => { const d = new Date(t); return d.getUTCMonth() === 0 && d.getUTCDate() === 1; })); // as datas da planilha ficam em UTC
  const per = r => { if (!pc) return ''; if (pc.kind === 'date' && pc.data) { const t = pc.data[r]; return Number.isFinite(t) ? (yearOnly ? String(new Date(t).getUTCFullYear()) : bucketLabel(t, 'day', LANG)) : ''; } return at(pc, r); };
  for (let r = 0; r < n; r++) {
    const name = at(cols[lab], r); if (!name) continue;
    const it = { g: gc ? at(gc, r) : '', name, p: per(r), num: null, unit: '', raw: '', text: '' };
    if (mode === 'num') { const x = vc.data[r]; if (Number.isFinite(x)) { it.num = x; it.unit = uc ? at(uc, r) : (vc.unit || ''); } }
    else { const s = at(vc, r), p = nvFcCell(s); if (p) { it.num = p.num; it.unit = p.unit; it.raw = p.raw; } else if (s && !NV_VS_ABSENT.test(s)) it.text = s; }
    items.push(it);
  }
  const nums = items.filter(i => i.num !== null), txts = items.filter(i => i.text), none = items.filter(i => i.num === null && !i.text);
  if (items.length < 4 || nums.length < 3) return null;
  // sem sinal de que as linhas são indicadores diferentes (e não itens do mesmo tipo, como regiões ou produtos), a planilha é um ranking, não uma ficha
  const unitMap = new Map(); nums.forEach(i => { const u = String(i.unit || ''), k = u.toLowerCase(); if (!unitMap.has(k)) unitMap.set(k, u); }); const units = [...unitMap.keys()], sig = [];
  if (NV_FC_LABEL.test(String(cols[lab].name || '').trim())) sig.push('label');
  if (units.length >= 2) sig.push('units');
  if (txts.length && nums.length >= 3) sig.push('texts');
  if (!sig.length) return null;
  const entity = nameI >= 0 ? stat(cols[nameI]).first : mode === 'text' && !NV_FC_GENERIC.test(String(vc.name || '').trim()) ? String(vc.name).trim() : '';
  const tt = ds.fixes && ds.fixes.title && ds.fixes.title.texts && ds.fixes.title.texts[0] ? String(ds.fixes.title.texts[0]).trim() : '';
  return { entity, title: tt, label: cols[lab].name, value: vc.name, group: gc ? gc.name : '', period: pc ? pc.name : '', mode, sig, strong: sig.includes('label') || sig.includes('texts'), units: [...unitMap.values()].filter(Boolean), items, nNum: nums.length, nText: txts.length, noValue: none.map(i => i.name), valueIdx: vi };
}

// ---------------------------------------------------------------- etapa 2: texto e slides
const NVFC = {
  pt: {
    t: { cover: 'Capa', nums: 'Indicadores', prof: 'Textos da planilha', lim: 'Limites e síntese', concl: 'Conclusão' }, value: 'Valor', metric: 'Indicador',
    cover: (ent, nn, nt, ref, file) => [ent, `${nn} ${nn === 1 ? 'indicador' : 'indicadores'}${nt ? ` e ${nt} ${nt === 1 ? 'texto' : 'textos'}` : ''}`, ref ? `Referência: ${ref}` : '', file ? `Fonte: ${file}` : ''].filter(Boolean),
    numsH1: (ent, k, u) => `${ent ? ent + ': ' : ''}${k} ${k === 1 ? 'indicador' : 'indicadores'}${u >= 2 ? ` em ${u} unidades` : ''}.`, numsHn: (ent, a, b, k) => `${ent ? ent + ': i' : 'I'}ndicadores ${a} a ${b} de ${k}.`, numsT: 'Indicadores, na ordem da planilha',
    calcT: 'Como li cada valor', calcF: 'O número vem do texto da célula e a unidade, do próprio texto; o texto original fica à mostra.', calcR: (raw, n) => `${raw} → ${n}`,
    textH: (ent, k) => `${ent ? ent + ': ' : ''}${k} ${k === 1 ? 'texto' : 'textos'} da planilha, sem alteração.`, textT: 'Textos da planilha',
    limUnits: u => `Os indicadores têm unidades diferentes (${u}): não foram somados nem comparados entre si`, limNone: names => `Sem valor na planilha: ${names}`,
    limMore: k => `${k} ${k === 1 ? 'indicador ficou' : 'indicadores ficaram'} só na planilha, fora dos slides`, limTxt: k => `${k} ${k === 1 ? 'texto ficou' : 'textos ficaram'} só na planilha, fora dos slides`,
    limRange: 'Os números descrevem esta planilha e não provam relações entre as variáveis', limOne: 'Uma ficha mostra os números de uma entidade e não os compara com outras',
    synth: (ent, nn, nt) => `${ent ? ent + ': ' : ''}${nn} ${nn === 1 ? 'indicador' : 'indicadores'}${nt ? ` e ${nt} ${nt === 1 ? 'texto' : 'textos'}` : ''}, como estão na planilha`,
  },
  en: {
    t: { cover: 'Cover', nums: 'Indicators', prof: 'Texts from the sheet', lim: 'Summary and limits', concl: 'Conclusion' }, value: 'Value', metric: 'Indicator',
    cover: (ent, nn, nt, ref, file) => [ent, `${nn} ${nn === 1 ? 'indicator' : 'indicators'}${nt ? ` and ${nt} ${nt === 1 ? 'text' : 'texts'}` : ''}`, ref ? `Reference: ${ref}` : '', file ? `Source: ${file}` : ''].filter(Boolean),
    numsH1: (ent, k, u) => `${ent ? ent + ': ' : ''}${k} ${k === 1 ? 'indicator' : 'indicators'}${u >= 2 ? ` in ${u} units` : ''}.`, numsHn: (ent, a, b, k) => `${ent ? ent + ': i' : 'I'}ndicators ${a} to ${b} of ${k}.`, numsT: 'Indicators, in the sheet’s order',
    calcT: 'How I read each value', calcF: 'The number comes from the cell’s text and the unit from the text itself; the original text stays visible.', calcR: (raw, n) => `${raw} → ${n}`,
    textH: (ent, k) => `${ent ? ent + ': ' : ''}${k} ${k === 1 ? 'text' : 'texts'} from the sheet, unchanged.`, textT: 'Texts from the sheet',
    limUnits: u => `The indicators have different units (${u}): they were not added up or compared with each other`, limNone: names => `No value in the sheet: ${names}`,
    limMore: k => `${k} ${k === 1 ? 'indicator stayed' : 'indicators stayed'} only in the sheet, outside the slides`, limTxt: k => `${k} ${k === 1 ? 'text stayed' : 'texts stayed'} only in the sheet, outside the slides`,
    limRange: 'The numbers describe this spreadsheet and do not prove relationships between variables', limOne: 'A profile sheet shows the numbers of one entity and does not compare them with others',
    synth: (ent, nn, nt) => `${ent ? ent + ': ' : ''}${nn} ${nn === 1 ? 'indicator' : 'indicators'}${nt ? ` and ${nt} ${nt === 1 ? 'text' : 'texts'}` : ''}, as they are in the sheet`,
  },
};
const nvfcT = () => NVFC[LANG] || NVFC.pt;
// o valor lido, para o "ver cálculo": número (com % ou º quando a planilha traz) e a unidade
const nvFcRead = it => nvXNum(it.num, it.unit === '%' ? '%' : '', it.name) + (it.unit === 'º' ? 'º' : it.unit && it.unit !== '%' ? ' ' + it.unit : '');

function nvPlanFicha(P, N) {
  const b = P && P.built, fc = b && b.fc; if (!fc || !fc.items || !fc.items.length) return null;
  const X = nvfcT(), ent = fc.entity || fc.title || '', who = ent || nvXStem(P.fileName) || X.t.cover, nums = fc.items.filter(i => i.num !== null), txts = fc.items.filter(i => i.text);
  const core = [], push = (key, slide, pri) => core.push({ key, slide, pri });
  const periods = [...new Set(nums.map(i => i.p).filter(Boolean))], yrs = periods.map(p => (/^\d{4}$/.test(p) ? +p : NaN)), ref = periods.length === 0 ? '' : yrs.every(Number.isFinite) && periods.length > 1 ? `${Math.min(...yrs)}–${Math.max(...yrs)}` : periods.length === 1 ? periods[0] : periods.slice(0, 3).join(', ');
  const base = `${nvvT().base} · ${who}`;
  // capa
  { const lines = X.cover(who, nums.length, txts.length, ref, P.fileName || ''), s = nvXText('fc-cover', 'ctx', X.t.cover, lines); s.head = s.caption = lines.join('. '); push('cover', s, 6); }
  // indicadores: tabela na ordem da planilha, 8 por slide
  const pages = []; for (let i = 0; i < nums.length; i += NV_FC_PER) pages.push(nums.slice(i, i + NV_FC_PER));
  const head = [...(fc.group ? [fc.group] : []), fc.label || X.metric, ...(fc.period ? [fc.period] : []), fc.mode === 'num' && fc.value ? fc.value : X.value];
  const shown = pages.slice(0, 4);
  shown.forEach((pg, k) => {
    let lastG = null;
    const rows = pg.map(it => { const g = it.g !== lastG ? it.g : ''; lastG = it.g; return [...(fc.group ? [g] : []), it.name, ...(fc.period ? [it.p] : []), nvFcShow(it)]; });
    const a = k * NV_FC_PER + 1, z = k * NV_FC_PER + pg.length;
    const changed = pg.filter(it => it.raw && it.raw.replace(/\s+/g, ' ') !== nvFcRead(it)); // só entra no cálculo o que a leitura transformou: o texto original e o número lido
    const calc = changed.length ? { title: X.calcT, formula: X.calcF, rows: changed.slice(0, 8).map(it => ({ k: it.name, v: X.calcR(it.raw, nvFcRead(it)) })), base } : null;
    let big = null; if (k === 0) { const f = pg[0]; big = { text: nvXNum(f.num, f.unit === '%' ? '%' : '', f.name) + (f.unit === 'º' ? 'º' : ''), label: String(f.name).toUpperCase() }; }
    const s = nvvSlide(`fc-nums-${k + 1}`, 'fc_nums', X.t.nums, { head: k === 0 ? X.numsH1(ent, nums.length, fc.units.length) : X.numsHn(ent, a, z, nums.length), big, calc, viz: { kind: 'table', title: X.numsT, head, rows, note: '', wts: fc.group && fc.period ? [1.2, 2.6, 0.8, 2.4] : fc.group ? [1.2, 2.8, 2.4] : fc.period ? [2.8, 0.8, 2.4] : [3, 2.6] } });
    push('nums' + k, s, k === 0 ? 1 : k + 2);
  });
  // textos da planilha, na íntegra
  if (txts.length) { const tx = txts.slice(0, 10), s = nvvSlide('fc-text', 'fc_text', X.t.prof, { head: X.textH(ent, txts.length), viz: { kind: 'text', big: tx.length <= 6, title: X.textT, items: tx.map(it => ({ k: it.name, t: it.text })) } }); push('text', s, 2); }
  // limites e síntese: o texto é refeito depois do ajuste ao tamanho, para dizer o que ficou só na planilha
  const lim = nvXText('fc-limits', 'synthesis', X.t.lim, [X.synth(ent, nums.length, txts.length)]); push('limits', lim, -1);
  const keep = N <= 2 ? [core.find(x => x.key === 'nums0') || core[0], core.find(x => x.key === 'limits')].filter(Boolean) : nvXFit(P, core, N);
  const kept = keep.filter(x => x.key.startsWith('nums')); kept.forEach((x, i) => { const t = kept.length > 1 ? `${X.t.nums} ${i + 1}/${kept.length}` : X.t.nums; x.slide.planTitle = t; x.slide.kick = { n: '00', label: t }; }); // 1/2 só quando há mais de um slide de indicadores
  { const L = [], inSlides = kept.reduce((a, x) => a + shown[+x.key.slice(4)].length, 0), more = nums.length - inSlides, tmore = keep.some(x => x.key === 'text') ? txts.length - Math.min(10, txts.length) : txts.length;
    if (fc.units.length >= 2) L.push(X.limUnits(fc.units.slice(0, 6).join(', ') + (fc.units.length > 6 ? '…' : '')));
    if (fc.noValue.length) L.push(X.limNone(fc.noValue.slice(0, 6).join(', ') + (fc.noValue.length > 6 ? '…' : '')));
    if (more > 0) L.push(X.limMore(more)); if (tmore > 0) L.push(X.limTxt(tmore));
    nvWbDerive(b.wbx).caveats.forEach(c => L.push(c.k ? `${c.k}: ${c.t}` : c.t));
    L.push(X.limOne, X.limRange);
    lim.lines = [X.synth(ent, nums.length, txts.length), ...L]; lim.head = lim.caption = lim.lines.join('. '); }
  return nvXFinish(P, N, 'profile', keep, core, nvXConcl(X.t.concl));
}
