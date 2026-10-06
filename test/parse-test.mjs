// Roda o worker do parser em Node (simulando self/postMessage) e confere os resultados.
import fs from 'node:fs';
import vm from 'node:vm';
const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const msgs = [];
const ctx = { console, TextDecoder, Uint8Array, Float64Array, Int32Array, Date, Map, Set, Math, Number, String, Array, Object, RegExp, Error, JSON, setTimeout, clearTimeout,
  postMessage: m => msgs.push(m) };
ctx.self = ctx; ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(read('vendor/papaparse.min.js'), ctx);
vm.runInContext(read('vendor/xlsx.full.min.js'), ctx);
vm.runInContext(read('src/parser.worker.js'), ctx);

async function run(file, extra = {}, abs = false) {
  const buf = fs.readFileSync(abs ? file : new URL('../dados-teste/' + file, import.meta.url));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  msgs.length = 0;
  const t = performance.now();
  ctx.self.onmessage({ data: { type: 'load', name: file, buffer: ab, ...extra } });
  const ms = Math.round(performance.now() - t);
  const last = msgs.filter(m => m.type !== 'progress').pop();
  console.log(`\n== ${file}  (${ms} ms)`);
  if (last.type === 'error') return console.log('ERRO', last.message);
  if (last.type === 'sheets') { console.log('abas:', last.names); return last; }
  console.log(`linhas=${last.rowCount} enc=${last.encoding} delim=${JSON.stringify(last.delimiter)} dup=${last.dupRows}`);
  for (const c of last.columns) {
    const extra = c.kind === 'number' ? `min=${c.min} max=${c.max} un=${c.unit} out=${c.outliers}` : c.kind === 'date' ? `${new Date(c.min).toISOString().slice(0,10)} → ${new Date(c.max).toISOString().slice(0,10)} ord=${c.order} amb=${c.ambiguous}` : c.dict ? `distintos=${c.distinct} ex=${process.env.SHOW_VALUES ? c.dict.slice(0,3) : '(valores ocultos)'}` : '';
    console.log(`  ${c.name.padEnd(12)} ${c.kind.padEnd(9)} nulos=${String(c.nulls).padEnd(4)} ${extra}`);
  }
}
// uso: node test/parse-test.mjs /caminho/arquivo.xlsx [nome da aba]  (valores das células não são impressos, só nomes e tipos)
const arg = process.argv[2];
if (arg) { const r = await run(arg, process.argv[3] ? { sheet: process.argv[3] } : {}, true); }
else {
  await run('vendas.csv');
  await run('fluxo.csv');
  await run('financeiro.xlsx');
  await run('financeiro.xlsx', { sheet: 'Lançamentos' });
}
