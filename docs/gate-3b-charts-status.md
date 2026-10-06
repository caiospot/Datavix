# Datavix · Gate 3b, gráficos (status em 2026-10-04)

Build: `node build.mjs` (index.html 2,3 MB; HTML exportado ~800 KB).

## Entregue (4 gráficos novos, 8 tipos para séries no tempo)
| Gráfico | Como funciona | Quando é sugerido |
|---|---|---|
| **Treemap** | Vizzu, sem eixos, retângulos proporcionais ao valor (categoria > série). Morph com barras. Rótulo com contraste automático. | Composição; alternativa em comparação com muitas categorias |
| **Corrida de barras** | Vizzu, um quadro por período (filtro). Reproduzir/pausar, deslizador de período, "Acumulado" (só soma e contagem), período grande em Doto. Rótulos formatados em PT/EN (`33 mil`, `1,5 mi`). | Disponível com 3+ séries e 4+ períodos |
| **Calendário (heatmap)** | SVG próprio, últimos 4 anos, uma célula por dia, células acendem por semana, tooltip com data, valor e nº de linhas, legenda "menos/mais". | Primeira opção em "Distribuição" com coluna de data |
| **Indicadores (KPI)** | Cartões com número em Doto que conta até o valor; cada cartão traz o cálculo (base e variação). Tempo: total, média por período, último (com variação), maior; por série: valor e participação. Categoria: total, maior, menor, nº. Relação: pontos, médias, correlação de Pearson. | Alternativa em todos os tipos |

Também em PNG (1920×1080, 3840×2160, ZIP por etapa) e no HTML exportado (troca entre os 8 tipos; corrida toca ao abrir).

## Verificado
- `r` de Pearson do cartão igual à fórmula independente (diferença 3e-14).
- Os 4 tipos exportam HTML (793 KB) e PNG; HTML da corrida aberto isolado: 0 recursos externos, console limpo, troca entre calendário, indicadores, treemap e corrida.
- Regressão: comparação (4 tipos), relação (3), distribuição/calendário (5), histograma (3), sem erro.
- Correções feitas no caminho: fonte do KPI ajustada pela largura medida (cartão e PNG); rótulos do treemap via `marker.label.filter`; rótulos da corrida pré-formatados; seletor "Distribuição de uma medida" não voltava ao histograma.

## Não verificado
- Animação da corrida e entrada do calendário quadro a quadro (painel de teste oculto pausa animações; verifiquei estados finais).
- Corrida no modo apresentação com tela cheia real.
- Calendário com mais de 4 anos (usa só os 4 últimos) e com dados de uma só semana (exige 14 dias).

## Falta
Editor: rótulos, legenda, grade e anotações editáveis; 3 pares tipográficos; tooltip estilizado; projetos recentes (IndexedDB). Fase 1b: sunburst, sankey, mapa de UFs, small multiples.
