// Gera os dados de teste sintéticos (determinísticos). Uso: node gerar.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const XLSX = require('../vendor/xlsx.full.min.js');

let seed = 42;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const pad = n => String(n).padStart(2, '0');
const brNum = (n, d = 2) => n.toFixed(d).replace('.', ',');

const UFS = { SP: 'Sudeste', RJ: 'Sudeste', MG: 'Sudeste', ES: 'Sudeste', PR: 'Sul', SC: 'Sul', RS: 'Sul', BA: 'Nordeste', PE: 'Nordeste', CE: 'Nordeste', GO: 'Centro-Oeste', DF: 'Centro-Oeste', AM: 'Norte', PA: 'Norte' };
const UFW = { SP: 10, RJ: 5, MG: 5, ES: 1.5, PR: 3, SC: 2.5, RS: 3, BA: 2.5, PE: 2, CE: 2, GO: 2, DF: 1.5, AM: 1, PA: 1.2 };
const CATS = { Eletrônicos: ['Notebook', 'Celular', 'Fone', 'Monitor'], Casa: ['Sofá', 'Fogão', 'Geladeira'], Moda: ['Camiseta', 'Tênis', 'Jaqueta'], Mercado: ['Café', 'Arroz', 'Azeite'] };
const ufList = Object.keys(UFS);
const wTotal = ufList.reduce((s, u) => s + UFW[u], 0);
const pickUF = () => { let r = rnd() * wTotal; for (const u of ufList) { r -= UFW[u]; if (r <= 0) return u; } return 'SP'; };

// vendas.csv: 50 mil linhas, 2022-01 a 2024-12, pt-BR (';', vírgula decimal, dd/mm/aaaa), Latin-1
const lines = ['Data;UF;Região;Categoria;Produto;Quantidade;Receita;Margem'];
const start = new Date(2022, 0, 1), days = 1096;
for (let i = 0; i < 50000; i++) {
  const d = new Date(start.getTime() + Math.floor(rnd() * days) * 86400000);
  const m = d.getMonth(), t = (d - start) / (days * 86400000);
  const uf = pickUF(), cat = pick(Object.keys(CATS)), prod = pick(CATS[cat]);
  const sazon = 1 + (m === 10 ? 0.6 : m === 11 ? 0.9 : m === 0 ? -0.2 : 0);
  const q = 1 + Math.floor(rnd() * 5);
  const rec = (80 + rnd() * 900) * q * sazon * (1 + t * 0.35) * (cat === 'Eletrônicos' ? 2.2 : cat === 'Mercado' ? 0.3 : 1);
  const margem = 4 + rnd() * 26 + (cat === 'Moda' ? 10 : 0);
  const nul = rnd() < 0.01;
  lines.push([`${pad(d.getDate())}/${pad(m + 1)}/${d.getFullYear()}`, uf, UFS[uf], cat, prod, q, nul ? '' : brNum(rec), brNum(margem, 1) + '%'].join(';'));
}
fs.writeFileSync('vendas.csv', Buffer.from(lines.join('\r\n') + '\r\n', 'latin1'));

// financeiro.xlsx: 2 abas, 2 mil linhas, nulos e datas mistas (serial Excel + texto)
const areas = ['Comercial', 'Operações', 'TI', 'RH', 'Marketing'];
const rows = [['Data', 'Área', 'Conta', 'Orçado', 'Realizado']];
for (let i = 0; i < 2000; i++) {
  const d = new Date(2023, Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28));
  const orc = Math.round(5000 + rnd() * 45000);
  const real = rnd() < 0.03 ? null : Math.round(orc * (0.7 + rnd() * 0.6));
  rows.push([i % 5 === 0 ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : d, pick(areas), pick(['Pessoal', 'Fornecedores', 'Viagens', 'Software', 'Mídia']), orc, real]);
}
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows, { cellDates: true }), 'Lançamentos');
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Área', 'Responsável'], ...areas.map(a => [a, 'n/d'])]), 'Áreas');
fs.writeFileSync('financeiro.xlsx', XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellDates: true }));

// fluxo.csv: origem;destino;valor (para sankey, gate 3)
const fl = ['Origem;Destino;Valor'];
for (const o of ['Orgânico', 'Pago', 'Indicação', 'Email'])
  for (const m of ['Visita', 'Cadastro']) fl.push(`${o};${m};${Math.round(500 + rnd() * 4000)}`);
for (const m of ['Visita', 'Cadastro']) for (const f of ['Compra', 'Abandono']) fl.push(`${m};${f};${Math.round(300 + rnd() * 3000)}`);
fs.writeFileSync('fluxo.csv', fl.join('\n') + '\n', 'utf8');
console.log('ok');
