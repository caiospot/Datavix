// Gera canais.csv: receita mensal por canal de venda, 2019 a 2024 (dados inventados para teste). Uso: node dados-teste/gerar-canais.mjs
import fs from 'node:fs';
let seed = 77; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const canais = [['Loja física', 520, 0.004], ['E-commerce', 120, 0.02], ['Marketplace', 60, 0.026], ['Atacado', 300, 0.006], ['Representantes', 210, -0.004], ['App próprio', 0, 0.03], ['Televendas', 150, -0.012]];
const rows = [['Mês', 'Canal', 'Pedidos', 'Receita']];
for (let m = 0; m < 72; m++) {
  const y = 2019 + Math.floor(m / 12), mo = m % 12, date = `${y}-${String(mo + 1).padStart(2, '0')}-01`, sea = 1 + 0.18 * Math.sin((mo - 8) / 12 * Math.PI * 2);
  canais.forEach(([nome, base, g], i) => {
    if (nome === 'App próprio' && m < 30) return;
    const v = Math.max(5, (base || 80) * Math.pow(1 + g, m) * sea * (0.9 + rnd() * 0.2)), ped = Math.round(v * (6 + rnd() * 3));
    rows.push([date, nome, ped, Math.round(v * 1000)]);
  });
}
fs.writeFileSync(new URL('./canais.csv', import.meta.url), rows.map(r => r.join(',')).join('\n'));
console.log('canais.csv', rows.length - 1, 'linhas');
