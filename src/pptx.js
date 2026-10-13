/* Datavix: exportação para PowerPoint (.pptx), tudo no navegador, sem biblioteca.
 * O arquivo é um pacote OOXML montado à mão (zip sem compressão, como as demais exportações): os textos são caixas de texto reais e os gráficos
 * são gráficos nativos do PowerPoint (barras, linhas, áreas, pizza, rosca, dispersão, bolhas, radar), cada um com a planilha embutida, então
 * "Editar dados" abre os números e as formas, cores e eixos se editam no PowerPoint. Gráficos sem equivalente nativo saem como o gráfico
 * nativo mais próximo dos mesmos dados (com uma nota no slide). A árvore radial sai como desenho vetorial: formas do PowerPoint agrupadas
 * (elipses, ligações curvas, textos), no mesmo layout do gráfico vivo. Os números vêm dos mesmos cálculos da peça. */
const PX = { W: 12192000, H: 6858000, E: 9525 }; // 1280×720 px de projeto (1 px = 9525 EMU)
const pxe = v => Math.round(v * PX.E);
const pxEsc = s => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pxHex = c => { let m = /^#?([0-9a-f]{3})$/i.exec(String(c || '')); if (m) return m[1].split('').map(x => x + x).join('').toUpperCase(); m = /^#?([0-9a-f]{6})/i.exec(String(c || '')); return m ? m[1].toUpperCase() : '888888'; };
const pxFamily = css => { const m = /^\s*['"]?([^,'"]+)/.exec(String(css || '')); return m ? m[1].trim() : 'Arial'; };
const pxCol = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
const PX_NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const PX_TXT = {
  pt: { chart: 'O gráfico', cal: 'Mapa de calor do calendário exibido como colunas por mês', note: 'Exibido como gráfico nativo do PowerPoint com os mesmos dados', end: 'Resumo', src: 'Fonte', ph: 'Digite aqui seu conteúdo', calc: 'Como foi calculado' },
  en: { chart: 'The chart', cal: 'Calendar heatmap shown as columns by month', note: 'Shown as a native PowerPoint chart with the same data', end: 'Summary', src: 'Source', ph: 'Type your content here', calc: 'How it was calculated' },
};
const pxT = () => PX_TXT[LANG] || PX_TXT.pt;

/* ---------- planilha embutida (xlsx mínimo) ---------- */
function pxXlsx(rows) {
  const enc = new TextEncoder(), cell = (v, r, c) => { const ref = pxCol(c) + (r + 1); return v === null || v === undefined || v === '' ? '' : typeof v === 'number' && isFinite(v) ? `<c r="${ref}"><v>${v}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${pxEsc(v)}</t></is></c>`; };
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row, r) => `<row r="${r + 1}">${row.map((v, c) => cell(v, r, c)).join('')}</row>`).join('')}</sheetData></worksheet>`;
  const files = [
    { name: '[Content_Types].xml', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>') },
    { name: '_rels/.rels', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>') },
    { name: 'xl/workbook.xml', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>') },
    { name: 'xl/_rels/workbook.xml.rels', data: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>') },
    { name: 'xl/worksheets/sheet1.xml', data: enc.encode(sheet) },
  ];
  return zipStore(files);
}

/* ---------- gráfico nativo ---------- */
// spec: { type: bar|line|area|pie|doughnut|scatter|bubble|radar|box, dir: col|bar, grouping, cats[], series:[{ name, vals[], color, ptColors[], alpha, xs[], ys[], zs[] }], labels, fmt, hole }
function pxChart(spec, th) {
  const A = 'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const fg = pxHex(th.fg), mutedC = pxHex(th.muted), grid = pxHex(th.grid), font = pxEsc(th.font);
  const allV = (spec.series || []).flatMap(q => (q.vals || q.ys || []).filter(v => typeof v === 'number')), vmax = allV.length ? Math.max(...allV.map(Math.abs)) : 0;
  const fmt = spec.fmt || (vmax && vmax < 10 ? '#,##0.0' : '#,##0'); // sem casas decimais quando os valores são grandes (evita "350.000," no Brasil)
  const txPr = (sz, col, b) => `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="${sz}" b="${b ? 1 : 0}"><a:solidFill><a:srgbClr val="${col}"/></a:solidFill><a:latin typeface="${font}"/></a:defRPr></a:pPr><a:endParaRPr lang="${LANG === 'pt' ? 'pt-BR' : 'en-US'}"/></a:p></c:txPr>`;
  const fill = (c, alpha) => `<a:solidFill><a:srgbClr val="${pxHex(c)}">${alpha != null && alpha < 100 ? `<a:alpha val="${Math.round(alpha * 1000)}"/>` : ''}</a:srgbClr></a:solidFill>`;
  const str = (f, arr) => `<c:strRef><c:f>${f}</c:f><c:strCache><c:ptCount val="${arr.length}"/>${arr.map((v, i) => `<c:pt idx="${i}"><c:v>${pxEsc(v)}</c:v></c:pt>`).join('')}</c:strCache></c:strRef>`;
  const num = (f, arr) => `<c:numRef><c:f>${f}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${arr.length}"/>${arr.map((v, i) => (v === null || v === undefined || !isFinite(v) ? '' : `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`)).join('')}</c:numCache></c:numRef>`;
  const S = spec.series, nC = (spec.cats || []).length, t = spec.type, isXY = t === 'scatter' || t === 'bubble', grid2 = []; // grid2: linhas da planilha embutida
  const col = (i, k) => S[i].color || th.colors[(i + (k || 0)) % th.colors.length];
  const dl = (kind) => `<c:dLbls><c:numFmt formatCode="${kind === 'pct' ? '0%' : pxEsc(fmt)}" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${txPr(1100, fg)}<c:showLegendKey val="0"/><c:showVal val="${kind === 'pct' ? 0 : 1}"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="${kind === 'pct' ? 1 : 0}"/><c:showBubbleSize val="0"/></c:dLbls>`;
  let body = '', axes = '';
  const AX1 = 111111111, AX2 = 222222222;
  if (isXY) {
    // planilha: para cada série, colunas X, Y (e tamanho)
    let c0 = 0; const w = t === 'bubble' ? 3 : 2; const head = [], maxN = Math.max(1, ...S.map(s => s.xs.length));
    S.forEach((s, i) => { head.push(s.name + ' (x)', s.name, ...(w === 3 ? [s.name + ' (' + (spec.sizeName || 'size') + ')'] : [])); });
    for (let r = 0; r < maxN; r++) { const row = []; S.forEach(s => { row.push(s.xs[r] ?? null, s.ys[r] ?? null); if (w === 3) row.push(s.zs[r] ?? null); }); grid2.push(row); }
    grid2.unshift(head);
    const sers = S.map((s, i) => {
      const cx = pxCol(i * w), cy = pxCol(i * w + 1), cz = pxCol(i * w + 2), n = s.xs.length, c = col(i);
      const head1 = `<c:idx val="${i}"/><c:order val="${i}"/><c:tx>${str(`Sheet1!$${cy}$1`, [s.name])}</c:tx>`;
      if (t === 'bubble') return `<c:ser>${head1}<c:spPr>${fill(c, 70)}<a:ln w="9525">${fill(c)}</a:ln></c:spPr><c:invertIfNegative val="0"/><c:xVal>${num(`Sheet1!$${cx}$2:$${cx}$${n + 1}`, s.xs)}</c:xVal><c:yVal>${num(`Sheet1!$${cy}$2:$${cy}$${n + 1}`, s.ys)}</c:yVal><c:bubbleSize>${num(`Sheet1!$${cz}$2:$${cz}$${n + 1}`, s.zs)}</c:bubbleSize><c:bubble3D val="0"/></c:ser>`;
      return `<c:ser>${head1}<c:spPr><a:ln w="19050"><a:noFill/></a:ln></c:spPr><c:marker><c:symbol val="circle"/><c:size val="8"/><c:spPr>${fill(c, 85)}<a:ln w="9525">${fill(c)}</a:ln></c:spPr></c:marker><c:xVal>${num(`Sheet1!$${cx}$2:$${cx}$${n + 1}`, s.xs)}</c:xVal><c:yVal>${num(`Sheet1!$${cy}$2:$${cy}$${n + 1}`, s.ys)}</c:yVal><c:smooth val="0"/></c:ser>`;
    }).join('');
    body = t === 'bubble' ? `<c:bubbleChart><c:varyColors val="0"/>${sers}<c:bubbleScale val="60"/><c:showNegBubbles val="0"/><c:axId val="${AX1}"/><c:axId val="${AX2}"/></c:bubbleChart>` : `<c:scatterChart><c:scatterStyle val="lineMarker"/><c:varyColors val="0"/>${sers}<c:axId val="${AX1}"/><c:axId val="${AX2}"/></c:scatterChart>`;
    const ax = (id, cross, pos, title) => `<c:valAx><c:axId val="${id}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${pos}"/><c:majorGridlines><c:spPr><a:ln w="6350">${fill(grid)}</a:ln></c:spPr></c:majorGridlines>${title ? `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1100" b="0"><a:solidFill><a:srgbClr val="${mutedC}"/></a:solidFill><a:latin typeface="${font}"/></a:defRPr></a:pPr><a:r><a:rPr lang="${LANG === 'pt' ? 'pt-BR' : 'en-US'}" sz="1100" b="0"><a:solidFill><a:srgbClr val="${mutedC}"/></a:solidFill><a:latin typeface="${font}"/></a:rPr><a:t>${pxEsc(title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>` : ''}<c:numFmt formatCode="${pxEsc(fmt)}" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln w="6350">${fill(grid)}</a:ln></c:spPr>${txPr(1100, mutedC)}<c:crossAx val="${cross}"/><c:crosses val="autoZero"/><c:crossBetween val="midCat"/></c:valAx>`;
    axes = ax(AX1, AX2, 'b', spec.xTitle) + ax(AX2, AX1, 'l', spec.yTitle);
  } else {
    // planilha: categorias na coluna A, uma série por coluna
    const names = S.map(s => s.name); grid2.push(['', ...names]);
    for (let r = 0; r < nC; r++) grid2.push([spec.cats[r], ...S.map(s => (s.vals[r] === undefined ? null : s.vals[r]))]);
    const catRef = `Sheet1!$A$2:$A$${nC + 1}`, sers = S.map((s, i) => {
      const L = pxCol(i + 1), valRef = `Sheet1!$${L}$2:$${L}$${nC + 1}`, c = col(i), tx = `<c:tx>${str(`Sheet1!$${L}$1`, [s.name])}</c:tx>`, cat = `<c:cat>${str(catRef, spec.cats)}</c:cat>`, val = `<c:val>${num(valRef, s.vals)}</c:val>`;
      const pts = (s.ptColors || []).map((pc, k) => (pc ? `<c:dPt><c:idx val="${k}"/>${t === 'pie' || t === 'doughnut' ? '' : '<c:invertIfNegative val="0"/>'}<c:bubble3D val="0"/><c:spPr>${fill(pc.c, pc.a)}${t === 'pie' || t === 'doughnut' ? `<a:ln w="12700">${fill(th.base)}</a:ln>` : ''}</c:spPr></c:dPt>` : '')).join('');
      const eb = (s.err ? `<c:errBars><c:errDir val="y"/><c:errBarType val="${s.err.dir}"/><c:errValType val="cust"/><c:noEndCap val="0"/>${s.err.dir === 'plus' ? '<c:plus>' : '<c:minus>'}${num(`Sheet1!$${pxCol(S.length + 1 + (s.err.col || 0))}$2:$${pxCol(S.length + 1 + (s.err.col || 0))}$${nC + 1}`, s.err.vals)}${s.err.dir === 'plus' ? '</c:plus>' : '</c:minus>'}<c:spPr><a:ln w="19050">${fill(fg)}</a:ln></c:spPr></c:errBars>` : '');
      const labels = spec.labels && !s.hideLabels ? dl(t === 'pie' || t === 'doughnut' ? 'pct' : 'val') : '';
      if (t === 'bar' || t === 'box') return `<c:ser><c:idx val="${i}"/><c:order val="${i}"/>${tx}<c:spPr>${s.noFill ? '<a:noFill/>' : fill(c, s.alpha)}${s.noFill ? '<a:ln><a:noFill/></a:ln>' : ''}</c:spPr><c:invertIfNegative val="0"/>${pts}${labels}${eb}${cat}${val}</c:ser>`;
      if (t === 'line') return `<c:ser><c:idx val="${i}"/><c:order val="${i}"/>${tx}<c:spPr><a:ln w="28575" cap="rnd">${fill(c, s.alpha)}<a:round/></a:ln></c:spPr><c:marker><c:symbol val="${nC <= 24 ? 'circle' : 'none'}"/><c:size val="5"/><c:spPr>${fill(c, s.alpha)}<a:ln w="9525">${fill(c, s.alpha)}</a:ln></c:spPr></c:marker>${labels}${cat}${val}<c:smooth val="0"/></c:ser>`;
      if (t === 'area') return `<c:ser><c:idx val="${i}"/><c:order val="${i}"/>${tx}<c:spPr>${fill(c, s.alpha == null ? 85 : s.alpha)}<a:ln w="9525">${fill(c)}</a:ln></c:spPr>${cat}${val}</c:ser>`;
      if (t === 'radar') return `<c:ser><c:idx val="${i}"/><c:order val="${i}"/>${tx}<c:spPr><a:ln w="28575">${fill(c, s.alpha)}</a:ln></c:spPr><c:marker><c:symbol val="circle"/><c:size val="5"/><c:spPr>${fill(c, s.alpha)}<a:ln w="9525">${fill(c, s.alpha)}</a:ln></c:spPr></c:marker>${cat}${val}</c:ser>`;
      return `<c:ser><c:idx val="${i}"/><c:order val="${i}"/>${tx}${pts}${labels}${cat}${val}</c:ser>`; // pie, doughnut
    }).join('');
    const catAx = (pos, rev) => `<c:catAx><c:axId val="${AX1}"/><c:scaling><c:orientation val="${rev ? 'maxMin' : 'minMax'}"/></c:scaling><c:delete val="0"/><c:axPos val="${pos}"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln w="9525">${fill(grid)}</a:ln></c:spPr>${txPr(1100, mutedC)}<c:crossAx val="${AX2}"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>`;
    const valAx = (pos, crossesMax, pct) => `<c:valAx><c:axId val="${AX2}"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${pos}"/><c:majorGridlines><c:spPr><a:ln w="6350">${fill(grid)}</a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="${pct ? '0%' : pxEsc(fmt)}" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${txPr(1100, mutedC)}<c:crossAx val="${AX1}"/><c:crosses val="${crossesMax ? 'max' : 'autoZero'}"/><c:crossBetween val="${t === 'area' ? 'midCat' : 'between'}"/></c:valAx>`;
    if (t === 'bar' || t === 'box') { const horiz = spec.dir === 'bar', grp = spec.grouping || 'clustered'; body = `<c:barChart><c:barDir val="${horiz ? 'bar' : 'col'}"/><c:grouping val="${grp}"/><c:varyColors val="0"/>${sers}<c:gapWidth val="${spec.gap || 60}"/>${grp !== 'clustered' ? '<c:overlap val="100"/>' : ''}<c:axId val="${AX1}"/><c:axId val="${AX2}"/></c:barChart>`; axes = catAx(horiz ? 'l' : 'b', horiz) + valAx(horiz ? 'b' : 'l', horiz, grp === 'percentStacked'); }
    else if (t === 'line') { body = `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${sers}<c:marker val="1"/><c:axId val="${AX1}"/><c:axId val="${AX2}"/></c:lineChart>`; axes = catAx('b', false) + valAx('l', false); }
    else if (t === 'area') { body = `<c:areaChart><c:grouping val="${spec.grouping || 'stacked'}"/><c:varyColors val="0"/>${sers}<c:axId val="${AX1}"/><c:axId val="${AX2}"/></c:areaChart>`; axes = catAx('b', false) + valAx('l', false, spec.grouping === 'percentStacked'); }
    else if (t === 'radar') { body = `<c:radarChart><c:radarStyle val="marker"/><c:varyColors val="0"/>${sers}<c:axId val="${AX1}"/><c:axId val="${AX2}"/></c:radarChart>`; axes = catAx('b', false) + valAx('l', false); }
    else if (t === 'pie') body = `<c:pieChart><c:varyColors val="1"/>${sers}<c:firstSliceAng val="0"/></c:pieChart>`;
    else body = `<c:doughnutChart><c:varyColors val="1"/>${sers}<c:firstSliceAng val="0"/><c:holeSize val="${spec.hole || 58}"/></c:doughnutChart>`;
  }
  // colunas extras da planilha (barras de erro do box plot)
  (S.filter(s => s.err)).forEach((s, k) => { s.err.col = s.err.col || k; grid2[0][S.length + 1 + (s.err.col)] = s.err.name || 'err'; s.err.vals.forEach((v, r) => { grid2[r + 1][S.length + 1 + (s.err.col)] = v; }); });
  const legend = spec.legend ? `<c:legend><c:legendPos val="${spec.legendPos || 'r'}"/><c:overlay val="0"/>${txPr(1100, mutedC)}</c:legend>` : '';
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace ${A}><c:date1904 val="0"/><c:roundedCorners val="0"/><c:chart><c:autoTitleDeleted val="1"/><c:plotArea><c:layout/>${body}${axes}<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr></c:plotArea>${legend}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${txPr(1100, fg)}<c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>`;
  return { xml, rows: grid2 };
}

/* ---------- slide ---------- */
class PxSlide {
  constructor(bg) { this.bg = bg; this.sh = []; this.rel = []; this.n = 1; }
  id() { return ++this.n; }
  addRel(type, target) { const id = 'rId' + (this.rel.length + 2); this.rel.push({ id, type, target }); return id; }
  para(text, o = {}) {
    const run = (t, ov = {}) => { const q = { ...o, ...ov }; return `<a:r><a:rPr lang="${LANG === 'pt' ? 'pt-BR' : 'en-US'}" sz="${Math.round((q.sz || 16) * 100)}" b="${q.b ? 1 : 0}" i="${q.i ? 1 : 0}" dirty="0">${q.col ? `<a:solidFill><a:srgbClr val="${pxHex(q.col)}">${q.alpha ? `<a:alpha val="${q.alpha * 1000}"/>` : ''}</a:srgbClr></a:solidFill>` : ''}<a:latin typeface="${pxEsc(q.font || 'Arial')}"/></a:rPr><a:t>${pxEsc(t)}</a:t></a:r>`; };
    const segs = Array.isArray(text) ? text : [{ t: text }];
    return `<a:p><a:pPr algn="${o.algn || 'l'}"${o.bullet ? ' marL="285750" indent="-285750"' : ''}>${o.ln ? `<a:lnSpc><a:spcPct val="${o.ln * 1000}"/></a:lnSpc>` : ''}<a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="${Math.round((o.after || 0) * 100)}"/></a:spcAft>${o.bullet ? `<a:buClr><a:srgbClr val="${pxHex(o.bulletCol || o.col)}"/></a:buClr><a:buFont typeface="Arial"/><a:buChar char="•"/>` : '<a:buNone/>'}</a:pPr>${segs.map(s => run(s.t, s)).join('')}</a:p>`;
  }
  text(x, y, w, h, paras, o = {}) {
    const id = this.id();
    this.sh.push(`<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${pxEsc(o.name || 'Texto ' + id)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm${o.rot ? ` rot="${Math.round(((o.rot % 360) + 360) % 360 * 60000)}"` : ''}><a:off x="${pxe(x)}" y="${pxe(y)}"/><a:ext cx="${pxe(w)}" cy="${pxe(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${o.fill ? `<a:solidFill><a:srgbClr val="${pxHex(o.fill)}">${o.fillAlpha ? `<a:alpha val="${o.fillAlpha * 1000}"/>` : ''}</a:srgbClr></a:solidFill>` : '<a:noFill/>'}${o.line ? `<a:ln w="9525"><a:solidFill><a:srgbClr val="${pxHex(o.line)}"/></a:solidFill></a:ln>` : '<a:ln><a:noFill/></a:ln>'}</p:spPr><p:txBody><a:bodyPr wrap="${o.nowrap ? 'none' : 'square'}" lIns="${pxe(o.pad || 0)}" tIns="${pxe(o.pad || 0)}" rIns="${pxe(o.pad || 0)}" bIns="${pxe(o.pad || 0)}" rtlCol="0" anchor="${o.anchor || 't'}"><a:normAutofit/></a:bodyPr><a:lstStyle/>${Array.isArray(paras) ? paras.join('') : paras}</p:txBody></p:sp>`);
  }
  rect(x, y, w, h, fill, o = {}) {
    const id = this.id();
    this.sh.push(`<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${pxEsc(o.name || 'Forma ' + id)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${pxe(x)}" y="${pxe(y)}"/><a:ext cx="${pxe(w)}" cy="${pxe(h)}"/></a:xfrm><a:prstGeom prst="${o.geom || 'rect'}"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${pxHex(fill)}">${o.alpha ? `<a:alpha val="${o.alpha * 1000}"/>` : ''}</a:srgbClr></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="${LANG === 'pt' ? 'pt-BR' : 'en-US'}"/></a:p></p:txBody></p:sp>`);
  }
  // forma vetorial (elipse, retângulo…) com preenchimento e contorno opcionais; descr vira o texto alternativo
  shape(x, y, w, h, o = {}) {
    const id = this.id(), clr = (c, a) => `<a:solidFill><a:srgbClr val="${pxHex(c)}">${a != null && a < 1 ? `<a:alpha val="${Math.round(a * 100000)}"/>` : ''}</a:srgbClr></a:solidFill>`;
    this.sh.push(`<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${pxEsc(o.name || 'Forma ' + id)}"${o.descr ? ` descr="${pxEsc(o.descr)}"` : ''}/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${pxe(x)}" y="${pxe(y)}"/><a:ext cx="${pxe(w)}" cy="${pxe(h)}"/></a:xfrm><a:prstGeom prst="${o.geom || 'ellipse'}"><a:avLst/></a:prstGeom>${o.fill ? clr(o.fill, o.fillAlpha) : '<a:noFill/>'}${o.line ? `<a:ln w="${pxe(o.lineW || 1)}">${clr(o.line, o.lineAlpha)}</a:ln>` : '<a:ln><a:noFill/></a:ln>'}</p:spPr><p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="${LANG === 'pt' ? 'pt-BR' : 'en-US'}"/></a:p></p:txBody></p:sp>`);
  }
  // linhas curvas (forma livre): segs = [[x0,y0, c1x,c1y, c2x,c2y, x1,y1]…] em px do slide; uma só forma para o conjunto
  free(segs, o = {}) {
    if (!segs.length) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const q of segs) for (let i = 0; i < 8; i += 2) { x0 = Math.min(x0, q[i]); x1 = Math.max(x1, q[i]); y0 = Math.min(y0, q[i + 1]); y1 = Math.max(y1, q[i + 1]); }
    const w = Math.max(1, x1 - x0), h = Math.max(1, y1 - y0), id = this.id(), pt = (X, Y) => `<a:pt x="${pxe(X - x0)}" y="${pxe(Y - y0)}"/>`;
    const path = segs.map(q => `<a:moveTo>${pt(q[0], q[1])}</a:moveTo><a:cubicBezTo>${pt(q[2], q[3])}${pt(q[4], q[5])}${pt(q[6], q[7])}</a:cubicBezTo>`).join('');
    this.sh.push(`<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${pxEsc(o.name || 'Ligações ' + id)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${pxe(x0)}" y="${pxe(y0)}"/><a:ext cx="${pxe(w)}" cy="${pxe(h)}"/></a:xfrm><a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/><a:pathLst><a:path w="${pxe(w)}" h="${pxe(h)}" fill="none">${path}</a:path></a:pathLst></a:custGeom><a:noFill/><a:ln w="${pxe(o.w || 1)}" cap="rnd"><a:solidFill><a:srgbClr val="${pxHex(o.line)}">${o.alpha != null && o.alpha < 1 ? `<a:alpha val="${Math.round(o.alpha * 100000)}"/>` : ''}</a:srgbClr></a:solidFill><a:round/></a:ln></p:spPr></p:sp>`);
  }
  // agrupa tudo o que fn desenhar numa única forma agrupada (mover e redimensionar o desenho de uma vez; cada peça continua editável)
  group(name, x, y, w, h, fn) {
    const at = this.sh.length, id = this.id(); fn();
    const inner = this.sh.splice(at).join(''), off = `<a:off x="${pxe(x)}" y="${pxe(y)}"/>`, ext = `<a:ext cx="${pxe(w)}" cy="${pxe(h)}"/>`;
    this.sh.push(`<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${id}" name="${pxEsc(name)}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm>${off}${ext}<a:chOff x="${pxe(x)}" y="${pxe(y)}"/><a:chExt cx="${pxe(w)}" cy="${pxe(h)}"/></a:xfrm></p:grpSpPr>${inner}</p:grpSp>`);
  }
  table(x, y, w, rows, o) { // rows: [[k, v]]
    const id = this.id(), rh = o.rowH || 28, w1 = Math.round(w * 0.62), w2 = w - w1, cell = (t, al, b) => `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${this.para(t, { sz: o.sz || 12, col: o.col, font: o.font, algn: al, b })}</a:txBody><a:tcPr marL="${pxe(4)}" marR="${pxe(4)}" marT="${pxe(3)}" marB="${pxe(3)}" anchor="ctr"><a:lnL w="0"><a:noFill/></a:lnL><a:lnR w="0"><a:noFill/></a:lnR><a:lnT w="0"><a:noFill/></a:lnT><a:lnB w="6350"><a:solidFill><a:srgbClr val="${pxHex(o.line)}"/></a:solidFill></a:lnB><a:noFill/></a:tcPr></a:tc>`;
    this.sh.push(`<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="${pxEsc(o.name || 'Tabela ' + id)}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${pxe(x)}" y="${pxe(y)}"/><a:ext cx="${pxe(w)}" cy="${pxe(rh * rows.length)}"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr/><a:tblGrid><a:gridCol w="${pxe(w1)}"/><a:gridCol w="${pxe(w2)}"/></a:tblGrid>${rows.map(r => `<a:tr h="${pxe(rh)}">${cell(r[0], 'l', false)}${cell(r[1], 'r', true)}</a:tr>`).join('')}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`);
  }
  chart(x, y, w, h, chartNo, name) {
    const id = this.id(), rid = this.addRel('http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart', `../charts/chart${chartNo}.xml`);
    this.sh.push(`<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="${pxEsc(name || 'Gráfico ' + id)}"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${pxe(x)}" y="${pxe(y)}"/><a:ext cx="${pxe(w)}" cy="${pxe(h)}"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="${rid}"/></a:graphicData></a:graphic></p:graphicFrame>`);
  }
  xml() {
    const bg = this.bg.grad ? `<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:srgbClr val="${pxHex(this.bg.c1)}"/></a:gs><a:gs pos="100000"><a:srgbClr val="${pxHex(this.bg.c2)}"/></a:gs></a:gsLst><a:lin ang="2700000" scaled="0"/></a:gradFill>` : `<a:solidFill><a:srgbClr val="${pxHex(this.bg.c1)}"/></a:solidFill>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${PX_NS}><p:cSld><p:bg><p:bgPr>${bg}<a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${this.sh.join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
  }
}

/* ---------- dados da peça → especificação do gráfico ---------- */
const pxNum = v => (typeof v === 'number' && isFinite(v) ? Math.round(v * 1e6) / 1e6 : null);
// destaque do passo: com seleção no estado, o que não foi escolhido fica esmaecido
function pxMute(labels, sel, th, c) { return sel && sel.length ? labels.map(l => (sel.includes(l) ? { c, a: 100 } : { c, a: 28 })) : null; }
/* ---------- desenhos vetoriais (formas editáveis do PowerPoint) ---------- */
// Árvore radial: o mesmo layout do gráfico vivo (OrgEngine) lido em posição final e redesenhado como formas: ligações curvas,
// uma elipse por bolha, nós, ramos com rótulo. Tudo se edita no PowerPoint (cor, tamanho, texto); não há "Editar dados" nas formas.
const PX_ORG_MAX = 1500;
function pxVecOrganism(P, state) {
  const D = P.built.org, th = P.__pxth, ot = orgTheme(P), keep = {}; if (state) for (const k of ['colors', 'range', 'focus']) if (state[k] !== undefined) keep[k] = state[k];
  const total = D.leaves.length;
  const draw = (s, X, Y, W, H) => {
    const eng = new OrgEngine(D, ot, { rm: true }); eng.resize(W, H, 1); if (Object.keys(keep).length) eng.setState(keep); eng.snap(); eng.stop();
    const fg = ot.fg, P_ = (a, r) => { const q = eng.pos(a, r, 1); return [X + q[0], Y + q[1]]; };
    const curve = (a1, r1, a2, r2, A, B) => { const rm = (r1 + r2) / 2, c1 = P_(a1, rm), c2 = P_(a2, rm); A = A || P_(a1, r1); B = B || P_(a2, r2); return [A[0], A[1], c1[0], c1[1], c2[0], c2[1], B[0], B[1]]; };
    const dens = orgClamp(Math.sqrt(260 / Math.max(1, eng.nVis || eng.leafN.length)), 0.22, 1), root = [X + eng.cx, Y + eng.cy];
    s.group('Árvore radial', X, Y, W, H, () => {
      const leaves = eng.leafN.filter(L => L.al >= 0.02 && L.rad >= 0.3).sort((a, b) => b.rad - a.rad).slice(0, PX_ORG_MAX), shown = new Set(leaves);
      // 1) ligações: raiz → ramo, ramo → nó, nó → bolhas (uma forma por nó)
      const hubSegs = eng.hubN.filter(h => h.al >= 0.02).map(h => curve(0, 0, h.a, h.r, root, null));
      s.free(hubSegs, { line: fg, alpha: 0.5, w: 1.3, name: 'Ligações raiz-ramos' });
      for (const hn of eng.hubN) {
        if (hn.al < 0.02) continue;
        const es = hn.ents.filter(en => en.al >= 0.02);
        s.free(es.map(en => curve(hn.a, hn.r, en.a, en.r)), { line: fg, alpha: 0.32, w: 1.1, name: 'Ligações ' + hn.label });
      }
      for (const en of eng.entN) {
        if (en.al < 0.02) continue;
        const ls = en.leaves.map(i => eng.leafN[i]).filter(L => shown.has(L));
        s.free(ls.map(L => curve(en.a, en.r, L.a, L.r)), { line: fg, alpha: 0.2 * dens, w: 0.8, name: 'Ligações ' + D.ents[en.e].label });
      }
      // 2) bolhas, as maiores primeiro (as pequenas ficam por cima)
      for (const L of leaves) {
        const [x, y] = P_(L.a, L.r), col = orgCatColor(ot, L.c), r = L.rad, hn = D.hubs[L.h], en = D.ents[L.e], cat = L.c >= 0 && D.cols[L.c] ? D.cols[L.c].label : '';
        s.shape(x - r, y - r, 2 * r, 2 * r, { fill: col, fillAlpha: 0.3, line: col, lineAlpha: 0.7, lineW: 1, name: 'Bolha ' + en.label, descr: [hn.label, en.label, cat, fmtNum(L.v, D.unit, LANG)].filter(Boolean).join(' · ') });
        if (r >= 4) { const d = Math.max(1.3, r * 0.14); s.shape(x - d, y - d, 2 * d, 2 * d, { fill: col, name: 'Centro' }); }
      }
      // 3) nós, raiz e ramos com rótulo
      for (const en of eng.entN) if (en.al >= 0.05) { const [x, y] = P_(en.a, en.r); s.shape(x - 2.4, y - 2.4, 4.8, 4.8, { fill: fg, fillAlpha: 0.9, name: 'Nó ' + D.ents[en.e].label }); }
      s.shape(root[0] - eng.r0, root[1] - eng.r0, 2 * eng.r0, 2 * eng.r0, { line: fg, lineAlpha: 0.45, lineW: 1.2, name: 'Raiz' });
      const visH = eng.hubN.filter(x => x.vis).length || 1, every = Math.max(1, Math.ceil(34 / ((ORG_TAU * eng.R * 0.3) / visH))), fs = Math.max(9, Math.min(14, eng.R * 0.034 * 0.9));
      for (const hn of eng.hubN) {
        if (hn.al < 0.05) continue;
        const [x, y] = P_(hn.a, hn.r); s.shape(x - 3.6, y - 3.6, 7.2, 7.2, { fill: fg, name: 'Ramo ' + hn.label });
        if (hn.i % every !== 0) continue;
        const flip = Math.cos(hn.a) < 0, lr = Math.max(eng.r0 * 1.8, hn.r - 20), [lx, ly] = P_(hn.a, lr), bw = 150, bh = fs * 2;
        s.text(lx - bw / 2, ly - bh / 2, bw, bh, s.para(hn.label, { sz: fs, b: true, col: fg, font: th.fontBody, algn: 'ctr' }), { name: 'Rótulo ' + hn.label, rot: (flip ? hn.a + Math.PI : hn.a) * 180 / Math.PI, anchor: 'ctr', nowrap: true });
      }
    });
    // legenda das cores (categorias) no canto, fora do círculo
    const cats = D.cols.slice(0, 10); cats.forEach((c, i) => { const yy = Y + 4 + i * 18; s.shape(X + 4, yy + 4, 9, 9, { fill: orgCatColor(ot, i), name: 'Cor ' + c.label }); s.text(X + 18, yy, 170, 18, s.para(c.label, { sz: 9, col: th.muted, font: th.fontBody }), { name: 'Legenda ' + c.label, anchor: 'ctr' }); });
    eng.stop();
  };
  const N = (LANG === 'en' ? { t: 'Branches', e: 'Nodes', c: 'Color', s: 'Size', cut: 'showing the largest' } : { t: 'Ramos', e: 'Nós', c: 'Cor', s: 'Tamanho', cut: 'mostrando as maiores' });
  const note = `${N.t}: ${D.hubName} · ${N.e}: ${D.entName}${D.colName ? ` · ${N.c}: ${D.colName}` : ''} · ${N.s}: ${D.sizeName}${total > PX_ORG_MAX ? ` · ${N.cut} ${PX_ORG_MAX} / ${total}` : ''}`;
  return { vec: draw, note };
}
function pxSpec(P, state, noVec) {
  const b = P.built, t = P.type, cs = (b.cs && b.cs[t]) || null, th = P.__pxth, pal = P.colors, note = pxT().note, sel = state && state.sel && state.sel.length ? state.sel : null;
  const topN = (items, n) => items.slice().sort((x, y) => y.v - x.v).slice(0, n);
  const barOf = (items, name, dir, horizOk = true) => { const it = topN(items.filter(x => x.v != null), 25); return { type: 'bar', dir: horizOk && it.length > 6 ? 'bar' : 'col', grouping: 'clustered', cats: it.map(x => String(x.label)), series: [{ name, vals: it.map(x => pxNum(x.v)), color: pal[0], ptColors: pxMute(it.map(x => x.label), sel, th, pal[0]) || undefined }], labels: it.length <= 14, legend: false, approx: true }; };
  const gal = id => cs && cs.mode === id;
  if (!DOM_TYPES.has(t)) {
    const n = b.names;
    if (b.kind === 'relation' && b.pts) { // dispersão e bolhas
      const groups = new Map(); b.pts.forEach(p => { const k = p.s || n.e || ''; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); });
      const mk = (name, ps, i) => ({ name: name || n.y, xs: ps.map(p => pxNum(p.x)), ys: ps.map(p => pxNum(p.y)), zs: ps.map(p => pxNum(p.z || 1)), color: pal[i % pal.length] });
      return { type: t === 'bubble' ? 'bubble' : 'scatter', series: [...groups].map(([k, ps], i) => mk(k, ps, i)), xTitle: n.x, yTitle: n.y, sizeName: n.size, legend: groups.size > 1 };
    }
    if (b.kind === 'hist') return { type: 'bar', dir: 'col', grouping: 'clustered', cats: b.totX.map(x => x.label), series: [{ name: n.y, vals: b.totX.map(x => pxNum(x.value)), color: pal[0] }], labels: false, legend: false, gap: 8 };
    // longa: categorias × séries a partir das linhas do Vizzu
    const S = b.vz.series, col = nm => S.find(s => s.name === nm), X = col(n.x), SS = n.s ? col(n.s) : null, Y = col(n.y);
    const cats = (b.totX || []).filter(x => x.value !== null).map(x => x.label), sLabels = SS ? (b.totS || []).map(x => x.label) : [n.y];
    const cell = new Map(); if (X && Y) for (let i = 0; i < X.values.length; i++) { const k = X.values[i] + '|' + (SS ? SS.values[i] : n.y); cell.set(k, (cell.get(k) || 0) + (typeof Y.values[i] === 'number' ? Y.values[i] : 0)); }
    const series = sLabels.map((s, i) => ({ name: String(s), vals: cats.map(c => (cell.has(c + '|' + s) ? pxNum(cell.get(c + '|' + s)) : null)), color: pal[i % pal.length], alpha: sel && SS ? (sel.includes(s) ? 100 : 28) : undefined }));
    const catMute = sel && !SS ? pxMute(cats, sel, th, pal[0]) : null; if (catMute && series[0]) series[0].ptColors = catMute;
    const stacked = series.length > 1;
    if (t === 'bars') return { type: 'bar', dir: 'col', grouping: stacked ? 'stacked' : 'clustered', cats, series, labels: !stacked && cats.length <= 14, legend: stacked, gap: 40 };
    if (t === 'hbars') return { type: 'bar', dir: 'bar', grouping: stacked ? 'stacked' : 'clustered', cats, series, labels: !stacked && cats.length <= 14, legend: stacked };
    if (t === 'stacked100') return { type: 'bar', dir: 'col', grouping: 'percentStacked', cats, series, labels: false, legend: true, gap: 40 };
    if (t === 'line') return { type: 'line', cats, series, labels: false, legend: series.length > 1 };
    if (t === 'area') return { type: 'area', grouping: 'stacked', cats, series, legend: series.length > 1 };
    if (t === 'race' || t === 'treemap') { const src = b.totS && b.totS.length ? b.totS : b.totX; const it = topN(src.filter(x => x.value !== null).map(x => ({ label: x.label, v: x.value })), 25); const o = barOf(it, n.y, 'bar'); o.dir = 'bar'; o.approx = true; o.note = note; return o; }
    return { ...barOf((b.totX || []).map(x => ({ label: x.label, v: x.value })), n.y, 'col'), note };
  }
  if (t === 'kpi') { let cards = []; try { cards = kpiCards(b, LANG, T).slice(0, 6); } catch (e) { cards = []; } return { kpi: cards }; }
  if (t === 'calendar' && b.cal) { const m = new Map(); b.cal.days.forEach(d => { const dt = new Date(d[0]), k = dt.getUTCFullYear() * 100 + dt.getUTCMonth(); m.set(k, (m.get(k) || 0) + d[1]); }); const keys = [...m.keys()].sort((a, c) => a - c), MS = LANG === 'en' ? MONTHS_EN : MONTHS_PT; return { type: 'bar', dir: 'col', grouping: 'clustered', cats: keys.map(k => `${MS[k % 100]}/${String(Math.floor(k / 100)).slice(2)}`), series: [{ name: b.names.y || '', vals: keys.map(k => pxNum(m.get(k))), color: pal[0] }], labels: keys.length <= 14, legend: false, note: pxT().cal }; }
  if (t === 'organism' && b.org && noVec) { const o = barOf(b.org.ents.map(e => ({ label: e.label, v: e.v })), b.org.sizeName || '', 'bar'); o.note = note; return o; }
  if (t === 'organism' && b.org) { const v = pxVecOrganism(P, state); v.fallback = pxSpec(P, state, true); return v; }
  if (!noVec && t === 'rays' && cs) { const v = pxVecCanvas(P, state, 'Raios'), f = pxSpec(P, state, true); if (f) v.fallback = f; return v; }
  if (t === 'rays' && cs) { const o = barOf(cs.ents.map(e => ({ label: e.label, v: e.v })), cs.valName, 'bar'); o.note = note; return o; }
  if (!noVec && t === 'fan' && cs) { const v = pxVecCanvas(P, state, 'Leque'), f = pxSpec(P, state, true); if (f) v.fallback = f; return v; }
  if (t === 'fan' && cs) { const o = barOf(cs.cats.map(e => ({ label: e.label, v: e.v })), cs.valName, 'bar'); o.note = note; return o; }
  if (!noVec && t === 'packed' && cs) { const v = pxVecCanvas(P, state, 'Bolhas agrupadas'), f = pxSpec(P, state, true); if (f) v.fallback = f; return v; }
  if (t === 'packed' && cs) { const o = barOf(cs.items.map(e => ({ label: e.label, v: e.v })), cs.valName, 'bar'); o.note = note; return o; }
  if (t === 'words' && cs) { const o = barOf(cs.items.map(e => ({ label: e.label, v: e.v })), cs.valName, 'bar'); o.note = note; return o; }
  if (!noVec && t === 'river' && cs) { const v = pxVecCanvas(P, state, 'Rio'), f = pxSpec(P, state, true); if (f) v.fallback = f; return v; }
  if (t === 'river' && cs) return { type: 'area', grouping: 'stacked', cats: cs.periods.map(p => p.label), series: cs.cats.map((c, i) => ({ name: c.label, vals: cs.m[i].map(pxNum), color: pal[i % pal.length], alpha: sel ? (sel.includes(c.label) ? 100 : 28) : undefined })), legend: true, note };
  if (!noVec && t === 'ridge' && cs) { const v = pxVecCanvas(P, state, 'Cordilheira'), f = pxSpec(P, state, true); if (f) v.fallback = f; return v; }
  if (t === 'ridge' && cs) return { type: 'line', cats: cs.times.map(p => p.label), series: cs.ents.map((e, i) => ({ name: e.label, vals: cs.times.map((_, k) => pxNum(cs.m[i].reduce((a, q) => a + (+q[k] || 0), 0))), color: pal[i % pal.length], alpha: sel ? (sel.includes(e.label) ? 100 : 28) : undefined })), legend: true, note };
  if (!noVec && t === 'flow' && cs) { const v = pxVecCanvas(P, state, 'Funil'), f = pxSpec(P, state, true); if (f) v.fallback = f; return v; }
  if (t === 'flow' && cs) { const C = flowCompute(cs, null); return { type: 'bar', dir: 'col', grouping: 'clustered', cats: cs.stages.map(s => s.name), series: [{ name: cs.valName, vals: C.T.map(pxNum), color: pal[0] }], labels: true, legend: false, note }; }
  if ((t === 'pie' || t === 'donut') && cs) { const ptc = cs.items.map((it, i) => ({ c: pal[i % pal.length], a: state && state.cs && state.cs.spot != null && state.cs.spot !== i ? 28 : 100 })); return { type: t === 'pie' ? 'pie' : 'doughnut', cats: cs.items.map(i => i.label), series: [{ name: cs.valName, vals: cs.items.map(i => pxNum(i.v)), ptColors: ptc }], labels: true, legend: true }; }
  if ((t === 'pies' || t === 'donuts') && cs) return { multi: cs.panels.map((p, k) => { const it = p.items.map(i => cs.items[i]); return { title: p.label, spec: { type: t === 'pies' ? 'pie' : 'doughnut', cats: it.map(x => x.label), series: [{ name: p.label, vals: it.map(x => pxNum(x.v)), ptColors: it.map((x, i) => ({ c: pal[i % pal.length], a: 100 })) }], labels: false, legend: k === 0 } }; }) };
  if ((t === 'cols' || t === 'lines' || t === 'radial') && cs) {
    const xs = cs.xs, ser = cs.series, M = ser.map(() => xs.map(() => null)); (cs.items || []).forEach(it => { if (M[it.g]) M[it.g][it.x] = pxNum(it.v); });
    const sr = ser.map((s, i) => ({ name: s.label, vals: M[i], color: pal[i % pal.length] }));
    if (t === 'cols') return { type: 'bar', dir: 'col', grouping: 'clustered', cats: xs.map(String), series: sr, labels: false, legend: sr.length > 1, gap: 50 };
    if (t === 'lines') return { type: 'line', cats: xs.map(String), series: sr, legend: sr.length > 1 };
    return { type: 'radar', cats: xs.map(String), series: sr, legend: sr.length > 1 };
  }
  if (t === 'radar' && cs) { const ser = cs.series, M = ser.map(() => cs.xs.map(() => null)); (cs.items || []).forEach(it => { if (M[it.g]) M[it.g][it.x] = pxNum(it.nv != null ? it.nv : it.v); }); return { type: 'radar', cats: cs.xs.map(String), series: ser.map((s, i) => ({ name: s.label, vals: M[i], color: pal[i % pal.length] })), legend: ser.length > 1, fmt: '0' }; }
  if (t === 'box' && cs) { // caixa de Tukey: base invisível (Q1), Q1→mediana, mediana→Q3, bigodes por barras de erro
    const it = cs.items.filter(x => x.st), q = it.map(x => x.st), g = (o, k, d) => (o[k] != null ? o[k] : d);
    const q1 = q.map(s => g(s, 'q1', g(s, 'Q1', 0))), md = q.map(s => g(s, 'med', g(s, 'median', 0))), q3 = q.map(s => g(s, 'q3', g(s, 'Q3', 0))), lo = q.map(s => g(s, 'lo', g(s, 'min', g(s, 'wlo', 0)))), hi = q.map(s => g(s, 'hi', g(s, 'max', g(s, 'whi', 0))));
    return { type: 'box', dir: 'col', grouping: 'stacked', cats: it.map(x => x.label), gap: 80, legend: false, labels: false, note: LANG === 'pt' ? 'Caixa: 1º quartil, mediana e 3º quartil; hastes: limites' : 'Box: first quartile, median and third quartile; whiskers: limits',
      series: [{ name: 'Q1', vals: q1.map(pxNum), noFill: true, err: { dir: 'minus', vals: q1.map((v, i) => pxNum(Math.max(0, v - lo[i]))), name: LANG === 'pt' ? 'Q1 − mínimo' : 'Q1 − minimum' } }, { name: LANG === 'pt' ? 'Q1 → mediana' : 'Q1 → median', vals: md.map((v, i) => pxNum(v - q1[i])), color: pal[0], alpha: 70 }, { name: LANG === 'pt' ? 'Mediana → Q3' : 'Median → Q3', vals: q3.map((v, i) => pxNum(v - md[i])), color: pal[0], err: { dir: 'plus', vals: hi.map((v, i) => pxNum(Math.max(0, v - q3[i]))), name: LANG === 'pt' ? 'Máximo − Q3' : 'Maximum − Q3', col: 1 } }] };
  }
  if (!noVec && t === 'bubmap' && cs) { const v = pxVecCanvas(P, state, 'Mapa de bolhas'), f = pxSpec(P, state, true); if (f) v.fallback = f; return v; }
  if (t === 'bubmap' && cs) { const ps = cs.items.filter(i => GEO_BR[i.uf]).map(i => ({ x: GEO_BR[i.uf].c[0] / 100, y: GEO_BR[i.uf].c[1] / 100, z: i.v, label: i.label })); return { type: 'bubble', series: [{ name: cs.valName, xs: ps.map(p => pxNum(p.x)), ys: ps.map(p => pxNum(p.y)), zs: ps.map(p => pxNum(p.z)), color: pal[0] }], xTitle: LANG === 'pt' ? 'Longitude' : 'Longitude', yTitle: 'Latitude', sizeName: cs.valName, legend: false, note: LANG === 'pt' ? 'Mapa de bolhas exibido como gráfico de bolhas por longitude e latitude (centro de cada estado)' : 'Bubble map shown as a bubble chart by longitude and latitude (center of each state)', bubScale: 1 };
  }
  if (!noVec && t === 'isomap' && cs) { const v = pxVecCanvas(P, state, 'Mapa de isolinhas'), f = pxSpec(P, state, true); if (f) v.fallback = f; return v; }
  if (t === 'isomap' && cs && cs.pts) return { type: 'scatter', series: [{ name: cs.valName, xs: cs.pts.map(p => pxNum(p[0])), ys: cs.pts.map(p => pxNum(p[1])), zs: [], color: pal[0] }], xTitle: 'Longitude', yTitle: 'Latitude', legend: false, note: LANG === 'pt' ? 'Mapa de isolinhas exibido como dispersão dos pontos (longitude e latitude)' : 'Isoline map shown as a scatter of the points (longitude and latitude)' };
  return null;
}


/* ---------- pacote ---------- */
function pxTheme(th, name) {
  const c = th.colors, A = i => pxHex(c[i % c.length]), line = w => `<a:ln w="${w}" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${pxEsc(name)}"><a:themeElements><a:clrScheme name="Datavix"><a:dk1><a:srgbClr val="${pxHex(th.fg)}"/></a:dk1><a:lt1><a:srgbClr val="${pxHex(th.base)}"/></a:lt1><a:dk2><a:srgbClr val="${pxHex(th.muted)}"/></a:dk2><a:lt2><a:srgbClr val="${pxHex(th.grid)}"/></a:lt2><a:accent1><a:srgbClr val="${A(0)}"/></a:accent1><a:accent2><a:srgbClr val="${A(1)}"/></a:accent2><a:accent3><a:srgbClr val="${A(2)}"/></a:accent3><a:accent4><a:srgbClr val="${A(3)}"/></a:accent4><a:accent5><a:srgbClr val="${A(4)}"/></a:accent5><a:accent6><a:srgbClr val="${A(5)}"/></a:accent6><a:hlink><a:srgbClr val="${A(0)}"/></a:hlink><a:folHlink><a:srgbClr val="${A(1)}"/></a:folHlink></a:clrScheme><a:fontScheme name="Datavix"><a:majorFont><a:latin typeface="${pxEsc(th.fontTitle)}"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="${pxEsc(th.fontBody)}"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst>${line(6350)}${line(12700)}${line(19050)}</a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
}
const PX_GRP = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
const PX_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const pxRels = list => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${list.map(r => `<Relationship Id="${r.id}" Type="${r.type}" Target="${r.target}"/>`).join('')}</Relationships>`;

/* ---------- apresentação ---------- */
function pxFit(len) { return len <= 60 ? 34 : len <= 110 ? 28 : len <= 170 ? 24 : 20; }
function pxDeck(P) {
  const base = bgBase(P.bg), fg = readableOn(base), f = fontsOf(P), TT = pxT();
  const th = { base, fg, muted: mixHex(fg, base, 0.45), grid: mixHex(fg, base, 0.86), colors: P.colors, fontTitle: pxFamily(f.title), fontBody: pxFamily(f.body), font: pxFamily(f.body) };
  P.__pxth = th; const acc = P.colors[0], bgS = P.bg.mode === 'gradient' ? { grad: true, c1: P.bg.base, c2: mixHex(P.bg.base, acc, 0.18) } : { c1: base };
  const slides = [], charts = []; // charts: { xml, rows }
  const meta = P.host.ix.meta, steps = buildSteps(P, meta), N = nvSlideCount(P.br), blank = nvIsBlank(P);
  let story = []; try { story = P.sb ? storyFromAnswers(P, meta, steps) : nvPlan(P, meta, steps, N, P.br && P.br.storyKind).slides; } catch (e) { console.error(e); story = []; }
  if (!P.sb && !story.length) { try { story = buildStory(P, meta, steps); } catch (e) { story = []; } }
  if (blank) story = nvBlankSlides(story); nvApplyEdits(P, story);
  const total = () => slides.length;
  const addChart = spec => { const r = pxChart(spec, th); charts.push(r); return charts.length; };
  const logo = s => { s.rect(56, 40, 12, 12, '#d4ff00', { geom: 'roundRect', name: 'Marca' }); s.text(76, 34, 200, 24, s.para('DATAVIX', { sz: 11, col: th.fg, font: 'Courier New', b: true }), { name: 'Logo' }); };
  const foot = (s, n) => { s.text(56, 684, 400, 22, s.para(DV_SITE, { sz: 10, col: th.muted, font: th.fontBody }), { name: 'Endereço' }); s.text(1124, 684, 100, 22, s.para(`${n}`, { sz: 10, col: th.muted, algn: 'r', font: th.fontBody }), { name: 'Número do slide' }); };
  const place = (s, spec, x, y, w, h, name) => { // um gráfico, ou a grade de gráficos pequenos (várias pizzas/roscas)
    if (!spec) return;
    if (spec.kpi) { // indicadores: cartões de texto editáveis em grade
      const k = spec.kpi, cols = k.length <= 1 ? 1 : 2, rows = Math.ceil(k.length / cols), g = 16, cw = (w - g * (cols - 1)) / cols, ch = Math.min(150, (h - g * (rows - 1)) / rows);
      k.forEach((c, i) => { const cx = x + (i % cols) * (cw + g), cy = y + Math.floor(i / cols) * (ch + g); s.text(cx, cy, cw, ch, [s.para(String(c.label).toUpperCase(), { sz: 10, col: th.muted, font: th.fontBody, after: 6 }), s.para(kpiFmt(c), { sz: 34, b: true, col: acc, font: th.fontTitle, after: 4 }), s.para(String(c.sub || ''), { sz: 11, col: th.muted, font: th.fontBody })], { name: 'Indicador ' + (i + 1), pad: 14, fill: th.fg, fillAlpha: 6, line: th.grid }); });
      return;
    }
    if (spec.vec) { // desenho vetorial; se algo falhar, cai para o gráfico nativo dos mesmos dados
      const n0 = s.sh.length; try { spec.vec(s, x, y, w, h); if (spec.note) s.text(x, y + h + 4, w, 36, s.para(spec.note, { sz: 10, col: th.muted, i: true, font: th.fontBody }), { name: 'Nota do gráfico' }); return; } catch (e) { console.error(e); s.sh.length = n0; if (!spec.fallback) return; spec = spec.fallback; }
    }
    if (spec.multi) { const m = spec.multi.slice(0, 6), cols = m.length <= 2 ? m.length : 3, rows = Math.ceil(m.length / cols), cw = w / cols, ch = h / rows; m.forEach((g, i) => { const cx = x + (i % cols) * cw, cy = y + Math.floor(i / cols) * ch; s.text(cx, cy, cw - 8, 22, s.para(g.title, { sz: 12, b: true, col: th.fg, font: th.fontBody, algn: 'ctr' }), { name: 'Título ' + g.title }); s.chart(cx, cy + 22, cw - 8, ch - 30, addChart(g.spec), 'Gráfico ' + g.title); }); return; }
    s.chart(x, y, w, h, addChart(spec), name || 'Gráfico');
    if (spec.note) s.text(x, y + h + 4, w, 36, s.para(spec.note, { sz: 10, col: th.muted, i: true, font: th.fontBody }), { name: 'Nota do gráfico' });
  };
  const hero = (() => { try { return kpiCards(P.built, LANG, T)[0] || null; } catch (e) { return null; } })();
  // 1) título
  { const s = new PxSlide(bgS); logo(s);
    s.text(56, 190, 1100, 200, s.para(titleOf(P), { sz: 54, b: true, col: th.fg, font: th.fontTitle, ln: 95 }), { name: 'Título', anchor: 'b' });
    s.text(56, 404, 1000, 60, s.para(subtitleOf(P), { sz: 16, col: th.muted, font: th.fontBody }), { name: 'Subtítulo' });
    if (hero) { s.text(56, 480, 700, 110, s.para(kpiFmt(hero), { sz: 72, b: true, col: acc, font: th.fontTitle }), { name: 'Indicador principal' }); s.text(60, 590, 700, 30, s.para(String(hero.label).toUpperCase(), { sz: 12, col: th.muted, font: th.fontBody }), { name: 'Rótulo do indicador' }); }
    foot(s, 1); slides.push(s); }
  // 2) o gráfico
  { const s = new PxSlide(bgS); logo(s); s.text(56, 70, 1168, 40, s.para(TT.chart, { sz: 26, b: true, col: th.fg, font: th.fontTitle }), { name: 'Título do slide' });
    const spec = pxSpec(P, null); const ins = (P.insights || []).slice(0, 3); const ch = ins.length ? 380 : 500;
    if (spec) place(s, spec, 56, 118, 1168, ch, 'Gráfico principal');
    if (ins.length) { const w = (1168 - 24 * (ins.length - 1)) / ins.length; ins.forEach((it, i) => { const x = 56 + i * (w + 24); s.rect(x, 560 + 0, 4, 100, acc, { name: 'Barra' }); s.text(x + 16, 556, w - 16, 110, s.para(it.text, { sz: 14, col: th.fg, font: th.fontBody }), { name: 'Insight ' + (i + 1) }); }); }
    foot(s, total() + 1); slides.push(s); }
  // 3) a história
  story.forEach(st => {
    const s = new PxSlide(bgS); logo(s);
    const list = st.type === 'impl' || st.type === 'plan' ? (st.lines || (st.rows || []).map(r => r.a)) : null, spec = list || st.synthetic ? null : (st.viz ? { type: 'bar', dir: 'bar', grouping: 'clustered', cats: st.viz.rows.map(r => r.ks || r.k), series: [{ name: st.viz.title, vals: st.viz.rows.map(r => pxNum(r.p)), color: acc }], labels: true, legend: false, fmt: '0.0"%"' } : pxSpec(P, st.state));
    const kick = `${st.kick.n} · ${String(st.kick.label).toUpperCase()}`;
    s.text(56, 76, 520, 24, s.para(kick, { sz: 12, b: true, col: acc, font: 'Courier New' }), { name: 'Rótulo' });
    if (list) {
      s.text(56, 118, 1100, 480, list.map(l => s.para(l || TT.ph, { sz: 24, col: l ? th.fg : th.muted, i: !l, font: th.fontBody, bullet: true, bulletCol: acc, after: 14 })), { name: 'Itens' });
    } else {
      const head = st.head || '', hs = pxFit(head.length), wide = !spec;
      s.text(56, 112, wide ? 1100 : 500, 190, s.para(head || TT.ph, { sz: hs, b: !!head, col: head ? th.fg : th.muted, i: !head, font: th.fontTitle, ln: 100 }), { name: 'Frase' });
      let y = 112 + Math.min(190, Math.ceil(Math.max(1, head.length) / (wide ? 55 : 24)) * hs * 1.5 + 12);
      if (st.note !== undefined && (st.note || st.blank)) { s.text(56, y, wide ? 1100 : 500, 44, s.para(st.note || TT.ph, { sz: 12, col: th.muted, i: true, font: th.fontBody }), { name: 'Nota' }); y += 48; }
      if (st.big) { s.text(56, Math.max(y, 300), 500, 80, s.para(String(st.big.text), { sz: 54, b: true, col: acc, font: th.fontTitle }), { name: 'Número em destaque' }); s.text(58, Math.max(y, 300) + 78, 500, 24, s.para(String(st.big.label).toUpperCase(), { sz: 10, col: th.muted, font: th.fontBody }), { name: 'Rótulo do número' }); y = Math.max(y, 300) + 112; }
      const rows = st.calc && st.calc.rows ? st.calc.rows.slice(0, 6).map(r => [String(r.k), `${r.v}${r.n ? ` · ${fmtInt(r.n, LANG)} ${T('calc_rows')}` : ''}`]) : [];
      if (rows.length) { s.text(56, Math.min(y, 676 - 28 * rows.length - 40), 500, 20, s.para(`${TT.calc}: ${st.calc.title}`, { sz: 10, col: th.muted, b: true, font: th.fontBody }), { name: 'Título do cálculo' }); s.table(56, Math.min(y + 22, 676 - 28 * rows.length - 18), 500, rows, { line: th.grid, col: th.fg, font: th.fontBody, sz: 11, rowH: 26, name: 'Cálculo' }); }
    }
    if (spec) place(s, spec, 596, 84, 628, spec.note ? 560 : 590, 'Gráfico do slide');
    foot(s, total() + 1); slides.push(s);
  });
  // 4) resumo
  { const s = new PxSlide(bgS); logo(s); s.text(56, 70, 1168, 40, s.para(TT.end, { sz: 26, b: true, col: th.fg, font: th.fontTitle }), { name: 'Título do slide' });
    const lines = story.filter(x => !x.synthetic && x.head).slice(0, 5).map(x => x.head); const ph = !lines.length;
    s.text(56, 130, 1100, 460, (ph ? [TT.ph] : lines).map(l => s.para(l, { sz: 22, col: ph ? th.muted : th.fg, i: ph, font: th.fontBody, bullet: true, bulletCol: acc, after: 14 })), { name: 'Resumo' });
    s.text(56, 620, 600, 36, s.para(DV_SITE, { sz: 18, b: true, col: acc, font: th.fontTitle }), { name: 'Site' }); foot(s, total() + 1); slides.push(s); }
  return { slides, charts, th, P };
}

function pxPackage(deck) {
  const enc = new TextEncoder(), { slides, charts, th, P } = deck, files = [], E = s => enc.encode(s), name = titleOf(P);
  const ct = [`<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`, `<Default Extension="xml" ContentType="application/xml"/>`, `<Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/>`,
    `<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>`, `<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>`, `<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>`, `<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>`,
    `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>`, `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>`];
  slides.forEach((_, i) => ct.push(`<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`));
  charts.forEach((_, i) => ct.push(`<Override PartName="/ppt/charts/chart${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`));
  files.push({ name: '[Content_Types].xml', data: E(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${ct.join('')}</Types>`) });
  files.push({ name: '_rels/.rels', data: E(pxRels([{ id: 'rId1', type: PX_REL + '/officeDocument', target: 'ppt/presentation.xml' }, { id: 'rId2', type: 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties', target: 'docProps/core.xml' }, { id: 'rId3', type: PX_REL + '/extended-properties', target: 'docProps/app.xml' }])) });
  const iso = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  files.push({ name: 'docProps/core.xml', data: E(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${pxEsc(name)}</dc:title><dc:creator>Datavix</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified></cp:coreProperties>`) });
  files.push({ name: 'docProps/app.xml', data: E(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Datavix</Application><Slides>${slides.length}</Slides></Properties>`) });
  const pres = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${PX_NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${PX.W}" cy="${PX.H}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></p:defaultTextStyle></p:presentation>`;
  files.push({ name: 'ppt/presentation.xml', data: E(pres) });
  files.push({ name: 'ppt/_rels/presentation.xml.rels', data: E(pxRels([{ id: 'rId1', type: PX_REL + '/slideMaster', target: 'slideMasters/slideMaster1.xml' }, ...slides.map((_, i) => ({ id: `rId${i + 2}`, type: PX_REL + '/slide', target: `slides/slide${i + 1}.xml` })), { id: `rId${slides.length + 2}`, type: PX_REL + '/theme', target: 'theme/theme1.xml' }])) });
  files.push({ name: 'ppt/theme/theme1.xml', data: E(pxTheme(th, name)) });
  const mid = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster ${PX_NS}><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${pxHex(th.base)}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree>${PX_GRP}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="4400"/></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></p:otherStyle></p:txStyles></p:sldMaster>`;
  files.push({ name: 'ppt/slideMasters/slideMaster1.xml', data: E(mid) });
  files.push({ name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', data: E(pxRels([{ id: 'rId1', type: PX_REL + '/slideLayout', target: '../slideLayouts/slideLayout1.xml' }, { id: 'rId2', type: PX_REL + '/theme', target: '../theme/theme1.xml' }])) });
  files.push({ name: 'ppt/slideLayouts/slideLayout1.xml', data: E(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout ${PX_NS} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${PX_GRP}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`) });
  files.push({ name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data: E(pxRels([{ id: 'rId1', type: PX_REL + '/slideMaster', target: '../slideMasters/slideMaster1.xml' }])) });
  slides.forEach((s, i) => {
    files.push({ name: `ppt/slides/slide${i + 1}.xml`, data: E(s.xml()) });
    files.push({ name: `ppt/slides/_rels/slide${i + 1}.xml.rels`, data: E(pxRels([{ id: 'rId1', type: PX_REL + '/slideLayout', target: '../slideLayouts/slideLayout1.xml' }, ...s.rel])) });
  });
  charts.forEach((c, i) => {
    files.push({ name: `ppt/charts/chart${i + 1}.xml`, data: E(c.xml) });
    files.push({ name: `ppt/charts/_rels/chart${i + 1}.xml.rels`, data: E(pxRels([{ id: 'rId1', type: PX_REL + '/package', target: `../embeddings/Microsoft_Excel_Sheet${i + 1}.xlsx` }])) });
    files.push({ name: `ppt/embeddings/Microsoft_Excel_Sheet${i + 1}.xlsx`, data: new Uint8Array(0), blob: pxXlsx(c.rows) });
  });
  return files;
}
async function buildPptx(P) {
  const deck = pxDeck(P), files = pxPackage(deck);
  for (const f of files) if (f.blob) f.data = new Uint8Array(await f.blob.arrayBuffer());
  return zipStore(files.map(f => ({ name: f.name, data: f.data })));
}
