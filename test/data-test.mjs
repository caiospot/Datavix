import fs from 'node:fs';
import vm from 'node:vm';
const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const msgs = [];
const ctx = { console, TextDecoder, Uint8Array, Float64Array, Int32Array, Date, Map, Set, Math, Number, String, Array, Object, RegExp, Error, JSON, Intl, performance, postMessage: m => msgs.push(m) };
ctx.self = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['vendor/papaparse.min.js', 'vendor/xlsx.full.min.js', 'src/parser.worker.js']) vm.runInContext(read(f), ctx);
const buf = fs.readFileSync(new URL('../dados-teste/vendas.csv', import.meta.url));
ctx.self.onmessage({ data: { type: 'load', name: 'vendas.csv', buffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) } });
const ds = msgs.filter(m => m.type === 'dataset').pop();
vm.runInContext(read('src/data.js') + '\nglobalThis.__D={suggestMapping,buildSeries,chooseChart,computeInsights,fmtNum};', ctx);
const D = ctx.__D;
const T = (k, ...a) => `${k}(${a.join(', ')})`;
const brief = { audience: 'director', decision: 'invest', story: 'time' };
let m = D.suggestMapping('time', ds.columns);
console.log('map time', JSON.stringify(m), 'x=', ds.columns[m.x].name, 'y=', ds.columns[m.y].name, 's=', ds.columns[m.series]?.name);
let t0 = performance.now();
let b = D.buildSeries(ds, m, { lang: 'pt' });
console.log('time build', Math.round(performance.now() - t0), 'ms', JSON.stringify(b.stats), b.grain, b.period);
const totalEngine = b.totX.reduce((s, t) => s + t.value, 0);
console.log('soma motor', totalEngine.toFixed(2));
console.log('chart', JSON.stringify(D.chooseChart(brief, m, b)));
console.log(D.computeInsights(b, brief, 'pt', T).map(i => i.id + ' -> ' + i.text));
for (const st of ['comparison', 'composition', 'relation', 'distribution']) {
  const mm = D.suggestMapping(st === 'comparison' ? 'compare' : st, ds.columns);
  const bb = D.buildSeries(ds, mm, { lang: 'pt' });
  console.log(st, mm.kind, 'x=', ds.columns[mm.x]?.name, 'y=', ds.columns[mm.y]?.name, 'pts=', bb.stats.points, JSON.stringify(D.chooseChart({ ...brief, story: st }, mm, bb)));
}

// organismo radial: período > entidade > registro
for (const st of ['time', 'compare']) {
  const mm = D.suggestMapping(st, ds.columns), t = performance.now(), bb = D.buildSeries(ds, mm, { lang: 'pt' });
  const o = bb.org;
  console.log('organismo', st, o ? `hub=${o.hubName} ent=${o.entName} cor=${o.colName} tam=${o.sizeName} | ${o.hubs.length} períodos, ${o.ents.length} entidades, ${o.cols.length} cores, ${o.leaves.length} folhas (${o.perRow ? 'por linha' : 'agregadas'}) | ${Math.round(performance.now() - t)} ms` : 'indisponível', '| primário:', D.chooseChart({ audience: 'director', decision: 'invest', story: st }, mm, bb).primary);
  if (o) { const soma = o.leaves.reduce((a, l) => a + l[3], 0), somaH = o.hubs.reduce((a, h) => a + h.v, 0), somaE = o.ents.reduce((a, h) => a + h.v, 0); console.log('  soma folhas', soma.toFixed(2), '= períodos', somaH.toFixed(2), '= entidades', somaE.toFixed(2)); }
}
