// Gera funil.csv: 1800 leads passando por 4 etapas (canal, qualificação, proposta, resultado), com valor (dados inventados). Uso: node dados-teste/gerar-funil.mjs
import fs from 'node:fs';
let seed = 31337; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296, pick = w => { let r = rnd() * w.reduce((a, b) => a + b[1], 0); for (const [k, p] of w) { if ((r -= p) < 0) return k; } return w[0][0]; };
const rows = [['Lead', 'Canal', 'Qualificação', 'Proposta', 'Resultado', 'Valor']];
for (let i = 0; i < 1800; i++) {
  const canal = pick([['Orgânico', 4], ['Anúncios', 3], ['Indicação', 1.5], ['Eventos', 1], ['Outbound', 1.2]]);
  const q = rnd() < { Orgânico: 0.55, Anúncios: 0.38, Indicação: 0.8, Eventos: 0.62, Outbound: 0.3 }[canal] ? pick([['Quente', 1], ['Morno', 1.6]]) : 'Descartado';
  let prop = '', res = '';
  if (q !== 'Descartado' && rnd() < (q === 'Quente' ? 0.82 : 0.5)) { prop = pick([['Padrão', 3], ['Personalizada', 1.6]]); if (rnd() < (prop === 'Personalizada' ? 0.62 : 0.4)) res = rnd() < 0.55 ? 'Ganho' : 'Perdido'; }
  rows.push([`L${String(i + 1).padStart(4, '0')}`, canal, q, prop, res, Math.round(2000 + Math.pow(rnd(), 2) * 18000)]);
}
fs.writeFileSync(new URL('./funil.csv', import.meta.url), rows.map(r => r.join(',')).join('\n'));
console.log('funil.csv', rows.length - 1, 'linhas');
