// Planilha sintética de projetos (dados fictícios): colunas curtas + textos explicativos longos.
import fs from 'node:fs';
let seed = 11; const r = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296, pick = a => a[Math.floor(r() * a.length)];
const clientes = ['Ambev','Porto Seguro','JBS','XP Investimentos','P&G','Unidas','Zoom & Buscapé','Americanas','LATAM','Itaú','Natura','Magalu','Vivo','Raízen','Suzano','Localiza','Embraer','Cimpor','Outback','Burger King','Basf','Red Bull','Seara','Bimbo','Loft','Quinto Andar','Azul','Caixa Seguros','HDI','Prudential'];
const setores = ['Agro','Agências','Alimentos e bebidas','Automotivo','B2B','Bens de consumo','Celebridade','Comunicação','Educação','Financeiro','Imobiliário','Saúde','Tecnologia','Turismo','Varejo'];
const status = ['Concluído','Em andamento','Pausado'], regioes = ['Sudeste','Sul','Nordeste','Centro-Oeste','Norte'], resp = ['Ana Lima','Bruno Reis','Carla Souza','Diego Alves','Elisa Prado'];
const desafios = ['A empresa tinha dados espalhados em dezenas de planilhas e não conseguia enxergar a jornada completa do cliente, o que atrasava decisões de investimento em mídia.','O time comercial relatava queda de conversão em algumas regiões, mas não havia uma forma confiável de separar efeito de preço, sazonalidade e mudança de mix.','A diretoria precisava priorizar entre vinte iniciativas concorrentes, sem um critério comum para comparar retorno esperado e risco operacional.','O modelo de previsão de demanda errava mais de 25% nas semanas de promoção, gerando ruptura em lojas e excesso de estoque em centros de distribuição.'];
const resultados = ['Foi construído um painel único com atualização diária, reduzindo de cinco dias para duas horas o tempo para fechar o relatório mensal e liberando o time para análises.','O novo modelo reduziu o erro de previsão para 9% e permitiu antecipar compras, com ganho estimado de 3,2 milhões de reais em margem no primeiro ano.','A priorização por retorno ajustado ao risco eliminou seis iniciativas de baixo impacto e concentrou o orçamento nas quatro com maior potencial de crescimento.'];
const abord = ['Combinamos dados transacionais, pesquisa de mercado e sinais externos em um único modelo, validado com testes A/B em três praças antes da expansão nacional para todas as unidades.','Usamos modelos de séries temporais com variáveis de calendário e preço, calibrados por região, e entregamos um simulador para o time testar cenários antes de decidir.'];
const rows = [['Data','Cliente','Setor','Valor do projeto','Status','Duração (meses)','Região','Responsável','Desafio','Abordagem','Resultado']];
for (let i = 0; i < 420; i++) {
  const y = 2018 + Math.floor(r() * 7), m = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 27);
  const big = r() < 0.07 ? 6 : 1, v = Math.round((40000 + r() * r() * 380000) * big);
  rows.push([`${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`, pick(clientes), pick(setores), String(v).replace('.', ','), pick(status), 2 + Math.floor(r() * 14), pick(regioes), pick(resp), pick(desafios), pick(abord), pick(resultados)]);
}
fs.writeFileSync(new URL('./projetos.csv', import.meta.url), rows.map(x => x.map(c => /[;"\n]/.test(String(c)) ? `"${c}"` : c).join(';')).join('\n'));
console.log('ok', rows.length - 1);
