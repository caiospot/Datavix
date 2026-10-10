// Bateria sintética para calibrar o motor de história. Uso: node dados-teste/gerar-bateria.mjs
// Escreve dados-teste/bateria/*.csv e bateria.json (o que foi plantado em cada planilha). Tudo é inventado e determinístico (semente fixa).
import fs from 'node:fs';
const out = new URL('./bateria/', import.meta.url); fs.mkdirSync(out, { recursive: true });
let seed = 20261010; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pick = (a, w) => { if (!w) return a[Math.floor(rnd() * a.length)]; let t = w.reduce((x, y) => x + y, 0), r = rnd() * t; for (let i = 0; i < a.length; i++) { r -= w[i]; if (r <= 0) return a[i]; } return a[a.length - 1]; };
const norm = (m, s) => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const logn = (m, s) => Math.exp(norm(Math.log(m), s));
const P2 = n => String(n).padStart(2, '0'), iso = d => `${d.getUTCFullYear()}-${P2(d.getUTCMonth() + 1)}-${P2(d.getUTCDate())}`, br = d => `${P2(d.getUTCDate())}/${P2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
const day = (y, m, d, k = 0) => new Date(Date.UTC(y, m - 1, d + k));
const man = {}; const write = (name, header, rows, plant) => { fs.writeFileSync(new URL(name + '.csv', out), [header.join(';'), ...rows.map(r => r.join(';'))].join('\n') + '\n'); man[name] = { rows: rows.length, plant }; };
const r2 = x => Math.round(x * 100) / 100;

// 1) vendas com sazonalidade, tendência de alta e líder claro
{ const reg = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'], wr = [45, 20, 18, 10, 7], prod = ['Notebook', 'Celular', 'Monitor', 'Teclado', 'Mouse', 'Fone'], rows = [];
  for (let i = 0; i < 1800; i++) { const k = Math.floor(rnd() * 730), d = day(2024, 1, 1, k), t = k / 730, seas = 1 + 0.5 * (d.getUTCMonth() === 11 ? 1 : 0) + 0.2 * Math.sin(2 * Math.PI * k / 365), qtd = Math.max(1, Math.round(norm(3, 1.2))), pu = 150, rec = r2(qtd * pu * (1 + 0.9 * t) * seas * (0.9 + rnd() * 0.2)); rows.push([iso(d), pick(reg, wr), pick(prod), qtd, rec]); }
  write('vendas_sazonal', ['Data', 'Região', 'Produto', 'Quantidade', 'Receita'], rows, { trend: 'up', leader: 'Sudeste' }); }
// 2) série plana e categorias equilibradas: nada a dizer sobre tendência
{ const lojas = ['A', 'B', 'C', 'D', 'E'], rows = []; for (let i = 0; i < 1500; i++) { const k = Math.floor(rnd() * 730), d = day(2024, 1, 1, k); rows.push([iso(d), pick(lojas), r2(norm(1000, 120))]); }
  write('vendas_plana', ['Data', 'Loja', 'Receita'], rows, { forbid: ['trend'], balanced: true }); }
// 3) pesquisa NPS: telefone pior que os outros
{ const canais = ['App', 'Site', 'Telefone', 'Loja'], rows = []; for (let i = 0; i < 900; i++) { const c = pick(canais, [35, 30, 15, 20]), base = c === 'Telefone' ? 5.2 : 8.1, nota = Math.max(0, Math.min(10, Math.round(norm(base, 1.8)))); rows.push([100000 + i, iso(day(2025, 1, 1, Math.floor(rnd() * 270))), c, nota, pick(['SIM', 'NÃO'], [70, 30])]); }
  write('nps_pesquisa', ['Protocolo', 'Data', 'Canal', 'Nota NPS', 'Resolvido'], rows, { lowGroup: 'Telefone' }); }
// 4) folha de pagamento: ID numérico, salário assimétrico, um departamento mais caro
{ const dep = ['TI', 'Vendas', 'RH', 'Financeiro', 'Operações'], rows = []; for (let i = 0; i < 600; i++) { const d = pick(dep, [20, 25, 8, 12, 35]), base = d === 'TI' ? 9000 : 4500, sal = Math.round(logn(base, 0.55)); rows.push([5000 + i, d, pick(['Júnior', 'Pleno', 'Sênior']), sal, iso(day(2015, 1, 1, Math.floor(rnd() * 3500)))]); }
  write('rh_folha', ['Matrícula', 'Departamento', 'Nível', 'Salário', 'Admissão'], rows, { dist: true, noAssocWith: ['Matrícula'], idCols: ['Matrícula'] }); }
// 5) campanhas de marketing: gasto e cliques andam juntos; uma campanha atípica
{ const can = ['Busca', 'Social', 'Email', 'Display'], rows = []; for (let i = 0; i < 360; i++) { const c = pick(can), gasto = r2(logn(800, 0.6)), cliques = Math.round(gasto * (c === 'Display' ? 0.4 : 1.2) * (0.8 + rnd() * 0.4)), conv = Math.round(cliques * (c === 'Email' ? 0.08 : 0.03) * (0.7 + rnd() * 0.6)); rows.push(['C' + P2(i % 24), c, gasto, cliques, conv, r2(conv * pick([90, 110, 130]))]); }
  rows[5][2] = 90000; write('marketing_campanhas', ['Campanha', 'Canal', 'Gasto', 'Cliques', 'Conversões', 'Receita'], rows, { assoc: true, outliers: true }); }
// 6) saúde: espera com cauda longa e uma unidade pior
{ const un = ['Centro', 'Norte', 'Sul', 'Leste'], rows = []; for (let i = 0; i < 1200; i++) { const u = pick(un), esp = Math.round(logn(u === 'Norte' ? 55 : 28, 0.6)); rows.push([iso(day(2025, 1, 1, Math.floor(rnd() * 240))), u, esp, pick(['SIM', 'NÃO'], [92, 8])]); }
  write('saude_atendimentos', ['Data', 'Unidade', 'Espera (min)', 'Atendido'], rows, { dist: true, outliers: true, lowGroup: 'Norte' }); }
// 7) educação: nota e frequência andam juntas (moderado)
{ const tur = ['6A', '6B', '7A', '7B', '8A'], rows = []; for (let i = 0; i < 500; i++) { const f = Math.max(40, Math.min(100, Math.round(norm(85, 12)))), n = Math.max(0, Math.min(10, r2(norm(2 + f * 0.06, 1.2)))); rows.push([20000 + i, pick(tur), pick(['Mat', 'Port', 'Hist', 'Ciên']), n, f]); }
  write('educacao_notas', ['Aluno', 'Turma', 'Disciplina', 'Nota', 'Frequência (%)'], rows, { assoc: true, noAssocWith: ['Aluno'], idCols: ['Aluno'] }); }
// 8) orçamento público: executado é quase um múltiplo do orçado (relação mecânica, não é achado)
{ const rows = []; for (let i = 0; i < 120; i++) { const orc = Math.round(logn(5e6, 0.9)); rows.push(['Município ' + (i + 1), pick(['SP', 'MG', 'BA', 'RS', 'PR']), orc, Math.round(orc * 0.9 * (0.995 + rnd() * 0.01))]); }
  write('publico_orcamento', ['Município', 'UF', 'Orçado', 'Executado'], rows, { forbidAssoc: true }); }
// 9) armadilha de identificadores numéricos
{ const rows = []; for (let i = 0; i < 400; i++) rows.push([String(Math.floor(10000000 + rnd() * 89999999)), String(11900000000 + Math.floor(rnd() * 99999999)), 700 + i, pick(['Pago', 'Pendente', 'Cancelado'], [70, 20, 10]), r2(logn(250, 0.7))]);
  write('armadilha_ids', ['CEP', 'Telefone', 'Código', 'Situação', 'Valor'], rows, { noAssocWith: ['CEP', 'Telefone', 'Código'], idCols: ['CEP', 'Telefone', 'Código'] }); }
// 10) pouquíssimas linhas
{ const rows = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro', 'Serra', 'Praia', 'Vale', 'Mata', 'Lago', 'Ilha', 'Rio'].map((r, i) => [r, 100 + i * 7]); write('pequena', ['Região', 'Valor'], rows, { small: true }); }
// 11) 35% de valores faltantes
{ const rows = []; for (let i = 0; i < 800; i++) rows.push([iso(day(2025, 1, 1, Math.floor(rnd() * 300))), pick(['A', 'B', 'C']), rnd() < 0.35 ? '' : r2(norm(500, 90))]); write('dados_faltantes', ['Data', 'Grupo', 'Valor'], rows, { missing: true }); }
// 12) negativos e zeros (lucro e prejuízo)
{ const un = ['Alfa', 'Beta', 'Gama', 'Delta', 'Épsilon'], rows = []; for (let i = 0; i < 500; i++) { const u = pick(un); rows.push([iso(day(2025, 1, 1, Math.floor(rnd() * 300))), u, rnd() < 0.15 ? 0 : r2(norm(u === 'Delta' ? -300 : 200, 250))]); }
  write('negativos_zero', ['Data', 'Unidade', 'Resultado'], rows, { negatives: true }); }
// 13) um cliente concentra a receita
{ const rows = []; for (let i = 0; i < 700; i++) { const c = rnd() < 0.55 ? 'Cliente Alfa' : 'Cliente ' + (1 + Math.floor(rnd() * 120)); rows.push([iso(day(2025, 1, 1, Math.floor(rnd() * 300))), c, r2(logn(c === 'Cliente Alfa' ? 4000 : 900, 0.5))]); }
  write('concentrado', ['Data', 'Cliente', 'Receita'], rows, { dominant: 'Cliente Alfa' }); }
// 14) formatos brasileiros: moeda e datas dd/mm/aaaa
{ const rows = []; for (let i = 0; i < 500; i++) { const v = r2(logn(1200, 0.6)); rows.push([br(day(2025, 1, 1, Math.floor(rnd() * 300))), pick(['Filial 1', 'Filial 2', 'Filial 3']), 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')]); }
  write('formato_brasil', ['Data', 'Filial', 'Valor'], rows, { parse: true }); }
// 15) pivot largo: meses em colunas
{ const mes = ['jan/25', 'fev/25', 'mar/25', 'abr/25', 'mai/25', 'jun/25'], rows = ['Produto A', 'Produto B', 'Produto C', 'Produto D'].map((p, i) => [p, ...mes.map((m, k) => Math.round((100 + i * 40) * (1 + k * 0.08) * (0.9 + rnd() * 0.2)))]); write('pivot_largo', ['Produto', ...mes], rows, { unpivot: true }); }
// 16) texto livre com categorias
{ const t = ['entrega atrasou', 'produto veio com defeito', 'atendimento demorado', 'cobrança indevida', 'tudo certo', 'prazo cumprido'], rows = []; for (let i = 0; i < 600; i++) rows.push([200000 + i, pick(['Loja', 'App', 'Site']), pick(t, [30, 12, 20, 8, 15, 15]) + ' ' + pick(['no pedido', 'ontem', 'de novo', '']), pick(['SIM', 'NÃO'])]);
  write('texto_livre', ['Protocolo', 'Canal', 'Comentário', 'Resolvido'], rows, { text: true }); }
fs.writeFileSync(new URL('bateria.json', out), JSON.stringify(man, null, 1));
console.log(Object.keys(man).length + ' planilhas em dados-teste/bateria/');
