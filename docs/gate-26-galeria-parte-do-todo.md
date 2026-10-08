# Gate 26 · Galeria de gráficos (1): parte do todo

Primeiro lote da expansão de gráficos, seguindo a taxonomia do Data Viz Project (comparação, correlação, distribuição, geoespacial, parte do todo, tendência no tempo). Este lote é **parte do todo** e traz a base comum para os próximos: `src/gallery.js`, um motor único de canvas (animação, mouse, estados e quadro estático) em que cada gráfico entrega só dados e geometria.

## Gráficos novos
- **Pizza** e **Rosca** (com o total no centro): uma fatia por categoria (as 7 maiores e "Outros"), rótulos com percentual e valor fora da pizza, sem sobreposição.
- **Várias pizzas** e **Várias roscas**: uma pizza ou rosca para cada grupo (até 12 painéis, os maiores), com as mesmas cores por categoria para comparar a composição; percentual dentro das fatias grandes e total no título de cada painel.
- **Bolhas agrupadas**: uma bolha por item (até 80), área proporcional ao valor, todas coladas num bloco só, cor pelo grupo dominante.
Já existiam: Dispersão (scatter) e Bolhas (bubble).

## Como se comportam (iguais aos demais gráficos de canvas)
- **Dados da planilha:** soma ou contagem (bolhas aceitam média); valores zero ou negativos ficam de fora das fatias e o aviso aparece na nota. Medida que é média (nota, taxa, %) não vira pizza: o app usa a contagem.
- **Mapeamento próprio** (categoria das fatias, painel, valor, soma ou contagem) no bloco de cada gráfico.
- **Mouse e cartão:** passar o mouse destaca a parte (as demais escurecem), clicar fixa o cartão e a lista da coluna 2; legenda e ranking na coluna 1 (clicar numa categoria isola ou oculta).
- **Apresentação, PNG, HTML exportado e vídeo:** passos com as maiores partes destacadas, quadro estático idêntico ao vivo.
- **Sugestão:** em histórias de composição com 3 a 6 categorias, a rosca (ou a pizza) passa a ser a primeira sugestão; nos demais casos ficam em "também disponíveis". A primeira sugestão das planilhas de teste não mudou.
- **Interface:** ícones novos no menu, nomes em português e inglês, motivo quando faltam dados, "como usar" e os chips da landing.

## Próximos lotes (propostos)
2) Comparação e tendência: múltiplas colunas, múltiplas linhas, linha radial, radar. 3) Distribuição e texto: box & whisker, nuvem de palavras. 4) Mapas: bolhas no mapa do Brasil (por UF) e isolinhas (precisam de latitude e longitude).

## Testes
`test/gal-run.js` (cada gráfico: desenho, mouse, cartão, fixar) e `test/gal-pres.js` (PNG, passos, apresentação), na aba Vendas da planilha ideal. Os demais testes seguem iguais; só as listas de gráficos disponíveis ganharam os novos.

---

# Gate 27 · Galeria (2): comparação e tendência

Quatro gráficos novos no mesmo motor (`src/gallery2.js` estende o `GalEngine`):
- **Várias colunas**: um painel de colunas por grupo (até 12), **todos na mesma escala**; o eixo é um período (agrupado no que couber em 12 colunas) ou uma categoria. Valor da maior coluna e da coluna sob o mouse à vista.
- **Várias linhas**: um painel de linha por grupo, mesma escala, área suave sob a linha, traço que aparece da esquerda para a direita e valor final em cada painel.
- **Linha radial**: o ciclo em volta do centro. Com data, os raios são os meses do ano e cada linha é um ano (os 6 mais recentes); com categoria (5 a 16), cada raio é uma categoria e as linhas são os grupos (até 6). A distância do centro é o valor.
- **Radar**: um polígono por grupo (2 a 6) em até 6 indicadores; cada eixo vai de zero ao maior valor entre os grupos (100% = o maior), com soma ou média conforme a natureza do indicador (taxas, notas e durações usam média). Mapeamento com até 6 colunas numéricas à escolha.

Iguais aos do gate 26: mapeamento no bloco do gráfico, mouse com cartão e lista, legenda que isola grupos, apresentação, PNG, HTML e vídeo, nomes e ícones em português e inglês. Os testes `gal-run.js` e `gal-pres.js` cobrem os quatro.

---

# Gate 28 · Galeria (3): distribuição e texto

- **Box & Whisker** (`src/gallery3.js`): uma caixa por categoria (até 12, com 5+ valores cada), ordenadas pela mediana. A caixa vai do 1º ao 3º quartil, a linha grossa é a mediana, o losango é a média, os bigodes vão até 1,5× a amplitude da caixa e os pontos são os valores de fora. Calculado sobre as **linhas** da planilha (não sobre totais). Para uma ou duas categorias com valores muito distantes não esmagarem as demais, o eixo para perto dos bigodes e o que ficou de fora vira um contador na borda (▲ ou ▶ com a quantidade). Vertical quando cabe; horizontal quando há muitas categorias, rótulos longos ou tela estreita. Cartão com n, mínimo, quartis, máximo, média, amplitude da caixa e pontos fora.
- **Nuvem de palavras**: as 60 palavras que mais se repetem em uma coluna de texto livre, com o tamanho pela quantidade de linhas em que cada uma aparece (4+ letras, sem conectivos e sem as que estão em mais de 60% das linhas; variações da mesma palavra contam à parte, dito na nota). Posicionamento em espiral sem sobreposição, cores da paleta, destaque ao passar o mouse. Só aparece como opção quando há uma coluna de texto livre com 10+ linhas preenchidas; usa as mesmas palavras ignoradas da análise de casos.

Passos de apresentação (as 3 maiores medianas e a caixa mais larga; as 3 palavras mais citadas), PNG, HTML, vídeo e mapeamento como nos demais. Testes: `gal-run.js` e `gal-pres.js` (`?sheet=Casos%20CX#words` para a nuvem).
