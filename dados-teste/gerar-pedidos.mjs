// Gera pedidos.csv: 900 pedidos (uma linha por pedido), 8 categorias, com comentário longo (dados inventados). Uso: node dados-teste/gerar-pedidos.mjs
import fs from 'node:fs';
let seed = 4242; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const cats = [['Alimentos', 1], ['Bebidas', 0.7], ['Limpeza', 0.5], ['Higiene', 0.55], ['Eletrônicos', 4], ['Papelaria', 0.35], ['Brinquedos', 1.2], ['Jardinagem', 0.9]];
const obs = ['Entrega antecipada a pedido do cliente, com conferência de itens na doca e aceite assinado pelo responsável da unidade de destino.', 'Pedido recorrente, sem divergências desde o início do contrato; reposição automática ativada para os itens de maior giro.', 'Cliente pediu revisão de preço após a negociação do trimestre; condição especial aprovada pela diretoria comercial em reunião de segunda-feira.'];
const rows = [['Pedido', 'Data', 'Categoria', 'Valor', 'Observação']];
for (let i = 0; i < 900; i++) {
  const [c, mult] = cats[Math.floor(Math.pow(rnd(), 1.4) * cats.length)], d = new Date(Date.UTC(2024, 0, 1) + Math.floor(rnd() * 240) * 86400000);
  rows.push([`PED-${String(i + 1).padStart(4, '0')}`, d.toISOString().slice(0, 10), c, Math.round(200 + Math.pow(rnd(), 2.6) * 9000 * mult), obs[Math.floor(rnd() * obs.length)]]);
}
fs.writeFileSync(new URL('./pedidos.csv', import.meta.url), rows.map(r => r.map(v => (typeof v === 'string' && /[",]/.test(v) ? `"${v}"` : v)).join(',')).join('\n'));
console.log('pedidos.csv', rows.length - 1, 'linhas');
