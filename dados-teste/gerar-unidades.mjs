// Gera unidades.csv: 96 unidades de uma rede fictícia (uma linha por unidade), 6 regiões. Dados inventados para teste. Uso: node dados-teste/gerar-unidades.mjs
import fs from 'node:fs';
let seed = 20261005; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const regioes = { 'Norte': 10, 'Nordeste': 22, 'Centro-Oeste': 12, 'Sudeste': 30, 'Sul': 16, 'Exterior': 6 };
const nomes = ['Aurora', 'Boreal', 'Cedro', 'Delta', 'Estrela', 'Farol', 'Girassol', 'Horizonte', 'Ipê', 'Jasmim', 'Kairós', 'Lótus', 'Mirante', 'Nascente', 'Oásis', 'Pinheiro', 'Quartzo', 'Raiz', 'Savana', 'Topázio', 'Umbra', 'Vitória', 'Zênite', 'Atlântico', 'Brisa', 'Colina', 'Duna', 'Esmeralda', 'Fênix', 'Granito'];
const cidades = { 'Norte': ['Belém', 'Manaus', 'Palmas'], 'Nordeste': ['Recife', 'Salvador', 'Fortaleza', 'Natal'], 'Centro-Oeste': ['Goiânia', 'Cuiabá', 'Brasília'], 'Sudeste': ['Campinas', 'Santos', 'Niterói', 'Vitória', 'São Paulo'], 'Sul': ['Curitiba', 'Joinville', 'Porto Alegre'], 'Exterior': ['Lisboa', 'Madri', 'Miami'] };
const frases = ['Equipe elogiada pelo atendimento, mas o tempo de espera na hora do almoço ainda incomoda os clientes recorrentes e foi tema de três reuniões neste trimestre.', 'Reforma concluída no segundo semestre melhorou a circulação; falta sinalização nova no estacionamento e o acabamento do balcão principal segue pendente.', 'Unidade abriu há pouco tempo e ainda ajusta o mix de produtos; resultados sobem a cada mês conforme a equipe ganha experiência com o sistema.', 'Alta rotatividade de pessoal no último ano afetou o NPS; plano de retenção em andamento com bônus por permanência e trilha de formação interna.', 'Referência da região em reposição de estoque; modelo está sendo copiado por outras unidades e entra no manual de operações do próximo ciclo.'];
const rows = [['Unidade', 'Região', 'Cidade', 'NPS', 'Faturamento', 'Tickets', 'Comentário']]; let k = 0;
for (const [reg, n] of Object.entries(regioes)) for (let i = 0; i < n; i++, k++) {
  const base = { 'Norte': 58, 'Nordeste': 64, 'Centro-Oeste': 68, 'Sudeste': 72, 'Sul': 78, 'Exterior': 82 }[reg];
  const nps = Math.max(8, Math.min(97, Math.round(base + (rnd() - 0.5) * 34))), fat = Math.round((0.4 + Math.pow(rnd(), 1.6) * 5.2) * 1e6 * (reg === 'Sudeste' ? 1.3 : reg === 'Exterior' ? 1.5 : 1));
  rows.push([`${nomes[k % nomes.length]} ${String(k + 1).padStart(2, '0')}`, reg, cidades[reg][Math.floor(rnd() * cidades[reg].length)], nps, fat, Math.round(fat / (38 + rnd() * 30)), frases[Math.floor(rnd() * frases.length)]]);
}
const csv = rows.map(r => r.map(v => (typeof v === 'string' && /[",;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',')).join('\n');
fs.writeFileSync(new URL('./unidades.csv', import.meta.url), csv);
console.log('unidades.csv', rows.length - 1, 'linhas');
