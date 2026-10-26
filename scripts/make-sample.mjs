// Gera as planilhas fictícias das imagens do site (dados-teste/exemplo-vendas.csv e exemplo-corrida.csv em PT; sales-example.csv e race-example.csv em EN).
// Números sintéticos e determinísticos (mesma semente = mesmo arquivo): servem só para ilustrar. Uso: node scripts/make-sample.mjs
import fs from 'node:fs';
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rnd = mulberry(20261026);
const channels = [['E-commerce', 'E-commerce', 380e3, 0.010], ['Loja física', 'Stores', 520e3, -0.006], ['Marketplace', 'Marketplace', 210e3, 0.022], ['Parceiros', 'Partners', 120e3, 0.008], ['Televendas', 'Telesales', 90e3, -0.004], ['Aplicativo', 'App', 40e3, 0.045]];
const regions = [['Sudeste', 'Southeast', 0.42], ['Sul', 'South', 0.2], ['Nordeste', 'Northeast', 0.22], ['Centro-Oeste', 'Central-West', 0.09], ['Norte', 'North', 0.07]];
const season = m => [0.9, 0.92, 0.97, 1, 1.02, 1, 0.98, 1, 1.03, 1.06, 1.18, 1.3][m];
const rows = { pt: ['Mês,Canal,Região,Receita (R$),Pedidos'], en: ['Month,Channel,Region,Revenue (R$),Orders'] };
for (let i = 0; i < 36; i++) {
  const y = 2023 + Math.floor(i / 12), m = i % 12, d = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  for (const [pt, en, base, g] of channels) for (const [rpt, ren, w] of regions) {
    const rev = Math.round(base * Math.pow(1 + g, i) * season(m) * w * (0.93 + rnd() * 0.14)), ord = Math.max(1, Math.round(rev / (150 + rnd() * 60)));
    rows.pt.push(`${d},${pt},${rpt},${rev},${ord}`); rows.en.push(`${d},${en},${ren},${rev},${ord}`);
  }
}
// versão por canal e mês (sem região): serve à corrida de barras
const agg = (L, head) => { const m = new Map(); for (const r of rows[L].slice(1)) { const [d, c, , rev] = r.split(','); const k = d + '|' + c; m.set(k, (m.get(k) || 0) + +rev); } return [head, ...[...m].map(([k, v]) => k.split('|').join(',') + ',' + v)]; };
fs.writeFileSync('dados-teste/exemplo-corrida.csv', agg('pt', 'Mês,Canal,Receita (R$)').join('\n') + '\n'); fs.writeFileSync('dados-teste/race-example.csv', agg('en', 'Month,Channel,Revenue (R$)').join('\n') + '\n');
fs.writeFileSync('dados-teste/exemplo-vendas.csv', rows.pt.join('\n') + '\n'); fs.writeFileSync('dados-teste/sales-example.csv', rows.en.join('\n') + '\n');
console.log('linhas:', rows.pt.length - 1, '| exemplo-vendas.csv e sales-example.csv gravados');
