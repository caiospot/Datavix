# Gate 34 (motor de história, etapa 3): pontuação, deduplicação, relações e seleção

Base: `docs/prompt-narrative-engine.md`. A apresentação padrão passa a escolher os slides pela nota (tempo "2 min" e "5 min"); o resto não muda.

## Pontuação (`nvScore`, narrative.js)
Quatro dimensões de 0 a 100, com os pesos centralizados em `NV_CFG.w` (hipótese de produto, não medida científica): relevância 0,30, magnitude 0,25, confiabilidade 0,30, clareza 0,15.
- **Relevância:** vem das 4 perguntas. Usa `storyPri` (ordem do achado para a decisão escolhida, mais o ajuste da área) e um pequeno ajuste por público (`NV_CFG.aud`: conselho e C-level pesam líder, concentração e tendência; time pesa contraste, diferenças e distribuição). Em casos e pesquisas, achado genérico de período vale menos que os atos de casos.
- **Magnitude:** medida própria de cada tipo (participação, variação, razão em escala log, correlação, pontos percentuais, diferença mediana/média, etc.), nunca comparando unidades diferentes como iguais.
- **Confiabilidade:** cresce com a amostra (`1 − e^(−n/K)`, K diferente para períodos/grupos e para linhas), menos 25 por aviso de leitura exploratória. Abaixo de 35, o achado vira "exploratório" e a nota total é limitada a 45: magnitude alta não compensa evidência fraca.
- **Clareza:** 25 pontos para cada um destes: métrica, comparação, assunto/período e número exibido definidos.
- Cada item guarda `score`, `confidenceLabel` (`high`/`medium`/`exploratory`), `caveats` (códigos dos avisos) e `scoreWhy` (como cada dimensão foi calculada). Achado inválido não pontua (o validador o descarta).

## Deduplicação e relações
- Identidade semântica: classe do fenômeno + assunto + direção (a direção só conta onde o sinal muda o sentido: variação, tendência, associação, distribuição, contribuição). Paráfrases do mesmo fenômeno (por exemplo líder e participação dominante do mesmo item) viram um achado só; o de maior nota fica e o outro vira evidência complementar dele (`ev.extra`) com relação `corrobora`.
- Métricas diferentes continuam distintas. Direções opostas (alta e queda) não se fundem.
- `nvRelations`: `complementa` (mesmo assunto, classes diferentes) e `segmenta` (contribuição ou mudança de participação sobre uma evolução). Vão em `story.report.relations`.
- A deduplicação só roda no roteiro padrão; o construtor continua mostrando todos os candidatos.

## Seleção (`nvSelect`, usada por `storyCut`)
Determinística: maior nota primeiro, com desconto de 15% por cada repetição da mesma classe de achado (nos atos de casos a classe é o tipo do ato: taxa, impacto, onde varia, causa), empate pelo índice. O panorama sempre entra. Sem nota (histórias montadas à mão), vale a prioridade antiga.

## Panorama com evidência
O total do panorama é recalculado pela soma dos períodos/categorias e conferido com o indicador (só quando o indicador é a soma total). Nos 28 casos de teste, 26 têm evidência; os outros 2 são médias ou contagens.

## Resultado nos dados de teste
- Cortes de 5 slides coerentes: líder, concentração, contraste e pico em planilhas de categoria; funil sem o caminho de 52 pontos; casos com taxa, dois impactos e a causa (antes: três impactos e a causa).
- O "maior salto" tinha amostra 2 por construção e sempre saía exploratório; passou a usar o número de períodos analisados.
- Comparação com o commit anterior: story-check, builder, export, facts e regress idênticos. 60+ casos no `test/m/narrative-run.js` (pesos, notas, relevância por decisão/área/público, fragilidade, deduplicação, relações, seleção, determinismo) e 28 conjuntos reais, PT e EN, sem erro.

## Pendentes
Planos próprios de 2, 5 e 10 slides, ressalvas visíveis e integração com a apresentação e o vídeo (gate 4); calibragem dos pesos com planilhas reais (gate 5).
