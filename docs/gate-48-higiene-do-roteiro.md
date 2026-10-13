# Gate 48 — Higiene do roteiro (local, aguardando aprovação)

Primeiro portão de `docs/especificacao-modelos-e-abas.md`. Corrige o que fez a planilha da Fórmula 1 gerar 10 slides sem sentido, e vale para todas as planilhas.

## O que mudou
1. **Contagem de linhas só vira achado com registros de verdade** (`nvCountThin`, `src/data.js`): quando não há coluna numérica (a agregação é "contagem de linhas"), "X lidera", "os 3 maiores somam", "A vale 4× B" e "maior/menor valor" só existem se a tabela tem **30 ou mais linhas** e grupos de **3 ou mais linhas** (mediana). Antes, "Pole Positions lidera: 4, 17% do total" significava só que o rótulo aparecia em 4 linhas. O mesmo critério vale para os grupos do construtor de história (`storyGroups`) e para o painel de insights. Planilhas de registros (60 linhas de "Cidade; Tipo", pesquisas, protocolos) continuam com os achados de contagem.
2. **Roteiros "até N"**: o tempo escolhido (2, 5 ou 10) é o máximo. Passos sem achado **não viram slide**; o que faltou entra, numa linha cada, no slide de limites. A visão geral só entra se acrescenta algo além do contexto (um total que não seja a contagem de linhas, mediana e média). O slide de "Síntese e limitações" só existe se há o que dizer. O validador passou a aceitar de 1 a N slides.
3. **Sem achado nenhum, roteiro curto e honesto**: Contexto + "Síntese e limitações" com "Não há achados confiáveis com os dados atuais" e, quando não há números, "Esta planilha não tem números para comparar: li como uma lista de itens". Vale para o Panorama e para as histórias (`nvPlanStory`).
4. **Nenhum slide "Sem dados para esta análise"** nos planos (nem Panorama nem histórias).

## Resultado nas planilhas da Fórmula 1
Aba `Sheet1` da planilha nova e a primeira planilha: **2 slides** (Contexto e Síntese e limitações) em vez de 10, sem nenhum "teve o maior valor" ou "lidera" sobre contagem. É propositalmente curto: o conteúdo de verdade (face a face, abas) vem nos portões 49 a 52.

## Testes
- `test/m/hygiene-run.js` (novo): as duas planilhas da F1, planilha categórica de 60 linhas (continua com achados), lojas (10 slides sem slide "sem dados"), validador "até N".
- Testes antigos ajustados para "até N" (`battery-run`, `plan-run`, `stories-*`) e o teste de arcos agora falha se existir slide "sem dados".
- Regressão completa: `hygiene-run`, `stories-arc` (288 planos), `battery-run` (16 planilhas), `narrative-run`, `plan-run`, `stories-ui`, `stories-geo-funnel`, `stories-goal`, `stories-elig`, `auto-run` e `pptx-ui` passaram sem erros; o `index.html` abre por `file://` com a CSP estrita sem erros.
