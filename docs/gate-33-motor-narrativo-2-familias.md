# Gate 33 (motor de história, etapa 2): famílias novas e evidência dos achados que faltavam

Base: `docs/prompt-narrative-engine.md`. Continua sem mudança no que a pessoa vê por padrão; os achados novos entram como candidatos para o roteiro.

## Famílias novas (linha a linha)
Calculadas uma vez na montagem dos dados (`nvRowStats` em `buildSeriesBase`, guardado em `built.rowStats`) e transformadas em achados por `nvRowInsights` (narrative.js). Exigem pelo menos 30 linhas com valor; sem isso não há achado (resultado normal).
- **Distribuição** (`dist_skew`): mediana contra média, só quando a diferença passa de 25% e a mediana é positiva. "Metade dos registros fica abaixo de X, mas a média é Y (N% acima): poucos valores altos puxam a média." Sem supor distribuição normal.
- **Valores atípicos nas linhas** (`outlier_rows`): quantos registros ficam fora da faixa usual (Q1 − 1,5×IQR a Q3 + 1,5×IQR), entre 1% e 25% das linhas. Descrito como "valor atípico que merece uma olhada", nunca como erro.
- **Associação** (`assoc`): correlação de postos de Spearman entre a medida principal e a coluna numérica (papel de medida) mais forte, quando |ρ| ≥ 0,5 e há 30+ linhas com os dois valores (amostragem determinística até 20 mil linhas, até 8 colunas candidatas). Texto diz "variam juntos", e o cálculo informa que não indica causa. Colunas com papel de identificador nunca entram.
- Cada uma traz evidência estruturada e passa pelo validador (denominadores, amostra mínima, faixa -1 a 1, contagem válida, sem linguagem causal ou de acusação).

## Evidência dos achados que faltavam
- Funil: `flow_conv`, `flow_drop`, `flow_path`; cordilheira: `ridge_cmp`.
- Casos e pesquisas: taxa (`c_rate`), impacto (`c_impact`), onde varia (`c_where`), causas e termos (`c_cause`, `c_terms`). Contagem pequena (< 30) vira aviso de leitura exploratória. A coluna chamada "Causa" não é tratada como afirmação de causa (`allow: ['causal']`, explícito no achado).
- Novos tipos de recálculo no validador: `ratio`, `dropc`, `gappp`, `dist`, `outrows`, `assoc`.
- Ainda sem evidência: só o panorama (`st-ov`), porque o total do indicador e a soma dos grupos do gráfico podem diferir por agrupamento ("outros"); fica para o gate 3, junto da pontuação.

## Onde aparecem
Em `allInsights(P)` (construtor de história/roteiro e lista de candidatos), com prioridades em `NV_PRI` (associação 2,4; distribuição 3,3; atípicos 3,6), abaixo do líder e acima do contraste. Não entram na lista de insights do editor nem na apresentação padrão: isso é o gate 4 (planos de 2, 5 e 10 slides).

## Testes
`test/m/narrative-run.js`: 40 casos unitários do validador e da estatística (postos com empate, Spearman monótona e constante, perfil de linhas, ID não vira associação, poucas linhas sem achado) e os achados reais de 9 planilhas + 5 abas da planilha ideal, em PT e EN: nenhum erro bloqueante. Comparação com o commit anterior: story-check, builder, export e regress idênticos; a lista de candidatos de fatos passou de 6 para 8 numa planilha (os novos achados).
