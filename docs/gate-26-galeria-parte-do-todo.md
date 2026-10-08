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
