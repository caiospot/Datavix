# Gate 32 (motor de história, etapa 1): evidência estruturada e validador

Base: `docs/prompt-narrative-engine.md`. Sem mudança visível para quem usa; muda a garantia por baixo.

## O que entrou
- `src/narrative.js` (bundle compartilhado): `nvEv` (constrói a evidência), `nvCheckItem`, `nvValidate`, `nvGuard`, e `NV_CFG` com limites e listas de palavras centralizados.
- Evidência (`ev`) nos achados: `{ kind, method, sampleSize, values (entradas brutas), shown ([{k, value, text}]), refs }`.
  - `computeInsights` (data.js): pico, vale, maior alta, maior queda, tendência (alta/queda), dominante e outlier (IQR).
  - `buildStory` (story.js): líder, concentração, contraste, correlação, contribuição para a variação e mudança de participação. Os insights da peça entram no roteiro levando a mesma evidência.
- Validador: recalcula cada número só a partir de `values` e compara com o valor exibido; confere se o texto da afirmação contém o número recalculado; exige denominador válido (na contribuição vale o módulo, porque a variação total pode ser queda), amostra mínima por tipo, valores finitos; bloqueia linguagem causal (PT/EN) em tudo, menos em contribuição/participação calculadas; bloqueia "erro/fraude" em anomalia e correlação; avisa amostra pequena como exploratória, afirmação repetida e achado sem evidência. Frase editada pela pessoa não é revalidada.
- `nvGuard`: o que tem erro bloqueante sai do roteiro e dos insights, nunca é reescrito em silêncio (motivo no console e em `story.report`). Roteiro devolve `report` (`checked`, `unchecked`, `errors`, `warnings`).

## Resultado nos dados de teste
- 9 planilhas × PT/EN: nenhum erro bloqueante; 0 insight base sem evidência; roteiro determinístico.
- O validador pegou um erro na primeira rodada: contribuição em período de queda (denominador negativo). Era regra do validador, corrigida; o cálculo do produto estava certo.
- Comparação com o commit anterior: story-check, builder-check/extra/run, export-sb, facts-run e regress idênticos.

## Pendentes (gates seguintes)
- Sem evidência estruturada: achados de gráficos específicos (`flow_*`, `ridge_cmp` etc.), os atos de casos (`cases`) e o panorama; aparecem como "sem evidência" (aviso, não erro).
- Para o outlier, o recálculo usa Q1/Q3 guardados (não recalcula os quartis a partir de todos os valores).
- Famílias novas (distribuição, associação ampliada), pontuação com a relevância das 4 perguntas, deduplicação e planos de 2/5/10: gates 2 a 4.

Teste: `test/m/narrative-run.js` (21 casos unitários do validador + achados reais).
