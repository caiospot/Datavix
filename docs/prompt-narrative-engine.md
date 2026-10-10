# Prompt: Narrative Engine do DataVix (versão adaptada ao projeto)

```
Quero evoluir o motor de história do DataVix para gerar roteiros de 2, 5 ou 10 slides sustentados pelos dados da planilha. Trabalhe neste repositório. Antes de alterar qualquer arquivo, leia `src/story.js`, `src/understand.js`, `src/areas.js`, `src/cases.js`, `src/runtime.js` (apresentação), `src/video.js`, `src/builder.js` e `build.mjs`, e os docs `docs/gate-*.md` mais recentes. Resuma em poucas linhas o que já existe e o que falta, e só então proponha o plano. Estenda o que existe; não crie um segundo motor ao lado.

## Como o projeto é (restrições fixas)
- JavaScript puro, sem TypeScript, sem npm e sem dependências novas. Tudo é montado em um único HTML por `node build.mjs`; só Vizzu, PapaParse e SheetJS são embutidos. Funciona também em `file://` com CSP restrita.
- Tudo roda no navegador. Nenhum dado da planilha (linhas, nomes de colunas, valores, estatísticas, insights) sai do navegador, e nenhuma IA externa é usada. Não crie telemetria com conteúdo da planilha.
- Regras do produto: todo número vem da planilha; todo insight vem de cálculo verificável e mostra "ver cálculo"; textos em PT e EN; formatação de números e datas pelos helpers existentes.
- Não há framework de testes. Os testes são scripts de página em `test/` rodados no Chrome headless por `node test/cdp.mjs <url> <segundos> <script.js>`, com o servidor `node test/server.mjs` (porta 8768). Siga esse padrão: scripts que devolvem JSON com "ok"/"FALHOU" e erros de console. Fixtures são sintéticas e ficam em `dados-teste/` ou dentro do próprio teste.
- Não publique nada (nada de push). Eu aprovo cada etapa e a publicação.

## O que já existe e deve ser reaproveitado
- Leitura da planilha, papéis e formato: `understand.js`, `areas.js`, parser com `restructure`.
- Achados e história: `buildStory`, `casesFacts`, `storyFromAnswers`, `storyPri` (prioridade por área, público e decisão), `storyCut`.
- Perguntas do onboarding: área, público, decisão e tempo (`S.br`). Elas são o sinal de relevância; use-as na pontuação. O tempo escolhido (2, 5 ou 10 min) define 2, 5 ou 10 slides; não crie outro seletor.
- Formato de slide consumido pela apresentação, pelo vídeo e pelo HTML exportado: rótulo (`kick`), frase (`head`), número em destaque (`big`), cálculo (`calc`), estado do gráfico (`state`/`viz`), `type`. Os planos novos devem sair nesse formato.
- Título por slide escrito pela pessoa (`sb.titles`) e título do tema (`P.title`): preserve.

## Objetivo
Gerar um roteiro que só afirme o que os dados sustentam, escolha o que importa para quem vai ouvir e adapte a profundidade a 2, 5 ou 10 slides. Se os dados forem insuficientes, gere um roteiro descritivo e informe as limitações. Nunca fabrique um achado para preencher um slide.

Diferencie, em dados e na linguagem:
- Fato: afirmação diretamente calculada. É o que vira número em destaque.
- Interpretação: leitura possível do fato, em linguagem cautelosa e rotulada.
- Pergunta de investigação: o que vale checar a seguir. O sistema não conhece o negócio, então NÃO gere hipóteses de causa. Associação diz "varia junto", nunca "causou" ou "explica". Anomalia é "valor/período atípico", nunca erro, fraude ou problema.

## O que construir (módulos puros, testáveis, em arquivos novos só quando necessário)
1. Evidência estruturada: cada achado guarda método, tamanho da amostra, valores brutos, cálculo e referências a colunas/linhas/períodos, de modo que o número exibido possa ser recalculado. O texto é renderizado dos valores, não escrito à mão.
2. Detector: famílias que já existem (líder/comparação, concentração, contraste, pico, virada, evolução, casos) passam a emitir evidência estruturada. Famílias novas: anomalia (IQR ou desvio robusto, conforme amostra), distribuição (mediana, quantis, dispersão, sem supor normalidade), associação (medida adequada ao tipo de variável, com tamanho de amostra), contribuição para a variação entre períodos (valor por período, diferença e contribuição calculada de cada segmento; nunca inferida só de percentuais). Cada família tem requisitos mínimos explícitos; sem eles, não há achado (resultado normal, não erro).
3. Pontuação 0 a 100 por dimensão, centralizada em um só objeto de pesos para calibragem: relevância (use área, público e decisão), magnitude (medida própria por tipo, nunca comparar correlação com variação percentual como se fossem iguais), confiabilidade (amostra, ausências, método, estabilidade) e clareza. Pesos iniciais 0,30 / 0,25 / 0,30 / 0,15, apresentados como hipótese de produto. Condições de validade vêm antes da nota: achado inválido é descartado com motivo; achado frágil fica "exploratório" com aviso; magnitude alta não compensa evidência fraca.
4. Deduplicação por identidade semântica (tipo, métrica, dimensões, período, comparação, direção). Paráfrases viram um só achado com evidências compartilhadas. Métricas diferentes continuam distintas (receita e ticket médio), com relação "corrobora", "complementa" ou "segmenta". Seleção determinística, equilibrando prioridade e variedade (sem vários rankings quase iguais).
5. Montagem da história: contexto e limites dos dados, descoberta principal, evidência, exploração (perspectiva diferente) e implicação cautelosa ou pergunta de investigação. Pode escolher uma história temática coerente em vez de só ordenar por nota.
6. Planos de slides distintos para 2, 5 e 10 (não gere 10 e corte):
   - 2 slides: "O que está acontecendo?" (contexto mínimo, descoberta principal, indicador e visual) e "O que isso sugere?" (evidência complementar mais forte, pergunta de investigação, limitações).
   - 5 slides: contexto, descoberta principal, evidência, exploração, implicação com ressalvas.
   - 10 slides: contexto e pergunta; visão geral e qualidade dos dados; descoberta principal; evidência principal detalhada; evolução ou comparação de períodos; comparação entre grupos; concentração, composição ou contribuição; distribuição ou anomalias; síntese e limitações; implicações cautelosas e perguntas em aberto.
   Se uma seção não for suportada pelos dados, troque por contexto/limitações ou por uma visualização útil já calculada, ou diga explicitamente que os dados não permitem. Cada slide tem papel narrativo, mensagem principal, achados referenciados, gráfico sugerido (use os existentes) e ressalvas.
7. Validador antes de devolver o roteiro: todo achado citado existe e é válido; todo número é reproduzível da evidência; denominadores válidos e arredondamentos coerentes; datas, unidades e comparações definidas; nenhuma associação escrita como causa; nenhuma anomalia como erro; contribuição realmente calculada; nenhum slide repete a mesma afirmação sem evidência nova; número exato de slides (2, 5 ou 10); limitações junto da afirmação. Devolve erros bloqueantes e avisos explicáveis. Não corrija em silêncio: reconstrua a frase dos valores validados ou remova-a.

## Integração
- A saída substitui a seleção atual no mesmo ponto (`buildStory`/`storyFromAnswers`), sem mudar a apresentação, o vídeo, o HTML exportado nem o "ver cálculo". O "ver cálculo" passa a ser renderizado a partir da evidência estruturada.
- O caminho curto atual (4 perguntas, upload, "Aguarde, estou entendendo a sua planilha", editor) não muda. O roteiro novo é o que a apresentação usa por padrão; o painel de edição continua como hoje.
- Textos PT e EN em `src/i18n*.js`. Cálculos pesados fora do caminho de desenho; se algum travar a interface com planilhas grandes, meça antes de mover para Worker.

## Testes (scripts em `test/`, no padrão atual)
Cubra: planilha temporal com métricas e categorias; categórica sem data; números que são identificadores e não métricas; ausentes, duplicados, inválidos e denominador zero; amostra pequena e dados insuficientes; tendência com período incompleto e lacunas; concentração e contribuição para variação; anomalia sem linguagem causal; associação sem causalidade; deduplicação sem apagar métricas complementares; pontuação e bloqueio por baixa confiabilidade; resultado idêntico para a mesma entrada; roteiros com exatamente 2, 5 e 10 slides, inclusive sem achados suficientes; validador rejeitando cálculo inconsistente e afirmação sem evidência. Rode também a regressão existente (`test/regress.js`, `test/types-all.js`, `test/m/story-check.js`, `test/m/builder-check.js`, `test/m/export-sb.js`) e compare com a base: a primeira sugestão de gráfico das planilhas de teste não deve mudar sem motivo.

## Como entregar
Trabalhe em gates pequenos e pare ao fim de cada um para eu aprovar, com um documento curto em `docs/` e um commit local por gate:
1. Estrutura de evidência e validador sobre os achados que já existem.
2. Famílias novas: anomalia, distribuição, contribuição para variação e associação.
3. Pontuação com relevância vinda das 4 perguntas, deduplicação e relações entre achados.
4. Planos de 2, 5 e 10 slides, ligados à pergunta de tempo, e integração com a apresentação e o vídeo.
5. Bateria de planilhas variadas para calibrar pesos e limites.
Texto e temas: a contagem de termos local de `cases.js` continua como está; não envie texto a nenhum modelo externo.

Ao final de cada gate, reporte: o que foi feito e onde, testes rodados e resultados (incluindo falhas), limitações e o que depende de calibragem com dados reais.
```
