# Gate 8: Rio vertical (Fase B, gráfico 2 de 5)

Mesma casca do Gate 7 (`src/charts.js`). Arquivos: `src/river.js` (dados, motor `RiverEngine`, interface), textos em `src/i18n-charts.js`.

## O gráfico
- O tempo desce pela página; cada categoria é uma faixa e a largura é o valor no período. Faixas simétricas ao redor do centro, **maiores por fora** (alternando esquerda e direita), com opção "do maior ao menor" ou por nome. Curvas suaves entre os períodos.
- Uma linha pontilhada por período (período à esquerda, total à direita). Semicírculos no alto com o total de cada categoria no intervalo (área proporcional); clicar num semicírculo liga/desliga a categoria (as desligadas ficam em contorno).
- Hover numa faixa isola a categoria ao longo do tempo e marca o valor naquele período (ponto + número). Hover no rótulo do período abre o cartão do período (total, variação contra o anterior, as 6 maiores categorias). Clique fixa.
- Cartão da categoria: período sob o mouse (valor, parcela do período, contra o período anterior), participação, posição, pico, variação do primeiro ao último período, linhas. Visão geral: total, período mais alto/baixo, maior categoria.
- Painel: intervalo de períodos (duplo), categorias (filtro), ordem das faixas, escala (valores ou participação 100%), total por categoria. Lista com todas as categorias.
- Cálculo: soma ou contagem (média não faz sentido empilhada). Até 12 categorias (as menores viram "Outros") e 48 períodos; granularidade automática (ano, trimestre, mês, semana, dia). Valores negativos não aparecem (nota avisa).
- Insights: os cálculos de tempo (pico, salto, queda, tendência, dominante) sobre os totais por período e por categoria, com "ver cálculo".
- Apresentação: uma categoria por vez (até 6), depois primeira e segunda metade do período. Tutorial de 4 etapas (`dv-river-tutorial`), PNG com estado, HTML offline, PT/EN, movimento reduzido.
- Sugestão: período (data) + poucas categorias + valor. Lidera (0,92) quando a coluna de categoria é a mesma que a árvore radial usaria como entidade; caso contrário (0,55) a árvore radial segue na frente. Fora das histórias tempo/composição cai para 0,7.

## Verificado (Chrome headless)
- `dados-teste/canais.csv` (474 linhas, 7 canais, 2019–2024, inventado): sugestão = Rio vertical; 24 trimestres.
- Hover (cartão com período), fixar, semicírculo filtra (7 → 1), intervalo, participação 100%, claro e escuro; apresentação completa; PNG com estado (3 categorias, intervalo 4–20, ordem por valor, 100%); HTML exportado de `file://` sem recursos externos; mapeamento (muda para contagem e refaz); salvar e reabrir; tutorial 4 etapas.
- Regressão: 5 histórias × todos os gráficos sem erro; 5 arquivos de teste geram peça sem erro; `projetos.csv` continua com a árvore radial na frente.

## Limites
- Hover em faixa muito fina (menos de ~2 px) é difícil; use a lista ou os semicírculos.
- Rótulo da faixa só aparece onde ela é larga o bastante.
- Período como categoria (não data) aceito no mapeamento, mas a sugestão automática só usa datas.
