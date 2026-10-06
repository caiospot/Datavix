# Gate 11: Fluxo em funil (Fase B, gráfico 5 de 5)

Casca de `src/charts.js`. Arquivos: `src/flow.js` (dados, motor `FlowEngine`, interface), textos em `src/i18n-charts.js`.

## O gráfico
- Sankey vertical, layout próprio (sem biblioteca). De 2 a 5 colunas de categoria em sequência viram camadas de cima para baixo; cada categoria é um nó (barra com o rótulo dentro quando cabe), cada passagem entre etapas é uma fita curva com degradê da cor do nó de origem à do destino; largura proporcional ao valor (mesma escala em todas as camadas, camadas centralizadas: o funil afunila). O que não segue para a etapa seguinte (célula vazia na etapa seguinte) sai do funil e aparece como uma saída que afunila e some sob o nó.
- Coluna da esquerda: nome da etapa, número grande em Doto (conta de 0 ao valor na abertura) e a queda em relação à etapa anterior (↓ −68%, ou → 100%). Opção de mostrar % da primeira etapa.
- Hover num nó, fita ou caminho destaca tudo que vem antes e depois e apaga o resto. O cartão do nó: parcela da etapa e da primeira etapa, de onde vem, para onde vai, quanto segue e quanto sai. Cartão da fita: origem, destino, % do total da origem e do destino.
- Clique num nó filtra só os itens que passam por ele (vários nós se combinam: mesma etapa = OU, etapas diferentes = E); números, fitas, conversão e lista se recalculam e animam. Clique no vazio limpa; chips no painel removem.
- Painel: caminho selecionado, conversão por etapa, ordem dos nós (menos cruzamentos por baricentro — padrão —, maiores primeiro, nome), números (valores ou %), principais caminhos (passar o mouse destaca o caminho no funil). Lista: todos os nós e fitas.
- Dados: cada linha é um caminho (para na primeira célula vazia). Valor = soma de uma coluna numérica ou contagem de linhas. Até 10 categorias por etapa (as menores viram "Outros"); se houver mais de 6000 caminhos distintos, as categorias menores são agrupadas até caber. Planilha de origem→destino (como `fluxo.csv`) funciona como 2 etapas.
- Insights: conversão da primeira à última etapa, maior queda entre etapas e caminho completo mais comum, todos com "ver cálculo".
- Apresentação: etapa por etapa (queda em cada uma) e os 3 principais caminhos. Tutorial de 4 etapas (`dv-flow-tutorial`), PNG com estado (filtro, ordem, modo), HTML offline, PT/EN, movimento reduzido.
- Sugestão: colunas de categoria em sequência (as primeiras 5 de 2 a 30 valores, na ordem da planilha). Lidera (0,95) com 3+ etapas cujos nomes lembram funil (etapa, status, canal, resultado, proposta, origem, destino…) em ao menos 2; (0,92) para origem/destino de 2 colunas; senão 0,4.

## Verificado (Chrome headless)
- `dados-teste/funil.csv` (1800 leads, 4 etapas, inventado): sugestão = Fluxo em funil; totais por etapa 14,3 mi → 14,3 mi → 4,5 mi → 2,2 mi, quedas 68% e 50% conferem com o insight; filtro por nó (6,9 mi só de "Descartado"); hover em nó e em fita; modo %; PNG com filtro; HTML de `file://` sem recurso externo; mapeamento (contagem refaz); salvar e reabrir; tutorial; apresentação (14 passos).
- Regressão: 5 histórias × todos os gráficos; 10 arquivos de teste geram peça sem erro. `fluxo.csv` e `financeiro.xlsx` (origem→destino) agora abrem com o Fluxo em funil na frente.

## Limites
- Rótulo do nó só aparece dentro da barra quando cabe (senão, no hover e na lista).
- Cada linha segue em ordem de colunas: uma célula vazia no meio encerra o caminho (nada depois conta).
- Com muitas categorias por etapa o funil agrupa as menores em "Outros".
