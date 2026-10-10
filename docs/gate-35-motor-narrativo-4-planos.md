# Gate 35 (motor de história, etapa 4): planos de 2, 5 e 10 slides

Base: `docs/prompt-narrative-engine.md`. Arquivo novo: `src/storyplan.js` (bundle compartilhado, depois de `story.js`).

## O que muda para quem usa
A pergunta "tempo" do onboarding passa a definir o tamanho exato da apresentação padrão: **2 min = 2 slides, 5 min = 5 slides, 10 min ou mais = 10 slides** (`nvSlideCount`). Antes eram 3, 5 e "todos" (7 a 9). Roteiros montados pela pessoa (`P.sb`) não mudam. O vídeo usa o plano de 5 sem o slide de contexto (o gancho já faz esse papel): 4 passos de história.

## Como cada plano é montado (`nvPlan`)
Parte do conjunto de achados válidos, pontuados e sem repetição (`nvpPool`), do melhor para o pior. A **descoberta principal** é a de maior nota, com bônus pequeno por coerência (relações com outros achados) e sem partir de achado exploratório quando há alternativa.
- **2 slides ("Executive Snapshot")**: "O que está acontecendo?" (descoberta principal, com o contexto mínimo em nota) e "O que isso sugere?" (a evidência complementar mais forte, com a pergunta de investigação e o limite em nota).
- **5 slides ("Diagnóstico")**: Contexto, Descoberta principal, Evidência (a relacionada à principal; senão, de outra classe), Exploração (classe e assunto diferentes), Implicações e próximos passos.
- **10 slides ("Análise aprofundada")**: Contexto; Visão geral e qualidade dos dados; Descoberta principal; Evidência em detalhe; Evolução no tempo; Comparação entre grupos; Concentração e composição; Distribuição e atípicos; Síntese e limitações; Implicações e próximos passos. Cada seção busca o achado pelo tipo de cálculo (pico e vale contam como evolução em eixo de tempo e como comparação em categorias). Seção sem achado: se sobrou outro achado, entra como "Evidência complementar"; se o motivo for definitivo (sem coluna de data, menos de 3 grupos, menos de 6 para concentração, menos de 30 linhas com valor), o motivo vai escrito no slide de síntese e limitações; só quando não resta nada aparece um slide "Sem dados para esta análise", com o motivo verdadeiro.
- Slides sem achado próprio (contexto, qualidade, síntese, implicação) usam só números calculados (linhas lidas, período, grupos, linhas sem valor, mediana e média) e perguntas cautelosas por tipo de achado ("O que diferencia X dos demais?", "O que mudou entre A e B?", "O que aconteceu em dez/24?"). Nunca afirmam causa. Os percentuais do contexto têm evidência (`usage`, `missing`) e são recalculados pelo validador.
- Sem nenhum achado válido, o plano é descritivo (contexto, visão geral, limites e mensagens de dados insuficientes), no tamanho exato.

## Ressalvas visíveis
Achado exploratório recebe nota no slide ("1 achado é exploratório (amostra pequena ou evidência frágil)"), exibida na apresentação (`.ps-note`) e na legenda do vídeo. O slide de implicação lista quantos achados do roteiro são exploratórios.

## Validador do plano (`nvValidatePlan`)
Erros bloqueantes: número de slides diferente do pedido, slide sem papel ou título, texto vazio, achado fora do conjunto validado, linguagem de causa ou de acusação (inclui os textos escritos pelo plano), exploratório sem ressalva, afirmação repetida, o mesmo achado em dois slides, número do slide que não bate com a evidência. Dispensa explícita de "causa" só quando o nome da coluna é "Causa" (`allow`).

## Testes
`test/m/plan-run.js`: 14 casos unitários do validador do plano; 14 conjuntos reais (9 planilhas + 5 abas da ideal) × PT/EN × 2/5/10 slides: tamanho exato, plano válido, determinístico, sem id repetido, ressalva presente; planilha minúscula e planilha sem coluna numérica (2/5/10 slides válidos); apresentação com 2, 5 e 10 segmentos conforme o tempo; ressalva visível no slide 2; vídeo com 4 passos do plano. Também conferidos: HTML exportado em `file://` (10 slides), gravação real de vídeo vertical, `pres-flow`, `gal-pres`, `pres.js`. `test/m/pres-count.js` passou a medir o terceiro slide (o segundo agora é só texto).

## Limites conhecidos
- Em planilhas pobres o plano de 10 slides repete achados em "Evidência complementar" ou termina com mensagens de dados insuficientes; é o custo de exigir o número exato.
- Os textos de pergunta e de limites são fixos por tipo de achado (PT e EN); não há texto livre.
- Calibragem de pesos e limites com planilhas reais: gate 5.

## Endereço do site (datavix.app)
`DV_SITE` (piece.js, bundle compartilhado) vale `datavix.app`, ou o valor de `DATAVIX_SITE` no build. Aparece: no rodapé da página inicial; no fim da apresentação (slide final); no canto inferior direito das imagens PNG; no rodapé do HTML exportado (assinatura "DATAVIX · datavix.app", com link); e na cena final dos vídeos (substitui `caiospot.github.io/Datavix`). O README aponta para o endereço. Se a variável `DATAVIX_SITE` existir no GitHub (Settings → Variables), ela sobrescreve o padrão; hoje ela não está definida.
