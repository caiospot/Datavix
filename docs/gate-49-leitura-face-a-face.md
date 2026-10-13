# Gate 49 — Leitura do face a face (local, aguardando aprovação)

Segundo portão de `docs/especificacao-modelos-e-abas.md`. Faz o Datavix **ler** as planilhas de comparação (as duas da Fórmula 1) sem inventar nem perder número. Ainda não há modelo "Face a face": isso é o portão 50.

## O que mudou
1. **Valores mistos** (`parseUnitCell`, `src/parser.worker.js`): "161 largadas", "40,3% das corridas", "32 anos", "4º colocado (50 pontos)" viram **Valor** (161, 40,3, 32, 4), **Unidade** (largadas, %, anos, º) e **Texto** com a célula original. Textos longos ("Tricampeão…") e "Sem classificação (0 pontos)" continuam texto, nunca zero.
2. **Desdobramento automático** (`versusDetect`/`versusApply`, passo "face a face" em `restructure()`):
   - *Entidades em colunas* (aba `Sheet1`: uma coluna por piloto) → linhas por **Entidade** (forma `metric-long`, 46 linhas).
   - *Colunas repetidas com sufixo* (aba `Resultados por GP`: "Grid Senna", "Grid Schumacher") → linhas por Entidade (forma `entity-long`, 192 linhas). Colunas derivadas ("Diferença de pontos") ficam de fora e são avisadas.
   - Entra na tela de leitura em "O que arrumei na estrutura", com desfazer/refazer (`fixOpts.versus`).
3. **Ausência não é zero** (`src/versus.js`, `NV_VS_ABSENT`): "ainda não havia estreado", "não participou", "n/d" ficam marcados como ausentes (`absent`), nunca somados nem tratados como 0.
4. **Descritor `nvVersus(ds)`**: entidades, colunas de valor/unidade/texto, período, exposição (GP disputados), direção da métrica (neutra por padrão; "menor é melhor" só como sugestão, ex.: abandonos) e reconhecimento do formato longo sem reorganização (aba `Comparativo`, 12 linhas).
5. **Sem soma de métricas diferentes**: a coluna `Valor` do `metric-long` recebe o papel novo **`mixed`** ("Métricas diferentes"): fica fora de `colUsable`/`isMeasure`, portanto o motor genérico nunca soma posição com pontos. Aparece na leitura em grupo próprio, com nota; a pessoa pode mudar para "Número" se quiser.
6. Texto da leitura em PT/EN: "desdobrei as colunas das N entidades".

## Garantias
- Todo número vem da célula; o texto original é guardado.
- Nenhum falso positivo nas planilhas de teste (lojas, pedidos, financeiro, bateria, projetos, canais, funil, metas, antes-depois).

## Testes
`test/m/versus-run.js` (novo): critérios de aceite da F1 (valores, unidades, ausentes, pontos por temporada batendo com a aba resumo — 1993 Senna 73, Schumacher 52), não-detecção em 14 outras planilhas, leitura, desfazer/refazer, papel `mixed`. Regressão completa listada em `/tmp/regr2.sh` (hygiene, arcos, bateria, narrativa, plano, histórias, auto, camadas, PPTX).
