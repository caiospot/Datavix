// Gera lojas.csv: receita mensal de 10 lojas por segmento (B2B e B2C), 2022 a 2024 (dados inventados). Uso: node dados-teste/gerar-lojas.mjs
import fs from 'node:fs';
let seed = 909; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const lojas = ['Centro', 'Norte Shopping', 'Aeroporto', 'Zona Sul', 'Outlet', 'Praça Mayor', 'Beira-Mar', 'Parque', 'Terminal', 'Universitária'];
const rows = [['Mês', 'Loja', 'Segmento', 'Receita', 'Tickets']];
for (let m = 0; m < 36; m++) {
  const y = 2022 + Math.floor(m / 12), mo = m % 12, date = `${y}-${String(mo + 1).padStart(2, '0')}-01`;
  lojas.forEach((l, i) => ['B2C', 'B2B'].forEach((seg, k) => {
    const base = (60 + i * 18) * (k ? 0.55 : 1) * (1 + 0.012 * m * (k ? 1.6 : 0.6)), peak = 1 + 0.45 * Math.exp(-Math.pow((mo - (i % 12)) / 2.2, 2)), v = base * peak * (0.85 + rnd() * 0.3);
    rows.push([date, l, seg, Math.round(v * 1000), Math.round(v * 11)]);
  }));
}
fs.writeFileSync(new URL('./lojas.csv', import.meta.url), rows.map(r => r.join(',')).join('\n'));
console.log('lojas.csv', rows.length - 1, 'linhas');
